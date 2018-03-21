import {Component} from '@nestjs/common';

import {EnvConfig} from '../../../config/env';
import {_hash} from '../../../services/helpers/helpers';
import {ChainService} from '../../../services/sawtooth/chain.service';
import {ClientService} from '../../../config/services/services';

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
export class TfaTransactionFamily extends ChainService{
    tf: string;
    tfVersion: string;
    prefix: string;

    constructor( private clientService: ClientService) {
        super()
        this.prefix = EnvConfig.TFA_FAMILY_NAMESPACE
        this.tf = EnvConfig.TFA_FAMILY_NAME;
        this.tfVersion = EnvConfig.TFA_FAMILY_VERSION;
    }

    getAddress(PhoneNumber: string): string {
        return this.prefix + _hash(PhoneNumber.toString()).slice(-64);
    }

    create(user: User): Promise<any> {
        const address = this.getAddress(user.PhoneNumber);

        return this.addTransaction({
            Action: 'create',
            Uin: user.Uin,
            PhoneNumber: user.PhoneNumber,
            User: user
        }, address);
    }

    update(user: User) {
        console.log('create');
    }

    setPushToken(pushToken: string) {
        console.log('setPushToken');
    }
}
