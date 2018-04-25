import {Body, Controller, Get, HttpStatus, Post, Query, Req, Res} from '@nestjs/common';
import {ApiUseTags} from '@nestjs/swagger';
import {EnvConfig} from '../../../config/env';
import {Validator} from '../../../services/helpers/validation.helper';
import {PostVerifyCodeDTO} from '../../shared/models/dto/post.verify.dto';
import {REDIS_USER_PUSH_RESULT_POSTFIX, REJECT, RESEND_CODE, SEND_CODE, VALID} from '../../../config/constants';
import {TfaTransactionFamily} from '../../shared/families/tfa.transaction.family';
import {KaztelTransactionFamily} from '../../shared/families/kaztel.transaction.family';
import {TimeHelper} from '../../../services/helpers/time.helper';
import {Services} from '../../../services/code_sender/services';
import {ChainService} from '../../../services/sawtooth/chain.service';
import {getLatestIndex} from '../../../services/helpers/helpers';
import {CodeQueueListenerService} from '../../../services/code_sender/queue.service';
import {PostCodeDTO} from '../../shared/models/dto/post.code.dto';
import {UserLog} from '../../shared/models/user.log';
import {TelegramServer} from '../../../services/telegram/telegram.server';
import * as redis from 'redis';
import {EgovTransactionFamily} from '../../shared/families/egov.transaction.family';
import * as Promisefy from 'bluebird';
import {ApiController} from './controller';

const Telegraf = require('telegraf');
const fs = require('fs');
const protobufLib = require('protocol-buffers');
const messagesServiceClient = protobufLib(fs.readFileSync('src/proto/service_client.proto'));

@ApiUseTags('v1/api/web')
@Controller('v1/api/web')
export class WebController extends ApiController{
    private telegrafApp: any;

    constructor(public tfaTF: TfaTransactionFamily,
                public kaztelTF: KaztelTransactionFamily,
                public egovTF: EgovTransactionFamily,
                public chainService: ChainService,
                private timeHelper: TimeHelper,
                private telegramServer: TelegramServer,
                private codeQueueListenerService: CodeQueueListenerService) {
        super(tfaTF, kaztelTF, egovTF);
        this.telegrafApp = new Telegraf(EnvConfig.TELEGRAM_BOT_KEY);
        Promisefy.promisifyAll(redis);
    }

    /**
     * Send code to user
     *
     * @param res
     * @param {PostCodeDTO} body
     * @returns {Promise<void>}
     */
    @Post('code')
    async postCode(@Res() res, @Body() body: PostCodeDTO) {
        let v = new Validator(body, {
            event: 'required|string',
            lang: 'nullable|string',
            method: 'required|string|in:sms,push,telegram,whatsapp',
            service: 'requiredIfNot:push_token|string|in:kaztel,egov',
            phone_number: 'required|string|regex:/^\\+?[1-9]\\d{1,14}$/',
            embeded: 'boolean',
            client_timestamp: 'required',
            cert: 'nullable',
            resend: 'nullable|boolean',
        }, {'service.in': `No service with name: ${body.service}`});
        if (v.fails()) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
        }
        // Проверка, существует ли пользователь
        let user = await this.getUser(body.phone_number, body.service);
        if (user === null) {
            return res.status(HttpStatus.NOT_FOUND).json({user: [this.getUserNotFoundMessage(body.lang || 'en')]});
        }

        let telegramUser;
        if (body.method === 'telegram') {
            let number = user.PhoneNumber;
            if (number.charAt(0) === '+') {
                number = number.substring(1);
            }
            telegramUser = await this.telegramServer.userExists(new RegExp('^8|7' + number.substring(1) + '$', 'i'));
            if (!telegramUser) {
                return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({user: [this.getMessage(body.lang, 'telegram_bot_unregistered')]});
            }
            // check if user delete the bot
            // Пользователь может удалить чат в телеграмме - единственный способ узнать,
            // удалили пользоваель чат или нет - отправить ему сообщение, если сообщение
            // отправилось без ошибки - значит чат сущесвует поэтому так мы проверяем
            // удалил пользователь чат или нет
            try {
                await this.telegrafApp.telegram.sendMessage(telegramUser.chatId, 'Здравствуйте');
            } catch (e) {
                if (e.response && e.response.error_code === 403) {
                    return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({status: 'telegram_bot_unregistered'});
                }
            }
        }
        let pushToken = '';
        if (body.method === 'push' && !user.IsVerified) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({user: [this.getMessage(body.lang, 'not_verified')]});
        } else {
            let tfaUser = await this.getUser(user.PhoneNumber, 'tfa');
            if (!tfaUser) {
                return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({user: [this.getMessage(body.lang, 'not_verified')]});
            }
            pushToken = tfaUser.PushToken;
        }
        // начинаем слушать изменения адресов
        let addresses = [this.chainService.getAddress(user.PhoneNumber, body.service)];
        let ws = this.openWsConnection(addresses);
        try {
            let log = new UserLog();
            log.ActionTime = (new Date()).getTime() / 1000;
            log.ExpiredAt = this.timeHelper.getUnixTimeAfterMinutes(7);
            log.Event = body.event;
            log.Method = body.method;
            log.Status = body.resend ? 'RESEND_CODE' : 'SEND_CODE';
            log.Embeded = body.embeded;
            log.Cert = body.cert;
            await this.chainService.generateCode(user.PhoneNumber, log, body.service);
        } catch (e) {
            console.error(`Error while getting user`, e);
            return res.status(HttpStatus.BAD_GATEWAY).json({error: 'Error sending code.'});
        }

        let responseSend = false;
        ws.onmessage = mess => {
            const data = JSON.parse(mess.data);
            for (let stateChange of data.state_changes) {
                if (responseSend) {
                    ws.send(JSON.stringify({'action': 'unsubscribe'}));
                    break;
                }
                if (addresses.indexOf(stateChange.address) !== -1) {
                    let userDecoded;
                    try {
                        userDecoded = messagesServiceClient.User.decode(new Buffer(stateChange.value, 'base64'));
                    } catch (e) {
                        console.log('VerificationController@postCode: Cant decode user', e);
                        responseSend = true;
                        ws.send(JSON.stringify({'action': 'unsubscribe'}));
                        return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({user: [this.getMessage(body.lang, 'error_decode_user_bc')]});
                    }
                    if (userDecoded.Logs.length > user.Logs.length) {
                        const log: UserLog = userDecoded.Logs[getLatestIndex(Object.keys(userDecoded.Logs))];
                        if (log.Status !== SEND_CODE && log.Status !== RESEND_CODE) {
                            responseSend = true;
                            ws.send(JSON.stringify({
                                'action': 'unsubscribe'
                            }));
                            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
                                user: ['Code was not send - latest log is not with the code to send.']
                            });
                        }
                        switch (log.Method) {
                            case 'push':
                                this.codeQueueListenerService.queuePUSH.add({
                                    title: 'Двухфакторная авторизация',
                                    message: `Подтвердите вход на сервис: '${Services[body.service]}'`,
                                    service: body.service,
                                    push_token: pushToken
                                });
                                break;
                            case 'sms':
                                this.codeQueueListenerService.queueSMS.add({
                                    phone_number: user.PhoneNumber,
                                    service: body.service,
                                    code: log.Code,
                                });
                                break;
                            case 'telegram':
                                this.codeQueueListenerService.queueTelegram.add({
                                    chat_id: telegramUser.chatId,
                                    message: 'Ваш код подтверждения для сервиса "' + Services[body.service] + '": ' + log.Code,
                                });
                                break;
                            case 'whatsapp':
                                // todo
                                break;
                            default:
                                console.error(`ChainController@deliverCode: method ${log.Method} is not supported.`);
                                break;
                        }
                        ws.send(JSON.stringify({'action': 'unsubscribe'}));
                        responseSend = true;
                        return res.status(HttpStatus.OK).json({
                            resend_cooldown: 7 * 60,  // Количество секунд за которые надо ввести код и за которые нельзя отправить код повторно
                            method: body.method,      // Метод отправки (in:push,sms,telegram,whatsapp)
                            status: 'success',
                        });
                    }
                }
            }
        };
        ws.onclose = () => {
            ws.send(JSON.stringify({
                'action': 'unsubscribe'
            }));
        };
    }

    /**
     * Verify user's code
     *
     * @param res
     * @param {PostVerifyCodeDTO} body
     * @returns {Promise<void>}
     */
    @Post('verify/code')
    async postVerify(@Res() res, @Body() body: PostVerifyCodeDTO) {
        let v = new Validator(body, {
            event: 'required|string',
            lang: 'string',
            code: 'required|number',
            service: 'requiredIfNot:push_token|string|in:kaztel,egov',
            phone_number: 'required|string|regex:/^\\+?[1-9]\\d{1,14}$/',
            embeded: 'boolean',
            // используется только при отправке мобильным приложением - для установке статуса REJECT
            status: 'string',
            method: 'string',
            client_timestamp: 'required',
            cert: 'nullable',
        }, {'service.in': `No service with name: ${body.service}`});
        if (v.fails()) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
        }
        // Проверка, существует ли пользователь
        let user = await this.getUser(body.phone_number, body.service);
        if (user === null) {
            return res.status(HttpStatus.NOT_FOUND).json({user: [this.getUserNotFoundMessage(body.lang || 'en')]});
        }
        // начинаем слушать изменения адресов
        let addresses = [
            this.chainService.getAddress(user.PhoneNumber, body.service),
        ];
        let ws = this.openWsConnection(addresses);
        try {
            let rejectStatus = null;
            if (body.status && body.status === REJECT) {
                rejectStatus = REJECT;
            }
            let log = new UserLog();
            log.ActionTime = (new Date()).getTime() / 1000;
            log.ExpiredAt = this.timeHelper.getUnixTimeAfterMinutes(1);
            log.Event = body.event;
            log.Embeded = body.embeded;
            log.Status = rejectStatus || 'VERIFY';
            log.Code = body.code;
            log.Method = body.method||'';
            log.Cert = body.cert;
            await this.chainService.verify(user.PhoneNumber, log, body.service);
        } catch (e) {
            console.error(`Error while getting user`, e);
            return res.status(HttpStatus.BAD_GATEWAY).json({error: 'Error checking code.'});
        }
        let responseSend = false;
        let self = this;
        ws.onmessage = async mess => {
            const data = JSON.parse(mess.data);
            for (let stateChange of data.state_changes) {
                if (responseSend) {
                    ws.send(JSON.stringify({'action': 'unsubscribe'}));
                    break;
                }
                if (addresses.indexOf(stateChange.address) !== -1) {
                    const _user = messagesServiceClient.User.decode(new Buffer(stateChange.value, 'base64'));
                    if (_user.Logs.length === user.Logs.length) {
                        continue;
                    }
                    const status = _user.Logs[_user.Logs.length - 1].Status;
                    if (status === VALID) {
                        if (_user.Logs[_user.Logs.length - 1].Method === 'telegram') {
                            let telegramUser;
                            let number = user.PhoneNumber;
                            if (number.charAt(0) === '+') {
                                number = number.substring(1);
                            }
                            telegramUser = await self .telegramServer.userExists(new RegExp('^8|7' + number.substring(1) + '$', 'i'));
                            if (telegramUser) {
                                self .codeQueueListenerService.queueTelegram.add({
                                    chat_id: telegramUser.chatId,
                                    message: 'Вы успешно авторизвались на сервисе 2FA',
                                });
                            }
                        }
                        // Send user to client.
                        // todo отработать в момнет интеграции запросы клиентам сервисов
                        // switch (body.service) {
                        //     case 'kaztel':
                        //         request.post(EnvConfig.KAZTEL_CALLBACK_URL+ '/redirect_url', user).then(r=> console.log('redirect occur'))
                        //         break;
                        //     case 'egov':
                        //         request.post(EnvConfig.EGOV_CALLBACK_URL+ '/redirect_url', user).then(r=> console.log('redirect occur'))
                        //         break;
                        //     default:
                        //         break;
                        // }
                        // todo make request to redirest url with user data
                        responseSend = true;
                        ws.send(JSON.stringify({'action': 'unsubscribe'}));

                        // responde to the view
                        return res.status(HttpStatus.OK).json({status: 'VALID', user: _user});
                    } else {
                        responseSend = true;
                        ws.send(JSON.stringify({'action': 'unsubscribe'}));

                        if (status === 'EXPIRED') {
                            return res.status(440).json({status: status});
                        }
                        return res.status(HttpStatus.BAD_REQUEST).json({status: status});
                    }
                }
            }
        };
    }

    /**
     * Verify if user exists
     *
     * @param res
     * @param {PostCodeDTO} body
     * @returns {Promise<void>}
     */
    @Post('verify/user')
    async postVerifyUser(@Res() res, @Body() body: PostCodeDTO) {
        let v = new Validator(body, {
            lang: 'string',
            service: 'requiredIfNot:push_token|string|in:kaztel,egov',
            phone_number: 'required|string|regex:/^\\+?[1-9]\\d{1,14}$/',
        }, {'service.in': `No service with name: ${body.service}`});
        if (v.fails()) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
        }
        let user = await this.getUser(body.phone_number, body.service);
        if (user === null) {
            return res.status(HttpStatus.NOT_FOUND).json({user: [this.getUserNotFoundMessage(body.lang || 'en')]});
        }

        let number = body.phone_number;
        if (number.charAt(0) === '+') {
            number = number.substring(1);
        }
        number = number.substring(1);
        let userTelegram = await this.telegramServer.userExists(new RegExp('^8|7' + number + '$', 'i'));

        // todo device check embeded,  cert
        return res.status(HttpStatus.OK).json({
            status: 'success',
            push_token: user.PushToken !== '',
            registered_in_telegram: userTelegram !== null
        });
    }

    /**
     * Verify if user confirmed or rejected the verification
     *
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    @Post('check-push-verification')
    async checkPushVerification(@Req() req, @Res() res) {
        let tfaUser = await this.getUser(req.body.phone_number, 'tfa');
        if (!tfaUser){
            return res.status(HttpStatus.OK).json({status: `NO_USER`});
        }
        const redisKey = `${tfaUser.PhoneNumber}:${REDIS_USER_PUSH_RESULT_POSTFIX}`;
        const status = await this.redisClient.getAsync(redisKey);
        if (status == null) {
            return res.status(HttpStatus.OK).json({status: `NOT_VERIFIED_YET`});
        }
        await this.redisClient.del(redisKey);
        return res.status(HttpStatus.OK).json({status: status});
    }

    /***
     * Enter the service
     *
     * @param res
     * @param {string} event
     * @param {string} service
     */
    @Get('enter')
    getEnter(@Res() res, @Query('event') event: string, @Query('service') service: string) {
        let v = new Validator({
            event: event,
            service: service
        }, {
            event: 'required|string',
            service: 'required|string|in:kaztel,egov',
        }, {'service.in': `No service with name: ${service}`});
        if (v.fails()) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
        }
        return res.redirect(`${EnvConfig.FRONTEND_API}?service=${service}&event=${event}`);
    }
}