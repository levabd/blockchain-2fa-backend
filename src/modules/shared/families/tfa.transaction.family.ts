import {Component} from '@nestjs/common';
import {Log} from 'hlf-node-utils';
import {EnvConfig} from '../../../config/env';
import {_hash} from '../../../services/helpers/helpers';
import {ChainService} from '../../../services/sawtooth/chain.service';

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
export class TfaTransactionFamily {

    constructor(private chainService: ChainService) {
    }

    getAddress(uin: number, phoneNumber: string): string {
        const uinPart = _hash(uin.toString()).slice(-32);
        const phoneNumberPart = _hash(phoneNumber.toString()).slice(-32);

        return EnvConfig.TFA_FAMILY_NAMESPACE + uinPart + phoneNumberPart;
    }

    register(user: User): Promise<any> {
        const address = this.getAddress(user.Uin, user.PhoneNumber);
        console.log('address', address);

        return this.chainService.addTransaction({
            Action: 'register',
            Uin: user.Uin,
            PhoneNumber: user.PhoneNumber,
            User: user
        }, address);
    }

    update(user: User) {
        Log.app.debug('register');
    }

    setPushToken(pushToken: string) {
        Log.app.debug('setPushToken');
    }
}
