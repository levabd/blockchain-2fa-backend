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
class PostVerifyNumberDTO {
}
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", String)
], PostVerifyNumberDTO.prototype, "phone_number", void 0);
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", String)
], PostVerifyNumberDTO.prototype, "push_token", void 0);
__decorate([
    swagger_1.ApiModelProperty(),
    __metadata("design:type", String)
], PostVerifyNumberDTO.prototype, "code", void 0);
exports.PostVerifyNumberDTO = PostVerifyNumberDTO;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9zaGFyZWQvbW9kZWxzL2R0by9wb3N0LnZlcmlmeS5udW1iZXIuZHRvLnRzIiwic291cmNlcyI6WyIvaG9tZS9wZXNoa292L2Rldi9wcm9qZWN0cy9ibG9ja2NoYWluLTJmYS1iYWNrZW5kL3NyYy9tb2R1bGVzL3NoYXJlZC9tb2RlbHMvZHRvL3Bvc3QudmVyaWZ5Lm51bWJlci5kdG8udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSw2Q0FBaUQ7QUFFakQ7Q0FVQztBQVBHO0lBREMsMEJBQWdCLEVBQUU7O3lEQUNFO0FBR3JCO0lBREMsMEJBQWdCLEVBQUU7O3VEQUNTO0FBRTVCO0lBREMsMEJBQWdCLEVBQUU7O2lEQUNHO0FBUjFCLGtEQVVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtBcGlNb2RlbFByb3BlcnR5fSBmcm9tICdAbmVzdGpzL3N3YWdnZXInO1xuXG5leHBvcnQgY2xhc3MgUG9zdFZlcmlmeU51bWJlckRUTyB7XG4gICAgLy8gbm9pbnNwZWN0aW9uIFRzTGludFxuICAgIEBBcGlNb2RlbFByb3BlcnR5KClcbiAgICBwaG9uZV9udW1iZXI6IHN0cmluZztcbiAgICAvLyBub2luc3BlY3Rpb24gVHNMaW50XG4gICAgQEFwaU1vZGVsUHJvcGVydHkoKVxuICAgIHJlYWRvbmx5IHB1c2hfdG9rZW46IHN0cmluZztcbiAgICBAQXBpTW9kZWxQcm9wZXJ0eSgpXG4gICAgcmVhZG9ubHkgY29kZTogc3RyaW5nO1xuICAgIHJlYWRvbmx5IGxhbmc6IHN0cmluZztcbn0iXX0=