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
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_1 = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const sha1 = require("js-sha1");
const sms_model_1 = require("./sms.model");
const env_1 = require("../../../../config/env");
let SmsCallbackController = class SmsCallbackController {
    callback(smsBodyDto) {
        if (smsBodyDto.sha1 !== sha1(`${smsBodyDto.id}:${smsBodyDto.phone}:${smsBodyDto.status}:${env_1.EnvConfig.SMS_CALLBACK_TOKEN}`)) {
            console.info(`Callback called with an invalid hash`, smsBodyDto);
            return;
        }
        console.info(`SMS callback - `, smsBodyDto);
    }
};
__decorate([
    common_1.Post('callback'),
    __param(0, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sms_model_1.SmsBodyDto]),
    __metadata("design:returntype", void 0)
], SmsCallbackController.prototype, "callback", null);
SmsCallbackController = __decorate([
    swagger_1.ApiUseTags('sms'),
    common_1.Controller('sms')
], SmsCallbackController);
exports.SmsCallbackController = SmsCallbackController;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvY29udHJvbGxzZXJzL3Ntcy9zbXMuY2FsbGJhY2suY29udHJvbGxlci50cyIsInNvdXJjZXMiOlsiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvY29udHJvbGxzZXJzL3Ntcy9zbXMuY2FsbGJhY2suY29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLDZDQUEyQztBQUMzQywyQ0FBc0Q7QUFFdEQsZ0NBQWdDO0FBQ2hDLDJDQUF1QztBQUN2QyxnREFBaUQ7QUFJakQsSUFBYSxxQkFBcUIsR0FBbEM7SUFVSSxRQUFRLENBQVMsVUFBc0I7UUFDbkMsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsR0FBRyxVQUFVLENBQUMsRUFBRSxJQUFJLFVBQVUsQ0FBQyxLQUFLLElBQUksVUFBVSxDQUFDLE1BQU0sSUFBSSxlQUFTLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4SCxPQUFPLENBQUMsSUFBSSxDQUFDLHNDQUFzQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQztRQUNYLENBQUM7UUFFRCxPQUFPLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ2hELENBQUM7Q0FDSixDQUFBO0FBUkc7SUFEQyxhQUFJLENBQUMsVUFBVSxDQUFDO0lBQ1AsV0FBQSxhQUFJLEVBQUUsQ0FBQTs7cUNBQWEsc0JBQVU7O3FEQU90QztBQWpCUSxxQkFBcUI7SUFGakMsb0JBQVUsQ0FBQyxLQUFLLENBQUM7SUFDakIsbUJBQVUsQ0FBQyxLQUFLLENBQUM7R0FDTCxxQkFBcUIsQ0FrQmpDO0FBbEJZLHNEQUFxQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7QXBpVXNlVGFnc30gZnJvbSAnQG5lc3Rqcy9zd2FnZ2VyJztcbmltcG9ydCB7Qm9keSwgQ29udHJvbGxlciwgUG9zdH0gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xuXG5pbXBvcnQgKiBhcyBzaGExIGZyb20gJ2pzLXNoYTEnO1xuaW1wb3J0IHtTbXNCb2R5RHRvfSBmcm9tICcuL3Ntcy5tb2RlbCc7XG5pbXBvcnQge0VudkNvbmZpZ30gZnJvbSAnLi4vLi4vLi4vLi4vY29uZmlnL2Vudic7XG5cbkBBcGlVc2VUYWdzKCdzbXMnKVxuQENvbnRyb2xsZXIoJ3NtcycpXG5leHBvcnQgY2xhc3MgU21zQ2FsbGJhY2tDb250cm9sbGVyIHtcbiAgICAvKipcbiAgICAgKiBUaGlzIGlzIHRoZSBjYWxsYmFjayBleGVjdXRlZCB3aGVuIHRoZSBhcHAgc2VuZHMgc21zXG4gICAgICogQm9keSBtdXN0IGNvbnRhaW4gU21zQm9keUR0bydzIGZpZWxkc1xuICAgICAqXG4gICAgICogQHJldHVybnMge3ZvaWR9XG4gICAgICogQG1lbWJlcm9mIFNtc0NhbGxiYWNrQ29udHJvbGxlclxuICAgICAqIEBwYXJhbSB7U21zQm9keUR0b30gc21zQm9keUR0byAtIENhbGxiYWNrIGRhdGFcbiAgICAgKi9cbiAgICBAUG9zdCgnY2FsbGJhY2snKVxuICAgIGNhbGxiYWNrKEBCb2R5KCkgc21zQm9keUR0bzogU21zQm9keUR0byk6IHZvaWQge1xuICAgICAgICBpZiAoc21zQm9keUR0by5zaGExICE9PSBzaGExKGAke3Ntc0JvZHlEdG8uaWR9OiR7c21zQm9keUR0by5waG9uZX06JHtzbXNCb2R5RHRvLnN0YXR1c306JHtFbnZDb25maWcuU01TX0NBTExCQUNLX1RPS0VOfWApKSB7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8oYENhbGxiYWNrIGNhbGxlZCB3aXRoIGFuIGludmFsaWQgaGFzaGAsIHNtc0JvZHlEdG8pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5pbmZvKGBTTVMgY2FsbGJhY2sgLSBgLCBzbXNCb2R5RHRvKTtcbiAgICB9XG59Il19