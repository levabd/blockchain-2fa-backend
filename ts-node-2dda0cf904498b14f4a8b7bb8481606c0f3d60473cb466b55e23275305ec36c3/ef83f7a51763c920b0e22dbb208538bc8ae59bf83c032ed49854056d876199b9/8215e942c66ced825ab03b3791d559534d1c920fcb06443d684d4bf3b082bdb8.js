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
const post_verify_number_dto_1 = require("../../shared/models/dto/post.verify.number.dto");
const queue_service_1 = require("../../../services/code_sender/queue.service");
const services_1 = require("../../../config/services/services");
const time_helper_1 = require("../../../services/helpers/time.helper");
const validation_helper_1 = require("../../../services/helpers/validation.helper");
const tfa_transaction_family_1 = require("../../shared/families/tfa.transaction.family");
const kaztel_transaction_family_1 = require("../../shared/families/kaztel.transaction.family");
const chain_service_1 = require("../../../services/sawtooth/chain.service");
const egov_transaction_family_1 = require("../../shared/families/egov.transaction.family");
const user_log_1 = require("../../shared/models/user.log");
const post_verify_dto_1 = require("../../shared/models/dto/post.verify.dto");
const controller_1 = require("./controller");
const constants_1 = require("../../../config/constants");
const helpers_1 = require("../../../services/helpers/helpers");
const services_2 = require("../../../services/code_sender/services");
const post_code_dto_1 = require("../../shared/models/dto/post.code.dto");
const env_1 = require("../../../config/env");
const telegram_server_1 = require("../../../services/telegram/telegram.server");
const Telegraf = require('telegraf');
const fs = require('fs');
const protobufLib = require('protocol-buffers');
const messagesService = protobufLib(fs.readFileSync('src/proto/service.proto'));
const messagesServiceClient = protobufLib(fs.readFileSync('src/proto/service_client.proto'));
let UserController = class UserController extends controller_1.ApiController {
    constructor(timeHelper, tfaTF, kaztelTF, egovTF, chainService, services, telegramServer, codeQueueListenerService) {
        super(tfaTF, kaztelTF, egovTF);
        this.timeHelper = timeHelper;
        this.tfaTF = tfaTF;
        this.kaztelTF = kaztelTF;
        this.egovTF = egovTF;
        this.chainService = chainService;
        this.services = services;
        this.telegramServer = telegramServer;
        this.codeQueueListenerService = codeQueueListenerService;
        this.telegrafApp = new Telegraf(env_1.EnvConfig.TELEGRAM_BOT_KEY);
    }
    sendUserCode(req, res, phoneNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('get verify-number');
            let v = new validation_helper_1.Validator({ phone_number: phoneNumber }, { phone_number: 'required|string|regex:/^\\+?[1-9]\\d{1,14}$/', });
            if (v.fails()) {
                return res.status(common_1.HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
            }
            let user = yield this.getUser(phoneNumber, 'tfa');
            if (user === null) {
                console.log('user not found!!!!!');
                return res.status(common_1.HttpStatus.NOT_FOUND).json({ user: [this.getUserNotFoundMessage(req.query.lang || 'en')] });
            }
            const code = helpers_1.genCode();
            if (phoneNumber.charAt(0) === '+') {
                phoneNumber = phoneNumber.substring(1);
            }
            let self = this;
            this.redisClient.setAsync(`${phoneNumber}:${constants_1.REDIS_USER_POSTFIX}`, `${code}`, 'EX', 7 * 60).then(() => {
                self.codeQueueListenerService.queueSMS.add({
                    phone_number: phoneNumber,
                    service: 'kaztel',
                    code: code,
                    registration: true,
                });
            });
            return res.status(common_1.HttpStatus.OK).json({ status: 'success' });
        });
    }
    verifyNumber(res, body) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('post verify-number');
            let v = new validation_helper_1.Validator(body, {
                phone_number: 'required|string|regex:/^\\+?[1-9]\\d{1,14}$/',
                push_token: 'nullable|string',
                code: 'required|number',
            }, {
                'service.requiredIfNot': `The service field is required when push_token is empty.`
            });
            if (v.fails()) {
                return res.status(common_1.HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
            }
            if (body.phone_number.charAt(0) === '+') {
                body.phone_number = body.phone_number.substring(1);
            }
            let user = yield this.getUser(body.phone_number, 'tfa');
            console.log('user', user);
            if (user === null) {
                return res.status(common_1.HttpStatus.NOT_FOUND).json({ user: [this.getUserNotFoundMessage(body.lang || 'en')] });
            }
            const redisKey = `${body.phone_number}:${constants_1.REDIS_USER_POSTFIX}`;
            const codeFromRedis = yield this.redisClient.getAsync(redisKey);
            if (codeFromRedis == null) {
                return res.status(common_1.HttpStatus.UNPROCESSABLE_ENTITY).json({
                    code: [body.lang === 'ru' ? 'Кода либо нету либо его срок истёк' : "The 'Code' expires or does not exists."]
                });
            }
            if (parseInt(codeFromRedis, 10) != parseInt(body.code, 10)) {
                return res.status(common_1.HttpStatus.UNPROCESSABLE_ENTITY).json({
                    code: [body.lang === 'ru' ? 'Вы ввели неверный код' : "The 'Code' is not valid."]
                });
            }
            yield this.redisClient.del(redisKey);
            let userKaztel = yield this.getUser(user.PhoneNumber, 'kaztel');
            let userEgov = yield this.getUser(user.PhoneNumber, 'egov');
            let addresses = [
                this.chainService.getAddress(user.PhoneNumber, 'tfa'),
            ];
            if (userKaztel !== null) {
                addresses.push(this.chainService.getAddress(user.PhoneNumber, 'kaztel'));
            }
            if (userEgov !== null) {
                addresses.push(this.chainService.getAddress(user.PhoneNumber, 'egov'));
            }
            let ws = this.openWsConnection(addresses);
            user.IsVerified = true;
            user.PushToken = body.push_token;
            yield this.tfaTF.updateUser(user.PhoneNumber, user);
            if (userKaztel !== null) {
                userKaztel.IsVerified = true;
                yield this.kaztelTF.updateUser(user.PhoneNumber, userKaztel);
            }
            if (userEgov !== null) {
                userKaztel.IsVerified = true;
                yield this.egovTF.updateUser(user.PhoneNumber, userEgov);
            }
            let responseSend = false;
            ws.onmessage = mess => {
                const data = JSON.parse(mess.data);
                for (let stateChange of data.state_changes) {
                    if (addresses.indexOf(stateChange.address) !== -1) {
                        const _user = messagesService.User.decode(new Buffer(stateChange.value, 'base64'));
                        if (responseSend) {
                            ws.send(JSON.stringify({
                                'action': 'unsubscribe'
                            }));
                            break;
                        }
                        if (_user.IsVerified) {
                            try {
                                responseSend = true;
                                return res.status(common_1.HttpStatus.OK).json({ status: 'success' });
                            }
                            catch (e) {
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
        });
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
                                        message: `Подтвердите вход на сервис: '${services_2.Services[body.service]}'`,
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
                                        message: 'Ваш код подтверждения для сервиса "' + services_2.Services[body.service] + '": ' + log.Code,
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
    getCode(req, res, phoneNumber, pushToken, clientTimestamp) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                req.query.client_timestamp = parseInt(req.query.client_timestamp, 10);
            }
            catch (e) {
                console.log('e', e);
            }
            let v = new validation_helper_1.Validator(req.query, {
                phone_number: 'required|string|regex:/^\\+?[1-9]\\d{1,14}$/',
                push_token: 'required|string',
                client_timestamp: 'required|number',
            });
            if (v.fails()) {
                return res.status(common_1.HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
            }
            let tfaKaztel = yield this.getUser(phoneNumber, 'tfa');
            if (!tfaKaztel) {
                return res.status(common_1.HttpStatus.NOT_FOUND).json({ user: [this.getUserNotFoundMessage(req.query.lang || 'en')] });
            }
            if (!tfaKaztel.IsVerified || tfaKaztel.PushToken !== pushToken) {
                return res.status(common_1.HttpStatus.NOT_FOUND).json({ user: [this.getUserNotFoundMessage(req.query.lang || 'en')] });
            }
            let userKaztel = yield this.getUser(tfaKaztel.PhoneNumber, 'kaztel');
            let userEgov = yield this.getUser(tfaKaztel.PhoneNumber, 'egov');
            if (userKaztel === null && userEgov == null) {
                return res.status(common_1.HttpStatus.NOT_FOUND).json({ user: [this.getUserNotFoundMessage(req.query.lang || 'en')] });
            }
            let { logKaztel, logEgov } = this.initLogs(userKaztel, userEgov);
            if (logKaztel.status !== 'success' && logEgov.status !== 'success') {
                switch (logKaztel.status) {
                    case 'no_send_codes':
                        return res.status(common_1.HttpStatus.UNPROCESSABLE_ENTITY).json({
                            user: [req.query.lang == 'ru' ? 'Пользователю ещё не отправили ни одного кода подтверждения' : 'No code for user yet']
                        });
                    case 'no_code_used':
                        return res.status(common_1.HttpStatus.UNPROCESSABLE_ENTITY)
                            .json({
                            user: [req.query.lang == 'ru'
                                    ? 'Пользователю ещё не отправили ни одного кода подтверждения'
                                    : 'No code for user yet']
                        });
                    default:
                        return res.status(common_1.HttpStatus.UNPROCESSABLE_ENTITY).json({ user: ['Error getting code'] });
                }
            }
            if (logKaztel.status === 'success') {
                return res.status(common_1.HttpStatus.OK).json(this.transformLog(logKaztel.log, 'kaztel'));
            }
            if (logEgov.status === 'success') {
                return res.status(common_1.HttpStatus.OK).json(this.transformLog(logEgov.log, 'egov'));
            }
            return res.status(common_1.HttpStatus.UNPROCESSABLE_ENTITY).json({ user: ['Error getting code'] });
        });
    }
    postVerify(res, body) {
        return __awaiter(this, void 0, void 0, function* () {
            let v = new validation_helper_1.Validator(body, {
                event: 'required|string', lang: 'string', code: 'required|number', service: 'requiredIfNot:push_token|string|in:kaztel,egov',
                phone_number: 'required|string|regex:/^\\+?[1-9]\\d{1,14}$/', embeded: 'boolean',
                status: 'string', client_timestamp: 'required', cert: 'nullable',
            }, { 'service.in': `No service with name: ${body.service}` });
            if (v.fails()) {
                return res.status(common_1.HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
            }
            let user = yield this.getUser(body.phone_number, body.service);
            if (user === null) {
                return res.status(common_1.HttpStatus.NOT_FOUND).json({
                    user: [this.getUserNotFoundMessage(body.lang || 'en')]
                });
            }
            let addresses = [
                this.chainService.getAddress(user.PhoneNumber, body.service),
            ];
            let ws = this.openWsConnection(addresses);
            try {
                yield this.storeLog(body, user);
            }
            catch (e) {
                console.error(`Error while getting user`, e);
                return res.status(common_1.HttpStatus.BAD_GATEWAY).json({ error: 'Error checking code.' });
            }
            let self = this;
            let tfaUser = yield this.getUser(body.phone_number, 'tfa');
            ws.onmessage = mess => {
                const data = JSON.parse(mess.data);
                let responseSend = false;
                for (let stateChange of data.state_changes) {
                    if (responseSend) {
                        ws.send(JSON.stringify({ 'action': 'unsubscribe' }));
                        break;
                    }
                    if (addresses.indexOf(stateChange.address) !== -1) {
                        const _user = messagesServiceClient.User.decode(new Buffer(stateChange.value, 'base64'));
                        if (_user.Logs.length === user.Logs.length) {
                            console.log('_user.Logs', _user.Logs);
                            continue;
                        }
                        responseSend = true;
                        ws.send(JSON.stringify({ 'action': 'unsubscribe' }));
                        const status = _user.Logs[_user.Logs.length - 1].Status;
                        self.redisClient.setAsync(`${tfaUser.PhoneNumber}:${constants_1.REDIS_USER_PUSH_RESULT_POSTFIX}`, status, 'EX', 15 * 60).then(() => {
                            if (status === constants_1.VALID || status === constants_1.REJECT) {
                                return res.status(common_1.HttpStatus.OK).json({ status: status, user: _user });
                            }
                            else {
                                if (status === 'EXPIRED') {
                                    return res.status(440).json({ status: status });
                                }
                                return res.status(common_1.HttpStatus.BAD_REQUEST).json({ status: status });
                            }
                        });
                    }
                }
            };
        });
    }
    initLogs(userKaztel, userEgov) {
        let logKaztel = { status: 'no_send_codes', log: { Service: null } };
        if (userKaztel) {
            logKaztel = this.getLatestCode(userKaztel);
        }
        let logEgov = { status: 'no_send_codes', log: { Service: null } };
        if (userEgov) {
            logEgov = this.getLatestCode(userEgov);
        }
        return { logKaztel, logEgov };
    }
    storeLog(body, user) {
        return __awaiter(this, void 0, void 0, function* () {
            let rejectStatus = null;
            if (body.status && body.status === 'REJECT') {
                rejectStatus = 'REJECT';
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
        });
    }
};
__decorate([
    common_1.Get('verify-number'),
    __param(0, common_1.Req()),
    __param(1, common_1.Res()),
    __param(2, common_1.Query('phone_number')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "sendUserCode", null);
__decorate([
    common_1.Post('verify-number'),
    __param(0, common_1.Res()), __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, post_verify_number_dto_1.PostVerifyNumberDTO]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "verifyNumber", null);
__decorate([
    common_1.Post('code'),
    __param(0, common_1.Res()), __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, post_code_dto_1.PostCodeDTO]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "postCode", null);
__decorate([
    common_1.Get('code'),
    __param(0, common_1.Req()), __param(1, common_1.Res()), __param(2, common_1.Query('phone_number')), __param(3, common_1.Query('push_token')),
    __param(4, common_1.Query('client_timestamp')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getCode", null);
__decorate([
    common_1.Post('verify'),
    __param(0, common_1.Res()), __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, post_verify_dto_1.PostVerifyCodeDTO]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "postVerify", null);
UserController = __decorate([
    swagger_1.ApiUseTags('v1/api/users'),
    common_1.Controller('v1/api/users'),
    __metadata("design:paramtypes", [time_helper_1.TimeHelper,
        tfa_transaction_family_1.TfaTransactionFamily,
        kaztel_transaction_family_1.KaztelTransactionFamily,
        egov_transaction_family_1.EgovTransactionFamily,
        chain_service_1.ChainService,
        services_1.ClientService,
        telegram_server_1.TelegramServer,
        queue_service_1.CodeQueueListenerService])
], UserController);
exports.UserController = UserController;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvY29udHJvbGxzZXJzL3VzZXIuY29udHJvbGxlci50cyIsInNvdXJjZXMiOlsiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvY29udHJvbGxzZXJzL3VzZXIuY29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkNBQXdGO0FBQ3hGLDZDQUEyQztBQUMzQywyRkFBbUY7QUFDbkYsK0VBQXFGO0FBQ3JGLGdFQUFnRTtBQUNoRSx1RUFBaUU7QUFDakUsbUZBQXNFO0FBQ3RFLHlGQUFrRjtBQUNsRiwrRkFBd0Y7QUFDeEYsNEVBQXNFO0FBQ3RFLDJGQUFvRjtBQUNwRiwyREFBcUQ7QUFDckQsNkVBQTBFO0FBQzFFLDZDQUEyQztBQUMzQyx5REFBb0k7QUFFcEksK0RBQTJFO0FBQzNFLHFFQUFnRTtBQUNoRSx5RUFBa0U7QUFDbEUsNkNBQThDO0FBQzlDLGdGQUEwRTtBQUMxRSxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFFckMsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3pCLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0FBQ2hELE1BQU0sZUFBZSxHQUFHLFdBQVcsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQztBQUNoRixNQUFNLHFCQUFxQixHQUFHLFdBQVcsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLGdDQUFnQyxDQUFDLENBQUMsQ0FBQztBQUk3RixJQUFhLGNBQWMsR0FBM0Isb0JBQTRCLFNBQVEsMEJBQWE7SUFlN0MsWUFBb0IsVUFBc0IsRUFDdkIsS0FBMkIsRUFDM0Is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QUMsQ0FBQSxFQUF1QixXQUFBLGNBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQTtJQUN2RixXQUFBLGNBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFBOzs7OzZDQW1EdkM7QUFHRDtJQURDLGFBQUksQ0FBQyxRQUFRLENBQUM7SUFDRyxXQUFBLFlBQUcsRUFBRSxDQUFBLEVBQU8sV0FBQSxhQUFJLEVBQUUsQ0FBQTs7NkNBQU8sbUNBQWlCOztnREFpRTNEO0FBemFRLGNBQWM7SUFGMUIsb0JBQVUsQ0FBQyxjQUFjLENBQUM7SUFDMUIsbUJBQVUsQ0FBQyxjQUFjLENBQUM7cUNBZ0JTLHdCQUFVO1FBQ2hCLDZDQUFvQjtRQUNqQixtREFBdUI7UUFDekIsK0NBQXFCO1FBQ2YsNEJBQVk7UUFDZix3QkFBYTtRQUNQLGdDQUFjO1FBQ0osd0NBQXdCO0dBdEI3RCxjQUFjLENBc2MxQjtBQXRjWSx3Q0FBYyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7Qm9keSwgQ29udHJvbGxlciwgR2V0LCBIdHRwU3RhdHVzLCBQb3N0LCBRdWVyeSwgUmVxLCBSZXN9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcbmltcG9ydCB7QXBpVXNlVGFnc30gZnJvbSAnQG5lc3Rqcy9zd2FnZ2VyJztcbmltcG9ydCB7UG9zdFZlcmlmeU51bWJlckRUT30gZnJvbSAnLi4vLi4vc2hhcmVkL21vZGVscy9kdG8vcG9zdC52ZXJpZnkubnVtYmVyLmR0byc7XG5pbXBvcnQge0NvZGVRdWV1ZUxpc3RlbmVyU2VydmljZX0gZnJvbSAnLi4vLi4vLi4vc2VydmljZXMvY29kZV9zZW5kZXIvcXVldWUuc2VydmljZSc7XG5pbXBvcnQge0NsaWVudFNlcnZpY2V9IGZyb20gJy4uLy4uLy4uL2NvbmZpZy9zZXJ2aWNlcy9zZXJ2aWNlcyc7XG5pbXBvcnQge1RpbWVIZWxwZXJ9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL2hlbHBlcnMvdGltZS5oZWxwZXInO1xuaW1wb3J0IHtWYWxpZGF0b3J9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL2hlbHBlcnMvdmFsaWRhdGlvbi5oZWxwZXInO1xuaW1wb3J0IHtUZmFUcmFuc2FjdGlvbkZhbWlseX0gZnJvbSAnLi4vLi4vc2hhcmVkL2ZhbWlsaWVzL3RmYS50cmFuc2FjdGlvbi5mYW1pbHknO1xuaW1wb3J0IHtLYXp0ZWxUcmFuc2FjdGlvbkZhbWlseX0gZnJvbSAnLi4vLi4vc2hhcmVkL2ZhbWlsaWVzL2thenRlbC50cmFuc2FjdGlvbi5mYW1pbHknO1xuaW1wb3J0IHtDaGFpblNlcnZpY2V9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL3Nhd3Rvb3RoL2NoYWluLnNlcnZpY2UnO1xuaW1wb3J0IHtFZ292VHJhbnNhY3Rpb25GYW1pbHl9IGZyb20gJy4uLy4uL3NoYXJlZC9mYW1pbGllcy9lZ292LnRyYW5zYWN0aW9uLmZhbWlseSc7XG5pbXBvcnQge1VzZXJMb2d9IGZyb20gJy4uLy4uL3NoYXJlZC9tb2RlbHMvdXNlci5sb2cnO1xuaW1wb3J0IHtQb3N0VmVyaWZ5Q29kZURUT30gZnJvbSAnLi4vLi4vc2hhcmVkL21vZGVscy9kdG8vcG9zdC52ZXJpZnkuZHRvJztcbmltcG9ydCB7QXBpQ29udHJvbGxlcn0gZnJvbSAnLi9jb250cm9sbGVyJztcbmltcG9ydCB7UkVESVNfVVNFUl9QT1NURklYLCBSRURJU19VU0VSX1BVU0hfUkVTVUxUX1BPU1RGSVgsIFJFSkVDVCwgUkVTRU5EX0NPREUsIFNFTkRfQ09ERSwgVkFMSUR9IGZyb20gJy4uLy4uLy4uL2NvbmZpZy9jb25zdGFudHMnO1xuaW1wb3J0IHtQb3N0Q2xpZW50VXNlckRUT30gZnJvbSAnLi4vLi4vc2hhcmVkL21vZGVscy9kdG8vcG9zdC5rYXp0ZWwudXNlci5kdG8nO1xuaW1wb3J0IHtfZ2V0TGF0ZXN0SW5kZXgsIGdlbkNvZGV9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL2hlbHBlcnMvaGVscGVycyc7XG5pbXBvcnQge1NlcnZpY2VzfSBmcm9tICcuLi8uLi8uLi9zZXJ2aWNlcy9jb2RlX3NlbmRlci9zZXJ2aWNlcyc7XG5pbXBvcnQge1Bvc3RDb2RlRFRPfSBmcm9tICcuLi8uLi9zaGFyZWQvbW9kZWxzL2R0by9wb3N0LmNvZGUuZHRvJztcbmltcG9ydCB7RW52Q29uZmlnfSBmcm9tICcuLi8uLi8uLi9jb25maWcvZW52JztcbmltcG9ydCB7VGVsZWdyYW1TZXJ2ZXJ9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL3RlbGVncmFtL3RlbGVncmFtLnNlcnZlcic7XG5jb25zdCBUZWxlZ3JhZiA9IHJlcXVpcmUoJ3RlbGVncmFmJyk7XG5cbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcbmNvbnN0IHByb3RvYnVmTGliID0gcmVxdWlyZSgncHJvdG9jb2wtYnVmZmVycycpO1xuY29uc3QgbWVzc2FnZXNTZXJ2aWNlID0gcHJvdG9idWZMaWIoZnMucmVhZEZpbGVTeW5jKCdzcmMvcHJvdG8vc2VydmljZS5wcm90bycpKTtcbmNvbnN0IG1lc3NhZ2VzU2VydmljZUNsaWVudCA9IHByb3RvYnVmTGliKGZzLnJlYWRGaWxlU3luYygnc3JjL3Byb3RvL3NlcnZpY2VfY2xpZW50LnByb3RvJykpO1xuXG5AQXBpVXNlVGFncygndjEvYXBpL3VzZXJzJylcbkBDb250cm9sbGVyKCd2MS9hcGkvdXNlcnMnKVxuZXhwb3J0IGNsYXNzIFVzZXJDb250cm9sbGVyIGV4dGVuZHMgQXBpQ29udHJvbGxlciB7XG4gICAgcHJpdmF0ZSB0ZWxlZ3JhZkFwcDogYW55O1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBVc2VyQ29udHJvbGxlci5cbiAgICAgKiBAbWVtYmVyb2YgQXBpQ29udHJvbGxlclxuICAgICAqIEBwYXJhbSB0aW1lSGVscGVyXG4gICAgICogQHBhcmFtIHRmYVRGXG4gICAgICogQHBhcmFtIGthenRlbFRGXG4gICAgICogQHBhcmFtIGVnb3ZURlxuICAgICAqIEBwYXJhbSBjaGFpblNlcnZpY2VcbiAgICAgKiBAcGFyYW0gc2VydmljZXNcbiAgICAgKiBAcGFyYW0gdGVsZWdyYW1TZXJ2ZXJcbiAgICAgKiBAcGFyYW0gY29kZVF1ZXVlTGlzdGVuZXJTZXJ2aWNlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSB0aW1lSGVscGVyOiBUaW1lSGVscGVyLFxuICAgICAgICAgICAgICAgIHB1YmxpYyB0ZmFURjogVGZhVHJhbnNhY3Rpb25GYW1pbHksXG4gICAgICAgICAgICAgICAgcHVibGljIGthenRlbFRGOiBLYXp0ZWxUcmFuc2FjdGlvbkZhbWlseSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgZWdvdlRGOiBFZ292VHJhbnNhY3Rpb25GYW1pbHksXG4gICAgICAgICAgICAgICAgcHVibGljIGNoYWluU2VydmljZTogQ2hhaW5TZXJ2aWNlLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgc2VydmljZXM6IENsaWVudFNlcnZpY2UsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSB0ZWxlZ3JhbVNlcnZlcjogVGVsZWdyYW1TZXJ2ZXIsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBjb2RlUXVldWVMaXN0ZW5lclNlcnZpY2U6IENvZGVRdWV1ZUxpc3RlbmVyU2VydmljZSkge1xuICAgICAgICBzdXBlcih0ZmFURiwga2F6dGVsVEYsIGVnb3ZURik7XG4gICAgICAgIHRoaXMudGVsZWdyYWZBcHAgPSBuZXcgVGVsZWdyYWYoRW52Q29uZmlnLlRFTEVHUkFNX0JPVF9LRVkpO1xuICAgIH1cblxuICAgIEBHZXQoJ3ZlcmlmeS1udW1iZXInKVxuICAgIGFzeW5jIHNlbmRVc2VyQ29kZShAUmVxKCkgcmVxLFxuICAgICAgICAgICAgICAgICAgICAgICBAUmVzKCkgcmVzLFxuICAgICAgICAgICAgICAgICAgICAgICBAUXVlcnkoJ3Bob25lX251bWJlcicpIHBob25lTnVtYmVyOiBzdHJpbmcpOiBQcm9taXNlPGFueVtdPiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdnZXQgdmVyaWZ5LW51bWJlcicpO1xuXG4gICAgICAgIGxldCB2ID0gbmV3IFZhbGlkYXRvcih7cGhvbmVfbnVtYmVyOiBwaG9uZU51bWJlcn0sIHtwaG9uZV9udW1iZXI6ICdyZXF1aXJlZHxzdHJpbmd8cmVnZXg6L15cXFxcKz9bMS05XVxcXFxkezEsMTR9JC8nLH0pO1xuICAgICAgICBpZiAodi5mYWlscygpKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHYuZ2V0RXJyb3JzKCkpO1xuICAgICAgICB9XG4gICAgICAgIGxldCB1c2VyID0gYXdhaXQgdGhpcy5nZXRVc2VyKHBob25lTnVtYmVyLCAndGZhJyk7XG4gICAgICAgIGlmICh1c2VyID09PSBudWxsKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygndXNlciBub3QgZm91bmQhISEhIScpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5OT1RfRk9VTkQpLmpzb24oe3VzZXI6IFt0aGlzLmdldFVzZXJOb3RGb3VuZE1lc3NhZ2UocmVxLnF1ZXJ5LmxhbmcgfHwgJ2VuJyldfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29kZSA9IGdlbkNvZGUoKTtcbiAgICAgICAgaWYgKHBob25lTnVtYmVyLmNoYXJBdCgwKSA9PT0gJysnKSB7XG4gICAgICAgICAgICBwaG9uZU51bWJlciA9IHBob25lTnVtYmVyLnN1YnN0cmluZygxKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgICAgIC8vIHNhdmUgY29kZSB0byByZWRpc1xuICAgICAgICAvLyB0aGlzIGtleSB3aWxsIGV4cGlyZSBhZnRlciA4ICogNjAgc2Vjb25kc1xuICAgICAgICB0aGlzLnJlZGlzQ2xpZW50LnNldEFzeW5jKGAke3Bob25lTnVtYmVyfToke1JFRElTX1VTRVJfUE9TVEZJWH1gLCBgJHtjb2RlfWAsICdFWCcsIDcgKiA2MCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvLyBzZW5kIHNtc1xuICAgICAgICAgICAgc2VsZi5jb2RlUXVldWVMaXN0ZW5lclNlcnZpY2UucXVldWVTTVMuYWRkKHtcbiAgICAgICAgICAgICAgICBwaG9uZV9udW1iZXI6IHBob25lTnVtYmVyLFxuICAgICAgICAgICAgICAgIHNlcnZpY2U6ICdrYXp0ZWwnLFxuICAgICAgICAgICAgICAgIGNvZGU6IGNvZGUsXG4gICAgICAgICAgICAgICAgcmVnaXN0cmF0aW9uOiB0cnVlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk9LKS5qc29uKHtzdGF0dXM6ICdzdWNjZXNzJ30pO1xuICAgIH1cblxuICAgIEBQb3N0KCd2ZXJpZnktbnVtYmVyJylcbiAgICBhc3luYyB2ZXJpZnlOdW1iZXIoQFJlcygpIHJlcywgQEJvZHkoKSBib2R5OiBQb3N0VmVyaWZ5TnVtYmVyRFRPKTogUHJvbWlzZTxhbnlbXT4ge1xuICAgICAgICBjb25zb2xlLmxvZygncG9zdCB2ZXJpZnktbnVtYmVyJyk7XG5cbiAgICAgICAgLy8g0LLQsNC70LjQtNCw0YbQuNGPXG4gICAgICAgIGxldCB2ID0gbmV3IFZhbGlkYXRvcihib2R5LCB7XG4gICAgICAgICAgICBwaG9uZV9udW1iZXI6ICdyZXF1aXJlZHxzdHJpbmd8cmVnZXg6L15cXFxcKz9bMS05XVxcXFxkezEsMTR9JC8nLFxuICAgICAgICAgICAgcHVzaF90b2tlbjogJ251bGxhYmxlfHN0cmluZycsXG4gICAgICAgICAgICBjb2RlOiAncmVxdWlyZWR8bnVtYmVyJyxcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgJ3NlcnZpY2UucmVxdWlyZWRJZk5vdCc6IGBUaGUgc2VydmljZSBmaWVsZCBpcyByZXF1aXJlZCB3aGVuIHB1c2hfdG9rZW4gaXMgZW1wdHkuYFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHYuZmFpbHMoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih2LmdldEVycm9ycygpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyDRg9Cx0YDQsNGC0Ywg0L/Qu9GO0YEg0LIg0L3QsNGH0LDQu9C1INC90L7QvNC10YDQsCDRgtC10LvQtdGE0L7QvdCwINC10YHQu9C4INC+0L0g0LXRgdGC0YxcbiAgICAgICAgaWYgKGJvZHkucGhvbmVfbnVtYmVyLmNoYXJBdCgwKSA9PT0gJysnKSB7XG4gICAgICAgICAgICBib2R5LnBob25lX251bWJlciA9IGJvZHkucGhvbmVfbnVtYmVyLnN1YnN0cmluZygxKTtcbiAgICAgICAgfVxuICAgICAgICAvLyDQn9GA0L7QstC10YDQutCwLCDRgdGD0YnQtdGB0YLQstGD0LXRgiDQu9C4INC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjFxuICAgICAgICBsZXQgdXNlciA9IGF3YWl0IHRoaXMuZ2V0VXNlcihib2R5LnBob25lX251bWJlciwgJ3RmYScpO1xuICAgICAgICBjb25zb2xlLmxvZygndXNlcicsIHVzZXIpO1xuICAgICAgICBpZiAodXNlciA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5OT1RfRk9VTkQpLmpzb24oe3VzZXI6IFt0aGlzLmdldFVzZXJOb3RGb3VuZE1lc3NhZ2UoYm9keS5sYW5nIHx8ICdlbicpXX0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlZGlzS2V5ID0gYCR7Ym9keS5waG9uZV9udW1iZXJ9OiR7UkVESVNfVVNFUl9QT1NURklYfWA7XG4gICAgICAgIC8vINC/0YDQvtCy0LXRgNC60LAg0LrQvtC00LBcbiAgICAgICAgY29uc3QgY29kZUZyb21SZWRpcyA9IGF3YWl0IHRoaXMucmVkaXNDbGllbnQuZ2V0QXN5bmMocmVkaXNLZXkpO1xuICAgICAgICBpZiAoY29kZUZyb21SZWRpcyA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHtcbiAgICAgICAgICAgICAgICBjb2RlOiBbYm9keS5sYW5nID09PSAncnUnID8gJ9Ca0L7QtNCwINC70LjQsdC+INC90LXRgtGDINC70LjQsdC+INC10LPQviDRgdGA0L7QuiDQuNGB0YLRkdC6JyA6IFwiVGhlICdDb2RlJyBleHBpcmVzIG9yIGRvZXMgbm90IGV4aXN0cy5cIl1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYXJzZUludChjb2RlRnJvbVJlZGlzLCAxMCkgIT0gcGFyc2VJbnQoYm9keS5jb2RlLCAxMCkpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFkpLmpzb24oe1xuICAgICAgICAgICAgICAgIGNvZGU6IFtib2R5LmxhbmcgPT09ICdydScgPyAn0JLRiyDQstCy0LXQu9C4INC90LXQstC10YDQvdGL0Lkg0LrQvtC0JyA6IFwiVGhlICdDb2RlJyBpcyBub3QgdmFsaWQuXCJdXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0aGlzLnJlZGlzQ2xpZW50LmRlbChyZWRpc0tleSk7XG5cbiAgICAgICAgLy8g0L/QvtC00LPQvtGC0L7QstC60LAg0LDQtNGA0LXRgdC+0LIsINC30LAg0LrQvtGC0L7RgNGL0LzQuCDQvdGD0LbQvdC+INC+0YLRgdC70LXQtNC40YLRjCDRg9GB0L/QtdGI0L3QvtC1INC/0YDQvtGF0L7QttC00LXQvdC40LUg0YLRgNCw0L3Qt9Cw0LrRhtC40LhcbiAgICAgICAgbGV0IHVzZXJLYXp0ZWwgPSBhd2FpdCB0aGlzLmdldFVzZXIodXNlci5QaG9uZU51bWJlciwgJ2thenRlbCcpO1xuICAgICAgICBsZXQgdXNlckVnb3YgPSBhd2FpdCB0aGlzLmdldFVzZXIodXNlci5QaG9uZU51bWJlciwgJ2Vnb3YnKTtcbiAgICAgICAgbGV0IGFkZHJlc3NlcyA9IFtcbiAgICAgICAgICAgIHRoaXMuY2hhaW5TZXJ2aWNlLmdldEFkZHJlc3ModXNlci5QaG9uZU51bWJlciwgJ3RmYScpLFxuICAgICAgICBdO1xuICAgICAgICBpZiAodXNlckthenRlbCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgYWRkcmVzc2VzLnB1c2godGhpcy5jaGFpblNlcnZpY2UuZ2V0QWRkcmVzcyh1c2VyLlBob25lTnVtYmVyLCAna2F6dGVsJykpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1c2VyRWdvdiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgYWRkcmVzc2VzLnB1c2godGhpcy5jaGFpblNlcnZpY2UuZ2V0QWRkcmVzcyh1c2VyLlBob25lTnVtYmVyLCAnZWdvdicpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyDQvdCw0YfQuNC90LDQtdC8INGB0LvRg9GI0LDRgtGMINC40LfQvNC10L3QtdC90LjRjyDQsNC00YDQtdGB0L7QslxuICAgICAgICBsZXQgd3MgPSB0aGlzLm9wZW5Xc0Nvbm5lY3Rpb24oYWRkcmVzc2VzKTtcblxuICAgICAgICB1c2VyLklzVmVyaWZpZWQgPSB0cnVlO1xuICAgICAgICB1c2VyLlB1c2hUb2tlbiA9IGJvZHkucHVzaF90b2tlbjtcbiAgICAgICAgYXdhaXQgdGhpcy50ZmFURi51cGRhdGVVc2VyKHVzZXIuUGhvbmVOdW1iZXIsIHVzZXIpO1xuXG4gICAgICAgIGlmICh1c2VyS2F6dGVsICE9PSBudWxsKSB7XG4gICAgICAgICAgICB1c2VyS2F6dGVsLklzVmVyaWZpZWQgPSB0cnVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5rYXp0ZWxURi51cGRhdGVVc2VyKHVzZXIuUGhvbmVOdW1iZXIsIHVzZXJLYXp0ZWwpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1c2VyRWdvdiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdXNlckthenRlbC5Jc1ZlcmlmaWVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZWdvdlRGLnVwZGF0ZVVzZXIodXNlci5QaG9uZU51bWJlciwgdXNlckVnb3YpO1xuICAgICAgICB9XG4gICAgICAgIGxldCByZXNwb25zZVNlbmQgPSBmYWxzZTtcbiAgICAgICAgd3Mub25tZXNzYWdlID0gbWVzcyA9PiB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShtZXNzLmRhdGEpO1xuICAgICAgICAgICAgZm9yIChsZXQgc3RhdGVDaGFuZ2Ugb2YgZGF0YS5zdGF0ZV9jaGFuZ2VzKXtcbiAgICAgICAgICAgICAgICBpZiAoYWRkcmVzc2VzLmluZGV4T2Yoc3RhdGVDaGFuZ2UuYWRkcmVzcykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IF91c2VyID0gbWVzc2FnZXNTZXJ2aWNlLlVzZXIuZGVjb2RlKG5ldyBCdWZmZXIoc3RhdGVDaGFuZ2UudmFsdWUsICdiYXNlNjQnKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZVNlbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdhY3Rpb24nOiAndW5zdWJzY3JpYmUnXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyB0b2RvOiDQv9C+INGF0L7RgNC+0YjQtdC80YMg0L3QsNC00L4g0LLQviDQstGB0LXRhSDRh9C10LnQvdCw0YUg0L7RgtGB0LvQtdC00LjRgtGMINC40LfQvNC10L3QtdC90LjRj1xuICAgICAgICAgICAgICAgICAgICBpZiAoX3VzZXIuSXNWZXJpZmllZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZVNlbmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuT0spLmpzb24oe3N0YXR1czogJ3N1Y2Nlc3MnfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2Vycm9yIC0gdHJ5aW5nIHRvIHNlbmQgcmVzcG9uc2Ugc2Vjb25kIHRpbWUnLCBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgd3Mub25jbG9zZSA9ICgpID0+IHtcbiAgICAgICAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgICdhY3Rpb24nOiAndW5zdWJzY3JpYmUnXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgQFBvc3QoJ2NvZGUnKVxuICAgIGFzeW5jIHBvc3RDb2RlKEBSZXMoKSByZXMsIEBCb2R5KCkgYm9keTogUG9zdENvZGVEVE8pIHtcbiAgICAgICAgbGV0IHYgPSBuZXcgVmFsaWRhdG9yKGJvZHksIHtcbiAgICAgICAgICAgIGV2ZW50OiAncmVxdWlyZWR8c3RyaW5nJyxcbiAgICAgICAgICAgIGxhbmc6ICdudWxsYWJsZXxzdHJpbmcnLFxuICAgICAgICAgICAgbWV0aG9kOiAncmVxdWlyZWR8c3RyaW5nfGluOnNtcyxwdXNoLHRlbGVncmFtLHdoYXRzYXBwJyxcbiAgICAgICAgICAgIHNlcnZpY2U6ICdyZXF1aXJlZElmTm90OnB1c2hfdG9rZW58c3RyaW5nfGluOmthenRlbCxlZ292JyxcbiAgICAgICAgICAgIHBob25lX251bWJlcjogJ3JlcXVpcmVkfHN0cmluZ3xyZWdleDovXlxcXFwrP1sxLTldXFxcXGR7MSwxNH0kLycsXG4gICAgICAgICAgICBlbWJlZGVkOiAnYm9vbGVhbicsXG4gICAgICAgICAgICBjbGllbnRfdGltZXN0YW1wOiAncmVxdWlyZWQnLFxuICAgICAgICAgICAgY2VydDogJ251bGxhYmxlJyxcbiAgICAgICAgICAgIHJlc2VuZDogJ251bGxhYmxlfGJvb2xlYW4nLFxuICAgICAgICB9LCB7J3NlcnZpY2UuaW4nOiBgTm8gc2VydmljZSB3aXRoIG5hbWU6ICR7Ym9keS5zZXJ2aWNlfWB9KTtcbiAgICAgICAgaWYgKHYuZmFpbHMoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih2LmdldEVycm9ycygpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyDQn9GA0L7QstC10YDQutCwLCDRgdGD0YnQtdGB0YLQstGD0LXRgiDQu9C4INC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjFxuICAgICAgICBsZXQgdXNlciA9IGF3YWl0IHRoaXMuZ2V0VXNlcihib2R5LnBob25lX251bWJlciwgYm9keS5zZXJ2aWNlKTtcbiAgICAgICAgaWYgKHVzZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuTk9UX0ZPVU5EKS5qc29uKHt1c2VyOiBbdGhpcy5nZXRVc2VyTm90Rm91bmRNZXNzYWdlKGJvZHkubGFuZyB8fCAnZW4nKV19KTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdGVsZWdyYW1Vc2VyO1xuICAgICAgICBpZiAoYm9keS5tZXRob2QgPT09ICd0ZWxlZ3JhbScpIHtcbiAgICAgICAgICAgIGxldCBudW1iZXIgPSB1c2VyLlBob25lTnVtYmVyO1xuICAgICAgICAgICAgaWYgKG51bWJlci5jaGFyQXQoMCkgPT09ICcrJykge1xuICAgICAgICAgICAgICAgIG51bWJlciA9IG51bWJlci5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0ZWxlZ3JhbVVzZXIgPSBhd2FpdCB0aGlzLnRlbGVncmFtU2VydmVyLnVzZXJFeGlzdHMobmV3IFJlZ0V4cCgnXjh8NycgKyBudW1iZXIuc3Vic3RyaW5nKDEpICsgJyQnLCAnaScpKTtcbiAgICAgICAgICAgIGlmICghdGVsZWdyYW1Vc2VyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih7dXNlcjogW3RoaXMuZ2V0TWVzc2FnZShib2R5LmxhbmcsICd0ZWxlZ3JhbV9ib3RfdW5yZWdpc3RlcmVkJyldfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjaGVjayBpZiB1c2VyIGRlbGV0ZSB0aGUgYm90XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudGVsZWdyYWZBcHAudGVsZWdyYW0uc2VuZE1lc3NhZ2UodGVsZWdyYW1Vc2VyLmNoYXRJZCwgJ9CX0LTRgNCw0LLRgdGC0LLRg9C50YLQtScpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGlmIChlLnJlc3BvbnNlICYmIGUucmVzcG9uc2UuZXJyb3JfY29kZSA9PT0gNDAzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFkpLmpzb24oe3N0YXR1czogJ3RlbGVncmFtX2JvdF91bnJlZ2lzdGVyZWQnfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vINC90LDRh9C40L3QsNC10Lwg0YHQu9GD0YjQsNGC0Ywg0LjQt9C80LXQvdC10L3QuNGPINCw0LTRgNC10YHQvtCyXG4gICAgICAgIGxldCBhZGRyZXNzZXMgPSBbdGhpcy5jaGFpblNlcnZpY2UuZ2V0QWRkcmVzcyh1c2VyLlBob25lTnVtYmVyLCBib2R5LnNlcnZpY2UpXTtcbiAgICAgICAgbGV0IHdzID0gdGhpcy5vcGVuV3NDb25uZWN0aW9uKGFkZHJlc3Nlcyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgbG9nID0gbmV3IFVzZXJMb2coKTtcbiAgICAgICAgICAgIGxvZy5BY3Rpb25UaW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKSAvIDEwMDA7XG4gICAgICAgICAgICBsb2cuRXhwaXJlZEF0ID0gdGhpcy50aW1lSGVscGVyLmdldFVuaXhUaW1lQWZ0ZXJNaW51dGVzKDcpO1xuICAgICAgICAgICAgbG9nLkV2ZW50ID0gYm9keS5ldmVudDtcbiAgICAgICAgICAgIGxvZy5NZXRob2QgPSBib2R5Lm1ldGhvZDtcbiAgICAgICAgICAgIGxvZy5TdGF0dXMgPSBib2R5LnJlc2VuZCA/ICdSRVNFTkRfQ09ERScgOiAnU0VORF9DT0RFJztcbiAgICAgICAgICAgIGxvZy5FbWJlZGVkID0gYm9keS5lbWJlZGVkO1xuICAgICAgICAgICAgbG9nLkNlcnQgPSBib2R5LmNlcnQ7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNoYWluU2VydmljZS5nZW5lcmF0ZUNvZGUodXNlci5QaG9uZU51bWJlciwgbG9nLCBib2R5LnNlcnZpY2UpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciB3aGlsZSBnZXR0aW5nIHVzZXJgLCBlKTtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuQkFEX0dBVEVXQVkpLmpzb24oe2Vycm9yOiAnRXJyb3Igc2VuZGluZyBjb2RlLid9KTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcHVzaFRva2VuID0gJyc7XG4gICAgICAgIGlmIChib2R5Lm1ldGhvZCA9PT0gJ3B1c2gnICYmICF1c2VyLklzVmVyaWZpZWQpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFkpLmpzb24oe3VzZXI6IFt0aGlzLmdldE1lc3NhZ2UoYm9keS5sYW5nLCAnbm90X3ZlcmlmaWVkJyldfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgdGZhVXNlciA9IGF3YWl0IHRoaXMuZ2V0VXNlcih1c2VyLlBob25lTnVtYmVyLCAndGZhJyk7XG4gICAgICAgICAgICBpZiAoIXRmYVVzZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHt1c2VyOiBbdGhpcy5nZXRNZXNzYWdlKGJvZHkubGFuZywgJ25vdF92ZXJpZmllZCcpXX0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcHVzaFRva2VuID0gdGZhVXNlci5QdXNoVG9rZW47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcmVzcG9uc2VTZW5kID0gZmFsc2U7XG4gICAgICAgIHdzLm9ubWVzc2FnZSA9IG1lc3MgPT4ge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UobWVzcy5kYXRhKTtcbiAgICAgICAgICAgIGZvciAobGV0IHN0YXRlQ2hhbmdlIG9mIGRhdGEuc3RhdGVfY2hhbmdlcykge1xuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZVNlbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7J2FjdGlvbic6ICd1bnN1YnNjcmliZSd9KSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYWRkcmVzc2VzLmluZGV4T2Yoc3RhdGVDaGFuZ2UuYWRkcmVzcykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB1c2VyRGVjb2RlZDtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJEZWNvZGVkID0gbWVzc2FnZXNTZXJ2aWNlQ2xpZW50LlVzZXIuZGVjb2RlKG5ldyBCdWZmZXIoc3RhdGVDaGFuZ2UudmFsdWUsICdiYXNlNjQnKSk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdWZXJpZmljYXRpb25Db250cm9sbGVyQHBvc3RDb2RlOiBDYW50IGRlY29kZSB1c2VyJywgZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZVNlbmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7J2FjdGlvbic6ICd1bnN1YnNjcmliZSd9KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHt1c2VyOiBbdGhpcy5nZXRNZXNzYWdlKGJvZHkubGFuZywgJ2Vycm9yX2RlY29kZV91c2VyX2JjJyldfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHVzZXJEZWNvZGVkLkxvZ3MubGVuZ3RoID4gdXNlci5Mb2dzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbG9nOiBVc2VyTG9nID0gdXNlckRlY29kZWQuTG9nc1tfZ2V0TGF0ZXN0SW5kZXgoT2JqZWN0LmtleXModXNlckRlY29kZWQuTG9ncykpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsb2cuU3RhdHVzICE9PSBTRU5EX0NPREUgJiYgbG9nLlN0YXR1cyAhPT0gUkVTRU5EX0NPREUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZVNlbmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnYWN0aW9uJzogJ3Vuc3Vic2NyaWJlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlcjogWydDb2RlIHdhcyBub3Qgc2VuZCAtIGxhdGVzdCBsb2cgaXMgbm90IHdpdGggdGhlIGNvZGUgdG8gc2VuZC4nXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChsb2cuTWV0aG9kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAncHVzaCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29kZVF1ZXVlTGlzdGVuZXJTZXJ2aWNlLnF1ZXVlUFVTSC5hZGQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICfQlNCy0YPRhdGE0LDQutGC0L7RgNC90LDRjyDQsNCy0YLQvtGA0LjQt9Cw0YbQuNGPJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGDQn9C+0LTRgtCy0LXRgNC00LjRgtC1INCy0YXQvtC0INC90LAg0YHQtdGA0LLQuNGBOiAnJHtTZXJ2aWNlc1tib2R5LnNlcnZpY2VdfSdgLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VydmljZTogYm9keS5zZXJ2aWNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHVzaF90b2tlbjogcHVzaFRva2VuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdzbXMnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnbG9nLkNvZGUnLCBsb2cuQ29kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29kZVF1ZXVlTGlzdGVuZXJTZXJ2aWNlLnF1ZXVlU01TLmFkZCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwaG9uZV9udW1iZXI6IHVzZXIuUGhvbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXJ2aWNlOiBib2R5LnNlcnZpY2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBsb2cuQ29kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3RlbGVncmFtJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb2RlUXVldWVMaXN0ZW5lclNlcnZpY2UucXVldWVUZWxlZ3JhbS5hZGQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhdF9pZDogdGVsZWdyYW1Vc2VyLmNoYXRJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfQktCw0Ygg0LrQvtC0INC/0L7QtNGC0LLQtdGA0LbQtNC10L3QuNGPINC00LvRjyDRgdC10YDQstC40YHQsCBcIicgKyBTZXJ2aWNlc1tib2R5LnNlcnZpY2VdICsgJ1wiOiAnICsgbG9nLkNvZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICd3aGF0c2FwcCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRvZG9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgQ2hhaW5Db250cm9sbGVyQGRlbGl2ZXJDb2RlOiBtZXRob2QgJHtsb2cuTWV0aG9kfSBpcyBub3Qgc3VwcG9ydGVkLmApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoeydhY3Rpb24nOiAndW5zdWJzY3JpYmUnfSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VTZW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuT0spLmpzb24oe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc2VuZF9jb29sZG93bjogNyAqIDYwLCAgLy8g0JrQvtC70LjRh9C10YHRgtCy0L4g0YHQtdC60YPQvdC0INC30LAg0LrQvtGC0L7RgNGL0LUg0L3QsNC00L4g0LLQstC10YHRgtC4INC60L7QtCDQuCDQt9CwINC60L7RgtC+0YDRi9C1INC90LXQu9GM0LfRjyDQvtGC0L/RgNCw0LLQuNGC0Ywg0LrQvtC0INC/0L7QstGC0L7RgNC90L5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IGJvZHkubWV0aG9kLCAgICAgIC8vINCc0LXRgtC+0LQg0L7RgtC/0YDQsNCy0LrQuCAoaW46cHVzaCxzbXMsdGVsZWdyYW0sd2hhdHNhcHApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiAnc3VjY2VzcycsXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgd3Mub25jbG9zZSA9ICgpID0+IHtcbiAgICAgICAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgICdhY3Rpb24nOiAndW5zdWJzY3JpYmUnXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgQEdldCgnY29kZScpXG4gICAgYXN5bmMgZ2V0Q29kZShAUmVxKCkgcmVxLCBAUmVzKCkgcmVzLCBAUXVlcnkoJ3Bob25lX251bWJlcicpIHBob25lTnVtYmVyOiBzdHJpbmcsIEBRdWVyeSgncHVzaF90b2tlbicpIHB1c2hUb2tlbjogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgQFF1ZXJ5KCdjbGllbnRfdGltZXN0YW1wJykgY2xpZW50VGltZXN0YW1wOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlcS5xdWVyeS5jbGllbnRfdGltZXN0YW1wID0gcGFyc2VJbnQocmVxLnF1ZXJ5LmNsaWVudF90aW1lc3RhbXAsIDEwKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2UnLCBlKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdiA9IG5ldyBWYWxpZGF0b3IocmVxLnF1ZXJ5LCB7XG4gICAgICAgICAgICBwaG9uZV9udW1iZXI6ICdyZXF1aXJlZHxzdHJpbmd8cmVnZXg6L15cXFxcKz9bMS05XVxcXFxkezEsMTR9JC8nLFxuICAgICAgICAgICAgcHVzaF90b2tlbjogJ3JlcXVpcmVkfHN0cmluZycsXG4gICAgICAgICAgICBjbGllbnRfdGltZXN0YW1wOiAncmVxdWlyZWR8bnVtYmVyJyxcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh2LmZhaWxzKCkpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFkpLmpzb24odi5nZXRFcnJvcnMoKSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHRmYUthenRlbCA9IGF3YWl0IHRoaXMuZ2V0VXNlcihwaG9uZU51bWJlciwgJ3RmYScpO1xuICAgICAgICBpZiAoIXRmYUthenRlbCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5OT1RfRk9VTkQpLmpzb24oe3VzZXI6IFt0aGlzLmdldFVzZXJOb3RGb3VuZE1lc3NhZ2UocmVxLnF1ZXJ5LmxhbmcgfHwgJ2VuJyldfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0ZmFLYXp0ZWwuSXNWZXJpZmllZCB8fCB0ZmFLYXp0ZWwuUHVzaFRva2VuICE9PSBwdXNoVG9rZW4pIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuTk9UX0ZPVU5EKS5qc29uKHt1c2VyOiBbdGhpcy5nZXRVc2VyTm90Rm91bmRNZXNzYWdlKHJlcS5xdWVyeS5sYW5nIHx8ICdlbicpXX0pO1xuICAgICAgICB9XG4gICAgICAgIGxldCB1c2VyS2F6dGVsID0gYXdhaXQgdGhpcy5nZXRVc2VyKHRmYUthenRlbC5QaG9uZU51bWJlciwgJ2thenRlbCcpO1xuICAgICAgICBsZXQgdXNlckVnb3YgPSBhd2FpdCB0aGlzLmdldFVzZXIodGZhS2F6dGVsLlBob25lTnVtYmVyLCAnZWdvdicpO1xuICAgICAgICBpZiAodXNlckthenRlbCA9PT0gbnVsbCAmJiB1c2VyRWdvdiA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk5PVF9GT1VORCkuanNvbih7dXNlcjogW3RoaXMuZ2V0VXNlck5vdEZvdW5kTWVzc2FnZShyZXEucXVlcnkubGFuZyB8fCAnZW4nKV19KTtcbiAgICAgICAgfVxuICAgICAgICBsZXQge2xvZ0thenRlbCwgbG9nRWdvdn0gPSB0aGlzLmluaXRMb2dzKHVzZXJLYXp0ZWwsIHVzZXJFZ292KTtcbiAgICAgICAgaWYgKGxvZ0thenRlbC5zdGF0dXMgIT09ICdzdWNjZXNzJyAmJiBsb2dFZ292LnN0YXR1cyAhPT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKGxvZ0thenRlbC5zdGF0dXMpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdub19zZW5kX2NvZGVzJzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih7XG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyOiBbcmVxLnF1ZXJ5LmxhbmcgPT0gJ3J1JyA/ICfQn9C+0LvRjNC30L7QstCw0YLQtdC70Y4g0LXRidGRINC90LUg0L7RgtC/0YDQsNCy0LjQu9C4INC90Lgg0L7QtNC90L7Qs9C+INC60L7QtNCwINC/0L7QtNGC0LLQtdGA0LbQtNC10L3QuNGPJyA6ICdObyBjb2RlIGZvciB1c2VyIHlldCddXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNhc2UgJ25vX2NvZGVfdXNlZCc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFkpXG4gICAgICAgICAgICAgICAgICAgICAgICAuanNvbih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlcjogW3JlcS5xdWVyeS5sYW5nID09ICdydSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAn0J/QvtC70YzQt9C+0LLQsNGC0LXQu9GOINC10YnRkSDQvdC1INC+0YLQv9GA0LDQstC40LvQuCDQvdC4INC+0LTQvdC+0LPQviDQutC+0LTQsCDQv9C+0LTRgtCy0LXRgNC20LTQtdC90LjRjydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnTm8gY29kZSBmb3IgdXNlciB5ZXQnXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih7dXNlcjogWydFcnJvciBnZXR0aW5nIGNvZGUnXX0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChsb2dLYXp0ZWwuc3RhdHVzID09PSAnc3VjY2VzcycpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuT0spLmpzb24odGhpcy50cmFuc2Zvcm1Mb2cobG9nS2F6dGVsLmxvZywgJ2thenRlbCcpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobG9nRWdvdi5zdGF0dXMgPT09ICdzdWNjZXNzJykge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5PSykuanNvbih0aGlzLnRyYW5zZm9ybUxvZyhsb2dFZ292LmxvZywgJ2Vnb3YnKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih7dXNlcjogWydFcnJvciBnZXR0aW5nIGNvZGUnXX0pO1xuICAgIH1cblxuICAgIEBQb3N0KCd2ZXJpZnknKVxuICAgIGFzeW5jIHBvc3RWZXJpZnkoQFJlcygpIHJlcywgQEJvZHkoKSBib2R5OiBQb3N0VmVyaWZ5Q29kZURUTykge1xuICAgICAgICBsZXQgdiA9IG5ldyBWYWxpZGF0b3IoYm9keSwge1xuICAgICAgICAgICAgZXZlbnQ6ICdyZXF1aXJlZHxzdHJpbmcnLCBsYW5nOiAnc3RyaW5nJywgY29kZTogJ3JlcXVpcmVkfG51bWJlcicsIHNlcnZpY2U6ICdyZXF1aXJlZElmTm90OnB1c2hfdG9rZW58c3RyaW5nfGluOmthenRlbCxlZ292JyxcbiAgICAgICAgICAgIHBob25lX251bWJlcjogJ3JlcXVpcmVkfHN0cmluZ3xyZWdleDovXlxcXFwrP1sxLTldXFxcXGR7MSwxNH0kLycsIGVtYmVkZWQ6ICdib29sZWFuJyxcbiAgICAgICAgICAgIC8vINC40YHQv9C+0LvRjNC30YPQtdGC0YHRjyDRgtC+0LvRjNC60L4g0L/RgNC4INC+0YLQv9GA0LDQstC60LUg0LzQvtCx0LjQu9GM0L3Ri9C8INC/0YDQuNC70L7QttC10L3QuNC10LwgLSDQtNC70Y8g0YPRgdGC0LDQvdC+0LLQutC1INGB0YLQsNGC0YPRgdCwIFJFSkVDVFxuICAgICAgICAgICAgc3RhdHVzOiAnc3RyaW5nJywgY2xpZW50X3RpbWVzdGFtcDogJ3JlcXVpcmVkJywgY2VydDogJ251bGxhYmxlJyxcbiAgICAgICAgfSwgeydzZXJ2aWNlLmluJzogYE5vIHNlcnZpY2Ugd2l0aCBuYW1lOiAke2JvZHkuc2VydmljZX1gfSk7XG4gICAgICAgIGlmICh2LmZhaWxzKCkpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFkpLmpzb24odi5nZXRFcnJvcnMoKSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8g0J/RgNC+0LLQtdGA0LrQsCwg0YHRg9GJ0LXRgdGC0LLRg9C10YIg0LvQuCDQv9C+0LvRjNC30L7QstCw0YLQtdC70YxcbiAgICAgICAgbGV0IHVzZXIgPSBhd2FpdCB0aGlzLmdldFVzZXIoYm9keS5waG9uZV9udW1iZXIsIGJvZHkuc2VydmljZSk7XG4gICAgICAgIGlmICh1c2VyID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk5PVF9GT1VORCkuanNvbih7XG4gICAgICAgICAgICAgICAgdXNlcjogW3RoaXMuZ2V0VXNlck5vdEZvdW5kTWVzc2FnZShib2R5LmxhbmcgfHwgJ2VuJyldXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvLyDQvdCw0YfQuNC90LDQtdC8INGB0LvRg9GI0LDRgtGMINC40LfQvNC10L3QtdC90LjRjyDQsNC00YDQtdGB0L7QslxuICAgICAgICBsZXQgYWRkcmVzc2VzID0gW1xuICAgICAgICAgICAgdGhpcy5jaGFpblNlcnZpY2UuZ2V0QWRkcmVzcyh1c2VyLlBob25lTnVtYmVyLCBib2R5LnNlcnZpY2UpLFxuICAgICAgICBdO1xuICAgICAgICBsZXQgd3MgPSB0aGlzLm9wZW5Xc0Nvbm5lY3Rpb24oYWRkcmVzc2VzKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc3RvcmVMb2coYm9keSwgdXNlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHdoaWxlIGdldHRpbmcgdXNlcmAsIGUpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5CQURfR0FURVdBWSkuanNvbih7ZXJyb3I6ICdFcnJvciBjaGVja2luZyBjb2RlLid9KTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgICAgIGxldCB0ZmFVc2VyID0gYXdhaXQgdGhpcy5nZXRVc2VyKGJvZHkucGhvbmVfbnVtYmVyLCAndGZhJyk7XG4gICAgICAgIHdzLm9ubWVzc2FnZSA9IG1lc3MgPT4ge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UobWVzcy5kYXRhKTtcbiAgICAgICAgICAgIGxldCByZXNwb25zZVNlbmQgPSBmYWxzZTtcbiAgICAgICAgICAgIGZvciAobGV0IHN0YXRlQ2hhbmdlIG9mIGRhdGEuc3RhdGVfY2hhbmdlcykge1xuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZVNlbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7J2FjdGlvbic6ICd1bnN1YnNjcmliZSd9KSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYWRkcmVzc2VzLmluZGV4T2Yoc3RhdGVDaGFuZ2UuYWRkcmVzcykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IF91c2VyID0gbWVzc2FnZXNTZXJ2aWNlQ2xpZW50LlVzZXIuZGVjb2RlKG5ldyBCdWZmZXIoc3RhdGVDaGFuZ2UudmFsdWUsICdiYXNlNjQnKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChfdXNlci5Mb2dzLmxlbmd0aCA9PT0gdXNlci5Mb2dzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ191c2VyLkxvZ3MnLCBfdXNlci5Mb2dzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlU2VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoeydhY3Rpb24nOiAndW5zdWJzY3JpYmUnfSkpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGF0dXMgPSBfdXNlci5Mb2dzW191c2VyLkxvZ3MubGVuZ3RoIC0gMV0uU3RhdHVzO1xuICAgICAgICAgICAgICAgICAgICAvLyBzYWZlIGluIHJlZGlzIGluZm9ybWF0aW9uIHRoYXQgcGhvbmUgaXMgdmFsaWRcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5yZWRpc0NsaWVudC5zZXRBc3luYyhgJHt0ZmFVc2VyLlBob25lTnVtYmVyfToke1JFRElTX1VTRVJfUFVTSF9SRVNVTFRfUE9TVEZJWH1gLCBzdGF0dXMsICdFWCcsIDE1ICogNjApLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXR1cyA9PT0gVkFMSUQgfHwgc3RhdHVzID09PSBSRUpFQ1QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTZW5kIHVzZXIgdG8gY2xpZW50LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRvZG8g0L7RgtGA0LDQsdC+0YLQsNGC0Ywg0LIg0LzQvtC80L3QtdGCINC40L3RgtC10LPRgNCw0YbQuNC4XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdG9kbyBtYWtlIHJlcXVlc3QgdG8gcmVkaXJlc3QgdXJsIHdpdGggdXNlciBkYXRhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVzcG9uZGUgdG8gdGhlIHZpZXdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk9LKS5qc29uKHtzdGF0dXM6IHN0YXR1cywgdXNlcjogX3VzZXJ9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXR1cyA9PT0gJ0VYUElSRUQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDQ0MCkuanNvbih7c3RhdHVzOiBzdGF0dXN9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5CQURfUkVRVUVTVCkuanNvbih7c3RhdHVzOiBzdGF0dXN9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgaW5pdExvZ3ModXNlckthenRlbDogUG9zdENsaWVudFVzZXJEVE8gfCBudWxsLCB1c2VyRWdvdjogUG9zdENsaWVudFVzZXJEVE8gfCBudWxsKSB7XG4gICAgICAgIGxldCBsb2dLYXp0ZWwgPSB7c3RhdHVzOiAnbm9fc2VuZF9jb2RlcycsIGxvZzoge1NlcnZpY2U6IG51bGx9fTtcbiAgICAgICAgaWYgKHVzZXJLYXp0ZWwpIHtcbiAgICAgICAgICAgIGxvZ0thenRlbCA9IHRoaXMuZ2V0TGF0ZXN0Q29kZSh1c2VyS2F6dGVsKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgbG9nRWdvdiA9IHtzdGF0dXM6ICdub19zZW5kX2NvZGVzJywgbG9nOiB7U2VydmljZTogbnVsbH19O1xuICAgICAgICBpZiAodXNlckVnb3YpIHtcbiAgICAgICAgICAgIGxvZ0Vnb3YgPSB0aGlzLmdldExhdGVzdENvZGUodXNlckVnb3YpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7bG9nS2F6dGVsLCBsb2dFZ292fTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHN0b3JlTG9nKGJvZHk6IFBvc3RWZXJpZnlDb2RlRFRPLCB1c2VyOiBQb3N0Q2xpZW50VXNlckRUTyB8IG51bGwpIHtcbiAgICAgICAgbGV0IHJlamVjdFN0YXR1cyA9IG51bGw7XG4gICAgICAgIGlmIChib2R5LnN0YXR1cyAmJiBib2R5LnN0YXR1cyA9PT0gJ1JFSkVDVCcpIHtcbiAgICAgICAgICAgIHJlamVjdFN0YXR1cyA9ICdSRUpFQ1QnO1xuICAgICAgICB9XG4gICAgICAgIGxldCBsb2cgPSBuZXcgVXNlckxvZygpO1xuICAgICAgICBsb2cuQWN0aW9uVGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCkgLyAxMDAwO1xuICAgICAgICBsb2cuRXhwaXJlZEF0ID0gdGhpcy50aW1lSGVscGVyLmdldFVuaXhUaW1lQWZ0ZXJNaW51dGVzKDEpO1xuICAgICAgICBsb2cuRXZlbnQgPSBib2R5LmV2ZW50O1xuICAgICAgICBsb2cuRW1iZWRlZCA9IGJvZHkuZW1iZWRlZDtcbiAgICAgICAgbG9nLlN0YXR1cyA9IHJlamVjdFN0YXR1cyB8fCAnVkVSSUZZJztcbiAgICAgICAgbG9nLkNvZGUgPSBib2R5LmNvZGU7XG4gICAgICAgIGxvZy5DZXJ0ID0gYm9keS5jZXJ0O1xuICAgICAgICBhd2FpdCB0aGlzLmNoYWluU2VydmljZS52ZXJpZnkodXNlci5QaG9uZU51bWJlciwgbG9nLCBib2R5LnNlcnZpY2UpO1xuICAgIH1cbn0iXX0=