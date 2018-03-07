import { Module } from '@nestjs/common';
import {UserController} from './controllers/user.controller';
import {SharedModule} from '../shared/shared.module';
import {HomeController} from './controllers/home.controller';

@Module({
    controllers: [
        HomeController,
        UserController
    ],
    imports:[
        SharedModule
    ]
})
export class WebModule {}
