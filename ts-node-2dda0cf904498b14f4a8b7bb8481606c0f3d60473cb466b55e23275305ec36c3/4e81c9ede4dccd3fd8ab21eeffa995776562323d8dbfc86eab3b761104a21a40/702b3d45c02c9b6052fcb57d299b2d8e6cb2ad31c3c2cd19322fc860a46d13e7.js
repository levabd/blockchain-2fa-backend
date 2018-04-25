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
const verification_controller_1 = require("./controllsers/verification.controller");
const web_controller_1 = require("./controllsers/web.controller");
const api_key_checker_middleware_1 = require("./middleware/api.key.checker.middleware");
const frontend_api_key_checker_middleware_1 = require("./middleware/frontend.api.key.checker.middleware");
let ApiModule = class ApiModule {
    configure(consumer) {
        consumer.apply(json_middleware_1.JsonMiddleware).forRoutes(user_controller_1.UserController);
        consumer.apply(api_key_checker_middleware_1.ApiKeyCheckerMiddleware).forRoutes(user_controller_1.UserController);
        consumer.apply(frontend_api_key_checker_middleware_1.FrontendApiKeyCheckerMiddleware).forRoutes(verification_controller_1.VerificationController);
        consumer.apply(logger_middleware_1.LoggerMiddleware).forRoutes(user_controller_1.UserController);
    }
};
ApiModule = __decorate([
    common_1.Module({
        controllers: [
            user_controller_1.UserController,
            verification_controller_1.VerificationController,
            web_controller_1.WebController,
            sms_callback_controller_1.SmsCallbackController
        ],
        imports: [
            shared_module_1.SharedModule
        ]
    })
], ApiModule);
exports.ApiModule = ApiModule;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvYXBpLm1vZHVsZS50cyIsInNvdXJjZXMiOlsiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvYXBpLm1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBLDJDQUEyRDtBQUMzRCxvRUFBOEQ7QUFDOUQsd0ZBQWlGO0FBQ2pGLDJEQUFxRDtBQUVyRCxzRUFBZ0U7QUFDaEUsa0VBQTREO0FBQzVELG9GQUE4RTtBQUM5RSxrRUFBNEQ7QUFDNUQsd0ZBQWdGO0FBQ2hGLDBHQUFpRztBQWFqRyxJQUFhLFNBQVMsR0FBdEI7SUFDSSxTQUFTLENBQUMsUUFBNkI7UUFDbkMsUUFBUSxDQUFDLEtBQUssQ0FBQyxnQ0FBYyxDQUFDLENBQUMsU0FBUyxDQUFDLGdDQUFjLENBQUMsQ0FBQztRQUN6RCxRQUFRLENBQUMsS0FBSyxDQUFDLG9EQUF1QixDQUFDLENBQUMsU0FBUyxDQUFDLGdDQUFjLENBQUMsQ0FBQztRQUNsRSxRQUFRLENBQUMsS0FBSyxDQUFDLHFFQUErQixDQUFDLENBQUMsU0FBUyxDQUFDLGdEQUFzQixDQUFDLENBQUM7UUFDbEYsUUFBUSxDQUFDLEtBQUssQ0FBQyxvQ0FBZ0IsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxnQ0FBYyxDQUFDLENBQUM7SUFDL0QsQ0FBQztDQUNKLENBQUE7QUFQWSxTQUFTO0lBWHJCLGVBQU0sQ0FBQztRQUNKLFdBQVcsRUFBRTtZQUNULGdDQUFjO1lBQ2QsZ0RBQXNCO1lBQ3RCLDhCQUFhO1lBQ2IsK0NBQXFCO1NBQ3hCO1FBQ0QsT0FBTyxFQUFFO1lBQ0wsNEJBQVk7U0FDZjtLQUNKLENBQUM7R0FDVyxTQUFTLENBT3JCO0FBUFksOEJBQVMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge01pZGRsZXdhcmVzQ29uc3VtZXIsIE1vZHVsZX0gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xuaW1wb3J0IHtVc2VyQ29udHJvbGxlcn0gZnJvbSAnLi9jb250cm9sbHNlcnMvdXNlci5jb250cm9sbGVyJztcbmltcG9ydCB7U21zQ2FsbGJhY2tDb250cm9sbGVyfSBmcm9tICcuL2NvbnRyb2xsc2Vycy9zbXMvc21zLmNhbGxiYWNrLmNvbnRyb2xsZXInO1xuaW1wb3J0IHtTaGFyZWRNb2R1bGV9IGZyb20gJy4uL3NoYXJlZC9zaGFyZWQubW9kdWxlJztcbmltcG9ydCB7TmVzdE1vZHVsZX0gZnJvbSAnQG5lc3Rqcy9jb21tb24vaW50ZXJmYWNlcyc7XG5pbXBvcnQge0xvZ2dlck1pZGRsZXdhcmV9IGZyb20gJy4vbWlkZGxld2FyZS9sb2dnZXIubWlkZGxld2FyZSc7XG5pbXBvcnQge0pzb25NaWRkbGV3YXJlfSBmcm9tICcuL21pZGRsZXdhcmUvanNvbi5taWRkbGV3YXJlJztcbmltcG9ydCB7VmVyaWZpY2F0aW9uQ29udHJvbGxlcn0gZnJvbSAnLi9jb250cm9sbHNlcnMvdmVyaWZpY2F0aW9uLmNvbnRyb2xsZXInO1xuaW1wb3J0IHtXZWJDb250cm9sbGVyfSBmcm9tICcuL2NvbnRyb2xsc2Vycy93ZWIuY29udHJvbGxlcic7XG5pbXBvcnQge0FwaUtleUNoZWNrZXJNaWRkbGV3YXJlfSBmcm9tICcuL21pZGRsZXdhcmUvYXBpLmtleS5jaGVja2VyLm1pZGRsZXdhcmUnO1xuaW1wb3J0IHtGcm9udGVuZEFwaUtleUNoZWNrZXJNaWRkbGV3YXJlfSBmcm9tICcuL21pZGRsZXdhcmUvZnJvbnRlbmQuYXBpLmtleS5jaGVja2VyLm1pZGRsZXdhcmUnO1xuXG5ATW9kdWxlKHtcbiAgICBjb250cm9sbGVyczogW1xuICAgICAgICBVc2VyQ29udHJvbGxlcixcbiAgICAgICAgVmVyaWZpY2F0aW9uQ29udHJvbGxlcixcbiAgICAgICAgV2ViQ29udHJvbGxlcixcbiAgICAgICAgU21zQ2FsbGJhY2tDb250cm9sbGVyXG4gICAgXSxcbiAgICBpbXBvcnRzOiBbXG4gICAgICAgIFNoYXJlZE1vZHVsZVxuICAgIF1cbn0pXG5leHBvcnQgY2xhc3MgQXBpTW9kdWxlIGltcGxlbWVudHMgTmVzdE1vZHVsZXtcbiAgICBjb25maWd1cmUoY29uc3VtZXI6IE1pZGRsZXdhcmVzQ29uc3VtZXIpOiBNaWRkbGV3YXJlc0NvbnN1bWVyIHwgdm9pZCB7XG4gICAgICAgIGNvbnN1bWVyLmFwcGx5KEpzb25NaWRkbGV3YXJlKS5mb3JSb3V0ZXMoVXNlckNvbnRyb2xsZXIpO1xuICAgICAgICBjb25zdW1lci5hcHBseShBcGlLZXlDaGVja2VyTWlkZGxld2FyZSkuZm9yUm91dGVzKFVzZXJDb250cm9sbGVyKTtcbiAgICAgICAgY29uc3VtZXIuYXBwbHkoRnJvbnRlbmRBcGlLZXlDaGVja2VyTWlkZGxld2FyZSkuZm9yUm91dGVzKFZlcmlmaWNhdGlvbkNvbnRyb2xsZXIpO1xuICAgICAgICBjb25zdW1lci5hcHBseShMb2dnZXJNaWRkbGV3YXJlKS5mb3JSb3V0ZXMoVXNlckNvbnRyb2xsZXIpO1xuICAgIH1cbn0iXX0=