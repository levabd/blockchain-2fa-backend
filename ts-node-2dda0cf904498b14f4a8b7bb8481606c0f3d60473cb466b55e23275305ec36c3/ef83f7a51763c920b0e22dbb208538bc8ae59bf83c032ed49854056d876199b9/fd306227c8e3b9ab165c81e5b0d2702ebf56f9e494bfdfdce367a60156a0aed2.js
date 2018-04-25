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
const env_1 = require("../config/env");
const common_1 = require("@nestjs/common");
const queue_service_1 = require("../services/code_sender/queue.service");
const api_module_1 = require("./api/api.module");
const shared_module_1 = require("./shared/shared.module");
let ApplicationModule = class ApplicationModule {
    constructor(codeQueueListenerService) {
        this.codeQueueListenerService = codeQueueListenerService;
        for (let propName of Object.keys(env_1.EnvConfig)) {
            console.log(`${propName}:  ${env_1.EnvConfig[propName]}`);
        }
        this.codeQueueListenerService.listen();
    }
    configure(consumer) {
        return undefined;
    }
};
ApplicationModule = __decorate([
    common_1.Module({
        modules: [
            api_module_1.ApiModule,
            shared_module_1.SharedModule
        ],
        exports: [
            shared_module_1.SharedModule
        ]
    }),
    __metadata("design:paramtypes", [queue_service_1.CodeQueueListenerService])
], ApplicationModule);
exports.ApplicationModule = ApplicationModule;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9hcHAubW9kdWxlLnRzIiwic291cmNlcyI6WyIvaG9tZS9wZXNoa292L2Rldi9wcm9qZWN0cy9ibG9ja2NoYWluLTJmYS1iYWNrZW5kL3NyYy9tb2R1bGVzL2FwcC5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSx1Q0FBd0M7QUFDeEMsMkNBQTJEO0FBRzNELHlFQUErRTtBQUMvRSxpREFBMkM7QUFDM0MsMERBQW9EO0FBV3BELElBQWEsaUJBQWlCLEdBQTlCO0lBTUksWUFBb0Isd0JBQWtEO1FBQWxELDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMEI7UUFFbEUsR0FBRyxDQUFDLENBQUMsSUFBSSxRQUFRLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxlQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFFBQVEsTUFBTSxlQUFTLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3hELENBQUM7UUFHRCxJQUFJLENBQUMsd0JBQXdCLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDM0MsQ0FBQztJQUNELFNBQVMsQ0FBQyxRQUE2QjtRQUNuQyxNQUFNLENBQUMsU0FBUyxDQUFDO0lBQ3JCLENBQUM7Q0FDSixDQUFBO0FBbEJZLGlCQUFpQjtJQVQ3QixlQUFNLENBQUM7UUFDSixPQUFPLEVBQUU7WUFDTCxzQkFBUztZQUNULDRCQUFZO1NBQ2Y7UUFDRCxPQUFPLEVBQUU7WUFDTCw0QkFBWTtTQUNmO0tBQ0osQ0FBQztxQ0FPZ0Qsd0NBQXdCO0dBTjdELGlCQUFpQixDQWtCN0I7QUFsQlksOENBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtFbnZDb25maWd9IGZyb20gJy4uL2NvbmZpZy9lbnYnO1xuaW1wb3J0IHtNaWRkbGV3YXJlc0NvbnN1bWVyLCBNb2R1bGV9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcbmltcG9ydCB7TmVzdE1vZHVsZX0gZnJvbSAnQG5lc3Rqcy9jb21tb24vaW50ZXJmYWNlcyc7XG5cbmltcG9ydCB7Q29kZVF1ZXVlTGlzdGVuZXJTZXJ2aWNlfSBmcm9tICcuLi9zZXJ2aWNlcy9jb2RlX3NlbmRlci9xdWV1ZS5zZXJ2aWNlJztcbmltcG9ydCB7QXBpTW9kdWxlfSBmcm9tICcuL2FwaS9hcGkubW9kdWxlJztcbmltcG9ydCB7U2hhcmVkTW9kdWxlfSBmcm9tICcuL3NoYXJlZC9zaGFyZWQubW9kdWxlJztcblxuQE1vZHVsZSh7XG4gICAgbW9kdWxlczogW1xuICAgICAgICBBcGlNb2R1bGUsXG4gICAgICAgIFNoYXJlZE1vZHVsZVxuICAgIF0sXG4gICAgZXhwb3J0czogW1xuICAgICAgICBTaGFyZWRNb2R1bGVcbiAgICBdXG59KVxuZXhwb3J0IGNsYXNzIEFwcGxpY2F0aW9uTW9kdWxlIGltcGxlbWVudHMgTmVzdE1vZHVsZSB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBBcHBsaWNhdGlvbk1vZHVsZS5cbiAgICAgKiBAcGFyYW0gY29kZVF1ZXVlTGlzdGVuZXJTZXJ2aWNlXG4gICAgICogQG1lbWJlcm9mIEFwcGxpY2F0aW9uTW9kdWxlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBjb2RlUXVldWVMaXN0ZW5lclNlcnZpY2U6IENvZGVRdWV1ZUxpc3RlbmVyU2VydmljZSkge1xuICAgICAgICAvLyBsaXN0IGVudiBrZXlzIGluIGNsaVxuICAgICAgICBmb3IgKGxldCBwcm9wTmFtZSBvZiBPYmplY3Qua2V5cyhFbnZDb25maWcpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgJHtwcm9wTmFtZX06ICAke0VudkNvbmZpZ1twcm9wTmFtZV19YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpbml0IHF1ZXVlIGxpc3RlbmVyXG4gICAgICAgIHRoaXMuY29kZVF1ZXVlTGlzdGVuZXJTZXJ2aWNlLmxpc3RlbigpO1xuICAgIH1cbiAgICBjb25maWd1cmUoY29uc3VtZXI6IE1pZGRsZXdhcmVzQ29uc3VtZXIpOiBNaWRkbGV3YXJlc0NvbnN1bWVyIHwgdm9pZCB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxufVxuIl19