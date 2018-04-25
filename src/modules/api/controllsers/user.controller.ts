import {Body, Controller, Get, HttpStatus, Post, Query, Req, Res} from '@nestjs/common';
import {ApiUseTags} from '@nestjs/swagger';
import {PostVerifyNumberDTO} from '../../shared/models/dto/post.verify.number.dto';
import {CodeQueueListenerService} from '../../../services/code_sender/queue.service';
import {ClientService} from '../../../config/services/services';
import {TimeHelper} from '../../../services/helpers/time.helper';
import {Validator} from '../../../services/helpers/validation.helper';
import {TfaTransactionFamily} from '../../shared/families/tfa.transaction.family';
import {KaztelTransactionFamily} from '../../shared/families/kaztel.transaction.family';
import {ChainService} from '../../../services/sawtooth/chain.service';
import {EgovTransactionFamily} from '../../shared/families/egov.transaction.family';
import {UserLog} from '../../shared/models/user.log';
import {PostVerifyCodeDTO} from '../../shared/models/dto/post.verify.dto';
import {ApiController} from './controller';
import {REDIS_USER_POSTFIX, REDIS_USER_PUSH_RESULT_POSTFIX, REJECT, RESEND_CODE, SEND_CODE, VALID} from '../../../config/constants';
import {PostClientUserDTO} from '../../shared/models/dto/post.kaztel.user.dto';
import {getLatestIndex, genCode} from '../../../services/helpers/helpers';
import {Services} from '../../../services/code_sender/services';
import {PostCodeDTO} from '../../shared/models/dto/post.code.dto';
import {EnvConfig} from '../../../config/env';
import {TelegramServer} from '../../../services/telegram/telegram.server';

const Telegraf = require('telegraf');

const fs = require('fs');
const protobufLib = require('protocol-buffers');
const messagesService = protobufLib(fs.readFileSync('src/proto/service.proto'));
const messagesServiceClient = protobufLib(fs.readFileSync('src/proto/service_client.proto'));

@ApiUseTags('v1/api/users')
@Controller('v1/api/users')
export class UserController extends ApiController {
    private telegrafApp: any;

    /**
     * Creates an instance of UserController.
     * @memberof ApiController
     * @param timeHelper
     * @param tfaTF
     * @param kaztelTF
     * @param egovTF
     * @param chainService
     * @param services
     * @param telegramServer
     * @param codeQueueListenerService
     */
    constructor(private timeHelper: TimeHelper,
                public tfaTF: TfaTransactionFamily,
                public kaztelTF: KaztelTransactionFamily,
                public egovTF: EgovTransactionFamily,
                public chainService: ChainService,
                private services: ClientService,
                private telegramServer: TelegramServer,
                private codeQueueListenerService: CodeQueueListenerService) {
        super(tfaTF, kaztelTF, egovTF);
        this.telegrafApp = new Telegraf(EnvConfig.TELEGRAM_BOT_KEY);
    }

    @Get('verify-number')
    async sendUserCode(@Req() req,
                       @Res() res,
                       @Query('phone_number') phoneNumber: string): Promise<any[]> {
        let v = new Validator({phone_number: phoneNumber}, {phone_number: 'required|string|regex:/^\\+?[1-9]\\d{1,14}$/',});
        if (v.fails()) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
        }
        let user = await this.getUser(phoneNumber, 'tfa');
        if (user === null) {
            console.log('user not found!!!!!');
            return res.status(HttpStatus.NOT_FOUND).json({user: [this.getUserNotFoundMessage(req.query.lang || 'en')]});
        }
        let code = genCode();
        if (phoneNumber.charAt(0) === '+') {
            phoneNumber = phoneNumber.substring(1);
        }
        // for ios test flight testing
        if (phoneNumber === '76967713569') {
            code = 13733;
            await this.redisClient.setAsync(`${phoneNumber}:${REDIS_USER_POSTFIX}`, `${code}`, 'EX', 7 * 60);
            return res.status(HttpStatus.OK).json({status: 'success'});
        }
        // save code to redis
        // this key will expire after 8 * 60 seconds
        await this.redisClient.setAsync(`${phoneNumber}:${REDIS_USER_POSTFIX}`, `${code}`, 'EX', 7 * 60);
        // send sms
        this.codeQueueListenerService.queueSMS.add({
            phone_number: phoneNumber,
            service: 'kaztel',
            code: code,
            registration: true,
        });
        return res.status(HttpStatus.OK).json({status: 'success'});
    }

    @Post('verify-number')
    async verifyNumber(@Res() res, @Body() body: PostVerifyNumberDTO): Promise<any[]> {
        // валидация
        let v = new Validator(body, {
            phone_number: 'required|string|regex:/^\\+?[1-9]\\d{1,14}$/',
            push_token: 'nullable|string',
            code: 'required|number',
        }, {
            'service.requiredIfNot': `The service field is required when push_token is empty.`
        });
        if (v.fails()) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
        }
        // убрать плюс в начале номера телефона если он есть
        if (body.phone_number.charAt(0) === '+') {
            body.phone_number = body.phone_number.substring(1);
        }
        // Проверка, существует ли пользователь
        let user = await this.getUser(body.phone_number, 'tfa');
        if (user === null) {
            return res.status(HttpStatus.NOT_FOUND).json({user: [this.getUserNotFoundMessage(body.lang || 'en')]});
        }
        const redisKey = `${body.phone_number}:${REDIS_USER_POSTFIX}`;
        // проверка кода
        const codeFromRedis = await this.redisClient.getAsync(redisKey);
        if (codeFromRedis == null) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
                code: [body.lang === 'ru' ? 'Кода либо нету либо его срок истёк' : "The 'Code' expires or does not exists."]
            });
        }
        if (parseInt(codeFromRedis, 10) != parseInt(body.code, 10)) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
                code: [body.lang === 'ru' ? 'Вы ввели неверный код' : "The 'Code' is not valid."]
            });
        }
        await this.redisClient.del(redisKey);

        // подготовка адресов, за которыми нужно отследить успешное прохождение транзакции
        let userKaztel = await this.getUser(user.PhoneNumber, 'kaztel');
        let userEgov = await this.getUser(user.PhoneNumber, 'egov');
        let addresses = [
            this.chainService.getAddress(user.PhoneNumber, 'tfa'),
        ];
        if (userKaztel !== null) {
            addresses.push(this.chainService.getAddress(user.PhoneNumber, 'kaztel'));
        }
        if (userEgov !== null) {
            addresses.push(this.chainService.getAddress(user.PhoneNumber, 'egov'));
        }
        // начинаем слушать изменения адресов
        let ws = this.openWsConnection(addresses);

        user.IsVerified = true;
        user.PushToken = body.push_token;
        await this.tfaTF.updateUser(user.PhoneNumber, user);
        if (userKaztel !== null) {
            userKaztel.IsVerified = true;
            await this.kaztelTF.updateUser(user.PhoneNumber, userKaztel);
        }
        if (userEgov !== null) {
            userKaztel.IsVerified = true;
            await this.egovTF.updateUser(user.PhoneNumber, userEgov);
        }
        let responseSend = false;
        ws.onmessage = mess => {
            const data = JSON.parse(mess.data);
            for (let stateChange of data.state_changes) {
                if (addresses.indexOf(stateChange.address) !== -1) {
                    const _user = messagesService.User.decode(new Buffer(stateChange.value, 'base64'));
                    if (responseSend) {
                        ws.send(JSON.stringify({'action': 'unsubscribe'}));
                        break;
                    }
                    // todo: по хорошему надо во всех чейнах отследить изменения
                    if (_user.IsVerified) {
                        try {
                            responseSend = true;
                            return res.status(HttpStatus.OK).json({status: 'success'});
                        } catch (e) {
                            console.log('error - trying to send response second time', e);
                        }
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
                                console.log('log.Code', log.Code);
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

    @Get('code')
    async getCode(@Req() req, @Res() res,
                  @Query('phone_number') phoneNumber: string,
                  @Query('push_token') pushToken: string,
                  @Query('client_timestamp') clientTimestamp: string) {
        try {
            req.query.client_timestamp = parseInt(req.query.client_timestamp, 10);
        } catch (e) {
            console.log('e', e);
        }
        let v = new Validator(req.query, {
            phone_number: 'required|string|regex:/^\\+?[1-9]\\d{1,14}$/',
            push_token: 'required|string',
            client_timestamp: 'required|number',
        });
        if (v.fails()) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
        }
        let tfaKaztel = await this.getUser(phoneNumber, 'tfa');
        if (!tfaKaztel) {
            return res.status(HttpStatus.NOT_FOUND).json({user: [this.getUserNotFoundMessage(req.query.lang || 'en')]});
        }
        if (!tfaKaztel.IsVerified || tfaKaztel.PushToken !== pushToken) {
            return res.status(HttpStatus.NOT_FOUND).json({user: [this.getUserNotFoundMessage(req.query.lang || 'en')]});
        }
        let userKaztel = await this.getUser(tfaKaztel.PhoneNumber, 'kaztel');
        let userEgov = await this.getUser(tfaKaztel.PhoneNumber, 'egov');
        if (userKaztel === null && userEgov == null) {
            return res.status(HttpStatus.NOT_FOUND).json({user: [this.getUserNotFoundMessage(req.query.lang || 'en')]});
        }
        let number = tfaKaztel.PhoneNumber;
        if (number.charAt(0) === '+') {
            number = number.substring(1);
        }
        // let telegramUser = await this.telegramServer.userExists(new RegExp('^8|7' + number.substring(1) + '$', 'i'));
        // let telegramUserCreatedAt = null;
        // if (telegramUser) {
        //     telegramUserCreatedAt = telegramUser.
        //     return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({user: [this.getMessage('ru', 'telegram_bot_unregistered')]});
        // }
        let {logKaztel, logEgov} = this.initLogs(userKaztel, userEgov);
        if (logKaztel.status !== 'success' && logEgov.status !== 'success') {
            switch (logKaztel.status) {
                case 'no_send_codes':
                    return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
                        user: [req.query.lang == 'ru' ? 'Пользователю ещё не отправили ни одного кода подтверждения' : 'No code for user yet']
                    });
                case 'no_code_used':
                    return res.status(HttpStatus.UNPROCESSABLE_ENTITY)
                        .json({
                            user: [req.query.lang == 'ru'
                                ? 'Пользователю ещё не отправили ни одного кода подтверждения'
                                : 'No code for user yet']
                        });
                default:
                    return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({user: ['Error getting code']});
            }
        }
        if (logKaztel.status === 'success') {
            return res.status(HttpStatus.OK).json(this.transformLog(logKaztel.log, 'kaztel'));
        }
        if (logEgov.status === 'success') {
            return res.status(HttpStatus.OK).json(this.transformLog(logEgov.log, 'egov'));
        }
        return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({user: ['Error getting code']});
    }

    @Post('verify')
    async postVerify(@Res() res, @Body() body: PostVerifyCodeDTO) {
        let v = new Validator(body, {
            event: 'required|string', lang: 'string', code: 'required|number', service: 'requiredIfNot:push_token|string|in:kaztel,egov',
            phone_number: 'required|string|regex:/^\\+?[1-9]\\d{1,14}$/', embeded: 'boolean',
            // используется только при отправке мобильным приложением - для установке статуса REJECT
            status: 'string', client_timestamp: 'required', cert: 'nullable',
        }, {'service.in': `No service with name: ${body.service}`});
        if (v.fails()) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
        }
        // Проверка, существует ли пользователь
        let user = await this.getUser(body.phone_number, body.service);
        if (user === null) {
            return res.status(HttpStatus.NOT_FOUND).json({
                user: [this.getUserNotFoundMessage(body.lang || 'en')]
            });
        }
        // начинаем слушать изменения адресов
        let addresses = [
            this.chainService.getAddress(user.PhoneNumber, body.service),
        ];
        let ws = this.openWsConnection(addresses);
        try {
            await this.storeLog(body, user);
        } catch (e) {
            console.error(`Error while getting user`, e);
            return res.status(HttpStatus.BAD_GATEWAY).json({error: 'Error checking code.'});
        }
        let self = this;
        let tfaUser = await this.getUser(body.phone_number, 'tfa');
        ws.onmessage = mess => {
            const data = JSON.parse(mess.data);
            let responseSend = false;
            for (let stateChange of data.state_changes) {
                if (responseSend) {
                    ws.send(JSON.stringify({'action': 'unsubscribe'}));
                    break;
                }
                if (addresses.indexOf(stateChange.address) !== -1) {
                    const _user = messagesServiceClient.User.decode(new Buffer(stateChange.value, 'base64'));
                    if (_user.Logs.length === user.Logs.length) {
                        console.log('_user.Logs', _user.Logs);
                        continue;
                    }
                    responseSend = true;
                    ws.send(JSON.stringify({'action': 'unsubscribe'}));
                    const status = _user.Logs[_user.Logs.length - 1].Status;
                    // safe in redis information that phone is valid
                    self.redisClient.setAsync(`${tfaUser.PhoneNumber}:${REDIS_USER_PUSH_RESULT_POSTFIX}`, status, 'EX', 15 * 60).then(() => {
                        if (status === VALID || status === REJECT) {
                            // Send user to client.
                            // todo отработать в момнет интеграции
                            // todo make request to redirest url with user data
                            // responde to the view
                            return res.status(HttpStatus.OK).json({status: status, user: _user});
                        } else {
                            if (status === 'EXPIRED') {
                                return res.status(440).json({status: status});
                            }
                            return res.status(HttpStatus.BAD_REQUEST).json({status: status});
                        }
                    });
                }
            }
        };
    }

    private initLogs(userKaztel: PostClientUserDTO | null, userEgov: PostClientUserDTO | null) {
        let logKaztel = {status: 'no_send_codes', log: {Service: null}};
        if (userKaztel) {
            logKaztel = this.getLatestCode(userKaztel);
        }
        let logEgov = {status: 'no_send_codes', log: {Service: null}};
        if (userEgov) {
            logEgov = this.getLatestCode(userEgov);
        }
        return {logKaztel, logEgov};
    }

    private async storeLog(body: PostVerifyCodeDTO, user: PostClientUserDTO | null) {
        let rejectStatus = null;
        if (body.status && body.status === 'REJECT') {
            rejectStatus = 'REJECT';
        }
        let log = new UserLog();
        log.ActionTime = (new Date()).getTime() / 1000;
        log.ExpiredAt = this.timeHelper.getUnixTimeAfterMinutes(1);
        log.Event = body.event;
        log.Embeded = body.embeded;
        log.Method = body.method || '';
        log.Status = rejectStatus || 'VERIFY';
        log.Code = body.code;
        log.Cert = body.cert;
        await this.chainService.verify(user.PhoneNumber, log, body.service);
    }
}