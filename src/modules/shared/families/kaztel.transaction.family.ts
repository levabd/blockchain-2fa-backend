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
    tryCounter: number;

    constructor() {
        super();
        this.initTF('kaztel');
        this.tryCounter = 0;
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

    getUser(phoneNumber: string): Promise<PostClientUserDTO | null> {
        // console.log('`url', `${EnvConfig.VALIDATOR_REST_API}/state/${this.getAddress(phoneNumber)}`);
        return request.get({
            // auth: {
            //     user: EnvConfig.VALIDATOR_REST_API_USER,
            //     pass: EnvConfig.VALIDATOR_REST_API_PASS,
            //     sendImmediately: true
            // },
            url: `${EnvConfig.VALIDATOR_REST_API}/state/${this.getAddress(phoneNumber)}`,
            json: true
        }).then(response => {
            this.tryCounter = 0;
            return <PostClientUserDTO>messagesClientService.User.decode(new Buffer(response.data, 'base64'));
        }).catch(error => {
            if (error.response.statusCode === 502) {
                if (this.tryCounter <= 10) {
                    this.tryCounter++;
                    return this.getUser(phoneNumber);
                } else {
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
            } catch (e) {
                console.log('e', e);
                return null;
            }
        });
    }
}
