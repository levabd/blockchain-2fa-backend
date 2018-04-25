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
const common_1 = require("@nestjs/common");
const fs = require('fs');
const protobufLib = require('protocol-buffers');
const chain_service_1 = require("../../../services/sawtooth/chain.service");
const services_1 = require("../../../config/services/services");
const env_1 = require("../../../config/env");
const request = require("request-promise-native");
const messagesService = protobufLib(fs.readFileSync('src/proto/service.proto'));
let TfaTransactionFamily = class TfaTransactionFamily extends chain_service_1.ChainService {
    constructor(clientService) {
        super();
        this.clientService = clientService;
        this.initTF('tfa');
    }
    updateUser(phoneNumber, user) {
        const payloadData = messagesService.SCPayload.encode({
            Action: chain_service_1.CODE_UPDATE,
            PhoneNumber: phoneNumber,
            PayloadUser: user,
        });
        return this.addTransaction(payloadData, this.getAddress(phoneNumber))
            .then(response => {
            return JSON.parse(response).data;
        }).catch(error => {
            console.log('invalid response', error);
            throw new Error(error);
        });
    }
    getStateByPhoneNumber(phoneNumber) {
        console.log('`url', `${env_1.EnvConfig.VALIDATOR_REST_API}/state/${this.getAddress(phoneNumber)}`);
        return request.get({
            url: `${env_1.EnvConfig.VALIDATOR_REST_API}/state/${this.getAddress(phoneNumber)}`,
            json: true
        }).then(response => {
            return messagesService.User.decode(new Buffer(response.data, 'base64'));
        }).catch(error => {
            if (error.error.code === 30 || error.response.statusCode === 502) {
                return null;
            }
            try {
                console.log('error', error.error);
            }
            catch (e) {
                console.log('e', e);
            }
        });
    }
};
TfaTransactionFamily = __decorate([
    common_1.Component(),
    __metadata("design:paramtypes", [services_1.ClientService])
], TfaTransactionFamily);
exports.TfaTransactionFamily = TfaTransactionFamily;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9zaGFyZWQvZmFtaWxpZXMvdGZhLnRyYW5zYWN0aW9uLmZhbWlseS50cyIsInNvdXJjZXMiOlsiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9zaGFyZWQvZmFtaWxpZXMvdGZhLnRyYW5zYWN0aW9uLmZhbWlseS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBLDJDQUF5QztBQUV6QyxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekIsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7QUFFaEQsNEVBQW1GO0FBQ25GLGdFQUFnRTtBQUdoRSw2Q0FBOEM7QUFFOUMsa0RBQWtEO0FBR2xELE1BQU0sZUFBZSxHQUFHLFdBQVcsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQztBQUdoRixJQUFhLG9CQUFvQixHQUFqQywwQkFBa0MsU0FBUSw0QkFBWTtJQUtsRCxZQUFvQixhQUE0QjtRQUM1QyxLQUFLLEVBQUUsQ0FBQTtRQURTLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1FBRTVDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdkIsQ0FBQztJQUVELFVBQVUsQ0FBQyxXQUFtQixFQUFFLElBQVk7UUFFeEMsTUFBTSxXQUFXLEdBQUcsZUFBZSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUM7WUFDakQsTUFBTSxFQUFFLDJCQUFXO1lBQ25CLFdBQVcsRUFBRSxXQUFXO1lBQ3hCLFdBQVcsRUFBRSxJQUFJO1NBQ3BCLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2FBQ2hFLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNiLE1BQU0sQ0FBUSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUM1QyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDYixPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDM0IsQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBRUQscUJBQXFCLENBQUMsV0FBbUI7UUFDckMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsR0FBRyxlQUFTLENBQUMsa0JBQWtCLFVBQVUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDN0YsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUM7WUFNZixHQUFHLEVBQUUsR0FBRyxlQUFTLENBQUMsa0JBQWtCLFVBQVUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUM1RSxJQUFJLEVBQUUsSUFBSTtTQUNiLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDZixNQUFNLENBQWEsZUFBZSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ3hGLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNiLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLEVBQUUsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLFVBQVUsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUMvRCxNQUFNLENBQUMsSUFBSSxDQUFDO1lBQ2hCLENBQUM7WUFFRCxJQUFJLENBQUM7Z0JBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RDLENBQUM7WUFBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNULE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FFSixDQUFBO0FBcERZLG9CQUFvQjtJQURoQyxrQkFBUyxFQUFFO3FDQU0yQix3QkFBYTtHQUx2QyxvQkFBb0IsQ0FvRGhDO0FBcERZLG9EQUFvQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7Q29tcG9uZW50fSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XG5cbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcbmNvbnN0IHByb3RvYnVmTGliID0gcmVxdWlyZSgncHJvdG9jb2wtYnVmZmVycycpO1xuXG5pbXBvcnQge0NoYWluU2VydmljZSwgQ09ERV9VUERBVEV9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL3Nhd3Rvb3RoL2NoYWluLnNlcnZpY2UnO1xuaW1wb3J0IHtDbGllbnRTZXJ2aWNlfSBmcm9tICcuLi8uLi8uLi9jb25maWcvc2VydmljZXMvc2VydmljZXMnO1xuaW1wb3J0IHtCYXRjaH0gZnJvbSAnLi4vbW9kZWxzL2JhdGNoJztcbmltcG9ydCB7UG9zdENsaWVudFVzZXJEVE99IGZyb20gJy4uL21vZGVscy9kdG8vcG9zdC5rYXp0ZWwudXNlci5kdG8nO1xuaW1wb3J0IHtFbnZDb25maWd9IGZyb20gJy4uLy4uLy4uL2NvbmZpZy9lbnYnO1xuaW1wb3J0IHtUZmFVc2VyRFRPfSBmcm9tICcuLi9tb2RlbHMvZHRvL3Bvc3QudGZhLnVzZXIuZHRvJztcbmltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdC1wcm9taXNlLW5hdGl2ZSc7XG5cblxuY29uc3QgbWVzc2FnZXNTZXJ2aWNlID0gcHJvdG9idWZMaWIoZnMucmVhZEZpbGVTeW5jKCdzcmMvcHJvdG8vc2VydmljZS5wcm90bycpKTtcblxuQENvbXBvbmVudCgpXG5leHBvcnQgY2xhc3MgVGZhVHJhbnNhY3Rpb25GYW1pbHkgZXh0ZW5kcyBDaGFpblNlcnZpY2Uge1xuICAgIHRmOiBzdHJpbmc7XG4gICAgdGZWZXJzaW9uOiBzdHJpbmc7XG4gICAgcHJlZml4OiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNsaWVudFNlcnZpY2U6IENsaWVudFNlcnZpY2UpIHtcbiAgICAgICAgc3VwZXIoKVxuICAgICAgICB0aGlzLmluaXRURigndGZhJyk7XG4gICAgfVxuXG4gICAgdXBkYXRlVXNlcihwaG9uZU51bWJlcjogc3RyaW5nLCB1c2VyOiBvYmplY3QpOiBQcm9taXNlPEJhdGNoPiB7XG5cbiAgICAgICAgY29uc3QgcGF5bG9hZERhdGEgPSBtZXNzYWdlc1NlcnZpY2UuU0NQYXlsb2FkLmVuY29kZSh7XG4gICAgICAgICAgICBBY3Rpb246IENPREVfVVBEQVRFLFxuICAgICAgICAgICAgUGhvbmVOdW1iZXI6IHBob25lTnVtYmVyLFxuICAgICAgICAgICAgUGF5bG9hZFVzZXI6IHVzZXIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmFkZFRyYW5zYWN0aW9uKHBheWxvYWREYXRhLCB0aGlzLmdldEFkZHJlc3MocGhvbmVOdW1iZXIpKVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiA8QmF0Y2g+SlNPTi5wYXJzZShyZXNwb25zZSkuZGF0YTtcbiAgICAgICAgICAgIH0pLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnaW52YWxpZCByZXNwb25zZScsIGVycm9yKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZ2V0U3RhdGVCeVBob25lTnVtYmVyKHBob25lTnVtYmVyOiBzdHJpbmcpOiBQcm9taXNlPFRmYVVzZXJEVE98bnVsbD4ge1xuICAgICAgICBjb25zb2xlLmxvZygnYHVybCcsIGAke0VudkNvbmZpZy5WQUxJREFUT1JfUkVTVF9BUEl9L3N0YXRlLyR7dGhpcy5nZXRBZGRyZXNzKHBob25lTnVtYmVyKX1gKTtcbiAgICAgICAgcmV0dXJuIHJlcXVlc3QuZ2V0KHtcbiAgICAgICAgICAgIC8vIGF1dGg6IHtcbiAgICAgICAgICAgIC8vICAgICB1c2VyOiBFbnZDb25maWcuVkFMSURBVE9SX1JFU1RfQVBJX1VTRVIsXG4gICAgICAgICAgICAvLyAgICAgcGFzczogRW52Q29uZmlnLlZBTElEQVRPUl9SRVNUX0FQSV9QQVNTLFxuICAgICAgICAgICAgLy8gICAgIHNlbmRJbW1lZGlhdGVseTogdHJ1ZVxuICAgICAgICAgICAgLy8gfSxcbiAgICAgICAgICAgIHVybDogYCR7RW52Q29uZmlnLlZBTElEQVRPUl9SRVNUX0FQSX0vc3RhdGUvJHt0aGlzLmdldEFkZHJlc3MocGhvbmVOdW1iZXIpfWAsXG4gICAgICAgICAgICBqc29uOiB0cnVlXG4gICAgICAgIH0pLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIDxUZmFVc2VyRFRPPm1lc3NhZ2VzU2VydmljZS5Vc2VyLmRlY29kZShuZXcgQnVmZmVyKHJlc3BvbnNlLmRhdGEsICdiYXNlNjQnKSk7XG4gICAgICAgIH0pLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgIGlmIChlcnJvci5lcnJvci5jb2RlID09PSAzMCB8fCBlcnJvci5yZXNwb25zZS5zdGF0dXNDb2RlID09PSA1MDIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZXJyb3InLCBlcnJvci5lcnJvcik7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2UnLCBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG59XG4iXX0=