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
const fs = require('fs');
const protobufLib = require('protocol-buffers');
const messagesService = protobufLib(fs.readFileSync('src/proto/service.proto'));
const messagesServiceClient = protobufLib(fs.readFileSync('src/proto/service_client.proto'));
let UserController = class UserController extends controller_1.ApiController {
    constructor(timeHelper, tfaTF, kaztelTF, egovTF, chainService, services, codeQueueListenerService) {
        super(tfaTF, kaztelTF, egovTF);
        this.timeHelper = timeHelper;
        this.tfaTF = tfaTF;
        this.kaztelTF = kaztelTF;
        this.egovTF = egovTF;
        this.chainService = chainService;
        this.services = services;
        this.codeQueueListenerService = codeQueueListenerService;
    }
    sendUserCode(req, res, phoneNumber) {
        return __awaiter(this, void 0, void 0, function* () {
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
            console.log('code', code);
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
                console.log('user not found!!!!!');
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
        queue_service_1.CodeQueueListenerService])
], UserController);
exports.UserController = UserController;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvY29udHJvbGxzZXJzL3VzZXIuY29udHJvbGxlci50cyIsInNvdXJjZXMiOlsiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvY29udHJvbGxzZXJzL3VzZXIuY29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkNBQXdGO0FBQ3hGLDZDQUEyQztBQUMzQywyRkFBbUY7QUFDbkYsK0VBQXFGO0FBQ3JGLGdFQUFnRTtBQUNoRSx1RUFBaUU7QUFDakUsbUZBQXNFO0FBQ3RFLHlGQUFrRjtBQUNsRiwrRkFBd0Y7QUFDeEYsNEVBQXNFO0FBQ3RFLDJGQUFvRjtBQUNwRiwyREFBcUQ7QUFDckQsNkVBQTBFO0FBQzFFLDZDQUEyQztBQUMzQyx5REFBNEc7QUFFNUcsK0RBQTBEO0FBRTFELE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN6QixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUNoRCxNQUFNLGVBQWUsR0FBRyxXQUFXLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUM7QUFDaEYsTUFBTSxxQkFBcUIsR0FBRyxXQUFXLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUM7QUFJN0YsSUFBYSxjQUFjLEdBQTNCLG9CQUE0QixTQUFRLDBCQUFhO0lBYTdDLFlBQW9CLFVBQXNCLEVBQ3ZCLEtBQTJCLEVBQzNCLFFBQWlDLEVBQ2pDLE1BQTZCLEVBQzdCLFlBQTBCLEVBQ3pCLFFBQXVCLEVBQ3ZCLHdCQUFrRDtRQUNsRSxLQUFLLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztRQVBmLGVBQVUsR0FBVixVQUFVLENBQVk7UUFDdkIsVUFBSyxHQUFMLEtBQUssQ0FBc0I7UUFDM0IsYUFBUSxHQUFSLFFBQVEsQ0FBeUI7UUFDakMsV0FBTSxHQUFOLE1BQU0sQ0FBdUI7UUFDN0IsaUJBQVksR0FBWixZQUFZLENBQWM7UUFDekIsYUFBUSxHQUFSLFFBQVEsQ0FBZTtRQUN2Qiw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO0lBRXRFLENBQUM7SUFHSyxZQUFZLENBQVEsR0FBRyxFQUNILEdBQUcsRUFDYSxXQUFtQjs7WUFFekQsSUFBSSxDQUFDLEdBQUcsSUFBSSw2QkFBUyxDQUFDLEVBQUMsWUFBWSxFQUFFLFdBQVcsRUFBQyxFQUFFLEVBQUMsWUFBWSxFQUFFLDhDQUE4QyxHQUFFLENBQUMsQ0FBQztZQUNwSCxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNaLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLG1CQUFVLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDM0UsQ0FBQztZQUNELElBQUksSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbEQsRUFBRSxDQUFDLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ2hCLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQztnQkFDbkMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsbUJBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7WUFDaEgsQ0FBQztZQUNELE1BQU0sSUFBSSxHQUFHLGlCQUFPLEVBQUUsQ0FBQztZQUN2QixPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUUxQixFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hDLFdBQVcsR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNDLENBQUM7WUFDRCxJQUFJLElBQUksR0FBRyxJQUFJLENBQUM7WUFHaEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsR0FBRyxXQUFXLElBQUksOEJBQWtCLEVBQUUsRUFBRSxHQUFHLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFFakcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUM7b0JBQ3ZDLFlBQVksRUFBRSxXQUFXO29CQUN6QixPQUFPLEVBQUUsUUFBUTtvQkFDakIsSUFBSSxFQUFFLElBQUk7b0JBQ1YsWUFBWSxFQUFFLElBQUk7aUJBQ3JCLENBQUMsQ0FBQztZQUNQLENBQUMsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsbUJBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBQyxNQUFNLEVBQUUsU0FBUyxFQUFDLENBQUMsQ0FBQztRQUMvRCxDQUFDO0tBQUE7SUFHSyxZQUFZLENBQVEsR0FBRyxFQUFVLElBQXlCOztZQUc1RCxJQUFJLENBQUMsR0FBRyxJQUFJLDZCQUFTLENBQUMsSUFBSSxFQUFFO2dCQUN4QixZQUFZLEVBQUUsOENBQThDO2dCQUM1RCxVQUFVLEVBQUUsaUJBQWlCO2dCQUM3QixJQUFJLEVBQUUsaUJBQWlCO2FBQzFCLEVBQUU7Z0JBQ0MsdUJBQXVCLEVBQUUseURBQXlEO2FBQ3JGLENBQUMsQ0FBQztZQUNILEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ1osTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsbUJBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztZQUMzRSxDQUFDO1lBRUQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDdEMsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2RCxDQUFDO1lBRUQsSUFBSSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDeEQsRUFBRSxDQUFDLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ2hCLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQztnQkFDbkMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsbUJBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztZQUMzRyxDQUFDO1lBQ0QsTUFBTSxRQUFRLEdBQUcsR0FBRyxJQUFJLENBQUMsWUFBWSxJQUFJLDhCQUFrQixFQUFFLENBQUM7WUFFOUQsTUFBTSxhQUFhLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNoRSxFQUFFLENBQUMsQ0FBQyxhQUFhLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDeEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsbUJBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLElBQUksQ0FBQztvQkFDcEQsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLG9DQUFvQyxDQUFDLENBQUMsQ0FBQyx3Q0FBd0MsQ0FBQztpQkFDL0csQ0FBQyxDQUFDO1lBQ1AsQ0FBQztZQUNELEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN6RCxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxtQkFBVSxDQUFDLG9CQUFvQixDQUFDLENBQUMsSUFBSSxDQUFDO29CQUNwRCxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLDBCQUEwQixDQUFDO2lCQUNwRixDQUFDLENBQUM7WUFDUCxDQUFDO1lBQ0QsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUdyQyxJQUFJLFVBQVUsR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNoRSxJQUFJLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM1RCxJQUFJLFNBQVMsR0FBRztnQkFDWixJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQzthQUN4RCxDQUFDO1lBQ0YsRUFBRSxDQUFDLENBQUMsVUFBVSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3RCLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzdFLENBQUM7WUFDRCxFQUFFLENBQUMsQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDcEIsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDM0UsQ0FBQztZQUVELElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUUxQyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztZQUN2QixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDakMsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRXBELEVBQUUsQ0FBQyxDQUFDLFVBQVUsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUN0QixVQUFVLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztnQkFDN0IsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2pFLENBQUM7WUFDRCxFQUFFLENBQUMsQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDcEIsVUFBVSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7Z0JBQzdCLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUM3RCxDQUFDO1lBQ0QsSUFBSSxZQUFZLEdBQUcsS0FBSyxDQUFDO1lBQ3pCLEVBQUUsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEVBQUU7Z0JBQ2xCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNuQyxHQUFHLENBQUMsQ0FBQyxJQUFJLFdBQVcsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUEsQ0FBQztvQkFDeEMsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNoRCxNQUFNLEtBQUssR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7d0JBQ25GLEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7NEJBQ2YsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO2dDQUNuQixRQUFRLEVBQUUsYUFBYTs2QkFDMUIsQ0FBQyxDQUFDLENBQUM7NEJBQ0osS0FBSyxDQUFDO3dCQUNWLENBQUM7d0JBRUQsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7NEJBQ25CLElBQUksQ0FBQztnQ0FDRCxZQUFZLEdBQUcsSUFBSSxDQUFDO2dDQUNwQixNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxtQkFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUMsQ0FBQyxDQUFDOzRCQUMvRCxDQUFDOzRCQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0NBQ1QsT0FBTyxDQUFDLEdBQUcsQ0FBQyw2Q0FBNkMsRUFBRSxDQUFDLENBQUMsQ0FBQzs0QkFDbEUsQ0FBQzt3QkFDTCxDQUFDO29CQUNMLENBQUM7Z0JBQ0wsQ0FBQztZQUNMLENBQUMsQ0FBQztZQUNGLEVBQUUsQ0FBQyxPQUFPLEdBQUcsR0FBRyxFQUFFO2dCQUNkLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztvQkFDbkIsUUFBUSxFQUFFLGFBQWE7aUJBQzFCLENBQUMsQ0FBQyxDQUFDO1lBQ1IsQ0FBQyxDQUFDO1FBQ04sQ0FBQztLQUFBO0lBR0ssT0FBTyxDQUFRLEdBQUcsRUFBUyxHQUFHLEVBQXlCLFdBQW1CLEVBQXVCLFNBQWlCLEVBQy9FLGVBQXVCOztZQUM1RCxJQUFJLENBQUM7Z0JBQ0QsR0FBRyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMxRSxDQUFDO1lBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDVCxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QixDQUFDO1lBQ0QsSUFBSSxDQUFDLEdBQUcsSUFBSSw2QkFBUyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUU7Z0JBQzdCLFlBQVksRUFBRSw4Q0FBOEM7Z0JBQzVELFVBQVUsRUFBRSxpQkFBaUI7Z0JBQzdCLGdCQUFnQixFQUFFLGlCQUFpQjthQUN0QyxDQUFDLENBQUM7WUFDSCxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNaLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLG1CQUFVLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDM0UsQ0FBQztZQUNELElBQUksU0FBUyxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdkQsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUNiLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLG1CQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO1lBQ2hILENBQUM7WUFDRCxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxVQUFVLElBQUksU0FBUyxDQUFDLFNBQVMsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUM3RCxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxtQkFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztZQUNoSCxDQUFDO1lBQ0QsSUFBSSxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDckUsSUFBSSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDakUsRUFBRSxDQUFDLENBQUMsVUFBVSxLQUFLLElBQUksSUFBSSxRQUFRLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDMUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsbUJBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7WUFDaEgsQ0FBQztZQUNELElBQUksRUFBQyxTQUFTLEVBQUUsT0FBTyxFQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDL0QsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sS0FBSyxTQUFTLElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUNqRSxNQUFNLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztvQkFDdkIsS0FBSyxlQUFlO3dCQUNoQixNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxtQkFBVSxDQUFDLG9CQUFvQixDQUFDLENBQUMsSUFBSSxDQUFDOzRCQUNwRCxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLDREQUE0RCxDQUFDLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQzt5QkFDekgsQ0FBQyxDQUFDO29CQUNQLEtBQUssY0FBYzt3QkFDZixNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxtQkFBVSxDQUFDLG9CQUFvQixDQUFDOzZCQUM3QyxJQUFJLENBQUM7NEJBQ0YsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksSUFBSTtvQ0FDekIsQ0FBQyxDQUFDLDREQUE0RDtvQ0FDOUQsQ0FBQyxDQUFDLHNCQUFzQixDQUFDO3lCQUNoQyxDQUFDLENBQUM7b0JBQ1g7d0JBQ0ksTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsbUJBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFDLElBQUksRUFBRSxDQUFDLG9CQUFvQixDQUFDLEVBQUMsQ0FBQyxDQUFDO2dCQUNoRyxDQUFDO1lBQ0wsQ0FBQztZQUNELEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDakMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsbUJBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDdEYsQ0FBQztZQUNELEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDL0IsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsbUJBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDbEYsQ0FBQztZQUNELE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLG1CQUFVLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBQyxJQUFJLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFDLENBQUMsQ0FBQztRQUM1RixDQUFDO0tBQUE7SUFHSyxVQUFVLENBQVEsR0FBRyxFQUFVLElBQXVCOztZQUN4RCxJQUFJLENBQUMsR0FBRyxJQUFJLDZCQUFTLENBQUMsSUFBSSxFQUFFO2dCQUN4QixLQUFLLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsT0FBTyxFQUFFLGdEQUFnRDtnQkFDNUgsWUFBWSxFQUFFLDhDQUE4QyxFQUFFLE9BQU8sRUFBRSxTQUFTO2dCQUVoRixNQUFNLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsVUFBVTthQUNuRSxFQUFFLEVBQUMsWUFBWSxFQUFFLHlCQUF5QixJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUMsQ0FBQyxDQUFDO1lBQzVELEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ1osTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsbUJBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztZQUMzRSxDQUFDO1lBRUQsSUFBSSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQy9ELEVBQUUsQ0FBQyxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNoQixNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxtQkFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQztvQkFDekMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLENBQUM7aUJBQ3pELENBQUMsQ0FBQztZQUNQLENBQUM7WUFFRCxJQUFJLFNBQVMsR0FBRztnQkFDWixJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUM7YUFDL0QsQ0FBQztZQUNGLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUMxQyxJQUFJLENBQUM7Z0JBQ0QsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNwQyxDQUFDO1lBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDVCxPQUFPLENBQUMsS0FBSyxDQUFDLDBCQUEwQixFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM3QyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxtQkFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFDLEtBQUssRUFBRSxzQkFBc0IsRUFBQyxDQUFDLENBQUM7WUFDcEYsQ0FBQztZQUNELElBQUksSUFBSSxHQUFHLElBQUksQ0FBQztZQUNoQixJQUFJLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMzRCxFQUFFLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxFQUFFO2dCQUNsQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDbkMsSUFBSSxZQUFZLEdBQUcsS0FBSyxDQUFDO2dCQUN6QixHQUFHLENBQUMsQ0FBQyxJQUFJLFdBQVcsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztvQkFDekMsRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQzt3QkFDZixFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBQyxRQUFRLEVBQUUsYUFBYSxFQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNuRCxLQUFLLENBQUM7b0JBQ1YsQ0FBQztvQkFDRCxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ2hELE1BQU0sS0FBSyxHQUFHLHFCQUFxQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO3dCQUN6RixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7NEJBQ3pDLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQzs0QkFDdEMsUUFBUSxDQUFDO3dCQUNiLENBQUM7d0JBQ0QsWUFBWSxHQUFHLElBQUksQ0FBQzt3QkFDcEIsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUMsUUFBUSxFQUFFLGFBQWEsRUFBQyxDQUFDLENBQUMsQ0FBQzt3QkFDbkQsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7d0JBRXhELElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEdBQUcsT0FBTyxDQUFDLFdBQVcsSUFBSSwwQ0FBOEIsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7NEJBQ25ILEVBQUUsQ0FBQyxDQUFDLE1BQU0sS0FBSyxpQkFBSyxJQUFJLE1BQU0sS0FBSyxrQkFBTSxDQUFDLENBQUMsQ0FBQztnQ0FLeEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsbUJBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDOzRCQUN6RSxDQUFDOzRCQUFDLElBQUksQ0FBQyxDQUFDO2dDQUNKLEVBQUUsQ0FBQyxDQUFDLE1BQU0sS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO29DQUN2QixNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBQyxNQUFNLEVBQUUsTUFBTSxFQUFDLENBQUMsQ0FBQztnQ0FDbEQsQ0FBQztnQ0FDRCxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxtQkFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUMsQ0FBQyxDQUFDOzRCQUNyRSxDQUFDO3dCQUNMLENBQUMsQ0FBQyxDQUFDO29CQUNQLENBQUM7Z0JBQ0wsQ0FBQztZQUNMLENBQUMsQ0FBQztRQUNOLENBQUM7S0FBQTtJQUVPLFFBQVEsQ0FBQyxVQUFvQyxFQUFFLFFBQWtDO1FBQ3JGLElBQUksU0FBUyxHQUFHLEVBQUMsTUFBTSxFQUFFLGVBQWUsRUFBRSxHQUFHLEVBQUUsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLEVBQUMsQ0FBQztRQUNoRSxFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQ2IsU0FBUyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDL0MsQ0FBQztRQUNELElBQUksT0FBTyxHQUFHLEVBQUMsTUFBTSxFQUFFLGVBQWUsRUFBRSxHQUFHLEVBQUUsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLEVBQUMsQ0FBQztRQUM5RCxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ1gsT0FBTyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDM0MsQ0FBQztRQUNELE1BQU0sQ0FBQyxFQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUMsQ0FBQztJQUNoQyxDQUFDO0lBRWEsUUFBUSxDQUFDLElBQXVCLEVBQUUsSUFBOEI7O1lBQzFFLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQztZQUN4QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDMUMsWUFBWSxHQUFHLFFBQVEsQ0FBQztZQUM1QixDQUFDO1lBQ0QsSUFBSSxHQUFHLEdBQUcsSUFBSSxrQkFBTyxFQUFFLENBQUM7WUFDeEIsR0FBRyxDQUFDLFVBQVUsR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsQ0FBQyxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUM7WUFDL0MsR0FBRyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNELEdBQUcsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUN2QixHQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDM0IsR0FBRyxDQUFDLE1BQU0sR0FBRyxZQUFZLElBQUksUUFBUSxDQUFDO1lBQ3RDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztZQUNyQixHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDckIsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDeEUsQ0FBQztLQUFBO0NBQ0osQ0FBQTtBQXpSRztJQURDLFlBQUcsQ0FBQyxlQUFlLENBQUM7SUFDRCxXQUFBLFlBQUcsRUFBRSxDQUFBO0lBQ0wsV0FBQSxZQUFHLEVBQUUsQ0FBQTtJQUNMLFdBQUEsY0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFBOzs7O2tEQThCeEM7QUFHRDtJQURDLGFBQUksQ0FBQyxlQUFlLENBQUM7SUFDRixXQUFBLFlBQUcsRUFBRSxDQUFBLEVBQU8sV0FBQSxhQUFJLEVBQUUsQ0FBQTs7NkNBQU8sNENBQW1COztrREE4Ri9EO0FBR0Q7SUFEQyxZQUFHLENBQUMsTUFBTSxDQUFDO0lBQ0csV0FBQSxZQUFHLEVBQUUsQ0FBQSxFQUFPLFdBQUEsWUFBRyxFQUFFLENBQUEsRUFBTyxXQUFBLGNBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQSxFQUF1QixXQUFBLGNBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQTtJQUN2RixXQUFBLGNBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFBOzs7OzZDQW1EdkM7QUFHRDtJQURDLGFBQUksQ0FBQyxRQUFRLENBQUM7SUFDRyxXQUFBLFlBQUcsRUFBRSxDQUFBLEVBQU8sV0FBQSxhQUFJLEVBQUUsQ0FBQTs7NkNBQU8sbUNBQWlCOztnREFpRTNEO0FBcFJRLGNBQWM7SUFGMUIsb0JBQVUsQ0FBQyxjQUFjLENBQUM7SUFDMUIsbUJBQVUsQ0FBQyxjQUFjLENBQUM7cUNBY1Msd0JBQVU7UUFDaEIsNkNBQW9CO1FBQ2pCLG1EQUF1QjtRQUN6QiwrQ0FBcUI7UUFDZiw0QkFBWTtRQUNmLHdCQUFhO1FBQ0csd0NBQXdCO0dBbkI3RCxjQUFjLENBaVQxQjtBQWpUWSx3Q0FBYyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7Qm9keSwgQ29udHJvbGxlciwgR2V0LCBIdHRwU3RhdHVzLCBQb3N0LCBRdWVyeSwgUmVxLCBSZXN9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcbmltcG9ydCB7QXBpVXNlVGFnc30gZnJvbSAnQG5lc3Rqcy9zd2FnZ2VyJztcbmltcG9ydCB7UG9zdFZlcmlmeU51bWJlckRUT30gZnJvbSAnLi4vLi4vc2hhcmVkL21vZGVscy9kdG8vcG9zdC52ZXJpZnkubnVtYmVyLmR0byc7XG5pbXBvcnQge0NvZGVRdWV1ZUxpc3RlbmVyU2VydmljZX0gZnJvbSAnLi4vLi4vLi4vc2VydmljZXMvY29kZV9zZW5kZXIvcXVldWUuc2VydmljZSc7XG5pbXBvcnQge0NsaWVudFNlcnZpY2V9IGZyb20gJy4uLy4uLy4uL2NvbmZpZy9zZXJ2aWNlcy9zZXJ2aWNlcyc7XG5pbXBvcnQge1RpbWVIZWxwZXJ9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL2hlbHBlcnMvdGltZS5oZWxwZXInO1xuaW1wb3J0IHtWYWxpZGF0b3J9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL2hlbHBlcnMvdmFsaWRhdGlvbi5oZWxwZXInO1xuaW1wb3J0IHtUZmFUcmFuc2FjdGlvbkZhbWlseX0gZnJvbSAnLi4vLi4vc2hhcmVkL2ZhbWlsaWVzL3RmYS50cmFuc2FjdGlvbi5mYW1pbHknO1xuaW1wb3J0IHtLYXp0ZWxUcmFuc2FjdGlvbkZhbWlseX0gZnJvbSAnLi4vLi4vc2hhcmVkL2ZhbWlsaWVzL2thenRlbC50cmFuc2FjdGlvbi5mYW1pbHknO1xuaW1wb3J0IHtDaGFpblNlcnZpY2V9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL3Nhd3Rvb3RoL2NoYWluLnNlcnZpY2UnO1xuaW1wb3J0IHtFZ292VHJhbnNhY3Rpb25GYW1pbHl9IGZyb20gJy4uLy4uL3NoYXJlZC9mYW1pbGllcy9lZ292LnRyYW5zYWN0aW9uLmZhbWlseSc7XG5pbXBvcnQge1VzZXJMb2d9IGZyb20gJy4uLy4uL3NoYXJlZC9tb2RlbHMvdXNlci5sb2cnO1xuaW1wb3J0IHtQb3N0VmVyaWZ5Q29kZURUT30gZnJvbSAnLi4vLi4vc2hhcmVkL21vZGVscy9kdG8vcG9zdC52ZXJpZnkuZHRvJztcbmltcG9ydCB7QXBpQ29udHJvbGxlcn0gZnJvbSAnLi9jb250cm9sbGVyJztcbmltcG9ydCB7UkVESVNfVVNFUl9QT1NURklYLCBSRURJU19VU0VSX1BVU0hfUkVTVUxUX1BPU1RGSVgsIFJFSkVDVCwgVkFMSUR9IGZyb20gJy4uLy4uLy4uL2NvbmZpZy9jb25zdGFudHMnO1xuaW1wb3J0IHtQb3N0Q2xpZW50VXNlckRUT30gZnJvbSAnLi4vLi4vc2hhcmVkL21vZGVscy9kdG8vcG9zdC5rYXp0ZWwudXNlci5kdG8nO1xuaW1wb3J0IHtnZW5Db2RlfSBmcm9tICcuLi8uLi8uLi9zZXJ2aWNlcy9oZWxwZXJzL2hlbHBlcnMnO1xuXG5jb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG5jb25zdCBwcm90b2J1ZkxpYiA9IHJlcXVpcmUoJ3Byb3RvY29sLWJ1ZmZlcnMnKTtcbmNvbnN0IG1lc3NhZ2VzU2VydmljZSA9IHByb3RvYnVmTGliKGZzLnJlYWRGaWxlU3luYygnc3JjL3Byb3RvL3NlcnZpY2UucHJvdG8nKSk7XG5jb25zdCBtZXNzYWdlc1NlcnZpY2VDbGllbnQgPSBwcm90b2J1ZkxpYihmcy5yZWFkRmlsZVN5bmMoJ3NyYy9wcm90by9zZXJ2aWNlX2NsaWVudC5wcm90bycpKTtcblxuQEFwaVVzZVRhZ3MoJ3YxL2FwaS91c2VycycpXG5AQ29udHJvbGxlcigndjEvYXBpL3VzZXJzJylcbmV4cG9ydCBjbGFzcyBVc2VyQ29udHJvbGxlciBleHRlbmRzIEFwaUNvbnRyb2xsZXIge1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBDYXJDb250cm9sbGVyLlxuICAgICAqIEBtZW1iZXJvZiBDYXJDb250cm9sbGVyXG4gICAgICogQHBhcmFtIHRpbWVIZWxwZXJcbiAgICAgKiBAcGFyYW0gdGZhVEZcbiAgICAgKiBAcGFyYW0ga2F6dGVsVEZcbiAgICAgKiBAcGFyYW0gZWdvdlRGXG4gICAgICogQHBhcmFtIGNoYWluU2VydmljZVxuICAgICAqIEBwYXJhbSBzZXJ2aWNlc1xuICAgICAqIEBwYXJhbSBjb2RlUXVldWVMaXN0ZW5lclNlcnZpY2VcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRpbWVIZWxwZXI6IFRpbWVIZWxwZXIsXG4gICAgICAgICAgICAgICAgcHVibGljIHRmYVRGOiBUZmFUcmFuc2FjdGlvbkZhbWlseSxcbiAgICAgICAgICAgICAgICBwdWJsaWMga2F6dGVsVEY6IEthenRlbFRyYW5zYWN0aW9uRmFtaWx5LFxuICAgICAgICAgICAgICAgIHB1YmxpYyBlZ292VEY6IEVnb3ZUcmFuc2FjdGlvbkZhbWlseSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgY2hhaW5TZXJ2aWNlOiBDaGFpblNlcnZpY2UsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBzZXJ2aWNlczogQ2xpZW50U2VydmljZSxcbiAgICAgICAgICAgICAgICBwcml2YXRlIGNvZGVRdWV1ZUxpc3RlbmVyU2VydmljZTogQ29kZVF1ZXVlTGlzdGVuZXJTZXJ2aWNlKSB7XG4gICAgICAgIHN1cGVyKHRmYVRGLCBrYXp0ZWxURiwgZWdvdlRGKTtcbiAgICB9XG5cbiAgICBAR2V0KCd2ZXJpZnktbnVtYmVyJylcbiAgICBhc3luYyBzZW5kVXNlckNvZGUoQFJlcSgpIHJlcSxcbiAgICAgICAgICAgICAgICAgICAgICAgQFJlcygpIHJlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgQFF1ZXJ5KCdwaG9uZV9udW1iZXInKSBwaG9uZU51bWJlcjogc3RyaW5nKTogUHJvbWlzZTxhbnlbXT4ge1xuXG4gICAgICAgIGxldCB2ID0gbmV3IFZhbGlkYXRvcih7cGhvbmVfbnVtYmVyOiBwaG9uZU51bWJlcn0sIHtwaG9uZV9udW1iZXI6ICdyZXF1aXJlZHxzdHJpbmd8cmVnZXg6L15cXFxcKz9bMS05XVxcXFxkezEsMTR9JC8nLH0pO1xuICAgICAgICBpZiAodi5mYWlscygpKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHYuZ2V0RXJyb3JzKCkpO1xuICAgICAgICB9XG4gICAgICAgIGxldCB1c2VyID0gYXdhaXQgdGhpcy5nZXRVc2VyKHBob25lTnVtYmVyLCAndGZhJyk7XG4gICAgICAgIGlmICh1c2VyID09PSBudWxsKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygndXNlciBub3QgZm91bmQhISEhIScpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5OT1RfRk9VTkQpLmpzb24oe3VzZXI6IFt0aGlzLmdldFVzZXJOb3RGb3VuZE1lc3NhZ2UocmVxLnF1ZXJ5LmxhbmcgfHwgJ2VuJyldfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29kZSA9IGdlbkNvZGUoKTtcbiAgICAgICAgY29uc29sZS5sb2coJ2NvZGUnLCBjb2RlKTtcblxuICAgICAgICBpZiAocGhvbmVOdW1iZXIuY2hhckF0KDApID09PSAnKycpIHtcbiAgICAgICAgICAgIHBob25lTnVtYmVyID0gcGhvbmVOdW1iZXIuc3Vic3RyaW5nKDEpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBzZWxmID0gdGhpcztcbiAgICAgICAgLy8gc2F2ZSBjb2RlIHRvIHJlZGlzXG4gICAgICAgIC8vIHRoaXMga2V5IHdpbGwgZXhwaXJlIGFmdGVyIDggKiA2MCBzZWNvbmRzXG4gICAgICAgIHRoaXMucmVkaXNDbGllbnQuc2V0QXN5bmMoYCR7cGhvbmVOdW1iZXJ9OiR7UkVESVNfVVNFUl9QT1NURklYfWAsIGAke2NvZGV9YCwgJ0VYJywgNyAqIDYwKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vIHNlbmQgc21zXG4gICAgICAgICAgICBzZWxmLmNvZGVRdWV1ZUxpc3RlbmVyU2VydmljZS5xdWV1ZVNNUy5hZGQoe1xuICAgICAgICAgICAgICAgIHBob25lX251bWJlcjogcGhvbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgc2VydmljZTogJ2thenRlbCcsXG4gICAgICAgICAgICAgICAgY29kZTogY29kZSxcbiAgICAgICAgICAgICAgICByZWdpc3RyYXRpb246IHRydWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuT0spLmpzb24oe3N0YXR1czogJ3N1Y2Nlc3MnfSk7XG4gICAgfVxuXG4gICAgQFBvc3QoJ3ZlcmlmeS1udW1iZXInKVxuICAgIGFzeW5jIHZlcmlmeU51bWJlcihAUmVzKCkgcmVzLCBAQm9keSgpIGJvZHk6IFBvc3RWZXJpZnlOdW1iZXJEVE8pOiBQcm9taXNlPGFueVtdPiB7XG5cbiAgICAgICAgLy8g0LLQsNC70LjQtNCw0YbQuNGPXG4gICAgICAgIGxldCB2ID0gbmV3IFZhbGlkYXRvcihib2R5LCB7XG4gICAgICAgICAgICBwaG9uZV9udW1iZXI6ICdyZXF1aXJlZHxzdHJpbmd8cmVnZXg6L15cXFxcKz9bMS05XVxcXFxkezEsMTR9JC8nLFxuICAgICAgICAgICAgcHVzaF90b2tlbjogJ251bGxhYmxlfHN0cmluZycsXG4gICAgICAgICAgICBjb2RlOiAncmVxdWlyZWR8bnVtYmVyJyxcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgJ3NlcnZpY2UucmVxdWlyZWRJZk5vdCc6IGBUaGUgc2VydmljZSBmaWVsZCBpcyByZXF1aXJlZCB3aGVuIHB1c2hfdG9rZW4gaXMgZW1wdHkuYFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHYuZmFpbHMoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih2LmdldEVycm9ycygpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyDRg9Cx0YDQsNGC0Ywg0L/Qu9GO0YEg0LIg0L3QsNGH0LDQu9C1INC90L7QvNC10YDQsCDRgtC10LvQtdGE0L7QvdCwINC10YHQu9C4INC+0L0g0LXRgdGC0YxcbiAgICAgICAgaWYgKGJvZHkucGhvbmVfbnVtYmVyLmNoYXJBdCgwKSA9PT0gJysnKSB7XG4gICAgICAgICAgICBib2R5LnBob25lX251bWJlciA9IGJvZHkucGhvbmVfbnVtYmVyLnN1YnN0cmluZygxKTtcbiAgICAgICAgfVxuICAgICAgICAvLyDQn9GA0L7QstC10YDQutCwLCDRgdGD0YnQtdGB0YLQstGD0LXRgiDQu9C4INC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjFxuICAgICAgICBsZXQgdXNlciA9IGF3YWl0IHRoaXMuZ2V0VXNlcihib2R5LnBob25lX251bWJlciwgJ3RmYScpO1xuICAgICAgICBpZiAodXNlciA9PT0gbnVsbCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ3VzZXIgbm90IGZvdW5kISEhISEnKTtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuTk9UX0ZPVU5EKS5qc29uKHt1c2VyOiBbdGhpcy5nZXRVc2VyTm90Rm91bmRNZXNzYWdlKGJvZHkubGFuZyB8fCAnZW4nKV19KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZWRpc0tleSA9IGAke2JvZHkucGhvbmVfbnVtYmVyfToke1JFRElTX1VTRVJfUE9TVEZJWH1gO1xuICAgICAgICAvLyDQv9GA0L7QstC10YDQutCwINC60L7QtNCwXG4gICAgICAgIGNvbnN0IGNvZGVGcm9tUmVkaXMgPSBhd2FpdCB0aGlzLnJlZGlzQ2xpZW50LmdldEFzeW5jKHJlZGlzS2V5KTtcbiAgICAgICAgaWYgKGNvZGVGcm9tUmVkaXMgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih7XG4gICAgICAgICAgICAgICAgY29kZTogW2JvZHkubGFuZyA9PT0gJ3J1JyA/ICfQmtC+0LTQsCDQu9C40LHQviDQvdC10YLRgyDQu9C40LHQviDQtdCz0L4g0YHRgNC+0Log0LjRgdGC0ZHQuicgOiBcIlRoZSAnQ29kZScgZXhwaXJlcyBvciBkb2VzIG5vdCBleGlzdHMuXCJdXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGFyc2VJbnQoY29kZUZyb21SZWRpcywgMTApICE9IHBhcnNlSW50KGJvZHkuY29kZSwgMTApKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHtcbiAgICAgICAgICAgICAgICBjb2RlOiBbYm9keS5sYW5nID09PSAncnUnID8gJ9CS0Ysg0LLQstC10LvQuCDQvdC10LLQtdGA0L3Ri9C5INC60L7QtCcgOiBcIlRoZSAnQ29kZScgaXMgbm90IHZhbGlkLlwiXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGhpcy5yZWRpc0NsaWVudC5kZWwocmVkaXNLZXkpO1xuXG4gICAgICAgIC8vINC/0L7QtNCz0L7RgtC+0LLQutCwINCw0LTRgNC10YHQvtCyLCDQt9CwINC60L7RgtC+0YDRi9C80Lgg0L3Rg9C20L3QviDQvtGC0YHQu9C10LTQuNGC0Ywg0YPRgdC/0LXRiNC90L7QtSDQv9GA0L7RhdC+0LbQtNC10L3QuNC1INGC0YDQsNC90LfQsNC60YbQuNC4XG4gICAgICAgIGxldCB1c2VyS2F6dGVsID0gYXdhaXQgdGhpcy5nZXRVc2VyKHVzZXIuUGhvbmVOdW1iZXIsICdrYXp0ZWwnKTtcbiAgICAgICAgbGV0IHVzZXJFZ292ID0gYXdhaXQgdGhpcy5nZXRVc2VyKHVzZXIuUGhvbmVOdW1iZXIsICdlZ292Jyk7XG4gICAgICAgIGxldCBhZGRyZXNzZXMgPSBbXG4gICAgICAgICAgICB0aGlzLmNoYWluU2VydmljZS5nZXRBZGRyZXNzKHVzZXIuUGhvbmVOdW1iZXIsICd0ZmEnKSxcbiAgICAgICAgXTtcbiAgICAgICAgaWYgKHVzZXJLYXp0ZWwgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGFkZHJlc3Nlcy5wdXNoKHRoaXMuY2hhaW5TZXJ2aWNlLmdldEFkZHJlc3ModXNlci5QaG9uZU51bWJlciwgJ2thenRlbCcpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodXNlckVnb3YgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGFkZHJlc3Nlcy5wdXNoKHRoaXMuY2hhaW5TZXJ2aWNlLmdldEFkZHJlc3ModXNlci5QaG9uZU51bWJlciwgJ2Vnb3YnKSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8g0L3QsNGH0LjQvdCw0LXQvCDRgdC70YPRiNCw0YLRjCDQuNC30LzQtdC90LXQvdC40Y8g0LDQtNGA0LXRgdC+0LJcbiAgICAgICAgbGV0IHdzID0gdGhpcy5vcGVuV3NDb25uZWN0aW9uKGFkZHJlc3Nlcyk7XG5cbiAgICAgICAgdXNlci5Jc1ZlcmlmaWVkID0gdHJ1ZTtcbiAgICAgICAgdXNlci5QdXNoVG9rZW4gPSBib2R5LnB1c2hfdG9rZW47XG4gICAgICAgIGF3YWl0IHRoaXMudGZhVEYudXBkYXRlVXNlcih1c2VyLlBob25lTnVtYmVyLCB1c2VyKTtcblxuICAgICAgICBpZiAodXNlckthenRlbCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdXNlckthenRlbC5Jc1ZlcmlmaWVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMua2F6dGVsVEYudXBkYXRlVXNlcih1c2VyLlBob25lTnVtYmVyLCB1c2VyS2F6dGVsKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodXNlckVnb3YgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHVzZXJLYXp0ZWwuSXNWZXJpZmllZCA9IHRydWU7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmVnb3ZURi51cGRhdGVVc2VyKHVzZXIuUGhvbmVOdW1iZXIsIHVzZXJFZ292KTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcmVzcG9uc2VTZW5kID0gZmFsc2U7XG4gICAgICAgIHdzLm9ubWVzc2FnZSA9IG1lc3MgPT4ge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UobWVzcy5kYXRhKTtcbiAgICAgICAgICAgIGZvciAobGV0IHN0YXRlQ2hhbmdlIG9mIGRhdGEuc3RhdGVfY2hhbmdlcyl7XG4gICAgICAgICAgICAgICAgaWYgKGFkZHJlc3Nlcy5pbmRleE9mKHN0YXRlQ2hhbmdlLmFkZHJlc3MpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBfdXNlciA9IG1lc3NhZ2VzU2VydmljZS5Vc2VyLmRlY29kZShuZXcgQnVmZmVyKHN0YXRlQ2hhbmdlLnZhbHVlLCAnYmFzZTY0JykpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2VTZW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnYWN0aW9uJzogJ3Vuc3Vic2NyaWJlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gdG9kbzog0L/QviDRhdC+0YDQvtGI0LXQvNGDINC90LDQtNC+INCy0L4g0LLRgdC10YUg0YfQtdC50L3QsNGFINC+0YLRgdC70LXQtNC40YLRjCDQuNC30LzQtdC90LXQvdC40Y9cbiAgICAgICAgICAgICAgICAgICAgaWYgKF91c2VyLklzVmVyaWZpZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VTZW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk9LKS5qc29uKHtzdGF0dXM6ICdzdWNjZXNzJ30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdlcnJvciAtIHRyeWluZyB0byBzZW5kIHJlc3BvbnNlIHNlY29uZCB0aW1lJywgZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHdzLm9uY2xvc2UgPSAoKSA9PiB7XG4gICAgICAgICAgICB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICAnYWN0aW9uJzogJ3Vuc3Vic2NyaWJlJ1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIEBHZXQoJ2NvZGUnKVxuICAgIGFzeW5jIGdldENvZGUoQFJlcSgpIHJlcSwgQFJlcygpIHJlcywgQFF1ZXJ5KCdwaG9uZV9udW1iZXInKSBwaG9uZU51bWJlcjogc3RyaW5nLCBAUXVlcnkoJ3B1c2hfdG9rZW4nKSBwdXNoVG9rZW46IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgIEBRdWVyeSgnY2xpZW50X3RpbWVzdGFtcCcpIGNsaWVudFRpbWVzdGFtcDogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXEucXVlcnkuY2xpZW50X3RpbWVzdGFtcCA9IHBhcnNlSW50KHJlcS5xdWVyeS5jbGllbnRfdGltZXN0YW1wLCAxMCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdlJywgZSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHYgPSBuZXcgVmFsaWRhdG9yKHJlcS5xdWVyeSwge1xuICAgICAgICAgICAgcGhvbmVfbnVtYmVyOiAncmVxdWlyZWR8c3RyaW5nfHJlZ2V4Oi9eXFxcXCs/WzEtOV1cXFxcZHsxLDE0fSQvJyxcbiAgICAgICAgICAgIHB1c2hfdG9rZW46ICdyZXF1aXJlZHxzdHJpbmcnLFxuICAgICAgICAgICAgY2xpZW50X3RpbWVzdGFtcDogJ3JlcXVpcmVkfG51bWJlcicsXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodi5mYWlscygpKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHYuZ2V0RXJyb3JzKCkpO1xuICAgICAgICB9XG4gICAgICAgIGxldCB0ZmFLYXp0ZWwgPSBhd2FpdCB0aGlzLmdldFVzZXIocGhvbmVOdW1iZXIsICd0ZmEnKTtcbiAgICAgICAgaWYgKCF0ZmFLYXp0ZWwpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuTk9UX0ZPVU5EKS5qc29uKHt1c2VyOiBbdGhpcy5nZXRVc2VyTm90Rm91bmRNZXNzYWdlKHJlcS5xdWVyeS5sYW5nIHx8ICdlbicpXX0pO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGZhS2F6dGVsLklzVmVyaWZpZWQgfHwgdGZhS2F6dGVsLlB1c2hUb2tlbiAhPT0gcHVzaFRva2VuKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk5PVF9GT1VORCkuanNvbih7dXNlcjogW3RoaXMuZ2V0VXNlck5vdEZvdW5kTWVzc2FnZShyZXEucXVlcnkubGFuZyB8fCAnZW4nKV19KTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdXNlckthenRlbCA9IGF3YWl0IHRoaXMuZ2V0VXNlcih0ZmFLYXp0ZWwuUGhvbmVOdW1iZXIsICdrYXp0ZWwnKTtcbiAgICAgICAgbGV0IHVzZXJFZ292ID0gYXdhaXQgdGhpcy5nZXRVc2VyKHRmYUthenRlbC5QaG9uZU51bWJlciwgJ2Vnb3YnKTtcbiAgICAgICAgaWYgKHVzZXJLYXp0ZWwgPT09IG51bGwgJiYgdXNlckVnb3YgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5OT1RfRk9VTkQpLmpzb24oe3VzZXI6IFt0aGlzLmdldFVzZXJOb3RGb3VuZE1lc3NhZ2UocmVxLnF1ZXJ5LmxhbmcgfHwgJ2VuJyldfSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHtsb2dLYXp0ZWwsIGxvZ0Vnb3Z9ID0gdGhpcy5pbml0TG9ncyh1c2VyS2F6dGVsLCB1c2VyRWdvdik7XG4gICAgICAgIGlmIChsb2dLYXp0ZWwuc3RhdHVzICE9PSAnc3VjY2VzcycgJiYgbG9nRWdvdi5zdGF0dXMgIT09ICdzdWNjZXNzJykge1xuICAgICAgICAgICAgc3dpdGNoIChsb2dLYXp0ZWwuc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnbm9fc2VuZF9jb2Rlcyc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFkpLmpzb24oe1xuICAgICAgICAgICAgICAgICAgICAgICAgdXNlcjogW3JlcS5xdWVyeS5sYW5nID09ICdydScgPyAn0J/QvtC70YzQt9C+0LLQsNGC0LXQu9GOINC10YnRkSDQvdC1INC+0YLQv9GA0LDQstC40LvQuCDQvdC4INC+0LTQvdC+0LPQviDQutC+0LTQsCDQv9C+0LTRgtCy0LXRgNC20LTQtdC90LjRjycgOiAnTm8gY29kZSBmb3IgdXNlciB5ZXQnXVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjYXNlICdub19jb2RlX3VzZWQnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmpzb24oe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXI6IFtyZXEucXVlcnkubGFuZyA9PSAncnUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gJ9Cf0L7Qu9GM0LfQvtCy0LDRgtC10LvRjiDQtdGJ0ZEg0L3QtSDQvtGC0L/RgNCw0LLQuNC70Lgg0L3QuCDQvtC00L3QvtCz0L4g0LrQvtC00LAg0L/QvtC00YLQstC10YDQttC00LXQvdC40Y8nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogJ05vIGNvZGUgZm9yIHVzZXIgeWV0J11cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFkpLmpzb24oe3VzZXI6IFsnRXJyb3IgZ2V0dGluZyBjb2RlJ119KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobG9nS2F6dGVsLnN0YXR1cyA9PT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk9LKS5qc29uKHRoaXMudHJhbnNmb3JtTG9nKGxvZ0thenRlbC5sb2csICdrYXp0ZWwnKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxvZ0Vnb3Yuc3RhdHVzID09PSAnc3VjY2VzcycpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuT0spLmpzb24odGhpcy50cmFuc2Zvcm1Mb2cobG9nRWdvdi5sb2csICdlZ292JykpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFkpLmpzb24oe3VzZXI6IFsnRXJyb3IgZ2V0dGluZyBjb2RlJ119KTtcbiAgICB9XG5cbiAgICBAUG9zdCgndmVyaWZ5JylcbiAgICBhc3luYyBwb3N0VmVyaWZ5KEBSZXMoKSByZXMsIEBCb2R5KCkgYm9keTogUG9zdFZlcmlmeUNvZGVEVE8pIHtcbiAgICAgICAgbGV0IHYgPSBuZXcgVmFsaWRhdG9yKGJvZHksIHtcbiAgICAgICAgICAgIGV2ZW50OiAncmVxdWlyZWR8c3RyaW5nJywgbGFuZzogJ3N0cmluZycsIGNvZGU6ICdyZXF1aXJlZHxudW1iZXInLCBzZXJ2aWNlOiAncmVxdWlyZWRJZk5vdDpwdXNoX3Rva2VufHN0cmluZ3xpbjprYXp0ZWwsZWdvdicsXG4gICAgICAgICAgICBwaG9uZV9udW1iZXI6ICdyZXF1aXJlZHxzdHJpbmd8cmVnZXg6L15cXFxcKz9bMS05XVxcXFxkezEsMTR9JC8nLCBlbWJlZGVkOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAvLyDQuNGB0L/QvtC70YzQt9GD0LXRgtGB0Y8g0YLQvtC70YzQutC+INC/0YDQuCDQvtGC0L/RgNCw0LLQutC1INC80L7QsdC40LvRjNC90YvQvCDQv9GA0LjQu9C+0LbQtdC90LjQtdC8IC0g0LTQu9GPINGD0YHRgtCw0L3QvtCy0LrQtSDRgdGC0LDRgtGD0YHQsCBSRUpFQ1RcbiAgICAgICAgICAgIHN0YXR1czogJ3N0cmluZycsIGNsaWVudF90aW1lc3RhbXA6ICdyZXF1aXJlZCcsIGNlcnQ6ICdudWxsYWJsZScsXG4gICAgICAgIH0sIHsnc2VydmljZS5pbic6IGBObyBzZXJ2aWNlIHdpdGggbmFtZTogJHtib2R5LnNlcnZpY2V9YH0pO1xuICAgICAgICBpZiAodi5mYWlscygpKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHYuZ2V0RXJyb3JzKCkpO1xuICAgICAgICB9XG4gICAgICAgIC8vINCf0YDQvtCy0LXRgNC60LAsINGB0YPRidC10YHRgtCy0YPQtdGCINC70Lgg0L/QvtC70YzQt9C+0LLQsNGC0LXQu9GMXG4gICAgICAgIGxldCB1c2VyID0gYXdhaXQgdGhpcy5nZXRVc2VyKGJvZHkucGhvbmVfbnVtYmVyLCBib2R5LnNlcnZpY2UpO1xuICAgICAgICBpZiAodXNlciA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5OT1RfRk9VTkQpLmpzb24oe1xuICAgICAgICAgICAgICAgIHVzZXI6IFt0aGlzLmdldFVzZXJOb3RGb3VuZE1lc3NhZ2UoYm9keS5sYW5nIHx8ICdlbicpXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8g0L3QsNGH0LjQvdCw0LXQvCDRgdC70YPRiNCw0YLRjCDQuNC30LzQtdC90LXQvdC40Y8g0LDQtNGA0LXRgdC+0LJcbiAgICAgICAgbGV0IGFkZHJlc3NlcyA9IFtcbiAgICAgICAgICAgIHRoaXMuY2hhaW5TZXJ2aWNlLmdldEFkZHJlc3ModXNlci5QaG9uZU51bWJlciwgYm9keS5zZXJ2aWNlKSxcbiAgICAgICAgXTtcbiAgICAgICAgbGV0IHdzID0gdGhpcy5vcGVuV3NDb25uZWN0aW9uKGFkZHJlc3Nlcyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnN0b3JlTG9nKGJvZHksIHVzZXIpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciB3aGlsZSBnZXR0aW5nIHVzZXJgLCBlKTtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuQkFEX0dBVEVXQVkpLmpzb24oe2Vycm9yOiAnRXJyb3IgY2hlY2tpbmcgY29kZS4nfSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgICAgICBsZXQgdGZhVXNlciA9IGF3YWl0IHRoaXMuZ2V0VXNlcihib2R5LnBob25lX251bWJlciwgJ3RmYScpO1xuICAgICAgICB3cy5vbm1lc3NhZ2UgPSBtZXNzID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKG1lc3MuZGF0YSk7XG4gICAgICAgICAgICBsZXQgcmVzcG9uc2VTZW5kID0gZmFsc2U7XG4gICAgICAgICAgICBmb3IgKGxldCBzdGF0ZUNoYW5nZSBvZiBkYXRhLnN0YXRlX2NoYW5nZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2VTZW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoeydhY3Rpb24nOiAndW5zdWJzY3JpYmUnfSkpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGFkZHJlc3Nlcy5pbmRleE9mKHN0YXRlQ2hhbmdlLmFkZHJlc3MpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBfdXNlciA9IG1lc3NhZ2VzU2VydmljZUNsaWVudC5Vc2VyLmRlY29kZShuZXcgQnVmZmVyKHN0YXRlQ2hhbmdlLnZhbHVlLCAnYmFzZTY0JykpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoX3VzZXIuTG9ncy5sZW5ndGggPT09IHVzZXIuTG9ncy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdfdXNlci5Mb2dzJywgX3VzZXIuTG9ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZVNlbmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHsnYWN0aW9uJzogJ3Vuc3Vic2NyaWJlJ30pKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhdHVzID0gX3VzZXIuTG9nc1tfdXNlci5Mb2dzLmxlbmd0aCAtIDFdLlN0YXR1cztcbiAgICAgICAgICAgICAgICAgICAgLy8gc2FmZSBpbiByZWRpcyBpbmZvcm1hdGlvbiB0aGF0IHBob25lIGlzIHZhbGlkXG4gICAgICAgICAgICAgICAgICAgIHNlbGYucmVkaXNDbGllbnQuc2V0QXN5bmMoYCR7dGZhVXNlci5QaG9uZU51bWJlcn06JHtSRURJU19VU0VSX1BVU0hfUkVTVUxUX1BPU1RGSVh9YCwgc3RhdHVzLCAnRVgnLCAxNSAqIDYwKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGF0dXMgPT09IFZBTElEIHx8IHN0YXR1cyA9PT0gUkVKRUNUKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2VuZCB1c2VyIHRvIGNsaWVudC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0b2RvINC+0YLRgNCw0LHQvtGC0LDRgtGMINCyINC80L7QvNC90LXRgiDQuNC90YLQtdCz0YDQsNGG0LjQuFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRvZG8gbWFrZSByZXF1ZXN0IHRvIHJlZGlyZXN0IHVybCB3aXRoIHVzZXIgZGF0YVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlc3BvbmRlIHRvIHRoZSB2aWV3XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5PSykuanNvbih7c3RhdHVzOiBzdGF0dXMsIHVzZXI6IF91c2VyfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGF0dXMgPT09ICdFWFBJUkVEJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0NDApLmpzb24oe3N0YXR1czogc3RhdHVzfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuQkFEX1JFUVVFU1QpLmpzb24oe3N0YXR1czogc3RhdHVzfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGluaXRMb2dzKHVzZXJLYXp0ZWw6IFBvc3RDbGllbnRVc2VyRFRPIHwgbnVsbCwgdXNlckVnb3Y6IFBvc3RDbGllbnRVc2VyRFRPIHwgbnVsbCkge1xuICAgICAgICBsZXQgbG9nS2F6dGVsID0ge3N0YXR1czogJ25vX3NlbmRfY29kZXMnLCBsb2c6IHtTZXJ2aWNlOiBudWxsfX07XG4gICAgICAgIGlmICh1c2VyS2F6dGVsKSB7XG4gICAgICAgICAgICBsb2dLYXp0ZWwgPSB0aGlzLmdldExhdGVzdENvZGUodXNlckthenRlbCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGxvZ0Vnb3YgPSB7c3RhdHVzOiAnbm9fc2VuZF9jb2RlcycsIGxvZzoge1NlcnZpY2U6IG51bGx9fTtcbiAgICAgICAgaWYgKHVzZXJFZ292KSB7XG4gICAgICAgICAgICBsb2dFZ292ID0gdGhpcy5nZXRMYXRlc3RDb2RlKHVzZXJFZ292KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge2xvZ0thenRlbCwgbG9nRWdvdn07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBzdG9yZUxvZyhib2R5OiBQb3N0VmVyaWZ5Q29kZURUTywgdXNlcjogUG9zdENsaWVudFVzZXJEVE8gfCBudWxsKSB7XG4gICAgICAgIGxldCByZWplY3RTdGF0dXMgPSBudWxsO1xuICAgICAgICBpZiAoYm9keS5zdGF0dXMgJiYgYm9keS5zdGF0dXMgPT09ICdSRUpFQ1QnKSB7XG4gICAgICAgICAgICByZWplY3RTdGF0dXMgPSAnUkVKRUNUJztcbiAgICAgICAgfVxuICAgICAgICBsZXQgbG9nID0gbmV3IFVzZXJMb2coKTtcbiAgICAgICAgbG9nLkFjdGlvblRpbWUgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpIC8gMTAwMDtcbiAgICAgICAgbG9nLkV4cGlyZWRBdCA9IHRoaXMudGltZUhlbHBlci5nZXRVbml4VGltZUFmdGVyTWludXRlcygxKTtcbiAgICAgICAgbG9nLkV2ZW50ID0gYm9keS5ldmVudDtcbiAgICAgICAgbG9nLkVtYmVkZWQgPSBib2R5LmVtYmVkZWQ7XG4gICAgICAgIGxvZy5TdGF0dXMgPSByZWplY3RTdGF0dXMgfHwgJ1ZFUklGWSc7XG4gICAgICAgIGxvZy5Db2RlID0gYm9keS5jb2RlO1xuICAgICAgICBsb2cuQ2VydCA9IGJvZHkuY2VydDtcbiAgICAgICAgYXdhaXQgdGhpcy5jaGFpblNlcnZpY2UudmVyaWZ5KHVzZXIuUGhvbmVOdW1iZXIsIGxvZywgYm9keS5zZXJ2aWNlKTtcbiAgICB9XG59Il19