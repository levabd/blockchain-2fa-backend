import { Module } from '@nestjs/common';
import {TimeHelper} from '../../services/helpers/time.helper';
import {ClientService} from '../../config/services/services';
import {TfaTransactionFamily} from './families/tfa.transaction.family';
import {CodeQueueListenerService} from '../../services/code_sender/queue.service';
import {ChainService} from '../../services/sawtooth/chain.service';

@Module({
    components:[
        ClientService,
        TfaTransactionFamily,
        CodeQueueListenerService,
        ChainService,
        TimeHelper,
    ],
    exports:[
        ClientService,
        TfaTransactionFamily,
        CodeQueueListenerService,
        ChainService,
        TimeHelper
    ]
})
export class SharedModule {}