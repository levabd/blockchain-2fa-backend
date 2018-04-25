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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvY29udHJvbGxzZXJzL3VzZXIuY29udHJvbGxlci50cyIsInNvdXJjZXMiOlsiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvY29udHJvbGxzZXJzL3VzZXIuY29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkNBQXdGO0FBQ3hGLDZDQUEyQztBQUMzQywyRkFBbUY7QUFDbkYsK0VBQXFGO0FBQ3JGLGdFQUFnRTtBQUNoRSx1RUFBaUU7QUFDakUsbUZBQXNFO0FBQ3RFLHlGQUFrRjtBQUNsRiwrRkFBd0Y7QUFDeEYsNEVBQXNFO0FBQ3RFLDJGQUFvRjtBQUNwRiwyREFBcUQ7QUFDckQsNkVBQTBFO0FBQzFFLDZDQUEyQztBQUMzQyx5REFBNEc7QUFFNUcsK0RBQTBEO0FBRTFELE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN6QixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUNoRCxNQUFNLGVBQWUsR0FBRyxXQUFXLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUM7QUFDaEYsTUFBTSxxQkFBcUIsR0FBRyxXQUFXLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUM7QUFJN0YsSUFBYSxjQUFjLEdBQTNCLG9CQUE0QixTQUFRLDBCQUFhO0lBYTdDLFlBQW9CLFVBQXNCLEVBQ3ZCLEtBQTJCLEVBQzNCLFFBQWlDLEVBQ2pDLE1BQTZCLEVBQzdCLFlBQTBCLEVBQ3pCLFFBQXVCLEVBQ3ZCLHdCQUFrRDtRQUNsRSxLQUFLLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxNQUFNLENB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LENBQUM7UUFDeEUsQ0FBQztLQUFBO0NBQ0osQ0FBQTtBQXZSRztJQURDLFlBQUcsQ0FBQyxlQUFlLENBQUM7SUFDRCxXQUFBLFlBQUcsRUFBRSxDQUFBO0lBQ0wsV0FBQSxZQUFHLEVBQUUsQ0FBQTtJQUNMLFdBQUEsY0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFBOzs7O2tEQTRCeEM7QUFHRDtJQURDLGFBQUksQ0FBQyxlQUFlLENBQUM7SUFDRixXQUFBLFlBQUcsRUFBRSxDQUFBLEVBQU8sV0FBQSxhQUFJLEVBQUUsQ0FBQTs7NkNBQU8sNENBQW1COztrREE4Ri9EO0FBR0Q7SUFEQyxZQUFHLENBQUMsTUFBTSxDQUFDO0lBQ0csV0FBQSxZQUFHLEVBQUUsQ0FBQSxFQUFPLFdBQUEsWUFBRyxFQUFFLENBQUEsRUFBTyxXQUFBLGNBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQSxFQUF1QixXQUFBLGNBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQTtJQUN2RixXQUFBLGNBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFBOzs7OzZDQW1EdkM7QUFHRDtJQURDLGFBQUksQ0FBQyxRQUFRLENBQUM7SUFDRyxXQUFBLFlBQUcsRUFBRSxDQUFBLEVBQU8sV0FBQSxhQUFJLEVBQUUsQ0FBQTs7NkNBQU8sbUNBQWlCOztnREFpRTNEO0FBbFJRLGNBQWM7SUFGMUIsb0JBQVUsQ0FBQyxjQUFjLENBQUM7SUFDMUIsbUJBQVUsQ0FBQyxjQUFjLENBQUM7cUNBY1Msd0JBQVU7UUFDaEIsNkNBQW9CO1FBQ2pCLG1EQUF1QjtRQUN6QiwrQ0FBcUI7UUFDZiw0QkFBWTtRQUNmLHdCQUFhO1FBQ0csd0NBQXdCO0dBbkI3RCxjQUFjLENBK1MxQjtBQS9TWSx3Q0FBYyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7Qm9keSwgQ29udHJvbGxlciwgR2V0LCBIdHRwU3RhdHVzLCBQb3N0LCBRdWVyeSwgUmVxLCBSZXN9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcbmltcG9ydCB7QXBpVXNlVGFnc30gZnJvbSAnQG5lc3Rqcy9zd2FnZ2VyJztcbmltcG9ydCB7UG9zdFZlcmlmeU51bWJlckRUT30gZnJvbSAnLi4vLi4vc2hhcmVkL21vZGVscy9kdG8vcG9zdC52ZXJpZnkubnVtYmVyLmR0byc7XG5pbXBvcnQge0NvZGVRdWV1ZUxpc3RlbmVyU2VydmljZX0gZnJvbSAnLi4vLi4vLi4vc2VydmljZXMvY29kZV9zZW5kZXIvcXVldWUuc2VydmljZSc7XG5pbXBvcnQge0NsaWVudFNlcnZpY2V9IGZyb20gJy4uLy4uLy4uL2NvbmZpZy9zZXJ2aWNlcy9zZXJ2aWNlcyc7XG5pbXBvcnQge1RpbWVIZWxwZXJ9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL2hlbHBlcnMvdGltZS5oZWxwZXInO1xuaW1wb3J0IHtWYWxpZGF0b3J9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL2hlbHBlcnMvdmFsaWRhdGlvbi5oZWxwZXInO1xuaW1wb3J0IHtUZmFUcmFuc2FjdGlvbkZhbWlseX0gZnJvbSAnLi4vLi4vc2hhcmVkL2ZhbWlsaWVzL3RmYS50cmFuc2FjdGlvbi5mYW1pbHknO1xuaW1wb3J0IHtLYXp0ZWxUcmFuc2FjdGlvbkZhbWlseX0gZnJvbSAnLi4vLi4vc2hhcmVkL2ZhbWlsaWVzL2thenRlbC50cmFuc2FjdGlvbi5mYW1pbHknO1xuaW1wb3J0IHtDaGFpblNlcnZpY2V9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL3Nhd3Rvb3RoL2NoYWluLnNlcnZpY2UnO1xuaW1wb3J0IHtFZ292VHJhbnNhY3Rpb25GYW1pbHl9IGZyb20gJy4uLy4uL3NoYXJlZC9mYW1pbGllcy9lZ292LnRyYW5zYWN0aW9uLmZhbWlseSc7XG5pbXBvcnQge1VzZXJMb2d9IGZyb20gJy4uLy4uL3NoYXJlZC9tb2RlbHMvdXNlci5sb2cnO1xuaW1wb3J0IHtQb3N0VmVyaWZ5Q29kZURUT30gZnJvbSAnLi4vLi4vc2hhcmVkL21vZGVscy9kdG8vcG9zdC52ZXJpZnkuZHRvJztcbmltcG9ydCB7QXBpQ29udHJvbGxlcn0gZnJvbSAnLi9jb250cm9sbGVyJztcbmltcG9ydCB7UkVESVNfVVNFUl9QT1NURklYLCBSRURJU19VU0VSX1BVU0hfUkVTVUxUX1BPU1RGSVgsIFJFSkVDVCwgVkFMSUR9IGZyb20gJy4uLy4uLy4uL2NvbmZpZy9jb25zdGFudHMnO1xuaW1wb3J0IHtQb3N0Q2xpZW50VXNlckRUT30gZnJvbSAnLi4vLi4vc2hhcmVkL21vZGVscy9kdG8vcG9zdC5rYXp0ZWwudXNlci5kdG8nO1xuaW1wb3J0IHtnZW5Db2RlfSBmcm9tICcuLi8uLi8uLi9zZXJ2aWNlcy9oZWxwZXJzL2hlbHBlcnMnO1xuXG5jb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG5jb25zdCBwcm90b2J1ZkxpYiA9IHJlcXVpcmUoJ3Byb3RvY29sLWJ1ZmZlcnMnKTtcbmNvbnN0IG1lc3NhZ2VzU2VydmljZSA9IHByb3RvYnVmTGliKGZzLnJlYWRGaWxlU3luYygnc3JjL3Byb3RvL3NlcnZpY2UucHJvdG8nKSk7XG5jb25zdCBtZXNzYWdlc1NlcnZpY2VDbGllbnQgPSBwcm90b2J1ZkxpYihmcy5yZWFkRmlsZVN5bmMoJ3NyYy9wcm90by9zZXJ2aWNlX2NsaWVudC5wcm90bycpKTtcblxuQEFwaVVzZVRhZ3MoJ3YxL2FwaS91c2VycycpXG5AQ29udHJvbGxlcigndjEvYXBpL3VzZXJzJylcbmV4cG9ydCBjbGFzcyBVc2VyQ29udHJvbGxlciBleHRlbmRzIEFwaUNvbnRyb2xsZXIge1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBDYXJDb250cm9sbGVyLlxuICAgICAqIEBtZW1iZXJvZiBDYXJDb250cm9sbGVyXG4gICAgICogQHBhcmFtIHRpbWVIZWxwZXJcbiAgICAgKiBAcGFyYW0gdGZhVEZcbiAgICAgKiBAcGFyYW0ga2F6dGVsVEZcbiAgICAgKiBAcGFyYW0gZWdvdlRGXG4gICAgICogQHBhcmFtIGNoYWluU2VydmljZVxuICAgICAqIEBwYXJhbSBzZXJ2aWNlc1xuICAgICAqIEBwYXJhbSBjb2RlUXVldWVMaXN0ZW5lclNlcnZpY2VcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRpbWVIZWxwZXI6IFRpbWVIZWxwZXIsXG4gICAgICAgICAgICAgICAgcHVibGljIHRmYVRGOiBUZmFUcmFuc2FjdGlvbkZhbWlseSxcbiAgICAgICAgICAgICAgICBwdWJsaWMga2F6dGVsVEY6IEthenRlbFRyYW5zYWN0aW9uRmFtaWx5LFxuICAgICAgICAgICAgICAgIHB1YmxpYyBlZ292VEY6IEVnb3ZUcmFuc2FjdGlvbkZhbWlseSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgY2hhaW5TZXJ2aWNlOiBDaGFpblNlcnZpY2UsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBzZXJ2aWNlczogQ2xpZW50U2VydmljZSxcbiAgICAgICAgICAgICAgICBwcml2YXRlIGNvZGVRdWV1ZUxpc3RlbmVyU2VydmljZTogQ29kZVF1ZXVlTGlzdGVuZXJTZXJ2aWNlKSB7XG4gICAgICAgIHN1cGVyKHRmYVRGLCBrYXp0ZWxURiwgZWdvdlRGKTtcbiAgICB9XG5cbiAgICBAR2V0KCd2ZXJpZnktbnVtYmVyJylcbiAgICBhc3luYyBzZW5kVXNlckNvZGUoQFJlcSgpIHJlcSxcbiAgICAgICAgICAgICAgICAgICAgICAgQFJlcygpIHJlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgQFF1ZXJ5KCdwaG9uZV9udW1iZXInKSBwaG9uZU51bWJlcjogc3RyaW5nKTogUHJvbWlzZTxhbnlbXT4ge1xuXG4gICAgICAgIGxldCB2ID0gbmV3IFZhbGlkYXRvcih7cGhvbmVfbnVtYmVyOiBwaG9uZU51bWJlcn0sIHtwaG9uZV9udW1iZXI6ICdyZXF1aXJlZHxzdHJpbmd8cmVnZXg6L15cXFxcKz9bMS05XVxcXFxkezEsMTR9JC8nLH0pO1xuICAgICAgICBpZiAodi5mYWlscygpKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHYuZ2V0RXJyb3JzKCkpO1xuICAgICAgICB9XG4gICAgICAgIGxldCB1c2VyID0gYXdhaXQgdGhpcy5nZXRVc2VyKHBob25lTnVtYmVyLCAndGZhJyk7XG4gICAgICAgIGlmICh1c2VyID09PSBudWxsKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygndXNlciBub3QgZm91bmQhISEhIScpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5OT1RfRk9VTkQpLmpzb24oe3VzZXI6IFt0aGlzLmdldFVzZXJOb3RGb3VuZE1lc3NhZ2UocmVxLnF1ZXJ5LmxhbmcgfHwgJ2VuJyldfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29kZSA9IGdlbkNvZGUoKTtcbiAgICAgICAgaWYgKHBob25lTnVtYmVyLmNoYXJBdCgwKSA9PT0gJysnKSB7XG4gICAgICAgICAgICBwaG9uZU51bWJlciA9IHBob25lTnVtYmVyLnN1YnN0cmluZygxKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgICAgIC8vIHNhdmUgY29kZSB0byByZWRpc1xuICAgICAgICAvLyB0aGlzIGtleSB3aWxsIGV4cGlyZSBhZnRlciA4ICogNjAgc2Vjb25kc1xuICAgICAgICB0aGlzLnJlZGlzQ2xpZW50LnNldEFzeW5jKGAke3Bob25lTnVtYmVyfToke1JFRElTX1VTRVJfUE9TVEZJWH1gLCBgJHtjb2RlfWAsICdFWCcsIDcgKiA2MCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvLyBzZW5kIHNtc1xuICAgICAgICAgICAgc2VsZi5jb2RlUXVldWVMaXN0ZW5lclNlcnZpY2UucXVldWVTTVMuYWRkKHtcbiAgICAgICAgICAgICAgICBwaG9uZV9udW1iZXI6IHBob25lTnVtYmVyLFxuICAgICAgICAgICAgICAgIHNlcnZpY2U6ICdrYXp0ZWwnLFxuICAgICAgICAgICAgICAgIGNvZGU6IGNvZGUsXG4gICAgICAgICAgICAgICAgcmVnaXN0cmF0aW9uOiB0cnVlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk9LKS5qc29uKHtzdGF0dXM6ICdzdWNjZXNzJ30pO1xuICAgIH1cblxuICAgIEBQb3N0KCd2ZXJpZnktbnVtYmVyJylcbiAgICBhc3luYyB2ZXJpZnlOdW1iZXIoQFJlcygpIHJlcywgQEJvZHkoKSBib2R5OiBQb3N0VmVyaWZ5TnVtYmVyRFRPKTogUHJvbWlzZTxhbnlbXT4ge1xuXG4gICAgICAgIC8vINCy0LDQu9C40LTQsNGG0LjRj1xuICAgICAgICBsZXQgdiA9IG5ldyBWYWxpZGF0b3IoYm9keSwge1xuICAgICAgICAgICAgcGhvbmVfbnVtYmVyOiAncmVxdWlyZWR8c3RyaW5nfHJlZ2V4Oi9eXFxcXCs/WzEtOV1cXFxcZHsxLDE0fSQvJyxcbiAgICAgICAgICAgIHB1c2hfdG9rZW46ICdudWxsYWJsZXxzdHJpbmcnLFxuICAgICAgICAgICAgY29kZTogJ3JlcXVpcmVkfG51bWJlcicsXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgICdzZXJ2aWNlLnJlcXVpcmVkSWZOb3QnOiBgVGhlIHNlcnZpY2UgZmllbGQgaXMgcmVxdWlyZWQgd2hlbiBwdXNoX3Rva2VuIGlzIGVtcHR5LmBcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh2LmZhaWxzKCkpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFkpLmpzb24odi5nZXRFcnJvcnMoKSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8g0YPQsdGA0LDRgtGMINC/0LvRjtGBINCyINC90LDRh9Cw0LvQtSDQvdC+0LzQtdGA0LAg0YLQtdC70LXRhNC+0L3QsCDQtdGB0LvQuCDQvtC9INC10YHRgtGMXG4gICAgICAgIGlmIChib2R5LnBob25lX251bWJlci5jaGFyQXQoMCkgPT09ICcrJykge1xuICAgICAgICAgICAgYm9keS5waG9uZV9udW1iZXIgPSBib2R5LnBob25lX251bWJlci5zdWJzdHJpbmcoMSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8g0J/RgNC+0LLQtdGA0LrQsCwg0YHRg9GJ0LXRgdGC0LLRg9C10YIg0LvQuCDQv9C+0LvRjNC30L7QstCw0YLQtdC70YxcbiAgICAgICAgbGV0IHVzZXIgPSBhd2FpdCB0aGlzLmdldFVzZXIoYm9keS5waG9uZV9udW1iZXIsICd0ZmEnKTtcbiAgICAgICAgaWYgKHVzZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCd1c2VyIG5vdCBmb3VuZCEhISEhJyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk5PVF9GT1VORCkuanNvbih7dXNlcjogW3RoaXMuZ2V0VXNlck5vdEZvdW5kTWVzc2FnZShib2R5LmxhbmcgfHwgJ2VuJyldfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVkaXNLZXkgPSBgJHtib2R5LnBob25lX251bWJlcn06JHtSRURJU19VU0VSX1BPU1RGSVh9YDtcbiAgICAgICAgLy8g0L/RgNC+0LLQtdGA0LrQsCDQutC+0LTQsFxuICAgICAgICBjb25zdCBjb2RlRnJvbVJlZGlzID0gYXdhaXQgdGhpcy5yZWRpc0NsaWVudC5nZXRBc3luYyhyZWRpc0tleSk7XG4gICAgICAgIGlmIChjb2RlRnJvbVJlZGlzID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuVU5QUk9DRVNTQUJMRV9FTlRJVFkpLmpzb24oe1xuICAgICAgICAgICAgICAgIGNvZGU6IFtib2R5LmxhbmcgPT09ICdydScgPyAn0JrQvtC00LAg0LvQuNCx0L4g0L3QtdGC0YMg0LvQuNCx0L4g0LXQs9C+INGB0YDQvtC6INC40YHRgtGR0LonIDogXCJUaGUgJ0NvZGUnIGV4cGlyZXMgb3IgZG9lcyBub3QgZXhpc3RzLlwiXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhcnNlSW50KGNvZGVGcm9tUmVkaXMsIDEwKSAhPSBwYXJzZUludChib2R5LmNvZGUsIDEwKSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih7XG4gICAgICAgICAgICAgICAgY29kZTogW2JvZHkubGFuZyA9PT0gJ3J1JyA/ICfQktGLINCy0LLQtdC70Lgg0L3QtdCy0LXRgNC90YvQuSDQutC+0LQnIDogXCJUaGUgJ0NvZGUnIGlzIG5vdCB2YWxpZC5cIl1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMucmVkaXNDbGllbnQuZGVsKHJlZGlzS2V5KTtcblxuICAgICAgICAvLyDQv9C+0LTQs9C+0YLQvtCy0LrQsCDQsNC00YDQtdGB0L7Qsiwg0LfQsCDQutC+0YLQvtGA0YvQvNC4INC90YPQttC90L4g0L7RgtGB0LvQtdC00LjRgtGMINGD0YHQv9C10YjQvdC+0LUg0L/RgNC+0YXQvtC20LTQtdC90LjQtSDRgtGA0LDQvdC30LDQutGG0LjQuFxuICAgICAgICBsZXQgdXNlckthenRlbCA9IGF3YWl0IHRoaXMuZ2V0VXNlcih1c2VyLlBob25lTnVtYmVyLCAna2F6dGVsJyk7XG4gICAgICAgIGxldCB1c2VyRWdvdiA9IGF3YWl0IHRoaXMuZ2V0VXNlcih1c2VyLlBob25lTnVtYmVyLCAnZWdvdicpO1xuICAgICAgICBsZXQgYWRkcmVzc2VzID0gW1xuICAgICAgICAgICAgdGhpcy5jaGFpblNlcnZpY2UuZ2V0QWRkcmVzcyh1c2VyLlBob25lTnVtYmVyLCAndGZhJyksXG4gICAgICAgIF07XG4gICAgICAgIGlmICh1c2VyS2F6dGVsICE9PSBudWxsKSB7XG4gICAgICAgICAgICBhZGRyZXNzZXMucHVzaCh0aGlzLmNoYWluU2VydmljZS5nZXRBZGRyZXNzKHVzZXIuUGhvbmVOdW1iZXIsICdrYXp0ZWwnKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHVzZXJFZ292ICE9PSBudWxsKSB7XG4gICAgICAgICAgICBhZGRyZXNzZXMucHVzaCh0aGlzLmNoYWluU2VydmljZS5nZXRBZGRyZXNzKHVzZXIuUGhvbmVOdW1iZXIsICdlZ292JykpO1xuICAgICAgICB9XG4gICAgICAgIC8vINC90LDRh9C40L3QsNC10Lwg0YHQu9GD0YjQsNGC0Ywg0LjQt9C80LXQvdC10L3QuNGPINCw0LTRgNC10YHQvtCyXG4gICAgICAgIGxldCB3cyA9IHRoaXMub3BlbldzQ29ubmVjdGlvbihhZGRyZXNzZXMpO1xuXG4gICAgICAgIHVzZXIuSXNWZXJpZmllZCA9IHRydWU7XG4gICAgICAgIHVzZXIuUHVzaFRva2VuID0gYm9keS5wdXNoX3Rva2VuO1xuICAgICAgICBhd2FpdCB0aGlzLnRmYVRGLnVwZGF0ZVVzZXIodXNlci5QaG9uZU51bWJlciwgdXNlcik7XG5cbiAgICAgICAgaWYgKHVzZXJLYXp0ZWwgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHVzZXJLYXp0ZWwuSXNWZXJpZmllZCA9IHRydWU7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmthenRlbFRGLnVwZGF0ZVVzZXIodXNlci5QaG9uZU51bWJlciwgdXNlckthenRlbCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHVzZXJFZ292ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB1c2VyS2F6dGVsLklzVmVyaWZpZWQgPSB0cnVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5lZ292VEYudXBkYXRlVXNlcih1c2VyLlBob25lTnVtYmVyLCB1c2VyRWdvdik7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJlc3BvbnNlU2VuZCA9IGZhbHNlO1xuICAgICAgICB3cy5vbm1lc3NhZ2UgPSBtZXNzID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKG1lc3MuZGF0YSk7XG4gICAgICAgICAgICBmb3IgKGxldCBzdGF0ZUNoYW5nZSBvZiBkYXRhLnN0YXRlX2NoYW5nZXMpe1xuICAgICAgICAgICAgICAgIGlmIChhZGRyZXNzZXMuaW5kZXhPZihzdGF0ZUNoYW5nZS5hZGRyZXNzKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgX3VzZXIgPSBtZXNzYWdlc1NlcnZpY2UuVXNlci5kZWNvZGUobmV3IEJ1ZmZlcihzdGF0ZUNoYW5nZS52YWx1ZSwgJ2Jhc2U2NCcpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlU2VuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2FjdGlvbic6ICd1bnN1YnNjcmliZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIHRvZG86INC/0L4g0YXQvtGA0L7RiNC10LzRgyDQvdCw0LTQviDQstC+INCy0YHQtdGFINGH0LXQudC90LDRhSDQvtGC0YHQu9C10LTQuNGC0Ywg0LjQt9C80LXQvdC10L3QuNGPXG4gICAgICAgICAgICAgICAgICAgIGlmIChfdXNlci5Jc1ZlcmlmaWVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlU2VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5PSykuanNvbih7c3RhdHVzOiAnc3VjY2Vzcyd9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZXJyb3IgLSB0cnlpbmcgdG8gc2VuZCByZXNwb25zZSBzZWNvbmQgdGltZScsIGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB3cy5vbmNsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgJ2FjdGlvbic6ICd1bnN1YnNjcmliZSdcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBAR2V0KCdjb2RlJylcbiAgICBhc3luYyBnZXRDb2RlKEBSZXEoKSByZXEsIEBSZXMoKSByZXMsIEBRdWVyeSgncGhvbmVfbnVtYmVyJykgcGhvbmVOdW1iZXI6IHN0cmluZywgQFF1ZXJ5KCdwdXNoX3Rva2VuJykgcHVzaFRva2VuOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICBAUXVlcnkoJ2NsaWVudF90aW1lc3RhbXAnKSBjbGllbnRUaW1lc3RhbXA6IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVxLnF1ZXJ5LmNsaWVudF90aW1lc3RhbXAgPSBwYXJzZUludChyZXEucXVlcnkuY2xpZW50X3RpbWVzdGFtcCwgMTApO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZScsIGUpO1xuICAgICAgICB9XG4gICAgICAgIGxldCB2ID0gbmV3IFZhbGlkYXRvcihyZXEucXVlcnksIHtcbiAgICAgICAgICAgIHBob25lX251bWJlcjogJ3JlcXVpcmVkfHN0cmluZ3xyZWdleDovXlxcXFwrP1sxLTldXFxcXGR7MSwxNH0kLycsXG4gICAgICAgICAgICBwdXNoX3Rva2VuOiAncmVxdWlyZWR8c3RyaW5nJyxcbiAgICAgICAgICAgIGNsaWVudF90aW1lc3RhbXA6ICdyZXF1aXJlZHxudW1iZXInLFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHYuZmFpbHMoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih2LmdldEVycm9ycygpKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdGZhS2F6dGVsID0gYXdhaXQgdGhpcy5nZXRVc2VyKHBob25lTnVtYmVyLCAndGZhJyk7XG4gICAgICAgIGlmICghdGZhS2F6dGVsKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk5PVF9GT1VORCkuanNvbih7dXNlcjogW3RoaXMuZ2V0VXNlck5vdEZvdW5kTWVzc2FnZShyZXEucXVlcnkubGFuZyB8fCAnZW4nKV19KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRmYUthenRlbC5Jc1ZlcmlmaWVkIHx8IHRmYUthenRlbC5QdXNoVG9rZW4gIT09IHB1c2hUb2tlbikge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5OT1RfRk9VTkQpLmpzb24oe3VzZXI6IFt0aGlzLmdldFVzZXJOb3RGb3VuZE1lc3NhZ2UocmVxLnF1ZXJ5LmxhbmcgfHwgJ2VuJyldfSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHVzZXJLYXp0ZWwgPSBhd2FpdCB0aGlzLmdldFVzZXIodGZhS2F6dGVsLlBob25lTnVtYmVyLCAna2F6dGVsJyk7XG4gICAgICAgIGxldCB1c2VyRWdvdiA9IGF3YWl0IHRoaXMuZ2V0VXNlcih0ZmFLYXp0ZWwuUGhvbmVOdW1iZXIsICdlZ292Jyk7XG4gICAgICAgIGlmICh1c2VyS2F6dGVsID09PSBudWxsICYmIHVzZXJFZ292ID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuTk9UX0ZPVU5EKS5qc29uKHt1c2VyOiBbdGhpcy5nZXRVc2VyTm90Rm91bmRNZXNzYWdlKHJlcS5xdWVyeS5sYW5nIHx8ICdlbicpXX0pO1xuICAgICAgICB9XG4gICAgICAgIGxldCB7bG9nS2F6dGVsLCBsb2dFZ292fSA9IHRoaXMuaW5pdExvZ3ModXNlckthenRlbCwgdXNlckVnb3YpO1xuICAgICAgICBpZiAobG9nS2F6dGVsLnN0YXR1cyAhPT0gJ3N1Y2Nlc3MnICYmIGxvZ0Vnb3Yuc3RhdHVzICE9PSAnc3VjY2VzcycpIHtcbiAgICAgICAgICAgIHN3aXRjaCAobG9nS2F6dGVsLnN0YXR1cykge1xuICAgICAgICAgICAgICAgIGNhc2UgJ25vX3NlbmRfY29kZXMnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXI6IFtyZXEucXVlcnkubGFuZyA9PSAncnUnID8gJ9Cf0L7Qu9GM0LfQvtCy0LDRgtC10LvRjiDQtdGJ0ZEg0L3QtSDQvtGC0L/RgNCw0LLQuNC70Lgg0L3QuCDQvtC00L3QvtCz0L4g0LrQvtC00LAg0L/QvtC00YLQstC10YDQttC00LXQvdC40Y8nIDogJ05vIGNvZGUgZm9yIHVzZXIgeWV0J11cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY2FzZSAnbm9fY29kZV91c2VkJzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5qc29uKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VyOiBbcmVxLnF1ZXJ5LmxhbmcgPT0gJ3J1J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/ICfQn9C+0LvRjNC30L7QstCw0YLQtdC70Y4g0LXRidGRINC90LUg0L7RgtC/0YDQsNCy0LjQu9C4INC90Lgg0L7QtNC90L7Qs9C+INC60L7QtNCwINC/0L7QtNGC0LLQtdGA0LbQtNC10L3QuNGPJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdObyBjb2RlIGZvciB1c2VyIHlldCddXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHt1c2VyOiBbJ0Vycm9yIGdldHRpbmcgY29kZSddfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxvZ0thenRlbC5zdGF0dXMgPT09ICdzdWNjZXNzJykge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5PSykuanNvbih0aGlzLnRyYW5zZm9ybUxvZyhsb2dLYXp0ZWwubG9nLCAna2F6dGVsJykpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsb2dFZ292LnN0YXR1cyA9PT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLk9LKS5qc29uKHRoaXMudHJhbnNmb3JtTG9nKGxvZ0Vnb3YubG9nLCAnZWdvdicpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLlVOUFJPQ0VTU0FCTEVfRU5USVRZKS5qc29uKHt1c2VyOiBbJ0Vycm9yIGdldHRpbmcgY29kZSddfSk7XG4gICAgfVxuXG4gICAgQFBvc3QoJ3ZlcmlmeScpXG4gICAgYXN5bmMgcG9zdFZlcmlmeShAUmVzKCkgcmVzLCBAQm9keSgpIGJvZHk6IFBvc3RWZXJpZnlDb2RlRFRPKSB7XG4gICAgICAgIGxldCB2ID0gbmV3IFZhbGlkYXRvcihib2R5LCB7XG4gICAgICAgICAgICBldmVudDogJ3JlcXVpcmVkfHN0cmluZycsIGxhbmc6ICdzdHJpbmcnLCBjb2RlOiAncmVxdWlyZWR8bnVtYmVyJywgc2VydmljZTogJ3JlcXVpcmVkSWZOb3Q6cHVzaF90b2tlbnxzdHJpbmd8aW46a2F6dGVsLGVnb3YnLFxuICAgICAgICAgICAgcGhvbmVfbnVtYmVyOiAncmVxdWlyZWR8c3RyaW5nfHJlZ2V4Oi9eXFxcXCs/WzEtOV1cXFxcZHsxLDE0fSQvJywgZW1iZWRlZDogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgLy8g0LjRgdC/0L7Qu9GM0LfRg9C10YLRgdGPINGC0L7Qu9GM0LrQviDQv9GA0Lgg0L7RgtC/0YDQsNCy0LrQtSDQvNC+0LHQuNC70YzQvdGL0Lwg0L/RgNC40LvQvtC20LXQvdC40LXQvCAtINC00LvRjyDRg9GB0YLQsNC90L7QstC60LUg0YHRgtCw0YLRg9GB0LAgUkVKRUNUXG4gICAgICAgICAgICBzdGF0dXM6ICdzdHJpbmcnLCBjbGllbnRfdGltZXN0YW1wOiAncmVxdWlyZWQnLCBjZXJ0OiAnbnVsbGFibGUnLFxuICAgICAgICB9LCB7J3NlcnZpY2UuaW4nOiBgTm8gc2VydmljZSB3aXRoIG5hbWU6ICR7Ym9keS5zZXJ2aWNlfWB9KTtcbiAgICAgICAgaWYgKHYuZmFpbHMoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih2LmdldEVycm9ycygpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyDQn9GA0L7QstC10YDQutCwLCDRgdGD0YnQtdGB0YLQstGD0LXRgiDQu9C4INC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjFxuICAgICAgICBsZXQgdXNlciA9IGF3YWl0IHRoaXMuZ2V0VXNlcihib2R5LnBob25lX251bWJlciwgYm9keS5zZXJ2aWNlKTtcbiAgICAgICAgaWYgKHVzZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuTk9UX0ZPVU5EKS5qc29uKHtcbiAgICAgICAgICAgICAgICB1c2VyOiBbdGhpcy5nZXRVc2VyTm90Rm91bmRNZXNzYWdlKGJvZHkubGFuZyB8fCAnZW4nKV1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vINC90LDRh9C40L3QsNC10Lwg0YHQu9GD0YjQsNGC0Ywg0LjQt9C80LXQvdC10L3QuNGPINCw0LTRgNC10YHQvtCyXG4gICAgICAgIGxldCBhZGRyZXNzZXMgPSBbXG4gICAgICAgICAgICB0aGlzLmNoYWluU2VydmljZS5nZXRBZGRyZXNzKHVzZXIuUGhvbmVOdW1iZXIsIGJvZHkuc2VydmljZSksXG4gICAgICAgIF07XG4gICAgICAgIGxldCB3cyA9IHRoaXMub3BlbldzQ29ubmVjdGlvbihhZGRyZXNzZXMpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zdG9yZUxvZyhib2R5LCB1c2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3Igd2hpbGUgZ2V0dGluZyB1c2VyYCwgZSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLkJBRF9HQVRFV0FZKS5qc29uKHtlcnJvcjogJ0Vycm9yIGNoZWNraW5nIGNvZGUuJ30pO1xuICAgICAgICB9XG4gICAgICAgIGxldCBzZWxmID0gdGhpcztcbiAgICAgICAgbGV0IHRmYVVzZXIgPSBhd2FpdCB0aGlzLmdldFVzZXIoYm9keS5waG9uZV9udW1iZXIsICd0ZmEnKTtcbiAgICAgICAgd3Mub25tZXNzYWdlID0gbWVzcyA9PiB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShtZXNzLmRhdGEpO1xuICAgICAgICAgICAgbGV0IHJlc3BvbnNlU2VuZCA9IGZhbHNlO1xuICAgICAgICAgICAgZm9yIChsZXQgc3RhdGVDaGFuZ2Ugb2YgZGF0YS5zdGF0ZV9jaGFuZ2VzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlU2VuZCkge1xuICAgICAgICAgICAgICAgICAgICB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHsnYWN0aW9uJzogJ3Vuc3Vic2NyaWJlJ30pKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhZGRyZXNzZXMuaW5kZXhPZihzdGF0ZUNoYW5nZS5hZGRyZXNzKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgX3VzZXIgPSBtZXNzYWdlc1NlcnZpY2VDbGllbnQuVXNlci5kZWNvZGUobmV3IEJ1ZmZlcihzdGF0ZUNoYW5nZS52YWx1ZSwgJ2Jhc2U2NCcpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF91c2VyLkxvZ3MubGVuZ3RoID09PSB1c2VyLkxvZ3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnX3VzZXIuTG9ncycsIF91c2VyLkxvZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VTZW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7J2FjdGlvbic6ICd1bnN1YnNjcmliZSd9KSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IF91c2VyLkxvZ3NbX3VzZXIuTG9ncy5sZW5ndGggLSAxXS5TdGF0dXM7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNhZmUgaW4gcmVkaXMgaW5mb3JtYXRpb24gdGhhdCBwaG9uZSBpcyB2YWxpZFxuICAgICAgICAgICAgICAgICAgICBzZWxmLnJlZGlzQ2xpZW50LnNldEFzeW5jKGAke3RmYVVzZXIuUGhvbmVOdW1iZXJ9OiR7UkVESVNfVVNFUl9QVVNIX1JFU1VMVF9QT1NURklYfWAsIHN0YXR1cywgJ0VYJywgMTUgKiA2MCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RhdHVzID09PSBWQUxJRCB8fCBzdGF0dXMgPT09IFJFSkVDVCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNlbmQgdXNlciB0byBjbGllbnQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdG9kbyDQvtGC0YDQsNCx0L7RgtCw0YLRjCDQsiDQvNC+0LzQvdC10YIg0LjQvdGC0LXQs9GA0LDRhtC40LhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0b2RvIG1ha2UgcmVxdWVzdCB0byByZWRpcmVzdCB1cmwgd2l0aCB1c2VyIGRhdGFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZXNwb25kZSB0byB0aGUgdmlld1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKEh0dHBTdGF0dXMuT0spLmpzb24oe3N0YXR1czogc3RhdHVzLCB1c2VyOiBfdXNlcn0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RhdHVzID09PSAnRVhQSVJFRCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDQwKS5qc29uKHtzdGF0dXM6IHN0YXR1c30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyhIdHRwU3RhdHVzLkJBRF9SRVFVRVNUKS5qc29uKHtzdGF0dXM6IHN0YXR1c30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpbml0TG9ncyh1c2VyS2F6dGVsOiBQb3N0Q2xpZW50VXNlckRUTyB8IG51bGwsIHVzZXJFZ292OiBQb3N0Q2xpZW50VXNlckRUTyB8IG51bGwpIHtcbiAgICAgICAgbGV0IGxvZ0thenRlbCA9IHtzdGF0dXM6ICdub19zZW5kX2NvZGVzJywgbG9nOiB7U2VydmljZTogbnVsbH19O1xuICAgICAgICBpZiAodXNlckthenRlbCkge1xuICAgICAgICAgICAgbG9nS2F6dGVsID0gdGhpcy5nZXRMYXRlc3RDb2RlKHVzZXJLYXp0ZWwpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBsb2dFZ292ID0ge3N0YXR1czogJ25vX3NlbmRfY29kZXMnLCBsb2c6IHtTZXJ2aWNlOiBudWxsfX07XG4gICAgICAgIGlmICh1c2VyRWdvdikge1xuICAgICAgICAgICAgbG9nRWdvdiA9IHRoaXMuZ2V0TGF0ZXN0Q29kZSh1c2VyRWdvdik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtsb2dLYXp0ZWwsIGxvZ0Vnb3Z9O1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgc3RvcmVMb2coYm9keTogUG9zdFZlcmlmeUNvZGVEVE8sIHVzZXI6IFBvc3RDbGllbnRVc2VyRFRPIHwgbnVsbCkge1xuICAgICAgICBsZXQgcmVqZWN0U3RhdHVzID0gbnVsbDtcbiAgICAgICAgaWYgKGJvZHkuc3RhdHVzICYmIGJvZHkuc3RhdHVzID09PSAnUkVKRUNUJykge1xuICAgICAgICAgICAgcmVqZWN0U3RhdHVzID0gJ1JFSkVDVCc7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGxvZyA9IG5ldyBVc2VyTG9nKCk7XG4gICAgICAgIGxvZy5BY3Rpb25UaW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKSAvIDEwMDA7XG4gICAgICAgIGxvZy5FeHBpcmVkQXQgPSB0aGlzLnRpbWVIZWxwZXIuZ2V0VW5peFRpbWVBZnRlck1pbnV0ZXMoMSk7XG4gICAgICAgIGxvZy5FdmVudCA9IGJvZHkuZXZlbnQ7XG4gICAgICAgIGxvZy5FbWJlZGVkID0gYm9keS5lbWJlZGVkO1xuICAgICAgICBsb2cuU3RhdHVzID0gcmVqZWN0U3RhdHVzIHx8ICdWRVJJRlknO1xuICAgICAgICBsb2cuQ29kZSA9IGJvZHkuY29kZTtcbiAgICAgICAgbG9nLkNlcnQgPSBib2R5LmNlcnQ7XG4gICAgICAgIGF3YWl0IHRoaXMuY2hhaW5TZXJ2aWNlLnZlcmlmeSh1c2VyLlBob25lTnVtYmVyLCBsb2csIGJvZHkuc2VydmljZSk7XG4gICAgfVxufSJdfQ==