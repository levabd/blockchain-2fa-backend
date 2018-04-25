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
        console.log('this.getAddress(phoneNumber)', this.getAddress(phoneNumber));
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
        }).catch((error, res) => {
            console.log('error.response', error.response);
            console.log('res', res);
            if (error.response.status === 502) {
                return null;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9zaGFyZWQvZmFtaWxpZXMva2F6dGVsLnRyYW5zYWN0aW9uLmZhbWlseS50cyIsInNvdXJjZXMiOlsiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9zaGFyZWQvZmFtaWxpZXMva2F6dGVsLnRyYW5zYWN0aW9uLmZhbWlseS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBLGtEQUFrRDtBQUNsRCwyQ0FBeUM7QUFDekMsNEVBQW1GO0FBR25GLDZDQUE4QztBQUU5QyxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekIsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7QUFDaEQsTUFBTSxxQkFBcUIsR0FBRyxXQUFXLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUM7QUFHN0YsSUFBYSx1QkFBdUIsR0FBcEMsNkJBQXFDLFNBQVEsNEJBQVk7SUFLckQ7UUFDSSxLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDMUIsQ0FBQztJQUVELFVBQVUsQ0FBQyxXQUFtQixFQUFFLElBQVk7UUFFeEMsTUFBTSxXQUFXLEdBQUcscUJBQXFCLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQztZQUN2RCxNQUFNLEVBQUUsMkJBQVc7WUFDbkIsV0FBVyxFQUFFLFdBQVc7WUFDeEIsV0FBVyxFQUFFLElBQUk7U0FDcEIsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUM7YUFDaEUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ2IsTUFBTSxDQUFRLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQzVDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNiLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdkMsTUFBTSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzQixDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFFRCxPQUFPLENBQUMsV0FBbUI7UUFDdkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDMUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUM7WUFDZixJQUFJLEVBQUU7Z0JBQ0YsSUFBSSxFQUFFLGVBQVMsQ0FBQyx1QkFBdUI7Z0JBQ3ZDLElBQUksRUFBRSxlQUFTLENBQUMsdUJBQXVCO2dCQUN2QyxlQUFlLEVBQUUsSUFBSTthQUN4QjtZQUNELEdBQUcsRUFBRSxHQUFHLGVBQVMsQ0FBQyxrQkFBa0IsVUFBVSxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQzVFLElBQUksRUFBRSxJQUFJO1NBQ2IsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNmLE1BQU0sQ0FBb0IscUJBQXFCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDckcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFO1lBQ3BCLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzlDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBRXhCLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFDaEIsQ0FBQztZQUNELEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzFCLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFDaEIsQ0FBQztZQUNELElBQUksQ0FBQztnQkFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2xDLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFDaEIsQ0FBQztZQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFDaEIsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKLENBQUE7QUExRFksdUJBQXVCO0lBRG5DLGtCQUFTLEVBQUU7O0dBQ0MsdUJBQXVCLENBMERuQztBQTFEWSwwREFBdUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyByZXF1ZXN0IGZyb20gJ3JlcXVlc3QtcHJvbWlzZS1uYXRpdmUnO1xuaW1wb3J0IHtDb21wb25lbnR9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcbmltcG9ydCB7Q2hhaW5TZXJ2aWNlLCBDT0RFX1VQREFURX0gZnJvbSAnLi4vLi4vLi4vc2VydmljZXMvc2F3dG9vdGgvY2hhaW4uc2VydmljZSc7XG5pbXBvcnQge0JhdGNofSBmcm9tICcuLi9tb2RlbHMvYmF0Y2gnO1xuaW1wb3J0IHtQb3N0Q2xpZW50VXNlckRUT30gZnJvbSAnLi4vbW9kZWxzL2R0by9wb3N0LmthenRlbC51c2VyLmR0byc7XG5pbXBvcnQge0VudkNvbmZpZ30gZnJvbSAnLi4vLi4vLi4vY29uZmlnL2Vudic7XG5cbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcbmNvbnN0IHByb3RvYnVmTGliID0gcmVxdWlyZSgncHJvdG9jb2wtYnVmZmVycycpO1xuY29uc3QgbWVzc2FnZXNDbGllbnRTZXJ2aWNlID0gcHJvdG9idWZMaWIoZnMucmVhZEZpbGVTeW5jKCdzcmMvcHJvdG8vc2VydmljZV9jbGllbnQucHJvdG8nKSk7XG5cbkBDb21wb25lbnQoKVxuZXhwb3J0IGNsYXNzIEthenRlbFRyYW5zYWN0aW9uRmFtaWx5IGV4dGVuZHMgQ2hhaW5TZXJ2aWNlIHtcbiAgICB0Zjogc3RyaW5nO1xuICAgIHRmVmVyc2lvbjogc3RyaW5nO1xuICAgIHByZWZpeDogc3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuaW5pdFRGKCdrYXp0ZWwnKTtcbiAgICB9XG5cbiAgICB1cGRhdGVVc2VyKHBob25lTnVtYmVyOiBzdHJpbmcsIHVzZXI6IG9iamVjdCk6IFByb21pc2U8QmF0Y2g+IHtcblxuICAgICAgICBjb25zdCBwYXlsb2FkRGF0YSA9IG1lc3NhZ2VzQ2xpZW50U2VydmljZS5TQ1BheWxvYWQuZW5jb2RlKHtcbiAgICAgICAgICAgIEFjdGlvbjogQ09ERV9VUERBVEUsXG4gICAgICAgICAgICBQaG9uZU51bWJlcjogcGhvbmVOdW1iZXIsXG4gICAgICAgICAgICBQYXlsb2FkVXNlcjogdXNlcixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkVHJhbnNhY3Rpb24ocGF5bG9hZERhdGEsIHRoaXMuZ2V0QWRkcmVzcyhwaG9uZU51bWJlcikpXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxCYXRjaD5KU09OLnBhcnNlKHJlc3BvbnNlKS5kYXRhO1xuICAgICAgICAgICAgfSkuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdpbnZhbGlkIHJlc3BvbnNlJywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBnZXRVc2VyKHBob25lTnVtYmVyOiBzdHJpbmcpOiBQcm9taXNlPFBvc3RDbGllbnRVc2VyRFRPfG51bGw+IHtcbiAgICAgICAgY29uc29sZS5sb2coJ3RoaXMuZ2V0QWRkcmVzcyhwaG9uZU51bWJlciknLCB0aGlzLmdldEFkZHJlc3MocGhvbmVOdW1iZXIpKTtcbiAgICAgICAgcmV0dXJuIHJlcXVlc3QuZ2V0KHtcbiAgICAgICAgICAgIGF1dGg6IHtcbiAgICAgICAgICAgICAgICB1c2VyOiBFbnZDb25maWcuVkFMSURBVE9SX1JFU1RfQVBJX1VTRVIsXG4gICAgICAgICAgICAgICAgcGFzczogRW52Q29uZmlnLlZBTElEQVRPUl9SRVNUX0FQSV9QQVNTLFxuICAgICAgICAgICAgICAgIHNlbmRJbW1lZGlhdGVseTogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVyaTogYCR7RW52Q29uZmlnLlZBTElEQVRPUl9SRVNUX0FQSX0vc3RhdGUvJHt0aGlzLmdldEFkZHJlc3MocGhvbmVOdW1iZXIpfWAsXG4gICAgICAgICAgICBqc29uOiB0cnVlXG4gICAgICAgIH0pLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIDxQb3N0Q2xpZW50VXNlckRUTz5tZXNzYWdlc0NsaWVudFNlcnZpY2UuVXNlci5kZWNvZGUobmV3IEJ1ZmZlcihyZXNwb25zZS5kYXRhLCAnYmFzZTY0JykpO1xuICAgICAgICB9KS5jYXRjaCgoZXJyb3IsIHJlcykgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2Vycm9yLnJlc3BvbnNlJywgZXJyb3IucmVzcG9uc2UpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ3JlcycsIHJlcyk7XG5cbiAgICAgICAgICAgIGlmIChlcnJvci5yZXNwb25zZS5zdGF0dXMgPT09IDUwMikge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVycm9yLmVycm9yLmNvZGUgPT09IDMwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdlcnJvcicsIGVycm9yLmVycm9yKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZScsIGUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG4iXX0=