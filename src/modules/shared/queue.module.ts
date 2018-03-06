import { Module } from '@nestjs/common';
import { QueueListenerService } from '../../services/queue/queuelistener.service';
import { QueuePusherService } from '../../services/queue/queuepusher.service';
import {CodeQueueListenerService} from '../../services/code_sender/queue.service';

@Module({
    components: [
        QueueListenerService,
        QueuePusherService,
        CodeQueueListenerService
    ],
    exports: [
        QueueListenerService,
        QueuePusherService,
        CodeQueueListenerService
    ]
})
export class QueueModule { }