import {Component} from '@nestjs/common';
import {EnvConfig} from '../../../config/env';
import {ChainService} from '../../../services/sawtooth/chain.service';
import {ClientService} from '../../../config/services/services';
import {ClientUser} from './client.model';
import {Log} from 'hlf-node-utils';

@Component()
export class KaztelTransactionFamily extends ChainService {
    tf: string;
    tfVersion: string;
    prefix: string;

    constructor(private chainService: ChainService, private clientService: ClientService) {
        super();
        this.prefix = this.clientService.getService('kaztel').getPrefix();
        this.tf = EnvConfig.KAZTEL_FAMILY_NAME;
        this.tfVersion = EnvConfig.KAZTEL_FAMILY_VERSION;
    }

    create(user: ClientUser): Promise<any> {
        const address = this.getAddress(user.PhoneNumber);
        return this.addTransaction({
            Action: 'create',
            Uin: user.Uin,
            PhoneNumber: user.PhoneNumber,
            User: user
        }, address);
    }
}
