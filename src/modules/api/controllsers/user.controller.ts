import {Body, Controller, Get, HttpStatus, Post, Query, Req, Res} from '@nestjs/common';
import {ApiUseTags} from '@nestjs/swagger';

import * as redis from 'redis';
import * as Promisefy from 'bluebird';
import {PostVerifyNumberDTO} from '../../shared/models/dto/post.verify.number.dto';
import {CodeQueueListenerService} from '../../../services/code_sender/queue.service';
import {ClientService} from '../../../config/services/services';
import {TimeHelper} from '../../../services/helpers/time.helper';
import {Validator} from '../../../services/helpers/validation.helper';
import {TfaTransactionFamily} from '../../shared/families/tfa.transaction.family';
import {KaztelTransactionFamily} from '../../shared/families/kaztel.transaction.family';
import {ChainService} from '../../../services/sawtooth/chain.service';
import {EnvConfig} from '../../../config/env';
import * as WebSocket from 'ws';
import {ApiController} from './controller';
import {EgovTransactionFamily} from '../../shared/families/egov.transaction.family';
import {TelegramController} from './telegram.controller';

const fs = require('fs');
const protobufLib = require('protocol-buffers');
const messagesService = protobufLib(fs.readFileSync('src/proto/service.proto'));

const REDIS_USER_POSTFIX = 'verify-number-code';

@ApiUseTags('v1/api/users')
@Controller('v1/api/users')
export class UserController extends ApiController {
    private redisClient;

    /**
     * Creates an instance of CarController.
     * @memberof CarController
     * @param timeHelper
     * @param tfaTF
     * @param kaztelTF
     * @param egovTF
     * @param chainService
     * @param services
     * @param codeQueueListenerService
     */
    constructor(private timeHelper: TimeHelper,
                public tfaTF: TfaTransactionFamily,
                public kaztelTF: KaztelTransactionFamily,
                public egovTF: EgovTransactionFamily,
                public chainService: ChainService,
                private services: ClientService,
                private codeQueueListenerService: CodeQueueListenerService) {
        super(tfaTF, kaztelTF, egovTF);
        Promisefy.promisifyAll(redis);
        const redisURL = `redis://${EnvConfig.REDIS_HOST}:${EnvConfig.REDIS_PORT}`;
        this.redisClient = redis.createClient({url: redisURL});
    }

    @Get('verify-number')
    async sendUserCode(@Req() req,
                       @Res() res,
                       @Query('phone_number') phoneNumber: string): Promise<any[]> {

        let v = new Validator({phone_number: phoneNumber}, {phone_number: 'required|string|regex:/^\\+?[1-9]\\d{1,14}$/',});
        if (v.fails()) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
        }
        let user = await this.getUser(phoneNumber, 'tfa');
        if (user === null) {
            console.log('user not found!!!!!');
            return res.status(HttpStatus.NOT_FOUND).json({user: [this.getUserNotFoundMessage(req.query.lang || 'en')]});
        }
        const code = this.genCode();

        console.log('code', code);

        if (phoneNumber.charAt(0) === '+') {
            phoneNumber = phoneNumber.substring(1);
        }
        let self = this;
        // save code to redis
        // this key will expire after 8 * 60 seconds
        this.redisClient.setAsync(`${phoneNumber}:${REDIS_USER_POSTFIX}`, `${code}`, 'EX', 7 * 60).then(() => {
            // send sms
            self.codeQueueListenerService.queueSMS.add({
                phone_number: phoneNumber,
                service: 'kaztel',
                code: code,
                registration: true,
            });
        });
        return res.status(HttpStatus.OK).json({status: 'success'});
    }

    @Post('verify-number')
    async verifyNumber(@Res() res, @Body() body: PostVerifyNumberDTO): Promise<any[]> {

        // валидация
        let v = new Validator(body, {
            phone_number: 'required|string|regex:/^\\+?[1-9]\\d{1,14}$/',
            push_token: 'nullable|string',
            code: 'required|number',
        }, {
            'service.requiredIfNot': `The service field is required when push_token is empty.`
        });
        if (v.fails()) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
        }
        // убрать плюс в начале номера телефона если он есть
        if (body.phone_number.charAt(0) === '+') {
            body.phone_number = body.phone_number.substring(1);
        }
        // Проверка, существует ли пользователь
        let user = await this.getUser(body.phone_number, 'tfa');
        if (user === null) {
            console.log('user not found!!!!!');
            return res.status(HttpStatus.NOT_FOUND).json({user: [this.getUserNotFoundMessage(body.lang || 'en')]});
        }
        const redisKey = `${body.phone_number}:${REDIS_USER_POSTFIX}`;
        // проверка кода
        const codeFromRedis = await this.redisClient.getAsync(redisKey);
        if (codeFromRedis == null) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
                code: [body.lang === 'ru' ? 'Кода либо нету либо его срок истёк' : "The 'Code' expires or does not exists."]
            });
        }
        if (parseInt(codeFromRedis, 10) != parseInt(body.code, 10)) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
                code: [body.lang === 'ru' ? 'Вы ввели неверный код' : "The 'Code' is not valid."]
            });
        }
        await this.redisClient.del(redisKey);

        // подготовка адресов, за которыми нужно отследить успешное прохождение транзакции
        let userKaztel = await this.getUser(body.phone_number, 'kaztel');
        let userEgov = await this.getUser(body.phone_number, 'egov');
        let addresses = [
            this.chainService.getAddress(body.phone_number, 'tfa'),
        ];
        if (userKaztel !== null) {
            addresses.push(this.chainService.getAddress(body.phone_number, 'kaztel'));
        }
        if (userEgov !== null) {
            addresses.push(this.chainService.getAddress(body.phone_number, 'egov'));
        }
        // начинаем слушать изменения адресов
        let ws = new WebSocket(`ws:${EnvConfig.VALIDATOR_REST_API_HOST_PORT}/subscriptions`);
        ws.onopen = () => {
            ws.send(JSON.stringify({
                'action': 'subscribe',
                'address_prefixes': addresses
            }));
        };

        user.IsVerified = true;
        user.PushToken = body.push_token;
        await this.tfaTF.updateUser(body.phone_number, user);

        if (userKaztel !== null) {
            userKaztel.IsVerified = true;
            await this.kaztelTF.updateUser(body.phone_number, userKaztel);
        }
        if (userEgov !== null) {
            userKaztel.IsVerified = true;
            await this.egovTF.updateUser(body.phone_number, userEgov);
        }

        ws.onmessage = mess => {
            const data = JSON.parse(mess.data);
            let responseSend = false;

            for (let i = 0; i < data.state_changes.length; i++) {
                const stateChange = data.state_changes[i];
                if (addresses.indexOf(stateChange.address) !== -1) {
                    const _user = messagesService.User.decode(new Buffer(stateChange.value, 'base64'));
                    if (responseSend) {
                        ws.send(JSON.stringify({
                            'action': 'unsubscribe'
                        }));
                        break;
                    }
                    // todo: по хорошему надо во всех чейнах отследить изменения
                    if (_user.IsVerified) {
                        try {
                            responseSend = true
                            return res.status(HttpStatus.OK).json({status: 'success'});
                        } catch (e) {
                            console.log('error - trying to send response second time', e);
                        }
                    }
                }
            }
        };
        ws.onclose = () => {
            ws.send(JSON.stringify({
                'action': 'unsubscribe'
            }));
        };
    }

    /**
     * Generate code
     * @returns {number}
     */
    private genCode(): number {
        return this.getRandomInt(9999, 99999);
    }

    /**
     * Returns a random integer between min (inclusive) and max (inclusive)
     * Using Math.round() will give you a non-uniform distribution!
     */
    private getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}