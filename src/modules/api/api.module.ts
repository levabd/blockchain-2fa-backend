import {MiddlewaresConsumer, Module} from '@nestjs/common';
import {UserController} from './controllsers/user.controller';
import {SmsCallbackController} from './controllsers/sms/sms.callback.controller';
import {SharedModule} from '../shared/shared.module';
import {NestModule} from '@nestjs/common/interfaces';
import {LoggerMiddleware} from './middleware/logger.middleware';
import {JsonMiddleware} from './middleware/json.middleware';
import {VerificationController} from './controllsers/verification.controller';
import {WebController} from './controllsers/web.controller';
import {ApiKeyCheckerMiddleware} from './middleware/api.key.checker.middleware';
import {FrontendApiKeyCheckerMiddleware} from './middleware/frontend.api.key.checker.middleware';

@Module({
    controllers: [
        UserController,
        VerificationController,
        WebController,
        SmsCallbackController
    ],
    imports: [
        SharedModule
    ]
})
export class ApiModule implements NestModule{
    configure(consumer: MiddlewaresConsumer): MiddlewaresConsumer | void {
        consumer.apply(JsonMiddleware).forRoutes(UserController);
        consumer.apply(ApiKeyCheckerMiddleware).forRoutes(UserController);
        consumer.apply(FrontendApiKeyCheckerMiddleware).forRoutes(VerificationController);
        consumer.apply(LoggerMiddleware).forRoutes(UserController);
    }
}