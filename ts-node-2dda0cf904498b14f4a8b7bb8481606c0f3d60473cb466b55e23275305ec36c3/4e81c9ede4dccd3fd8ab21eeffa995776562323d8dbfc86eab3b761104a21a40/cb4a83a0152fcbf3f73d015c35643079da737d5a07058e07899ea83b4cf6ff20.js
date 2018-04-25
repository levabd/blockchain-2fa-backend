"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const time_helper_1 = require("../../services/helpers/time.helper");
const services_1 = require("../../config/services/services");
const tfa_transaction_family_1 = require("./families/tfa.transaction.family");
const queue_service_1 = require("../../services/code_sender/queue.service");
const chain_service_1 = require("../../services/sawtooth/chain.service");
const kaztel_transaction_family_1 = require("./families/kaztel.transaction.family");
const egov_transaction_family_1 = require("./families/egov.transaction.family");
const telegram_server_1 = require("../../services/telegram/telegram.server");
let SharedModule = class SharedModule {
};
SharedModule = __decorate([
    common_1.Module({
        components: [
            services_1.ClientService,
            tfa_transaction_family_1.TfaTransactionFamily,
            kaztel_transaction_family_1.KaztelTransactionFamily,
            egov_transaction_family_1.EgovTransactionFamily,
            queue_service_1.CodeQueueListenerService,
            chain_service_1.ChainService,
            time_helper_1.TimeHelper,
            telegram_server_1.TelegramServer
        ],
        exports: [
            services_1.ClientService,
            tfa_transaction_family_1.TfaTransactionFamily,
            kaztel_transaction_family_1.KaztelTransactionFamily,
            egov_transaction_family_1.EgovTransactionFamily,
            queue_service_1.CodeQueueListenerService,
            chain_service_1.ChainService,
            time_helper_1.TimeHelper,
            telegram_server_1.TelegramServer
        ]
    })
], SharedModule);
exports.SharedModule = SharedModule;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9zaGFyZWQvc2hhcmVkLm1vZHVsZS50cyIsInNvdXJjZXMiOlsiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9zaGFyZWQvc2hhcmVkLm1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBLDJDQUF3QztBQUN4QyxvRUFBOEQ7QUFDOUQsNkRBQTZEO0FBQzdELDhFQUF1RTtBQUN2RSw0RUFBa0Y7QUFDbEYseUVBQW1FO0FBQ25FLG9GQUE2RTtBQUM3RSxnRkFBeUU7QUFDekUsNkVBQXVFO0FBd0J2RSxJQUFhLFlBQVksR0FBekI7Q0FBNEIsQ0FBQTtBQUFmLFlBQVk7SUF0QnhCLGVBQU0sQ0FBQztRQUNKLFVBQVUsRUFBQztZQUNQLHdCQUFhO1lBQ2IsNkNBQW9CO1lBQ3BCLG1EQUF1QjtZQUN2QiwrQ0FBcUI7WUFDckIsd0NBQXdCO1lBQ3hCLDRCQUFZO1lBQ1osd0JBQVU7WUFDVixnQ0FBYztTQUNqQjtRQUNELE9BQU8sRUFBQztZQUNKLHdCQUFhO1lBQ2IsNkNBQW9CO1lBQ3BCLG1EQUF1QjtZQUN2QiwrQ0FBcUI7WUFDckIsd0NBQXdCO1lBQ3hCLDRCQUFZO1lBQ1osd0JBQVU7WUFDVixnQ0FBYztTQUNqQjtLQUNKLENBQUM7R0FDVyxZQUFZLENBQUc7QUFBZixvQ0FBWSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vZHVsZSB9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcbmltcG9ydCB7VGltZUhlbHBlcn0gZnJvbSAnLi4vLi4vc2VydmljZXMvaGVscGVycy90aW1lLmhlbHBlcic7XG5pbXBvcnQge0NsaWVudFNlcnZpY2V9IGZyb20gJy4uLy4uL2NvbmZpZy9zZXJ2aWNlcy9zZXJ2aWNlcyc7XG5pbXBvcnQge1RmYVRyYW5zYWN0aW9uRmFtaWx5fSBmcm9tICcuL2ZhbWlsaWVzL3RmYS50cmFuc2FjdGlvbi5mYW1pbHknO1xuaW1wb3J0IHtDb2RlUXVldWVMaXN0ZW5lclNlcnZpY2V9IGZyb20gJy4uLy4uL3NlcnZpY2VzL2NvZGVfc2VuZGVyL3F1ZXVlLnNlcnZpY2UnO1xuaW1wb3J0IHtDaGFpblNlcnZpY2V9IGZyb20gJy4uLy4uL3NlcnZpY2VzL3Nhd3Rvb3RoL2NoYWluLnNlcnZpY2UnO1xuaW1wb3J0IHtLYXp0ZWxUcmFuc2FjdGlvbkZhbWlseX0gZnJvbSAnLi9mYW1pbGllcy9rYXp0ZWwudHJhbnNhY3Rpb24uZmFtaWx5JztcbmltcG9ydCB7RWdvdlRyYW5zYWN0aW9uRmFtaWx5fSBmcm9tICcuL2ZhbWlsaWVzL2Vnb3YudHJhbnNhY3Rpb24uZmFtaWx5JztcbmltcG9ydCB7VGVsZWdyYW1TZXJ2ZXJ9IGZyb20gJy4uLy4uL3NlcnZpY2VzL3RlbGVncmFtL3RlbGVncmFtLnNlcnZlcic7XG5cbkBNb2R1bGUoe1xuICAgIGNvbXBvbmVudHM6W1xuICAgICAgICBDbGllbnRTZXJ2aWNlLFxuICAgICAgICBUZmFUcmFuc2FjdGlvbkZhbWlseSxcbiAgICAgICAgS2F6dGVsVHJhbnNhY3Rpb25GYW1pbHksXG4gICAgICAgIEVnb3ZUcmFuc2FjdGlvbkZhbWlseSxcbiAgICAgICAgQ29kZVF1ZXVlTGlzdGVuZXJTZXJ2aWNlLFxuICAgICAgICBDaGFpblNlcnZpY2UsXG4gICAgICAgIFRpbWVIZWxwZXIsXG4gICAgICAgIFRlbGVncmFtU2VydmVyXG4gICAgXSxcbiAgICBleHBvcnRzOltcbiAgICAgICAgQ2xpZW50U2VydmljZSxcbiAgICAgICAgVGZhVHJhbnNhY3Rpb25GYW1pbHksXG4gICAgICAgIEthenRlbFRyYW5zYWN0aW9uRmFtaWx5LFxuICAgICAgICBFZ292VHJhbnNhY3Rpb25GYW1pbHksXG4gICAgICAgIENvZGVRdWV1ZUxpc3RlbmVyU2VydmljZSxcbiAgICAgICAgQ2hhaW5TZXJ2aWNlLFxuICAgICAgICBUaW1lSGVscGVyLFxuICAgICAgICBUZWxlZ3JhbVNlcnZlclxuICAgIF1cbn0pXG5leHBvcnQgY2xhc3MgU2hhcmVkTW9kdWxlIHt9Il19