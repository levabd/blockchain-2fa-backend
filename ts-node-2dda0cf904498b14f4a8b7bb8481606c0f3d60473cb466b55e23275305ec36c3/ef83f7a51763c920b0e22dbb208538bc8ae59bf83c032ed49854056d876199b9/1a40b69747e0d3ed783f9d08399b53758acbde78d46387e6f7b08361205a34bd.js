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
class PostVerifyCodeDTO {
}
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", String)
], PostVerifyCodeDTO.prototype, "event", void 0);
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", String)
], PostVerifyCodeDTO.prototype, "service", void 0);
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", String)
], PostVerifyCodeDTO.prototype, "phone_number", void 0);
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", Boolean)
], PostVerifyCodeDTO.prototype, "embeded", void 0);
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", String)
], PostVerifyCodeDTO.prototype, "client_timestamp", void 0);
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", String)
], PostVerifyCodeDTO.prototype, "cert", void 0);
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", Number)
], PostVerifyCodeDTO.prototype, "code", void 0);
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", String)
], PostVerifyCodeDTO.prototype, "lang", void 0);
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", String)
], PostVerifyCodeDTO.prototype, "status", void 0);
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", String)
], PostVerifyCodeDTO.prototype, "method", void 0);
exports.PostVerifyCodeDTO = PostVerifyCodeDTO;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9zaGFyZWQvbW9kZWxzL2R0by9wb3N0LnZlcmlmeS5kdG8udHMiLCJzb3VyY2VzIjpbIi9ob21lL3Blc2hrb3YvZGV2L3Byb2plY3RzL2Jsb2NrY2hhaW4tMmZhLWJhY2tlbmQvc3JjL21vZHVsZXMvc2hhcmVkL21vZGVscy9kdG8vcG9zdC52ZXJpZnkuZHRvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUEsNkNBQWlEO0FBRWpEO0NBMkJDO0FBekJHO0lBREMsMEJBQWdCLEVBQUU7O2dEQUNJO0FBR3ZCO0lBREMsMEJBQWdCLEVBQUU7O2tEQUNNO0FBR3pCO0lBREMsMEJBQWdCLEVBQUU7O3VEQUNXO0FBRzlCO0lBREMsMEJBQWdCLEVBQUU7O2tEQUNPO0FBRzFCO0lBREMsMEJBQWdCLEVBQUU7OzJEQUNNO0FBR3pCO0lBREMsMEJBQWdCLEVBQUU7OytDQUNHO0FBR3RCO0lBREMsMEJBQWdCLEVBQUU7OytDQUNHO0FBRXRCO0lBREMsMEJBQWdCLEVBQUU7OytDQUNHO0FBRXRCO0lBREMsMEJBQWdCLEVBQUU7O2lEQUNLO0FBRXhCO0lBREMsMEJBQWdCLEVBQUU7O2lEQUNLO0FBMUI1Qiw4Q0EyQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0FwaU1vZGVsUHJvcGVydHl9IGZyb20gJ0BuZXN0anMvc3dhZ2dlcic7XG5cbmV4cG9ydCBjbGFzcyBQb3N0VmVyaWZ5Q29kZURUT3tcbiAgICBAQXBpTW9kZWxQcm9wZXJ0eSgpXG4gICAgcmVhZG9ubHkgZXZlbnQ6IHN0cmluZztcbiAgICAvLyBub2luc3BlY3Rpb24gVHNMaW50XG4gICAgQEFwaU1vZGVsUHJvcGVydHkoKVxuICAgIHJlYWRvbmx5IHNlcnZpY2U6IHN0cmluZztcbiAgICAvLyBub2luc3BlY3Rpb24gVHNMaW50XG4gICAgQEFwaU1vZGVsUHJvcGVydHkoKVxuICAgIHJlYWRvbmx5IHBob25lX251bWJlcjogc3RyaW5nO1xuICAgIC8vIG5vaW5zcGVjdGlvbiBUc0xpbnRcbiAgICBAQXBpTW9kZWxQcm9wZXJ0eSgpXG4gICAgcmVhZG9ubHkgZW1iZWRlZDogYm9vbGVhbjtcbiAgICAvLyBub2luc3BlY3Rpb24gVHNMaW50XG4gICAgQEFwaU1vZGVsUHJvcGVydHkoKVxuICAgIGNsaWVudF90aW1lc3RhbXA6IHN0cmluZztcbiAgICAvLyBub2luc3BlY3Rpb24gVHNMaW50XG4gICAgQEFwaU1vZGVsUHJvcGVydHkoKVxuICAgIHJlYWRvbmx5IGNlcnQ6IHN0cmluZztcbiAgICAvLyBub2luc3BlY3Rpb24gVHNMaW50XG4gICAgQEFwaU1vZGVsUHJvcGVydHkoKVxuICAgIHJlYWRvbmx5IGNvZGU6IG51bWJlcjtcbiAgICBAQXBpTW9kZWxQcm9wZXJ0eSgpXG4gICAgcmVhZG9ubHkgbGFuZzogc3RyaW5nO1xuICAgIEBBcGlNb2RlbFByb3BlcnR5KClcbiAgICByZWFkb25seSBzdGF0dXM6IHN0cmluZztcbiAgICBAQXBpTW9kZWxQcm9wZXJ0eSgpXG4gICAgcmVhZG9ubHkgbWV0aG9kOiBzdHJpbmc7XG59Il19