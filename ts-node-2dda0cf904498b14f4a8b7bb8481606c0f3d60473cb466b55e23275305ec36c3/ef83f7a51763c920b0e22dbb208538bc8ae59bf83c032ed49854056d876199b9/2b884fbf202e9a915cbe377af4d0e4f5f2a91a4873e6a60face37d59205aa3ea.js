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
        return request.get({
            auth: {
                user: env_1.EnvConfig.VALIDATOR_REST_API_USER,
                pass: env_1.EnvConfig.VALIDATOR_REST_API_PASS,
                sendImmediately: true
            },
            uri: `${env_1.EnvConfig.VALIDATOR_REST_API}/state/${this.getAddress(phoneNumber)}`,
            json: true
        }).then(response => {
            return messagesService.User.decode(new Buffer(response.data, 'base64'));
        }).catch(error => {
            if (error.error.code === 30) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9zaGFyZWQvZmFtaWxpZXMvdGZhLnRyYW5zYWN0aW9uLmZhbWlseS50cyIsInNvdXJjZXMiOlsiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9zaGFyZWQvZmFtaWxpZXMvdGZhLnRyYW5zYWN0aW9uLmZhbWlseS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBLDJDQUF5QztBQUV6QyxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekIsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7QUFFaEQsNEVBQW1GO0FBQ25GLGdFQUFnRTtBQUdoRSw2Q0FBOEM7QUFFOUMsa0RBQWtEO0FBR2xELE1BQU0sZUFBZSxHQUFHLFdBQVcsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQztBQUdoRixJQUFhLG9CQUFvQixHQUFqQywwQkFBa0MsU0FBUSw0QkFBWTtJQUtsRCxZQUFvQixhQUE0QjtRQUM1QyxLQUFLLEVBQUUsQ0FBQTtRQURTLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1FBRTVDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdkIsQ0FBQztJQUVELFVBQVUsQ0FBQyxXQUFtQixFQUFFLElBQVk7UUFFeEMsTUFBTSxXQUFXLEdBQUcsZUFBZSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUM7WUFDakQsTUFBTSxFQUFFLDJCQUFXO1lBQ25CLFdBQVcsRUFBRSxXQUFXO1lBQ3hCLFdBQVcsRUFBRSxJQUFJO1NBQ3BCLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2FBQ2hFLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNiLE1BQU0sQ0FBUSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUM1QyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDYixPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDM0IsQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBRUQscUJBQXFCLENBQUMsV0FBbUI7UUFDckMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUM7WUFDZixJQUFJLEVBQUU7Z0JBQ0YsSUFBSSxFQUFFLGVBQVMsQ0FBQyx1QkFBdUI7Z0JBQ3ZDLElBQUksRUFBRSxlQUFTLENBQUMsdUJBQXVCO2dCQUN2QyxlQUFlLEVBQUUsSUFBSTthQUN4QjtZQUNELEdBQUcsRUFBRSxHQUFHLGVBQVMsQ0FBQyxrQkFBa0IsVUFBVSxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQzVFLElBQUksRUFBRSxJQUFJO1NBQ2IsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNmLE1BQU0sQ0FBYSxlQUFlLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDeEYsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ2IsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDMUIsTUFBTSxDQUFDLElBQUksQ0FBQztZQUNoQixDQUFDO1lBRUQsSUFBSSxDQUFDO2dCQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN0QyxDQUFDO1lBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDVCxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QixDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBRUosQ0FBQTtBQW5EWSxvQkFBb0I7SUFEaEMsa0JBQVMsRUFBRTtxQ0FNMkIsd0JBQWE7R0FMdkMsb0JBQW9CLENBbURoQztBQW5EWSxvREFBb0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0NvbXBvbmVudH0gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xuXG5jb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG5jb25zdCBwcm90b2J1ZkxpYiA9IHJlcXVpcmUoJ3Byb3RvY29sLWJ1ZmZlcnMnKTtcblxuaW1wb3J0IHtDaGFpblNlcnZpY2UsIENPREVfVVBEQVRFfSBmcm9tICcuLi8uLi8uLi9zZXJ2aWNlcy9zYXd0b290aC9jaGFpbi5zZXJ2aWNlJztcbmltcG9ydCB7Q2xpZW50U2VydmljZX0gZnJvbSAnLi4vLi4vLi4vY29uZmlnL3NlcnZpY2VzL3NlcnZpY2VzJztcbmltcG9ydCB7QmF0Y2h9IGZyb20gJy4uL21vZGVscy9iYXRjaCc7XG5pbXBvcnQge1Bvc3RDbGllbnRVc2VyRFRPfSBmcm9tICcuLi9tb2RlbHMvZHRvL3Bvc3Qua2F6dGVsLnVzZXIuZHRvJztcbmltcG9ydCB7RW52Q29uZmlnfSBmcm9tICcuLi8uLi8uLi9jb25maWcvZW52JztcbmltcG9ydCB7VGZhVXNlckRUT30gZnJvbSAnLi4vbW9kZWxzL2R0by9wb3N0LnRmYS51c2VyLmR0byc7XG5pbXBvcnQgKiBhcyByZXF1ZXN0IGZyb20gJ3JlcXVlc3QtcHJvbWlzZS1uYXRpdmUnO1xuXG5cbmNvbnN0IG1lc3NhZ2VzU2VydmljZSA9IHByb3RvYnVmTGliKGZzLnJlYWRGaWxlU3luYygnc3JjL3Byb3RvL3NlcnZpY2UucHJvdG8nKSk7XG5cbkBDb21wb25lbnQoKVxuZXhwb3J0IGNsYXNzIFRmYVRyYW5zYWN0aW9uRmFtaWx5IGV4dGVuZHMgQ2hhaW5TZXJ2aWNlIHtcbiAgICB0Zjogc3RyaW5nO1xuICAgIHRmVmVyc2lvbjogc3RyaW5nO1xuICAgIHByZWZpeDogc3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBjbGllbnRTZXJ2aWNlOiBDbGllbnRTZXJ2aWNlKSB7XG4gICAgICAgIHN1cGVyKClcbiAgICAgICAgdGhpcy5pbml0VEYoJ3RmYScpO1xuICAgIH1cblxuICAgIHVwZGF0ZVVzZXIocGhvbmVOdW1iZXI6IHN0cmluZywgdXNlcjogb2JqZWN0KTogUHJvbWlzZTxCYXRjaD4ge1xuXG4gICAgICAgIGNvbnN0IHBheWxvYWREYXRhID0gbWVzc2FnZXNTZXJ2aWNlLlNDUGF5bG9hZC5lbmNvZGUoe1xuICAgICAgICAgICAgQWN0aW9uOiBDT0RFX1VQREFURSxcbiAgICAgICAgICAgIFBob25lTnVtYmVyOiBwaG9uZU51bWJlcixcbiAgICAgICAgICAgIFBheWxvYWRVc2VyOiB1c2VyLFxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcy5hZGRUcmFuc2FjdGlvbihwYXlsb2FkRGF0YSwgdGhpcy5nZXRBZGRyZXNzKHBob25lTnVtYmVyKSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gPEJhdGNoPkpTT04ucGFyc2UocmVzcG9uc2UpLmRhdGE7XG4gICAgICAgICAgICB9KS5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2ludmFsaWQgcmVzcG9uc2UnLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIGdldFN0YXRlQnlQaG9uZU51bWJlcihwaG9uZU51bWJlcjogc3RyaW5nKTogUHJvbWlzZTxUZmFVc2VyRFRPfG51bGw+IHtcbiAgICAgICAgcmV0dXJuIHJlcXVlc3QuZ2V0KHtcbiAgICAgICAgICAgIGF1dGg6IHtcbiAgICAgICAgICAgICAgICB1c2VyOiBFbnZDb25maWcuVkFMSURBVE9SX1JFU1RfQVBJX1VTRVIsXG4gICAgICAgICAgICAgICAgcGFzczogRW52Q29uZmlnLlZBTElEQVRPUl9SRVNUX0FQSV9QQVNTLFxuICAgICAgICAgICAgICAgIHNlbmRJbW1lZGlhdGVseTogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVyaTogYCR7RW52Q29uZmlnLlZBTElEQVRPUl9SRVNUX0FQSX0vc3RhdGUvJHt0aGlzLmdldEFkZHJlc3MocGhvbmVOdW1iZXIpfWAsXG4gICAgICAgICAgICBqc29uOiB0cnVlXG4gICAgICAgIH0pLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIDxUZmFVc2VyRFRPPm1lc3NhZ2VzU2VydmljZS5Vc2VyLmRlY29kZShuZXcgQnVmZmVyKHJlc3BvbnNlLmRhdGEsICdiYXNlNjQnKSk7XG4gICAgICAgIH0pLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgIGlmIChlcnJvci5lcnJvci5jb2RlID09PSAzMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdlcnJvcicsIGVycm9yLmVycm9yKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZScsIGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbn1cbiJdfQ==