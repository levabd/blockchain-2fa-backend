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
            yield this.redisClient.setAsync(`${phoneNumber}:${constants_1.REDIS_USER_POSTFIX}`, `${code}`, 'EX', 7 * 60);
            this.codeQueueListenerService.queueSMS.add({
                phone_number: phoneNumber,
                service: 'kaztel',
                code: code,
                registration: true,
            });
            return res.status(common_1.HttpStatus.OK).json({ status: 'success' });
        });
    }
    verifyNumber(res, body) {
        return __awaiter(this, void 0, void 0, function* () {
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
                            ws.send(JSON.stringify({ 'action': 'unsubscribe' }));
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
            let number = tfaKaztel.PhoneNumber;
            if (number.charAt(0) === '+') {
                number = number.substring(1);
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
            log.Method = body.method || '';
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
    __param(0, common_1.Req()), __param(1, common_1.Res()),
    __param(2, common_1.Query('phone_number')),
    __param(3, common_1.Query('push_token')),
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvY29udHJvbGxzZXJzL3VzZXIuY29udHJvbGxlci50cyIsInNvdXJjZXMiOlsiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvY29udHJvbGxzZXJzL3VzZXIuY29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkNBQXdGO0FBQ3hGLDZDQUEyQztBQUMzQywyRkFBbUY7QUFDbkYsK0VBQXFGO0FBQ3JGLGdFQUFnRTtBQUNoRSx1RUFBaUU7QUFDakUsbUZBQXNFO0FBQ3RFLHlGQUFrRjtBQUNsRiwrRkFBd0Y7QUFDeEYsNEVBQXNFO0FBQ3RFLDJGQUFvRjtBQUNwRiwyREFBcUQ7QUFDckQsNkVBQTBFO0FBQzFFLDZDQUEyQztBQUMzQyx5REFBb0k7QUFFcEksK0RBQTBFO0FBQzFFLHFFQUFnRTtBQUNoRSx5RUFBa0U7QUFDbEUsNkNBQThDO0FBQzlDLGdGQUEwRTtBQUMxRSxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFFckMsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3pCLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0FBQ2hELE1BQU0sZUFBZSxHQUFHLFdBQVcsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQztBQUNoRixNQUFNLHFCQUFxQixHQUFHLFdBQVcsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLGdDQUFnQyxDQUFDLENBQUMsQ0FBQztBQUk3RixJQUFhLGNBQWMsR0FBM0Isb0JBQTRCLFNBQVEsMEJBQWE7SUFlN0MsWUFBb0IsVUFBc0IsRUFDdkIsS0FBMkIsRUFDM0Is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LFlBQUcsRUFBRSxDQUFBLEVBQU8sV0FBQSxZQUFHLEVBQUUsQ0FBQTtJQUNqQixXQUFBLGNBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQTtJQUNyQixXQUFBLGNBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQTtJQUNuQixXQUFBLGNBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFBOzs7OzZDQTZEdkM7QUFHRDtJQURDLGFBQUksQ0FBQyxRQUFRLENBQUM7SUFDRyxXQUFBLFlBQUcsRUFBRSxDQUFBLEVBQU8sV0FBQSxhQUFJLEVBQUUsQ0FBQTs7NkNBQU8sbUNBQWlCOztnREFpRTNEO0FBOWFRLGNBQWM7SUFGMUIsb0JBQVUsQ0FBQyxjQUFjLENBQUM7SUFDMUIsbUJBQVUsQ0FBQyxjQUFjLENBQUM7cUNBZ0JTLHdCQUFVO1FBQ2hCLDZDQUFvQjtRQUNqQixtREFBdUI7UUFDekIsK0NBQXFCO1FBQ2YsNEJBQVk7UUFDZix3QkFBYTtRQUNQLGdDQUFjO1FBQ0osd0NBQXdCO0dBdEI3RCxjQUFjLENBNGMxQjtBQTVjWSx3Q0FBYyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7Qm9keSwgQ29udHJvbGxlciwgR2V0LCBIdHRwU3RhdHVzLCBQb3N0LCBRdWVyeSwgUmVxLCBSZXN9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcbmltcG9ydCB7QXBpVXNlVGFnc30gZnJvbSAnQG5lc3Rqcy9zd2FnZ2VyJztcbmltcG9ydCB7UG9zdFZlcmlmeU51bWJlckRUT30gZnJvbSAnLi4vLi4vc2hhcmVkL21vZGVscy9kdG8vcG9zdC52ZXJpZnkubnVtYmVyLmR0byc7XG5pbXBvcnQge0NvZGVRdWV1ZUxpc3RlbmVyU2VydmljZX0gZnJvbSAnLi4vLi4vLi4vc2VydmljZXMvY29kZV9zZW5kZXIvcXVldWUuc2VydmljZSc7XG5pbXBvcnQge0NsaWVudFNlcnZpY2V9IGZyb20gJy4uLy4uLy4uL2NvbmZpZy9zZXJ2aWNlcy9zZXJ2aWNlcyc7XG5pbXBvcnQge1RpbWVIZWxwZXJ9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL2hlbHBlcnMvdGltZS5oZWxwZXInO1xuaW1wb3J0IHtWYWxpZGF0b3J9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL2hlbHBlcnMvdmFsaWRhdGlvbi5oZWxwZXInO1xuaW1wb3J0IHtUZmFUcmFuc2FjdGlvbkZhbWlseX0gZnJvbSAnLi4vLi4vc2hhcmVkL2ZhbWlsaWVzL3RmYS50cmFuc2FjdGlvbi5mYW1pbHknO1xuaW1wb3J0IHtLYXp0ZWxUcmFuc2FjdGlvbkZhbWlseX0gZnJvbSAnLi4vLi4vc2hhcmVkL2ZhbWlsaWVzL2thenRlbC50cmFuc2FjdGlvbi5mYW1pbHknO1xuaW1wb3J0IHtDaGFpblNlcnZpY2V9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL3Nhd3Rvb3RoL2NoYWluLnNlcnZpY2UnO1xuaW1wb3J0IHtFZ292VHJhbnNhY3Rpb25GYW1pbHl9IGZyb20gJy4uLy4uL3NoYXJlZC9mYW1pbGllcy9lZ292LnRyYW5zYWN0aW9uLmZhbWlseSc7XG5pbXBvcnQge1VzZXJMb2d9IGZyb20gJy4uLy4uL3NoYXJlZC9tb2RlbHMvdXNlci5sb2cnO1xuaW1wb3J0IHtQb3N0VmVyaWZ5Q29kZURUT30gZnJvbSAnLi4vLi4vc2hhcmVkL21vZGVscy9kdG8vcG9zdC52ZXJpZnkuZHRvJztcbmltcG9ydCB7QXBpQ29udHJvbGxlcn0gZnJvbSAnLi9jb250cm9sbGVyJztcbmltcG9ydCB7UkVESVNfVVNFUl9QT1NURklYLCBSRURJU19VU0VSX1BVU0hfUkVTVUxUX1BPU1RGSVgsIFJFSkVDVCwgUkVTRU5EX0NPREUsIFNFTkRfQ09ERSwgVkFMSUR9IGZyb20gJy4uLy4uLy4uL2NvbmZpZy9jb25zdGFudHMnO1xuaW1wb3J0IHtQb3N0Q2xpZW50VXNlckRUT30gZnJvbSAnLi4vLi4vc2hhcmVkL21vZGVscy9kdG8vcG9zdC5rYXp0ZWwudXNlci5kdG8nO1xuaW1wb3J0IHtnZXRMYXRlc3RJbmRleCwgZ2VuQ29kZX0gZnJvbSAnLi4vLi4vLi4vc2VydmljZXMvaGVscGVycy9oZWxwZXJzJztcbmltcG9ydCB7U2VydmljZXN9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL2NvZGVfc2VuZGVyL3NlcnZpY2VzJztcbmltcG9ydCB7UG9zdENvZGVEVE99IGZyb20gJy4uLy4uL3NoYXJlZC9tb2RlbHMvZHRvL3Bvc3QuY29kZS5kdG8nO1xuaW1wb3J0IHtFbnZDb25maWd9IGZyb20gJy4uLy4uLy4uL2NvbmZpZy9lbnYnO1xuaW1wb3J0IHtUZWxlZ3JhbVNlcnZlcn0gZnJvbSAnLi4vLi4vLi4vc2VydmljZXMvdGVsZWdyYW0vdGVsZWdyYW0uc2VydmVyJztcbmNvbnN0IFRlbGVncmFmID0gcmVxdWlyZSgndGVsZWdyYWYnKTtcblxuY29uc3QgZnMgPSByZXF1aXJlKCdmcycpO1xuY29uc3QgcHJvdG9idWZMaWIgPSByZXF1aXJlKCdwcm90b2NvbC1idWZmZXJzJyk7XG5jb25zdCBtZXNzYWdlc1NlcnZpY2UgPSBwcm90b2J1ZkxpYihmcy5yZWFkRmlsZVN5bmMoJ3NyYy9wcm90by9zZXJ2aWNlLnByb3RvJykpO1xuY29uc3QgbWVzc2FnZXNTZXJ2aWNlQ2xpZW50ID0gcHJvdG9idWZMaWIoZnMucmVhZEZpbGVTeW5jKCdzcmMvcHJvdG8vc2VydmljZV9jbGllbnQucHJvdG8nKSk7XG5cbkBBcGlVc2VUYWdzKCd2MS9hcGkvdXNlcnMnKVxuQENvbnRyb2xsZXIoJ3YxL2FwaS91c2VycycpXG5leHBvcnQgY2xhc3MgVXNlckNvbnRyb2xsZXIgZXh0ZW5kcyBBcGlDb250cm9sbGVyIHtcbiAgICBwcml2YXRlIHRlbGVncmFmQXBwOiBhbnk7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIFVzZXJDb250cm9sbGVyLlxuICAgICAqIEBtZW1iZXJvZiBBcGlDb250cm9sbGVyXG4gICAgICogQHBhcmFtIHRpbWVIZWxwZXJcbiAgICAgKiBAcGFyYW0gdGZhVEZcbiAgICAgKiBAcGFyYW0ga2F6dGVsVEZcbiAgICAgKiBAcGFyYW0gZWdvdlRGXG4gICAgICogQHBhcmFtIGNoYWluU2VydmljZVxuICAgICAqIEBwYXJhbSBzZXJ2aWNlc1xuICAgICAqIEBwYXJhbSB0ZWxlZ3JhbVNlcnZlclxuICAgICAqIEBwYXJhbSBjb2RlUXVldWVMaXN0ZW5lclNlcnZpY2VcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRpbWVIZWxwZXI6IFRpbWVIZWxwZXIsXG4gICAgICAgICAgICAgICAgcHVibGljIHRmYVRGOiBUZmFUcmFuc2FjdGlvbkZhbWlseSxcbiAgICAgICAgICAgICAgICBwdWJsaWMga2F6dGVsVEY6IEthenRlbFRyYW5zYWN0aW9uRmFtaWx5LFxuICAgICAgICAgICAgICAgIHB1YmxpYyBlZ292VEY6IEVnb3ZUcmFuc2FjdGlvbkZhbWlseSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgY2hhaW5TZXJ2aWNlOiBDaGFpblNlcnZpY2UsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBzZXJ2aWNlczogQ2xpZW50U2VydmljZSxcbiAgICAgICAgICAgICAgICBwcml2YXRlIHRlbGVncmFtU2VydmVyOiBUZWxlZ3JhbVNlcnZlcixcbiAgICAgICAgICAgICAgICBwcml2YXRlIGNvZGVRdWV1ZUxpc3RlbmVyU2VydmljZTogQ29kZVF1ZXVlTGlzdGVuZXJTZXJ2aWNlKSB7XG4gICAgICAgIHN1cGVyKHRmYVRGLCBrYXp0ZWxURiwgZWdvdlRGKTtcbiAgICAgICAgdGhpcy50ZWxlZ3JhZkFwcCA9IG5ldyBUZWxlZ3JhZihFbnZDb25maWcuVEVMRUdSQU1fQk9UX0tFWSk7XG4gICAgfVxuXG4gICAgQEdldCgndmVyaWZ5LW51bWJlcicpXG4gICAgYXN5bmMgc2VuZFVzZXJDb2RlKEBSZXEoKSByZXEsXG4gICAgICAgICAgICAgICAgICAgICAgIEBSZXMoKSByZXMsXG4gICAgICAgICAgICAgICAgICAgICAgIEBRdWVyeSgncGhvbmVfbnVtYmVyJykgcGhvbmVOdW1iZXI6IHN0cmluZyk6IFByb21pc2U8YW55W10+IHtcbiAgICAgICAgY29uc29sZS5sb2coJ2dldCB2ZXJpZnktbnVtYmVyJyk7XG5cbiAgICAgICAgbGV0IHYgPSBuZXcgVmFsaWRhdG9yKHtwaG9uZV9udW1iZXI6IHBob25lTnVtYmVyfSwge3Bob25lX251bWJlcjogJ3JlcXVpcmVkfHN0cmluZ3xyZWdleDovXlxcXFwrP1sxLTldXFxcXGR7MSwxNH0kLycsfSk7XG4gICAgICAgIGlmICh2LmZhaWxzKCkpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFkpLmpzb24odi5nZXRFcnJvcnMoKSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHVzZXIgPSBhd2FpdCB0aGlzLmdldFVzZXIocGhvbmVOdW1iZXIsICd0ZmEnKTtcbiAgICAgICAgaWYgKHVzZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCd1c2VyIG5vdCBmb3VuZCEhISEhJyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk5PVF9GT1VORCkuanNvbih7dXNlcjogW3RoaXMuZ2V0VXNlck5vdEZvdW5kTWVzc2FnZShyZXEucXVlcnkubGFuZyB8fCAnZW4nKV19KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb2RlID0gZ2VuQ29kZSgpO1xuICAgICAgICBpZiAocGhvbmVOdW1iZXIuY2hhckF0KDApID09PSAnKycpIHtcbiAgICAgICAgICAgIHBob25lTnVtYmVyID0gcGhvbmVOdW1iZXIuc3Vic3RyaW5nKDEpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHNhdmUgY29kZSB0byByZWRpc1xuICAgICAgICAvLyB0aGlzIGtleSB3aWxsIGV4cGlyZSBhZnRlciA4ICogNjAgc2Vjb25kc1xuICAgICAgICBhd2FpdCB0aGlzLnJlZGlzQ2xpZW50LnNldEFzeW5jKGAke3Bob25lTnVtYmVyfToke1JFRElTX1VTRVJfUE9TVEZJWH1gLCBgJHtjb2RlfWAsICdFWCcsIDcgKiA2MCk7XG5cbiAgICAgICAgLy8gc2VuZCBzbXNcbiAgICAgICAgdGhpcy5jb2RlUXVldWVMaXN0ZW5lclNlcnZpY2UucXVldWVTTVMuYWRkKHtcbiAgICAgICAgICAgIHBob25lX251bWJlcjogcGhvbmVOdW1iZXIsXG4gICAgICAgICAgICBzZXJ2aWNlOiAna2F6dGVsJyxcbiAgICAgICAgICAgIGNvZGU6IGNvZGUsXG4gICAgICAgICAgICByZWdpc3RyYXRpb246IHRydWUsXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk9LKS5qc29uKHtzdGF0dXM6ICdzdWNjZXNzJ30pO1xuICAgIH1cblxuICAgIEBQb3N0KCd2ZXJpZnktbnVtYmVyJylcbiAgICBhc3luYyB2ZXJpZnlOdW1iZXIoQFJlcygpIHJlcywgQEJvZHkoKSBib2R5OiBQb3N0VmVyaWZ5TnVtYmVyRFRPKTogUHJvbWlzZTxhbnlbXT4ge1xuICAgICAgICAvLyDQstCw0LvQuNC00LDRhtC40Y9cbiAgICAgICAgbGV0IHYgPSBuZXcgVmFsaWRhdG9yKGJvZHksIHtcbiAgICAgICAgICAgIHBob25lX251bWJlcjogJ3JlcXVpcmVkfHN0cmluZ3xyZWdleDovXlxcXFwrP1sxLTldXFxcXGR7MSwxNH0kLycsXG4gICAgICAgICAgICBwdXNoX3Rva2VuOiAnbnVsbGFibGV8c3RyaW5nJyxcbiAgICAgICAgICAgIGNvZGU6ICdyZXF1aXJlZHxudW1iZXInLFxuICAgICAgICB9LCB7XG4gICAgICAgICAgICAnc2VydmljZS5yZXF1aXJlZElmTm90JzogYFRoZSBzZXJ2aWNlIGZpZWxkIGlzIHJlcXVpcmVkIHdoZW4gcHVzaF90b2tlbiBpcyBlbXB0eS5gXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodi5mYWlscygpKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHYuZ2V0RXJyb3JzKCkpO1xuICAgICAgICB9XG4gICAgICAgIC8vINGD0LHRgNCw0YLRjCDQv9C70Y7RgSDQsiDQvdCw0YfQsNC70LUg0L3QvtC80LXRgNCwINGC0LXQu9C10YTQvtC90LAg0LXRgdC70Lgg0L7QvSDQtdGB0YLRjFxuICAgICAgICBpZiAoYm9keS5waG9uZV9udW1iZXIuY2hhckF0KDApID09PSAnKycpIHtcbiAgICAgICAgICAgIGJvZHkucGhvbmVfbnVtYmVyID0gYm9keS5waG9uZV9udW1iZXIuc3Vic3RyaW5nKDEpO1xuICAgICAgICB9XG4gICAgICAgIC8vINCf0YDQvtCy0LXRgNC60LAsINGB0YPRidC10YHRgtCy0YPQtdGCINC70Lgg0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GMXG4gICAgICAgIGxldCB1c2VyID0gYXdhaXQgdGhpcy5nZXRVc2VyKGJvZHkucGhvbmVfbnVtYmVyLCAndGZhJyk7XG4gICAgICAgIGlmICh1c2VyID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk5PVF9GT1VORCkuanNvbih7dXNlcjogW3RoaXMuZ2V0VXNlck5vdEZvdW5kTWVzc2FnZShib2R5LmxhbmcgfHwgJ2VuJyldfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVkaXNLZXkgPSBgJHtib2R5LnBob25lX251bWJlcn06JHtSRURJU19VU0VSX1BPU1RGSVh9YDtcbiAgICAgICAgLy8g0L/RgNC+0LLQtdGA0LrQsCDQutC+0LTQsFxuICAgICAgICBjb25zdCBjb2RlRnJvbVJlZGlzID0gYXdhaXQgdGhpcy5yZWRpc0NsaWVudC5nZXRBc3luYyhyZWRpc0tleSk7XG4gICAgICAgIGlmIChjb2RlRnJvbVJlZGlzID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFkpLmpzb24oe1xuICAgICAgICAgICAgICAgIGNvZGU6IFtib2R5LmxhbmcgPT09ICdydScgPyAn0JrQvtC00LAg0LvQuNCx0L4g0L3QtdGC0YMg0LvQuNCx0L4g0LXQs9C+INGB0YDQvtC6INC40YHRgtGR0LonIDogXCJUaGUgJ0NvZGUnIGV4cGlyZXMgb3IgZG9lcyBub3QgZXhpc3RzLlwiXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhcnNlSW50KGNvZGVGcm9tUmVkaXMsIDEwKSAhPSBwYXJzZUludChib2R5LmNvZGUsIDEwKSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih7XG4gICAgICAgICAgICAgICAgY29kZTogW2JvZHkubGFuZyA9PT0gJ3J1JyA/ICfQktGLINCy0LLQtdC70Lgg0L3QtdCy0LXRgNC90YvQuSDQutC+0LQnIDogXCJUaGUgJ0NvZGUnIGlzIG5vdCB2YWxpZC5cIl1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMucmVkaXNDbGllbnQuZGVsKHJlZGlzS2V5KTtcblxuICAgICAgICAvLyDQv9C+0LTQs9C+0YLQvtCy0LrQsCDQsNC00YDQtdGB0L7Qsiwg0LfQsCDQutC+0YLQvtGA0YvQvNC4INC90YPQttC90L4g0L7RgtGB0LvQtdC00LjRgtGMINGD0YHQv9C10YjQvdC+0LUg0L/RgNC+0YXQvtC20LTQtdC90LjQtSDRgtGA0LDQvdC30LDQutGG0LjQuFxuICAgICAgICBsZXQgdXNlckthenRlbCA9IGF3YWl0IHRoaXMuZ2V0VXNlcih1c2VyLlBob25lTnVtYmVyLCAna2F6dGVsJyk7XG4gICAgICAgIGxldCB1c2VyRWdvdiA9IGF3YWl0IHRoaXMuZ2V0VXNlcih1c2VyLlBob25lTnVtYmVyLCAnZWdvdicpO1xuICAgICAgICBsZXQgYWRkcmVzc2VzID0gW1xuICAgICAgICAgICAgdGhpcy5jaGFpblNlcnZpY2UuZ2V0QWRkcmVzcyh1c2VyLlBob25lTnVtYmVyLCAndGZhJyksXG4gICAgICAgIF07XG4gICAgICAgIGlmICh1c2VyS2F6dGVsICE9PSBudWxsKSB7XG4gICAgICAgICAgICBhZGRyZXNzZXMucHVzaCh0aGlzLmNoYWluU2VydmljZS5nZXRBZGRyZXNzKHVzZXIuUGhvbmVOdW1iZXIsICdrYXp0ZWwnKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHVzZXJFZ292ICE9PSBudWxsKSB7XG4gICAgICAgICAgICBhZGRyZXNzZXMucHVzaCh0aGlzLmNoYWluU2VydmljZS5nZXRBZGRyZXNzKHVzZXIuUGhvbmVOdW1iZXIsICdlZ292JykpO1xuICAgICAgICB9XG4gICAgICAgIC8vINC90LDRh9C40L3QsNC10Lwg0YHQu9GD0YjQsNGC0Ywg0LjQt9C80LXQvdC10L3QuNGPINCw0LTRgNC10YHQvtCyXG4gICAgICAgIGxldCB3cyA9IHRoaXMub3BlbldzQ29ubmVjdGlvbihhZGRyZXNzZXMpO1xuXG4gICAgICAgIHVzZXIuSXNWZXJpZmllZCA9IHRydWU7XG4gICAgICAgIHVzZXIuUHVzaFRva2VuID0gYm9keS5wdXNoX3Rva2VuO1xuICAgICAgICBhd2FpdCB0aGlzLnRmYVRGLnVwZGF0ZVVzZXIodXNlci5QaG9uZU51bWJlciwgdXNlcik7XG5cbiAgICAgICAgaWYgKHVzZXJLYXp0ZWwgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHVzZXJLYXp0ZWwuSXNWZXJpZmllZCA9IHRydWU7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmthenRlbFRGLnVwZGF0ZVVzZXIodXNlci5QaG9uZU51bWJlciwgdXNlckthenRlbCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHVzZXJFZ292ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB1c2VyS2F6dGVsLklzVmVyaWZpZWQgPSB0cnVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5lZ292VEYudXBkYXRlVXNlcih1c2VyLlBob25lTnVtYmVyLCB1c2VyRWdvdik7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJlc3BvbnNlU2VuZCA9IGZhbHNlO1xuICAgICAgICB3cy5vbm1lc3NhZ2UgPSBtZXNzID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKG1lc3MuZGF0YSk7XG4gICAgICAgICAgICBmb3IgKGxldCBzdGF0ZUNoYW5nZSBvZiBkYXRhLnN0YXRlX2NoYW5nZXMpe1xuICAgICAgICAgICAgICAgIGlmIChhZGRyZXNzZXMuaW5kZXhPZihzdGF0ZUNoYW5nZS5hZGRyZXNzKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgX3VzZXIgPSBtZXNzYWdlc1NlcnZpY2UuVXNlci5kZWNvZGUobmV3IEJ1ZmZlcihzdGF0ZUNoYW5nZS52YWx1ZSwgJ2Jhc2U2NCcpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlU2VuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7J2FjdGlvbic6ICd1bnN1YnNjcmliZSd9KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyB0b2RvOiDQv9C+INGF0L7RgNC+0YjQtdC80YMg0L3QsNC00L4g0LLQviDQstGB0LXRhSDRh9C10LnQvdCw0YUg0L7RgtGB0LvQtdC00LjRgtGMINC40LfQvNC10L3QtdC90LjRj1xuICAgICAgICAgICAgICAgICAgICBpZiAoX3VzZXIuSXNWZXJpZmllZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZVNlbmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuT0spLmpzb24oe3N0YXR1czogJ3N1Y2Nlc3MnfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2Vycm9yIC0gdHJ5aW5nIHRvIHNlbmQgcmVzcG9uc2Ugc2Vjb25kIHRpbWUnLCBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgd3Mub25jbG9zZSA9ICgpID0+IHtcbiAgICAgICAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgICdhY3Rpb24nOiAndW5zdWJzY3JpYmUnXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgQFBvc3QoJ2NvZGUnKVxuICAgIGFzeW5jIHBvc3RDb2RlKEBSZXMoKSByZXMsIEBCb2R5KCkgYm9keTogUG9zdENvZGVEVE8pIHtcbiAgICAgICAgbGV0IHYgPSBuZXcgVmFsaWRhdG9yKGJvZHksIHtcbiAgICAgICAgICAgIGV2ZW50OiAncmVxdWlyZWR8c3RyaW5nJyxcbiAgICAgICAgICAgIGxhbmc6ICdudWxsYWJsZXxzdHJpbmcnLFxuICAgICAgICAgICAgbWV0aG9kOiAncmVxdWlyZWR8c3RyaW5nfGluOnNtcyxwdXNoLHRlbGVncmFtLHdoYXRzYXBwJyxcbiAgICAgICAgICAgIHNlcnZpY2U6ICdyZXF1aXJlZElmTm90OnB1c2hfdG9rZW58c3RyaW5nfGluOmthenRlbCxlZ292JyxcbiAgICAgICAgICAgIHBob25lX251bWJlcjogJ3JlcXVpcmVkfHN0cmluZ3xyZWdleDovXlxcXFwrP1sxLTldXFxcXGR7MSwxNH0kLycsXG4gICAgICAgICAgICBlbWJlZGVkOiAnYm9vbGVhbicsXG4gICAgICAgICAgICBjbGllbnRfdGltZXN0YW1wOiAncmVxdWlyZWQnLFxuICAgICAgICAgICAgY2VydDogJ251bGxhYmxlJyxcbiAgICAgICAgICAgIHJlc2VuZDogJ251bGxhYmxlfGJvb2xlYW4nLFxuICAgICAgICB9LCB7J3NlcnZpY2UuaW4nOiBgTm8gc2VydmljZSB3aXRoIG5hbWU6ICR7Ym9keS5zZXJ2aWNlfWB9KTtcbiAgICAgICAgaWYgKHYuZmFpbHMoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih2LmdldEVycm9ycygpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyDQn9GA0L7QstC10YDQutCwLCDRgdGD0YnQtdGB0YLQstGD0LXRgiDQu9C4INC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjFxuICAgICAgICBsZXQgdXNlciA9IGF3YWl0IHRoaXMuZ2V0VXNlcihib2R5LnBob25lX251bWJlciwgYm9keS5zZXJ2aWNlKTtcbiAgICAgICAgaWYgKHVzZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuTk9UX0ZPVU5EKS5qc29uKHt1c2VyOiBbdGhpcy5nZXRVc2VyTm90Rm91bmRNZXNzYWdlKGJvZHkubGFuZyB8fCAnZW4nKV19KTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdGVsZWdyYW1Vc2VyO1xuICAgICAgICBpZiAoYm9keS5tZXRob2QgPT09ICd0ZWxlZ3JhbScpIHtcbiAgICAgICAgICAgIGxldCBudW1iZXIgPSB1c2VyLlBob25lTnVtYmVyO1xuICAgICAgICAgICAgaWYgKG51bWJlci5jaGFyQXQoMCkgPT09ICcrJykge1xuICAgICAgICAgICAgICAgIG51bWJlciA9IG51bWJlci5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0ZWxlZ3JhbVVzZXIgPSBhd2FpdCB0aGlzLnRlbGVncmFtU2VydmVyLnVzZXJFeGlzdHMobmV3IFJlZ0V4cCgnXjh8NycgKyBudW1iZXIuc3Vic3RyaW5nKDEpICsgJyQnLCAnaScpKTtcbiAgICAgICAgICAgIGlmICghdGVsZWdyYW1Vc2VyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih7dXNlcjogW3RoaXMuZ2V0TWVzc2FnZShib2R5LmxhbmcsICd0ZWxlZ3JhbV9ib3RfdW5yZWdpc3RlcmVkJyldfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjaGVjayBpZiB1c2VyIGRlbGV0ZSB0aGUgYm90XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudGVsZWdyYWZBcHAudGVsZWdyYW0uc2VuZE1lc3NhZ2UodGVsZWdyYW1Vc2VyLmNoYXRJZCwgJ9CX0LTRgNCw0LLRgdGC0LLRg9C50YLQtScpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGlmIChlLnJlc3BvbnNlICYmIGUucmVzcG9uc2UuZXJyb3JfY29kZSA9PT0gNDAzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFkpLmpzb24oe3N0YXR1czogJ3RlbGVncmFtX2JvdF91bnJlZ2lzdGVyZWQnfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxldCBwdXNoVG9rZW4gPSAnJztcbiAgICAgICAgaWYgKGJvZHkubWV0aG9kID09PSAncHVzaCcgJiYgIXVzZXIuSXNWZXJpZmllZCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih7dXNlcjogW3RoaXMuZ2V0TWVzc2FnZShib2R5LmxhbmcsICdub3RfdmVyaWZpZWQnKV19KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxldCB0ZmFVc2VyID0gYXdhaXQgdGhpcy5nZXRVc2VyKHVzZXIuUGhvbmVOdW1iZXIsICd0ZmEnKTtcbiAgICAgICAgICAgIGlmICghdGZhVXNlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFkpLmpzb24oe3VzZXI6IFt0aGlzLmdldE1lc3NhZ2UoYm9keS5sYW5nLCAnbm90X3ZlcmlmaWVkJyldfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwdXNoVG9rZW4gPSB0ZmFVc2VyLlB1c2hUb2tlbjtcbiAgICAgICAgfVxuICAgICAgICAvLyDQvdCw0YfQuNC90LDQtdC8INGB0LvRg9GI0LDRgtGMINC40LfQvNC10L3QtdC90LjRjyDQsNC00YDQtdGB0L7QslxuICAgICAgICBsZXQgYWRkcmVzc2VzID0gW3RoaXMuY2hhaW5TZXJ2aWNlLmdldEFkZHJlc3ModXNlci5QaG9uZU51bWJlciwgYm9keS5zZXJ2aWNlKV07XG4gICAgICAgIGxldCB3cyA9IHRoaXMub3BlbldzQ29ubmVjdGlvbihhZGRyZXNzZXMpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IGxvZyA9IG5ldyBVc2VyTG9nKCk7XG4gICAgICAgICAgICBsb2cuQWN0aW9uVGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCkgLyAxMDAwO1xuICAgICAgICAgICAgbG9nLkV4cGlyZWRBdCA9IHRoaXMudGltZUhlbHBlci5nZXRVbml4VGltZUFmdGVyTWludXRlcyg3KTtcbiAgICAgICAgICAgIGxvZy5FdmVudCA9IGJvZHkuZXZlbnQ7XG4gICAgICAgICAgICBsb2cuTWV0aG9kID0gYm9keS5tZXRob2Q7XG4gICAgICAgICAgICBsb2cuU3RhdHVzID0gYm9keS5yZXNlbmQgPyAnUkVTRU5EX0NPREUnIDogJ1NFTkRfQ09ERSc7XG4gICAgICAgICAgICBsb2cuRW1iZWRlZCA9IGJvZHkuZW1iZWRlZDtcbiAgICAgICAgICAgIGxvZy5DZXJ0ID0gYm9keS5jZXJ0O1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jaGFpblNlcnZpY2UuZ2VuZXJhdGVDb2RlKHVzZXIuUGhvbmVOdW1iZXIsIGxvZywgYm9keS5zZXJ2aWNlKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3Igd2hpbGUgZ2V0dGluZyB1c2VyYCwgZSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLkJBRF9HQVRFV0FZKS5qc29uKHtlcnJvcjogJ0Vycm9yIHNlbmRpbmcgY29kZS4nfSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJlc3BvbnNlU2VuZCA9IGZhbHNlO1xuICAgICAgICB3cy5vbm1lc3NhZ2UgPSBtZXNzID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKG1lc3MuZGF0YSk7XG4gICAgICAgICAgICBmb3IgKGxldCBzdGF0ZUNoYW5nZSBvZiBkYXRhLnN0YXRlX2NoYW5nZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2VTZW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoeydhY3Rpb24nOiAndW5zdWJzY3JpYmUnfSkpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGFkZHJlc3Nlcy5pbmRleE9mKHN0YXRlQ2hhbmdlLmFkZHJlc3MpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgdXNlckRlY29kZWQ7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyRGVjb2RlZCA9IG1lc3NhZ2VzU2VydmljZUNsaWVudC5Vc2VyLmRlY29kZShuZXcgQnVmZmVyKHN0YXRlQ2hhbmdlLnZhbHVlLCAnYmFzZTY0JykpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnVmVyaWZpY2F0aW9uQ29udHJvbGxlckBwb3N0Q29kZTogQ2FudCBkZWNvZGUgdXNlcicsIGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VTZW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoeydhY3Rpb24nOiAndW5zdWJzY3JpYmUnfSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih7dXNlcjogW3RoaXMuZ2V0TWVzc2FnZShib2R5LmxhbmcsICdlcnJvcl9kZWNvZGVfdXNlcl9iYycpXX0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh1c2VyRGVjb2RlZC5Mb2dzLmxlbmd0aCA+IHVzZXIuTG9ncy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGxvZzogVXNlckxvZyA9IHVzZXJEZWNvZGVkLkxvZ3NbZ2V0TGF0ZXN0SW5kZXgoT2JqZWN0LmtleXModXNlckRlY29kZWQuTG9ncykpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsb2cuU3RhdHVzICE9PSBTRU5EX0NPREUgJiYgbG9nLlN0YXR1cyAhPT0gUkVTRU5EX0NPREUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZVNlbmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnYWN0aW9uJzogJ3Vuc3Vic2NyaWJlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlcjogWydDb2RlIHdhcyBub3Qgc2VuZCAtIGxhdGVzdCBsb2cgaXMgbm90IHdpdGggdGhlIGNvZGUgdG8gc2VuZC4nXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChsb2cuTWV0aG9kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAncHVzaCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29kZVF1ZXVlTGlzdGVuZXJTZXJ2aWNlLnF1ZXVlUFVTSC5hZGQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICfQlNCy0YPRhdGE0LDQutGC0L7RgNC90LDRjyDQsNCy0YLQvtGA0LjQt9Cw0YbQuNGPJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGDQn9C+0LTRgtCy0LXRgNC00LjRgtC1INCy0YXQvtC0INC90LAg0YHQtdGA0LLQuNGBOiAnJHtTZXJ2aWNlc1tib2R5LnNlcnZpY2VdfSdgLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VydmljZTogYm9keS5zZXJ2aWNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHVzaF90b2tlbjogcHVzaFRva2VuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdzbXMnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnbG9nLkNvZGUnLCBsb2cuQ29kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29kZVF1ZXVlTGlzdGVuZXJTZXJ2aWNlLnF1ZXVlU01TLmFkZCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwaG9uZV9udW1iZXI6IHVzZXIuUGhvbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXJ2aWNlOiBib2R5LnNlcnZpY2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBsb2cuQ29kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3RlbGVncmFtJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb2RlUXVldWVMaXN0ZW5lclNlcnZpY2UucXVldWVUZWxlZ3JhbS5hZGQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhdF9pZDogdGVsZWdyYW1Vc2VyLmNoYXRJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfQktCw0Ygg0LrQvtC0INC/0L7QtNGC0LLQtdGA0LbQtNC10L3QuNGPINC00LvRjyDRgdC10YDQstC40YHQsCBcIicgKyBTZXJ2aWNlc1tib2R5LnNlcnZpY2VdICsgJ1wiOiAnICsgbG9nLkNvZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICd3aGF0c2FwcCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRvZG9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgQ2hhaW5Db250cm9sbGVyQGRlbGl2ZXJDb2RlOiBtZXRob2QgJHtsb2cuTWV0aG9kfSBpcyBub3Qgc3VwcG9ydGVkLmApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoeydhY3Rpb24nOiAndW5zdWJzY3JpYmUnfSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VTZW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuT0spLmpzb24oe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc2VuZF9jb29sZG93bjogNyAqIDYwLCAgLy8g0JrQvtC70LjRh9C10YHRgtCy0L4g0YHQtdC60YPQvdC0INC30LAg0LrQvtGC0L7RgNGL0LUg0L3QsNC00L4g0LLQstC10YHRgtC4INC60L7QtCDQuCDQt9CwINC60L7RgtC+0YDRi9C1INC90LXQu9GM0LfRjyDQvtGC0L/RgNCw0LLQuNGC0Ywg0LrQvtC0INC/0L7QstGC0L7RgNC90L5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IGJvZHkubWV0aG9kLCAgICAgIC8vINCc0LXRgtC+0LQg0L7RgtC/0YDQsNCy0LrQuCAoaW46cHVzaCxzbXMsdGVsZWdyYW0sd2hhdHNhcHApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiAnc3VjY2VzcycsXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgd3Mub25jbG9zZSA9ICgpID0+IHtcbiAgICAgICAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgICdhY3Rpb24nOiAndW5zdWJzY3JpYmUnXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgQEdldCgnY29kZScpXG4gICAgYXN5bmMgZ2V0Q29kZShAUmVxKCkgcmVxLCBAUmVzKCkgcmVzLFxuICAgICAgICAgICAgICAgICAgQFF1ZXJ5KCdwaG9uZV9udW1iZXInKSBwaG9uZU51bWJlcjogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgQFF1ZXJ5KCdwdXNoX3Rva2VuJykgcHVzaFRva2VuOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICBAUXVlcnkoJ2NsaWVudF90aW1lc3RhbXAnKSBjbGllbnRUaW1lc3RhbXA6IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVxLnF1ZXJ5LmNsaWVudF90aW1lc3RhbXAgPSBwYXJzZUludChyZXEucXVlcnkuY2xpZW50X3RpbWVzdGFtcCwgMTApO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZScsIGUpO1xuICAgICAgICB9XG4gICAgICAgIGxldCB2ID0gbmV3IFZhbGlkYXRvcihyZXEucXVlcnksIHtcbiAgICAgICAgICAgIHBob25lX251bWJlcjogJ3JlcXVpcmVkfHN0cmluZ3xyZWdleDovXlxcXFwrP1sxLTldXFxcXGR7MSwxNH0kLycsXG4gICAgICAgICAgICBwdXNoX3Rva2VuOiAncmVxdWlyZWR8c3RyaW5nJyxcbiAgICAgICAgICAgIGNsaWVudF90aW1lc3RhbXA6ICdyZXF1aXJlZHxudW1iZXInLFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHYuZmFpbHMoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih2LmdldEVycm9ycygpKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdGZhS2F6dGVsID0gYXdhaXQgdGhpcy5nZXRVc2VyKHBob25lTnVtYmVyLCAndGZhJyk7XG4gICAgICAgIGlmICghdGZhS2F6dGVsKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk5PVF9GT1VORCkuanNvbih7dXNlcjogW3RoaXMuZ2V0VXNlck5vdEZvdW5kTWVzc2FnZShyZXEucXVlcnkubGFuZyB8fCAnZW4nKV19KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRmYUthenRlbC5Jc1ZlcmlmaWVkIHx8IHRmYUthenRlbC5QdXNoVG9rZW4gIT09IHB1c2hUb2tlbikge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5OT1RfRk9VTkQpLmpzb24oe3VzZXI6IFt0aGlzLmdldFVzZXJOb3RGb3VuZE1lc3NhZ2UocmVxLnF1ZXJ5LmxhbmcgfHwgJ2VuJyldfSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHVzZXJLYXp0ZWwgPSBhd2FpdCB0aGlzLmdldFVzZXIodGZhS2F6dGVsLlBob25lTnVtYmVyLCAna2F6dGVsJyk7XG4gICAgICAgIGxldCB1c2VyRWdvdiA9IGF3YWl0IHRoaXMuZ2V0VXNlcih0ZmFLYXp0ZWwuUGhvbmVOdW1iZXIsICdlZ292Jyk7XG4gICAgICAgIGlmICh1c2VyS2F6dGVsID09PSBudWxsICYmIHVzZXJFZ292ID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuTk9UX0ZPVU5EKS5qc29uKHt1c2VyOiBbdGhpcy5nZXRVc2VyTm90Rm91bmRNZXNzYWdlKHJlcS5xdWVyeS5sYW5nIHx8ICdlbicpXX0pO1xuICAgICAgICB9XG4gICAgICAgIGxldCBudW1iZXIgPSB0ZmFLYXp0ZWwuUGhvbmVOdW1iZXI7XG4gICAgICAgIGlmIChudW1iZXIuY2hhckF0KDApID09PSAnKycpIHtcbiAgICAgICAgICAgIG51bWJlciA9IG51bWJlci5zdWJzdHJpbmcoMSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gbGV0IHRlbGVncmFtVXNlciA9IGF3YWl0IHRoaXMudGVsZWdyYW1TZXJ2ZXIudXNlckV4aXN0cyhuZXcgUmVnRXhwKCdeOHw3JyArIG51bWJlci5zdWJzdHJpbmcoMSkgKyAnJCcsICdpJykpO1xuICAgICAgICAvLyBsZXQgdGVsZWdyYW1Vc2VyQ3JlYXRlZEF0ID0gbnVsbDtcbiAgICAgICAgLy8gaWYgKHRlbGVncmFtVXNlcikge1xuICAgICAgICAvLyAgICAgdGVsZWdyYW1Vc2VyQ3JlYXRlZEF0ID0gdGVsZWdyYW1Vc2VyLlxuICAgICAgICAvLyAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih7dXNlcjogW3RoaXMuZ2V0TWVzc2FnZSgncnUnLCAndGVsZWdyYW1fYm90X3VucmVnaXN0ZXJlZCcpXX0pO1xuICAgICAgICAvLyB9XG4gICAgICAgIGxldCB7bG9nS2F6dGVsLCBsb2dFZ292fSA9IHRoaXMuaW5pdExvZ3ModXNlckthenRlbCwgdXNlckVnb3YpO1xuICAgICAgICBpZiAobG9nS2F6dGVsLnN0YXR1cyAhPT0gJ3N1Y2Nlc3MnICYmIGxvZ0Vnb3Yuc3RhdHVzICE9PSAnc3VjY2VzcycpIHtcbiAgICAgICAgICAgIHN3aXRjaCAobG9nS2F6dGVsLnN0YXR1cykge1xuICAgICAgICAgICAgICAgIGNhc2UgJ25vX3NlbmRfY29kZXMnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXI6IFtyZXEucXVlcnkubGFuZyA9PSAncnUnID8gJ9Cf0L7Qu9GM0LfQvtCy0LDRgtC10LvRjiDQtdGJ0ZEg0L3QtSDQvtGC0L/RgNCw0LLQuNC70Lgg0L3QuCDQvtC00L3QvtCz0L4g0LrQvtC00LAg0L/QvtC00YLQstC10YDQttC00LXQvdC40Y8nIDogJ05vIGNvZGUgZm9yIHVzZXIgeWV0J11cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY2FzZSAnbm9fY29kZV91c2VkJzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5qc29uKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VyOiBbcmVxLnF1ZXJ5LmxhbmcgPT0gJ3J1J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICfQn9C+0LvRjNC30L7QstCw0YLQtdC70Y4g0LXRidGRINC90LUg0L7RgtC/0YDQsNCy0LjQu9C4INC90Lgg0L7QtNC90L7Qs9C+INC60L7QtNCwINC/0L7QtNGC0LLQtdGA0LbQtNC10L3QuNGPJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdObyBjb2RlIGZvciB1c2VyIHlldCddXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHt1c2VyOiBbJ0Vycm9yIGdldHRpbmcgY29kZSddfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxvZ0thenRlbC5zdGF0dXMgPT09ICdzdWNjZXNzJykge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5PSykuanNvbih0aGlzLnRyYW5zZm9ybUxvZyhsb2dLYXp0ZWwubG9nLCAna2F6dGVsJykpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsb2dFZ292LnN0YXR1cyA9PT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk9LKS5qc29uKHRoaXMudHJhbnNmb3JtTG9nKGxvZ0Vnb3YubG9nLCAnZWdvdicpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHt1c2VyOiBbJ0Vycm9yIGdldHRpbmcgY29kZSddfSk7XG4gICAgfVxuXG4gICAgQFBvc3QoJ3ZlcmlmeScpXG4gICAgYXN5bmMgcG9zdFZlcmlmeShAUmVzKCkgcmVzLCBAQm9keSgpIGJvZHk6IFBvc3RWZXJpZnlDb2RlRFRPKSB7XG4gICAgICAgIGxldCB2ID0gbmV3IFZhbGlkYXRvcihib2R5LCB7XG4gICAgICAgICAgICBldmVudDogJ3JlcXVpcmVkfHN0cmluZycsIGxhbmc6ICdzdHJpbmcnLCBjb2RlOiAncmVxdWlyZWR8bnVtYmVyJywgc2VydmljZTogJ3JlcXVpcmVkSWZOb3Q6cHVzaF90b2tlbnxzdHJpbmd8aW46a2F6dGVsLGVnb3YnLFxuICAgICAgICAgICAgcGhvbmVfbnVtYmVyOiAncmVxdWlyZWR8c3RyaW5nfHJlZ2V4Oi9eXFxcXCs/WzEtOV1cXFxcZHsxLDE0fSQvJywgZW1iZWRlZDogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgLy8g0LjRgdC/0L7Qu9GM0LfRg9C10YLRgdGPINGC0L7Qu9GM0LrQviDQv9GA0Lgg0L7RgtC/0YDQsNCy0LrQtSDQvNC+0LHQuNC70YzQvdGL0Lwg0L/RgNC40LvQvtC20LXQvdC40LXQvCAtINC00LvRjyDRg9GB0YLQsNC90L7QstC60LUg0YHRgtCw0YLRg9GB0LAgUkVKRUNUXG4gICAgICAgICAgICBzdGF0dXM6ICdzdHJpbmcnLCBjbGllbnRfdGltZXN0YW1wOiAncmVxdWlyZWQnLCBjZXJ0OiAnbnVsbGFibGUnLFxuICAgICAgICB9LCB7J3NlcnZpY2UuaW4nOiBgTm8gc2VydmljZSB3aXRoIG5hbWU6ICR7Ym9keS5zZXJ2aWNlfWB9KTtcbiAgICAgICAgaWYgKHYuZmFpbHMoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih2LmdldEVycm9ycygpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyDQn9GA0L7QstC10YDQutCwLCDRgdGD0YnQtdGB0YLQstGD0LXRgiDQu9C4INC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjFxuICAgICAgICBsZXQgdXNlciA9IGF3YWl0IHRoaXMuZ2V0VXNlcihib2R5LnBob25lX251bWJlciwgYm9keS5zZXJ2aWNlKTtcbiAgICAgICAgaWYgKHVzZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuTk9UX0ZPVU5EKS5qc29uKHtcbiAgICAgICAgICAgICAgICB1c2VyOiBbdGhpcy5nZXRVc2VyTm90Rm91bmRNZXNzYWdlKGJvZHkubGFuZyB8fCAnZW4nKV1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vINC90LDRh9C40L3QsNC10Lwg0YHQu9GD0YjQsNGC0Ywg0LjQt9C80LXQvdC10L3QuNGPINCw0LTRgNC10YHQvtCyXG4gICAgICAgIGxldCBhZGRyZXNzZXMgPSBbXG4gICAgICAgICAgICB0aGlzLmNoYWluU2VydmljZS5nZXRBZGRyZXNzKHVzZXIuUGhvbmVOdW1iZXIsIGJvZHkuc2VydmljZSksXG4gICAgICAgIF07XG4gICAgICAgIGxldCB3cyA9IHRoaXMub3BlbldzQ29ubmVjdGlvbihhZGRyZXNzZXMpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zdG9yZUxvZyhib2R5LCB1c2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3Igd2hpbGUgZ2V0dGluZyB1c2VyYCwgZSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLkJBRF9HQVRFV0FZKS5qc29uKHtlcnJvcjogJ0Vycm9yIGNoZWNraW5nIGNvZGUuJ30pO1xuICAgICAgICB9XG4gICAgICAgIGxldCBzZWxmID0gdGhpcztcbiAgICAgICAgbGV0IHRmYVVzZXIgPSBhd2FpdCB0aGlzLmdldFVzZXIoYm9keS5waG9uZV9udW1iZXIsICd0ZmEnKTtcbiAgICAgICAgd3Mub25tZXNzYWdlID0gbWVzcyA9PiB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShtZXNzLmRhdGEpO1xuICAgICAgICAgICAgbGV0IHJlc3BvbnNlU2VuZCA9IGZhbHNlO1xuICAgICAgICAgICAgZm9yIChsZXQgc3RhdGVDaGFuZ2Ugb2YgZGF0YS5zdGF0ZV9jaGFuZ2VzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlU2VuZCkge1xuICAgICAgICAgICAgICAgICAgICB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHsnYWN0aW9uJzogJ3Vuc3Vic2NyaWJlJ30pKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhZGRyZXNzZXMuaW5kZXhPZihzdGF0ZUNoYW5nZS5hZGRyZXNzKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgX3VzZXIgPSBtZXNzYWdlc1NlcnZpY2VDbGllbnQuVXNlci5kZWNvZGUobmV3IEJ1ZmZlcihzdGF0ZUNoYW5nZS52YWx1ZSwgJ2Jhc2U2NCcpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF91c2VyLkxvZ3MubGVuZ3RoID09PSB1c2VyLkxvZ3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnX3VzZXIuTG9ncycsIF91c2VyLkxvZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VTZW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7J2FjdGlvbic6ICd1bnN1YnNjcmliZSd9KSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IF91c2VyLkxvZ3NbX3VzZXIuTG9ncy5sZW5ndGggLSAxXS5TdGF0dXM7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNhZmUgaW4gcmVkaXMgaW5mb3JtYXRpb24gdGhhdCBwaG9uZSBpcyB2YWxpZFxuICAgICAgICAgICAgICAgICAgICBzZWxmLnJlZGlzQ2xpZW50LnNldEFzeW5jKGAke3RmYVVzZXIuUGhvbmVOdW1iZXJ9OiR7UkVESVNfVVNFUl9QVVNIX1JFU1VMVF9QT1NURklYfWAsIHN0YXR1cywgJ0VYJywgMTUgKiA2MCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RhdHVzID09PSBWQUxJRCB8fCBzdGF0dXMgPT09IFJFSkVDVCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNlbmQgdXNlciB0byBjbGllbnQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdG9kbyDQvtGC0YDQsNCx0L7RgtCw0YLRjCDQsiDQvNC+0LzQvdC10YIg0LjQvdGC0LXQs9GA0LDRhtC40LhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0b2RvIG1ha2UgcmVxdWVzdCB0byByZWRpcmVzdCB1cmwgd2l0aCB1c2VyIGRhdGFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZXNwb25kZSB0byB0aGUgdmlld1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuT0spLmpzb24oe3N0YXR1czogc3RhdHVzLCB1c2VyOiBfdXNlcn0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RhdHVzID09PSAnRVhQSVJFRCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDQwKS5qc29uKHtzdGF0dXM6IHN0YXR1c30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLkJBRF9SRVFVRVNUKS5qc29uKHtzdGF0dXM6IHN0YXR1c30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpbml0TG9ncyh1c2VyS2F6dGVsOiBQb3N0Q2xpZW50VXNlckRUTyB8IG51bGwsIHVzZXJFZ292OiBQb3N0Q2xpZW50VXNlckRUTyB8IG51bGwpIHtcbiAgICAgICAgbGV0IGxvZ0thenRlbCA9IHtzdGF0dXM6ICdub19zZW5kX2NvZGVzJywgbG9nOiB7U2VydmljZTogbnVsbH19O1xuICAgICAgICBpZiAodXNlckthenRlbCkge1xuICAgICAgICAgICAgbG9nS2F6dGVsID0gdGhpcy5nZXRMYXRlc3RDb2RlKHVzZXJLYXp0ZWwpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBsb2dFZ292ID0ge3N0YXR1czogJ25vX3NlbmRfY29kZXMnLCBsb2c6IHtTZXJ2aWNlOiBudWxsfX07XG4gICAgICAgIGlmICh1c2VyRWdvdikge1xuICAgICAgICAgICAgbG9nRWdvdiA9IHRoaXMuZ2V0TGF0ZXN0Q29kZSh1c2VyRWdvdik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtsb2dLYXp0ZWwsIGxvZ0Vnb3Z9O1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgc3RvcmVMb2coYm9keTogUG9zdFZlcmlmeUNvZGVEVE8sIHVzZXI6IFBvc3RDbGllbnRVc2VyRFRPIHwgbnVsbCkge1xuICAgICAgICBsZXQgcmVqZWN0U3RhdHVzID0gbnVsbDtcbiAgICAgICAgaWYgKGJvZHkuc3RhdHVzICYmIGJvZHkuc3RhdHVzID09PSAnUkVKRUNUJykge1xuICAgICAgICAgICAgcmVqZWN0U3RhdHVzID0gJ1JFSkVDVCc7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGxvZyA9IG5ldyBVc2VyTG9nKCk7XG4gICAgICAgIGxvZy5BY3Rpb25UaW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKSAvIDEwMDA7XG4gICAgICAgIGxvZy5FeHBpcmVkQXQgPSB0aGlzLnRpbWVIZWxwZXIuZ2V0VW5peFRpbWVBZnRlck1pbnV0ZXMoMSk7XG4gICAgICAgIGxvZy5FdmVudCA9IGJvZHkuZXZlbnQ7XG4gICAgICAgIGxvZy5FbWJlZGVkID0gYm9keS5lbWJlZGVkO1xuICAgICAgICBsb2cuTWV0aG9kID0gYm9keS5tZXRob2R8fCcnO1xuICAgICAgICBsb2cuU3RhdHVzID0gcmVqZWN0U3RhdHVzIHx8ICdWRVJJRlknO1xuICAgICAgICBsb2cuQ29kZSA9IGJvZHkuY29kZTtcbiAgICAgICAgbG9nLkNlcnQgPSBib2R5LmNlcnQ7XG4gICAgICAgIGF3YWl0IHRoaXMuY2hhaW5TZXJ2aWNlLnZlcmlmeSh1c2VyLlBob25lTnVtYmVyLCBsb2csIGJvZHkuc2VydmljZSk7XG4gICAgfVxufSJdfQ==