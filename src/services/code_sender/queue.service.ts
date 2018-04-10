import {EnvConfig} from '../../config/env';
import {Component} from '@nestjs/common';

import * as Queue from 'bull';
import * as request from 'request-promise-native';
import {Services} from './services';
import * as gcm from 'node-gcm';
import {TelegramServer} from '../telegram/telegram.server';
const Telegraf = require('telegraf');

@Component()
export class CodeQueueListenerService {

    public queueSMS;
    public queuePUSH;
    public queueTelegram;

    /**
     * Creates an instance of QueueService.
     * @memberof CodeQueueListenerService
     */
    constructor(private telegramServer: TelegramServer) {
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
        console.info(`waiting for the jobs`);
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
        // job.data contains the custom data passed when the job was created
        // job.id contains id of this job.
        console.info(`process queueTelegram`, job.data);
        if (job.data.chat_id === '') {
            done(new Error('Chat id is empty'));
            return;
        }
        if (job.data.message === '') {
            done(new Error('Message is empty'));
            return;
        }
        const telegrafApp = new Telegraf (EnvConfig.TELEGRAM_BOT_KEY);
        telegrafApp.telegram.sendMessage(job.data.chat_id, job.data.message);
        done();
    }

    /**
     * Process sending code by SMS
     *
     * @param job
     * @param done
     * @memberof CodeQueueListenerService
     */
    private processSMSJob(job, done) {

        console.info(`processSMSJob start`);

        if (job.data.phone_number === '') {
            done(new Error('Phone number is empty'));
            return;
        }
        if (job.data.service === '') {
            done(new Error('Service is empty'));
            return;
        }
        if (job.data.service !== 'kaztel') {
            done(new Error('Service kazahtelecom only can be handled'));
            return;
        }
        if (job.data.code === '') {
            done(new Error('Code is empty'));
            return;
        }
        let message = 'Ваш код подтверждения для сервиса "' + Services[job.data.service] + '": ' + job.data.code;
        if (job.data.registration) {
            message = 'Ваш код подтверждения для сервиса TFA: ' + job.data.code;
        }
        const options = {
            method: 'POST',
            uri: 'http://smsc.kz/sys/send.php',
            formData: {
                login: EnvConfig.SMS_USERNAME,
                psw: EnvConfig.SMS_PASSWORD,
                phones: job.data.phone_number,
                sender: 'TwoFA_S',
                mes: message,
                charset: 'utf-8'
            }
        };
        request.post(options).then(r => {
            console.info(`processSMSJob end`, r);
            done();
        });
    }

    /**
     * Process sending code on device
     *
     * @param job
     * @param done
     * @memberof CodeQueueListenerService
     */
    private processPUSHJob(job, done): void {
        const fcm = new gcm.Sender(EnvConfig.FIREBASE_CLOUD_KEY);

        if (!job.data.title || !job.data.message) {
            console.info(`CodeQueueListenerService@processPUSHJob: Can not send push notification- not title or message provided.`);
            return;
        }

        if (!job.data.push_token) {
            console.info(`CodeQueueListenerService@processPUSHJob: Can not send push notification- not push_token provided.`);
            return;
        }
        let message = new gcm.Message({
            notification: {
                title: job.data.title,
                icon: '2FA',
                body: job.data.message
            },
        });

        fcm.sendNoRetry(message, [job.data.push_token], (err, response) => {
            if (err) {
                console.error(`CodeQueueListenerService@processPUSHJob@sendNoRetry: Firebase error`, err);
            }
        });

        console.info(`CodeQueueListenerService@processPUSHJob: processed`);
        done();
    }
}
