import { Module } from '@nestjs/common';
import {UserController} from './routes/users/user.controller';
import {SharedModule} from '../shared/shared.module';

@Module({
    controllers: [
        UserController
    ],
    imports:[
        SharedModule
    ]
})
export class WebModule {}
