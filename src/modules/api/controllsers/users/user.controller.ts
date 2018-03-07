import {Body, Controller, Get, HttpStatus, Post, Query, Res} from '@nestjs/common';
import {ApiUseTags} from '@nestjs/swagger';

import {Log} from 'hlf-node-utils';
import * as redis from 'redis';
import * as Promisefy from 'bluebird';
import {PostVerifyDTO} from '../../../shared/models/dto/post.verify.dto';
import {CodeQueueListenerService} from '../../../../services/code_sender/queue.service';
import {ClientService} from '../../../../config/services/services';
import {TimeHelper} from '../../../../services/helpers/time.helper';
import {Validator} from '../../../../services/helpers/validation.helper';
import {TwoFaUser} from '../../../shared/models/chaincode/twofa/user.model';
import {TwoFaUserService} from '../../../shared/user.service';

@ApiUseTags('v1/api/users')
@Controller('v1/api/users')
export class UserController {
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
    async sendUserCode(@Res() res, @Query('phone_number') phoneNumber: string, @Query('service') service?: string): Promise<any[]> {
        Log.app.error(`sendUserCode`, 111);

        let v = new Validator({
            phone_number: phoneNumber,
            service: service
        }, {
            phone_number: 'required|string|regex:/^\\+?[1-9]\\d{1,14}$/',
            service: 'required|in:kazakhtelecom',
        }, {'service.in': `No service with name: ${service}`});
        Log.app.error(`111`, 111);

        if (v.fails()) {
            Log.app.error(`222`, 222);
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
        }
        Log.app.error(`333`, 33);

        // vallidate if user exists
        // '77053234005'
        let HFUser = new TwoFaUser('', '');
        try {
            HFUser = await this.twofaService.queryUser(phoneNumber);
            const o:any = await this.twofaService.queryUser(phoneNumber);

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
        let v = new Validator(body, {
            phone_number: 'required|string|regex:/^\\+?[1-9]\\d{1,14}$/',
            service: 'requiredIfNot:push_token|string|in:kazakhtelecom',
            push_token: 'nullable|string',
            code: 'required|number',

        }, {
            'service.in': `No service with name: ${body.service}`,
            'service.requiredIfNot': `The service field is required when push_token is empty.`
        });

        if (v.fails()) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
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

        return res.status(HttpStatus.OK).json({status: 'success'});
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