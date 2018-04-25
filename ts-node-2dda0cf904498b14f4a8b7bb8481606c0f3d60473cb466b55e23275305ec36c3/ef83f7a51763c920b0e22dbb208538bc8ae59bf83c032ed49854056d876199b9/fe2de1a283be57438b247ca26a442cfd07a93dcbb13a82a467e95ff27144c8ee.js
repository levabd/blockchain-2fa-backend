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
const chain_service_1 = require("../../../services/sawtooth/chain.service");
const env_1 = require("../../../config/env");
const fs = require('fs');
const protobufLib = require('protocol-buffers');
const messagesClientService = protobufLib(fs.readFileSync('src/proto/service_client.proto'));
const request = require("request-promise-native");
let EgovTransactionFamily = class EgovTransactionFamily extends chain_service_1.ChainService {
    constructor() {
        super();
        this.initTF('egov');
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
                console.log('error.error', error.response);
                console.log('error', error.error);
            }
            catch (e) {
                console.log('e', e);
            }
        });
    }
};
EgovTransactionFamily = __decorate([
    common_1.Component(),
    __metadata("design:paramtypes", [])
], EgovTransactionFamily);
exports.EgovTransactionFamily = EgovTransactionFamily;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9zaGFyZWQvZmFtaWxpZXMvZWdvdi50cmFuc2FjdGlvbi5mYW1pbHkudHMiLCJzb3VyY2VzIjpbIi9ob21lL3Blc2hrb3YvZGV2L3Byb2plY3RzL2Jsb2NrY2hhaW4tMmZhLWJhY2tlbmQvc3JjL21vZHVsZXMvc2hhcmVkL2ZhbWlsaWVzL2Vnb3YudHJhbnNhY3Rpb24uZmFtaWx5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUEsMkNBQXlDO0FBQ3pDLDRFQUFtRjtBQUduRiw2Q0FBOEM7QUFDOUMsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3pCLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0FBQ2hELE1BQU0scUJBQXFCLEdBQUcsV0FBVyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsZ0NBQWdDLENBQUMsQ0FBQyxDQUFDO0FBQzdGLGtEQUFrRDtBQUdsRCxJQUFhLHFCQUFxQixHQUFsQywyQkFBbUMsU0FBUSw0QkFBWTtJQU1uRDtRQUNJLEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN4QixDQUFDO0lBRUQsVUFBVSxDQUFDLFdBQW1CLEVBQUUsSUFBWTtRQUV4QyxNQUFNLFdBQVcsR0FBRyxxQkFBcUIsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDO1lBQ3ZELE1BQU0sRUFBRSwyQkFBVztZQUNuQixXQUFXLEVBQUUsV0FBVztZQUN4QixXQUFXLEVBQUUsSUFBSTtTQUNwQixDQUFDLENBQUM7UUFFSCxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQzthQUNoRSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDYixNQUFNLENBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDNUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN2QyxNQUFNLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNCLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUVELE9BQU8sQ0FBQyxXQUFtQjtRQUN2QixNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQztZQUNmLElBQUksRUFBRTtnQkFDRixJQUFJLEVBQUUsZUFBUyxDQUFDLHVCQUF1QjtnQkFDdkMsSUFBSSxFQUFFLGVBQVMsQ0FBQyx1QkFBdUI7Z0JBQ3ZDLGVBQWUsRUFBRSxJQUFJO2FBQ3hCO1lBQ0QsR0FBRyxFQUFFLEdBQUcsZUFBUyxDQUFDLGtCQUFrQixVQUFVLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFDNUUsSUFBSSxFQUFFLElBQUk7U0FDYixDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ2YsTUFBTSxDQUFvQixxQkFBcUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUNyRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDYixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixNQUFNLENBQUMsSUFBSSxDQUFDO1lBQ2hCLENBQUM7WUFFRCxJQUFJLENBQUM7Z0JBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMzQyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdEMsQ0FBQztZQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDeEIsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKLENBQUE7QUFwRFkscUJBQXFCO0lBRGpDLGtCQUFTLEVBQUU7O0dBQ0MscUJBQXFCLENBb0RqQztBQXBEWSxzREFBcUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0NvbXBvbmVudH0gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xuaW1wb3J0IHtDaGFpblNlcnZpY2UsIENPREVfVVBEQVRFfSBmcm9tICcuLi8uLi8uLi9zZXJ2aWNlcy9zYXd0b290aC9jaGFpbi5zZXJ2aWNlJztcbmltcG9ydCB7QmF0Y2h9IGZyb20gJy4uL21vZGVscy9iYXRjaCc7XG5pbXBvcnQge1Bvc3RDbGllbnRVc2VyRFRPfSBmcm9tICcuLi9tb2RlbHMvZHRvL3Bvc3Qua2F6dGVsLnVzZXIuZHRvJztcbmltcG9ydCB7RW52Q29uZmlnfSBmcm9tICcuLi8uLi8uLi9jb25maWcvZW52JztcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcbmNvbnN0IHByb3RvYnVmTGliID0gcmVxdWlyZSgncHJvdG9jb2wtYnVmZmVycycpO1xuY29uc3QgbWVzc2FnZXNDbGllbnRTZXJ2aWNlID0gcHJvdG9idWZMaWIoZnMucmVhZEZpbGVTeW5jKCdzcmMvcHJvdG8vc2VydmljZV9jbGllbnQucHJvdG8nKSk7XG5pbXBvcnQgKiBhcyByZXF1ZXN0IGZyb20gJ3JlcXVlc3QtcHJvbWlzZS1uYXRpdmUnO1xuXG5AQ29tcG9uZW50KClcbmV4cG9ydCBjbGFzcyBFZ292VHJhbnNhY3Rpb25GYW1pbHkgZXh0ZW5kcyBDaGFpblNlcnZpY2Uge1xuXG4gICAgdGY6IHN0cmluZztcbiAgICB0ZlZlcnNpb246IHN0cmluZztcbiAgICBwcmVmaXg6IHN0cmluZztcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmluaXRURignZWdvdicpO1xuICAgIH1cblxuICAgIHVwZGF0ZVVzZXIocGhvbmVOdW1iZXI6IHN0cmluZywgdXNlcjogb2JqZWN0KTogUHJvbWlzZTxCYXRjaD4ge1xuXG4gICAgICAgIGNvbnN0IHBheWxvYWREYXRhID0gbWVzc2FnZXNDbGllbnRTZXJ2aWNlLlNDUGF5bG9hZC5lbmNvZGUoe1xuICAgICAgICAgICAgQWN0aW9uOiBDT0RFX1VQREFURSxcbiAgICAgICAgICAgIFBob25lTnVtYmVyOiBwaG9uZU51bWJlcixcbiAgICAgICAgICAgIFBheWxvYWRVc2VyOiB1c2VyLFxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcy5hZGRUcmFuc2FjdGlvbihwYXlsb2FkRGF0YSwgdGhpcy5nZXRBZGRyZXNzKHBob25lTnVtYmVyKSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gPEJhdGNoPkpTT04ucGFyc2UocmVzcG9uc2UpLmRhdGE7XG4gICAgICAgICAgICB9KS5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2ludmFsaWQgcmVzcG9uc2UnLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIGdldFVzZXIocGhvbmVOdW1iZXI6IHN0cmluZyk6IFByb21pc2U8UG9zdENsaWVudFVzZXJEVE98bnVsbD4ge1xuICAgICAgICByZXR1cm4gcmVxdWVzdC5nZXQoe1xuICAgICAgICAgICAgYXV0aDoge1xuICAgICAgICAgICAgICAgIHVzZXI6IEVudkNvbmZpZy5WQUxJREFUT1JfUkVTVF9BUElfVVNFUixcbiAgICAgICAgICAgICAgICBwYXNzOiBFbnZDb25maWcuVkFMSURBVE9SX1JFU1RfQVBJX1BBU1MsXG4gICAgICAgICAgICAgICAgc2VuZEltbWVkaWF0ZWx5OiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXJpOiBgJHtFbnZDb25maWcuVkFMSURBVE9SX1JFU1RfQVBJfS9zdGF0ZS8ke3RoaXMuZ2V0QWRkcmVzcyhwaG9uZU51bWJlcil9YCxcbiAgICAgICAgICAgIGpzb246IHRydWVcbiAgICAgICAgfSkudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gPFBvc3RDbGllbnRVc2VyRFRPPm1lc3NhZ2VzQ2xpZW50U2VydmljZS5Vc2VyLmRlY29kZShuZXcgQnVmZmVyKHJlc3BvbnNlLmRhdGEsICdiYXNlNjQnKSk7XG4gICAgICAgIH0pLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgIGlmIChlcnJvci5lcnJvci5jb2RlID09PSAzMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdlcnJvci5lcnJvcicsIGVycm9yLnJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZXJyb3InLCBlcnJvci5lcnJvcik7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2UnLCBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuIl19