import {Component} from '@nestjs/common';

const fs = require('fs');
const protobufLib = require('protocol-buffers');

import {ChainService, CODE_UPDATE} from '../../../services/sawtooth/chain.service';
import {ClientService} from '../../../config/services/services';
import {Batch} from '../models/batch';
import {PostClientUserDTO} from '../models/dto/post.kaztel.user.dto';
import {EnvConfig} from '../../../config/env';
import {TfaUserDTO} from '../models/dto/post.tfa.user.dto';
import * as request from 'request-promise-native';


const messagesService = protobufLib(fs.readFileSync('src/proto/service.proto'));

@Component()
export class TfaTransactionFamily extends ChainService {
    tf: string;
    tfVersion: string;
    prefix: string;

    constructor(private clientService: ClientService) {
        super()
        this.initTF('tfa');
    }

    updateUser(phoneNumber: string, user: object): Promise<Batch> {

        const payloadData = messagesService.SCPayload.encode({
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

    getStateByPhoneNumber(phoneNumber: string): Promise<TfaUserDTO|null> {
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
            return <TfaUserDTO>messagesService.User.decode(new Buffer(response.data, 'base64'));
        }).catch(error => {
            if (error.error.code === 30 || error.response.statusCode === 502) {
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
