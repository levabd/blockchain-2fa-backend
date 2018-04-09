import {Component} from '@nestjs/common';

const {createHash} = require('crypto');
const {protobuf} = require('sawtooth-sdk');
const {createContext, CryptoFactory} = require('sawtooth-sdk/signing');
import * as request from 'request-promise-native';
import {EnvConfig} from '../../config/env';
import {_hash} from '../helpers/helpers';
import {UserLog} from '../../modules/shared/models/user.log';
import * as fs from 'fs';
import {Batch} from '../../modules/shared/models/batch';

const protobufMe = require('protocol-buffers');
const messagesClientService = protobufMe(fs.readFileSync('src/proto/service_client.proto'));
const AVAILABLE_TFS = {
    kaztel: {
        name: EnvConfig.KAZTEL_FAMILY_NAME,
        version: EnvConfig.KAZTEL_FAMILY_VERSION,
    },
    egov: {
        name: EnvConfig.EGOV_FAMILY_NAME,
        version: EnvConfig.EGOV_FAMILY_VERSION,
    },
    tfa: {
        name: EnvConfig.TFA_FAMILY_NAME,
        version: EnvConfig.TFA_FAMILY_VERSION,
    },
};

export const CODE_CREATE = 0;
export const CODE_UPDATE = 1;
export const CODE_GENERATE = 2;
export const CODE_VERIFY = 3;

@Component()
export abstract class ChainService {

    // TODO: refactor
    protected signer: any;
    protected context: any;
    public abstract tf: string;
    public abstract tfVersion: string;
    protected abstract prefix: string;

    constructor() {
        this.context = createContext('secp256k1');
        const privateKey = this.context.newRandomPrivateKey();
        this.signer = new CryptoFactory(this.context).newSigner(privateKey);
    }

    initTF(name: string) {
        this.tf = AVAILABLE_TFS[name]['name'];
        this.tfVersion = AVAILABLE_TFS[name]['version'];
        this.prefix = _hash(name).substring(0, 6);
    }

    setPrefix(name: string) {
        this.prefix = _hash(name).substring(0, 6);
    }

    getAddress(phoneNumber: string, prefix?: string): string {
        if (prefix) {
            this.setPrefix(prefix);
        }
        return this.prefix + _hash(phoneNumber.toString()).slice(-64);
    }

    updateUser(phoneNumber: string, user: object, service = 'tfa'): Promise<Batch> {
        this.initTF(service || 'tfa');
        return this.addTransaction({
            Action: CODE_UPDATE,
            PhoneNumber: phoneNumber,
            PayloadUser: user,
        }, this.getAddress(phoneNumber)).then(response => {
            return <Batch>JSON.parse(response).data;
        }).catch(error => {
            console.log('invalid response', error);
            throw new Error(error);
        });
    }

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    generateCode(phoneNumber: string, log: UserLog, tf: string): any {
        this.initTF(tf || 'kaztel');
        const address = this.getAddress(phoneNumber);
        const payloadData = messagesClientService.SCPayload.encode({
            Action: CODE_GENERATE,
            PhoneNumber: phoneNumber,
            PayloadLog: log,
        });
        return this.addTransaction(payloadData, address).then(response => {
            return JSON.parse(response);
        }).catch(error => {
            console.log('invalid response', error);
            throw new Error(error);
        });
    }

    verify(phoneNumber: string, log: UserLog, tf: string) {
        this.initTF(tf || 'kaztel');
        const address = this.getAddress(phoneNumber);
        const payloadData = messagesClientService.SCPayload.encode({
            Action: CODE_VERIFY,
            PhoneNumber: phoneNumber,
            PayloadLog: log,
        });
        return this.addTransaction(payloadData, address).then(response => {
            return JSON.parse(response);
        }).catch(error => {
            throw new Error(error);
        });
    }

    getSignedBatch(transactionList: any): any {
        const batchHeaderBytes = protobuf.BatchHeader.encode({
            signerPublicKey: this.signer.getPublicKey().asHex(),
            transactionIds: transactionList.map((txn) => txn.headerSignature),
        }).finish();

        const signature = this.signer.sign(batchHeaderBytes);

        const batch = protobuf.Batch.create({
            header: batchHeaderBytes,
            headerSignature: signature,
            transactions: transactionList
        });

        return protobuf.BatchList.encode({
            batches: [batch]
        }).finish();
    }

    addTransaction(payloadBytes: object, address: string, dependOn = ''): Promise<any> {
        const transactionHeaderBytes = protobuf.TransactionHeader.encode({
            familyName: this.tf,
            familyVersion: this.tfVersion,
            inputs: [address],
            outputs: [address],
            signerPublicKey: this.signer.getPublicKey().asHex(),
            // In this example, we're signing the batch with the same private key,
            // but the batch can be signed by another party, in which case, the
            // public key will need to be associated with that key.
            batcherPublicKey: this.signer.getPublicKey().asHex(),
            // In this example, there are no dependencies.  This list should include
            // an previous transaction header signatures that must be applied for
            // this transaction to successfully commit.
            // For example,
            dependencies: [],
            payloadSha512: createHash('sha512').update(payloadBytes).digest('hex')
        }).finish();
        const signature = this.signer.sign(transactionHeaderBytes);

        const transaction = protobuf.Transaction.create({
            header: transactionHeaderBytes,
            headerSignature: signature,
            payload: payloadBytes
        });

        return request.post({
            url: `${EnvConfig.VALIDATOR_REST_API}/batches`,
            body: this.getSignedBatch([transaction]),
            headers: {'Content-Type': 'application/octet-stream'}
        });
    }
}
