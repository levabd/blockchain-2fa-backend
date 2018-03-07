import {Module} from '@nestjs/common';
import {UserController} from './controllsers/users/user.controller';
import {SmsCallbackController} from './controllsers/sms/sms.callback.controller';
import {SharedModule} from '../shared/shared.module';

@Module({
    controllers: [
        UserController,
        SmsCallbackController
    ],
    imports: [
        SharedModule
    ]
})
export class ApiModule {
}