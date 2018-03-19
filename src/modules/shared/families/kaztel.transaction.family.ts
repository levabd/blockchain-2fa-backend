import {Component} from '@nestjs/common';
import {Log} from 'hlf-node-utils';
import {EnvConfig} from '../../../config/env';
import {_hash} from '../../../services/helpers/helpers';
import {ChainService} from '../../../services/sawtooth/chain.service';
import * as  WebSocket from 'ws';

export class User {
    PhoneNumber: string;
    Uin: number;
    Name: string;
    IsVerified: boolean;
    Email: string;
    Sex: string;
    Birthdate: number;
    PushToken: string;
    LastActivity: number;
}

@Component()
export class KaztelTransactionFamily {

    constructor(private chainService: ChainService) {}

    getAddress(uin: number, phoneNumber: string): string {
        const uinPart = _hash(uin.toString()).slice(-32);
        const phoneNumberPart = _hash(phoneNumber.toString()).slice(-32);

        return EnvConfig.KAZTEL_FAMILY_NAMESPACE_HASH + uinPart + phoneNumberPart;
    }

    create(user: User): Promise<any> {
        const address = this.getAddress(user.Uin, user.PhoneNumber);
        return this.chainService.addTransaction({
            Action: 'create',
            Uin: user.Uin,
            PhoneNumber: user.PhoneNumber,
            User: user
        }, address);
    }
}
