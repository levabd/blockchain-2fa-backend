import {ApiUseTags} from '@nestjs/swagger';
import {Body, Controller, Post} from '@nestjs/common';
import {Log} from 'hlf-node-utils';
import * as sha1 from 'js-sha1';
import {SmsBodyDto} from './sms.model';
import {EnvConfig} from '../../../../config/env';

@ApiUseTags('sms')
@Controller('sms')
export class SmsCallbackController {
    /**
     * This is the callback executed when the app sends sms
     * Body must contain SmsBodyDto's fields
     *
     * @returns {void}
     * @memberof SmsCallbackController
     * @param {SmsBodyDto} smsBodyDto - Callback data
     */
    @Post('callback')
    callback(@Body() smsBodyDto: SmsBodyDto): void {
        if (smsBodyDto.sha1 !== sha1(`${smsBodyDto.id}:${smsBodyDto.phone}:${smsBodyDto.status}:${EnvConfig.SMS_CALLBACK_TOKEN}`)) {
            Log.app.info(`Callback called with an invalid hash`, smsBodyDto);
            return;
        }

        Log.app.info(`SMS callback - `, smsBodyDto);
    }
}