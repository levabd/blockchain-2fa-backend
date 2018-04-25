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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvY29udHJvbGxzZXJzL3VzZXIuY29udHJvbGxlci50cyIsInNvdXJjZXMiOlsiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvY29udHJvbGxzZXJzL3VzZXIuY29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkNBQXdGO0FBQ3hGLDZDQUEyQztBQUMzQywyRkFBbUY7QUFDbkYsK0VBQXFGO0FBQ3JGLGdFQUFnRTtBQUNoRSx1RUFBaUU7QUFDakUsbUZBQXNFO0FBQ3RFLHlGQUFrRjtBQUNsRiwrRkFBd0Y7QUFDeEYsNEVBQXNFO0FBQ3RFLDJGQUFvRjtBQUNwRiwyREFBcUQ7QUFDckQsNkVBQTBFO0FBQzFFLDZDQUEyQztBQUMzQyx5REFBb0k7QUFFcEksK0RBQTBFO0FBQzFFLHFFQUFnRTtBQUNoRSx5RUFBa0U7QUFDbEUsNkNBQThDO0FBQzlDLGdGQUEwRTtBQUMxRSxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFFckMsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3pCLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0FBQ2hELE1BQU0sZUFBZSxHQUFHLFdBQVcsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQztBQUNoRixNQUFNLHFCQUFxQixHQUFHLFdBQVcsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLGdDQUFnQyxDQUFDLENBQUMsQ0FBQztBQUk3RixJQUFhLGNBQWMsR0FBM0Isb0JBQTRCLFNBQVEsMEJBQWE7SUFlN0MsWUFBb0IsVUFBc0IsRUFDdkIsS0FBMkIsRUFDM0Is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Q0csV0FBQSxZQUFHLEVBQUUsQ0FBQSxFQUFPLFdBQUEsYUFBSSxFQUFFLENBQUE7OzZDQUFPLDJCQUFXOzs4Q0E4SW5EO0FBR0Q7SUFEQyxZQUFHLENBQUMsTUFBTSxDQUFDO0lBQ0csV0FBQSxZQUFHLEVBQUUsQ0FBQSxFQUFPLFdBQUEsWUFBRyxFQUFFLENBQUE7SUFDakIsV0FBQSxjQUFLLENBQUMsY0FBYyxDQUFDLENBQUE7SUFDckIsV0FBQSxjQUFLLENBQUMsWUFBWSxDQUFDLENBQUE7SUFDbkIsV0FBQSxjQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQTs7Ozs2Q0E2RHZDO0FBR0Q7SUFEQyxhQUFJLENBQUMsUUFBUSxDQUFDO0lBQ0csV0FBQSxZQUFHLEVBQUUsQ0FBQSxFQUFPLFdBQUEsYUFBSSxFQUFFLENBQUE7OzZDQUFPLG1DQUFpQjs7Z0RBaUUzRDtBQXJiUSxjQUFjO0lBRjFCLG9CQUFVLENBQUMsY0FBYyxDQUFDO0lBQzFCLG1CQUFVLENBQUMsY0FBYyxDQUFDO3FDQWdCUyx3QkFBVTtRQUNoQiw2Q0FBb0I7UUFDakIsbURBQXVCO1FBQ3pCLCtDQUFxQjtRQUNmLDRCQUFZO1FBQ2Ysd0JBQWE7UUFDUCxnQ0FBYztRQUNKLHdDQUF3QjtHQXRCN0QsY0FBYyxDQWtkMUI7QUFsZFksd0NBQWMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0JvZHksIENvbnRyb2xsZXIsIEdldCwgSHR0cFN0YXR1cywgUG9zdCwgUXVlcnksIFJlcSwgUmVzfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XG5pbXBvcnQge0FwaVVzZVRhZ3N9IGZyb20gJ0BuZXN0anMvc3dhZ2dlcic7XG5pbXBvcnQge1Bvc3RWZXJpZnlOdW1iZXJEVE99IGZyb20gJy4uLy4uL3NoYXJlZC9tb2RlbHMvZHRvL3Bvc3QudmVyaWZ5Lm51bWJlci5kdG8nO1xuaW1wb3J0IHtDb2RlUXVldWVMaXN0ZW5lclNlcnZpY2V9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL2NvZGVfc2VuZGVyL3F1ZXVlLnNlcnZpY2UnO1xuaW1wb3J0IHtDbGllbnRTZXJ2aWNlfSBmcm9tICcuLi8uLi8uLi9jb25maWcvc2VydmljZXMvc2VydmljZXMnO1xuaW1wb3J0IHtUaW1lSGVscGVyfSBmcm9tICcuLi8uLi8uLi9zZXJ2aWNlcy9oZWxwZXJzL3RpbWUuaGVscGVyJztcbmltcG9ydCB7VmFsaWRhdG9yfSBmcm9tICcuLi8uLi8uLi9zZXJ2aWNlcy9oZWxwZXJzL3ZhbGlkYXRpb24uaGVscGVyJztcbmltcG9ydCB7VGZhVHJhbnNhY3Rpb25GYW1pbHl9IGZyb20gJy4uLy4uL3NoYXJlZC9mYW1pbGllcy90ZmEudHJhbnNhY3Rpb24uZmFtaWx5JztcbmltcG9ydCB7S2F6dGVsVHJhbnNhY3Rpb25GYW1pbHl9IGZyb20gJy4uLy4uL3NoYXJlZC9mYW1pbGllcy9rYXp0ZWwudHJhbnNhY3Rpb24uZmFtaWx5JztcbmltcG9ydCB7Q2hhaW5TZXJ2aWNlfSBmcm9tICcuLi8uLi8uLi9zZXJ2aWNlcy9zYXd0b290aC9jaGFpbi5zZXJ2aWNlJztcbmltcG9ydCB7RWdvdlRyYW5zYWN0aW9uRmFtaWx5fSBmcm9tICcuLi8uLi9zaGFyZWQvZmFtaWxpZXMvZWdvdi50cmFuc2FjdGlvbi5mYW1pbHknO1xuaW1wb3J0IHtVc2VyTG9nfSBmcm9tICcuLi8uLi9zaGFyZWQvbW9kZWxzL3VzZXIubG9nJztcbmltcG9ydCB7UG9zdFZlcmlmeUNvZGVEVE99IGZyb20gJy4uLy4uL3NoYXJlZC9tb2RlbHMvZHRvL3Bvc3QudmVyaWZ5LmR0byc7XG5pbXBvcnQge0FwaUNvbnRyb2xsZXJ9IGZyb20gJy4vY29udHJvbGxlcic7XG5pbXBvcnQge1JFRElTX1VTRVJfUE9TVEZJWCwgUkVESVNfVVNFUl9QVVNIX1JFU1VMVF9QT1NURklYLCBSRUpFQ1QsIFJFU0VORF9DT0RFLCBTRU5EX0NPREUsIFZBTElEfSBmcm9tICcuLi8uLi8uLi9jb25maWcvY29uc3RhbnRzJztcbmltcG9ydCB7UG9zdENsaWVudFVzZXJEVE99IGZyb20gJy4uLy4uL3NoYXJlZC9tb2RlbHMvZHRvL3Bvc3Qua2F6dGVsLnVzZXIuZHRvJztcbmltcG9ydCB7Z2V0TGF0ZXN0SW5kZXgsIGdlbkNvZGV9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL2hlbHBlcnMvaGVscGVycyc7XG5pbXBvcnQge1NlcnZpY2VzfSBmcm9tICcuLi8uLi8uLi9zZXJ2aWNlcy9jb2RlX3NlbmRlci9zZXJ2aWNlcyc7XG5pbXBvcnQge1Bvc3RDb2RlRFRPfSBmcm9tICcuLi8uLi9zaGFyZWQvbW9kZWxzL2R0by9wb3N0LmNvZGUuZHRvJztcbmltcG9ydCB7RW52Q29uZmlnfSBmcm9tICcuLi8uLi8uLi9jb25maWcvZW52JztcbmltcG9ydCB7VGVsZWdyYW1TZXJ2ZXJ9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL3RlbGVncmFtL3RlbGVncmFtLnNlcnZlcic7XG5jb25zdCBUZWxlZ3JhZiA9IHJlcXVpcmUoJ3RlbGVncmFmJyk7XG5cbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcbmNvbnN0IHByb3RvYnVmTGliID0gcmVxdWlyZSgncHJvdG9jb2wtYnVmZmVycycpO1xuY29uc3QgbWVzc2FnZXNTZXJ2aWNlID0gcHJvdG9idWZMaWIoZnMucmVhZEZpbGVTeW5jKCdzcmMvcHJvdG8vc2VydmljZS5wcm90bycpKTtcbmNvbnN0IG1lc3NhZ2VzU2VydmljZUNsaWVudCA9IHByb3RvYnVmTGliKGZzLnJlYWRGaWxlU3luYygnc3JjL3Byb3RvL3NlcnZpY2VfY2xpZW50LnByb3RvJykpO1xuXG5AQXBpVXNlVGFncygndjEvYXBpL3VzZXJzJylcbkBDb250cm9sbGVyKCd2MS9hcGkvdXNlcnMnKVxuZXhwb3J0IGNsYXNzIFVzZXJDb250cm9sbGVyIGV4dGVuZHMgQXBpQ29udHJvbGxlciB7XG4gICAgcHJpdmF0ZSB0ZWxlZ3JhZkFwcDogYW55O1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBVc2VyQ29udHJvbGxlci5cbiAgICAgKiBAbWVtYmVyb2YgQXBpQ29udHJvbGxlclxuICAgICAqIEBwYXJhbSB0aW1lSGVscGVyXG4gICAgICogQHBhcmFtIHRmYVRGXG4gICAgICogQHBhcmFtIGthenRlbFRGXG4gICAgICogQHBhcmFtIGVnb3ZURlxuICAgICAqIEBwYXJhbSBjaGFpblNlcnZpY2VcbiAgICAgKiBAcGFyYW0gc2VydmljZXNcbiAgICAgKiBAcGFyYW0gdGVsZWdyYW1TZXJ2ZXJcbiAgICAgKiBAcGFyYW0gY29kZVF1ZXVlTGlzdGVuZXJTZXJ2aWNlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSB0aW1lSGVscGVyOiBUaW1lSGVscGVyLFxuICAgICAgICAgICAgICAgIHB1YmxpYyB0ZmFURjogVGZhVHJhbnNhY3Rpb25GYW1pbHksXG4gICAgICAgICAgICAgICAgcHVibGljIGthenRlbFRGOiBLYXp0ZWxUcmFuc2FjdGlvbkZhbWlseSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgZWdvdlRGOiBFZ292VHJhbnNhY3Rpb25GYW1pbHksXG4gICAgICAgICAgICAgICAgcHVibGljIGNoYWluU2VydmljZTogQ2hhaW5TZXJ2aWNlLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgc2VydmljZXM6IENsaWVudFNlcnZpY2UsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSB0ZWxlZ3JhbVNlcnZlcjogVGVsZWdyYW1TZXJ2ZXIsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBjb2RlUXVldWVMaXN0ZW5lclNlcnZpY2U6IENvZGVRdWV1ZUxpc3RlbmVyU2VydmljZSkge1xuICAgICAgICBzdXBlcih0ZmFURiwga2F6dGVsVEYsIGVnb3ZURik7XG4gICAgICAgIHRoaXMudGVsZWdyYWZBcHAgPSBuZXcgVGVsZWdyYWYoRW52Q29uZmlnLlRFTEVHUkFNX0JPVF9LRVkpO1xuICAgIH1cblxuICAgIEBHZXQoJ3ZlcmlmeS1udW1iZXInKVxuICAgIGFzeW5jIHNlbmRVc2VyQ29kZShAUmVxKCkgcmVxLFxuICAgICAgICAgICAgICAgICAgICAgICBAUmVzKCkgcmVzLFxuICAgICAgICAgICAgICAgICAgICAgICBAUXVlcnkoJ3Bob25lX251bWJlcicpIHBob25lTnVtYmVyOiBzdHJpbmcpOiBQcm9taXNlPGFueVtdPiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdnZXQgdmVyaWZ5LW51bWJlcicpO1xuXG4gICAgICAgIGxldCB2ID0gbmV3IFZhbGlkYXRvcih7cGhvbmVfbnVtYmVyOiBwaG9uZU51bWJlcn0sIHtwaG9uZV9udW1iZXI6ICdyZXF1aXJlZHxzdHJpbmd8cmVnZXg6L15cXFxcKz9bMS05XVxcXFxkezEsMTR9JC8nLH0pO1xuICAgICAgICBpZiAodi5mYWlscygpKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHYuZ2V0RXJyb3JzKCkpO1xuICAgICAgICB9XG4gICAgICAgIGxldCB1c2VyID0gYXdhaXQgdGhpcy5nZXRVc2VyKHBob25lTnVtYmVyLCAndGZhJyk7XG4gICAgICAgIGlmICh1c2VyID09PSBudWxsKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygndXNlciBub3QgZm91bmQhISEhIScpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5OT1RfRk9VTkQpLmpzb24oe3VzZXI6IFt0aGlzLmdldFVzZXJOb3RGb3VuZE1lc3NhZ2UocmVxLnF1ZXJ5LmxhbmcgfHwgJ2VuJyldfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29kZSA9IGdlbkNvZGUoKTtcbiAgICAgICAgaWYgKHBob25lTnVtYmVyLmNoYXJBdCgwKSA9PT0gJysnKSB7XG4gICAgICAgICAgICBwaG9uZU51bWJlciA9IHBob25lTnVtYmVyLnN1YnN0cmluZygxKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgICAgIC8vIHNhdmUgY29kZSB0byByZWRpc1xuICAgICAgICAvLyB0aGlzIGtleSB3aWxsIGV4cGlyZSBhZnRlciA4ICogNjAgc2Vjb25kc1xuICAgICAgICB0aGlzLnJlZGlzQ2xpZW50LnNldEFzeW5jKGAke3Bob25lTnVtYmVyfToke1JFRElTX1VTRVJfUE9TVEZJWH1gLCBgJHtjb2RlfWAsICdFWCcsIDcgKiA2MCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvLyBzZW5kIHNtc1xuICAgICAgICAgICAgc2VsZi5jb2RlUXVldWVMaXN0ZW5lclNlcnZpY2UucXVldWVTTVMuYWRkKHtcbiAgICAgICAgICAgICAgICBwaG9uZV9udW1iZXI6IHBob25lTnVtYmVyLFxuICAgICAgICAgICAgICAgIHNlcnZpY2U6ICdrYXp0ZWwnLFxuICAgICAgICAgICAgICAgIGNvZGU6IGNvZGUsXG4gICAgICAgICAgICAgICAgcmVnaXN0cmF0aW9uOiB0cnVlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk9LKS5qc29uKHtzdGF0dXM6ICdzdWNjZXNzJ30pO1xuICAgIH1cblxuICAgIEBQb3N0KCd2ZXJpZnktbnVtYmVyJylcbiAgICBhc3luYyB2ZXJpZnlOdW1iZXIoQFJlcygpIHJlcywgQEJvZHkoKSBib2R5OiBQb3N0VmVyaWZ5TnVtYmVyRFRPKTogUHJvbWlzZTxhbnlbXT4ge1xuICAgICAgICBjb25zb2xlLmxvZygncG9zdCB2ZXJpZnktbnVtYmVyJyk7XG5cbiAgICAgICAgLy8g0LLQsNC70LjQtNCw0YbQuNGPXG4gICAgICAgIGxldCB2ID0gbmV3IFZhbGlkYXRvcihib2R5LCB7XG4gICAgICAgICAgICBwaG9uZV9udW1iZXI6ICdyZXF1aXJlZHxzdHJpbmd8cmVnZXg6L15cXFxcKz9bMS05XVxcXFxkezEsMTR9JC8nLFxuICAgICAgICAgICAgcHVzaF90b2tlbjogJ251bGxhYmxlfHN0cmluZycsXG4gICAgICAgICAgICBjb2RlOiAncmVxdWlyZWR8bnVtYmVyJyxcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgJ3NlcnZpY2UucmVxdWlyZWRJZk5vdCc6IGBUaGUgc2VydmljZSBmaWVsZCBpcyByZXF1aXJlZCB3aGVuIHB1c2hfdG9rZW4gaXMgZW1wdHkuYFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHYuZmFpbHMoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih2LmdldEVycm9ycygpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyDRg9Cx0YDQsNGC0Ywg0L/Qu9GO0YEg0LIg0L3QsNGH0LDQu9C1INC90L7QvNC10YDQsCDRgtC10LvQtdGE0L7QvdCwINC10YHQu9C4INC+0L0g0LXRgdGC0YxcbiAgICAgICAgaWYgKGJvZHkucGhvbmVfbnVtYmVyLmNoYXJBdCgwKSA9PT0gJysnKSB7XG4gICAgICAgICAgICBib2R5LnBob25lX251bWJlciA9IGJvZHkucGhvbmVfbnVtYmVyLnN1YnN0cmluZygxKTtcbiAgICAgICAgfVxuICAgICAgICAvLyDQn9GA0L7QstC10YDQutCwLCDRgdGD0YnQtdGB0YLQstGD0LXRgiDQu9C4INC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjFxuICAgICAgICBsZXQgdXNlciA9IGF3YWl0IHRoaXMuZ2V0VXNlcihib2R5LnBob25lX251bWJlciwgJ3RmYScpO1xuICAgICAgICBjb25zb2xlLmxvZygndXNlcicsIHVzZXIpO1xuICAgICAgICBpZiAodXNlciA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5OT1RfRk9VTkQpLmpzb24oe3VzZXI6IFt0aGlzLmdldFVzZXJOb3RGb3VuZE1lc3NhZ2UoYm9keS5sYW5nIHx8ICdlbicpXX0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlZGlzS2V5ID0gYCR7Ym9keS5waG9uZV9udW1iZXJ9OiR7UkVESVNfVVNFUl9QT1NURklYfWA7XG4gICAgICAgIC8vINC/0YDQvtCy0LXRgNC60LAg0LrQvtC00LBcbiAgICAgICAgY29uc3QgY29kZUZyb21SZWRpcyA9IGF3YWl0IHRoaXMucmVkaXNDbGllbnQuZ2V0QXN5bmMocmVkaXNLZXkpO1xuICAgICAgICBpZiAoY29kZUZyb21SZWRpcyA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHtcbiAgICAgICAgICAgICAgICBjb2RlOiBbYm9keS5sYW5nID09PSAncnUnID8gJ9Ca0L7QtNCwINC70LjQsdC+INC90LXRgtGDINC70LjQsdC+INC10LPQviDRgdGA0L7QuiDQuNGB0YLRkdC6JyA6IFwiVGhlICdDb2RlJyBleHBpcmVzIG9yIGRvZXMgbm90IGV4aXN0cy5cIl1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYXJzZUludChjb2RlRnJvbVJlZGlzLCAxMCkgIT0gcGFyc2VJbnQoYm9keS5jb2RlLCAxMCkpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFkpLmpzb24oe1xuICAgICAgICAgICAgICAgIGNvZGU6IFtib2R5LmxhbmcgPT09ICdydScgPyAn0JLRiyDQstCy0LXQu9C4INC90LXQstC10YDQvdGL0Lkg0LrQvtC0JyA6IFwiVGhlICdDb2RlJyBpcyBub3QgdmFsaWQuXCJdXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0aGlzLnJlZGlzQ2xpZW50LmRlbChyZWRpc0tleSk7XG5cbiAgICAgICAgLy8g0L/QvtC00LPQvtGC0L7QstC60LAg0LDQtNGA0LXRgdC+0LIsINC30LAg0LrQvtGC0L7RgNGL0LzQuCDQvdGD0LbQvdC+INC+0YLRgdC70LXQtNC40YLRjCDRg9GB0L/QtdGI0L3QvtC1INC/0YDQvtGF0L7QttC00LXQvdC40LUg0YLRgNCw0L3Qt9Cw0LrRhtC40LhcbiAgICAgICAgbGV0IHVzZXJLYXp0ZWwgPSBhd2FpdCB0aGlzLmdldFVzZXIodXNlci5QaG9uZU51bWJlciwgJ2thenRlbCcpO1xuICAgICAgICBsZXQgdXNlckVnb3YgPSBhd2FpdCB0aGlzLmdldFVzZXIodXNlci5QaG9uZU51bWJlciwgJ2Vnb3YnKTtcbiAgICAgICAgbGV0IGFkZHJlc3NlcyA9IFtcbiAgICAgICAgICAgIHRoaXMuY2hhaW5TZXJ2aWNlLmdldEFkZHJlc3ModXNlci5QaG9uZU51bWJlciwgJ3RmYScpLFxuICAgICAgICBdO1xuICAgICAgICBpZiAodXNlckthenRlbCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgYWRkcmVzc2VzLnB1c2godGhpcy5jaGFpblNlcnZpY2UuZ2V0QWRkcmVzcyh1c2VyLlBob25lTnVtYmVyLCAna2F6dGVsJykpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1c2VyRWdvdiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgYWRkcmVzc2VzLnB1c2godGhpcy5jaGFpblNlcnZpY2UuZ2V0QWRkcmVzcyh1c2VyLlBob25lTnVtYmVyLCAnZWdvdicpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyDQvdCw0YfQuNC90LDQtdC8INGB0LvRg9GI0LDRgtGMINC40LfQvNC10L3QtdC90LjRjyDQsNC00YDQtdGB0L7QslxuICAgICAgICBsZXQgd3MgPSB0aGlzLm9wZW5Xc0Nvbm5lY3Rpb24oYWRkcmVzc2VzKTtcblxuICAgICAgICB1c2VyLklzVmVyaWZpZWQgPSB0cnVlO1xuICAgICAgICB1c2VyLlB1c2hUb2tlbiA9IGJvZHkucHVzaF90b2tlbjtcbiAgICAgICAgYXdhaXQgdGhpcy50ZmFURi51cGRhdGVVc2VyKHVzZXIuUGhvbmVOdW1iZXIsIHVzZXIpO1xuXG4gICAgICAgIGlmICh1c2VyS2F6dGVsICE9PSBudWxsKSB7XG4gICAgICAgICAgICB1c2VyS2F6dGVsLklzVmVyaWZpZWQgPSB0cnVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5rYXp0ZWxURi51cGRhdGVVc2VyKHVzZXIuUGhvbmVOdW1iZXIsIHVzZXJLYXp0ZWwpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1c2VyRWdvdiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdXNlckthenRlbC5Jc1ZlcmlmaWVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZWdvdlRGLnVwZGF0ZVVzZXIodXNlci5QaG9uZU51bWJlciwgdXNlckVnb3YpO1xuICAgICAgICB9XG4gICAgICAgIGxldCByZXNwb25zZVNlbmQgPSBmYWxzZTtcbiAgICAgICAgd3Mub25tZXNzYWdlID0gbWVzcyA9PiB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShtZXNzLmRhdGEpO1xuICAgICAgICAgICAgZm9yIChsZXQgc3RhdGVDaGFuZ2Ugb2YgZGF0YS5zdGF0ZV9jaGFuZ2VzKXtcbiAgICAgICAgICAgICAgICBpZiAoYWRkcmVzc2VzLmluZGV4T2Yoc3RhdGVDaGFuZ2UuYWRkcmVzcykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IF91c2VyID0gbWVzc2FnZXNTZXJ2aWNlLlVzZXIuZGVjb2RlKG5ldyBCdWZmZXIoc3RhdGVDaGFuZ2UudmFsdWUsICdiYXNlNjQnKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZVNlbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdhY3Rpb24nOiAndW5zdWJzY3JpYmUnXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyB0b2RvOiDQv9C+INGF0L7RgNC+0YjQtdC80YMg0L3QsNC00L4g0LLQviDQstGB0LXRhSDRh9C10LnQvdCw0YUg0L7RgtGB0LvQtdC00LjRgtGMINC40LfQvNC10L3QtdC90LjRj1xuICAgICAgICAgICAgICAgICAgICBpZiAoX3VzZXIuSXNWZXJpZmllZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZVNlbmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuT0spLmpzb24oe3N0YXR1czogJ3N1Y2Nlc3MnfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2Vycm9yIC0gdHJ5aW5nIHRvIHNlbmQgcmVzcG9uc2Ugc2Vjb25kIHRpbWUnLCBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgd3Mub25jbG9zZSA9ICgpID0+IHtcbiAgICAgICAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgICdhY3Rpb24nOiAndW5zdWJzY3JpYmUnXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgQFBvc3QoJ2NvZGUnKVxuICAgIGFzeW5jIHBvc3RDb2RlKEBSZXMoKSByZXMsIEBCb2R5KCkgYm9keTogUG9zdENvZGVEVE8pIHtcbiAgICAgICAgbGV0IHYgPSBuZXcgVmFsaWRhdG9yKGJvZHksIHtcbiAgICAgICAgICAgIGV2ZW50OiAncmVxdWlyZWR8c3RyaW5nJyxcbiAgICAgICAgICAgIGxhbmc6ICdudWxsYWJsZXxzdHJpbmcnLFxuICAgICAgICAgICAgbWV0aG9kOiAncmVxdWlyZWR8c3RyaW5nfGluOnNtcyxwdXNoLHRlbGVncmFtLHdoYXRzYXBwJyxcbiAgICAgICAgICAgIHNlcnZpY2U6ICdyZXF1aXJlZElmTm90OnB1c2hfdG9rZW58c3RyaW5nfGluOmthenRlbCxlZ292JyxcbiAgICAgICAgICAgIHBob25lX251bWJlcjogJ3JlcXVpcmVkfHN0cmluZ3xyZWdleDovXlxcXFwrP1sxLTldXFxcXGR7MSwxNH0kLycsXG4gICAgICAgICAgICBlbWJlZGVkOiAnYm9vbGVhbicsXG4gICAgICAgICAgICBjbGllbnRfdGltZXN0YW1wOiAncmVxdWlyZWQnLFxuICAgICAgICAgICAgY2VydDogJ251bGxhYmxlJyxcbiAgICAgICAgICAgIHJlc2VuZDogJ251bGxhYmxlfGJvb2xlYW4nLFxuICAgICAgICB9LCB7J3NlcnZpY2UuaW4nOiBgTm8gc2VydmljZSB3aXRoIG5hbWU6ICR7Ym9keS5zZXJ2aWNlfWB9KTtcbiAgICAgICAgaWYgKHYuZmFpbHMoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih2LmdldEVycm9ycygpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyDQn9GA0L7QstC10YDQutCwLCDRgdGD0YnQtdGB0YLQstGD0LXRgiDQu9C4INC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjFxuICAgICAgICBsZXQgdXNlciA9IGF3YWl0IHRoaXMuZ2V0VXNlcihib2R5LnBob25lX251bWJlciwgYm9keS5zZXJ2aWNlKTtcbiAgICAgICAgaWYgKHVzZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuTk9UX0ZPVU5EKS5qc29uKHt1c2VyOiBbdGhpcy5nZXRVc2VyTm90Rm91bmRNZXNzYWdlKGJvZHkubGFuZyB8fCAnZW4nKV19KTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdGVsZWdyYW1Vc2VyO1xuICAgICAgICBpZiAoYm9keS5tZXRob2QgPT09ICd0ZWxlZ3JhbScpIHtcbiAgICAgICAgICAgIGxldCBudW1iZXIgPSB1c2VyLlBob25lTnVtYmVyO1xuICAgICAgICAgICAgaWYgKG51bWJlci5jaGFyQXQoMCkgPT09ICcrJykge1xuICAgICAgICAgICAgICAgIG51bWJlciA9IG51bWJlci5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0ZWxlZ3JhbVVzZXIgPSBhd2FpdCB0aGlzLnRlbGVncmFtU2VydmVyLnVzZXJFeGlzdHMobmV3IFJlZ0V4cCgnXjh8NycgKyBudW1iZXIuc3Vic3RyaW5nKDEpICsgJyQnLCAnaScpKTtcbiAgICAgICAgICAgIGlmICghdGVsZWdyYW1Vc2VyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih7dXNlcjogW3RoaXMuZ2V0TWVzc2FnZShib2R5LmxhbmcsICd0ZWxlZ3JhbV9ib3RfdW5yZWdpc3RlcmVkJyldfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjaGVjayBpZiB1c2VyIGRlbGV0ZSB0aGUgYm90XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudGVsZWdyYWZBcHAudGVsZWdyYW0uc2VuZE1lc3NhZ2UodGVsZWdyYW1Vc2VyLmNoYXRJZCwgJ9CX0LTRgNCw0LLRgdGC0LLRg9C50YLQtScpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGlmIChlLnJlc3BvbnNlICYmIGUucmVzcG9uc2UuZXJyb3JfY29kZSA9PT0gNDAzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFkpLmpzb24oe3N0YXR1czogJ3RlbGVncmFtX2JvdF91bnJlZ2lzdGVyZWQnfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vINC90LDRh9C40L3QsNC10Lwg0YHQu9GD0YjQsNGC0Ywg0LjQt9C80LXQvdC10L3QuNGPINCw0LTRgNC10YHQvtCyXG4gICAgICAgIGxldCBhZGRyZXNzZXMgPSBbdGhpcy5jaGFpblNlcnZpY2UuZ2V0QWRkcmVzcyh1c2VyLlBob25lTnVtYmVyLCBib2R5LnNlcnZpY2UpXTtcbiAgICAgICAgbGV0IHdzID0gdGhpcy5vcGVuV3NDb25uZWN0aW9uKGFkZHJlc3Nlcyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgbG9nID0gbmV3IFVzZXJMb2coKTtcbiAgICAgICAgICAgIGxvZy5BY3Rpb25UaW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKSAvIDEwMDA7XG4gICAgICAgICAgICBsb2cuRXhwaXJlZEF0ID0gdGhpcy50aW1lSGVscGVyLmdldFVuaXhUaW1lQWZ0ZXJNaW51dGVzKDcpO1xuICAgICAgICAgICAgbG9nLkV2ZW50ID0gYm9keS5ldmVudDtcbiAgICAgICAgICAgIGxvZy5NZXRob2QgPSBib2R5Lm1ldGhvZDtcbiAgICAgICAgICAgIGxvZy5TdGF0dXMgPSBib2R5LnJlc2VuZCA/ICdSRVNFTkRfQ09ERScgOiAnU0VORF9DT0RFJztcbiAgICAgICAgICAgIGxvZy5FbWJlZGVkID0gYm9keS5lbWJlZGVkO1xuICAgICAgICAgICAgbG9nLkNlcnQgPSBib2R5LmNlcnQ7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNoYWluU2VydmljZS5nZW5lcmF0ZUNvZGUodXNlci5QaG9uZU51bWJlciwgbG9nLCBib2R5LnNlcnZpY2UpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciB3aGlsZSBnZXR0aW5nIHVzZXJgLCBlKTtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuQkFEX0dBVEVXQVkpLmpzb24oe2Vycm9yOiAnRXJyb3Igc2VuZGluZyBjb2RlLid9KTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcHVzaFRva2VuID0gJyc7XG4gICAgICAgIGlmIChib2R5Lm1ldGhvZCA9PT0gJ3B1c2gnICYmICF1c2VyLklzVmVyaWZpZWQpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFkpLmpzb24oe3VzZXI6IFt0aGlzLmdldE1lc3NhZ2UoYm9keS5sYW5nLCAnbm90X3ZlcmlmaWVkJyldfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgdGZhVXNlciA9IGF3YWl0IHRoaXMuZ2V0VXNlcih1c2VyLlBob25lTnVtYmVyLCAndGZhJyk7XG4gICAgICAgICAgICBpZiAoIXRmYVVzZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHt1c2VyOiBbdGhpcy5nZXRNZXNzYWdlKGJvZHkubGFuZywgJ25vdF92ZXJpZmllZCcpXX0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcHVzaFRva2VuID0gdGZhVXNlci5QdXNoVG9rZW47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcmVzcG9uc2VTZW5kID0gZmFsc2U7XG4gICAgICAgIHdzLm9ubWVzc2FnZSA9IG1lc3MgPT4ge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UobWVzcy5kYXRhKTtcbiAgICAgICAgICAgIGZvciAobGV0IHN0YXRlQ2hhbmdlIG9mIGRhdGEuc3RhdGVfY2hhbmdlcykge1xuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZVNlbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7J2FjdGlvbic6ICd1bnN1YnNjcmliZSd9KSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYWRkcmVzc2VzLmluZGV4T2Yoc3RhdGVDaGFuZ2UuYWRkcmVzcykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB1c2VyRGVjb2RlZDtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJEZWNvZGVkID0gbWVzc2FnZXNTZXJ2aWNlQ2xpZW50LlVzZXIuZGVjb2RlKG5ldyBCdWZmZXIoc3RhdGVDaGFuZ2UudmFsdWUsICdiYXNlNjQnKSk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdWZXJpZmljYXRpb25Db250cm9sbGVyQHBvc3RDb2RlOiBDYW50IGRlY29kZSB1c2VyJywgZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZVNlbmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7J2FjdGlvbic6ICd1bnN1YnNjcmliZSd9KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHt1c2VyOiBbdGhpcy5nZXRNZXNzYWdlKGJvZHkubGFuZywgJ2Vycm9yX2RlY29kZV91c2VyX2JjJyldfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHVzZXJEZWNvZGVkLkxvZ3MubGVuZ3RoID4gdXNlci5Mb2dzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbG9nOiBVc2VyTG9nID0gdXNlckRlY29kZWQuTG9nc1tnZXRMYXRlc3RJbmRleChPYmplY3Qua2V5cyh1c2VyRGVjb2RlZC5Mb2dzKSldO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxvZy5TdGF0dXMgIT09IFNFTkRfQ09ERSAmJiBsb2cuU3RhdHVzICE9PSBSRVNFTkRfQ09ERSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlU2VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdhY3Rpb24nOiAndW5zdWJzY3JpYmUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFkpLmpzb24oe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VyOiBbJ0NvZGUgd2FzIG5vdCBzZW5kIC0gbGF0ZXN0IGxvZyBpcyBub3Qgd2l0aCB0aGUgY29kZSB0byBzZW5kLiddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGxvZy5NZXRob2QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdwdXNoJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb2RlUXVldWVMaXN0ZW5lclNlcnZpY2UucXVldWVQVVNILmFkZCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ9CU0LLRg9GF0YTQsNC60YLQvtGA0L3QsNGPINCw0LLRgtC+0YDQuNC30LDRhtC40Y8nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYNCf0L7QtNGC0LLQtdGA0LTQuNGC0LUg0LLRhdC+0LQg0L3QsCDRgdC10YDQstC40YE6ICcke1NlcnZpY2VzW2JvZHkuc2VydmljZV19J2AsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXJ2aWNlOiBib2R5LnNlcnZpY2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwdXNoX3Rva2VuOiBwdXNoVG9rZW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3Ntcyc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdsb2cuQ29kZScsIGxvZy5Db2RlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb2RlUXVldWVMaXN0ZW5lclNlcnZpY2UucXVldWVTTVMuYWRkKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBob25lX251bWJlcjogdXNlci5QaG9uZU51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZpY2U6IGJvZHkuc2VydmljZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IGxvZy5Db2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAndGVsZWdyYW0nOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvZGVRdWV1ZUxpc3RlbmVyU2VydmljZS5xdWV1ZVRlbGVncmFtLmFkZCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGF0X2lkOiB0ZWxlZ3JhbVVzZXIuY2hhdElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ9CS0LDRiCDQutC+0LQg0L/QvtC00YLQstC10YDQttC00LXQvdC40Y8g0LTQu9GPINGB0LXRgNCy0LjRgdCwIFwiJyArIFNlcnZpY2VzW2JvZHkuc2VydmljZV0gKyAnXCI6ICcgKyBsb2cuQ29kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3doYXRzYXBwJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdG9kb1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBDaGFpbkNvbnRyb2xsZXJAZGVsaXZlckNvZGU6IG1ldGhvZCAke2xvZy5NZXRob2R9IGlzIG5vdCBzdXBwb3J0ZWQuYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7J2FjdGlvbic6ICd1bnN1YnNjcmliZSd9KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZVNlbmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5PSykuanNvbih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzZW5kX2Nvb2xkb3duOiA3ICogNjAsICAvLyDQmtC+0LvQuNGH0LXRgdGC0LLQviDRgdC10LrRg9C90LQg0LfQsCDQutC+0YLQvtGA0YvQtSDQvdCw0LTQviDQstCy0LXRgdGC0Lgg0LrQvtC0INC4INC30LAg0LrQvtGC0L7RgNGL0LUg0L3QtdC70YzQt9GPINC+0YLQv9GA0LDQstC40YLRjCDQutC+0LQg0L/QvtCy0YLQvtGA0L3QvlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogYm9keS5tZXRob2QsICAgICAgLy8g0JzQtdGC0L7QtCDQvtGC0L/RgNCw0LLQutC4IChpbjpwdXNoLHNtcyx0ZWxlZ3JhbSx3aGF0c2FwcClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6ICdzdWNjZXNzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB3cy5vbmNsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgJ2FjdGlvbic6ICd1bnN1YnNjcmliZSdcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBAR2V0KCdjb2RlJylcbiAgICBhc3luYyBnZXRDb2RlKEBSZXEoKSByZXEsIEBSZXMoKSByZXMsXG4gICAgICAgICAgICAgICAgICBAUXVlcnkoJ3Bob25lX251bWJlcicpIHBob25lTnVtYmVyOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICBAUXVlcnkoJ3B1c2hfdG9rZW4nKSBwdXNoVG9rZW46IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgIEBRdWVyeSgnY2xpZW50X3RpbWVzdGFtcCcpIGNsaWVudFRpbWVzdGFtcDogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXEucXVlcnkuY2xpZW50X3RpbWVzdGFtcCA9IHBhcnNlSW50KHJlcS5xdWVyeS5jbGllbnRfdGltZXN0YW1wLCAxMCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdlJywgZSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHYgPSBuZXcgVmFsaWRhdG9yKHJlcS5xdWVyeSwge1xuICAgICAgICAgICAgcGhvbmVfbnVtYmVyOiAncmVxdWlyZWR8c3RyaW5nfHJlZ2V4Oi9eXFxcXCs/WzEtOV1cXFxcZHsxLDE0fSQvJyxcbiAgICAgICAgICAgIHB1c2hfdG9rZW46ICdyZXF1aXJlZHxzdHJpbmcnLFxuICAgICAgICAgICAgY2xpZW50X3RpbWVzdGFtcDogJ3JlcXVpcmVkfG51bWJlcicsXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodi5mYWlscygpKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHYuZ2V0RXJyb3JzKCkpO1xuICAgICAgICB9XG4gICAgICAgIGxldCB0ZmFLYXp0ZWwgPSBhd2FpdCB0aGlzLmdldFVzZXIocGhvbmVOdW1iZXIsICd0ZmEnKTtcbiAgICAgICAgaWYgKCF0ZmFLYXp0ZWwpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuTk9UX0ZPVU5EKS5qc29uKHt1c2VyOiBbdGhpcy5nZXRVc2VyTm90Rm91bmRNZXNzYWdlKHJlcS5xdWVyeS5sYW5nIHx8ICdlbicpXX0pO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGZhS2F6dGVsLklzVmVyaWZpZWQgfHwgdGZhS2F6dGVsLlB1c2hUb2tlbiAhPT0gcHVzaFRva2VuKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk5PVF9GT1VORCkuanNvbih7dXNlcjogW3RoaXMuZ2V0VXNlck5vdEZvdW5kTWVzc2FnZShyZXEucXVlcnkubGFuZyB8fCAnZW4nKV19KTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdXNlckthenRlbCA9IGF3YWl0IHRoaXMuZ2V0VXNlcih0ZmFLYXp0ZWwuUGhvbmVOdW1iZXIsICdrYXp0ZWwnKTtcbiAgICAgICAgbGV0IHVzZXJFZ292ID0gYXdhaXQgdGhpcy5nZXRVc2VyKHRmYUthenRlbC5QaG9uZU51bWJlciwgJ2Vnb3YnKTtcbiAgICAgICAgaWYgKHVzZXJLYXp0ZWwgPT09IG51bGwgJiYgdXNlckVnb3YgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5OT1RfRk9VTkQpLmpzb24oe3VzZXI6IFt0aGlzLmdldFVzZXJOb3RGb3VuZE1lc3NhZ2UocmVxLnF1ZXJ5LmxhbmcgfHwgJ2VuJyldfSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG51bWJlciA9IHRmYUthenRlbC5QaG9uZU51bWJlcjtcbiAgICAgICAgaWYgKG51bWJlci5jaGFyQXQoMCkgPT09ICcrJykge1xuICAgICAgICAgICAgbnVtYmVyID0gbnVtYmVyLnN1YnN0cmluZygxKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBsZXQgdGVsZWdyYW1Vc2VyID0gYXdhaXQgdGhpcy50ZWxlZ3JhbVNlcnZlci51c2VyRXhpc3RzKG5ldyBSZWdFeHAoJ144fDcnICsgbnVtYmVyLnN1YnN0cmluZygxKSArICckJywgJ2knKSk7XG4gICAgICAgIC8vIGxldCB0ZWxlZ3JhbVVzZXJDcmVhdGVkQXQgPSBudWxsO1xuICAgICAgICAvLyBpZiAodGVsZWdyYW1Vc2VyKSB7XG4gICAgICAgIC8vICAgICB0ZWxlZ3JhbVVzZXJDcmVhdGVkQXQgPSB0ZWxlZ3JhbVVzZXIuXG4gICAgICAgIC8vICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHt1c2VyOiBbdGhpcy5nZXRNZXNzYWdlKCdydScsICd0ZWxlZ3JhbV9ib3RfdW5yZWdpc3RlcmVkJyldfSk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgbGV0IHtsb2dLYXp0ZWwsIGxvZ0Vnb3Z9ID0gdGhpcy5pbml0TG9ncyh1c2VyS2F6dGVsLCB1c2VyRWdvdik7XG4gICAgICAgIGlmIChsb2dLYXp0ZWwuc3RhdHVzICE9PSAnc3VjY2VzcycgJiYgbG9nRWdvdi5zdGF0dXMgIT09ICdzdWNjZXNzJykge1xuICAgICAgICAgICAgc3dpdGNoIChsb2dLYXp0ZWwuc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnbm9fc2VuZF9jb2Rlcyc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFkpLmpzb24oe1xuICAgICAgICAgICAgICAgICAgICAgICAgdXNlcjogW3JlcS5xdWVyeS5sYW5nID09ICdydScgPyAn0J/QvtC70YzQt9C+0LLQsNGC0LXQu9GOINC10YnRkSDQvdC1INC+0YLQv9GA0LDQstC40LvQuCDQvdC4INC+0LTQvdC+0LPQviDQutC+0LTQsCDQv9C+0LTRgtCy0LXRgNC20LTQtdC90LjRjycgOiAnTm8gY29kZSBmb3IgdXNlciB5ZXQnXVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjYXNlICdub19jb2RlX3VzZWQnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmpzb24oe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXI6IFtyZXEucXVlcnkubGFuZyA9PSAncnUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gJ9Cf0L7Qu9GM0LfQvtCy0LDRgtC10LvRjiDQtdGJ0ZEg0L3QtSDQvtGC0L/RgNCw0LLQuNC70Lgg0L3QuCDQvtC00L3QvtCz0L4g0LrQvtC00LAg0L/QvtC00YLQstC10YDQttC00LXQvdC40Y8nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogJ05vIGNvZGUgZm9yIHVzZXIgeWV0J11cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFkpLmpzb24oe3VzZXI6IFsnRXJyb3IgZ2V0dGluZyBjb2RlJ119KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobG9nS2F6dGVsLnN0YXR1cyA9PT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk9LKS5qc29uKHRoaXMudHJhbnNmb3JtTG9nKGxvZ0thenRlbC5sb2csICdrYXp0ZWwnKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxvZ0Vnb3Yuc3RhdHVzID09PSAnc3VjY2VzcycpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuT0spLmpzb24odGhpcy50cmFuc2Zvcm1Mb2cobG9nRWdvdi5sb2csICdlZ292JykpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFkpLmpzb24oe3VzZXI6IFsnRXJyb3IgZ2V0dGluZyBjb2RlJ119KTtcbiAgICB9XG5cbiAgICBAUG9zdCgndmVyaWZ5JylcbiAgICBhc3luYyBwb3N0VmVyaWZ5KEBSZXMoKSByZXMsIEBCb2R5KCkgYm9keTogUG9zdFZlcmlmeUNvZGVEVE8pIHtcbiAgICAgICAgbGV0IHYgPSBuZXcgVmFsaWRhdG9yKGJvZHksIHtcbiAgICAgICAgICAgIGV2ZW50OiAncmVxdWlyZWR8c3RyaW5nJywgbGFuZzogJ3N0cmluZycsIGNvZGU6ICdyZXF1aXJlZHxudW1iZXInLCBzZXJ2aWNlOiAncmVxdWlyZWRJZk5vdDpwdXNoX3Rva2VufHN0cmluZ3xpbjprYXp0ZWwsZWdvdicsXG4gICAgICAgICAgICBwaG9uZV9udW1iZXI6ICdyZXF1aXJlZHxzdHJpbmd8cmVnZXg6L15cXFxcKz9bMS05XVxcXFxkezEsMTR9JC8nLCBlbWJlZGVkOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAvLyDQuNGB0L/QvtC70YzQt9GD0LXRgtGB0Y8g0YLQvtC70YzQutC+INC/0YDQuCDQvtGC0L/RgNCw0LLQutC1INC80L7QsdC40LvRjNC90YvQvCDQv9GA0LjQu9C+0LbQtdC90LjQtdC8IC0g0LTQu9GPINGD0YHRgtCw0L3QvtCy0LrQtSDRgdGC0LDRgtGD0YHQsCBSRUpFQ1RcbiAgICAgICAgICAgIHN0YXR1czogJ3N0cmluZycsIGNsaWVudF90aW1lc3RhbXA6ICdyZXF1aXJlZCcsIGNlcnQ6ICdudWxsYWJsZScsXG4gICAgICAgIH0sIHsnc2VydmljZS5pbic6IGBObyBzZXJ2aWNlIHdpdGggbmFtZTogJHtib2R5LnNlcnZpY2V9YH0pO1xuICAgICAgICBpZiAodi5mYWlscygpKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHYuZ2V0RXJyb3JzKCkpO1xuICAgICAgICB9XG4gICAgICAgIC8vINCf0YDQvtCy0LXRgNC60LAsINGB0YPRidC10YHRgtCy0YPQtdGCINC70Lgg0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GMXG4gICAgICAgIGxldCB1c2VyID0gYXdhaXQgdGhpcy5nZXRVc2VyKGJvZHkucGhvbmVfbnVtYmVyLCBib2R5LnNlcnZpY2UpO1xuICAgICAgICBpZiAodXNlciA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5OT1RfRk9VTkQpLmpzb24oe1xuICAgICAgICAgICAgICAgIHVzZXI6IFt0aGlzLmdldFVzZXJOb3RGb3VuZE1lc3NhZ2UoYm9keS5sYW5nIHx8ICdlbicpXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8g0L3QsNGH0LjQvdCw0LXQvCDRgdC70YPRiNCw0YLRjCDQuNC30LzQtdC90LXQvdC40Y8g0LDQtNGA0LXRgdC+0LJcbiAgICAgICAgbGV0IGFkZHJlc3NlcyA9IFtcbiAgICAgICAgICAgIHRoaXMuY2hhaW5TZXJ2aWNlLmdldEFkZHJlc3ModXNlci5QaG9uZU51bWJlciwgYm9keS5zZXJ2aWNlKSxcbiAgICAgICAgXTtcbiAgICAgICAgbGV0IHdzID0gdGhpcy5vcGVuV3NDb25uZWN0aW9uKGFkZHJlc3Nlcyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnN0b3JlTG9nKGJvZHksIHVzZXIpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciB3aGlsZSBnZXR0aW5nIHVzZXJgLCBlKTtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuQkFEX0dBVEVXQVkpLmpzb24oe2Vycm9yOiAnRXJyb3IgY2hlY2tpbmcgY29kZS4nfSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgICAgICBsZXQgdGZhVXNlciA9IGF3YWl0IHRoaXMuZ2V0VXNlcihib2R5LnBob25lX251bWJlciwgJ3RmYScpO1xuICAgICAgICB3cy5vbm1lc3NhZ2UgPSBtZXNzID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKG1lc3MuZGF0YSk7XG4gICAgICAgICAgICBsZXQgcmVzcG9uc2VTZW5kID0gZmFsc2U7XG4gICAgICAgICAgICBmb3IgKGxldCBzdGF0ZUNoYW5nZSBvZiBkYXRhLnN0YXRlX2NoYW5nZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2VTZW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoeydhY3Rpb24nOiAndW5zdWJzY3JpYmUnfSkpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGFkZHJlc3Nlcy5pbmRleE9mKHN0YXRlQ2hhbmdlLmFkZHJlc3MpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBfdXNlciA9IG1lc3NhZ2VzU2VydmljZUNsaWVudC5Vc2VyLmRlY29kZShuZXcgQnVmZmVyKHN0YXRlQ2hhbmdlLnZhbHVlLCAnYmFzZTY0JykpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoX3VzZXIuTG9ncy5sZW5ndGggPT09IHVzZXIuTG9ncy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdfdXNlci5Mb2dzJywgX3VzZXIuTG9ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZVNlbmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHsnYWN0aW9uJzogJ3Vuc3Vic2NyaWJlJ30pKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhdHVzID0gX3VzZXIuTG9nc1tfdXNlci5Mb2dzLmxlbmd0aCAtIDFdLlN0YXR1cztcbiAgICAgICAgICAgICAgICAgICAgLy8gc2FmZSBpbiByZWRpcyBpbmZvcm1hdGlvbiB0aGF0IHBob25lIGlzIHZhbGlkXG4gICAgICAgICAgICAgICAgICAgIHNlbGYucmVkaXNDbGllbnQuc2V0QXN5bmMoYCR7dGZhVXNlci5QaG9uZU51bWJlcn06JHtSRURJU19VU0VSX1BVU0hfUkVTVUxUX1BPU1RGSVh9YCwgc3RhdHVzLCAnRVgnLCAxNSAqIDYwKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGF0dXMgPT09IFZBTElEIHx8IHN0YXR1cyA9PT0gUkVKRUNUKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2VuZCB1c2VyIHRvIGNsaWVudC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0b2RvINC+0YLRgNCw0LHQvtGC0LDRgtGMINCyINC80L7QvNC90LXRgiDQuNC90YLQtdCz0YDQsNGG0LjQuFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRvZG8gbWFrZSByZXF1ZXN0IHRvIHJlZGlyZXN0IHVybCB3aXRoIHVzZXIgZGF0YVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlc3BvbmRlIHRvIHRoZSB2aWV3XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5PSykuanNvbih7c3RhdHVzOiBzdGF0dXMsIHVzZXI6IF91c2VyfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGF0dXMgPT09ICdFWFBJUkVEJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0NDApLmpzb24oe3N0YXR1czogc3RhdHVzfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuQkFEX1JFUVVFU1QpLmpzb24oe3N0YXR1czogc3RhdHVzfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGluaXRMb2dzKHVzZXJLYXp0ZWw6IFBvc3RDbGllbnRVc2VyRFRPIHwgbnVsbCwgdXNlckVnb3Y6IFBvc3RDbGllbnRVc2VyRFRPIHwgbnVsbCkge1xuICAgICAgICBsZXQgbG9nS2F6dGVsID0ge3N0YXR1czogJ25vX3NlbmRfY29kZXMnLCBsb2c6IHtTZXJ2aWNlOiBudWxsfX07XG4gICAgICAgIGlmICh1c2VyS2F6dGVsKSB7XG4gICAgICAgICAgICBsb2dLYXp0ZWwgPSB0aGlzLmdldExhdGVzdENvZGUodXNlckthenRlbCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGxvZ0Vnb3YgPSB7c3RhdHVzOiAnbm9fc2VuZF9jb2RlcycsIGxvZzoge1NlcnZpY2U6IG51bGx9fTtcbiAgICAgICAgaWYgKHVzZXJFZ292KSB7XG4gICAgICAgICAgICBsb2dFZ292ID0gdGhpcy5nZXRMYXRlc3RDb2RlKHVzZXJFZ292KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge2xvZ0thenRlbCwgbG9nRWdvdn07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBzdG9yZUxvZyhib2R5OiBQb3N0VmVyaWZ5Q29kZURUTywgdXNlcjogUG9zdENsaWVudFVzZXJEVE8gfCBudWxsKSB7XG4gICAgICAgIGxldCByZWplY3RTdGF0dXMgPSBudWxsO1xuICAgICAgICBpZiAoYm9keS5zdGF0dXMgJiYgYm9keS5zdGF0dXMgPT09ICdSRUpFQ1QnKSB7XG4gICAgICAgICAgICByZWplY3RTdGF0dXMgPSAnUkVKRUNUJztcbiAgICAgICAgfVxuICAgICAgICBsZXQgbG9nID0gbmV3IFVzZXJMb2coKTtcbiAgICAgICAgbG9nLkFjdGlvblRpbWUgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpIC8gMTAwMDtcbiAgICAgICAgbG9nLkV4cGlyZWRBdCA9IHRoaXMudGltZUhlbHBlci5nZXRVbml4VGltZUFmdGVyTWludXRlcygxKTtcbiAgICAgICAgbG9nLkV2ZW50ID0gYm9keS5ldmVudDtcbiAgICAgICAgbG9nLkVtYmVkZWQgPSBib2R5LmVtYmVkZWQ7XG4gICAgICAgIGxvZy5TdGF0dXMgPSByZWplY3RTdGF0dXMgfHwgJ1ZFUklGWSc7XG4gICAgICAgIGxvZy5Db2RlID0gYm9keS5jb2RlO1xuICAgICAgICBsb2cuQ2VydCA9IGJvZHkuY2VydDtcbiAgICAgICAgYXdhaXQgdGhpcy5jaGFpblNlcnZpY2UudmVyaWZ5KHVzZXIuUGhvbmVOdW1iZXIsIGxvZywgYm9keS5zZXJ2aWNlKTtcbiAgICB9XG59Il19