import {MiddlewaresConsumer, Module} from '@nestjs/common';
import {UserController} from './controllsers/user.controller';
import {SmsCallbackController} from './controllsers/sms/sms.callback.controller';
import {SharedModule} from '../shared/shared.module';
import {NestModule} from '@nestjs/common/interfaces';
import {LoggerMiddleware} from './middleware/logger.middleware';
import {JsonMiddleware} from './middleware/json.middleware';
import {VerificationController} from './controllsers/verification.controller';
import {ChainController} from './controllsers/chain.controller';

@Module({
    controllers: [
        UserController,
        VerificationController,
        ChainController,
        SmsCallbackController
    ],
    imports: [
        SharedModule
    ]
})
export class ApiModule implements NestModule{
    configure(consumer: MiddlewaresConsumer): MiddlewaresConsumer | void {
        consumer.apply(JsonMiddleware).forRoutes(UserController);
        // consumer.apply(ApiKeyCheckerMiddleware).forRoutes(UserController);
        consumer.apply(LoggerMiddleware).forRoutes(UserController);
    }
}