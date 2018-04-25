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
    common_1.Post('verify'),
    __param(0, common_1.Res()), __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, post_verify_dto_1.PostVerifyCodeDTO]),
    __metadata("design:returntype", Promise)
], WebController.prototype, "postVerify", null);
__decorate([
    common_1.Post('verify-user'),
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
    __param(0, common_1.Res()),
    __param(1, common_1.Query('event')),
    __param(2, common_1.Query('service')),
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvY29udHJvbGxzZXJzL3dlYi5jb250cm9sbGVyLnRzIiwic291cmNlcyI6WyIvaG9tZS9wZXNoa292L2Rldi9wcm9qZWN0cy9ibG9ja2NoYWluLTJmYS1iYWNrZW5kL3NyYy9tb2R1bGVzL2FwaS9jb250cm9sbHNlcnMvd2ViLmNvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDJDQUF3RjtBQUN4Riw2Q0FBMkM7QUFDM0MsNkNBQThDO0FBQzlDLG1GQUFzRTtBQUN0RSw2RUFBMEU7QUFDMUUseURBQWdIO0FBQ2hILHlGQUFrRjtBQUNsRiwrRkFBd0Y7QUFDeEYsdUVBQWlFO0FBQ2pFLHFFQUFnRTtBQUNoRSw0RUFBc0U7QUFDdEUsK0RBQWtFO0FBQ2xFLCtFQUFxRjtBQUNyRix5RUFBa0U7QUFDbEUsMkRBQXFEO0FBQ3JELGdGQUEwRTtBQUMxRSwrQkFBK0I7QUFDL0IsMkZBQW9GO0FBQ3BGLHNDQUFzQztBQUN0Qyw2Q0FBMkM7QUFFM0MsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3JDLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN6QixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUNoRCxNQUFNLHFCQUFxQixHQUFHLFdBQVcsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLGdDQUFnQyxDQUFDLENBQUMsQ0FBQztBQUk3RixJQUFhLGFBQWEsR0FBMUIsbUJBQTJCLFNBQVEsMEJBQWE7SUFHNUMsWUFBbUIsS0FBMkIsRUFDM0IsUUFBaUMsRUFDakMsTUFBNkIsRUFDN0IsWUFBMEIsRUFDekIsVUFBc0IsRUFDdEIsY0FBOEIsRUFDOUIsd0JBQWtEO1FBQ2xFLEtBQUssQ0FBQyxLQUFL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QyxhQUFJLENBQUMsUUFBUSxDQUFDO0lBQ0csV0FBQSxZQUFHLEVBQUUsQ0FBQSxFQUFPLFdBQUEsYUFBSSxFQUFFLENBQUE7OzZDQUFPLG1DQUFpQjs7K0NBMkczRDtBQVVEO0lBREMsYUFBSSxDQUFDLGFBQWEsQ0FBQztJQUNFLFdBQUEsWUFBRyxFQUFFLENBQUEsRUFBTyxXQUFBLGFBQUksRUFBRSxDQUFBOzs2Q0FBTywyQkFBVzs7bURBMEJ6RDtBQVVEO0lBREMsYUFBSSxDQUFDLHlCQUF5QixDQUFDO0lBQ0gsV0FBQSxZQUFHLEVBQUUsQ0FBQSxFQUFPLFdBQUEsWUFBRyxFQUFFLENBQUE7Ozs7MERBUzdDO0FBVUQ7SUFEQyxZQUFHLENBQUMsT0FBTyxDQUFDO0lBQ0gsV0FBQSxZQUFHLEVBQUUsQ0FBQTtJQUNMLFdBQUEsY0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQ2QsV0FBQSxjQUFLLENBQUMsU0FBUyxDQUFDLENBQUE7Ozs7NkNBWXpCO0FBeFdRLGFBQWE7SUFGekIsb0JBQVUsQ0FBQyxZQUFZLENBQUM7SUFDeEIsbUJBQVUsQ0FBQyxZQUFZLENBQUM7cUNBSUssNkNBQW9CO1FBQ2pCLG1EQUF1QjtRQUN6QiwrQ0FBcUI7UUFDZiw0QkFBWTtRQUNiLHdCQUFVO1FBQ04sZ0NBQWM7UUFDSix3Q0FBd0I7R0FUN0QsYUFBYSxDQXlXekI7QUF6V1ksc0NBQWEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0JvZHksIENvbnRyb2xsZXIsIEdldCwgSHR0cFN0YXR1cywgUG9zdCwgUXVlcnksIFJlcSwgUmVzfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XG5pbXBvcnQge0FwaVVzZVRhZ3N9IGZyb20gJ0BuZXN0anMvc3dhZ2dlcic7XG5pbXBvcnQge0VudkNvbmZpZ30gZnJvbSAnLi4vLi4vLi4vY29uZmlnL2Vudic7XG5pbXBvcnQge1ZhbGlkYXRvcn0gZnJvbSAnLi4vLi4vLi4vc2VydmljZXMvaGVscGVycy92YWxpZGF0aW9uLmhlbHBlcic7XG5pbXBvcnQge1Bvc3RWZXJpZnlDb2RlRFRPfSBmcm9tICcuLi8uLi9zaGFyZWQvbW9kZWxzL2R0by9wb3N0LnZlcmlmeS5kdG8nO1xuaW1wb3J0IHtSRURJU19VU0VSX1BVU0hfUkVTVUxUX1BPU1RGSVgsIFJFSkVDVCwgUkVTRU5EX0NPREUsIFNFTkRfQ09ERSwgVkFMSUR9IGZyb20gJy4uLy4uLy4uL2NvbmZpZy9jb25zdGFudHMnO1xuaW1wb3J0IHtUZmFUcmFuc2FjdGlvbkZhbWlseX0gZnJvbSAnLi4vLi4vc2hhcmVkL2ZhbWlsaWVzL3RmYS50cmFuc2FjdGlvbi5mYW1pbHknO1xuaW1wb3J0IHtLYXp0ZWxUcmFuc2FjdGlvbkZhbWlseX0gZnJvbSAnLi4vLi4vc2hhcmVkL2ZhbWlsaWVzL2thenRlbC50cmFuc2FjdGlvbi5mYW1pbHknO1xuaW1wb3J0IHtUaW1lSGVscGVyfSBmcm9tICcuLi8uLi8uLi9zZXJ2aWNlcy9oZWxwZXJzL3RpbWUuaGVscGVyJztcbmltcG9ydCB7U2VydmljZXN9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL2NvZGVfc2VuZGVyL3NlcnZpY2VzJztcbmltcG9ydCB7Q2hhaW5TZXJ2aWNlfSBmcm9tICcuLi8uLi8uLi9zZXJ2aWNlcy9zYXd0b290aC9jaGFpbi5zZXJ2aWNlJztcbmltcG9ydCB7X2dldExhdGVzdEluZGV4fSBmcm9tICcuLi8uLi8uLi9zZXJ2aWNlcy9oZWxwZXJzL2hlbHBlcnMnO1xuaW1wb3J0IHtDb2RlUXVldWVMaXN0ZW5lclNlcnZpY2V9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL2NvZGVfc2VuZGVyL3F1ZXVlLnNlcnZpY2UnO1xuaW1wb3J0IHtQb3N0Q29kZURUT30gZnJvbSAnLi4vLi4vc2hhcmVkL21vZGVscy9kdG8vcG9zdC5jb2RlLmR0byc7XG5pbXBvcnQge1VzZXJMb2d9IGZyb20gJy4uLy4uL3NoYXJlZC9tb2RlbHMvdXNlci5sb2cnO1xuaW1wb3J0IHtUZWxlZ3JhbVNlcnZlcn0gZnJvbSAnLi4vLi4vLi4vc2VydmljZXMvdGVsZWdyYW0vdGVsZWdyYW0uc2VydmVyJztcbmltcG9ydCAqIGFzIHJlZGlzIGZyb20gJ3JlZGlzJztcbmltcG9ydCB7RWdvdlRyYW5zYWN0aW9uRmFtaWx5fSBmcm9tICcuLi8uLi9zaGFyZWQvZmFtaWxpZXMvZWdvdi50cmFuc2FjdGlvbi5mYW1pbHknO1xuaW1wb3J0ICogYXMgUHJvbWlzZWZ5IGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7QXBpQ29udHJvbGxlcn0gZnJvbSAnLi9jb250cm9sbGVyJztcblxuY29uc3QgVGVsZWdyYWYgPSByZXF1aXJlKCd0ZWxlZ3JhZicpO1xuY29uc3QgZnMgPSByZXF1aXJlKCdmcycpO1xuY29uc3QgcHJvdG9idWZMaWIgPSByZXF1aXJlKCdwcm90b2NvbC1idWZmZXJzJyk7XG5jb25zdCBtZXNzYWdlc1NlcnZpY2VDbGllbnQgPSBwcm90b2J1ZkxpYihmcy5yZWFkRmlsZVN5bmMoJ3NyYy9wcm90by9zZXJ2aWNlX2NsaWVudC5wcm90bycpKTtcblxuQEFwaVVzZVRhZ3MoJ3YxL2FwaS93ZWInKVxuQENvbnRyb2xsZXIoJ3YxL2FwaS93ZWInKVxuZXhwb3J0IGNsYXNzIFdlYkNvbnRyb2xsZXIgZXh0ZW5kcyBBcGlDb250cm9sbGVye1xuICAgIHByaXZhdGUgdGVsZWdyYWZBcHA6IGFueTtcblxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyB0ZmFURjogVGZhVHJhbnNhY3Rpb25GYW1pbHksXG4gICAgICAgICAgICAgICAgcHVibGljIGthenRlbFRGOiBLYXp0ZWxUcmFuc2FjdGlvbkZhbWlseSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgZWdvdlRGOiBFZ292VHJhbnNhY3Rpb25GYW1pbHksXG4gICAgICAgICAgICAgICAgcHVibGljIGNoYWluU2VydmljZTogQ2hhaW5TZXJ2aWNlLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgdGltZUhlbHBlcjogVGltZUhlbHBlcixcbiAgICAgICAgICAgICAgICBwcml2YXRlIHRlbGVncmFtU2VydmVyOiBUZWxlZ3JhbVNlcnZlcixcbiAgICAgICAgICAgICAgICBwcml2YXRlIGNvZGVRdWV1ZUxpc3RlbmVyU2VydmljZTogQ29kZVF1ZXVlTGlzdGVuZXJTZXJ2aWNlKSB7XG4gICAgICAgIHN1cGVyKHRmYVRGLCBrYXp0ZWxURiwgZWdvdlRGKTtcbiAgICAgICAgdGhpcy50ZWxlZ3JhZkFwcCA9IG5ldyBUZWxlZ3JhZihFbnZDb25maWcuVEVMRUdSQU1fQk9UX0tFWSk7XG4gICAgICAgIFByb21pc2VmeS5wcm9taXNpZnlBbGwocmVkaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbmQgY29kZSB0byB1c2VyXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcmVzXG4gICAgICogQHBhcmFtIHtQb3N0Q29kZURUT30gYm9keVxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fVxuICAgICAqL1xuICAgIEBQb3N0KCdjb2RlJylcbiAgICBhc3luYyBwb3N0Q29kZShAUmVzKCkgcmVzLCBAQm9keSgpIGJvZHk6IFBvc3RDb2RlRFRPKSB7XG4gICAgICAgIGxldCB2ID0gbmV3IFZhbGlkYXRvcihib2R5LCB7XG4gICAgICAgICAgICBldmVudDogJ3JlcXVpcmVkfHN0cmluZycsXG4gICAgICAgICAgICBsYW5nOiAnbnVsbGFibGV8c3RyaW5nJyxcbiAgICAgICAgICAgIG1ldGhvZDogJ3JlcXVpcmVkfHN0cmluZ3xpbjpzbXMscHVzaCx0ZWxlZ3JhbSx3aGF0c2FwcCcsXG4gICAgICAgICAgICBzZXJ2aWNlOiAncmVxdWlyZWRJZk5vdDpwdXNoX3Rva2VufHN0cmluZ3xpbjprYXp0ZWwsZWdvdicsXG4gICAgICAgICAgICBwaG9uZV9udW1iZXI6ICdyZXF1aXJlZHxzdHJpbmd8cmVnZXg6L15cXFxcKz9bMS05XVxcXFxkezEsMTR9JC8nLFxuICAgICAgICAgICAgZW1iZWRlZDogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgY2xpZW50X3RpbWVzdGFtcDogJ3JlcXVpcmVkJyxcbiAgICAgICAgICAgIGNlcnQ6ICdudWxsYWJsZScsXG4gICAgICAgICAgICByZXNlbmQ6ICdudWxsYWJsZXxib29sZWFuJyxcbiAgICAgICAgfSwgeydzZXJ2aWNlLmluJzogYE5vIHNlcnZpY2Ugd2l0aCBuYW1lOiAke2JvZHkuc2VydmljZX1gfSk7XG4gICAgICAgIGlmICh2LmZhaWxzKCkpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFkpLmpzb24odi5nZXRFcnJvcnMoKSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8g0J/RgNC+0LLQtdGA0LrQsCwg0YHRg9GJ0LXRgdGC0LLRg9C10YIg0LvQuCDQv9C+0LvRjNC30L7QstCw0YLQtdC70YxcbiAgICAgICAgbGV0IHVzZXIgPSBhd2FpdCB0aGlzLmdldFVzZXIoYm9keS5waG9uZV9udW1iZXIsIGJvZHkuc2VydmljZSk7XG4gICAgICAgIGlmICh1c2VyID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk5PVF9GT1VORCkuanNvbih7dXNlcjogW3RoaXMuZ2V0VXNlck5vdEZvdW5kTWVzc2FnZShib2R5LmxhbmcgfHwgJ2VuJyldfSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHRlbGVncmFtVXNlcjtcbiAgICAgICAgaWYgKGJvZHkubWV0aG9kID09PSAndGVsZWdyYW0nKSB7XG4gICAgICAgICAgICBsZXQgbnVtYmVyID0gdXNlci5QaG9uZU51bWJlcjtcbiAgICAgICAgICAgIGlmIChudW1iZXIuY2hhckF0KDApID09PSAnKycpIHtcbiAgICAgICAgICAgICAgICBudW1iZXIgPSBudW1iZXIuc3Vic3RyaW5nKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGVsZWdyYW1Vc2VyID0gYXdhaXQgdGhpcy50ZWxlZ3JhbVNlcnZlci51c2VyRXhpc3RzKG5ldyBSZWdFeHAoJ144fDcnICsgbnVtYmVyLnN1YnN0cmluZygxKSArICckJywgJ2knKSk7XG4gICAgICAgICAgICBpZiAoIXRlbGVncmFtVXNlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFkpLmpzb24oe3VzZXI6IFt0aGlzLmdldE1lc3NhZ2UoYm9keS5sYW5nLCAndGVsZWdyYW1fYm90X3VucmVnaXN0ZXJlZCcpXX0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY2hlY2sgaWYgdXNlciBkZWxldGUgdGhlIGJvdFxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnRlbGVncmFmQXBwLnRlbGVncmFtLnNlbmRNZXNzYWdlKHRlbGVncmFtVXNlci5jaGF0SWQsICfQl9C00YDQsNCy0YHRgtCy0YPQudGC0LUnKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZS5yZXNwb25zZSAmJiBlLnJlc3BvbnNlLmVycm9yX2NvZGUgPT09IDQwMykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHtzdGF0dXM6ICd0ZWxlZ3JhbV9ib3RfdW5yZWdpc3RlcmVkJ30pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyDQvdCw0YfQuNC90LDQtdC8INGB0LvRg9GI0LDRgtGMINC40LfQvNC10L3QtdC90LjRjyDQsNC00YDQtdGB0L7QslxuICAgICAgICBsZXQgYWRkcmVzc2VzID0gW3RoaXMuY2hhaW5TZXJ2aWNlLmdldEFkZHJlc3ModXNlci5QaG9uZU51bWJlciwgYm9keS5zZXJ2aWNlKV07XG4gICAgICAgIGxldCB3cyA9IHRoaXMub3BlbldzQ29ubmVjdGlvbihhZGRyZXNzZXMpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IGxvZyA9IG5ldyBVc2VyTG9nKCk7XG4gICAgICAgICAgICBsb2cuQWN0aW9uVGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCkgLyAxMDAwO1xuICAgICAgICAgICAgbG9nLkV4cGlyZWRBdCA9IHRoaXMudGltZUhlbHBlci5nZXRVbml4VGltZUFmdGVyTWludXRlcyg3KTtcbiAgICAgICAgICAgIGxvZy5FdmVudCA9IGJvZHkuZXZlbnQ7XG4gICAgICAgICAgICBsb2cuTWV0aG9kID0gYm9keS5tZXRob2Q7XG4gICAgICAgICAgICBsb2cuU3RhdHVzID0gYm9keS5yZXNlbmQgPyAnUkVTRU5EX0NPREUnIDogJ1NFTkRfQ09ERSc7XG4gICAgICAgICAgICBsb2cuRW1iZWRlZCA9IGJvZHkuZW1iZWRlZDtcbiAgICAgICAgICAgIGxvZy5DZXJ0ID0gYm9keS5jZXJ0O1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jaGFpblNlcnZpY2UuZ2VuZXJhdGVDb2RlKHVzZXIuUGhvbmVOdW1iZXIsIGxvZywgYm9keS5zZXJ2aWNlKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3Igd2hpbGUgZ2V0dGluZyB1c2VyYCwgZSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLkJBRF9HQVRFV0FZKS5qc29uKHtlcnJvcjogJ0Vycm9yIHNlbmRpbmcgY29kZS4nfSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHB1c2hUb2tlbiA9ICcnO1xuICAgICAgICBpZiAoYm9keS5tZXRob2QgPT09ICdwdXNoJyAmJiAhdXNlci5Jc1ZlcmlmaWVkKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHt1c2VyOiBbdGhpcy5nZXRNZXNzYWdlKGJvZHkubGFuZywgJ25vdF92ZXJpZmllZCcpXX0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0IHRmYVVzZXIgPSBhd2FpdCB0aGlzLmdldFVzZXIodXNlci5QaG9uZU51bWJlciwgJ3RmYScpO1xuICAgICAgICAgICAgaWYgKCF0ZmFVc2VyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih7dXNlcjogW3RoaXMuZ2V0TWVzc2FnZShib2R5LmxhbmcsICdub3RfdmVyaWZpZWQnKV19KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHB1c2hUb2tlbiA9IHRmYVVzZXIuUHVzaFRva2VuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHJlc3BvbnNlU2VuZCA9IGZhbHNlO1xuICAgICAgICB3cy5vbm1lc3NhZ2UgPSBtZXNzID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKG1lc3MuZGF0YSk7XG4gICAgICAgICAgICBmb3IgKGxldCBzdGF0ZUNoYW5nZSBvZiBkYXRhLnN0YXRlX2NoYW5nZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2VTZW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoeydhY3Rpb24nOiAndW5zdWJzY3JpYmUnfSkpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGFkZHJlc3Nlcy5pbmRleE9mKHN0YXRlQ2hhbmdlLmFkZHJlc3MpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgdXNlckRlY29kZWQ7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyRGVjb2RlZCA9IG1lc3NhZ2VzU2VydmljZUNsaWVudC5Vc2VyLmRlY29kZShuZXcgQnVmZmVyKHN0YXRlQ2hhbmdlLnZhbHVlLCAnYmFzZTY0JykpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnVmVyaWZpY2F0aW9uQ29udHJvbGxlckBwb3N0Q29kZTogQ2FudCBkZWNvZGUgdXNlcicsIGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VTZW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoeydhY3Rpb24nOiAndW5zdWJzY3JpYmUnfSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih7dXNlcjogW3RoaXMuZ2V0TWVzc2FnZShib2R5LmxhbmcsICdlcnJvcl9kZWNvZGVfdXNlcl9iYycpXX0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh1c2VyRGVjb2RlZC5Mb2dzLmxlbmd0aCA+IHVzZXIuTG9ncy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGxvZzogVXNlckxvZyA9IHVzZXJEZWNvZGVkLkxvZ3NbX2dldExhdGVzdEluZGV4KE9iamVjdC5rZXlzKHVzZXJEZWNvZGVkLkxvZ3MpKV07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobG9nLlN0YXR1cyAhPT0gU0VORF9DT0RFICYmIGxvZy5TdGF0dXMgIT09IFJFU0VORF9DT0RFKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VTZW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2FjdGlvbic6ICd1bnN1YnNjcmliZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXI6IFsnQ29kZSB3YXMgbm90IHNlbmQgLSBsYXRlc3QgbG9nIGlzIG5vdCB3aXRoIHRoZSBjb2RlIHRvIHNlbmQuJ11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAobG9nLk1ldGhvZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3B1c2gnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvZGVRdWV1ZUxpc3RlbmVyU2VydmljZS5xdWV1ZVBVU0guYWRkKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiAn0JTQstGD0YXRhNCw0LrRgtC+0YDQvdCw0Y8g0LDQstGC0L7RgNC40LfQsNGG0LjRjycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBg0J/QvtC00YLQstC10YDQtNC40YLQtSDQstGF0L7QtCDQvdCwINGB0LXRgNCy0LjRgTogJyR7U2VydmljZXNbYm9keS5zZXJ2aWNlXX0nYCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZpY2U6IGJvZHkuc2VydmljZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHB1c2hfdG9rZW46IHB1c2hUb2tlblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnc21zJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb2RlUXVldWVMaXN0ZW5lclNlcnZpY2UucXVldWVTTVMuYWRkKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBob25lX251bWJlcjogdXNlci5QaG9uZU51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZpY2U6IGJvZHkuc2VydmljZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IGxvZy5Db2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAndGVsZWdyYW0nOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvZGVRdWV1ZUxpc3RlbmVyU2VydmljZS5xdWV1ZVRlbGVncmFtLmFkZCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGF0X2lkOiB0ZWxlZ3JhbVVzZXIuY2hhdElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ9CS0LDRiCDQutC+0LQg0L/QvtC00YLQstC10YDQttC00LXQvdC40Y8g0LTQu9GPINGB0LXRgNCy0LjRgdCwIFwiJyArIFNlcnZpY2VzW2JvZHkuc2VydmljZV0gKyAnXCI6ICcgKyBsb2cuQ29kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3doYXRzYXBwJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdG9kb1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBDaGFpbkNvbnRyb2xsZXJAZGVsaXZlckNvZGU6IG1ldGhvZCAke2xvZy5NZXRob2R9IGlzIG5vdCBzdXBwb3J0ZWQuYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7J2FjdGlvbic6ICd1bnN1YnNjcmliZSd9KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZVNlbmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5PSykuanNvbih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzZW5kX2Nvb2xkb3duOiA3ICogNjAsICAvLyDQmtC+0LvQuNGH0LXRgdGC0LLQviDRgdC10LrRg9C90LQg0LfQsCDQutC+0YLQvtGA0YvQtSDQvdCw0LTQviDQstCy0LXRgdGC0Lgg0LrQvtC0INC4INC30LAg0LrQvtGC0L7RgNGL0LUg0L3QtdC70YzQt9GPINC+0YLQv9GA0LDQstC40YLRjCDQutC+0LQg0L/QvtCy0YLQvtGA0L3QvlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogYm9keS5tZXRob2QsICAgICAgLy8g0JzQtdGC0L7QtCDQvtGC0L/RgNCw0LLQutC4IChpbjpwdXNoLHNtcyx0ZWxlZ3JhbSx3aGF0c2FwcClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6ICdzdWNjZXNzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB3cy5vbmNsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgJ2FjdGlvbic6ICd1bnN1YnNjcmliZSdcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBWZXJpZnkgdXNlcidzIGNvZGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSByZXNcbiAgICAgKiBAcGFyYW0ge1Bvc3RWZXJpZnlDb2RlRFRPfSBib2R5XG4gICAgICogQHJldHVybnMge1Byb21pc2U8dm9pZD59XG4gICAgICovXG4gICAgQFBvc3QoJ3ZlcmlmeScpXG4gICAgYXN5bmMgcG9zdFZlcmlmeShAUmVzKCkgcmVzLCBAQm9keSgpIGJvZHk6IFBvc3RWZXJpZnlDb2RlRFRPKSB7XG4gICAgICAgIGxldCB2ID0gbmV3IFZhbGlkYXRvcihib2R5LCB7XG4gICAgICAgICAgICBldmVudDogJ3JlcXVpcmVkfHN0cmluZycsXG4gICAgICAgICAgICBsYW5nOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGNvZGU6ICdyZXF1aXJlZHxudW1iZXInLFxuICAgICAgICAgICAgc2VydmljZTogJ3JlcXVpcmVkSWZOb3Q6cHVzaF90b2tlbnxzdHJpbmd8aW46a2F6dGVsLGVnb3YnLFxuICAgICAgICAgICAgcGhvbmVfbnVtYmVyOiAncmVxdWlyZWR8c3RyaW5nfHJlZ2V4Oi9eXFxcXCs/WzEtOV1cXFxcZHsxLDE0fSQvJyxcbiAgICAgICAgICAgIGVtYmVkZWQ6ICdib29sZWFuJyxcbiAgICAgICAgICAgIC8vINC40YHQv9C+0LvRjNC30YPQtdGC0YHRjyDRgtC+0LvRjNC60L4g0L/RgNC4INC+0YLQv9GA0LDQstC60LUg0LzQvtCx0LjQu9GM0L3Ri9C8INC/0YDQuNC70L7QttC10L3QuNC10LwgLSDQtNC70Y8g0YPRgdGC0LDQvdC+0LLQutC1INGB0YLQsNGC0YPRgdCwIFJFSkVDVFxuICAgICAgICAgICAgc3RhdHVzOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIG1ldGhvZDogJ3N0cmluZycsXG4gICAgICAgICAgICBjbGllbnRfdGltZXN0YW1wOiAncmVxdWlyZWQnLFxuICAgICAgICAgICAgY2VydDogJ251bGxhYmxlJyxcbiAgICAgICAgfSwgeydzZXJ2aWNlLmluJzogYE5vIHNlcnZpY2Ugd2l0aCBuYW1lOiAke2JvZHkuc2VydmljZX1gfSk7XG4gICAgICAgIGlmICh2LmZhaWxzKCkpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFkpLmpzb24odi5nZXRFcnJvcnMoKSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8g0J/RgNC+0LLQtdGA0LrQsCwg0YHRg9GJ0LXRgdGC0LLRg9C10YIg0LvQuCDQv9C+0LvRjNC30L7QstCw0YLQtdC70YxcbiAgICAgICAgbGV0IHVzZXIgPSBhd2FpdCB0aGlzLmdldFVzZXIoYm9keS5waG9uZV9udW1iZXIsIGJvZHkuc2VydmljZSk7XG4gICAgICAgIGlmICh1c2VyID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk5PVF9GT1VORCkuanNvbih7dXNlcjogW3RoaXMuZ2V0VXNlck5vdEZvdW5kTWVzc2FnZShib2R5LmxhbmcgfHwgJ2VuJyldfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8g0L3QsNGH0LjQvdCw0LXQvCDRgdC70YPRiNCw0YLRjCDQuNC30LzQtdC90LXQvdC40Y8g0LDQtNGA0LXRgdC+0LJcbiAgICAgICAgbGV0IGFkZHJlc3NlcyA9IFtcbiAgICAgICAgICAgIHRoaXMuY2hhaW5TZXJ2aWNlLmdldEFkZHJlc3ModXNlci5QaG9uZU51bWJlciwgYm9keS5zZXJ2aWNlKSxcbiAgICAgICAgXTtcbiAgICAgICAgbGV0IHdzID0gdGhpcy5vcGVuV3NDb25uZWN0aW9uKGFkZHJlc3Nlcyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgcmVqZWN0U3RhdHVzID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChib2R5LnN0YXR1cyAmJiBib2R5LnN0YXR1cyA9PT0gUkVKRUNUKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0U3RhdHVzID0gUkVKRUNUO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGxvZyA9IG5ldyBVc2VyTG9nKCk7XG4gICAgICAgICAgICBsb2cuQWN0aW9uVGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCkgLyAxMDAwO1xuICAgICAgICAgICAgbG9nLkV4cGlyZWRBdCA9IHRoaXMudGltZUhlbHBlci5nZXRVbml4VGltZUFmdGVyTWludXRlcygxKTtcbiAgICAgICAgICAgIGxvZy5FdmVudCA9IGJvZHkuZXZlbnQ7XG4gICAgICAgICAgICBsb2cuRW1iZWRlZCA9IGJvZHkuZW1iZWRlZDtcbiAgICAgICAgICAgIGxvZy5TdGF0dXMgPSByZWplY3RTdGF0dXMgfHwgJ1ZFUklGWSc7XG4gICAgICAgICAgICBsb2cuQ29kZSA9IGJvZHkuY29kZTtcbiAgICAgICAgICAgIGxvZy5DZXJ0ID0gYm9keS5jZXJ0O1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jaGFpblNlcnZpY2UudmVyaWZ5KHVzZXIuUGhvbmVOdW1iZXIsIGxvZywgYm9keS5zZXJ2aWNlKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3Igd2hpbGUgZ2V0dGluZyB1c2VyYCwgZSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLkJBRF9HQVRFV0FZKS5qc29uKHtlcnJvcjogJ0Vycm9yIGNoZWNraW5nIGNvZGUuJ30pO1xuICAgICAgICB9XG4gICAgICAgIGxldCByZXNwb25zZVNlbmQgPSBmYWxzZTtcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgICAgICB3cy5vbm1lc3NhZ2UgPSBhc3luYyBtZXNzID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKG1lc3MuZGF0YSk7XG4gICAgICAgICAgICBmb3IgKGxldCBzdGF0ZUNoYW5nZSBvZiBkYXRhLnN0YXRlX2NoYW5nZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2VTZW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoeydhY3Rpb24nOiAndW5zdWJzY3JpYmUnfSkpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGFkZHJlc3Nlcy5pbmRleE9mKHN0YXRlQ2hhbmdlLmFkZHJlc3MpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBfdXNlciA9IG1lc3NhZ2VzU2VydmljZUNsaWVudC5Vc2VyLmRlY29kZShuZXcgQnVmZmVyKHN0YXRlQ2hhbmdlLnZhbHVlLCAnYmFzZTY0JykpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoX3VzZXIuTG9ncy5sZW5ndGggPT09IHVzZXIuTG9ncy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IF91c2VyLkxvZ3NbX3VzZXIuTG9ncy5sZW5ndGggLSAxXS5TdGF0dXM7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGF0dXMgPT09IFZBTElEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnX3VzZXIuTG9nc1tfdXNlci5Mb2dzLmxlbmd0aCAtIDFdLk1ldGhvZCcsIF91c2VyLkxvZ3NbX3VzZXIuTG9ncy5sZW5ndGggLSAxXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChfdXNlci5Mb2dzW191c2VyLkxvZ3MubGVuZ3RoIC0gMV0uTWV0aG9kID09PSAndGVsZWdyYW0nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHRlbGVncmFtVXNlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbnVtYmVyID0gdXNlci5QaG9uZU51bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobnVtYmVyLmNoYXJBdCgwKSA9PT0gJysnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bWJlciA9IG51bWJlci5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbGVncmFtVXNlciA9IGF3YWl0IHNlbGYgLnRlbGVncmFtU2VydmVyLnVzZXJFeGlzdHMobmV3IFJlZ0V4cCgnXjh8NycgKyBudW1iZXIuc3Vic3RyaW5nKDEpICsgJyQnLCAnaScpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGVsZWdyYW1Vc2VyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYgLmNvZGVRdWV1ZUxpc3RlbmVyU2VydmljZS5xdWV1ZVRlbGVncmFtLmFkZCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGF0X2lkOiB0ZWxlZ3JhbVVzZXIuY2hhdElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ9CS0Ysg0YPRgdC/0LXRiNC90L4g0LDQstGC0L7RgNC40LfQstCw0LvQuNGB0Ywg0L3QsCDRgdC10YDQstC40YHQtSAyRkEnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTZW5kIHVzZXIgdG8gY2xpZW50LlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdG9kbyDQvtGC0YDQsNCx0L7RgtCw0YLRjCDQsiDQvNC+0LzQvdC10YIg0LjQvdGC0LXQs9GA0LDRhtC40Lgg0LfQsNC/0YDQvtGB0Ysg0LrQu9C40LXQvdGC0LDQvCDRgdC10YDQstC40YHQvtCyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzd2l0Y2ggKGJvZHkuc2VydmljZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGNhc2UgJ2thenRlbCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIHJlcXVlc3QucG9zdChFbnZDb25maWcuS0FaVEVMX0NBTExCQUNLX1VSTCsgJy9yZWRpcmVjdF91cmwnLCB1c2VyKS50aGVuKHI9PiBjb25zb2xlLmxvZygncmVkaXJlY3Qgb2NjdXInKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgY2FzZSAnZWdvdic6XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIHJlcXVlc3QucG9zdChFbnZDb25maWcuRUdPVl9DQUxMQkFDS19VUkwrICcvcmVkaXJlY3RfdXJsJywgdXNlcikudGhlbihyPT4gY29uc29sZS5sb2coJ3JlZGlyZWN0IG9jY3VyJykpXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdG9kbyBtYWtlIHJlcXVlc3QgdG8gcmVkaXJlc3QgdXJsIHdpdGggdXNlciBkYXRhXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZVNlbmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7J2FjdGlvbic6ICd1bnN1YnNjcmliZSd9KSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlc3BvbmRlIHRvIHRoZSB2aWV3XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk9LKS5qc29uKHtzdGF0dXM6ICdWQUxJRCcsIHVzZXI6IF91c2VyfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZVNlbmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7J2FjdGlvbic6ICd1bnN1YnNjcmliZSd9KSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGF0dXMgPT09ICdFWFBJUkVEJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQ0MCkuanNvbih7c3RhdHVzOiBzdGF0dXN9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuQkFEX1JFUVVFU1QpLmpzb24oe3N0YXR1czogc3RhdHVzfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVmVyaWZ5IGlmIHVzZXIgZXhpc3RzXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcmVzXG4gICAgICogQHBhcmFtIHtQb3N0Q29kZURUT30gYm9keVxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fVxuICAgICAqL1xuICAgIEBQb3N0KCd2ZXJpZnktdXNlcicpXG4gICAgYXN5bmMgcG9zdFZlcmlmeVVzZXIoQFJlcygpIHJlcywgQEJvZHkoKSBib2R5OiBQb3N0Q29kZURUTykge1xuICAgICAgICBsZXQgdiA9IG5ldyBWYWxpZGF0b3IoYm9keSwge1xuICAgICAgICAgICAgbGFuZzogJ3N0cmluZycsXG4gICAgICAgICAgICBzZXJ2aWNlOiAncmVxdWlyZWRJZk5vdDpwdXNoX3Rva2VufHN0cmluZ3xpbjprYXp0ZWwsZWdvdicsXG4gICAgICAgICAgICBwaG9uZV9udW1iZXI6ICdyZXF1aXJlZHxzdHJpbmd8cmVnZXg6L15cXFxcKz9bMS05XVxcXFxkezEsMTR9JC8nLFxuICAgICAgICB9LCB7J3NlcnZpY2UuaW4nOiBgTm8gc2VydmljZSB3aXRoIG5hbWU6ICR7Ym9keS5zZXJ2aWNlfWB9KTtcbiAgICAgICAgaWYgKHYuZmFpbHMoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih2LmdldEVycm9ycygpKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdXNlciA9IGF3YWl0IHRoaXMuZ2V0VXNlcihib2R5LnBob25lX251bWJlciwgYm9keS5zZXJ2aWNlKTtcbiAgICAgICAgaWYgKHVzZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuTk9UX0ZPVU5EKS5qc29uKHt1c2VyOiBbdGhpcy5nZXRVc2VyTm90Rm91bmRNZXNzYWdlKGJvZHkubGFuZyB8fCAnZW4nKV19KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBudW1iZXIgPSBib2R5LnBob25lX251bWJlcjtcbiAgICAgICAgaWYgKG51bWJlci5jaGFyQXQoMCkgPT09ICcrJykge1xuICAgICAgICAgICAgbnVtYmVyID0gbnVtYmVyLnN1YnN0cmluZygxKTtcbiAgICAgICAgfVxuICAgICAgICBudW1iZXIgPSBudW1iZXIuc3Vic3RyaW5nKDEpO1xuICAgICAgICBsZXQgdXNlclRlbGVncmFtID0gYXdhaXQgdGhpcy50ZWxlZ3JhbVNlcnZlci51c2VyRXhpc3RzKG5ldyBSZWdFeHAoJ144fDcnICsgbnVtYmVyICsgJyQnLCAnaScpKTtcbiAgICAgICAgLy8gdG9kbyBkZXZpY2UgY2hlY2sgZW1iZWRlZCwgIGNlcnRcbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5PSykuanNvbih7XG4gICAgICAgICAgICBzdGF0dXM6ICdzdWNjZXNzJyxcbiAgICAgICAgICAgIHB1c2hfdG9rZW46IHVzZXIuUHVzaFRva2VuICE9PSAnJyxcbiAgICAgICAgICAgIHJlZ2lzdGVyZWRfaW5fdGVsZWdyYW06IHVzZXJUZWxlZ3JhbSAhPT0gbnVsbFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBWZXJpZnkgaWYgdXNlciBjb25maXJtZWQgb3IgcmVqZWN0ZWQgdGhlIHZlcmlmaWNhdGlvblxuICAgICAqXG4gICAgICogQHBhcmFtIHJlcVxuICAgICAqIEBwYXJhbSByZXNcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn1cbiAgICAgKi9cbiAgICBAUG9zdCgnY2hlY2stcHVzaC12ZXJpZmljYXRpb24nKVxuICAgIGFzeW5jIGNoZWNrUHVzaFZlcmlmaWNhdGlvbihAUmVxKCkgcmVxLCBAUmVzKCkgcmVzKSB7XG4gICAgICAgIGxldCB0ZmFVc2VyID0gYXdhaXQgdGhpcy5nZXRVc2VyKHJlcS5ib2R5LnBob25lX251bWJlciwgJ3RmYScpO1xuICAgICAgICBjb25zdCByZWRpc0tleSA9IGAke3RmYVVzZXIuUGhvbmVOdW1iZXJ9OiR7UkVESVNfVVNFUl9QVVNIX1JFU1VMVF9QT1NURklYfWA7XG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IGF3YWl0IHRoaXMucmVkaXNDbGllbnQuZ2V0QXN5bmMocmVkaXNLZXkpO1xuICAgICAgICBpZiAoc3RhdHVzID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuT0spLmpzb24oe3N0YXR1czogYE5PVF9WRVJJRklFRF9ZRVRgfSk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGhpcy5yZWRpc0NsaWVudC5kZWwocmVkaXNLZXkpO1xuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk9LKS5qc29uKHtzdGF0dXM6IHN0YXR1c30pO1xuICAgIH1cblxuICAgIC8qKipcbiAgICAgKiBFbnRlciB0aGUgc2VydmljZVxuICAgICAqIFxuICAgICAqIEBwYXJhbSByZXNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc2VydmljZVxuICAgICAqL1xuICAgIEBHZXQoJ2VudGVyJylcbiAgICBnZXRFbnRlcihAUmVzKCkgcmVzLFxuICAgICAgICAgICAgIEBRdWVyeSgnZXZlbnQnKSBldmVudDogc3RyaW5nLFxuICAgICAgICAgICAgIEBRdWVyeSgnc2VydmljZScpIHNlcnZpY2U6IHN0cmluZykge1xuICAgICAgICBsZXQgdiA9IG5ldyBWYWxpZGF0b3Ioe1xuICAgICAgICAgICAgZXZlbnQ6IGV2ZW50LFxuICAgICAgICAgICAgc2VydmljZTogc2VydmljZVxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBldmVudDogJ3JlcXVpcmVkfHN0cmluZycsXG4gICAgICAgICAgICBzZXJ2aWNlOiAncmVxdWlyZWR8c3RyaW5nfGluOmthenRlbCxlZ292JyxcbiAgICAgICAgfSwgeydzZXJ2aWNlLmluJzogYE5vIHNlcnZpY2Ugd2l0aCBuYW1lOiAke3NlcnZpY2V9YH0pO1xuICAgICAgICBpZiAodi5mYWlscygpKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHYuZ2V0RXJyb3JzKCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXMucmVkaXJlY3QoYCR7RW52Q29uZmlnLkZST05URU5EX0FQSX0/c2VydmljZT0ke3NlcnZpY2V9JmV2ZW50PSR7ZXZlbnR9YCk7XG4gICAgfVxufSJdfQ==