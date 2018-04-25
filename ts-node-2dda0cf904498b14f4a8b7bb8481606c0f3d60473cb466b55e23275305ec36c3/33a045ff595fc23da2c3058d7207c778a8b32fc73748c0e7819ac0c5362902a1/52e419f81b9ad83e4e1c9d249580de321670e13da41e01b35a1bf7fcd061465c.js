"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const user_controller_1 = require("./controllsers/user.controller");
const sms_callback_controller_1 = require("./controllsers/sms/sms.callback.controller");
const shared_module_1 = require("../shared/shared.module");
const logger_middleware_1 = require("./middleware/logger.middleware");
const json_middleware_1 = require("./middleware/json.middleware");
const web_controller_1 = require("./controllsers/web.controller");
const api_key_checker_middleware_1 = require("./middleware/api.key.checker.middleware");
const frontend_api_key_checker_middleware_1 = require("./middleware/frontend.api.key.checker.middleware");
let ApiModule = class ApiModule {
    configure(consumer) {
        consumer.apply(json_middleware_1.JsonMiddleware).forRoutes(user_controller_1.UserController);
        consumer.apply(api_key_checker_middleware_1.ApiKeyCheckerMiddleware).forRoutes(user_controller_1.UserController);
        consumer.apply(frontend_api_key_checker_middleware_1.FrontendApiKeyCheckerMiddleware).forRoutes({ path: '/v1/api/web/code', method: common_1.RequestMethod.POST }, { path: '/v1/api/web/verify/code', method: common_1.RequestMethod.POST }, { path: '/v1/api/web/verify/user', method: common_1.RequestMethod.POST }, { path: '/v1/api/web/check-push-verification', method: common_1.RequestMethod.POST });
        consumer.apply(logger_middleware_1.LoggerMiddleware).forRoutes(user_controller_1.UserController);
    }
};
ApiModule = __decorate([
    common_1.Module({
        controllers: [
            user_controller_1.UserController,
            web_controller_1.WebController,
            sms_callback_controller_1.SmsCallbackController
        ],
        imports: [
            shared_module_1.SharedModule
        ]
    })
], ApiModule);
exports.ApiModule = ApiModule;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvYXBpLm1vZHVsZS50cyIsInNvdXJjZXMiOlsiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvYXBpLm1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBLDJDQUEwRTtBQUMxRSxvRUFBOEQ7QUFDOUQsd0ZBQWlGO0FBQ2pGLDJEQUFxRDtBQUVyRCxzRUFBZ0U7QUFDaEUsa0VBQTREO0FBQzVELGtFQUE0RDtBQUM1RCx3RkFBZ0Y7QUFDaEYsMEdBQWlHO0FBWWpHLElBQWEsU0FBUyxHQUF0QjtJQUNJLFNBQVMsQ0FBQyxRQUE2QjtRQUNuQyxRQUFRLENBQUMsS0FBSyxDQUFDLGdDQUFjLENBQUMsQ0FBQyxTQUFTLENBQUMsZ0NBQWMsQ0FBQyxDQUFDO1FBQ3pELFFBQVEsQ0FBQyxLQUFLLENBQUMsb0RBQXVCLENBQUMsQ0FBQyxTQUFTLENBQUMsZ0NBQWMsQ0FBQyxDQUFDO1FBQ2xFLFFBQVEsQ0FBQyxLQUFLLENBQUMscUVBQStCLENBQUMsQ0FBQyxTQUFTLENBQ3JELEVBQUUsSUFBSSxFQUFFLGtCQUFrQixFQUFFLE1BQU0sRUFBRSxzQkFBYSxDQUFDLElBQUksRUFBRSxFQUN4RCxFQUFFLElBQUksRUFBRSx5QkFBeUIsRUFBRSxNQUFNLEVBQUUsc0JBQWEsQ0FBQyxJQUFJLEVBQUUsRUFDL0QsRUFBRSxJQUFJLEVBQUUseUJBQXlCLEVBQUUsTUFBTSxFQUFFLHNCQUFhLENBQUMsSUFBSSxFQUFFLEVBQy9ELEVBQUUsSUFBSSxFQUFFLHFDQUFxQyxFQUFFLE1BQU0sRUFBRSxzQkFBYSxDQUFDLElBQUksRUFBRSxDQUM5RSxDQUFDO1FBQ0YsUUFBUSxDQUFDLEtBQUssQ0FBQyxvQ0FBZ0IsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxnQ0FBYyxDQUFDLENBQUM7SUFDL0QsQ0FBQztDQUNKLENBQUE7QUFaWSxTQUFTO0lBVnJCLGVBQU0sQ0FBQztRQUNKLFdBQVcsRUFBRTtZQUNULGdDQUFjO1lBQ2QsOEJBQWE7WUFDYiwrQ0FBcUI7U0FDeEI7UUFDRCxPQUFPLEVBQUU7WUFDTCw0QkFBWTtTQUNmO0tBQ0osQ0FBQztHQUNXLFNBQVMsQ0FZckI7QUFaWSw4QkFBUyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7TWlkZGxld2FyZXNDb25zdW1lciwgTW9kdWxlLCBSZXF1ZXN0TWV0aG9kfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XG5pbXBvcnQge1VzZXJDb250cm9sbGVyfSBmcm9tICcuL2NvbnRyb2xsc2Vycy91c2VyLmNvbnRyb2xsZXInO1xuaW1wb3J0IHtTbXNDYWxsYmFja0NvbnRyb2xsZXJ9IGZyb20gJy4vY29udHJvbGxzZXJzL3Ntcy9zbXMuY2FsbGJhY2suY29udHJvbGxlcic7XG5pbXBvcnQge1NoYXJlZE1vZHVsZX0gZnJvbSAnLi4vc2hhcmVkL3NoYXJlZC5tb2R1bGUnO1xuaW1wb3J0IHtOZXN0TW9kdWxlfSBmcm9tICdAbmVzdGpzL2NvbW1vbi9pbnRlcmZhY2VzJztcbmltcG9ydCB7TG9nZ2VyTWlkZGxld2FyZX0gZnJvbSAnLi9taWRkbGV3YXJlL2xvZ2dlci5taWRkbGV3YXJlJztcbmltcG9ydCB7SnNvbk1pZGRsZXdhcmV9IGZyb20gJy4vbWlkZGxld2FyZS9qc29uLm1pZGRsZXdhcmUnO1xuaW1wb3J0IHtXZWJDb250cm9sbGVyfSBmcm9tICcuL2NvbnRyb2xsc2Vycy93ZWIuY29udHJvbGxlcic7XG5pbXBvcnQge0FwaUtleUNoZWNrZXJNaWRkbGV3YXJlfSBmcm9tICcuL21pZGRsZXdhcmUvYXBpLmtleS5jaGVja2VyLm1pZGRsZXdhcmUnO1xuaW1wb3J0IHtGcm9udGVuZEFwaUtleUNoZWNrZXJNaWRkbGV3YXJlfSBmcm9tICcuL21pZGRsZXdhcmUvZnJvbnRlbmQuYXBpLmtleS5jaGVja2VyLm1pZGRsZXdhcmUnO1xuXG5ATW9kdWxlKHtcbiAgICBjb250cm9sbGVyczogW1xuICAgICAgICBVc2VyQ29udHJvbGxlcixcbiAgICAgICAgV2ViQ29udHJvbGxlcixcbiAgICAgICAgU21zQ2FsbGJhY2tDb250cm9sbGVyXG4gICAgXSxcbiAgICBpbXBvcnRzOiBbXG4gICAgICAgIFNoYXJlZE1vZHVsZVxuICAgIF1cbn0pXG5leHBvcnQgY2xhc3MgQXBpTW9kdWxlIGltcGxlbWVudHMgTmVzdE1vZHVsZXtcbiAgICBjb25maWd1cmUoY29uc3VtZXI6IE1pZGRsZXdhcmVzQ29uc3VtZXIpOiBNaWRkbGV3YXJlc0NvbnN1bWVyIHwgdm9pZCB7XG4gICAgICAgIGNvbnN1bWVyLmFwcGx5KEpzb25NaWRkbGV3YXJlKS5mb3JSb3V0ZXMoVXNlckNvbnRyb2xsZXIpO1xuICAgICAgICBjb25zdW1lci5hcHBseShBcGlLZXlDaGVja2VyTWlkZGxld2FyZSkuZm9yUm91dGVzKFVzZXJDb250cm9sbGVyKTtcbiAgICAgICAgY29uc3VtZXIuYXBwbHkoRnJvbnRlbmRBcGlLZXlDaGVja2VyTWlkZGxld2FyZSkuZm9yUm91dGVzKFxuICAgICAgICAgICAgeyBwYXRoOiAnL3YxL2FwaS93ZWIvY29kZScsIG1ldGhvZDogUmVxdWVzdE1ldGhvZC5QT1NUIH0sXG4gICAgICAgICAgICB7IHBhdGg6ICcvdjEvYXBpL3dlYi92ZXJpZnkvY29kZScsIG1ldGhvZDogUmVxdWVzdE1ldGhvZC5QT1NUIH0sXG4gICAgICAgICAgICB7IHBhdGg6ICcvdjEvYXBpL3dlYi92ZXJpZnkvdXNlcicsIG1ldGhvZDogUmVxdWVzdE1ldGhvZC5QT1NUIH0sXG4gICAgICAgICAgICB7IHBhdGg6ICcvdjEvYXBpL3dlYi9jaGVjay1wdXNoLXZlcmlmaWNhdGlvbicsIG1ldGhvZDogUmVxdWVzdE1ldGhvZC5QT1NUIH0sXG4gICAgICAgICk7XG4gICAgICAgIGNvbnN1bWVyLmFwcGx5KExvZ2dlck1pZGRsZXdhcmUpLmZvclJvdXRlcyhVc2VyQ29udHJvbGxlcik7XG4gICAgfVxufSJdfQ==