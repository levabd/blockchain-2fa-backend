import { Module } from '@nestjs/common';
import {TimeHelper} from '../../services/helpers/time.helper';
import {ClientService} from '../../config/services/services';
import {TfaTransactionFamily} from './families/tfa.transaction.family';
import {CodeQueueListenerService} from '../../services/code_sender/queue.service';
import {ChainService} from '../../services/sawtooth/chain.service';
import {KaztelTransactionFamily} from './families/kaztel.transaction.family';
import {EgovTransactionFamily} from './families/egov.transaction.family';
import {TelegramServer} from '../../services/telegram/telegram.server';

@Module({
    components:[
        ClientService,
        TfaTransactionFamily,
        KaztelTransactionFamily,
        EgovTransactionFamily,
        CodeQueueListenerService,
        ChainService,
        TimeHelper,
        TelegramServer
    ],
    exports:[
        ClientService,
        TfaTransactionFamily,
        KaztelTransactionFamily,
        EgovTransactionFamily,
        CodeQueueListenerService,
        ChainService,
        TimeHelper,
        TelegramServer
    ]
})
export class SharedModule {}