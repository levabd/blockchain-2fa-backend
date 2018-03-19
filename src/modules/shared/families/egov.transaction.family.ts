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
export class EgovTransactionFamily {

    private prefix = '';

    constructor(private chainService: ChainService, private clientService: ClientService) {
        this.clientService.getService('egov').getPrefix();
    }

    getAddress(uin: number): string {
        const uinPart = _hash(uin.toString()).slice(-32);
        return this.prefix + uinPart;
    }

    create(user: User): Promise<any> {
        const address = this.getAddress(user.Uin);
        return this.chainService.addTransaction({
            Action: 'create',
            Uin: user.Uin,
            PhoneNumber: user.PhoneNumber,
            User: user
        }, address);
    }
}
