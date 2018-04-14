import {Controller, Get, HttpStatus, Query, Res} from '@nestjs/common';
import {ApiUseTags} from '@nestjs/swagger';
import {EnvConfig} from '../../../config/env';
import {Validator} from '../../../services/helpers/validation.helper';

@ApiUseTags('v1/api/world')
@Controller('v1/api/world')
export class WebController {

    @Get('enter')
    getEnter(@Res() res,
             @Query('event') event: string,
             @Query('service') service: string) {
        let v = new Validator({
            event: event,
            service: service
        }, {
            event: 'required|string',
            service: 'required|string|in:kaztel,egov',
        }, {'service.in': `No service with name: ${service}`});
        if (v.fails()) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
        }
        return res.redirect(`${EnvConfig.FRONTEND_API}?service=${service}&event=${event}`);
    }
}