import { Module } from '@nestjs/common';
import {TimeHelper} from '../../services/helpers/time.helper';
import {ClientService} from '../../config/services/services';
import {ChainModule} from './chain.module';
import {QueueModule} from './queue.module';
import {TwoFaUserService} from './user.service';

@Module({
    components:[
        ClientService,
        TwoFaUserService,
        TimeHelper,
    ],
    imports: [
        ChainModule,
        QueueModule,
    ],
    exports:[
        ClientService,
        TwoFaUserService,
        TimeHelper,
        ChainModule,
        QueueModule,
    ]
})
export class SharedModule {}