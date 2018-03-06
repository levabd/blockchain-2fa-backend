import {Body, Controller, Get, HttpStatus, Post, Query, Res, UsePipes, ValidationPipe} from '@nestjs/common';
import {TwoFaUserService} from '../../../shared/user.service';
import {CodeQueueListenerService} from '../../../../services/code_sender/queue.service';
import {Log} from 'hlf-node-utils';
import {ClientService} from '../../../../config/services/services';
import * as redis from 'redis';
import {TwoFaUser} from '../../../shared/models/chaincode/twofa/user.model';
import {TimeHelper} from '../../../../services/helpers/time.helper';
import * as Promisefy from 'bluebird';
import {Validator} from '../../../../services/helpers/validation.helper';
import {PostVerifyDTO} from '../../../shared/models/app/post.verify.dto';

@Controller('v1/web/users')
export class UserController {
    private phoneNumberPattern = /^\+?[1-9]\d{1,14}$/g;
    private redisClient;

    /**
     * Creates an instance of CarController.
     * @memberof CarController
     * @param timeHelper
     * @param twofaService
     * @param services
     * @param codeQueueListenerService
     */
    constructor(private timeHelper: TimeHelper,
                private twofaService: TwoFaUserService,
                private services: ClientService,
                private codeQueueListenerService: CodeQueueListenerService) {
        Promisefy.promisifyAll(redis);
        this.redisClient = redis.createClient();
    }

    /**
     * Get all cars
     *
     * @returns {Promise<[]>}
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
    async sendUserCode(@Res() res,
                       @Query('phone_number') phoneNumber: string,
                       @Query('service') service?: string): Promise<any[]> {

        let errorHandler = new Validator();

        if (!phoneNumber || phoneNumber === '') {
            errorHandler.addError('phone_number', 'The phone number field is required.');
        }

        if (!errorHandler.stringFitRegex(phoneNumber, this.phoneNumberPattern)) {
            errorHandler.addError('phone_number', 'The phone number format is invalid.');
        }

        if (typeof phoneNumber !== 'string') {
            errorHandler.addError('phone_number', 'The phone number must be a string.');
        }

        if (service && service !== '') {
            if (typeof service !== 'string') {
                errorHandler.addError('service', 'The service must be a string.');
            }

            if (!this.services.serviceWithNameExists(service)) {
                errorHandler.addError('service', `No service with name: ${service}`);
            }
        }

        if (!errorHandler.isEmpty()) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(errorHandler.getErrors());
        }

        // vallidate if user exists
        // '77053234005'
        let HFUser = new TwoFaUser('', '');
        try {
            HFUser = await this.twofaService.queryUser(phoneNumber);
        } catch (e) {
            Log.app.error(`Error while getting user`, e);
            return res.status(HttpStatus.NOT_FOUND).json({error: 'User not found.'});
        }

        // send sms
        const code = this.sendSMS(phoneNumber, service);
        const unixtime = this.timeHelper.getUnixTimeAfterMinutes(7);

        if (service === '') {
            service = 'service_is_impty';
        }
        // save code to redis
        // this key will expire after 8 * 60 seconds
        this.redisClient.setAsync(`${phoneNumber}:${service}`, `${code}:${unixtime}`, 'EX', 7 * 60).then(function (_res) {
            Log.app.info(`Set Redis response status:`, _res);
        });

        this.redisClient.getAsync(`${phoneNumber}:${service}`).then(function (_res) {
            Log.app.info(`Under the key ${phoneNumber}:${service} Redis will store data:`, _res);
        });

        return res.status(HttpStatus.OK).json({status: 'success'});
    }

    @Post('verify-number')
    async verifyNumber(@Res() res, @Body() body: PostVerifyDTO): Promise<any[]> {
        let errorHandler = new Validator();

        if (!body.phone_number || body.phone_number === '') {
            errorHandler.addError('phone_number', 'The phone number field is required.');
        }

        if (!errorHandler.stringFitRegex(body.phone_number, this.phoneNumberPattern)) {
            errorHandler.addError('phone_number', 'The phone number format is invalid.');
        }

        if (typeof body.phone_number !== 'string') {
            errorHandler.addError('phone_number', 'The phone number must be a string.');
        }

        if (body.service && body.service !== '') {
            if (typeof body.service !== 'string') {
                errorHandler.addError('service', 'The service must be a string.');
            }

            if (!this.services.serviceWithNameExists(body.service)) {
                errorHandler.addError('service', `No service with name: ${body.service}`);
            }
        }

        if (body.push_token && body.push_token !== '') {
            if (typeof body.push_token !== 'string') {
                errorHandler.addError('push_token', 'The push_token must be a string.');
            }
        } else if (!body.service || body.service === '') {
            errorHandler.addError('service', 'The service field is required when push_token is empty.');
        }

        if (!body.code || body.code === '') {
            errorHandler.addError('code', 'The code field is required.');
        }

        if (typeof body.code !== 'number') {
            errorHandler.addError('code', 'The code may only contain numbers.');
        }

        if (!errorHandler.isEmpty()) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(errorHandler.getErrors());
        }

        // vallidate if user exists
        // '77053234005'
        let HFUser = new TwoFaUser('', '');
        try {
            HFUser = await this.twofaService.queryUser(body.phone_number);
        } catch (e) {
            Log.app.error(`Error while getting user`, e);
            return res.status(HttpStatus.NOT_FOUND).json({error: 'User not found.'});
        }

        if (body.service === '') {
            body.service = 'service_is_impty';
        }

        try {
            // todo do all the logic
            await this.redisClient.getAsync(`${body.phone_number}:${body.service}`)
                .then(function (data, reply) {

                    if (reply === null) {
                        errorHandler.addError('code', 'The code expires.');
                        return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(errorHandler.getErrors());
                    }
                    const dArray = data.split(':');

                    let code;
                    let unixtime: number;

                    try {
                        code = parseInt(dArray [0], 10);
                        unixtime = parseInt(dArray [1], 10);
                    } catch (e) {
                        Log.app.error('Parse Redis data error: ', e);

                        // ask user to send code one more time
                        errorHandler.addError('code', 'The code expires.');
                        return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(errorHandler.getErrors());
                    }

                    // todo DONE 2 check code expires
                    if (this.timeHelper.dateExpires(unixtime)) {
                        errorHandler.addError('code', 'The code expires.');
                        return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(errorHandler.getErrors());
                    }

                    // todo DONE 1 check code
                    if (code !== body.code) {
                        errorHandler.addError('code', 'The code is not valid.');
                        return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(errorHandler.getErrors());
                    }
                    // todo DONE 3 if push token was given - store it in twofachannel
                    if (body.push_token && body.push_token != '') {
                        this.twofaService.setUserPush(body.phone_number, body.push_token);
                    }

                    // todo 4 if code is valid - set kaztelchanel user is_verified = true

                    return res.status(HttpStatus.OK).json({status: 'success'});
                }).catch(error => {
                    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
                });
        } catch (e) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(e);
        }
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
        // todo check code length
        const code = Math.floor(Math.random() * 999999);
        Log.app.info(`Code sent: `, code);
        return code;
    }

}