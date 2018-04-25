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
class PostCodeDTO {
}
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", String)
], PostCodeDTO.prototype, "event", void 0);
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", String)
], PostCodeDTO.prototype, "service", void 0);
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", String)
], PostCodeDTO.prototype, "phone_number", void 0);
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", Boolean)
], PostCodeDTO.prototype, "embeded", void 0);
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", String)
], PostCodeDTO.prototype, "client_timestamp", void 0);
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", String)
], PostCodeDTO.prototype, "cert", void 0);
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", String)
], PostCodeDTO.prototype, "method", void 0);
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", String)
], PostCodeDTO.prototype, "resend", void 0);
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", String)
], PostCodeDTO.prototype, "lang", void 0);
exports.PostCodeDTO = PostCodeDTO;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9zaGFyZWQvbW9kZWxzL2R0by9wb3N0LmNvZGUuZHRvLnRzIiwic291cmNlcyI6WyIvaG9tZS9wZXNoa292L2Rldi9wcm9qZWN0cy9ibG9ja2NoYWluLTJmYS1iYWNrZW5kL3NyYy9tb2R1bGVzL3NoYXJlZC9tb2RlbHMvZHRvL3Bvc3QuY29kZS5kdG8udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSw2Q0FBaUQ7QUFFakQ7Q0EyQkM7QUF6Qkc7SUFEQywwQkFBZ0IsRUFBRTs7MENBQ0k7QUFHdkI7SUFEQywwQkFBZ0IsRUFBRTs7NENBQ007QUFHekI7SUFEQywwQkFBZ0IsRUFBRTs7aURBQ1c7QUFHOUI7SUFEQywwQkFBZ0IsRUFBRTs7NENBQ087QUFHMUI7SUFEQywwQkFBZ0IsRUFBRTs7cURBQ007QUFHekI7SUFEQywwQkFBZ0IsRUFBRTs7eUNBQ0c7QUFHdEI7SUFEQywwQkFBZ0IsRUFBRTs7MkNBQ0s7QUFHeEI7SUFEQywwQkFBZ0IsRUFBRTs7MkNBQ0s7QUFHeEI7SUFEQywwQkFBZ0IsRUFBRTs7eUNBQ0c7QUExQjFCLGtDQTJCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7QXBpTW9kZWxQcm9wZXJ0eX0gZnJvbSAnQG5lc3Rqcy9zd2FnZ2VyJztcblxuZXhwb3J0IGNsYXNzIFBvc3RDb2RlRFRPIHtcbiAgICBAQXBpTW9kZWxQcm9wZXJ0eSgpXG4gICAgcmVhZG9ubHkgZXZlbnQ6IHN0cmluZztcbiAgICAvLyBub2luc3BlY3Rpb24gVHNMaW50XG4gICAgQEFwaU1vZGVsUHJvcGVydHkoKVxuICAgIHJlYWRvbmx5IHNlcnZpY2U6IHN0cmluZztcbiAgICAvLyBub2luc3BlY3Rpb24gVHNMaW50XG4gICAgQEFwaU1vZGVsUHJvcGVydHkoKVxuICAgIHJlYWRvbmx5IHBob25lX251bWJlcjogc3RyaW5nO1xuICAgIC8vIG5vaW5zcGVjdGlvbiBUc0xpbnRcbiAgICBAQXBpTW9kZWxQcm9wZXJ0eSgpXG4gICAgcmVhZG9ubHkgZW1iZWRlZDogYm9vbGVhbjtcbiAgICAvLyBub2luc3BlY3Rpb24gVHNMaW50XG4gICAgQEFwaU1vZGVsUHJvcGVydHkoKVxuICAgIGNsaWVudF90aW1lc3RhbXA6IHN0cmluZztcbiAgICAvLyBub2luc3BlY3Rpb24gVHNMaW50XG4gICAgQEFwaU1vZGVsUHJvcGVydHkoKVxuICAgIHJlYWRvbmx5IGNlcnQ6IHN0cmluZztcbiAgICAvLyBub2luc3BlY3Rpb24gVHNMaW50XG4gICAgQEFwaU1vZGVsUHJvcGVydHkoKVxuICAgIHJlYWRvbmx5IG1ldGhvZDogc3RyaW5nO1xuICAgIC8vIG5vaW5zcGVjdGlvbiBUc0xpbnRcbiAgICBAQXBpTW9kZWxQcm9wZXJ0eSgpXG4gICAgcmVhZG9ubHkgcmVzZW5kOiBzdHJpbmc7XG4gICAgLy8gbm9pbnNwZWN0aW9uIFRzTGludFxuICAgIEBBcGlNb2RlbFByb3BlcnR5KClcbiAgICByZWFkb25seSBsYW5nOiBzdHJpbmc7XG59Il19