import {Body, Controller, Get, HttpStatus, Post, Query, Req, Res} from '@nestjs/common';
import {ApiUseTags} from '@nestjs/swagger';
import {Validator} from '../../../services/helpers/validation.helper';
import {PostCodeDTO} from '../../shared/models/dto/post.code.dto';
import * as Promisefy from 'bluebird';
import * as redis from 'redis';
import {CodeQueueListenerService} from '../../../services/code_sender/queue.service';
import {TfaTransactionFamily} from '../../shared/families/tfa.transaction.family';
import {ChainService} from '../../../services/sawtooth/chain.service';
import {UserLog} from '../../shared/models/user.log';
import {TimeHelper} from '../../../services/helpers/time.helper';
import {_getLatestIndex, sortNumber} from '../../../services/helpers/helpers';
import {Services} from '../../../services/code_sender/services';
import {EnvConfig} from '../../../config/env';
import {ApiController} from './controller';
import {KaztelTransactionFamily} from '../../shared/families/kaztel.transaction.family';
import {EgovTransactionFamily} from '../../shared/families/egov.transaction.family';
import * as  changeCase from 'change-case';

export const RESEND_CODE = 'RESEND_CODE';
export const SEND_CODE = 'SEND_CODE';
export const EXPIRED = 'EXPIRED';
export const VALID = 'VALID';
export const INVALID = 'INVALID';
import * as WebSocket from 'ws';
import {TelegramServer} from '../../../services/telegram/telegram.server';

const fs = require('fs');
const protobufLib = require('protocol-buffers');
const messagesServiceClient = protobufLib(fs.readFileSync('src/proto/service_client.proto'));

@ApiUseTags('v1/api/verification')
@Controller('v1/api/verification')
export class VerificationController extends ApiController {
    constructor(public tfaTF: TfaTransactionFamily,
                public kaztelTF: KaztelTransactionFamily,
                public egovTF: EgovTransactionFamily,
                public chainService: ChainService,
                private timeHelper: TimeHelper,
                private telegramServer: TelegramServer,
                private codeQueueListenerService: CodeQueueListenerService) {
        super(tfaTF, kaztelTF, egovTF);

        Promisefy.promisifyAll(redis);
    }

    @Get('enter')
    getEnter(@Res() res, @Query('event') event: string,
             @Query('service') service: string) {
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

    @Post('verify-user')
    async postVerifyUser(@Res() res, @Body() body: PostCodeDTO) {
        let v = new Validator(body, {
            event: 'required|string',
            lang: 'string',
            service: 'requiredIfNot:push_token|string|in:kaztel,egov',
            phone_number: 'required|string|regex:/^\\+?[1-9]\\d{1,14}$/',
            embeded: 'boolean',
            client_timestamp: 'required',
            cert: 'nullable',
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
        // начинаем слушать изменения адресов
        let addresses = [this.chainService.getAddress(body.phone_number, body.service)];
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
            await this.chainService.generateCode(body.phone_number, log, body.service);
        } catch (e) {
            console.error(`Error while getting user`, e);
            return res.status(HttpStatus.BAD_GATEWAY).json({error: 'Error sending code.'});
        }
        let pushToken = '';
        if (body.method === 'push' && !user.IsVerified) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({user: ['User is not verified']});
        } else {
            let tfaUser = await this.getUser(body.phone_number, 'tfa');
            pushToken = tfaUser.PushToken;
        }
        let telegramUser;
        if (body.method === 'telegram') {
            let number = body.phone_number;
            if (number.charAt(0) === '+') {
                number = number.substring(1);
            }
            telegramUser = await this.telegramServer.userExists(new RegExp('^8|7' + number.substring(1) + '$', 'i'));
            console.log('telegramUser', telegramUser);
            if (!telegramUser) {
                return res.status(HttpStatus.BAD_GATEWAY).json({user: ['User select telegram, but not registered in it yet.']});
            }
        }
        ws.onmessage = mess => {
            const data = JSON.parse(mess.data);
            let responseSend = false;
            for (let i = 0; i < data.state_changes.length; i++) {
                if (responseSend) {
                    ws.send(JSON.stringify({'action': 'unsubscribe'}));
                    break;
                }
                const stateChange = data.state_changes[i];
                if (addresses.indexOf(stateChange.address) !== -1) {
                    let userDecoded;
                    try {
                        userDecoded = messagesServiceClient.User.decode(new Buffer(stateChange.value, 'base64'));
                    } catch (e) {
                        console.log('VerificationController@postCode: Cant decode user', e);
                        responseSend = true;
                        ws.send(JSON.stringify({'action': 'unsubscribe'}));
                        return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({user: [' Cant decode user']});
                    }
                    if (userDecoded.Logs.length > user.Logs.length) {
                        const log: UserLog = userDecoded.Logs[_getLatestIndex(Object.keys(userDecoded.Logs))];
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

    @Get('code')
    async getCode(@Req() req,
                  @Res() res,
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

        // todo add The push token is wrong. validation
        if (v.fails()) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
        }
        let tfaKaztel = await this.getUser(phoneNumber, 'tfa');
        if (!tfaKaztel.IsVerified || tfaKaztel.PushToken !== pushToken) {
            return res.status(HttpStatus.NOT_FOUND).json({user: [this.getUserNotFoundMessage(req.query.lang || 'en')]});
        }
        let userKaztel = await this.getUser(phoneNumber, 'kaztel');
        let userEgov = await this.getUser(phoneNumber, 'egov');
        if (userKaztel === null && userEgov == null) {
            return res.status(HttpStatus.NOT_FOUND).json({user: [this.getUserNotFoundMessage(req.query.lang || 'en')]});
        }
        let logKaztel = {status: 'no_send_codes', log: {Service: null}};
        if (userKaztel) {
            logKaztel = this.getLatestCode(userKaztel);
        }
        let logEgov = {status: 'no_send_codes', log: {Service: null}};
        if (userEgov) {
            logEgov = this.getLatestCode(userEgov);
        }
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
                    return res.status(HttpStatus.UNPROCESSABLE_ENTITY)
                        .json({user: ['Error getiing code']});
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

    private transformLog(log: any, service: string): object {
        const fieldsToHandle = Object.keys(log);
        let obj = {};
        for (let f of fieldsToHandle) {
            if (f == 'Status' || f == 'ExpiredAt' || f == 'Method' || f == 'ActionTime') {
                continue;
            }
            obj[changeCase.snakeCase(f)] = log[f];
        }
        obj['service'] = service;
        return obj;
    }

    private getLatestCode(user: any): any {
        let sendCodeArrayKeysSorted = [];
        const userKeys = Object.keys(user.Logs);
        if (userKeys.length === 0) {
            return {status: 'no_send_codes'};
        }
        const currentTimestamp = (new Date()).getTime() / 1000;
        const keysLength = userKeys.length - 1;
        let sendCodeArrayKeys = [];
        let validCodeArrayKeys = [];
        for (let i = 0; i <= userKeys.length; i++) {
            const log = user.Logs[userKeys[i]];
            if (!log.Status) {
                continue;
            }
            if (log.Status === SEND_CODE || log.Status === RESEND_CODE) {
                if (currentTimestamp <= log.ExpiredAt) {
                    sendCodeArrayKeys.push(parseInt(userKeys[i], 10));
                }
            }
            if (log.Status === VALID) {
                validCodeArrayKeys.push(parseInt(userKeys[i], 10));
            }
            if (i !== keysLength) {
                continue;
            }
            if (sendCodeArrayKeys.length === 0) {
                return {status: 'no_send_codes'};
            }
            sendCodeArrayKeysSorted = sendCodeArrayKeys.sort(sortNumber);
            const latestCodeIndex = sendCodeArrayKeysSorted.length === 1 ? 0 : sendCodeArrayKeysSorted[sendCodeArrayKeysSorted.length - 1];
            const latestLog = user.Logs[latestCodeIndex];
            if (!validCodeArrayKeys.length) {
                return {status: 'success', log: latestLog};
            }
            const validKeysLength = validCodeArrayKeys.length - 1;
            for (let j = 0; j < validCodeArrayKeys.length; j++) {
                const logValid = user.Logs[validCodeArrayKeys[j]];
                if (logValid.Code === latestLog.Code) {
                    return {status: 'no_code_used'};
                }
                if (j === validKeysLength) {
                    return {status: 'success', log: latestLog};
                }
            }
        }
    }

    @Post('verify')
    async postVerify(@Res() res, @Body() body: PostCodeDTO) {
        console.log('body', body);
        let v = new Validator(body, {
            event: 'required|string',
            lang: 'string',
            code: 'required|number',
            service: 'requiredIfNot:push_token|string|in:kaztel,egov',
            phone_number: 'required|string|regex:/^\\+?[1-9]\\d{1,14}$/',
            embeded: 'boolean',
            // используется только при отправке мобильным приложением - для установке статуса REJECT
            status: 'string',
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
            this.chainService.getAddress(body.phone_number, body.service),
        ];
        let ws = this.openWsConnection(addresses);
        try {
            let rejectStatus = null;
            if (body.status && body.status) {
                rejectStatus = 'REJECT';
            }
            let log = new UserLog();
            log.ActionTime = (new Date()).getTime() / 1000;
            log.ExpiredAt = this.timeHelper.getUnixTimeAfterMinutes(1);
            log.Event = body.event;
            log.Embeded = body.embeded;
            log.Status = rejectStatus || 'VERIFY';
            log.Code = body.code;
            log.Cert = body.cert;
            await this.chainService.verify(body.phone_number, log, body.service);
        } catch (e) {
            console.error(`Error while getting user`, e);
            return res.status(HttpStatus.BAD_GATEWAY).json({error: 'Error checking code.'});
        }
        ws.onmessage = mess => {
            const data = JSON.parse(mess.data);
            let responseSend = false;
            for (let i = 0; i < data.state_changes.length; i++) {
                if (responseSend) {
                    ws.send(JSON.stringify({'action': 'unsubscribe'}));
                    break;
                }
                const stateChange = data.state_changes[i];
                if (addresses.indexOf(stateChange.address) !== -1) {
                    const _user = messagesServiceClient.User.decode(new Buffer(stateChange.value, 'base64'));
                    if (_user.Logs.length === user.Logs.length) {
                        continue;
                    }
                    if (_user.Logs[_user.Logs.length - 1].Status === VALID) {
                        // Send user to client.
                        // todo отработать в момнет интеграции
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
                        return res.status(HttpStatus.OK).json({status: 'VALID'});
                    } else {
                        responseSend = true;
                        ws.send(JSON.stringify({'action': 'unsubscribe'}));
                        const status = _user.Logs[_user.Logs.length - 1].Status;
                        if (status === 'EXPIRED') {
                            return res.status(440).json({status: status});
                        }
                        return res.status(HttpStatus.BAD_REQUEST).json({status: status});
                    }
                }
            }
        };
    }

    openWsConnection(addresses: string[]): any {
        let ws = new WebSocket(`ws:${EnvConfig.VALIDATOR_REST_API_HOST_PORT}/subscriptions`);
        ws.onopen = () => {
            ws.send(JSON.stringify({
                'action': 'subscribe',
                'address_prefixes': addresses
            }));
        };
        ws.onclose = () => {
            ws.send(JSON.stringify({
                'action': 'unsubscribe'
            }));
        };
        return ws;
    }
}