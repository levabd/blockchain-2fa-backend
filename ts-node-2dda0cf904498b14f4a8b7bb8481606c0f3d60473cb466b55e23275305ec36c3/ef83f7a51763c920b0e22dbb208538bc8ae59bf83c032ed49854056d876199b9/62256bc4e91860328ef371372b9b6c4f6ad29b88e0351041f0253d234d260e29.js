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
        consumer.apply(frontend_api_key_checker_middleware_1.FrontendApiKeyCheckerMiddleware).forRoutes([
            { path: '/v1/api/web/code', method: common_1.RequestMethod.POST },
            { path: '/v1/api/web/verify/code', method: common_1.RequestMethod.POST },
            { path: '/v1/api/web/verify/user', method: common_1.RequestMethod.POST },
            { path: '/v1/api/web/check-push-verification', method: common_1.RequestMethod.POST },
        ]);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvYXBpLm1vZHVsZS50cyIsInNvdXJjZXMiOlsiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcGkvYXBpLm1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBLDJDQUEwRTtBQUMxRSxvRUFBOEQ7QUFDOUQsd0ZBQWlGO0FBQ2pGLDJEQUFxRDtBQUVyRCxzRUFBZ0U7QUFDaEUsa0VBQTREO0FBQzVELGtFQUE0RDtBQUM1RCx3RkFBZ0Y7QUFDaEYsMEdBQWlHO0FBWWpHLElBQWEsU0FBUyxHQUF0QjtJQUNJLFNBQVMsQ0FBQyxRQUE2QjtRQUNuQyxRQUFRLENBQUMsS0FBSyxDQUFDLGdDQUFjLENBQUMsQ0FBQyxTQUFTLENBQUMsZ0NBQWMsQ0FBQyxDQUFDO1FBQ3pELFFBQVEsQ0FBQyxLQUFLLENBQUMsb0RBQXVCLENBQUMsQ0FBQyxTQUFTLENBQUMsZ0NBQWMsQ0FBQyxDQUFDO1FBQ2xFLFFBQVEsQ0FBQyxLQUFLLENBQUMscUVBQStCLENBQUMsQ0FBQyxTQUFTLENBQUM7WUFDdEQsRUFBRSxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxFQUFFLHNCQUFhLENBQUMsSUFBSSxFQUFFO1lBQ3hELEVBQUUsSUFBSSxFQUFFLHlCQUF5QixFQUFFLE1BQU0sRUFBRSxzQkFBYSxDQUFDLElBQUksRUFBRTtZQUMvRCxFQUFFLElBQUksRUFBRSx5QkFBeUIsRUFBRSxNQUFNLEVBQUUsc0JBQWEsQ0FBQyxJQUFJLEVBQUU7WUFDL0QsRUFBRSxJQUFJLEVBQUUscUNBQXFDLEVBQUUsTUFBTSxFQUFFLHNCQUFhLENBQUMsSUFBSSxFQUFFO1NBQzlFLENBQUMsQ0FBQztRQUNILFFBQVEsQ0FBQyxLQUFLLENBQUMsb0NBQWdCLENBQUMsQ0FBQyxTQUFTLENBQUMsZ0NBQWMsQ0FBQyxDQUFDO0lBQy9ELENBQUM7Q0FDSixDQUFBO0FBWlksU0FBUztJQVZyQixlQUFNLENBQUM7UUFDSixXQUFXLEVBQUU7WUFDVCxnQ0FBYztZQUNkLDhCQUFhO1lBQ2IsK0NBQXFCO1NBQ3hCO1FBQ0QsT0FBTyxFQUFFO1lBQ0wsNEJBQVk7U0FDZjtLQUNKLENBQUM7R0FDVyxTQUFTLENBWXJCO0FBWlksOEJBQVMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge01pZGRsZXdhcmVzQ29uc3VtZXIsIE1vZHVsZSwgUmVxdWVzdE1ldGhvZH0gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xuaW1wb3J0IHtVc2VyQ29udHJvbGxlcn0gZnJvbSAnLi9jb250cm9sbHNlcnMvdXNlci5jb250cm9sbGVyJztcbmltcG9ydCB7U21zQ2FsbGJhY2tDb250cm9sbGVyfSBmcm9tICcuL2NvbnRyb2xsc2Vycy9zbXMvc21zLmNhbGxiYWNrLmNvbnRyb2xsZXInO1xuaW1wb3J0IHtTaGFyZWRNb2R1bGV9IGZyb20gJy4uL3NoYXJlZC9zaGFyZWQubW9kdWxlJztcbmltcG9ydCB7TmVzdE1vZHVsZX0gZnJvbSAnQG5lc3Rqcy9jb21tb24vaW50ZXJmYWNlcyc7XG5pbXBvcnQge0xvZ2dlck1pZGRsZXdhcmV9IGZyb20gJy4vbWlkZGxld2FyZS9sb2dnZXIubWlkZGxld2FyZSc7XG5pbXBvcnQge0pzb25NaWRkbGV3YXJlfSBmcm9tICcuL21pZGRsZXdhcmUvanNvbi5taWRkbGV3YXJlJztcbmltcG9ydCB7V2ViQ29udHJvbGxlcn0gZnJvbSAnLi9jb250cm9sbHNlcnMvd2ViLmNvbnRyb2xsZXInO1xuaW1wb3J0IHtBcGlLZXlDaGVja2VyTWlkZGxld2FyZX0gZnJvbSAnLi9taWRkbGV3YXJlL2FwaS5rZXkuY2hlY2tlci5taWRkbGV3YXJlJztcbmltcG9ydCB7RnJvbnRlbmRBcGlLZXlDaGVja2VyTWlkZGxld2FyZX0gZnJvbSAnLi9taWRkbGV3YXJlL2Zyb250ZW5kLmFwaS5rZXkuY2hlY2tlci5taWRkbGV3YXJlJztcblxuQE1vZHVsZSh7XG4gICAgY29udHJvbGxlcnM6IFtcbiAgICAgICAgVXNlckNvbnRyb2xsZXIsXG4gICAgICAgIFdlYkNvbnRyb2xsZXIsXG4gICAgICAgIFNtc0NhbGxiYWNrQ29udHJvbGxlclxuICAgIF0sXG4gICAgaW1wb3J0czogW1xuICAgICAgICBTaGFyZWRNb2R1bGVcbiAgICBdXG59KVxuZXhwb3J0IGNsYXNzIEFwaU1vZHVsZSBpbXBsZW1lbnRzIE5lc3RNb2R1bGV7XG4gICAgY29uZmlndXJlKGNvbnN1bWVyOiBNaWRkbGV3YXJlc0NvbnN1bWVyKTogTWlkZGxld2FyZXNDb25zdW1lciB8IHZvaWQge1xuICAgICAgICBjb25zdW1lci5hcHBseShKc29uTWlkZGxld2FyZSkuZm9yUm91dGVzKFVzZXJDb250cm9sbGVyKTtcbiAgICAgICAgY29uc3VtZXIuYXBwbHkoQXBpS2V5Q2hlY2tlck1pZGRsZXdhcmUpLmZvclJvdXRlcyhVc2VyQ29udHJvbGxlcik7XG4gICAgICAgIGNvbnN1bWVyLmFwcGx5KEZyb250ZW5kQXBpS2V5Q2hlY2tlck1pZGRsZXdhcmUpLmZvclJvdXRlcyhbXG4gICAgICAgICAgICB7IHBhdGg6ICcvdjEvYXBpL3dlYi9jb2RlJywgbWV0aG9kOiBSZXF1ZXN0TWV0aG9kLlBPU1QgfSxcbiAgICAgICAgICAgIHsgcGF0aDogJy92MS9hcGkvd2ViL3ZlcmlmeS9jb2RlJywgbWV0aG9kOiBSZXF1ZXN0TWV0aG9kLlBPU1QgfSxcbiAgICAgICAgICAgIHsgcGF0aDogJy92MS9hcGkvd2ViL3ZlcmlmeS91c2VyJywgbWV0aG9kOiBSZXF1ZXN0TWV0aG9kLlBPU1QgfSxcbiAgICAgICAgICAgIHsgcGF0aDogJy92MS9hcGkvd2ViL2NoZWNrLXB1c2gtdmVyaWZpY2F0aW9uJywgbWV0aG9kOiBSZXF1ZXN0TWV0aG9kLlBPU1QgfSxcbiAgICAgICAgXSk7XG4gICAgICAgIGNvbnN1bWVyLmFwcGx5KExvZ2dlck1pZGRsZXdhcmUpLmZvclJvdXRlcyhVc2VyQ29udHJvbGxlcik7XG4gICAgfVxufSJdfQ==