import {Body, Controller, Get, HttpStatus, Param, Post, Res} from '@nestjs/common';
import {ApiUseTags} from '@nestjs/swagger';
import {Validator} from '../../../services/helpers/validation.helper';
import {PostCodeDTO} from '../../shared/models/dto/post.code.dto';
import * as Promisefy from 'bluebird';
import * as redis from 'redis';
import {CodeQueueListenerService} from '../../../services/code_sender/queue.service';
import {TfaTransactionFamily} from '../../shared/families/tfa.transaction.family';

import {Log} from 'hlf-node-utils';
import {ChainService} from '../../../services/sawtooth/chain.service';
import {UserLog} from '../../shared/models/user.log';
import {TimeHelper} from '../../../services/helpers/time.helper';
import {PostClientUserDTO} from '../../shared/models/dto/post.kaztel.user.dto';
import {_getLatestIndex} from '../../../services/helpers/helpers';
import {Services} from '../../../services/code_sender/services';

@ApiUseTags('v1/api/verification')
@Controller('v1/api/verification')
export class VerificationController {
    constructor(private tfaTF: TfaTransactionFamily,
                private chainService: ChainService,
                private timeHelper: TimeHelper,
                private codeQueueListenerService: CodeQueueListenerService) {
        Promisefy.promisifyAll(redis);
    }

    @Post('verify-user')
    async postVerifyUser(@Res() res, @Body() body: PostCodeDTO) {
        let v = new Validator(body, {
            event: 'required|string',
            lang: 'string',
            service: 'requiredIfNot:push_token|string|in:kaztel,egov',
            phone_number: 'required|string|regex:/^\\+?[1-9]\\d{1,14}$/',
            embeded: 'boolean',
            client_timestamp: 'required|number',
            cert: 'nullable',
        }, {'service.in': `No service with name: ${body.service}`});
        if (v.fails()) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
        }
        let user;
        // Проверка, существует ли пользователь
        try {
            this.chainService.initTF(body.service);
            user = await this.chainService.getStateByPhoneNumber(body.phone_number);
        } catch (e) {
            Log.app.error(`Error while getting user`, e);
            return res.status(HttpStatus.NOT_FOUND).json({error: 'User not found.'});
        }

        // todo device check embeded,  cert
        return res.status(HttpStatus.OK).json({status: 'success', push_token: user.PushToken !== ''});
    }

    @Post('code')
    async postCode(@Res() res, @Body() body: PostCodeDTO) {
        let v = new Validator(body, {
            event: 'required|string',
            lang: 'string',
            method: 'required|string|in:sms,push,telegram,whatsapp',
            service: 'requiredIfNot:push_token|string|in:kaztel,egov',
            phone_number: 'required|string|regex:/^\\+?[1-9]\\d{1,14}$/',
            embeded: 'boolean',
            client_timestamp: 'required|number',
            cert: 'nullable',
            resend: 'boolean',
        }, {'service.in': `No service with name: ${body.service}`});
        if (v.fails()) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
        }

        // Проверка, существует ли пользователь
        let user;
        try {
            this.chainService.initTF(body.service);
            user = await this.chainService.getStateByPhoneNumber(body.phone_number);
        } catch (e) {
            Log.app.error(`Error while getting user`, e);
            return res.status(HttpStatus.NOT_FOUND).json({error: 'User not found.'});
        }

        let response;
        try {
            let log = new UserLog();
            log.ActionTime = (new Date()).getTime() / 1000;
            log.ExpiredAt = this.timeHelper.getUnixTimeAfterMinutes(7);
            log.Event = body.event;
            log.Method = body.method;
            log.Status = body.resend ? 'RESEND_CODE' : 'SEND_CODE';
            log.Embeded = body.embeded;
            log.Cert = body.cert;
            response = await this.chainService.addLog(body.phone_number, log);
        } catch (e) {
            Log.app.error(`Error while getting user`, e);
            return res.status(HttpStatus.BAD_GATEWAY).json({error: 'Ошибка отправки кода.'});
        }

        // todo device check embeded,  cert
        return res.status(HttpStatus.OK).json({
            resend_cooldown: 7 * 60,         // Количество секунд за которые надо ввести код и за которые нельзя отправить код повторно
            method: body.method,             // Метод отправки (in:push,sms,telegram,whatsapp)
            status: 'success',
            link: response.link
        });
    }

    @Post('verify')
    async postVerify(@Res() res, @Body() body: PostCodeDTO) {
        let v = new Validator(body, {
            event: 'required|string',
            lang: 'string',
            code: 'required|number',
            service: 'requiredIfNot:push_token|string|in:kaztel,egov',
            phone_number: 'required|string|regex:/^\\+?[1-9]\\d{1,14}$/',
            embeded: 'boolean',
            client_timestamp: 'required|number',
            cert: 'nullable',
        }, {'service.in': `No service with name: ${body.service}`});

        if (v.fails()) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
        }

        // Проверка, существует ли пользователь
        let user: PostClientUserDTO;
        try {
            this.chainService.initTF(body.service);
            user = await this.chainService.getStateByPhoneNumber(body.phone_number);
        } catch (e) {
            Log.app.error(`Error while getting user`, e);
            return res.status(HttpStatus.NOT_FOUND).json({error: 'Пользователь не найдет.'});
        }

        let latestLogIndex = 0;
        if (user.Logs) {
            latestLogIndex = _getLatestIndex(Object.keys(user.Logs));
        }

        try {
            let log = new UserLog();
            log.ActionTime = (new Date()).getTime() / 1000;
            log.ExpiredAt = this.timeHelper.getUnixTimeAfterMinutes(7);
            log.Event = body.event;
            log.Embeded = body.embeded;
            log.Status = 'VERIFY';
            log.Code = body.code;
            log.Cert = body.cert;

            const verifyResponse = await this.chainService.verify(body.phone_number, log);
            // Метод this.chainService.verify в случае успеха
            // сделает новую запись лога с новым индексом
            // Для того чтобы мы могли в дальнейем сделать
            // запрос на бекент с клиента и проверить статус
            // записи лога который сделал метод verify - увеличим индекс
            // текущего индекса на еденицу и отправим его клиенту
            if (latestLogIndex!==0) {
                latestLogIndex++;
            }

            return res.status(HttpStatus.OK).json({
                status: 'success',
                logIndexToCheck: latestLogIndex,
                link: verifyResponse.link
            });

        } catch (e) {
            Log.app.error(`Error while getting user`, e);
            return res.status(HttpStatus.BAD_GATEWAY).json({error: 'Ошибка проверки кода.'});
        }
    }

    /**
     * Проверяет, успешно ли прошла транзакция по проверке кода
     *
     * @param res - response
     * @param body {string} service - service
     * @param body {string} phone_number - phone_number
     * @param body {number} index - latestLogIndex
     * @returns {Promise<void>}
     */
    @Post('check-verification')
    async checkVerification(@Res() res, @Body() body) {
        let v = new Validator({
            service: body.service,
            phone_number: body.phone_number,
            index: body.index
        }, {
            service: 'required:|string|in:kaztel,egov',
            phone_number: 'required|string|regex:/^\\+?[1-9]\\d{1,14}$/',
            index: 'required|number'
        });

        if (v.fails()) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
        }

        // Проверка, существует ли пользователь
        let user: PostClientUserDTO;
        try {
            this.chainService.initTF(body.service);
            user = await this.chainService.getStateByPhoneNumber(body.phone_number);
        } catch (e) {
            Log.app.error(`Error while getting user`, e);
            return res.status(HttpStatus.NOT_FOUND).json({error: 'Пользователь не найдет.'});
        }

        return res.status(HttpStatus.OK).json({
            status: user.Logs[`${body.index}`].Status,
            user: user
        });
    }

    @Get('/deliver/:service/:method/:phone_number')
    async deliverCode(@Res() res, @Param() params): Promise<any> {

        if (!params.service || !params.method || !params.phone_number) {
            return res.status(HttpStatus.BAD_REQUEST).json({error: `Service, method and phone_number are required.`});
        }

        let user;
        try {
            this.chainService.initTF(params.service);
            user = await this.chainService.getStateByPhoneNumber(params.phone_number);
        } catch (e) {
            Log.app.error(`Error while getting user`, e);
            return res.status(HttpStatus.NOT_FOUND).json({error: e});
        }

        const imdex = _getLatestIndex(Object.keys(user.Logs));
        const log: UserLog = user.Logs[imdex];

        switch (log.Method) {
            case 'push':
                this.codeQueueListenerService.queuePUSH.add({
                    title: 'Двухфакторная авторизация',
                    message: `Подтвердите вход на сервис: '${Services[params.service]}'`,
                    push_token: user.PushToken
                });
                break;
            case 'sms':
                this.codeQueueListenerService.queueSMS.add({
                    phone_number: user.PhoneNumber,
                    service: params.service,
                    code: log.Code,
                });
                break;
            case 'telegram':
                // todo
                break;
            case 'whatsapp':
                // todo
                break;
            default:
                Log.app.error(`ChainController@deliverCode: method ${log.Method} is not supported.`);
                break;
        }

        return res.status(HttpStatus.OK).json({status: 'success'});
    }

}