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
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_1 = require("@nestjs/swagger");
class SmsBodyDto {
}
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", String)
], SmsBodyDto.prototype, "id", void 0);
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", String)
], SmsBodyDto.prototype, "phone", void 0);
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", String)
], SmsBodyDto.prototype, "charset", void 0);
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", String)
], SmsBodyDto.prototype, "status", void 0);
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", String)
], SmsBodyDto.prototype, "time", void 0);
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", String)
], SmsBodyDto.prototype, "ts", void 0);
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", String)
], SmsBodyDto.prototype, "snt", void 0);
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", String)
], SmsBodyDto.prototype, "sha1", void 0);
exports.SmsBodyDto = SmsBodyDto;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvY29udHJvbGxzZXJzL3Ntcy9zbXMubW9kZWwudHMiLCJzb3VyY2VzIjpbIi9ob21lL3Blc2hrb3YvZGV2L3Byb2plY3RzL2Jsb2NrY2hhaW4tMmZhLWJhY2tlbmQvc3JjL21vZHVsZXMvYXBpL2NvbnRyb2xsc2Vycy9zbXMvc21zLm1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUEsNkNBQW1EO0FBRW5EO0NBaUJDO0FBZkc7SUFEQywwQkFBZ0IsRUFBRTs7c0NBQ0M7QUFFcEI7SUFEQywwQkFBZ0IsRUFBRTs7eUNBQ0k7QUFFdkI7SUFEQywwQkFBZ0IsRUFBRTs7MkNBQ007QUFFekI7SUFEQywwQkFBZ0IsRUFBRTs7MENBQ0s7QUFFeEI7SUFEQywwQkFBZ0IsRUFBRTs7d0NBQ0c7QUFFdEI7SUFEQywwQkFBZ0IsRUFBRTs7c0NBQ0M7QUFFcEI7SUFEQywwQkFBZ0IsRUFBRTs7dUNBQ0U7QUFFckI7SUFEQywwQkFBZ0IsRUFBRTs7d0NBQ0c7QUFoQjFCLGdDQWlCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwaU1vZGVsUHJvcGVydHkgfSBmcm9tICdAbmVzdGpzL3N3YWdnZXInO1xuXG5leHBvcnQgY2xhc3MgU21zQm9keUR0byB7XG4gICAgQEFwaU1vZGVsUHJvcGVydHkoKVxuICAgIHJlYWRvbmx5IGlkOiBzdHJpbmc7XG4gICAgQEFwaU1vZGVsUHJvcGVydHkoKVxuICAgIHJlYWRvbmx5IHBob25lOiBzdHJpbmc7XG4gICAgQEFwaU1vZGVsUHJvcGVydHkoKVxuICAgIHJlYWRvbmx5IGNoYXJzZXQ6IHN0cmluZztcbiAgICBAQXBpTW9kZWxQcm9wZXJ0eSgpXG4gICAgcmVhZG9ubHkgc3RhdHVzOiBzdHJpbmc7XG4gICAgQEFwaU1vZGVsUHJvcGVydHkoKVxuICAgIHJlYWRvbmx5IHRpbWU6IHN0cmluZztcbiAgICBAQXBpTW9kZWxQcm9wZXJ0eSgpXG4gICAgcmVhZG9ubHkgdHM6IHN0cmluZztcbiAgICBAQXBpTW9kZWxQcm9wZXJ0eSgpXG4gICAgcmVhZG9ubHkgc250OiBzdHJpbmc7XG4gICAgQEFwaU1vZGVsUHJvcGVydHkoKVxuICAgIHJlYWRvbmx5IHNoYTE6IHN0cmluZztcbn0iXX0=