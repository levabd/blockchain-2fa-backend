import {Body, Controller, HttpStatus, Post, Res} from '@nestjs/common';
import {ApiUseTags} from '@nestjs/swagger';
import {Validator} from '../../../services/helpers/validation.helper';
import {PostCodeDTO} from '../../shared/models/dto/post.code.dto';
import {Services} from '../../../services/code_sender/services';
import * as Promisefy from 'bluebird';
import * as redis from 'redis';
import {CodeQueueListenerService} from '../../../services/code_sender/queue.service';
import * as request from 'request-promise-native';
import {EnvConfig} from '../../../config/env';
import {TfaTransactionFamily} from '../../shared/families/tfa.transaction.family';
import {KaztelTransactionFamily} from '../../shared/families/kaztel.transaction.family';
import {EgovTransactionFamily} from '../../shared/families/egov.transaction.family';
import {ClientService} from '../../../config/services/services';

@ApiUseTags('v1/api/verification')
@Controller('v1/api/verification')
export class VerificationController {
    constructor(private tfaTF: TfaTransactionFamily,
                private kaztelTF: KaztelTransactionFamily,
                private egovTF: EgovTransactionFamily,
                private codeQueueListenerService: CodeQueueListenerService) {
        Promisefy.promisifyAll(redis);
    }

    @Post('code')
    postCode(@Res() res, @Body() body: PostCodeDTO) {
        let v = new Validator(body, {
            event: 'required|string',
            service: 'requiredIfNot:push_token|string|in:kazakhtelecom,egov',
            phone_number: 'required|string|regex:/^\\+?[1-9]\\d{1,14}$/',
            embeded: 'boolean',
            client_timestamp: 'required|number',
            cert: 'nullable',
        }, {'service.in': `No service with name: ${body.service}`});

        if (v.fails()) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(v.getErrors());
        }
        let address = '';
        switch (body.service) {
            case 'kazakhtelecom':
                const kazakhtelecom = this.kaztelTF.getAddress()
                

                break;
            case 'egov':
                address = '';

                break;
            default:
                throw new Error('Unsupported servive');
        }

        // Проверка, существует ли пользователь
        request.get(`${EnvConfig.VALIDATOR_REST_API}/state`,)
            .then(function (error, response, _body) {
                // Do more stuff with 'body' here

                if (error) {
                    // todo
                }
                if (response) {
                    // todo
                }
                console.log(error, response, body) // 200
            });

        const code = this.genCode();
        this.codeQueueListenerService.queuePUSH.add({
            push_token: body.push_token,
            message: 'Проверка',
            title: `Подтвердите вход на сервис '${Services['kazakhtelecom']}'`,
            code: code,
        });

        if (body.embeded) {
            return res.status(HttpStatus.OK).json({
                'name': 'Гвендолин',                    // Имя пользователя
                'phone_number': '+469983057932',        // Телефон пользователя
                'remember_cooldown': 2592000,         // Срок на который был запомнен второй фактор авторизации
                'status': 'success'
            });
        }
        return res.status(HttpStatus.OK).json({
            'resend_cooldown': 600,         // Количество секунд за которые надо ввести код и за которые нельзя отправить код повторно
            'method': 'push',               // Метод отправки (in:push,sms,telegram,whatsapp)
            'status': 'success'
        });
    }

    private genCode(): number {
        // todo check code length
        const code = Math.floor(Math.random() * 999999);
        return code;
    }
}