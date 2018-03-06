import {Module} from '@nestjs/common';
import {UserController} from './routes/users/user.controller';
import {SmsCallbackController} from './routes/sms/sms.callback.controller';
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