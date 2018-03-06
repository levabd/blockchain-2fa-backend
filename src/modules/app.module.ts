import {EnvConfig} from '../config/env';
import {FabricOptions, Log} from 'hlf-node-utils';
import {MiddlewaresConsumer, Module} from '@nestjs/common';
import {HlfClient} from '../services/chain/hlfclient';
import {QueueListenerService} from '../services/queue/queuelistener.service';
import {NestModule} from '@nestjs/common/interfaces';
import * as path from 'path';

import {CodeQueueListenerService} from '../services/code_sender/queue.service';
import {LoggerMiddleware} from './api/middleware/logger.middleware';
import {ApiKeyCheckerMiddleware} from './api/middleware/api.key.checker.middleware';
import {WebModule} from './web/web.module';
import {ApiModule} from './api/api.module';
import {UserController as ApiUserController} from './api/routes/users/user.controller';
import {SharedModule} from './shared/shared.module';

@Module({
    modules: [
        WebModule,
        ApiModule,
        SharedModule
    ],
    exports: [
        SharedModule
    ]
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
                private codeQueueListenerService: CodeQueueListenerService,) {
        // list env keys in cli
        for (let propName of Object.keys(EnvConfig)) {
            Log.config.debug(`${propName}:  ${EnvConfig[propName]}`);
        }

        // set hlf client options
        this.hlfClient.setOptions(<FabricOptions>{
            walletPath: path.resolve(__dirname, '..', 'config', `creds`),
            userId: 'user1',
            channelId: EnvConfig.TWOFA_CHANNEL,
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
        consumer.apply(LoggerMiddleware).forRoutes(ApiUserController);
        consumer.apply(ApiKeyCheckerMiddleware).forRoutes(ApiUserController);
    }
}
