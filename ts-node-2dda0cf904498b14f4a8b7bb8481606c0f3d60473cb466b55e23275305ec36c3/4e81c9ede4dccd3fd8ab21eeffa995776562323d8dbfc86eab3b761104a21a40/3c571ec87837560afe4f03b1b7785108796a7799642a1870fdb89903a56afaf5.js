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
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const env_1 = require("../../../config/env");
const validation_helper_1 = require("../../../services/helpers/validation.helper");
let WebController = class WebController {
    getEnter(res, event, service) {
        let v = new validation_helper_1.Validator({
            event: event,
            service: service
        }, {
            event: 'required|string',
            service: 'required|string|in:kaztel,egov',
        }, { 'service.in': `No service with name: ${service}` });
        if (v.fails()) {
            return res.status(common_1.HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
        }
        return res.redirect(`${env_1.EnvConfig.FRONTEND_API}?service=${service}&event=${event}`);
    }
};
__decorate([
    common_1.Get('enter'),
    __param(0, common_1.Res()),
    __param(1, common_1.Query('event')),
    __param(2, common_1.Query('service')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], WebController.prototype, "getEnter", null);
WebController = __decorate([
    swagger_1.ApiUseTags('v1/api/world'),
    common_1.Controller('v1/api/world')
], WebController);
exports.WebController = WebController;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvY29udHJvbGxzZXJzL3dlYi5jb250cm9sbGVyLnRzIiwic291cmNlcyI6WyIvaG9tZS9wZXNoa292L2Rldi9wcm9qZWN0cy9ibG9ja2NoYWluLTJmYS1iYWNrZW5kL3NyYy9tb2R1bGVzL2FwaS9jb250cm9sbHNlcnMvd2ViLmNvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBdUU7QUFDdkUsNkNBQTJDO0FBQzNDLDZDQUE4QztBQUM5QyxtRkFBc0U7QUFJdEUsSUFBYSxhQUFhLEdBQTFCO0lBR0ksUUFBUSxDQUFRLEdBQUcsRUFDTSxLQUFhLEVBQ1gsT0FBZTtRQUN0QyxJQUFJLENBQUMsR0FBRyxJQUFJLDZCQUFTLENBQUM7WUFDbEIsS0FBSyxFQUFFLEtBQUs7WUFDWixPQUFPLEVBQUUsT0FBTztTQUNuQixFQUFFO1lBQ0MsS0FBSyxFQUFFLGlCQUFpQjtZQUN4QixPQUFPLEVBQUUsZ0NBQWdDO1NBQzVDLEVBQUUsRUFBQyxZQUFZLEVBQUUseUJBQXlCLE9BQU8sRUFBRSxFQUFDLENBQUMsQ0FBQztRQUN2RCxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ1osTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsbUJBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztRQUMzRSxDQUFDO1FBQ0QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxlQUFTLENBQUMsWUFBWSxZQUFZLE9BQU8sVUFBVSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZGLENBQUM7Q0FDSixDQUFBO0FBZkc7SUFEQyxZQUFHLENBQUMsT0FBTyxDQUFDO0lBQ0gsV0FBQSxZQUFHLEVBQUUsQ0FBQTtJQUNMLFdBQUEsY0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQ2QsV0FBQSxjQUFLLENBQUMsU0FBUyxDQUFDLENBQUE7Ozs7NkNBWXpCO0FBakJRLGFBQWE7SUFGekIsb0JBQVUsQ0FBQyxjQUFjLENBQUM7SUFDMUIsbUJBQVUsQ0FBQyxjQUFjLENBQUM7R0FDZCxhQUFhLENBa0J6QjtBQWxCWSxzQ0FBYSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7Q29udHJvbGxlciwgR2V0LCBIdHRwU3RhdHVzLCBRdWVyeSwgUmVzfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XG5pbXBvcnQge0FwaVVzZVRhZ3N9IGZyb20gJ0BuZXN0anMvc3dhZ2dlcic7XG5pbXBvcnQge0VudkNvbmZpZ30gZnJvbSAnLi4vLi4vLi4vY29uZmlnL2Vudic7XG5pbXBvcnQge1ZhbGlkYXRvcn0gZnJvbSAnLi4vLi4vLi4vc2VydmljZXMvaGVscGVycy92YWxpZGF0aW9uLmhlbHBlcic7XG5cbkBBcGlVc2VUYWdzKCd2MS9hcGkvd29ybGQnKVxuQENvbnRyb2xsZXIoJ3YxL2FwaS93b3JsZCcpXG5leHBvcnQgY2xhc3MgV2ViQ29udHJvbGxlciB7XG5cbiAgICBAR2V0KCdlbnRlcicpXG4gICAgZ2V0RW50ZXIoQFJlcygpIHJlcyxcbiAgICAgICAgICAgICBAUXVlcnkoJ2V2ZW50JykgZXZlbnQ6IHN0cmluZyxcbiAgICAgICAgICAgICBAUXVlcnkoJ3NlcnZpY2UnKSBzZXJ2aWNlOiBzdHJpbmcpIHtcbiAgICAgICAgbGV0IHYgPSBuZXcgVmFsaWRhdG9yKHtcbiAgICAgICAgICAgIGV2ZW50OiBldmVudCxcbiAgICAgICAgICAgIHNlcnZpY2U6IHNlcnZpY2VcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgZXZlbnQ6ICdyZXF1aXJlZHxzdHJpbmcnLFxuICAgICAgICAgICAgc2VydmljZTogJ3JlcXVpcmVkfHN0cmluZ3xpbjprYXp0ZWwsZWdvdicsXG4gICAgICAgIH0sIHsnc2VydmljZS5pbic6IGBObyBzZXJ2aWNlIHdpdGggbmFtZTogJHtzZXJ2aWNlfWB9KTtcbiAgICAgICAgaWYgKHYuZmFpbHMoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoSHR0cFN0YXR1cy5VTlBST0NFU1NBQkxFX0VOVElUWSkuanNvbih2LmdldEVycm9ycygpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzLnJlZGlyZWN0KGAke0VudkNvbmZpZy5GUk9OVEVORF9BUEl9P3NlcnZpY2U9JHtzZXJ2aWNlfSZldmVudD0ke2V2ZW50fWApO1xuICAgIH1cbn0iXX0=