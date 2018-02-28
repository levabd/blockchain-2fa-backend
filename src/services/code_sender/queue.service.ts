import {EnvConfig} from '../../config/env';
import {Component} from '@nestjs/common';
import {Log} from 'hlf-node-utils';
import * as Queue from 'bull';
import * as request from 'request-promise-native';
import {isValidNumber} from 'libphonenumber-js';
import {Services} from './services';

@Component()
export class CodeQueueListenerService {

    public queueSMS;
    public queuePUSH;
    public queueTelegram;

    /**
     * Creates an instance of QueueService.
     * @memberof CodeQueueListenerService
     */
    constructor() {
        const redisURL = `redis://${EnvConfig.REDIS_HOST}:${EnvConfig.REDIS_PORT}`;

        this.queueSMS = new Queue('code_queue_sms', redisURL);
        this.queuePUSH = new Queue('code_queue_push', redisURL);
        this.queueTelegram = new Queue('code_queue_telegram', redisURL);
    }

    /**
     * start listenning for queues messages
     *
     * @private
     * @memberof CodeQueueListenerService
     */
    public listen(): void {
        Log.config.info(`waiting for the jobs`);
        this.queueTelegram.process(this.processTelegramJob);
        this.queueSMS.process(this.processSMSJob);
        this.queuePUSH.process(this.processPUSHJob);

        // todo: make for whatsapp
        // this.queuePUSH.process(this.processWhatsAppJob);
    }

    /**
     * Process sending code to telegram bot
     *
     * @param job
     * @param done
     * @memberof CodeQueueListenerService
     */
    private processTelegramJob(job, done): void {
        {
            // job.data contains the custom data passed when the job was created
            // job.id contains id of this job.
            Log.config.info(`process queueTelegram`, job.data);
            done();
        }
    }

    /**
     * Process sending code by SMS
     *
     * @param job
     * @param done
     * @memberof CodeQueueListenerService
     */
    private async processSMSJob(job, done) {
        {
            Log.config.info(`processSMSJob start`);

            if (job.data.phone_number === '') {
                done(new Error('Phone number is empty'));
                return;
            }
            if (job.data.service === '') {
                done(new Error('Service is empty'));
                return;
            }
            if (job.data.service !== 'kazahtelecom') {
                done(new Error('Service kazahtelecom only can be handled'));
                return;
            }
            if (job.data.code === '') {
                done(new Error('Code is empty'));
                return;
            }
            // if (isValidNumber(job.data.phone_number) === true) {
            //     done(new Error('Code is empty'));
            //     return;
            // }
            const options = {
                method: 'POST',
                uri: 'http://smsc.kz/sys/send.php',
                formData: {
                    login: EnvConfig.SMS_USERNAME,
                    psw: EnvConfig.SMS_PASSWORD,
                    phones: job.data.phone_number,
                    sender:'TwoFA_S',
                    mes: 'Ваш код подтверждения для сервиса "'+Services[job.data.service]+'": ' +job.data.code,
                    charset: 'utf-8'
                }
            };
            const result = await request.post(options);

            Log.config.info(`processSMSJob end`, result);
            done();
        }
    }

    /**
     * Process sending code on device
     *
     * @param job
     * @param done
     * @memberof CodeQueueListenerService
     */
    private processPUSHJob(job, done): void {
        {
            // job.data contains the custom data passed when the job was created
            // job.id contains id of this job.
            Log.config.info(`processPUSHJob`, job.data);
            done();
        }
    }
}
