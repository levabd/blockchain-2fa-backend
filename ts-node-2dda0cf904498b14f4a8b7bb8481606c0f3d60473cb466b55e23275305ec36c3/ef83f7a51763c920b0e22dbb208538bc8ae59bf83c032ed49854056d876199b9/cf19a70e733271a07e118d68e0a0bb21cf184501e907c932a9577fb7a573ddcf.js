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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9zaGFyZWQvZmFtaWxpZXMvdGZhLnRyYW5zYWN0aW9uLmZhbWlseS50cyIsInNvdXJjZXMiOlsiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9zaGFyZWQvZmFtaWxpZXMvdGZhLnRyYW5zYWN0aW9uLmZhbWlseS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBLDJDQUF5QztBQUV6QyxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekIsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7QUFFaEQsNEVBQW1GO0FBQ25GLGdFQUFnRTtBQUdoRSw2Q0FBOEM7QUFFOUMsa0RBQWtEO0FBR2xELE1BQU0sZUFBZSxHQUFHLFdBQVcsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQztBQUdoRixJQUFhLG9CQUFvQixHQUFqQywwQkFBa0MsU0FBUSw0QkFBWTtJQUtsRCxZQUFvQixhQUE0QjtRQUM1QyxLQUFLLEVBQUUsQ0FBQTtRQURTLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1FBRTVDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdkIsQ0FBQztJQUVELFVBQVUsQ0FBQyxXQUFtQixFQUFFLElBQVk7UUFFeEMsTUFBTSxXQUFXLEdBQUcsZUFBZSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUM7WUFDakQsTUFBTSxFQUFFLDJCQUFXO1lBQ25CLFdBQVcsRUFBRSxXQUFXO1lBQ3hCLFdBQVcsRUFBRSxJQUFJO1NBQ3BCLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2FBQ2hFLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNiLE1BQU0sQ0FBUSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUM1QyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDYixPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDM0IsQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBRUQscUJBQXFCLENBQUMsV0FBbUI7UUFDckMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUM7WUFDZixJQUFJLEVBQUU7Z0JBQ0YsSUFBSSxFQUFFLGVBQVMsQ0FBQyx1QkFBdUI7Z0JBQ3ZDLElBQUksRUFBRSxlQUFTLENBQUMsdUJBQXVCO2dCQUN2QyxlQUFlLEVBQUUsSUFBSTthQUN4QjtZQUNELEdBQUcsRUFBRSxHQUFHLGVBQVMsQ0FBQyxrQkFBa0IsVUFBVSxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQzVFLElBQUksRUFBRSxJQUFJO1NBQ2IsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNmLE1BQU0sQ0FBYSxlQUFlLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDeEYsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ2IsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssRUFBRSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsVUFBVSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQy9ELE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFDaEIsQ0FBQztZQUVELElBQUksQ0FBQztnQkFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdEMsQ0FBQztZQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDeEIsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUVKLENBQUE7QUFuRFksb0JBQW9CO0lBRGhDLGtCQUFTLEVBQUU7cUNBTTJCLHdCQUFhO0dBTHZDLG9CQUFvQixDQW1EaEM7QUFuRFksb0RBQW9CIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtDb21wb25lbnR9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcblxuY29uc3QgZnMgPSByZXF1aXJlKCdmcycpO1xuY29uc3QgcHJvdG9idWZMaWIgPSByZXF1aXJlKCdwcm90b2NvbC1idWZmZXJzJyk7XG5cbmltcG9ydCB7Q2hhaW5TZXJ2aWNlLCBDT0RFX1VQREFURX0gZnJvbSAnLi4vLi4vLi4vc2VydmljZXMvc2F3dG9vdGgvY2hhaW4uc2VydmljZSc7XG5pbXBvcnQge0NsaWVudFNlcnZpY2V9IGZyb20gJy4uLy4uLy4uL2NvbmZpZy9zZXJ2aWNlcy9zZXJ2aWNlcyc7XG5pbXBvcnQge0JhdGNofSBmcm9tICcuLi9tb2RlbHMvYmF0Y2gnO1xuaW1wb3J0IHtQb3N0Q2xpZW50VXNlckRUT30gZnJvbSAnLi4vbW9kZWxzL2R0by9wb3N0LmthenRlbC51c2VyLmR0byc7XG5pbXBvcnQge0VudkNvbmZpZ30gZnJvbSAnLi4vLi4vLi4vY29uZmlnL2Vudic7XG5pbXBvcnQge1RmYVVzZXJEVE99IGZyb20gJy4uL21vZGVscy9kdG8vcG9zdC50ZmEudXNlci5kdG8nO1xuaW1wb3J0ICogYXMgcmVxdWVzdCBmcm9tICdyZXF1ZXN0LXByb21pc2UtbmF0aXZlJztcblxuXG5jb25zdCBtZXNzYWdlc1NlcnZpY2UgPSBwcm90b2J1ZkxpYihmcy5yZWFkRmlsZVN5bmMoJ3NyYy9wcm90by9zZXJ2aWNlLnByb3RvJykpO1xuXG5AQ29tcG9uZW50KClcbmV4cG9ydCBjbGFzcyBUZmFUcmFuc2FjdGlvbkZhbWlseSBleHRlbmRzIENoYWluU2VydmljZSB7XG4gICAgdGY6IHN0cmluZztcbiAgICB0ZlZlcnNpb246IHN0cmluZztcbiAgICBwcmVmaXg6IHN0cmluZztcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgY2xpZW50U2VydmljZTogQ2xpZW50U2VydmljZSkge1xuICAgICAgICBzdXBlcigpXG4gICAgICAgIHRoaXMuaW5pdFRGKCd0ZmEnKTtcbiAgICB9XG5cbiAgICB1cGRhdGVVc2VyKHBob25lTnVtYmVyOiBzdHJpbmcsIHVzZXI6IG9iamVjdCk6IFByb21pc2U8QmF0Y2g+IHtcblxuICAgICAgICBjb25zdCBwYXlsb2FkRGF0YSA9IG1lc3NhZ2VzU2VydmljZS5TQ1BheWxvYWQuZW5jb2RlKHtcbiAgICAgICAgICAgIEFjdGlvbjogQ09ERV9VUERBVEUsXG4gICAgICAgICAgICBQaG9uZU51bWJlcjogcGhvbmVOdW1iZXIsXG4gICAgICAgICAgICBQYXlsb2FkVXNlcjogdXNlcixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkVHJhbnNhY3Rpb24ocGF5bG9hZERhdGEsIHRoaXMuZ2V0QWRkcmVzcyhwaG9uZU51bWJlcikpXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxCYXRjaD5KU09OLnBhcnNlKHJlc3BvbnNlKS5kYXRhO1xuICAgICAgICAgICAgfSkuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdpbnZhbGlkIHJlc3BvbnNlJywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBnZXRTdGF0ZUJ5UGhvbmVOdW1iZXIocGhvbmVOdW1iZXI6IHN0cmluZyk6IFByb21pc2U8VGZhVXNlckRUT3xudWxsPiB7XG4gICAgICAgIHJldHVybiByZXF1ZXN0LmdldCh7XG4gICAgICAgICAgICBhdXRoOiB7XG4gICAgICAgICAgICAgICAgdXNlcjogRW52Q29uZmlnLlZBTElEQVRPUl9SRVNUX0FQSV9VU0VSLFxuICAgICAgICAgICAgICAgIHBhc3M6IEVudkNvbmZpZy5WQUxJREFUT1JfUkVTVF9BUElfUEFTUyxcbiAgICAgICAgICAgICAgICBzZW5kSW1tZWRpYXRlbHk6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1cmw6IGAke0VudkNvbmZpZy5WQUxJREFUT1JfUkVTVF9BUEl9L3N0YXRlLyR7dGhpcy5nZXRBZGRyZXNzKHBob25lTnVtYmVyKX1gLFxuICAgICAgICAgICAganNvbjogdHJ1ZVxuICAgICAgICB9KS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHJldHVybiA8VGZhVXNlckRUTz5tZXNzYWdlc1NlcnZpY2UuVXNlci5kZWNvZGUobmV3IEJ1ZmZlcihyZXNwb25zZS5kYXRhLCAnYmFzZTY0JykpO1xuICAgICAgICB9KS5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyb3IuZXJyb3IuY29kZSA9PT0gMzAgfHwgZXJyb3IucmVzcG9uc2Uuc3RhdHVzQ29kZSA9PT0gNTAyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2Vycm9yJywgZXJyb3IuZXJyb3IpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdlJywgZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxufVxuIl19