import {Body, Controller, Get, Param, Post, Query, Res, UsePipes, ValidationPipe} from '@nestjs/common';
import {ApiUseTags, ApiBearerAuth} from '@nestjs/swagger';
import {CarService} from './user.service';
import {CarDto} from './user.model';
import {CodeQueueListenerService} from '../../services/code_sender/queue.service';
import {Log} from 'hlf-node-utils';
import {ClientService} from '../../config/services/available.services';
import * as redis from 'redis';

@ApiBearerAuth()
@ApiUseTags('v1/users')
@Controller('v1/users')
export class UserController {
    private regex = /^\+?[1-9]\d{1,14}$/g;
    private redisClient;

    /**
     * Creates an instance of CarController.
     * @memberof CarController
     * @param carService
     * @param services
     * @param codeQueueListenerService
     */
    constructor(private carService: CarService,
                private services: ClientService,
                private codeQueueListenerService: CodeQueueListenerService) {
        this.redisClient = redis.createClient();
    }

    /**
     * Get all cars
     *
     * @returns {Promise<CarDto[]>}
     * @memberof CarController
     * @param res
     */
    @Get('')
    getAll(@Res() res): void {
        this.sendSMS('+8565134555', 'kazahtelecom');

        res.render('kazahtelecom/index', {message: 'Hello world!'});
    }

    @Get('verify-number')
    @UsePipes(new ValidationPipe())
    sendUserCode(@Query('phone_number') phoneNumber: string, @Query('service') service?: string): any {
        let errors = {phone_number: [], service: []};
        if (phoneNumber === '') {
            errors.phone_number.push('The phone number field is required.');
        }

        let m;
        let result = '';
        while ((m = this.regex.exec(phoneNumber)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === this.regex.lastIndex) {
                this.regex.lastIndex++;
            }

            // The result can be accessed through the `m`-variable.
            m.forEach((match, groupIndex) => {
                Log.app.info(`Found match, group ${groupIndex}: ${match}`);
                result = match;
            });
        }

        if (result === '') {
            errors.phone_number.push('The phone number format is invalid.');
        }

        if (typeof phoneNumber !== 'string') {
            errors.phone_number.push('The phone number must be a string.');
        }

        if (service !== '') {
            if (typeof service !== 'string') {
                errors.service.push('The service must be a string.');
            }

            if (!this.services.serviceWithNameExists(service)) {
                errors.service.push(`No service with name: ${service}`);
            }
        }

        if (errors.phone_number.length !== 0 || errors.service.length !== 0) {
            return errors;
        }

        // todo vallidate if user exists
        // todo vallidate if user exists


        Log.app.info('sendUserCode', phoneNumber, service);

        // send sms
        const code = this.sendSMS(phoneNumber, service);

        // save code to redis
        this.redisClient.set(`${phoneNumber}:${service}`, code, redis.print);

        return {
            status: 'success'
        };
    }

    private sendSMS(phoneNumber: string, service: string): number {
        const code = this.getCode();
        this.codeQueueListenerService.queueSMS.add(
            {
                phone_number: phoneNumber,
                service: service ? service : 'kazahtelecom',
                code: code,
            });

        return code;
    }

    private getCode(): number {
        return Math.floor(Math.random() * 999999);
    }

    @Post('verify-number')
    verifyNumber(@Body() body): any {
        // todo do validation
        return {status: 'success'};
    }
}