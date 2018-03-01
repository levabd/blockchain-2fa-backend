import { CarService } from './../routes/cars/car.service';
import { EventsModule } from './events.module';
import { ChainModule } from './chain.module';
import { QueueModule } from './queue.module';
import { EnvConfig } from './../config/env';
import { FabricOptions, Log } from 'hlf-node-utils';
import { MiddlewaresConsumer, Module, RequestMethod } from '@nestjs/common';
import { PingService } from '../routes/ping/ping.service';
import { PingController } from '../routes/ping/ping.controller';
import { HlfClient } from '../services/chain/hlfclient';
import { QueueListenerService } from '../services/queue/queuelistener.service';
import { NestModule } from '@nestjs/common/interfaces';
import { AuthenticationMiddleware } from '../middleware/authentication.middleware';
import { CarController } from '../routes/cars/car.controller';
import * as path from 'path';
import {CodeQueueListenerService} from '../services/code_sender/queue.service';
import {SmsCallbackController} from '../routes/sms/sms.callback.controller';
import {UserController} from '../routes/users/user.controller';
import {ClientService} from '../config/services/available.services';

@Module({
    controllers: [
        PingController,
        CarController,
        SmsCallbackController,
        UserController
    ],
    components: [
        PingService,
        CarService,
        ClientService
    ],
    modules: [
        ChainModule,
        QueueModule,
        EventsModule,
    ],
})
export class ApplicationModule implements NestModule {

    /**
     * Creates an instance of ApplicationModule.
     * @param {HlfClient} hlfClient
     * @param {QueueListenerService} queueListenerService
     * @param codeQueueListenerService
     * @memberof ApplicationModule
     */
    constructor(private hlfClient: HlfClient,
                private queueListenerService: QueueListenerService,
                private codeQueueListenerService: CodeQueueListenerService,
    ) {
        // list env keys in cli
        for (let propName of Object.keys(EnvConfig)) {
            Log.config.debug(`${propName}:  ${EnvConfig[propName]}`);
        }

        // set hlf client options
        this.hlfClient.setOptions(<FabricOptions>{
            walletPath: path.resolve(__dirname, '..', 'config', `creds`),
            userId: 'user1',
            channelId: 'mychannel',
            networkUrl: `grpc://${EnvConfig.PEER_HOST}:7051`,
            eventUrl: `grpc://${EnvConfig.PEER_HOST}:7053`,
            ordererUrl: `grpc://${EnvConfig.ORDERER_HOST}:7050`
        });

        // init hlf client
        this.hlfClient.init().then(result => {
            if (!EnvConfig.BYPASS_QUEUE) {
                Log.awssqs.info(`Starting Queue Listener...`);
                this.queueListenerService.init();
            }
        });

        // init queue listener
        this.codeQueueListenerService.listen();
    }

    /**
     * Protected routes
     *
     * @param {MiddlewaresConsumer} consumer
     * @memberof ApplicationModule
     */
    configure(consumer: MiddlewaresConsumer): void {
        consumer.apply(AuthenticationMiddleware).forRoutes(
            { path: '/protectedroute', method: RequestMethod.ALL },
            // {path: '/cars', method: RequestMethod.ALL}
        );
    }
}