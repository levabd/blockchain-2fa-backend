import {Component} from '@nestjs/common';
const {createHash} = require('crypto');
const {protobuf} = require('sawtooth-sdk');
const {createContext, CryptoFactory} = require('sawtooth-sdk/signing');

import * as cbor from 'cbor';
import * as request from 'request-promise-native';

@Component()
export abstract class ChainService {

    // TODO: refactor

    protected batchQueue = [];
    protected transactionList = [];
    protected signer: any;
    protected context: any;
    protected timer: any;

    constructor() {
        this.context = createContext('secp256k1');
        const privateKey = this.context.newRandomPrivateKey();
        this.signer = new CryptoFactory(this.context).newSigner(privateKey);
    }

    // addToBatch(tx: any) {
    //     if (this.transactionList.length >= 35) {
    //         this.sendBatch();
    //         this.transactionList = [];
    //         this.timer = null;
    //         return;
    //     }
    //
    //     this.transactionList.push(tx);
    //     clearTimeout(this.timer);
    //
    //     const self=this;
    //     this.timer = setTimeout(function () {
    //         Log.app.debug('settimeout');
    //         // value === 'foobar' (passing values is optional)
    //         // This is executed after about 40 milliseconds.
    //         self.sendBatch();
    //         self.transactionList = [];
    //         self.timer = null;
    //     }, 1000);
    // }

    getSignedBatch() :any{
        const batchHeaderBytes = protobuf.BatchHeader.encode({
            signerPublicKey: this.signer.getPublicKey().asHex(),
            transactionIds: this.transactionList.map((txn) => txn.headerSignature),
        }).finish();

        const signature = this.signer.sign(batchHeaderBytes);

        const batch = protobuf.Batch.create({
            header: batchHeaderBytes,
            headerSignature: signature,
            transactions: this.transactionList
        });

       return protobuf.BatchList.encode({
            batches: [batch]
        }).finish();
    }

    addTransaction(payload: object, address: string, dependOn = '') : Promise<any>{
        const payloadBytes = cbor.encode(payload);

        const transactionHeaderBytes = protobuf.TransactionHeader.encode({
            familyName: 'tfa',
            familyVersion: '0.1',
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

        this.transactionList.push(transaction);

        // this.addToBatch(transaction);
        const batchListBytes = this.getSignedBatch();

        return request.post({
            url: 'http://127.0.0.1:8008/batches',
            body: batchListBytes,
            headers: {'Content-Type': 'application/octet-stream'}
        });
    }
}
