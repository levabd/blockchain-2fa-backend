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
        this.tryCounter = 0;
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
        console.log('`url', `${env_1.EnvConfig.VALIDATOR_REST_API}/state/${this.getAddress(phoneNumber)}`);
        return request.get({
            url: `${env_1.EnvConfig.VALIDATOR_REST_API}/state/${this.getAddress(phoneNumber)}`,
            json: true
        }).then(response => {
            this.tryCounter = 0;
            return messagesClientService.User.decode(new Buffer(response.data, 'base64'));
        }).catch(error => {
            if (error.response.statusCode === 502) {
                if (this.tryCounter <= 10) {
                    this.tryCounter++;
                    return this.getUser(phoneNumber);
                }
                else {
                    this.tryCounter = 0;
                    return null;
                }
            }
            if (error.error.code === 30) {
                return null;
            }
            try {
                console.log('error', error.error);
                return null;
            }
            catch (e) {
                console.log('e', e);
                return null;
            }
        });
    }
};
KaztelTransactionFamily = __decorate([
    common_1.Component(),
    __metadata("design:paramtypes", [])
], KaztelTransactionFamily);
exports.KaztelTransactionFamily = KaztelTransactionFamily;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9zaGFyZWQvZmFtaWxpZXMva2F6dGVsLnRyYW5zYWN0aW9uLmZhbWlseS50cyIsInNvdXJjZXMiOlsiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9zaGFyZWQvZmFtaWxpZXMva2F6dGVsLnRyYW5zYWN0aW9uLmZhbWlseS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBLGtEQUFrRDtBQUNsRCwyQ0FBeUM7QUFDekMsNEVBQW1GO0FBR25GLDZDQUE4QztBQUU5QyxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekIsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7QUFDaEQsTUFBTSxxQkFBcUIsR0FBRyxXQUFXLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUM7QUFHN0YsSUFBYSx1QkFBdUIsR0FBcEMsNkJBQXFDLFNBQVEsNEJBQVk7SUFNckQ7UUFDSSxLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7SUFDeEIsQ0FBQztJQUVELFVBQVUsQ0FBQyxXQUFtQixFQUFFLElBQVk7UUFFeEMsTUFBTSxXQUFXLEdBQUcscUJBQXFCLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQztZQUN2RCxNQUFNLEVBQUUsMkJBQVc7WUFDbkIsV0FBVyxFQUFFLFdBQVc7WUFDeEIsV0FBVyxFQUFFLElBQUk7U0FDcEIsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUM7YUFDaEUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ2IsTUFBTSxDQUFRLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQzVDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNiLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdkMsTUFBTSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzQixDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFFRCxPQUFPLENBQUMsV0FBbUI7UUFDdkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsR0FBRyxlQUFTLENBQUMsa0JBQWtCLFVBQVUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDN0YsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUM7WUFNZixHQUFHLEVBQUUsR0FBRyxlQUFTLENBQUMsa0JBQWtCLFVBQVUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUM1RSxJQUFJLEVBQUUsSUFBSTtTQUNiLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDZixJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQztZQUNwQixNQUFNLENBQW9CLHFCQUFxQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ3JHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNiLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsVUFBVSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDeEIsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUNsQixNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDckMsQ0FBQztnQkFBQyxJQUFJLENBQUMsQ0FBQztvQkFDSixJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQztvQkFDcEIsTUFBTSxDQUFDLElBQUksQ0FBQztnQkFDaEIsQ0FBQztZQUNMLENBQUM7WUFDRCxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixNQUFNLENBQUMsSUFBSSxDQUFDO1lBQ2hCLENBQUM7WUFDRCxJQUFJLENBQUM7Z0JBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNsQyxNQUFNLENBQUMsSUFBSSxDQUFDO1lBQ2hCLENBQUM7WUFBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNULE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNwQixNQUFNLENBQUMsSUFBSSxDQUFDO1lBQ2hCLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSixDQUFBO0FBaEVZLHVCQUF1QjtJQURuQyxrQkFBUyxFQUFFOztHQUNDLHVCQUF1QixDQWdFbkM7QUFoRVksMERBQXVCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcmVxdWVzdCBmcm9tICdyZXF1ZXN0LXByb21pc2UtbmF0aXZlJztcbmltcG9ydCB7Q29tcG9uZW50fSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XG5pbXBvcnQge0NoYWluU2VydmljZSwgQ09ERV9VUERBVEV9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL3Nhd3Rvb3RoL2NoYWluLnNlcnZpY2UnO1xuaW1wb3J0IHtCYXRjaH0gZnJvbSAnLi4vbW9kZWxzL2JhdGNoJztcbmltcG9ydCB7UG9zdENsaWVudFVzZXJEVE99IGZyb20gJy4uL21vZGVscy9kdG8vcG9zdC5rYXp0ZWwudXNlci5kdG8nO1xuaW1wb3J0IHtFbnZDb25maWd9IGZyb20gJy4uLy4uLy4uL2NvbmZpZy9lbnYnO1xuXG5jb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG5jb25zdCBwcm90b2J1ZkxpYiA9IHJlcXVpcmUoJ3Byb3RvY29sLWJ1ZmZlcnMnKTtcbmNvbnN0IG1lc3NhZ2VzQ2xpZW50U2VydmljZSA9IHByb3RvYnVmTGliKGZzLnJlYWRGaWxlU3luYygnc3JjL3Byb3RvL3NlcnZpY2VfY2xpZW50LnByb3RvJykpO1xuXG5AQ29tcG9uZW50KClcbmV4cG9ydCBjbGFzcyBLYXp0ZWxUcmFuc2FjdGlvbkZhbWlseSBleHRlbmRzIENoYWluU2VydmljZSB7XG4gICAgdGY6IHN0cmluZztcbiAgICB0ZlZlcnNpb246IHN0cmluZztcbiAgICBwcmVmaXg6IHN0cmluZztcbiAgICB0cnlDb3VudGVyOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5pbml0VEYoJ2thenRlbCcpO1xuICAgICAgICB0aGlzLnRyeUNvdW50ZXIgPSAwO1xuICAgIH1cblxuICAgIHVwZGF0ZVVzZXIocGhvbmVOdW1iZXI6IHN0cmluZywgdXNlcjogb2JqZWN0KTogUHJvbWlzZTxCYXRjaD4ge1xuXG4gICAgICAgIGNvbnN0IHBheWxvYWREYXRhID0gbWVzc2FnZXNDbGllbnRTZXJ2aWNlLlNDUGF5bG9hZC5lbmNvZGUoe1xuICAgICAgICAgICAgQWN0aW9uOiBDT0RFX1VQREFURSxcbiAgICAgICAgICAgIFBob25lTnVtYmVyOiBwaG9uZU51bWJlcixcbiAgICAgICAgICAgIFBheWxvYWRVc2VyOiB1c2VyLFxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcy5hZGRUcmFuc2FjdGlvbihwYXlsb2FkRGF0YSwgdGhpcy5nZXRBZGRyZXNzKHBob25lTnVtYmVyKSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gPEJhdGNoPkpTT04ucGFyc2UocmVzcG9uc2UpLmRhdGE7XG4gICAgICAgICAgICB9KS5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2ludmFsaWQgcmVzcG9uc2UnLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIGdldFVzZXIocGhvbmVOdW1iZXI6IHN0cmluZyk6IFByb21pc2U8UG9zdENsaWVudFVzZXJEVE8gfCBudWxsPiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdgdXJsJywgYCR7RW52Q29uZmlnLlZBTElEQVRPUl9SRVNUX0FQSX0vc3RhdGUvJHt0aGlzLmdldEFkZHJlc3MocGhvbmVOdW1iZXIpfWApO1xuICAgICAgICByZXR1cm4gcmVxdWVzdC5nZXQoe1xuICAgICAgICAgICAgLy8gYXV0aDoge1xuICAgICAgICAgICAgLy8gICAgIHVzZXI6IEVudkNvbmZpZy5WQUxJREFUT1JfUkVTVF9BUElfVVNFUixcbiAgICAgICAgICAgIC8vICAgICBwYXNzOiBFbnZDb25maWcuVkFMSURBVE9SX1JFU1RfQVBJX1BBU1MsXG4gICAgICAgICAgICAvLyAgICAgc2VuZEltbWVkaWF0ZWx5OiB0cnVlXG4gICAgICAgICAgICAvLyB9LFxuICAgICAgICAgICAgdXJsOiBgJHtFbnZDb25maWcuVkFMSURBVE9SX1JFU1RfQVBJfS9zdGF0ZS8ke3RoaXMuZ2V0QWRkcmVzcyhwaG9uZU51bWJlcil9YCxcbiAgICAgICAgICAgIGpzb246IHRydWVcbiAgICAgICAgfSkudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICB0aGlzLnRyeUNvdW50ZXIgPSAwO1xuICAgICAgICAgICAgcmV0dXJuIDxQb3N0Q2xpZW50VXNlckRUTz5tZXNzYWdlc0NsaWVudFNlcnZpY2UuVXNlci5kZWNvZGUobmV3IEJ1ZmZlcihyZXNwb25zZS5kYXRhLCAnYmFzZTY0JykpO1xuICAgICAgICB9KS5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyb3IucmVzcG9uc2Uuc3RhdHVzQ29kZSA9PT0gNTAyKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudHJ5Q291bnRlciA8PSAxMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyeUNvdW50ZXIrKztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VXNlcihwaG9uZU51bWJlcik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cnlDb3VudGVyID0gMDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVycm9yLmVycm9yLmNvZGUgPT09IDMwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdlcnJvcicsIGVycm9yLmVycm9yKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZScsIGUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG4iXX0=