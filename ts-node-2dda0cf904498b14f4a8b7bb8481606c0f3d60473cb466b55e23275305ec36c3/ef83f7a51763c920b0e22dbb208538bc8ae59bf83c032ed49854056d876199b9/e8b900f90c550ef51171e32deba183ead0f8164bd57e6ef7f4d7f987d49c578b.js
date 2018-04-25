"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const env_1 = require("../../../config/env");
const validation_helper_1 = require("../../../services/helpers/validation.helper");
const post_verify_dto_1 = require("../../shared/models/dto/post.verify.dto");
const constants_1 = require("../../../config/constants");
const tfa_transaction_family_1 = require("../../shared/families/tfa.transaction.family");
const kaztel_transaction_family_1 = require("../../shared/families/kaztel.transaction.family");
const time_helper_1 = require("../../../services/helpers/time.helper");
const services_1 = require("../../../services/code_sender/services");
const chain_service_1 = require("../../../services/sawtooth/chain.service");
const helpers_1 = require("../../../services/helpers/helpers");
const queue_service_1 = require("../../../services/code_sender/queue.service");
const post_code_dto_1 = require("../../shared/models/dto/post.code.dto");
const user_log_1 = require("../../shared/models/user.log");
const telegram_server_1 = require("../../../services/telegram/telegram.server");
const redis = require("redis");
const egov_transaction_family_1 = require("../../shared/families/egov.transaction.family");
const Promisefy = require("bluebird");
const controller_1 = require("./controller");
const Telegraf = require('telegraf');
const fs = require('fs');
const protobufLib = require('protocol-buffers');
const messagesServiceClient = protobufLib(fs.readFileSync('src/proto/service_client.proto'));
let WebController = class WebController extends controller_1.ApiController {
    constructor(tfaTF, kaztelTF, egovTF, chainService, timeHelper, telegramServer, codeQueueListenerService) {
        super(tfaTF, kaztelTF, egovTF);
        this.tfaTF = tfaTF;
        this.kaztelTF = kaztelTF;
        this.egovTF = egovTF;
        this.chainService = chainService;
        this.timeHelper = timeHelper;
        this.telegramServer = telegramServer;
        this.codeQueueListenerService = codeQueueListenerService;
        this.telegrafApp = new Telegraf(env_1.EnvConfig.TELEGRAM_BOT_KEY);
        Promisefy.promisifyAll(redis);
    }
    postCode(res, body) {
        return __awaiter(this, void 0, void 0, function* () {
            let v = new validation_helper_1.Validator(body, {
                event: 'required|string',
                lang: 'nullable|string',
                method: 'required|string|in:sms,push,telegram,whatsapp',
                service: 'requiredIfNot:push_token|string|in:kaztel,egov',
                phone_number: 'required|string|regex:/^\\+?[1-9]\\d{1,14}$/',
                embeded: 'boolean',
                client_timestamp: 'required',
                cert: 'nullable',
                resend: 'nullable|boolean',
            }, { 'service.in': `No service with name: ${body.service}` });
            if (v.fails()) {
                return res.status(common_1.HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
            }
            let user = yield this.getUser(body.phone_number, body.service);
            if (user === null) {
                return res.status(common_1.HttpStatus.NOT_FOUND).json({ user: [this.getUserNotFoundMessage(body.lang || 'en')] });
            }
            console.log('000', 0);
            let telegramUser;
            if (body.method === 'telegram') {
                let number = user.PhoneNumber;
                if (number.charAt(0) === '+') {
                    number = number.substring(1);
                }
                telegramUser = yield this.telegramServer.userExists(new RegExp('^8|7' + number.substring(1) + '$', 'i'));
                if (!telegramUser) {
                    return res.status(common_1.HttpStatus.UNPROCESSABLE_ENTITY).json({ user: [this.getMessage(body.lang, 'telegram_bot_unregistered')] });
                }
                try {
                    yield this.telegrafApp.telegram.sendMessage(telegramUser.chatId, 'Здравствуйте');
                }
                catch (e) {
                    if (e.response && e.response.error_code === 403) {
                        return res.status(common_1.HttpStatus.UNPROCESSABLE_ENTITY).json({ status: 'telegram_bot_unregistered' });
                    }
                }
            }
            console.log('001', 1);
            let addresses = [this.chainService.getAddress(user.PhoneNumber, body.service)];
            let ws = this.openWsConnection(addresses);
            try {
                let log = new user_log_1.UserLog();
                log.ActionTime = (new Date()).getTime() / 1000;
                log.ExpiredAt = this.timeHelper.getUnixTimeAfterMinutes(7);
                log.Event = body.event;
                log.Method = body.method;
                log.Status = body.resend ? 'RESEND_CODE' : 'SEND_CODE';
                log.Embeded = body.embeded;
                log.Cert = body.cert;
                yield this.chainService.generateCode(user.PhoneNumber, log, body.service);
            }
            catch (e) {
                console.error(`Error while getting user`, e);
                return res.status(common_1.HttpStatus.BAD_GATEWAY).json({ error: 'Error sending code.' });
            }
            console.log('11', 11);
            let pushToken = '';
            if (body.method === 'push' && !user.IsVerified) {
                return res.status(common_1.HttpStatus.UNPROCESSABLE_ENTITY).json({ user: [this.getMessage(body.lang, 'not_verified')] });
            }
            else {
                let tfaUser = yield this.getUser(user.PhoneNumber, 'tfa');
                if (!tfaUser) {
                    return res.status(common_1.HttpStatus.UNPROCESSABLE_ENTITY).json({ user: [this.getMessage(body.lang, 'not_verified')] });
                }
                pushToken = tfaUser.PushToken;
            }
            console.log('22', 22);
            let responseSend = false;
            ws.onmessage = mess => {
                const data = JSON.parse(mess.data);
                for (let stateChange of data.state_changes) {
                    if (responseSend) {
                        ws.send(JSON.stringify({ 'action': 'unsubscribe' }));
                        break;
                    }
                    if (addresses.indexOf(stateChange.address) !== -1) {
                        console.log('333', 333);
                        let userDecoded;
                        try {
                            userDecoded = messagesServiceClient.User.decode(new Buffer(stateChange.value, 'base64'));
                        }
                        catch (e) {
                            console.log('VerificationController@postCode: Cant decode user', e);
                            responseSend = true;
                            ws.send(JSON.stringify({ 'action': 'unsubscribe' }));
                            return res.status(common_1.HttpStatus.UNPROCESSABLE_ENTITY).json({ user: [this.getMessage(body.lang, 'error_decode_user_bc')] });
                        }
                        if (userDecoded.Logs.length > user.Logs.length) {
                            const log = userDecoded.Logs[helpers_1._getLatestIndex(Object.keys(userDecoded.Logs))];
                            if (log.Status !== constants_1.SEND_CODE && log.Status !== constants_1.RESEND_CODE) {
                                responseSend = true;
                                ws.send(JSON.stringify({
                                    'action': 'unsubscribe'
                                }));
                                return res.status(common_1.HttpStatus.UNPROCESSABLE_ENTITY).json({
                                    user: ['Code was not send - latest log is not with the code to send.']
                                });
                            }
                            switch (log.Method) {
                                case 'push':
                                    this.codeQueueListenerService.queuePUSH.add({
                                        title: 'Двухфакторная авторизация',
                                        message: `Подтвердите вход на сервис: '${services_1.Services[body.service]}'`,
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
                                        message: 'Ваш код подтверждения для сервиса "' + services_1.Services[body.service] + '": ' + log.Code,
                                    });
                                    break;
                                case 'whatsapp':
                                    break;
                                default:
                                    console.error(`ChainController@deliverCode: method ${log.Method} is not supported.`);
                                    break;
                            }
                            ws.send(JSON.stringify({ 'action': 'unsubscribe' }));
                            responseSend = true;
                            return res.status(common_1.HttpStatus.OK).json({
                                resend_cooldown: 7 * 60,
                                method: body.method,
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
        });
    }
    postVerify(res, body) {
        return __awaiter(this, void 0, void 0, function* () {
            let v = new validation_helper_1.Validator(body, {
                event: 'required|string',
                lang: 'string',
                code: 'required|number',
                service: 'requiredIfNot:push_token|string|in:kaztel,egov',
                phone_number: 'required|string|regex:/^\\+?[1-9]\\d{1,14}$/',
                embeded: 'boolean',
                status: 'string',
                method: 'string',
                client_timestamp: 'required',
                cert: 'nullable',
            }, { 'service.in': `No service with name: ${body.service}` });
            if (v.fails()) {
                return res.status(common_1.HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
            }
            let user = yield this.getUser(body.phone_number, body.service);
            if (user === null) {
                return res.status(common_1.HttpStatus.NOT_FOUND).json({ user: [this.getUserNotFoundMessage(body.lang || 'en')] });
            }
            let addresses = [
                this.chainService.getAddress(user.PhoneNumber, body.service),
            ];
            let ws = this.openWsConnection(addresses);
            try {
                let rejectStatus = null;
                if (body.status && body.status === constants_1.REJECT) {
                    rejectStatus = constants_1.REJECT;
                }
                let log = new user_log_1.UserLog();
                log.ActionTime = (new Date()).getTime() / 1000;
                log.ExpiredAt = this.timeHelper.getUnixTimeAfterMinutes(1);
                log.Event = body.event;
                log.Embeded = body.embeded;
                log.Status = rejectStatus || 'VERIFY';
                log.Code = body.code;
                log.Cert = body.cert;
                yield this.chainService.verify(user.PhoneNumber, log, body.service);
            }
            catch (e) {
                console.error(`Error while getting user`, e);
                return res.status(common_1.HttpStatus.BAD_GATEWAY).json({ error: 'Error checking code.' });
            }
            let responseSend = false;
            let self = this;
            ws.onmessage = (mess) => __awaiter(this, void 0, void 0, function* () {
                const data = JSON.parse(mess.data);
                for (let stateChange of data.state_changes) {
                    if (responseSend) {
                        ws.send(JSON.stringify({ 'action': 'unsubscribe' }));
                        break;
                    }
                    if (addresses.indexOf(stateChange.address) !== -1) {
                        const _user = messagesServiceClient.User.decode(new Buffer(stateChange.value, 'base64'));
                        if (_user.Logs.length === user.Logs.length) {
                            continue;
                        }
                        const status = _user.Logs[_user.Logs.length - 1].Status;
                        if (status === constants_1.VALID) {
                            console.log('_user.Logs[_user.Logs.length - 1].Method', _user.Logs[_user.Logs.length - 1]);
                            if (_user.Logs[_user.Logs.length - 1].Method === 'telegram') {
                                let telegramUser;
                                let number = user.PhoneNumber;
                                if (number.charAt(0) === '+') {
                                    number = number.substring(1);
                                }
                                telegramUser = yield self.telegramServer.userExists(new RegExp('^8|7' + number.substring(1) + '$', 'i'));
                                if (telegramUser) {
                                    self.codeQueueListenerService.queueTelegram.add({
                                        chat_id: telegramUser.chatId,
                                        message: 'Вы успешно авторизвались на сервисе 2FA',
                                    });
                                }
                            }
                            responseSend = true;
                            ws.send(JSON.stringify({ 'action': 'unsubscribe' }));
                            return res.status(common_1.HttpStatus.OK).json({ status: 'VALID', user: _user });
                        }
                        else {
                            responseSend = true;
                            ws.send(JSON.stringify({ 'action': 'unsubscribe' }));
                            if (status === 'EXPIRED') {
                                return res.status(440).json({ status: status });
                            }
                            return res.status(common_1.HttpStatus.BAD_REQUEST).json({ status: status });
                        }
                    }
                }
            });
        });
    }
    postVerifyUser(res, body) {
        return __awaiter(this, void 0, void 0, function* () {
            let v = new validation_helper_1.Validator(body, {
                lang: 'string',
                service: 'requiredIfNot:push_token|string|in:kaztel,egov',
                phone_number: 'required|string|regex:/^\\+?[1-9]\\d{1,14}$/',
            }, { 'service.in': `No service with name: ${body.service}` });
            if (v.fails()) {
                return res.status(common_1.HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
            }
            let user = yield this.getUser(body.phone_number, body.service);
            if (user === null) {
                return res.status(common_1.HttpStatus.NOT_FOUND).json({ user: [this.getUserNotFoundMessage(body.lang || 'en')] });
            }
            let number = body.phone_number;
            if (number.charAt(0) === '+') {
                number = number.substring(1);
            }
            number = number.substring(1);
            let userTelegram = yield this.telegramServer.userExists(new RegExp('^8|7' + number + '$', 'i'));
            return res.status(common_1.HttpStatus.OK).json({
                status: 'success',
                push_token: user.PushToken !== '',
                registered_in_telegram: userTelegram !== null
            });
        });
    }
    checkPushVerification(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let tfaUser = yield this.getUser(req.body.phone_number, 'tfa');
            if (!tfaUser) {
                return res.status(common_1.HttpStatus.OK).json({ status: `NO_USER` });
            }
            const redisKey = `${tfaUser.PhoneNumber}:${constants_1.REDIS_USER_PUSH_RESULT_POSTFIX}`;
            const status = yield this.redisClient.getAsync(redisKey);
            if (status == null) {
                return res.status(common_1.HttpStatus.OK).json({ status: `NOT_VERIFIED_YET` });
            }
            yield this.redisClient.del(redisKey);
            return res.status(common_1.HttpStatus.OK).json({ status: status });
        });
    }
    getEnter(res, event, service) {
        let v = new validation_helper_1.Validator({
            event: event,
            service: service
        }, {
            event: 'required|string',
            service: 'required|string|in:kaztel,egov',
        }, { 'service.in': `No service with name: ${service}` });
        if (v.fails()) {
            return res.status(common_1.HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
        }
        return res.redirect(`${env_1.EnvConfig.FRONTEND_API}?service=${service}&event=${event}`);
    }
};
__decorate([
    common_1.Post('code'),
    __param(0, common_1.Res()), __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, post_code_dto_1.PostCodeDTO]),
    __metadata("design:returntype", Promise)
], WebController.prototype, "postCode", null);
__decorate([
    common_1.Post('verify/code'),
    __param(0, common_1.Res()), __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, post_verify_dto_1.PostVerifyCodeDTO]),
    __metadata("design:returntype", Promise)
], WebController.prototype, "postVerify", null);
__decorate([
    common_1.Post('verify/user'),
    __param(0, common_1.Res()), __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, post_code_dto_1.PostCodeDTO]),
    __metadata("design:returntype", Promise)
], WebController.prototype, "postVerifyUser", null);
__decorate([
    common_1.Post('check-push-verification'),
    __param(0, common_1.Req()), __param(1, common_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebController.prototype, "checkPushVerification", null);
__decorate([
    common_1.Get('enter'),
    __param(0, common_1.Res()), __param(1, common_1.Query('event')), __param(2, common_1.Query('service')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], WebController.prototype, "getEnter", null);
WebController = __decorate([
    swagger_1.ApiUseTags('v1/api/web'),
    common_1.Controller('v1/api/web'),
    __metadata("design:paramtypes", [tfa_transaction_family_1.TfaTransactionFamily,
        kaztel_transaction_family_1.KaztelTransactionFamily,
        egov_transaction_family_1.EgovTransactionFamily,
        chain_service_1.ChainService,
        time_helper_1.TimeHelper,
        telegram_server_1.TelegramServer,
        queue_service_1.CodeQueueListenerService])
], WebController);
exports.WebController = WebController;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvY29udHJvbGxzZXJzL3dlYi5jb250cm9sbGVyLnRzIiwic291cmNlcyI6WyIvaG9tZS9wZXNoa292L2Rldi9wcm9qZWN0cy9ibG9ja2NoYWluLTJmYS1iYWNrZW5kL3NyYy9tb2R1bGVzL2FwaS9jb250cm9sbHNlcnMvd2ViLmNvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDJDQUF3RjtBQUN4Riw2Q0FBMkM7QUFDM0MsNkNBQThDO0FBQzlDLG1GQUFzRTtBQUN0RSw2RUFBMEU7QUFDMUUseURBQWdIO0FBQ2hILHlGQUFrRjtBQUNsRiwrRkFBd0Y7QUFDeEYsdUVBQWlFO0FBQ2pFLHFFQUFnRTtBQUNoRSw0RUFBc0U7QUFDdEUsK0RBQWtFO0FBQ2xFLCtFQUFxRjtBQUNyRix5RUFBa0U7QUFDbEUsMkRBQXFEO0FBQ3JELGdGQUEwRTtBQUMxRSwrQkFBK0I7QUFDL0IsMkZBQW9GO0FBQ3BGLHNDQUFzQztBQUN0Qyw2Q0FBMkM7QUFFM0MsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3JDLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN6QixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUNoRCxNQUFNLHFCQUFxQixHQUFHLFdBQVcsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLGdDQUFnQyxDQUFDLENBQUMsQ0FBQztBQUk3RixJQUFhLGFBQWEsR0FBMUIsbUJBQTJCLFNBQVEsMEJBQWE7SUFHNUMsWUFBbUIsS0FBMkIsRUFDM0IsUUFBaUMsRUFDakMsTUFBNkIsRUFDN0IsWUFBMEIsRUFDekIsVUFBc0IsRUFDdEIsY0FBOEIsRUFDOUIsd0JBQWtEO1FBQ2xFLEtBQUssQ0FBQyxLQUFL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LFlBQVksQ0FBQztxQ0FJSyw2Q0FBb0I7UUFDakIsbURBQXVCO1FBQ3pCLCtDQUFxQjtRQUNmLDRCQUFZO1FBQ2Isd0JBQVU7UUFDTixnQ0FBYztRQUNKLHdDQUF3QjtHQVQ3RCxhQUFhLENBaVh6QjtBQWpYWSxzQ0FBYSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7Qm9keSwgQ29udHJvbGxlciwgR2V0LCBIdHRwU3RhdHVzLCBQb3N0LCBRdWVyeSwgUmVxLCBSZXN9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcbmltcG9ydCB7QXBpVXNlVGFnc30gZnJvbSAnQG5lc3Rqcy9zd2FnZ2VyJztcbmltcG9ydCB7RW52Q29uZmlnfSBmcm9tICcuLi8uLi8uLi9jb25maWcvZW52JztcbmltcG9ydCB7VmFsaWRhdG9yfSBmcm9tICcuLi8uLi8uLi9zZXJ2aWNlcy9oZWxwZXJzL3ZhbGlkYXRpb24uaGVscGVyJztcbmltcG9ydCB7UG9zdFZlcmlmeUNvZGVEVE99IGZyb20gJy4uLy4uL3NoYXJlZC9tb2RlbHMvZHRvL3Bvc3QudmVyaWZ5LmR0byc7XG5pbXBvcnQge1JFRElTX1VTRVJfUFVTSF9SRVNVTFRfUE9TVEZJWCwgUkVKRUNULCBSRVNFTkRfQ09ERSwgU0VORF9DT0RFLCBWQUxJRH0gZnJvbSAnLi4vLi4vLi4vY29uZmlnL2NvbnN0YW50cyc7XG5pbXBvcnQge1RmYVRyYW5zYWN0aW9uRmFtaWx5fSBmcm9tICcuLi8uLi9zaGFyZWQvZmFtaWxpZXMvdGZhLnRyYW5zYWN0aW9uLmZhbWlseSc7XG5pbXBvcnQge0thenRlbFRyYW5zYWN0aW9uRmFtaWx5fSBmcm9tICcuLi8uLi9zaGFyZWQvZmFtaWxpZXMva2F6dGVsLnRyYW5zYWN0aW9uLmZhbWlseSc7XG5pbXBvcnQge1RpbWVIZWxwZXJ9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL2hlbHBlcnMvdGltZS5oZWxwZXInO1xuaW1wb3J0IHtTZXJ2aWNlc30gZnJvbSAnLi4vLi4vLi4vc2VydmljZXMvY29kZV9zZW5kZXIvc2VydmljZXMnO1xuaW1wb3J0IHtDaGFpblNlcnZpY2V9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL3Nhd3Rvb3RoL2NoYWluLnNlcnZpY2UnO1xuaW1wb3J0IHtfZ2V0TGF0ZXN0SW5kZXh9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL2hlbHBlcnMvaGVscGVycyc7XG5pbXBvcnQge0NvZGVRdWV1ZUxpc3RlbmVyU2VydmljZX0gZnJvbSAnLi4vLi4vLi4vc2VydmljZXMvY29kZV9zZW5kZXIvcXVldWUuc2VydmljZSc7XG5pbXBvcnQge1Bvc3RDb2RlRFRPfSBmcm9tICcuLi8uLi9zaGFyZWQvbW9kZWxzL2R0by9wb3N0LmNvZGUuZHRvJztcbmltcG9ydCB7VXNlckxvZ30gZnJvbSAnLi4vLi4vc2hhcmVkL21vZGVscy91c2VyLmxvZyc7XG5pbXBvcnQge1RlbGVncmFtU2VydmVyfSBmcm9tICcuLi8uLi8uLi9zZXJ2aWNlcy90ZWxlZ3JhbS90ZWxlZ3JhbS5zZXJ2ZXInO1xuaW1wb3J0ICogYXMgcmVkaXMgZnJvbSAncmVkaXMnO1xuaW1wb3J0IHtFZ292VHJhbnNhY3Rpb25GYW1pbHl9IGZyb20gJy4uLy4uL3NoYXJlZC9mYW1pbGllcy9lZ292LnRyYW5zYWN0aW9uLmZhbWlseSc7XG5pbXBvcnQgKiBhcyBQcm9taXNlZnkgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHtBcGlDb250cm9sbGVyfSBmcm9tICcuL2NvbnRyb2xsZXInO1xuXG5jb25zdCBUZWxlZ3JhZiA9IHJlcXVpcmUoJ3RlbGVncmFmJyk7XG5jb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG5jb25zdCBwcm90b2J1ZkxpYiA9IHJlcXVpcmUoJ3Byb3RvY29sLWJ1ZmZlcnMnKTtcbmNvbnN0IG1lc3NhZ2VzU2VydmljZUNsaWVudCA9IHByb3RvYnVmTGliKGZzLnJlYWRGaWxlU3luYygnc3JjL3Byb3RvL3NlcnZpY2VfY2xpZW50LnByb3RvJykpO1xuXG5AQXBpVXNlVGFncygndjEvYXBpL3dlYicpXG5AQ29udHJvbGxlcigndjEvYXBpL3dlYicpXG5leHBvcnQgY2xhc3MgV2ViQ29udHJvbGxlciBleHRlbmRzIEFwaUNvbnRyb2xsZXJ7XG4gICAgcHJpdmF0ZSB0ZWxlZ3JhZkFwcDogYW55O1xuXG4gICAgY29uc3RydWN0b3IocHVibGljIHRmYVRGOiBUZmFUcmFuc2FjdGlvbkZhbWlseSxcbiAgICAgICAgICAgICAgICBwdWJsaWMga2F6dGVsVEY6IEthenRlbFRyYW5zYWN0aW9uRmFtaWx5LFxuICAgICAgICAgICAgICAgIHB1YmxpYyBlZ292VEY6IEVnb3ZUcmFuc2FjdGlvbkZhbWlseSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgY2hhaW5TZXJ2aWNlOiBDaGFpblNlcnZpY2UsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSB0aW1lSGVscGVyOiBUaW1lSGVscGVyLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgdGVsZWdyYW1TZXJ2ZXI6IFRlbGVncmFtU2VydmVyLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgY29kZVF1ZXVlTGlzdGVuZXJTZXJ2aWNlOiBDb2RlUXVldWVMaXN0ZW5lclNlcnZpY2UpIHtcbiAgICAgICAgc3VwZXIodGZhVEYsIGthenRlbFRGLCBlZ292VEYpO1xuICAgICAgICB0aGlzLnRlbGVncmFmQXBwID0gbmV3IFRlbGVncmFmKEVudkNvbmZpZy5URUxFR1JBTV9CT1RfS0VZKTtcbiAgICAgICAgUHJvbWlzZWZ5LnByb21pc2lmeUFsbChyZWRpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VuZCBjb2RlIHRvIHVzZXJcbiAgICAgKlxuICAgICAqIEBwYXJhbSByZXNcbiAgICAgKiBAcGFyYW0ge1Bvc3RDb2RlRFRPfSBib2R5XG4gICAgICogQHJldHVybnMge1Byb21pc2U8dm9pZD59XG4gICAgICovXG4gICAgQFBvc3QoJ2NvZGUnKVxuICAgIGFzeW5jIHBvc3RDb2RlKEBSZXMoKSByZXMsIEBCb2R5KCkgYm9keTogUG9zdENvZGVEVE8pIHtcbiAgICAgICAgbGV0IHYgPSBuZXcgVmFsaWRhdG9yKGJvZHksIHtcbiAgICAgICAgICAgIGV2ZW50OiAncmVxdWlyZWR8c3RyaW5nJyxcbiAgICAgICAgICAgIGxhbmc6ICdudWxsYWJsZXxzdHJpbmcnLFxuICAgICAgICAgICAgbWV0aG9kOiAncmVxdWlyZWR8c3RyaW5nfGluOnNtcyxwdXNoLHRlbGVncmFtLHdoYXRzYXBwJyxcbiAgICAgICAgICAgIHNlcnZpY2U6ICdyZXF1aXJlZElmTm90OnB1c2hfdG9rZW58c3RyaW5nfGluOmthenRlbCxlZ292JyxcbiAgICAgICAgICAgIHBob25lX251bWJlcjogJ3JlcXVpcmVkfHN0cmluZ3xyZWdleDovXlxcXFwrP1sxLTldXFxcXGR7MSwxNH0kLycsXG4gICAgICAgICAgICBlbWJlZGVkOiAnYm9vbGVhbicsXG4gICAgICAgICAgICBjbGllbnRfdGltZXN0YW1wOiAncmVxdWlyZWQnLFxuICAgICAgICAgICAgY2VydDogJ251bGxhYmxlJyxcbiAgICAgICAgICAgIHJlc2VuZDogJ251bGxhYmxlfGJvb2xlYW4nLFxuICAgICAgICB9LCB7J3NlcnZpY2UuaW4nOiBgTm8gc2VydmljZSB3aXRoIG5hbWU6ICR7Ym9keS5zZXJ2aWNlfWB9KTtcbiAgICAgICAgaWYgKHYuZmFpbHMoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih2LmdldEVycm9ycygpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyDQn9GA0L7QstC10YDQutCwLCDRgdGD0YnQtdGB0YLQstGD0LXRgiDQu9C4INC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjFxuICAgICAgICBsZXQgdXNlciA9IGF3YWl0IHRoaXMuZ2V0VXNlcihib2R5LnBob25lX251bWJlciwgYm9keS5zZXJ2aWNlKTtcbiAgICAgICAgaWYgKHVzZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuTk9UX0ZPVU5EKS5qc29uKHt1c2VyOiBbdGhpcy5nZXRVc2VyTm90Rm91bmRNZXNzYWdlKGJvZHkubGFuZyB8fCAnZW4nKV19KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZygnMDAwJywgMCk7XG4gICAgICAgIGxldCB0ZWxlZ3JhbVVzZXI7XG4gICAgICAgIGlmIChib2R5Lm1ldGhvZCA9PT0gJ3RlbGVncmFtJykge1xuICAgICAgICAgICAgbGV0IG51bWJlciA9IHVzZXIuUGhvbmVOdW1iZXI7XG4gICAgICAgICAgICBpZiAobnVtYmVyLmNoYXJBdCgwKSA9PT0gJysnKSB7XG4gICAgICAgICAgICAgICAgbnVtYmVyID0gbnVtYmVyLnN1YnN0cmluZygxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRlbGVncmFtVXNlciA9IGF3YWl0IHRoaXMudGVsZWdyYW1TZXJ2ZXIudXNlckV4aXN0cyhuZXcgUmVnRXhwKCdeOHw3JyArIG51bWJlci5zdWJzdHJpbmcoMSkgKyAnJCcsICdpJykpO1xuICAgICAgICAgICAgaWYgKCF0ZWxlZ3JhbVVzZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHt1c2VyOiBbdGhpcy5nZXRNZXNzYWdlKGJvZHkubGFuZywgJ3RlbGVncmFtX2JvdF91bnJlZ2lzdGVyZWQnKV19KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIHVzZXIgZGVsZXRlIHRoZSBib3RcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy50ZWxlZ3JhZkFwcC50ZWxlZ3JhbS5zZW5kTWVzc2FnZSh0ZWxlZ3JhbVVzZXIuY2hhdElkLCAn0JfQtNGA0LDQstGB0YLQstGD0LnRgtC1Jyk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGUucmVzcG9uc2UgJiYgZS5yZXNwb25zZS5lcnJvcl9jb2RlID09PSA0MDMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih7c3RhdHVzOiAndGVsZWdyYW1fYm90X3VucmVnaXN0ZXJlZCd9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coJzAwMScsIDEpO1xuXG4gICAgICAgIC8vINC90LDRh9C40L3QsNC10Lwg0YHQu9GD0YjQsNGC0Ywg0LjQt9C80LXQvdC10L3QuNGPINCw0LTRgNC10YHQvtCyXG4gICAgICAgIGxldCBhZGRyZXNzZXMgPSBbdGhpcy5jaGFpblNlcnZpY2UuZ2V0QWRkcmVzcyh1c2VyLlBob25lTnVtYmVyLCBib2R5LnNlcnZpY2UpXTtcbiAgICAgICAgbGV0IHdzID0gdGhpcy5vcGVuV3NDb25uZWN0aW9uKGFkZHJlc3Nlcyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgbG9nID0gbmV3IFVzZXJMb2coKTtcbiAgICAgICAgICAgIGxvZy5BY3Rpb25UaW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKSAvIDEwMDA7XG4gICAgICAgICAgICBsb2cuRXhwaXJlZEF0ID0gdGhpcy50aW1lSGVscGVyLmdldFVuaXhUaW1lQWZ0ZXJNaW51dGVzKDcpO1xuICAgICAgICAgICAgbG9nLkV2ZW50ID0gYm9keS5ldmVudDtcbiAgICAgICAgICAgIGxvZy5NZXRob2QgPSBib2R5Lm1ldGhvZDtcbiAgICAgICAgICAgIGxvZy5TdGF0dXMgPSBib2R5LnJlc2VuZCA/ICdSRVNFTkRfQ09ERScgOiAnU0VORF9DT0RFJztcbiAgICAgICAgICAgIGxvZy5FbWJlZGVkID0gYm9keS5lbWJlZGVkO1xuICAgICAgICAgICAgbG9nLkNlcnQgPSBib2R5LmNlcnQ7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNoYWluU2VydmljZS5nZW5lcmF0ZUNvZGUodXNlci5QaG9uZU51bWJlciwgbG9nLCBib2R5LnNlcnZpY2UpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciB3aGlsZSBnZXR0aW5nIHVzZXJgLCBlKTtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuQkFEX0dBVEVXQVkpLmpzb24oe2Vycm9yOiAnRXJyb3Igc2VuZGluZyBjb2RlLid9KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZygnMTEnLCAxMSk7XG5cbiAgICAgICAgbGV0IHB1c2hUb2tlbiA9ICcnO1xuICAgICAgICBpZiAoYm9keS5tZXRob2QgPT09ICdwdXNoJyAmJiAhdXNlci5Jc1ZlcmlmaWVkKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHt1c2VyOiBbdGhpcy5nZXRNZXNzYWdlKGJvZHkubGFuZywgJ25vdF92ZXJpZmllZCcpXX0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0IHRmYVVzZXIgPSBhd2FpdCB0aGlzLmdldFVzZXIodXNlci5QaG9uZU51bWJlciwgJ3RmYScpO1xuICAgICAgICAgICAgaWYgKCF0ZmFVc2VyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih7dXNlcjogW3RoaXMuZ2V0TWVzc2FnZShib2R5LmxhbmcsICdub3RfdmVyaWZpZWQnKV19KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHB1c2hUb2tlbiA9IHRmYVVzZXIuUHVzaFRva2VuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKCcyMicsIDIyKTtcblxuICAgICAgICBsZXQgcmVzcG9uc2VTZW5kID0gZmFsc2U7XG4gICAgICAgIHdzLm9ubWVzc2FnZSA9IG1lc3MgPT4ge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UobWVzcy5kYXRhKTtcbiAgICAgICAgICAgIGZvciAobGV0IHN0YXRlQ2hhbmdlIG9mIGRhdGEuc3RhdGVfY2hhbmdlcykge1xuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZVNlbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7J2FjdGlvbic6ICd1bnN1YnNjcmliZSd9KSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYWRkcmVzc2VzLmluZGV4T2Yoc3RhdGVDaGFuZ2UuYWRkcmVzcykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCczMzMnLCAzMzMpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgdXNlckRlY29kZWQ7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyRGVjb2RlZCA9IG1lc3NhZ2VzU2VydmljZUNsaWVudC5Vc2VyLmRlY29kZShuZXcgQnVmZmVyKHN0YXRlQ2hhbmdlLnZhbHVlLCAnYmFzZTY0JykpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnVmVyaWZpY2F0aW9uQ29udHJvbGxlckBwb3N0Q29kZTogQ2FudCBkZWNvZGUgdXNlcicsIGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VTZW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoeydhY3Rpb24nOiAndW5zdWJzY3JpYmUnfSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih7dXNlcjogW3RoaXMuZ2V0TWVzc2FnZShib2R5LmxhbmcsICdlcnJvcl9kZWNvZGVfdXNlcl9iYycpXX0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh1c2VyRGVjb2RlZC5Mb2dzLmxlbmd0aCA+IHVzZXIuTG9ncy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGxvZzogVXNlckxvZyA9IHVzZXJEZWNvZGVkLkxvZ3NbX2dldExhdGVzdEluZGV4KE9iamVjdC5rZXlzKHVzZXJEZWNvZGVkLkxvZ3MpKV07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobG9nLlN0YXR1cyAhPT0gU0VORF9DT0RFICYmIGxvZy5TdGF0dXMgIT09IFJFU0VORF9DT0RFKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VTZW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2FjdGlvbic6ICd1bnN1YnNjcmliZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXI6IFsnQ29kZSB3YXMgbm90IHNlbmQgLSBsYXRlc3QgbG9nIGlzIG5vdCB3aXRoIHRoZSBjb2RlIHRvIHNlbmQuJ11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAobG9nLk1ldGhvZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3B1c2gnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvZGVRdWV1ZUxpc3RlbmVyU2VydmljZS5xdWV1ZVBVU0guYWRkKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiAn0JTQstGD0YXRhNCw0LrRgtC+0YDQvdCw0Y8g0LDQstGC0L7RgNC40LfQsNGG0LjRjycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBg0J/QvtC00YLQstC10YDQtNC40YLQtSDQstGF0L7QtCDQvdCwINGB0LXRgNCy0LjRgTogJyR7U2VydmljZXNbYm9keS5zZXJ2aWNlXX0nYCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZpY2U6IGJvZHkuc2VydmljZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHB1c2hfdG9rZW46IHB1c2hUb2tlblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnc21zJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb2RlUXVldWVMaXN0ZW5lclNlcnZpY2UucXVldWVTTVMuYWRkKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBob25lX251bWJlcjogdXNlci5QaG9uZU51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZpY2U6IGJvZHkuc2VydmljZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IGxvZy5Db2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAndGVsZWdyYW0nOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvZGVRdWV1ZUxpc3RlbmVyU2VydmljZS5xdWV1ZVRlbGVncmFtLmFkZCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGF0X2lkOiB0ZWxlZ3JhbVVzZXIuY2hhdElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ9CS0LDRiCDQutC+0LQg0L/QvtC00YLQstC10YDQttC00LXQvdC40Y8g0LTQu9GPINGB0LXRgNCy0LjRgdCwIFwiJyArIFNlcnZpY2VzW2JvZHkuc2VydmljZV0gKyAnXCI6ICcgKyBsb2cuQ29kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3doYXRzYXBwJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdG9kb1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBDaGFpbkNvbnRyb2xsZXJAZGVsaXZlckNvZGU6IG1ldGhvZCAke2xvZy5NZXRob2R9IGlzIG5vdCBzdXBwb3J0ZWQuYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7J2FjdGlvbic6ICd1bnN1YnNjcmliZSd9KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZVNlbmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5PSykuanNvbih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzZW5kX2Nvb2xkb3duOiA3ICogNjAsICAvLyDQmtC+0LvQuNGH0LXRgdGC0LLQviDRgdC10LrRg9C90LQg0LfQsCDQutC+0YLQvtGA0YvQtSDQvdCw0LTQviDQstCy0LXRgdGC0Lgg0LrQvtC0INC4INC30LAg0LrQvtGC0L7RgNGL0LUg0L3QtdC70YzQt9GPINC+0YLQv9GA0LDQstC40YLRjCDQutC+0LQg0L/QvtCy0YLQvtGA0L3QvlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogYm9keS5tZXRob2QsICAgICAgLy8g0JzQtdGC0L7QtCDQvtGC0L/RgNCw0LLQutC4IChpbjpwdXNoLHNtcyx0ZWxlZ3JhbSx3aGF0c2FwcClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6ICdzdWNjZXNzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB3cy5vbmNsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgJ2FjdGlvbic6ICd1bnN1YnNjcmliZSdcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBWZXJpZnkgdXNlcidzIGNvZGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSByZXNcbiAgICAgKiBAcGFyYW0ge1Bvc3RWZXJpZnlDb2RlRFRPfSBib2R5XG4gICAgICogQHJldHVybnMge1Byb21pc2U8dm9pZD59XG4gICAgICovXG4gICAgQFBvc3QoJ3ZlcmlmeS9jb2RlJylcbiAgICBhc3luYyBwb3N0VmVyaWZ5KEBSZXMoKSByZXMsIEBCb2R5KCkgYm9keTogUG9zdFZlcmlmeUNvZGVEVE8pIHtcbiAgICAgICAgbGV0IHYgPSBuZXcgVmFsaWRhdG9yKGJvZHksIHtcbiAgICAgICAgICAgIGV2ZW50OiAncmVxdWlyZWR8c3RyaW5nJyxcbiAgICAgICAgICAgIGxhbmc6ICdzdHJpbmcnLFxuICAgICAgICAgICAgY29kZTogJ3JlcXVpcmVkfG51bWJlcicsXG4gICAgICAgICAgICBzZXJ2aWNlOiAncmVxdWlyZWRJZk5vdDpwdXNoX3Rva2VufHN0cmluZ3xpbjprYXp0ZWwsZWdvdicsXG4gICAgICAgICAgICBwaG9uZV9udW1iZXI6ICdyZXF1aXJlZHxzdHJpbmd8cmVnZXg6L15cXFxcKz9bMS05XVxcXFxkezEsMTR9JC8nLFxuICAgICAgICAgICAgZW1iZWRlZDogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgLy8g0LjRgdC/0L7Qu9GM0LfRg9C10YLRgdGPINGC0L7Qu9GM0LrQviDQv9GA0Lgg0L7RgtC/0YDQsNCy0LrQtSDQvNC+0LHQuNC70YzQvdGL0Lwg0L/RgNC40LvQvtC20LXQvdC40LXQvCAtINC00LvRjyDRg9GB0YLQsNC90L7QstC60LUg0YHRgtCw0YLRg9GB0LAgUkVKRUNUXG4gICAgICAgICAgICBzdGF0dXM6ICdzdHJpbmcnLFxuICAgICAgICAgICAgbWV0aG9kOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGNsaWVudF90aW1lc3RhbXA6ICdyZXF1aXJlZCcsXG4gICAgICAgICAgICBjZXJ0OiAnbnVsbGFibGUnLFxuICAgICAgICB9LCB7J3NlcnZpY2UuaW4nOiBgTm8gc2VydmljZSB3aXRoIG5hbWU6ICR7Ym9keS5zZXJ2aWNlfWB9KTtcbiAgICAgICAgaWYgKHYuZmFpbHMoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih2LmdldEVycm9ycygpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyDQn9GA0L7QstC10YDQutCwLCDRgdGD0YnQtdGB0YLQstGD0LXRgiDQu9C4INC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjFxuICAgICAgICBsZXQgdXNlciA9IGF3YWl0IHRoaXMuZ2V0VXNlcihib2R5LnBob25lX251bWJlciwgYm9keS5zZXJ2aWNlKTtcbiAgICAgICAgaWYgKHVzZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuTk9UX0ZPVU5EKS5qc29uKHt1c2VyOiBbdGhpcy5nZXRVc2VyTm90Rm91bmRNZXNzYWdlKGJvZHkubGFuZyB8fCAnZW4nKV19KTtcbiAgICAgICAgfVxuICAgICAgICAvLyDQvdCw0YfQuNC90LDQtdC8INGB0LvRg9GI0LDRgtGMINC40LfQvNC10L3QtdC90LjRjyDQsNC00YDQtdGB0L7QslxuICAgICAgICBsZXQgYWRkcmVzc2VzID0gW1xuICAgICAgICAgICAgdGhpcy5jaGFpblNlcnZpY2UuZ2V0QWRkcmVzcyh1c2VyLlBob25lTnVtYmVyLCBib2R5LnNlcnZpY2UpLFxuICAgICAgICBdO1xuICAgICAgICBsZXQgd3MgPSB0aGlzLm9wZW5Xc0Nvbm5lY3Rpb24oYWRkcmVzc2VzKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCByZWplY3RTdGF0dXMgPSBudWxsO1xuICAgICAgICAgICAgaWYgKGJvZHkuc3RhdHVzICYmIGJvZHkuc3RhdHVzID09PSBSRUpFQ1QpIHtcbiAgICAgICAgICAgICAgICByZWplY3RTdGF0dXMgPSBSRUpFQ1Q7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgbG9nID0gbmV3IFVzZXJMb2coKTtcbiAgICAgICAgICAgIGxvZy5BY3Rpb25UaW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKSAvIDEwMDA7XG4gICAgICAgICAgICBsb2cuRXhwaXJlZEF0ID0gdGhpcy50aW1lSGVscGVyLmdldFVuaXhUaW1lQWZ0ZXJNaW51dGVzKDEpO1xuICAgICAgICAgICAgbG9nLkV2ZW50ID0gYm9keS5ldmVudDtcbiAgICAgICAgICAgIGxvZy5FbWJlZGVkID0gYm9keS5lbWJlZGVkO1xuICAgICAgICAgICAgbG9nLlN0YXR1cyA9IHJlamVjdFN0YXR1cyB8fCAnVkVSSUZZJztcbiAgICAgICAgICAgIGxvZy5Db2RlID0gYm9keS5jb2RlO1xuICAgICAgICAgICAgbG9nLkNlcnQgPSBib2R5LmNlcnQ7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNoYWluU2VydmljZS52ZXJpZnkodXNlci5QaG9uZU51bWJlciwgbG9nLCBib2R5LnNlcnZpY2UpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciB3aGlsZSBnZXR0aW5nIHVzZXJgLCBlKTtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuQkFEX0dBVEVXQVkpLmpzb24oe2Vycm9yOiAnRXJyb3IgY2hlY2tpbmcgY29kZS4nfSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJlc3BvbnNlU2VuZCA9IGZhbHNlO1xuICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgICAgIHdzLm9ubWVzc2FnZSA9IGFzeW5jIG1lc3MgPT4ge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UobWVzcy5kYXRhKTtcbiAgICAgICAgICAgIGZvciAobGV0IHN0YXRlQ2hhbmdlIG9mIGRhdGEuc3RhdGVfY2hhbmdlcykge1xuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZVNlbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7J2FjdGlvbic6ICd1bnN1YnNjcmliZSd9KSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYWRkcmVzc2VzLmluZGV4T2Yoc3RhdGVDaGFuZ2UuYWRkcmVzcykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IF91c2VyID0gbWVzc2FnZXNTZXJ2aWNlQ2xpZW50LlVzZXIuZGVjb2RlKG5ldyBCdWZmZXIoc3RhdGVDaGFuZ2UudmFsdWUsICdiYXNlNjQnKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChfdXNlci5Mb2dzLmxlbmd0aCA9PT0gdXNlci5Mb2dzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhdHVzID0gX3VzZXIuTG9nc1tfdXNlci5Mb2dzLmxlbmd0aCAtIDFdLlN0YXR1cztcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXR1cyA9PT0gVkFMSUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdfdXNlci5Mb2dzW191c2VyLkxvZ3MubGVuZ3RoIC0gMV0uTWV0aG9kJywgX3VzZXIuTG9nc1tfdXNlci5Mb2dzLmxlbmd0aCAtIDFdKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKF91c2VyLkxvZ3NbX3VzZXIuTG9ncy5sZW5ndGggLSAxXS5NZXRob2QgPT09ICd0ZWxlZ3JhbScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdGVsZWdyYW1Vc2VyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBudW1iZXIgPSB1c2VyLlBob25lTnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChudW1iZXIuY2hhckF0KDApID09PSAnKycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtYmVyID0gbnVtYmVyLnN1YnN0cmluZygxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVsZWdyYW1Vc2VyID0gYXdhaXQgc2VsZiAudGVsZWdyYW1TZXJ2ZXIudXNlckV4aXN0cyhuZXcgUmVnRXhwKCdeOHw3JyArIG51bWJlci5zdWJzdHJpbmcoMSkgKyAnJCcsICdpJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0ZWxlZ3JhbVVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZiAuY29kZVF1ZXVlTGlzdGVuZXJTZXJ2aWNlLnF1ZXVlVGVsZWdyYW0uYWRkKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYXRfaWQ6IHRlbGVncmFtVXNlci5jaGF0SWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAn0JLRiyDRg9GB0L/QtdGI0L3QviDQsNCy0YLQvtGA0LjQt9Cy0LDQu9C40YHRjCDQvdCwINGB0LXRgNCy0LjRgdC1IDJGQScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNlbmQgdXNlciB0byBjbGllbnQuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0b2RvINC+0YLRgNCw0LHQvtGC0LDRgtGMINCyINC80L7QvNC90LXRgiDQuNC90YLQtdCz0YDQsNGG0LjQuCDQt9Cw0L/RgNC+0YHRiyDQutC70LjQtdC90YLQsNC8INGB0LXRgNCy0LjRgdC+0LJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHN3aXRjaCAoYm9keS5zZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgY2FzZSAna2F6dGVsJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgcmVxdWVzdC5wb3N0KEVudkNvbmZpZy5LQVpURUxfQ0FMTEJBQ0tfVVJMKyAnL3JlZGlyZWN0X3VybCcsIHVzZXIpLnRoZW4ocj0+IGNvbnNvbGUubG9nKCdyZWRpcmVjdCBvY2N1cicpKVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBjYXNlICdlZ292JzpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgcmVxdWVzdC5wb3N0KEVudkNvbmZpZy5FR09WX0NBTExCQUNLX1VSTCsgJy9yZWRpcmVjdF91cmwnLCB1c2VyKS50aGVuKHI9PiBjb25zb2xlLmxvZygncmVkaXJlY3Qgb2NjdXInKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0b2RvIG1ha2UgcmVxdWVzdCB0byByZWRpcmVzdCB1cmwgd2l0aCB1c2VyIGRhdGFcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlU2VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHsnYWN0aW9uJzogJ3Vuc3Vic2NyaWJlJ30pKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVzcG9uZGUgdG8gdGhlIHZpZXdcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuT0spLmpzb24oe3N0YXR1czogJ1ZBTElEJywgdXNlcjogX3VzZXJ9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlU2VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHsnYWN0aW9uJzogJ3Vuc3Vic2NyaWJlJ30pKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXR1cyA9PT0gJ0VYUElSRUQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDQwKS5qc29uKHtzdGF0dXM6IHN0YXR1c30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5CQURfUkVRVUVTVCkuanNvbih7c3RhdHVzOiBzdGF0dXN9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBWZXJpZnkgaWYgdXNlciBleGlzdHNcbiAgICAgKlxuICAgICAqIEBwYXJhbSByZXNcbiAgICAgKiBAcGFyYW0ge1Bvc3RDb2RlRFRPfSBib2R5XG4gICAgICogQHJldHVybnMge1Byb21pc2U8dm9pZD59XG4gICAgICovXG4gICAgQFBvc3QoJ3ZlcmlmeS91c2VyJylcbiAgICBhc3luYyBwb3N0VmVyaWZ5VXNlcihAUmVzKCkgcmVzLCBAQm9keSgpIGJvZHk6IFBvc3RDb2RlRFRPKSB7XG4gICAgICAgIGxldCB2ID0gbmV3IFZhbGlkYXRvcihib2R5LCB7XG4gICAgICAgICAgICBsYW5nOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIHNlcnZpY2U6ICdyZXF1aXJlZElmTm90OnB1c2hfdG9rZW58c3RyaW5nfGluOmthenRlbCxlZ292JyxcbiAgICAgICAgICAgIHBob25lX251bWJlcjogJ3JlcXVpcmVkfHN0cmluZ3xyZWdleDovXlxcXFwrP1sxLTldXFxcXGR7MSwxNH0kLycsXG4gICAgICAgIH0sIHsnc2VydmljZS5pbic6IGBObyBzZXJ2aWNlIHdpdGggbmFtZTogJHtib2R5LnNlcnZpY2V9YH0pO1xuICAgICAgICBpZiAodi5mYWlscygpKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHYuZ2V0RXJyb3JzKCkpO1xuICAgICAgICB9XG4gICAgICAgIGxldCB1c2VyID0gYXdhaXQgdGhpcy5nZXRVc2VyKGJvZHkucGhvbmVfbnVtYmVyLCBib2R5LnNlcnZpY2UpO1xuICAgICAgICBpZiAodXNlciA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5OT1RfRk9VTkQpLmpzb24oe3VzZXI6IFt0aGlzLmdldFVzZXJOb3RGb3VuZE1lc3NhZ2UoYm9keS5sYW5nIHx8ICdlbicpXX0pO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG51bWJlciA9IGJvZHkucGhvbmVfbnVtYmVyO1xuICAgICAgICBpZiAobnVtYmVyLmNoYXJBdCgwKSA9PT0gJysnKSB7XG4gICAgICAgICAgICBudW1iZXIgPSBudW1iZXIuc3Vic3RyaW5nKDEpO1xuICAgICAgICB9XG4gICAgICAgIG51bWJlciA9IG51bWJlci5zdWJzdHJpbmcoMSk7XG4gICAgICAgIGxldCB1c2VyVGVsZWdyYW0gPSBhd2FpdCB0aGlzLnRlbGVncmFtU2VydmVyLnVzZXJFeGlzdHMobmV3IFJlZ0V4cCgnXjh8NycgKyBudW1iZXIgKyAnJCcsICdpJykpO1xuICAgICAgICAvLyB0b2RvIGRldmljZSBjaGVjayBlbWJlZGVkLCAgY2VydFxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk9LKS5qc29uKHtcbiAgICAgICAgICAgIHN0YXR1czogJ3N1Y2Nlc3MnLFxuICAgICAgICAgICAgcHVzaF90b2tlbjogdXNlci5QdXNoVG9rZW4gIT09ICcnLFxuICAgICAgICAgICAgcmVnaXN0ZXJlZF9pbl90ZWxlZ3JhbTogdXNlclRlbGVncmFtICE9PSBudWxsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFZlcmlmeSBpZiB1c2VyIGNvbmZpcm1lZCBvciByZWplY3RlZCB0aGUgdmVyaWZpY2F0aW9uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcmVxXG4gICAgICogQHBhcmFtIHJlc1xuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fVxuICAgICAqL1xuICAgIEBQb3N0KCdjaGVjay1wdXNoLXZlcmlmaWNhdGlvbicpXG4gICAgYXN5bmMgY2hlY2tQdXNoVmVyaWZpY2F0aW9uKEBSZXEoKSByZXEsIEBSZXMoKSByZXMpIHtcbiAgICAgICAgbGV0IHRmYVVzZXIgPSBhd2FpdCB0aGlzLmdldFVzZXIocmVxLmJvZHkucGhvbmVfbnVtYmVyLCAndGZhJyk7XG4gICAgICAgIGlmICghdGZhVXNlcil7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk9LKS5qc29uKHtzdGF0dXM6IGBOT19VU0VSYH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlZGlzS2V5ID0gYCR7dGZhVXNlci5QaG9uZU51bWJlcn06JHtSRURJU19VU0VSX1BVU0hfUkVTVUxUX1BPU1RGSVh9YDtcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgdGhpcy5yZWRpc0NsaWVudC5nZXRBc3luYyhyZWRpc0tleSk7XG4gICAgICAgIGlmIChzdGF0dXMgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5PSykuanNvbih7c3RhdHVzOiBgTk9UX1ZFUklGSUVEX1lFVGB9KTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0aGlzLnJlZGlzQ2xpZW50LmRlbChyZWRpc0tleSk7XG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuT0spLmpzb24oe3N0YXR1czogc3RhdHVzfSk7XG4gICAgfVxuXG4gICAgLyoqKlxuICAgICAqIEVudGVyIHRoZSBzZXJ2aWNlXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcmVzXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHNlcnZpY2VcbiAgICAgKi9cbiAgICBAR2V0KCdlbnRlcicpXG4gICAgZ2V0RW50ZXIoQFJlcygpIHJlcywgQFF1ZXJ5KCdldmVudCcpIGV2ZW50OiBzdHJpbmcsIEBRdWVyeSgnc2VydmljZScpIHNlcnZpY2U6IHN0cmluZykge1xuICAgICAgICBsZXQgdiA9IG5ldyBWYWxpZGF0b3Ioe1xuICAgICAgICAgICAgZXZlbnQ6IGV2ZW50LFxuICAgICAgICAgICAgc2VydmljZTogc2VydmljZVxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBldmVudDogJ3JlcXVpcmVkfHN0cmluZycsXG4gICAgICAgICAgICBzZXJ2aWNlOiAncmVxdWlyZWR8c3RyaW5nfGluOmthenRlbCxlZ292JyxcbiAgICAgICAgfSwgeydzZXJ2aWNlLmluJzogYE5vIHNlcnZpY2Ugd2l0aCBuYW1lOiAke3NlcnZpY2V9YH0pO1xuICAgICAgICBpZiAodi5mYWlscygpKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHYuZ2V0RXJyb3JzKCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXMucmVkaXJlY3QoYCR7RW52Q29uZmlnLkZST05URU5EX0FQSX0/c2VydmljZT0ke3NlcnZpY2V9JmV2ZW50PSR7ZXZlbnR9YCk7XG4gICAgfVxufSJdfQ==