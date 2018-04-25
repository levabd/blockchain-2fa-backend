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
const request = require("request-promise-native");
const common_1 = require("@nestjs/common");
const chain_service_1 = require("../../../services/sawtooth/chain.service");
const env_1 = require("../../../config/env");
const fs = require('fs');
const protobufLib = require('protocol-buffers');
const messagesClientService = protobufLib(fs.readFileSync('src/proto/service_client.proto'));
let KaztelTransactionFamily = class KaztelTransactionFamily extends chain_service_1.ChainService {
    constructor() {
        super();
        this.initTF('kaztel');
    }
    updateUser(phoneNumber, user) {
        const payloadData = messagesClientService.SCPayload.encode({
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
    getUser(phoneNumber) {
        return request.get({
            auth: {
                user: env_1.EnvConfig.VALIDATOR_REST_API_USER,
                pass: env_1.EnvConfig.VALIDATOR_REST_API_PASS,
                sendImmediately: true
            },
            uri: `${env_1.EnvConfig.VALIDATOR_REST_API}/state/${this.getAddress(phoneNumber)}`,
            json: true
        }).then(response => {
            return messagesClientService.User.decode(new Buffer(response.data, 'base64'));
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
KaztelTransactionFamily = __decorate([
    common_1.Component(),
    __metadata("design:paramtypes", [])
], KaztelTransactionFamily);
exports.KaztelTransactionFamily = KaztelTransactionFamily;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9zaGFyZWQvZmFtaWxpZXMva2F6dGVsLnRyYW5zYWN0aW9uLmZhbWlseS50cyIsInNvdXJjZXMiOlsiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9zaGFyZWQvZmFtaWxpZXMva2F6dGVsLnRyYW5zYWN0aW9uLmZhbWlseS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBLGtEQUFrRDtBQUNsRCwyQ0FBeUM7QUFDekMsNEVBQW1GO0FBR25GLDZDQUE4QztBQUU5QyxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekIsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7QUFDaEQsTUFBTSxxQkFBcUIsR0FBRyxXQUFXLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUM7QUFHN0YsSUFBYSx1QkFBdUIsR0FBcEMsNkJBQXFDLFNBQVEsNEJBQVk7SUFLckQ7UUFDSSxLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDMUIsQ0FBQztJQUVELFVBQVUsQ0FBQyxXQUFtQixFQUFFLElBQVk7UUFFeEMsTUFBTSxXQUFXLEdBQUcscUJBQXFCLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQztZQUN2RCxNQUFNLEVBQUUsMkJBQVc7WUFDbkIsV0FBVyxFQUFFLFdBQVc7WUFDeEIsV0FBVyxFQUFFLElBQUk7U0FDcEIsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUM7YUFDaEUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ2IsTUFBTSxDQUFRLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQzVDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNiLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdkMsTUFBTSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzQixDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFFRCxPQUFPLENBQUMsV0FBbUI7UUFDdkIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUM7WUFDZixJQUFJLEVBQUU7Z0JBQ0YsSUFBSSxFQUFFLGVBQVMsQ0FBQyx1QkFBdUI7Z0JBQ3ZDLElBQUksRUFBRSxlQUFTLENBQUMsdUJBQXVCO2dCQUN2QyxlQUFlLEVBQUUsSUFBSTthQUN4QjtZQUNELEdBQUcsRUFBRSxHQUFHLGVBQVMsQ0FBQyxrQkFBa0IsVUFBVSxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQzVFLElBQUksRUFBRSxJQUFJO1NBQ2IsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNmLE1BQU0sQ0FBb0IscUJBQXFCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDckcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ2IsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDMUIsTUFBTSxDQUFDLElBQUksQ0FBQztZQUNoQixDQUFDO1lBQ0QsSUFBSSxDQUFDO2dCQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN0QyxDQUFDO1lBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDVCxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QixDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0osQ0FBQTtBQWpEWSx1QkFBdUI7SUFEbkMsa0JBQVMsRUFBRTs7R0FDQyx1QkFBdUIsQ0FpRG5DO0FBakRZLDBEQUF1QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdC1wcm9taXNlLW5hdGl2ZSc7XG5pbXBvcnQge0NvbXBvbmVudH0gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xuaW1wb3J0IHtDaGFpblNlcnZpY2UsIENPREVfVVBEQVRFfSBmcm9tICcuLi8uLi8uLi9zZXJ2aWNlcy9zYXd0b290aC9jaGFpbi5zZXJ2aWNlJztcbmltcG9ydCB7QmF0Y2h9IGZyb20gJy4uL21vZGVscy9iYXRjaCc7XG5pbXBvcnQge1Bvc3RDbGllbnRVc2VyRFRPfSBmcm9tICcuLi9tb2RlbHMvZHRvL3Bvc3Qua2F6dGVsLnVzZXIuZHRvJztcbmltcG9ydCB7RW52Q29uZmlnfSBmcm9tICcuLi8uLi8uLi9jb25maWcvZW52JztcblxuY29uc3QgZnMgPSByZXF1aXJlKCdmcycpO1xuY29uc3QgcHJvdG9idWZMaWIgPSByZXF1aXJlKCdwcm90b2NvbC1idWZmZXJzJyk7XG5jb25zdCBtZXNzYWdlc0NsaWVudFNlcnZpY2UgPSBwcm90b2J1ZkxpYihmcy5yZWFkRmlsZVN5bmMoJ3NyYy9wcm90by9zZXJ2aWNlX2NsaWVudC5wcm90bycpKTtcblxuQENvbXBvbmVudCgpXG5leHBvcnQgY2xhc3MgS2F6dGVsVHJhbnNhY3Rpb25GYW1pbHkgZXh0ZW5kcyBDaGFpblNlcnZpY2Uge1xuICAgIHRmOiBzdHJpbmc7XG4gICAgdGZWZXJzaW9uOiBzdHJpbmc7XG4gICAgcHJlZml4OiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5pbml0VEYoJ2thenRlbCcpO1xuICAgIH1cblxuICAgIHVwZGF0ZVVzZXIocGhvbmVOdW1iZXI6IHN0cmluZywgdXNlcjogb2JqZWN0KTogUHJvbWlzZTxCYXRjaD4ge1xuXG4gICAgICAgIGNvbnN0IHBheWxvYWREYXRhID0gbWVzc2FnZXNDbGllbnRTZXJ2aWNlLlNDUGF5bG9hZC5lbmNvZGUoe1xuICAgICAgICAgICAgQWN0aW9uOiBDT0RFX1VQREFURSxcbiAgICAgICAgICAgIFBob25lTnVtYmVyOiBwaG9uZU51bWJlcixcbiAgICAgICAgICAgIFBheWxvYWRVc2VyOiB1c2VyLFxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcy5hZGRUcmFuc2FjdGlvbihwYXlsb2FkRGF0YSwgdGhpcy5nZXRBZGRyZXNzKHBob25lTnVtYmVyKSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gPEJhdGNoPkpTT04ucGFyc2UocmVzcG9uc2UpLmRhdGE7XG4gICAgICAgICAgICB9KS5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2ludmFsaWQgcmVzcG9uc2UnLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIGdldFVzZXIocGhvbmVOdW1iZXI6IHN0cmluZyk6IFByb21pc2U8UG9zdENsaWVudFVzZXJEVE98bnVsbD4ge1xuICAgICAgICByZXR1cm4gcmVxdWVzdC5nZXQoe1xuICAgICAgICAgICAgYXV0aDoge1xuICAgICAgICAgICAgICAgIHVzZXI6IEVudkNvbmZpZy5WQUxJREFUT1JfUkVTVF9BUElfVVNFUixcbiAgICAgICAgICAgICAgICBwYXNzOiBFbnZDb25maWcuVkFMSURBVE9SX1JFU1RfQVBJX1BBU1MsXG4gICAgICAgICAgICAgICAgc2VuZEltbWVkaWF0ZWx5OiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXJpOiBgJHtFbnZDb25maWcuVkFMSURBVE9SX1JFU1RfQVBJfS9zdGF0ZS8ke3RoaXMuZ2V0QWRkcmVzcyhwaG9uZU51bWJlcil9YCxcbiAgICAgICAgICAgIGpzb246IHRydWVcbiAgICAgICAgfSkudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gPFBvc3RDbGllbnRVc2VyRFRPPm1lc3NhZ2VzQ2xpZW50U2VydmljZS5Vc2VyLmRlY29kZShuZXcgQnVmZmVyKHJlc3BvbnNlLmRhdGEsICdiYXNlNjQnKSk7XG4gICAgICAgIH0pLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgIGlmIChlcnJvci5lcnJvci5jb2RlID09PSAzMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZXJyb3InLCBlcnJvci5lcnJvcik7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2UnLCBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuIl19