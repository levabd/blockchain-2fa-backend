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
EgovTransactionFamily = __decorate([
    common_1.Component(),
    __metadata("design:paramtypes", [])
], EgovTransactionFamily);
exports.EgovTransactionFamily = EgovTransactionFamily;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvbW9kdWxlcy9zaGFyZWQvZmFtaWxpZXMvZWdvdi50cmFuc2FjdGlvbi5mYW1pbHkudHMiLCJzb3VyY2VzIjpbIi9ob21lL3Blc2hrb3YvZGV2L3Byb2plY3RzL2Jsb2NrY2hhaW4tMmZhLWJhY2tlbmQvc3JjL21vZHVsZXMvc2hhcmVkL2ZhbWlsaWVzL2Vnb3YudHJhbnNhY3Rpb24uZmFtaWx5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUEsMkNBQXlDO0FBQ3pDLDRFQUFtRjtBQUduRiw2Q0FBOEM7QUFDOUMsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3pCLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0FBQ2hELE1BQU0scUJBQXFCLEdBQUcsV0FBVyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsZ0NBQWdDLENBQUMsQ0FBQyxDQUFDO0FBQzdGLGtEQUFrRDtBQUdsRCxJQUFhLHFCQUFxQixHQUFsQywyQkFBbUMsU0FBUSw0QkFBWTtJQU1uRDtRQUNJLEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN4QixDQUFDO0lBRUQsVUFBVSxDQUFDLFdBQW1CLEVBQUUsSUFBWTtRQUV4QyxNQUFNLFdBQVcsR0FBRyxxQkFBcUIsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDO1lBQ3ZELE1BQU0sRUFBRSwyQkFBVztZQUNuQixXQUFXLEVBQUUsV0FBVztZQUN4QixXQUFXLEVBQUUsSUFBSTtTQUNwQixDQUFDLENBQUM7UUFFSCxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQzthQUNoRSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDYixNQUFNLENBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDNUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN2QyxNQUFNLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNCLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUVELE9BQU8sQ0FBQyxXQUFtQjtRQUN2QixNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQztZQUNmLEdBQUcsRUFBRSxHQUFHLGVBQVMsQ0FBQyxrQkFBa0IsVUFBVSxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQzVFLElBQUksRUFBRSxJQUFJO1NBQ2IsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNmLE1BQU0sQ0FBb0IscUJBQXFCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDckcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ2IsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDMUIsTUFBTSxDQUFDLElBQUksQ0FBQztZQUNoQixDQUFDO1lBRUQsSUFBSSxDQUFDO2dCQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN0QyxDQUFDO1lBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDVCxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QixDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0osQ0FBQTtBQTlDWSxxQkFBcUI7SUFEakMsa0JBQVMsRUFBRTs7R0FDQyxxQkFBcUIsQ0E4Q2pDO0FBOUNZLHNEQUFxQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7Q29tcG9uZW50fSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XG5pbXBvcnQge0NoYWluU2VydmljZSwgQ09ERV9VUERBVEV9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL3Nhd3Rvb3RoL2NoYWluLnNlcnZpY2UnO1xuaW1wb3J0IHtCYXRjaH0gZnJvbSAnLi4vbW9kZWxzL2JhdGNoJztcbmltcG9ydCB7UG9zdENsaWVudFVzZXJEVE99IGZyb20gJy4uL21vZGVscy9kdG8vcG9zdC5rYXp0ZWwudXNlci5kdG8nO1xuaW1wb3J0IHtFbnZDb25maWd9IGZyb20gJy4uLy4uLy4uL2NvbmZpZy9lbnYnO1xuY29uc3QgZnMgPSByZXF1aXJlKCdmcycpO1xuY29uc3QgcHJvdG9idWZMaWIgPSByZXF1aXJlKCdwcm90b2NvbC1idWZmZXJzJyk7XG5jb25zdCBtZXNzYWdlc0NsaWVudFNlcnZpY2UgPSBwcm90b2J1ZkxpYihmcy5yZWFkRmlsZVN5bmMoJ3NyYy9wcm90by9zZXJ2aWNlX2NsaWVudC5wcm90bycpKTtcbmltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdC1wcm9taXNlLW5hdGl2ZSc7XG5cbkBDb21wb25lbnQoKVxuZXhwb3J0IGNsYXNzIEVnb3ZUcmFuc2FjdGlvbkZhbWlseSBleHRlbmRzIENoYWluU2VydmljZSB7XG5cbiAgICB0Zjogc3RyaW5nO1xuICAgIHRmVmVyc2lvbjogc3RyaW5nO1xuICAgIHByZWZpeDogc3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuaW5pdFRGKCdlZ292Jyk7XG4gICAgfVxuXG4gICAgdXBkYXRlVXNlcihwaG9uZU51bWJlcjogc3RyaW5nLCB1c2VyOiBvYmplY3QpOiBQcm9taXNlPEJhdGNoPiB7XG5cbiAgICAgICAgY29uc3QgcGF5bG9hZERhdGEgPSBtZXNzYWdlc0NsaWVudFNlcnZpY2UuU0NQYXlsb2FkLmVuY29kZSh7XG4gICAgICAgICAgICBBY3Rpb246IENPREVfVVBEQVRFLFxuICAgICAgICAgICAgUGhvbmVOdW1iZXI6IHBob25lTnVtYmVyLFxuICAgICAgICAgICAgUGF5bG9hZFVzZXI6IHVzZXIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmFkZFRyYW5zYWN0aW9uKHBheWxvYWREYXRhLCB0aGlzLmdldEFkZHJlc3MocGhvbmVOdW1iZXIpKVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiA8QmF0Y2g+SlNPTi5wYXJzZShyZXNwb25zZSkuZGF0YTtcbiAgICAgICAgICAgIH0pLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnaW52YWxpZCByZXNwb25zZScsIGVycm9yKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZ2V0VXNlcihwaG9uZU51bWJlcjogc3RyaW5nKTogUHJvbWlzZTxQb3N0Q2xpZW50VXNlckRUT3xudWxsPiB7XG4gICAgICAgIHJldHVybiByZXF1ZXN0LmdldCh7XG4gICAgICAgICAgICB1cmk6IGAke0VudkNvbmZpZy5WQUxJREFUT1JfUkVTVF9BUEl9L3N0YXRlLyR7dGhpcy5nZXRBZGRyZXNzKHBob25lTnVtYmVyKX1gLFxuICAgICAgICAgICAganNvbjogdHJ1ZVxuICAgICAgICB9KS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHJldHVybiA8UG9zdENsaWVudFVzZXJEVE8+bWVzc2FnZXNDbGllbnRTZXJ2aWNlLlVzZXIuZGVjb2RlKG5ldyBCdWZmZXIocmVzcG9uc2UuZGF0YSwgJ2Jhc2U2NCcpKTtcbiAgICAgICAgfSkuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgaWYgKGVycm9yLmVycm9yLmNvZGUgPT09IDMwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2Vycm9yJywgZXJyb3IuZXJyb3IpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdlJywgZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiJdfQ==