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
            let responseSend = false;
            ws.onmessage = mess => {
                const data = JSON.parse(mess.data);
                for (let stateChange of data.state_changes) {
                    if (responseSend) {
                        ws.send(JSON.stringify({ 'action': 'unsubscribe' }));
                        break;
                    }
                    if (addresses.indexOf(stateChange.address) !== -1) {
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
                            const log = userDecoded.Logs[helpers_1.getLatestIndex(Object.keys(userDecoded.Logs))];
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvY29udHJvbGxzZXJzL3dlYi5jb250cm9sbGVyLnRzIiwic291cmNlcyI6WyIvaG9tZS9wZXNoa292L2Rldi9wcm9qZWN0cy9ibG9ja2NoYWluLTJmYS1iYWNrZW5kL3NyYy9tb2R1bGVzL2FwaS9jb250cm9sbHNlcnMvd2ViLmNvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDJDQUF3RjtBQUN4Riw2Q0FBMkM7QUFDM0MsNkNBQThDO0FBQzlDLG1GQUFzRTtBQUN0RSw2RUFBMEU7QUFDMUUseURBQWdIO0FBQ2hILHlGQUFrRjtBQUNsRiwrRkFBd0Y7QUFDeEYsdUVBQWlFO0FBQ2pFLHFFQUFnRTtBQUNoRSw0RUFBc0U7QUFDdEUsK0RBQWlFO0FBQ2pFLCtFQUFxRjtBQUNyRix5RUFBa0U7QUFDbEUsMkRBQXFEO0FBQ3JELGdGQUEwRTtBQUMxRSwrQkFBK0I7QUFDL0IsMkZBQW9GO0FBQ3BGLHNDQUFzQztBQUN0Qyw2Q0FBMkM7QUFFM0MsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3JDLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN6QixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUNoRCxNQUFNLHFCQUFxQixHQUFHLFdBQVcsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLGdDQUFnQyxDQUFDLENBQUMsQ0FBQztBQUk3RixJQUFhLGFBQWEsR0FBMUIsbUJBQTJCLFNBQVEsMEJBQWE7SUFHNUMsWUFBbUIsS0FBMkIsRUFDM0IsUUFBaUMsRUFDakMsTUFBNkIsRUFDN0IsWUFBMEIsRUFDekIsVUFBc0IsRUFDdEIsY0FBOEIsRUFDOUIsd0JBQWtEO1FBQ2xFLEtBQUssQ0FBQyxLQUFL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LEVBQU8sV0FBQSxhQUFJLEVBQUUsQ0FBQTs7NkNBQU8sMkJBQVc7OzZDQWtKbkQ7QUFVRDtJQURDLGFBQUksQ0FBQyxhQUFhLENBQUM7SUFDRixXQUFBLFlBQUcsRUFBRSxDQUFBLEVBQU8sV0FBQSxhQUFJLEVBQUUsQ0FBQTs7NkNBQU8sbUNBQWlCOzsrQ0F5RzNEO0FBVUQ7SUFEQyxhQUFJLENBQUMsYUFBYSxDQUFDO0lBQ0UsV0FBQSxZQUFHLEVBQUUsQ0FBQSxFQUFPLFdBQUEsYUFBSSxFQUFFLENBQUE7OzZDQUFPLDJCQUFXOzttREEyQnpEO0FBVUQ7SUFEQyxhQUFJLENBQUMseUJBQXlCLENBQUM7SUFDSCxXQUFBLFlBQUcsRUFBRSxDQUFBLEVBQU8sV0FBQSxZQUFHLEVBQUUsQ0FBQTs7OzswREFZN0M7QUFVRDtJQURDLFlBQUcsQ0FBQyxPQUFPLENBQUM7SUFDSCxXQUFBLFlBQUcsRUFBRSxDQUFBLEVBQU8sV0FBQSxjQUFLLENBQUMsT0FBTyxDQUFDLENBQUEsRUFBaUIsV0FBQSxjQUFLLENBQUMsU0FBUyxDQUFDLENBQUE7Ozs7NkNBWXBFO0FBN1dRLGFBQWE7SUFGekIsb0JBQVUsQ0FBQyxZQUFZLENBQUM7SUFDeEIsbUJBQVUsQ0FBQyxZQUFZLENBQUM7cUNBSUssNkNBQW9CO1FBQ2pCLG1EQUF1QjtRQUN6QiwrQ0FBcUI7UUFDZiw0QkFBWTtRQUNiLHdCQUFVO1FBQ04sZ0NBQWM7UUFDSix3Q0FBd0I7R0FUN0QsYUFBYSxDQThXekI7QUE5V1ksc0NBQWEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0JvZHksIENvbnRyb2xsZXIsIEdldCwgSHR0cFN0YXR1cywgUG9zdCwgUXVlcnksIFJlcSwgUmVzfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XG5pbXBvcnQge0FwaVVzZVRhZ3N9IGZyb20gJ0BuZXN0anMvc3dhZ2dlcic7XG5pbXBvcnQge0VudkNvbmZpZ30gZnJvbSAnLi4vLi4vLi4vY29uZmlnL2Vudic7XG5pbXBvcnQge1ZhbGlkYXRvcn0gZnJvbSAnLi4vLi4vLi4vc2VydmljZXMvaGVscGVycy92YWxpZGF0aW9uLmhlbHBlcic7XG5pbXBvcnQge1Bvc3RWZXJpZnlDb2RlRFRPfSBmcm9tICcuLi8uLi9zaGFyZWQvbW9kZWxzL2R0by9wb3N0LnZlcmlmeS5kdG8nO1xuaW1wb3J0IHtSRURJU19VU0VSX1BVU0hfUkVTVUxUX1BPU1RGSVgsIFJFSkVDVCwgUkVTRU5EX0NPREUsIFNFTkRfQ09ERSwgVkFMSUR9IGZyb20gJy4uLy4uLy4uL2NvbmZpZy9jb25zdGFudHMnO1xuaW1wb3J0IHtUZmFUcmFuc2FjdGlvbkZhbWlseX0gZnJvbSAnLi4vLi4vc2hhcmVkL2ZhbWlsaWVzL3RmYS50cmFuc2FjdGlvbi5mYW1pbHknO1xuaW1wb3J0IHtLYXp0ZWxUcmFuc2FjdGlvbkZhbWlseX0gZnJvbSAnLi4vLi4vc2hhcmVkL2ZhbWlsaWVzL2thenRlbC50cmFuc2FjdGlvbi5mYW1pbHknO1xuaW1wb3J0IHtUaW1lSGVscGVyfSBmcm9tICcuLi8uLi8uLi9zZXJ2aWNlcy9oZWxwZXJzL3RpbWUuaGVscGVyJztcbmltcG9ydCB7U2VydmljZXN9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL2NvZGVfc2VuZGVyL3NlcnZpY2VzJztcbmltcG9ydCB7Q2hhaW5TZXJ2aWNlfSBmcm9tICcuLi8uLi8uLi9zZXJ2aWNlcy9zYXd0b290aC9jaGFpbi5zZXJ2aWNlJztcbmltcG9ydCB7Z2V0TGF0ZXN0SW5kZXh9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL2hlbHBlcnMvaGVscGVycyc7XG5pbXBvcnQge0NvZGVRdWV1ZUxpc3RlbmVyU2VydmljZX0gZnJvbSAnLi4vLi4vLi4vc2VydmljZXMvY29kZV9zZW5kZXIvcXVldWUuc2VydmljZSc7XG5pbXBvcnQge1Bvc3RDb2RlRFRPfSBmcm9tICcuLi8uLi9zaGFyZWQvbW9kZWxzL2R0by9wb3N0LmNvZGUuZHRvJztcbmltcG9ydCB7VXNlckxvZ30gZnJvbSAnLi4vLi4vc2hhcmVkL21vZGVscy91c2VyLmxvZyc7XG5pbXBvcnQge1RlbGVncmFtU2VydmVyfSBmcm9tICcuLi8uLi8uLi9zZXJ2aWNlcy90ZWxlZ3JhbS90ZWxlZ3JhbS5zZXJ2ZXInO1xuaW1wb3J0ICogYXMgcmVkaXMgZnJvbSAncmVkaXMnO1xuaW1wb3J0IHtFZ292VHJhbnNhY3Rpb25GYW1pbHl9IGZyb20gJy4uLy4uL3NoYXJlZC9mYW1pbGllcy9lZ292LnRyYW5zYWN0aW9uLmZhbWlseSc7XG5pbXBvcnQgKiBhcyBQcm9taXNlZnkgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHtBcGlDb250cm9sbGVyfSBmcm9tICcuL2NvbnRyb2xsZXInO1xuXG5jb25zdCBUZWxlZ3JhZiA9IHJlcXVpcmUoJ3RlbGVncmFmJyk7XG5jb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG5jb25zdCBwcm90b2J1ZkxpYiA9IHJlcXVpcmUoJ3Byb3RvY29sLWJ1ZmZlcnMnKTtcbmNvbnN0IG1lc3NhZ2VzU2VydmljZUNsaWVudCA9IHByb3RvYnVmTGliKGZzLnJlYWRGaWxlU3luYygnc3JjL3Byb3RvL3NlcnZpY2VfY2xpZW50LnByb3RvJykpO1xuXG5AQXBpVXNlVGFncygndjEvYXBpL3dlYicpXG5AQ29udHJvbGxlcigndjEvYXBpL3dlYicpXG5leHBvcnQgY2xhc3MgV2ViQ29udHJvbGxlciBleHRlbmRzIEFwaUNvbnRyb2xsZXJ7XG4gICAgcHJpdmF0ZSB0ZWxlZ3JhZkFwcDogYW55O1xuXG4gICAgY29uc3RydWN0b3IocHVibGljIHRmYVRGOiBUZmFUcmFuc2FjdGlvbkZhbWlseSxcbiAgICAgICAgICAgICAgICBwdWJsaWMga2F6dGVsVEY6IEthenRlbFRyYW5zYWN0aW9uRmFtaWx5LFxuICAgICAgICAgICAgICAgIHB1YmxpYyBlZ292VEY6IEVnb3ZUcmFuc2FjdGlvbkZhbWlseSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgY2hhaW5TZXJ2aWNlOiBDaGFpblNlcnZpY2UsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSB0aW1lSGVscGVyOiBUaW1lSGVscGVyLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgdGVsZWdyYW1TZXJ2ZXI6IFRlbGVncmFtU2VydmVyLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgY29kZVF1ZXVlTGlzdGVuZXJTZXJ2aWNlOiBDb2RlUXVldWVMaXN0ZW5lclNlcnZpY2UpIHtcbiAgICAgICAgc3VwZXIodGZhVEYsIGthenRlbFRGLCBlZ292VEYpO1xuICAgICAgICB0aGlzLnRlbGVncmFmQXBwID0gbmV3IFRlbGVncmFmKEVudkNvbmZpZy5URUxFR1JBTV9CT1RfS0VZKTtcbiAgICAgICAgUHJvbWlzZWZ5LnByb21pc2lmeUFsbChyZWRpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VuZCBjb2RlIHRvIHVzZXJcbiAgICAgKlxuICAgICAqIEBwYXJhbSByZXNcbiAgICAgKiBAcGFyYW0ge1Bvc3RDb2RlRFRPfSBib2R5XG4gICAgICogQHJldHVybnMge1Byb21pc2U8dm9pZD59XG4gICAgICovXG4gICAgQFBvc3QoJ2NvZGUnKVxuICAgIGFzeW5jIHBvc3RDb2RlKEBSZXMoKSByZXMsIEBCb2R5KCkgYm9keTogUG9zdENvZGVEVE8pIHtcbiAgICAgICAgbGV0IHYgPSBuZXcgVmFsaWRhdG9yKGJvZHksIHtcbiAgICAgICAgICAgIGV2ZW50OiAncmVxdWlyZWR8c3RyaW5nJyxcbiAgICAgICAgICAgIGxhbmc6ICdudWxsYWJsZXxzdHJpbmcnLFxuICAgICAgICAgICAgbWV0aG9kOiAncmVxdWlyZWR8c3RyaW5nfGluOnNtcyxwdXNoLHRlbGVncmFtLHdoYXRzYXBwJyxcbiAgICAgICAgICAgIHNlcnZpY2U6ICdyZXF1aXJlZElmTm90OnB1c2hfdG9rZW58c3RyaW5nfGluOmthenRlbCxlZ292JyxcbiAgICAgICAgICAgIHBob25lX251bWJlcjogJ3JlcXVpcmVkfHN0cmluZ3xyZWdleDovXlxcXFwrP1sxLTldXFxcXGR7MSwxNH0kLycsXG4gICAgICAgICAgICBlbWJlZGVkOiAnYm9vbGVhbicsXG4gICAgICAgICAgICBjbGllbnRfdGltZXN0YW1wOiAncmVxdWlyZWQnLFxuICAgICAgICAgICAgY2VydDogJ251bGxhYmxlJyxcbiAgICAgICAgICAgIHJlc2VuZDogJ251bGxhYmxlfGJvb2xlYW4nLFxuICAgICAgICB9LCB7J3NlcnZpY2UuaW4nOiBgTm8gc2VydmljZSB3aXRoIG5hbWU6ICR7Ym9keS5zZXJ2aWNlfWB9KTtcbiAgICAgICAgaWYgKHYuZmFpbHMoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih2LmdldEVycm9ycygpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyDQn9GA0L7QstC10YDQutCwLCDRgdGD0YnQtdGB0YLQstGD0LXRgiDQu9C4INC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjFxuICAgICAgICBsZXQgdXNlciA9IGF3YWl0IHRoaXMuZ2V0VXNlcihib2R5LnBob25lX251bWJlciwgYm9keS5zZXJ2aWNlKTtcbiAgICAgICAgaWYgKHVzZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuTk9UX0ZPVU5EKS5qc29uKHt1c2VyOiBbdGhpcy5nZXRVc2VyTm90Rm91bmRNZXNzYWdlKGJvZHkubGFuZyB8fCAnZW4nKV19KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB0ZWxlZ3JhbVVzZXI7XG4gICAgICAgIGlmIChib2R5Lm1ldGhvZCA9PT0gJ3RlbGVncmFtJykge1xuICAgICAgICAgICAgbGV0IG51bWJlciA9IHVzZXIuUGhvbmVOdW1iZXI7XG4gICAgICAgICAgICBpZiAobnVtYmVyLmNoYXJBdCgwKSA9PT0gJysnKSB7XG4gICAgICAgICAgICAgICAgbnVtYmVyID0gbnVtYmVyLnN1YnN0cmluZygxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRlbGVncmFtVXNlciA9IGF3YWl0IHRoaXMudGVsZWdyYW1TZXJ2ZXIudXNlckV4aXN0cyhuZXcgUmVnRXhwKCdeOHw3JyArIG51bWJlci5zdWJzdHJpbmcoMSkgKyAnJCcsICdpJykpO1xuICAgICAgICAgICAgaWYgKCF0ZWxlZ3JhbVVzZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHt1c2VyOiBbdGhpcy5nZXRNZXNzYWdlKGJvZHkubGFuZywgJ3RlbGVncmFtX2JvdF91bnJlZ2lzdGVyZWQnKV19KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIHVzZXIgZGVsZXRlIHRoZSBib3RcbiAgICAgICAgICAgIC8vINCf0L7Qu9GM0LfQvtCy0LDRgtC10LvRjCDQvNC+0LbQtdGCINGD0LTQsNC70LjRgtGMINGH0LDRgiDQsiDRgtC10LvQtdCz0YDQsNC80LzQtSAtINC10LTQuNC90YHRgtCy0LXQvdC90YvQuSDRgdC/0L7RgdC+0LEg0YPQt9C90LDRgtGMLFxuICAgICAgICAgICAgLy8g0YPQtNCw0LvQuNC70Lgg0L/QvtC70YzQt9C+0LLQsNC10LvRjCDRh9Cw0YIg0LjQu9C4INC90LXRgiAtINC+0YLQv9GA0LDQstC40YLRjCDQtdC80YMg0YHQvtC+0LHRidC10L3QuNC1LCDQtdGB0LvQuCDRgdC+0L7QsdGJ0LXQvdC40LVcbiAgICAgICAgICAgIC8vINC+0YLQv9GA0LDQstC40LvQvtGB0Ywg0LHQtdC3INC+0YjQuNCx0LrQuCAtINC30L3QsNGH0LjRgiDRh9Cw0YIg0YHRg9GJ0LXRgdCy0YPQtdGCINC/0L7RjdGC0L7QvNGDINGC0LDQuiDQvNGLINC/0YDQvtCy0LXRgNGP0LXQvFxuICAgICAgICAgICAgLy8g0YPQtNCw0LvQuNC7INC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjCDRh9Cw0YIg0LjQu9C4INC90LXRglxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnRlbGVncmFmQXBwLnRlbGVncmFtLnNlbmRNZXNzYWdlKHRlbGVncmFtVXNlci5jaGF0SWQsICfQl9C00YDQsNCy0YHRgtCy0YPQudGC0LUnKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZS5yZXNwb25zZSAmJiBlLnJlc3BvbnNlLmVycm9yX2NvZGUgPT09IDQwMykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHtzdGF0dXM6ICd0ZWxlZ3JhbV9ib3RfdW5yZWdpc3RlcmVkJ30pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsZXQgcHVzaFRva2VuID0gJyc7XG4gICAgICAgIGlmIChib2R5Lm1ldGhvZCA9PT0gJ3B1c2gnICYmICF1c2VyLklzVmVyaWZpZWQpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFkpLmpzb24oe3VzZXI6IFt0aGlzLmdldE1lc3NhZ2UoYm9keS5sYW5nLCAnbm90X3ZlcmlmaWVkJyldfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgdGZhVXNlciA9IGF3YWl0IHRoaXMuZ2V0VXNlcih1c2VyLlBob25lTnVtYmVyLCAndGZhJyk7XG4gICAgICAgICAgICBpZiAoIXRmYVVzZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHt1c2VyOiBbdGhpcy5nZXRNZXNzYWdlKGJvZHkubGFuZywgJ25vdF92ZXJpZmllZCcpXX0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcHVzaFRva2VuID0gdGZhVXNlci5QdXNoVG9rZW47XG4gICAgICAgIH1cbiAgICAgICAgLy8g0L3QsNGH0LjQvdCw0LXQvCDRgdC70YPRiNCw0YLRjCDQuNC30LzQtdC90LXQvdC40Y8g0LDQtNGA0LXRgdC+0LJcbiAgICAgICAgbGV0IGFkZHJlc3NlcyA9IFt0aGlzLmNoYWluU2VydmljZS5nZXRBZGRyZXNzKHVzZXIuUGhvbmVOdW1iZXIsIGJvZHkuc2VydmljZSldO1xuICAgICAgICBsZXQgd3MgPSB0aGlzLm9wZW5Xc0Nvbm5lY3Rpb24oYWRkcmVzc2VzKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBsb2cgPSBuZXcgVXNlckxvZygpO1xuICAgICAgICAgICAgbG9nLkFjdGlvblRpbWUgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpIC8gMTAwMDtcbiAgICAgICAgICAgIGxvZy5FeHBpcmVkQXQgPSB0aGlzLnRpbWVIZWxwZXIuZ2V0VW5peFRpbWVBZnRlck1pbnV0ZXMoNyk7XG4gICAgICAgICAgICBsb2cuRXZlbnQgPSBib2R5LmV2ZW50O1xuICAgICAgICAgICAgbG9nLk1ldGhvZCA9IGJvZHkubWV0aG9kO1xuICAgICAgICAgICAgbG9nLlN0YXR1cyA9IGJvZHkucmVzZW5kID8gJ1JFU0VORF9DT0RFJyA6ICdTRU5EX0NPREUnO1xuICAgICAgICAgICAgbG9nLkVtYmVkZWQgPSBib2R5LmVtYmVkZWQ7XG4gICAgICAgICAgICBsb2cuQ2VydCA9IGJvZHkuY2VydDtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY2hhaW5TZXJ2aWNlLmdlbmVyYXRlQ29kZSh1c2VyLlBob25lTnVtYmVyLCBsb2csIGJvZHkuc2VydmljZSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHdoaWxlIGdldHRpbmcgdXNlcmAsIGUpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5CQURfR0FURVdBWSkuanNvbih7ZXJyb3I6ICdFcnJvciBzZW5kaW5nIGNvZGUuJ30pO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHJlc3BvbnNlU2VuZCA9IGZhbHNlO1xuICAgICAgICB3cy5vbm1lc3NhZ2UgPSBtZXNzID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKG1lc3MuZGF0YSk7XG4gICAgICAgICAgICBmb3IgKGxldCBzdGF0ZUNoYW5nZSBvZiBkYXRhLnN0YXRlX2NoYW5nZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2VTZW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoeydhY3Rpb24nOiAndW5zdWJzY3JpYmUnfSkpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGFkZHJlc3Nlcy5pbmRleE9mKHN0YXRlQ2hhbmdlLmFkZHJlc3MpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgdXNlckRlY29kZWQ7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyRGVjb2RlZCA9IG1lc3NhZ2VzU2VydmljZUNsaWVudC5Vc2VyLmRlY29kZShuZXcgQnVmZmVyKHN0YXRlQ2hhbmdlLnZhbHVlLCAnYmFzZTY0JykpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnVmVyaWZpY2F0aW9uQ29udHJvbGxlckBwb3N0Q29kZTogQ2FudCBkZWNvZGUgdXNlcicsIGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VTZW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoeydhY3Rpb24nOiAndW5zdWJzY3JpYmUnfSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih7dXNlcjogW3RoaXMuZ2V0TWVzc2FnZShib2R5LmxhbmcsICdlcnJvcl9kZWNvZGVfdXNlcl9iYycpXX0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh1c2VyRGVjb2RlZC5Mb2dzLmxlbmd0aCA+IHVzZXIuTG9ncy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGxvZzogVXNlckxvZyA9IHVzZXJEZWNvZGVkLkxvZ3NbZ2V0TGF0ZXN0SW5kZXgoT2JqZWN0LmtleXModXNlckRlY29kZWQuTG9ncykpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsb2cuU3RhdHVzICE9PSBTRU5EX0NPREUgJiYgbG9nLlN0YXR1cyAhPT0gUkVTRU5EX0NPREUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZVNlbmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnYWN0aW9uJzogJ3Vuc3Vic2NyaWJlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlcjogWydDb2RlIHdhcyBub3Qgc2VuZCAtIGxhdGVzdCBsb2cgaXMgbm90IHdpdGggdGhlIGNvZGUgdG8gc2VuZC4nXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChsb2cuTWV0aG9kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAncHVzaCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29kZVF1ZXVlTGlzdGVuZXJTZXJ2aWNlLnF1ZXVlUFVTSC5hZGQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICfQlNCy0YPRhdGE0LDQutGC0L7RgNC90LDRjyDQsNCy0YLQvtGA0LjQt9Cw0YbQuNGPJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGDQn9C+0LTRgtCy0LXRgNC00LjRgtC1INCy0YXQvtC0INC90LAg0YHQtdGA0LLQuNGBOiAnJHtTZXJ2aWNlc1tib2R5LnNlcnZpY2VdfSdgLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VydmljZTogYm9keS5zZXJ2aWNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHVzaF90b2tlbjogcHVzaFRva2VuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdzbXMnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvZGVRdWV1ZUxpc3RlbmVyU2VydmljZS5xdWV1ZVNNUy5hZGQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGhvbmVfbnVtYmVyOiB1c2VyLlBob25lTnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VydmljZTogYm9keS5zZXJ2aWNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogbG9nLkNvZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICd0ZWxlZ3JhbSc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29kZVF1ZXVlTGlzdGVuZXJTZXJ2aWNlLnF1ZXVlVGVsZWdyYW0uYWRkKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYXRfaWQ6IHRlbGVncmFtVXNlci5jaGF0SWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAn0JLQsNGIINC60L7QtCDQv9C+0LTRgtCy0LXRgNC20LTQtdC90LjRjyDQtNC70Y8g0YHQtdGA0LLQuNGB0LAgXCInICsgU2VydmljZXNbYm9keS5zZXJ2aWNlXSArICdcIjogJyArIGxvZy5Db2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnd2hhdHNhcHAnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0b2RvXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYENoYWluQ29udHJvbGxlckBkZWxpdmVyQ29kZTogbWV0aG9kICR7bG9nLk1ldGhvZH0gaXMgbm90IHN1cHBvcnRlZC5gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHsnYWN0aW9uJzogJ3Vuc3Vic2NyaWJlJ30pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlU2VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk9LKS5qc29uKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNlbmRfY29vbGRvd246IDcgKiA2MCwgIC8vINCa0L7Qu9C40YfQtdGB0YLQstC+INGB0LXQutGD0L3QtCDQt9CwINC60L7RgtC+0YDRi9C1INC90LDQtNC+INCy0LLQtdGB0YLQuCDQutC+0LQg0Lgg0LfQsCDQutC+0YLQvtGA0YvQtSDQvdC10LvRjNC30Y8g0L7RgtC/0YDQsNCy0LjRgtGMINC60L7QtCDQv9C+0LLRgtC+0YDQvdC+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBib2R5Lm1ldGhvZCwgICAgICAvLyDQnNC10YLQvtC0INC+0YLQv9GA0LDQstC60LggKGluOnB1c2gsc21zLHRlbGVncmFtLHdoYXRzYXBwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogJ3N1Y2Nlc3MnLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHdzLm9uY2xvc2UgPSAoKSA9PiB7XG4gICAgICAgICAgICB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICAnYWN0aW9uJzogJ3Vuc3Vic2NyaWJlJ1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFZlcmlmeSB1c2VyJ3MgY29kZVxuICAgICAqXG4gICAgICogQHBhcmFtIHJlc1xuICAgICAqIEBwYXJhbSB7UG9zdFZlcmlmeUNvZGVEVE99IGJvZHlcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn1cbiAgICAgKi9cbiAgICBAUG9zdCgndmVyaWZ5L2NvZGUnKVxuICAgIGFzeW5jIHBvc3RWZXJpZnkoQFJlcygpIHJlcywgQEJvZHkoKSBib2R5OiBQb3N0VmVyaWZ5Q29kZURUTykge1xuICAgICAgICBsZXQgdiA9IG5ldyBWYWxpZGF0b3IoYm9keSwge1xuICAgICAgICAgICAgZXZlbnQ6ICdyZXF1aXJlZHxzdHJpbmcnLFxuICAgICAgICAgICAgbGFuZzogJ3N0cmluZycsXG4gICAgICAgICAgICBjb2RlOiAncmVxdWlyZWR8bnVtYmVyJyxcbiAgICAgICAgICAgIHNlcnZpY2U6ICdyZXF1aXJlZElmTm90OnB1c2hfdG9rZW58c3RyaW5nfGluOmthenRlbCxlZ292JyxcbiAgICAgICAgICAgIHBob25lX251bWJlcjogJ3JlcXVpcmVkfHN0cmluZ3xyZWdleDovXlxcXFwrP1sxLTldXFxcXGR7MSwxNH0kLycsXG4gICAgICAgICAgICBlbWJlZGVkOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAvLyDQuNGB0L/QvtC70YzQt9GD0LXRgtGB0Y8g0YLQvtC70YzQutC+INC/0YDQuCDQvtGC0L/RgNCw0LLQutC1INC80L7QsdC40LvRjNC90YvQvCDQv9GA0LjQu9C+0LbQtdC90LjQtdC8IC0g0LTQu9GPINGD0YHRgtCw0L3QvtCy0LrQtSDRgdGC0LDRgtGD0YHQsCBSRUpFQ1RcbiAgICAgICAgICAgIHN0YXR1czogJ3N0cmluZycsXG4gICAgICAgICAgICBtZXRob2Q6ICdzdHJpbmcnLFxuICAgICAgICAgICAgY2xpZW50X3RpbWVzdGFtcDogJ3JlcXVpcmVkJyxcbiAgICAgICAgICAgIGNlcnQ6ICdudWxsYWJsZScsXG4gICAgICAgIH0sIHsnc2VydmljZS5pbic6IGBObyBzZXJ2aWNlIHdpdGggbmFtZTogJHtib2R5LnNlcnZpY2V9YH0pO1xuICAgICAgICBpZiAodi5mYWlscygpKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHYuZ2V0RXJyb3JzKCkpO1xuICAgICAgICB9XG4gICAgICAgIC8vINCf0YDQvtCy0LXRgNC60LAsINGB0YPRidC10YHRgtCy0YPQtdGCINC70Lgg0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GMXG4gICAgICAgIGxldCB1c2VyID0gYXdhaXQgdGhpcy5nZXRVc2VyKGJvZHkucGhvbmVfbnVtYmVyLCBib2R5LnNlcnZpY2UpO1xuICAgICAgICBpZiAodXNlciA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5OT1RfRk9VTkQpLmpzb24oe3VzZXI6IFt0aGlzLmdldFVzZXJOb3RGb3VuZE1lc3NhZ2UoYm9keS5sYW5nIHx8ICdlbicpXX0pO1xuICAgICAgICB9XG4gICAgICAgIC8vINC90LDRh9C40L3QsNC10Lwg0YHQu9GD0YjQsNGC0Ywg0LjQt9C80LXQvdC10L3QuNGPINCw0LTRgNC10YHQvtCyXG4gICAgICAgIGxldCBhZGRyZXNzZXMgPSBbXG4gICAgICAgICAgICB0aGlzLmNoYWluU2VydmljZS5nZXRBZGRyZXNzKHVzZXIuUGhvbmVOdW1iZXIsIGJvZHkuc2VydmljZSksXG4gICAgICAgIF07XG4gICAgICAgIGxldCB3cyA9IHRoaXMub3BlbldzQ29ubmVjdGlvbihhZGRyZXNzZXMpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHJlamVjdFN0YXR1cyA9IG51bGw7XG4gICAgICAgICAgICBpZiAoYm9keS5zdGF0dXMgJiYgYm9keS5zdGF0dXMgPT09IFJFSkVDVCkge1xuICAgICAgICAgICAgICAgIHJlamVjdFN0YXR1cyA9IFJFSkVDVDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBsb2cgPSBuZXcgVXNlckxvZygpO1xuICAgICAgICAgICAgbG9nLkFjdGlvblRpbWUgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpIC8gMTAwMDtcbiAgICAgICAgICAgIGxvZy5FeHBpcmVkQXQgPSB0aGlzLnRpbWVIZWxwZXIuZ2V0VW5peFRpbWVBZnRlck1pbnV0ZXMoMSk7XG4gICAgICAgICAgICBsb2cuRXZlbnQgPSBib2R5LmV2ZW50O1xuICAgICAgICAgICAgbG9nLkVtYmVkZWQgPSBib2R5LmVtYmVkZWQ7XG4gICAgICAgICAgICBsb2cuU3RhdHVzID0gcmVqZWN0U3RhdHVzIHx8ICdWRVJJRlknO1xuICAgICAgICAgICAgbG9nLkNvZGUgPSBib2R5LmNvZGU7XG4gICAgICAgICAgICBsb2cuQ2VydCA9IGJvZHkuY2VydDtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY2hhaW5TZXJ2aWNlLnZlcmlmeSh1c2VyLlBob25lTnVtYmVyLCBsb2csIGJvZHkuc2VydmljZSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHdoaWxlIGdldHRpbmcgdXNlcmAsIGUpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5CQURfR0FURVdBWSkuanNvbih7ZXJyb3I6ICdFcnJvciBjaGVja2luZyBjb2RlLid9KTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcmVzcG9uc2VTZW5kID0gZmFsc2U7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcztcbiAgICAgICAgd3Mub25tZXNzYWdlID0gYXN5bmMgbWVzcyA9PiB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShtZXNzLmRhdGEpO1xuICAgICAgICAgICAgZm9yIChsZXQgc3RhdGVDaGFuZ2Ugb2YgZGF0YS5zdGF0ZV9jaGFuZ2VzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlU2VuZCkge1xuICAgICAgICAgICAgICAgICAgICB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHsnYWN0aW9uJzogJ3Vuc3Vic2NyaWJlJ30pKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhZGRyZXNzZXMuaW5kZXhPZihzdGF0ZUNoYW5nZS5hZGRyZXNzKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgX3VzZXIgPSBtZXNzYWdlc1NlcnZpY2VDbGllbnQuVXNlci5kZWNvZGUobmV3IEJ1ZmZlcihzdGF0ZUNoYW5nZS52YWx1ZSwgJ2Jhc2U2NCcpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF91c2VyLkxvZ3MubGVuZ3RoID09PSB1c2VyLkxvZ3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGF0dXMgPSBfdXNlci5Mb2dzW191c2VyLkxvZ3MubGVuZ3RoIC0gMV0uU3RhdHVzO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RhdHVzID09PSBWQUxJRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKF91c2VyLkxvZ3NbX3VzZXIuTG9ncy5sZW5ndGggLSAxXS5NZXRob2QgPT09ICd0ZWxlZ3JhbScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdGVsZWdyYW1Vc2VyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBudW1iZXIgPSB1c2VyLlBob25lTnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChudW1iZXIuY2hhckF0KDApID09PSAnKycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtYmVyID0gbnVtYmVyLnN1YnN0cmluZygxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVsZWdyYW1Vc2VyID0gYXdhaXQgc2VsZiAudGVsZWdyYW1TZXJ2ZXIudXNlckV4aXN0cyhuZXcgUmVnRXhwKCdeOHw3JyArIG51bWJlci5zdWJzdHJpbmcoMSkgKyAnJCcsICdpJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0ZWxlZ3JhbVVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZiAuY29kZVF1ZXVlTGlzdGVuZXJTZXJ2aWNlLnF1ZXVlVGVsZWdyYW0uYWRkKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYXRfaWQ6IHRlbGVncmFtVXNlci5jaGF0SWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAn0JLRiyDRg9GB0L/QtdGI0L3QviDQsNCy0YLQvtGA0LjQt9Cy0LDQu9C40YHRjCDQvdCwINGB0LXRgNCy0LjRgdC1IDJGQScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNlbmQgdXNlciB0byBjbGllbnQuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0b2RvINC+0YLRgNCw0LHQvtGC0LDRgtGMINCyINC80L7QvNC90LXRgiDQuNC90YLQtdCz0YDQsNGG0LjQuCDQt9Cw0L/RgNC+0YHRiyDQutC70LjQtdC90YLQsNC8INGB0LXRgNCy0LjRgdC+0LJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHN3aXRjaCAoYm9keS5zZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgY2FzZSAna2F6dGVsJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgcmVxdWVzdC5wb3N0KEVudkNvbmZpZy5LQVpURUxfQ0FMTEJBQ0tfVVJMKyAnL3JlZGlyZWN0X3VybCcsIHVzZXIpLnRoZW4ocj0+IGNvbnNvbGUubG9nKCdyZWRpcmVjdCBvY2N1cicpKVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBjYXNlICdlZ292JzpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgcmVxdWVzdC5wb3N0KEVudkNvbmZpZy5FR09WX0NBTExCQUNLX1VSTCsgJy9yZWRpcmVjdF91cmwnLCB1c2VyKS50aGVuKHI9PiBjb25zb2xlLmxvZygncmVkaXJlY3Qgb2NjdXInKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0b2RvIG1ha2UgcmVxdWVzdCB0byByZWRpcmVzdCB1cmwgd2l0aCB1c2VyIGRhdGFcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlU2VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHsnYWN0aW9uJzogJ3Vuc3Vic2NyaWJlJ30pKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVzcG9uZGUgdG8gdGhlIHZpZXdcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuT0spLmpzb24oe3N0YXR1czogJ1ZBTElEJywgdXNlcjogX3VzZXJ9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlU2VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHsnYWN0aW9uJzogJ3Vuc3Vic2NyaWJlJ30pKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXR1cyA9PT0gJ0VYUElSRUQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDQwKS5qc29uKHtzdGF0dXM6IHN0YXR1c30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5CQURfUkVRVUVTVCkuanNvbih7c3RhdHVzOiBzdGF0dXN9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBWZXJpZnkgaWYgdXNlciBleGlzdHNcbiAgICAgKlxuICAgICAqIEBwYXJhbSByZXNcbiAgICAgKiBAcGFyYW0ge1Bvc3RDb2RlRFRPfSBib2R5XG4gICAgICogQHJldHVybnMge1Byb21pc2U8dm9pZD59XG4gICAgICovXG4gICAgQFBvc3QoJ3ZlcmlmeS91c2VyJylcbiAgICBhc3luYyBwb3N0VmVyaWZ5VXNlcihAUmVzKCkgcmVzLCBAQm9keSgpIGJvZHk6IFBvc3RDb2RlRFRPKSB7XG4gICAgICAgIGxldCB2ID0gbmV3IFZhbGlkYXRvcihib2R5LCB7XG4gICAgICAgICAgICBsYW5nOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIHNlcnZpY2U6ICdyZXF1aXJlZElmTm90OnB1c2hfdG9rZW58c3RyaW5nfGluOmthenRlbCxlZ292JyxcbiAgICAgICAgICAgIHBob25lX251bWJlcjogJ3JlcXVpcmVkfHN0cmluZ3xyZWdleDovXlxcXFwrP1sxLTldXFxcXGR7MSwxNH0kLycsXG4gICAgICAgIH0sIHsnc2VydmljZS5pbic6IGBObyBzZXJ2aWNlIHdpdGggbmFtZTogJHtib2R5LnNlcnZpY2V9YH0pO1xuICAgICAgICBpZiAodi5mYWlscygpKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHYuZ2V0RXJyb3JzKCkpO1xuICAgICAgICB9XG4gICAgICAgIGxldCB1c2VyID0gYXdhaXQgdGhpcy5nZXRVc2VyKGJvZHkucGhvbmVfbnVtYmVyLCBib2R5LnNlcnZpY2UpO1xuICAgICAgICBpZiAodXNlciA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5OT1RfRk9VTkQpLmpzb24oe3VzZXI6IFt0aGlzLmdldFVzZXJOb3RGb3VuZE1lc3NhZ2UoYm9keS5sYW5nIHx8ICdlbicpXX0pO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG51bWJlciA9IGJvZHkucGhvbmVfbnVtYmVyO1xuICAgICAgICBpZiAobnVtYmVyLmNoYXJBdCgwKSA9PT0gJysnKSB7XG4gICAgICAgICAgICBudW1iZXIgPSBudW1iZXIuc3Vic3RyaW5nKDEpO1xuICAgICAgICB9XG4gICAgICAgIG51bWJlciA9IG51bWJlci5zdWJzdHJpbmcoMSk7XG4gICAgICAgIGxldCB1c2VyVGVsZWdyYW0gPSBhd2FpdCB0aGlzLnRlbGVncmFtU2VydmVyLnVzZXJFeGlzdHMobmV3IFJlZ0V4cCgnXjh8NycgKyBudW1iZXIgKyAnJCcsICdpJykpO1xuXG4gICAgICAgIC8vIHRvZG8gZGV2aWNlIGNoZWNrIGVtYmVkZWQsICBjZXJ0XG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuT0spLmpzb24oe1xuICAgICAgICAgICAgc3RhdHVzOiAnc3VjY2VzcycsXG4gICAgICAgICAgICBwdXNoX3Rva2VuOiB1c2VyLlB1c2hUb2tlbiAhPT0gJycsXG4gICAgICAgICAgICByZWdpc3RlcmVkX2luX3RlbGVncmFtOiB1c2VyVGVsZWdyYW0gIT09IG51bGxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVmVyaWZ5IGlmIHVzZXIgY29uZmlybWVkIG9yIHJlamVjdGVkIHRoZSB2ZXJpZmljYXRpb25cbiAgICAgKlxuICAgICAqIEBwYXJhbSByZXFcbiAgICAgKiBAcGFyYW0gcmVzXG4gICAgICogQHJldHVybnMge1Byb21pc2U8dm9pZD59XG4gICAgICovXG4gICAgQFBvc3QoJ2NoZWNrLXB1c2gtdmVyaWZpY2F0aW9uJylcbiAgICBhc3luYyBjaGVja1B1c2hWZXJpZmljYXRpb24oQFJlcSgpIHJlcSwgQFJlcygpIHJlcykge1xuICAgICAgICBsZXQgdGZhVXNlciA9IGF3YWl0IHRoaXMuZ2V0VXNlcihyZXEuYm9keS5waG9uZV9udW1iZXIsICd0ZmEnKTtcbiAgICAgICAgaWYgKCF0ZmFVc2VyKXtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuT0spLmpzb24oe3N0YXR1czogYE5PX1VTRVJgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVkaXNLZXkgPSBgJHt0ZmFVc2VyLlBob25lTnVtYmVyfToke1JFRElTX1VTRVJfUFVTSF9SRVNVTFRfUE9TVEZJWH1gO1xuICAgICAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCB0aGlzLnJlZGlzQ2xpZW50LmdldEFzeW5jKHJlZGlzS2V5KTtcbiAgICAgICAgaWYgKHN0YXR1cyA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk9LKS5qc29uKHtzdGF0dXM6IGBOT1RfVkVSSUZJRURfWUVUYH0pO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMucmVkaXNDbGllbnQuZGVsKHJlZGlzS2V5KTtcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5PSykuanNvbih7c3RhdHVzOiBzdGF0dXN9KTtcbiAgICB9XG5cbiAgICAvKioqXG4gICAgICogRW50ZXIgdGhlIHNlcnZpY2VcbiAgICAgKlxuICAgICAqIEBwYXJhbSByZXNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc2VydmljZVxuICAgICAqL1xuICAgIEBHZXQoJ2VudGVyJylcbiAgICBnZXRFbnRlcihAUmVzKCkgcmVzLCBAUXVlcnkoJ2V2ZW50JykgZXZlbnQ6IHN0cmluZywgQFF1ZXJ5KCdzZXJ2aWNlJykgc2VydmljZTogc3RyaW5nKSB7XG4gICAgICAgIGxldCB2ID0gbmV3IFZhbGlkYXRvcih7XG4gICAgICAgICAgICBldmVudDogZXZlbnQsXG4gICAgICAgICAgICBzZXJ2aWNlOiBzZXJ2aWNlXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIGV2ZW50OiAncmVxdWlyZWR8c3RyaW5nJyxcbiAgICAgICAgICAgIHNlcnZpY2U6ICdyZXF1aXJlZHxzdHJpbmd8aW46a2F6dGVsLGVnb3YnLFxuICAgICAgICB9LCB7J3NlcnZpY2UuaW4nOiBgTm8gc2VydmljZSB3aXRoIG5hbWU6ICR7c2VydmljZX1gfSk7XG4gICAgICAgIGlmICh2LmZhaWxzKCkpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFkpLmpzb24odi5nZXRFcnJvcnMoKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcy5yZWRpcmVjdChgJHtFbnZDb25maWcuRlJPTlRFTkRfQVBJfT9zZXJ2aWNlPSR7c2VydmljZX0mZXZlbnQ9JHtldmVudH1gKTtcbiAgICB9XG59Il19