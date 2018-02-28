import {ApiUseTags} from '@nestjs/swagger';
import {Body, Controller, Post} from '@nestjs/common';

@ApiUseTags('sms')
@Controller('sms')
export class SmsCallbackController {

    /**
     * Creates an instance of PingController.
     * @memberof PingController
     */
    constructor() {}

    /**
     * This is the callback executed when the app sends sms
     * Body must contain
     * Will indicate whether the service is loaded
     *
     * @returns {string}
     * @memberof PingController
     * @param smsBodyDto
     */
    @Post('callback')
    callback(@Body() smsBodyDto: any): any {
        return smsBodyDto;
    }
}