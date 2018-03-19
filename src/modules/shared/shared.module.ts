import { Module } from '@nestjs/common';
import {TimeHelper} from '../../services/helpers/time.helper';
import {ClientService} from '../../config/services/services';
import {TfaTransactionFamily} from './families/tfa.transaction.family';
import {CodeQueueListenerService} from '../../services/code_sender/queue.service';
import {ChainService} from '../../services/sawtooth/chain.service';
import {KaztelTransactionFamily} from './families/kaztel.transaction.family';

@Module({
    components:[
        ClientService,
        TfaTransactionFamily,
        KaztelTransactionFamily,
        CodeQueueListenerService,
        ChainService,
        TimeHelper,
    ],
    exports:[
        ClientService,
        TfaTransactionFamily,
        KaztelTransactionFamily,
        CodeQueueListenerService,
        ChainService,
        TimeHelper
    ]
})
export class SharedModule {}