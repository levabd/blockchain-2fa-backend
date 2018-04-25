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
const service_model_1 = require("./service.model");
const env_1 = require("../env");
const common_1 = require("@nestjs/common");
let ClientService = class ClientService {
    constructor() {
        this.services = [];
        this.services.push(new service_model_1.Service('kaztel', env_1.EnvConfig.KAZTEL_FAMILY_NAME, env_1.EnvConfig.KAZTEL_FAMILY_VERSION), new service_model_1.Service('egov', env_1.EnvConfig.EGOV_FAMILY_NAME, env_1.EnvConfig.EGOV_FAMILY_VERSION));
    }
    getAll() {
        return this.services;
    }
    getService(name) {
        let servise;
        let nameLowerCase = name.toLowerCase();
        this.services.forEach(function (service) {
            if (service.getName().toLowerCase() === nameLowerCase) {
                servise = service;
            }
        });
        return servise;
    }
    serviceWithNameExists(name) {
        let found = false;
        let nameLowerCase = name.toLowerCase();
        this.services.forEach(function (service) {
            if (service.getName().toLowerCase() === nameLowerCase) {
                found = true;
            }
        });
        return found;
    }
};
ClientService = __decorate([
    common_1.Component(),
    __metadata("design:paramtypes", [])
], ClientService);
exports.ClientService = ClientService;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvY29uZmlnL3NlcnZpY2VzL3NlcnZpY2VzLnRzIiwic291cmNlcyI6WyIvaG9tZS9wZXNoa292L2Rldi9wcm9qZWN0cy9ibG9ja2NoYWluLTJmYS1iYWNrZW5kL3NyYy9jb25maWcvc2VydmljZXMvc2VydmljZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSxtREFBd0M7QUFDeEMsZ0NBQWlDO0FBQ2pDLDJDQUF5QztBQUd6QyxJQUFhLGFBQWEsR0FBMUI7SUFJSTtRQUZRLGFBQVEsR0FBRyxFQUFFLENBQUM7UUFHbEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQ2QsSUFBSSx1QkFBTyxDQUNQLFFBQVEsRUFDUixlQUFTLENBQUMsa0JBQWtCLEVBQzVCLGVBQVMsQ0FBQyxxQkFBcUIsQ0FDbEMsRUFDRCxJQUFJLHVCQUFPLENBQ1AsTUFBTSxFQUNOLGVBQVMsQ0FBQyxnQkFBZ0IsRUFDMUIsZUFBUyxDQUFDLG1CQUFtQixDQUNoQyxDQUNKLENBQUM7SUFDTixDQUFDO0lBRUQsTUFBTTtRQUNGLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO0lBQ3pCLENBQUM7SUFFRCxVQUFVLENBQUMsSUFBWTtRQUNuQixJQUFJLE9BQU8sQ0FBQztRQUNaLElBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUN2QyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFVLE9BQU87WUFDbkMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLFdBQVcsRUFBRSxLQUFLLGFBQWEsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BELE9BQU8sR0FBRyxPQUFPLENBQUM7WUFDdEIsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxDQUFDLE9BQU8sQ0FBQztJQUNuQixDQUFDO0lBRUQscUJBQXFCLENBQUMsSUFBWTtRQUM5QixJQUFJLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDbEIsSUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFVBQVUsT0FBTztZQUNuQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsV0FBVyxFQUFFLEtBQUssYUFBYSxDQUFDLENBQUMsQ0FBQztnQkFDcEQsS0FBSyxHQUFHLElBQUksQ0FBQztZQUNqQixDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxNQUFNLENBQUMsS0FBSyxDQUFDO0lBQ2pCLENBQUM7Q0FDSixDQUFBO0FBN0NZLGFBQWE7SUFEekIsa0JBQVMsRUFBRTs7R0FDQyxhQUFhLENBNkN6QjtBQTdDWSxzQ0FBYSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7U2VydmljZX0gZnJvbSAnLi9zZXJ2aWNlLm1vZGVsJztcbmltcG9ydCB7RW52Q29uZmlnfSBmcm9tICcuLi9lbnYnO1xuaW1wb3J0IHtDb21wb25lbnR9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcblxuQENvbXBvbmVudCgpXG5leHBvcnQgY2xhc3MgQ2xpZW50U2VydmljZSB7XG5cbiAgICBwcml2YXRlIHNlcnZpY2VzID0gW107XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5zZXJ2aWNlcy5wdXNoKFxuICAgICAgICAgICAgbmV3IFNlcnZpY2UoXG4gICAgICAgICAgICAgICAgJ2thenRlbCcsXG4gICAgICAgICAgICAgICAgRW52Q29uZmlnLktBWlRFTF9GQU1JTFlfTkFNRSxcbiAgICAgICAgICAgICAgICBFbnZDb25maWcuS0FaVEVMX0ZBTUlMWV9WRVJTSU9OXG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgbmV3IFNlcnZpY2UoXG4gICAgICAgICAgICAgICAgJ2Vnb3YnLFxuICAgICAgICAgICAgICAgIEVudkNvbmZpZy5FR09WX0ZBTUlMWV9OQU1FLFxuICAgICAgICAgICAgICAgIEVudkNvbmZpZy5FR09WX0ZBTUlMWV9WRVJTSU9OXG4gICAgICAgICAgICApLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIGdldEFsbCgpOiBTZXJ2aWNlW10ge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXJ2aWNlcztcbiAgICB9XG5cbiAgICBnZXRTZXJ2aWNlKG5hbWU6IHN0cmluZyk6IFNlcnZpY2Uge1xuICAgICAgICBsZXQgc2VydmlzZTtcbiAgICAgICAgbGV0IG5hbWVMb3dlckNhc2UgPSBuYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHRoaXMuc2VydmljZXMuZm9yRWFjaChmdW5jdGlvbiAoc2VydmljZSkge1xuICAgICAgICAgICAgaWYgKHNlcnZpY2UuZ2V0TmFtZSgpLnRvTG93ZXJDYXNlKCkgPT09IG5hbWVMb3dlckNhc2UpIHtcbiAgICAgICAgICAgICAgICBzZXJ2aXNlID0gc2VydmljZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBzZXJ2aXNlO1xuICAgIH1cblxuICAgIHNlcnZpY2VXaXRoTmFtZUV4aXN0cyhuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgbGV0IGZvdW5kID0gZmFsc2U7XG4gICAgICAgIGxldCBuYW1lTG93ZXJDYXNlID0gbmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB0aGlzLnNlcnZpY2VzLmZvckVhY2goZnVuY3Rpb24gKHNlcnZpY2UpIHtcbiAgICAgICAgICAgIGlmIChzZXJ2aWNlLmdldE5hbWUoKS50b0xvd2VyQ2FzZSgpID09PSBuYW1lTG93ZXJDYXNlKSB7XG4gICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgfVxufSJdfQ==