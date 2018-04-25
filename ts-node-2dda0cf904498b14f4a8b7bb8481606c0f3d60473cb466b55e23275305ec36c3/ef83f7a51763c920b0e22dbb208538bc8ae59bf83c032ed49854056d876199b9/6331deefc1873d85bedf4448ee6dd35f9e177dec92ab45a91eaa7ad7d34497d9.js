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
        console.log('${this.getAddress(phoneNumber)}', this.getAddress(phoneNumber));
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
            if (error.error.code === 30 || error.response.statusCode === 502) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9zaGFyZWQvZmFtaWxpZXMvZWdvdi50cmFuc2FjdGlvbi5mYW1pbHkudHMiLCJzb3VyY2VzIjpbIi9ob21lL3Blc2hrb3YvZGV2L3Byb2plY3RzL2Jsb2NrY2hhaW4tMmZhLWJhY2tlbmQvc3JjL21vZHVsZXMvc2hhcmVkL2ZhbWlsaWVzL2Vnb3YudHJhbnNhY3Rpb24uZmFtaWx5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUEsMkNBQXlDO0FBQ3pDLDRFQUFtRjtBQUduRiw2Q0FBOEM7QUFDOUMsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3pCLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0FBQ2hELE1BQU0scUJBQXFCLEdBQUcsV0FBVyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsZ0NBQWdDLENBQUMsQ0FBQyxDQUFDO0FBQzdGLGtEQUFrRDtBQUdsRCxJQUFhLHFCQUFxQixHQUFsQywyQkFBbUMsU0FBUSw0QkFBWTtJQU1uRDtRQUNJLEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN4QixDQUFDO0lBRUQsVUFBVSxDQUFDLFdBQW1CLEVBQUUsSUFBWTtRQUV4QyxNQUFNLFdBQVcsR0FBRyxxQkFBcUIsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDO1lBQ3ZELE1BQU0sRUFBRSwyQkFBVztZQUNuQixXQUFXLEVBQUUsV0FBVztZQUN4QixXQUFXLEVBQUUsSUFBSTtTQUNwQixDQUFDLENBQUM7UUFFSCxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQzthQUNoRSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDYixNQUFNLENBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDNUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN2QyxNQUFNLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNCLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUVELE9BQU8sQ0FBQyxXQUFtQjtRQUN2QixPQUFPLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUM3RSxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQztZQUNmLElBQUksRUFBRTtnQkFDRixJQUFJLEVBQUUsZUFBUyxDQUFDLHVCQUF1QjtnQkFDdkMsSUFBSSxFQUFFLGVBQVMsQ0FBQyx1QkFBdUI7Z0JBQ3ZDLGVBQWUsRUFBRSxJQUFJO2FBQ3hCO1lBQ0QsR0FBRyxFQUFFLEdBQUcsZUFBUyxDQUFDLGtCQUFrQixVQUFVLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFDNUUsSUFBSSxFQUFFLElBQUk7U0FDYixDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ2YsTUFBTSxDQUFvQixxQkFBcUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUNyRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDYixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxFQUFFLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxVQUFVLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDL0QsTUFBTSxDQUFDLElBQUksQ0FBQztZQUNoQixDQUFDO1lBRUQsSUFBSSxDQUFDO2dCQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDM0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RDLENBQUM7WUFBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNULE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSixDQUFBO0FBckRZLHFCQUFxQjtJQURqQyxrQkFBUyxFQUFFOztHQUNDLHFCQUFxQixDQXFEakM7QUFyRFksc0RBQXFCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtDb21wb25lbnR9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcbmltcG9ydCB7Q2hhaW5TZXJ2aWNlLCBDT0RFX1VQREFURX0gZnJvbSAnLi4vLi4vLi4vc2VydmljZXMvc2F3dG9vdGgvY2hhaW4uc2VydmljZSc7XG5pbXBvcnQge0JhdGNofSBmcm9tICcuLi9tb2RlbHMvYmF0Y2gnO1xuaW1wb3J0IHtQb3N0Q2xpZW50VXNlckRUT30gZnJvbSAnLi4vbW9kZWxzL2R0by9wb3N0LmthenRlbC51c2VyLmR0byc7XG5pbXBvcnQge0VudkNvbmZpZ30gZnJvbSAnLi4vLi4vLi4vY29uZmlnL2Vudic7XG5jb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG5jb25zdCBwcm90b2J1ZkxpYiA9IHJlcXVpcmUoJ3Byb3RvY29sLWJ1ZmZlcnMnKTtcbmNvbnN0IG1lc3NhZ2VzQ2xpZW50U2VydmljZSA9IHByb3RvYnVmTGliKGZzLnJlYWRGaWxlU3luYygnc3JjL3Byb3RvL3NlcnZpY2VfY2xpZW50LnByb3RvJykpO1xuaW1wb3J0ICogYXMgcmVxdWVzdCBmcm9tICdyZXF1ZXN0LXByb21pc2UtbmF0aXZlJztcblxuQENvbXBvbmVudCgpXG5leHBvcnQgY2xhc3MgRWdvdlRyYW5zYWN0aW9uRmFtaWx5IGV4dGVuZHMgQ2hhaW5TZXJ2aWNlIHtcblxuICAgIHRmOiBzdHJpbmc7XG4gICAgdGZWZXJzaW9uOiBzdHJpbmc7XG4gICAgcHJlZml4OiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5pbml0VEYoJ2Vnb3YnKTtcbiAgICB9XG5cbiAgICB1cGRhdGVVc2VyKHBob25lTnVtYmVyOiBzdHJpbmcsIHVzZXI6IG9iamVjdCk6IFByb21pc2U8QmF0Y2g+IHtcblxuICAgICAgICBjb25zdCBwYXlsb2FkRGF0YSA9IG1lc3NhZ2VzQ2xpZW50U2VydmljZS5TQ1BheWxvYWQuZW5jb2RlKHtcbiAgICAgICAgICAgIEFjdGlvbjogQ09ERV9VUERBVEUsXG4gICAgICAgICAgICBQaG9uZU51bWJlcjogcGhvbmVOdW1iZXIsXG4gICAgICAgICAgICBQYXlsb2FkVXNlcjogdXNlcixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkVHJhbnNhY3Rpb24ocGF5bG9hZERhdGEsIHRoaXMuZ2V0QWRkcmVzcyhwaG9uZU51bWJlcikpXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxCYXRjaD5KU09OLnBhcnNlKHJlc3BvbnNlKS5kYXRhO1xuICAgICAgICAgICAgfSkuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdpbnZhbGlkIHJlc3BvbnNlJywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBnZXRVc2VyKHBob25lTnVtYmVyOiBzdHJpbmcpOiBQcm9taXNlPFBvc3RDbGllbnRVc2VyRFRPfG51bGw+IHtcbiAgICAgICAgY29uc29sZS5sb2coJyR7dGhpcy5nZXRBZGRyZXNzKHBob25lTnVtYmVyKX0nLCB0aGlzLmdldEFkZHJlc3MocGhvbmVOdW1iZXIpKTtcbiAgICAgICAgcmV0dXJuIHJlcXVlc3QuZ2V0KHtcbiAgICAgICAgICAgIGF1dGg6IHtcbiAgICAgICAgICAgICAgICB1c2VyOiBFbnZDb25maWcuVkFMSURBVE9SX1JFU1RfQVBJX1VTRVIsXG4gICAgICAgICAgICAgICAgcGFzczogRW52Q29uZmlnLlZBTElEQVRPUl9SRVNUX0FQSV9QQVNTLFxuICAgICAgICAgICAgICAgIHNlbmRJbW1lZGlhdGVseTogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVyaTogYCR7RW52Q29uZmlnLlZBTElEQVRPUl9SRVNUX0FQSX0vc3RhdGUvJHt0aGlzLmdldEFkZHJlc3MocGhvbmVOdW1iZXIpfWAsXG4gICAgICAgICAgICBqc29uOiB0cnVlXG4gICAgICAgIH0pLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIDxQb3N0Q2xpZW50VXNlckRUTz5tZXNzYWdlc0NsaWVudFNlcnZpY2UuVXNlci5kZWNvZGUobmV3IEJ1ZmZlcihyZXNwb25zZS5kYXRhLCAnYmFzZTY0JykpO1xuICAgICAgICB9KS5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyb3IuZXJyb3IuY29kZSA9PT0gMzAgfHwgZXJyb3IucmVzcG9uc2Uuc3RhdHVzQ29kZSA9PT0gNTAyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2Vycm9yLmVycm9yJywgZXJyb3IucmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdlcnJvcicsIGVycm9yLmVycm9yKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZScsIGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG4iXX0=