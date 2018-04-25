import {MiddlewaresConsumer, Module, RequestMethod} from '@nestjs/common';
import {UserController} from './controllsers/user.controller';
import {SmsCallbackController} from './controllsers/sms/sms.callback.controller';
import {SharedModule} from '../shared/shared.module';
import {NestModule} from '@nestjs/common/interfaces';
import {LoggerMiddleware} from './middleware/logger.middleware';
import {JsonMiddleware} from './middleware/json.middleware';
import {WebController} from './controllsers/web.controller';
import {ApiKeyCheckerMiddleware} from './middleware/api.key.checker.middleware';
import {FrontendApiKeyCheckerMiddleware} from './middleware/frontend.api.key.checker.middleware';

@Module({
    controllers: [
        UserController,
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
        consumer.apply(FrontendApiKeyCheckerMiddleware).forRoutes(
            { path: '/v1/api/web/code', method: RequestMethod.POST },
            { path: '/v1/api/web/verify/code', method: RequestMethod.POST },
            { path: '/v1/api/web/verify/user', method: RequestMethod.POST },
            { path: '/v1/api/web/check-push-verification', method: RequestMethod.POST },
        );
        consumer.apply(LoggerMiddleware).forRoutes(UserController);
    }
}