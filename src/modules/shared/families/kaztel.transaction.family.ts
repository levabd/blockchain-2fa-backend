import * as request from 'request-promise-native';
import {Component} from '@nestjs/common';
import {ChainService, CODE_UPDATE} from '../../../services/sawtooth/chain.service';
import {Batch} from '../models/batch';
import {PostClientUserDTO} from '../models/dto/post.kaztel.user.dto';
import {EnvConfig} from '../../../config/env';

const fs = require('fs');
const protobufLib = require('protocol-buffers');
const messagesClientService = protobufLib(fs.readFileSync('src/proto/service_client.proto'));

@Component()
export class KaztelTransactionFamily extends ChainService {
    tf: string;
    tfVersion: string;
    prefix: string;

    constructor() {
        super();
        this.initTF('kaztel');
    }

    updateUser(phoneNumber: string, user: object): Promise<Batch> {

        const payloadData = messagesClientService.SCPayload.encode({
            Action: CODE_UPDATE,
            PhoneNumber: phoneNumber,
            PayloadUser: user,
        });

        return this.addTransaction(payloadData, this.getAddress(phoneNumber))
            .then(response => {
                return <Batch>JSON.parse(response).data;
            }).catch(error => {
                console.log('invalid response', error);
                throw new Error(error);
            });
    }

    getUser(phoneNumber: string): Promise<PostClientUserDTO|null> {
        return request.get({
            uri: `${EnvConfig.VALIDATOR_REST_API}/state/${this.getAddress(phoneNumber)}`,
            json: true
        }).then(response => {
            return <PostClientUserDTO>messagesClientService.User.decode(new Buffer(response.data, 'base64'));
        }).catch(error => {
            if (error.error.code === 30) {
                return null;
            }
            try {
                console.log('error', error.error);
            } catch (e) {
                console.log('e', e);
            }
        });
    }
}
