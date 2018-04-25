"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("../../config/env");
const common_1 = require("@nestjs/common");
const Queue = require("bull");
const request = require("request-promise-native");
const services_1 = require("./services");
const gcm = require("node-gcm");
const telegram_server_1 = require("../telegram/telegram.server");
const Telegraf = require('telegraf');
let CodeQueueListenerService = class CodeQueueListenerService {
    constructor(telegramServer) {
        this.telegramServer = telegramServer;
        const redisURL = `redis://${env_1.EnvConfig.REDIS_HOST}:${env_1.EnvConfig.REDIS_PORT}`;
        this.queueSMS = new Queue('code_queue_sms', redisURL);
        this.queuePUSH = new Queue('code_queue_push', redisURL);
        this.queueTelegram = new Queue('code_queue_telegram', redisURL);
    }
    listen() {
        console.info(`waiting for the jobs`);
        this.queueTelegram.process(this.processTelegramJob);
        this.queueSMS.process(this.processSMSJob);
        this.queuePUSH.process(this.processPUSHJob);
    }
    processTelegramJob(job, done) {
        return __awaiter(this, void 0, void 0, function* () {
            if (job.data.chat_id === '') {
                done(new Error('Chat id is empty'));
                return;
            }
            if (job.data.message === '') {
                done(new Error('Message is empty'));
                return;
            }
            const telegrafApp = new Telegraf(env_1.EnvConfig.TELEGRAM_BOT_KEY);
            try {
                yield telegrafApp.telegram.sendMessage(job.data.chat_id, job.data.message);
            }
            catch (e) {
                if (e.response && e.response.error_code === 403) {
                    console.log('postVerify - user was not registered in telegram');
                }
            }
            done();
        });
    }
    processSMSJob(job, done) {
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
        let message = 'Ваш код подтверждения для сервиса "' + services_1.Services[job.data.service] + '": ' + job.data.code;
        if (job.data.registration) {
            message = 'Ваш код подтверждения для сервиса TFA: ' + job.data.code;
        }
        const options = {
            method: 'POST',
            uri: 'http://smsc.kz/sys/send.php',
            formData: {
                login: env_1.EnvConfig.SMS_USERNAME,
                psw: env_1.EnvConfig.SMS_PASSWORD,
                phones: job.data.phone_number,
                sender: 'TwoFA_S',
                mes: message,
                charset: 'utf-8'
            }
        };
        try {
            request.post(options).then(r => {
                console.info(`processSMSJob end`, r);
                done();
            });
        }
        catch (e) {
            console.log('e', e);
        }
    }
    processPUSHJob(job, done) {
        const fcm = new gcm.Sender(env_1.EnvConfig.FIREBASE_CLOUD_KEY);
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
        try {
            fcm.sendNoRetry(message, [job.data.push_token], (err, response) => {
                if (err) {
                    console.error(`CodeQueueListenerService@processPUSHJob@sendNoRetry: Firebase error`, err);
                }
            });
        }
        catch (e) {
            console.log('e', e);
        }
        console.info(`CodeQueueListenerService@processPUSHJob: processed`);
        done();
    }
};
CodeQueueListenerService = __decorate([
    common_1.Component(),
    __metadata("design:paramtypes", [telegram_server_1.TelegramServer])
], CodeQueueListenerService);
exports.CodeQueueListenerService = CodeQueueListenerService;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvc2VydmljZXMvY29kZV9zZW5kZXIvcXVldWUuc2VydmljZS50cyIsInNvdXJjZXMiOlsiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvc2VydmljZXMvY29kZV9zZW5kZXIvcXVldWUuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMENBQTJDO0FBQzNDLDJDQUF5QztBQUV6Qyw4QkFBOEI7QUFDOUIsa0RBQWtEO0FBQ2xELHlDQUFvQztBQUNwQyxnQ0FBZ0M7QUFDaEMsaUVBQTJEO0FBRTNELE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUdyQyxJQUFhLHdCQUF3QixHQUFyQztJQVVJLFlBQW9CLGNBQThCO1FBQTlCLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtRQUM5QyxNQUFNLFFBQVEsR0FBRyxXQUFXLGVBQVMsQ0FBQyxVQUFVLElBQUksZUFBUyxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBRTNFLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDdEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN4RCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksS0FBSyxDQUFDLHFCQUFxQixFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3BFLENBQUM7SUFRTSxNQUFNO1FBQ1QsT0FBTyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ3BELElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxD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Q0FBQyxtR0FBbUcsQ0FBQyxDQUFDO1lBQ2xILE1BQU0sQ0FBQztRQUNYLENBQUM7UUFDRCxJQUFJLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUM7WUFDMUIsWUFBWSxFQUFFO2dCQUNWLEtBQUssRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUs7Z0JBQ3JCLElBQUksRUFBRSxLQUFLO2dCQUNYLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU87YUFDekI7U0FDSixDQUFDLENBQUM7UUFDSCxJQUFJLENBQUM7WUFDRCxHQUFHLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLEVBQUU7Z0JBQzlELEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQ04sT0FBTyxDQUFDLEtBQUssQ0FBQyxxRUFBcUUsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDOUYsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztRQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDVCxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN4QixDQUFDO1FBRUQsT0FBTyxDQUFDLElBQUksQ0FBQyxvREFBb0QsQ0FBQyxDQUFDO1FBQ25FLElBQUksRUFBRSxDQUFDO0lBQ1gsQ0FBQztDQUNKLENBQUE7QUE3Slksd0JBQXdCO0lBRHBDLGtCQUFTLEVBQUU7cUNBVzRCLGdDQUFjO0dBVnpDLHdCQUF3QixDQTZKcEM7QUE3SlksNERBQXdCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtFbnZDb25maWd9IGZyb20gJy4uLy4uL2NvbmZpZy9lbnYnO1xuaW1wb3J0IHtDb21wb25lbnR9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcblxuaW1wb3J0ICogYXMgUXVldWUgZnJvbSAnYnVsbCc7XG5pbXBvcnQgKiBhcyByZXF1ZXN0IGZyb20gJ3JlcXVlc3QtcHJvbWlzZS1uYXRpdmUnO1xuaW1wb3J0IHtTZXJ2aWNlc30gZnJvbSAnLi9zZXJ2aWNlcyc7XG5pbXBvcnQgKiBhcyBnY20gZnJvbSAnbm9kZS1nY20nO1xuaW1wb3J0IHtUZWxlZ3JhbVNlcnZlcn0gZnJvbSAnLi4vdGVsZWdyYW0vdGVsZWdyYW0uc2VydmVyJztcblxuY29uc3QgVGVsZWdyYWYgPSByZXF1aXJlKCd0ZWxlZ3JhZicpO1xuXG5AQ29tcG9uZW50KClcbmV4cG9ydCBjbGFzcyBDb2RlUXVldWVMaXN0ZW5lclNlcnZpY2Uge1xuXG4gICAgcHVibGljIHF1ZXVlU01TO1xuICAgIHB1YmxpYyBxdWV1ZVBVU0g7XG4gICAgcHVibGljIHF1ZXVlVGVsZWdyYW07XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIFF1ZXVlU2VydmljZS5cbiAgICAgKiBAbWVtYmVyb2YgQ29kZVF1ZXVlTGlzdGVuZXJTZXJ2aWNlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSB0ZWxlZ3JhbVNlcnZlcjogVGVsZWdyYW1TZXJ2ZXIpIHtcbiAgICAgICAgY29uc3QgcmVkaXNVUkwgPSBgcmVkaXM6Ly8ke0VudkNvbmZpZy5SRURJU19IT1NUfToke0VudkNvbmZpZy5SRURJU19QT1JUfWA7XG5cbiAgICAgICAgdGhpcy5xdWV1ZVNNUyA9IG5ldyBRdWV1ZSgnY29kZV9xdWV1ZV9zbXMnLCByZWRpc1VSTCk7XG4gICAgICAgIHRoaXMucXVldWVQVVNIID0gbmV3IFF1ZXVlKCdjb2RlX3F1ZXVlX3B1c2gnLCByZWRpc1VSTCk7XG4gICAgICAgIHRoaXMucXVldWVUZWxlZ3JhbSA9IG5ldyBRdWV1ZSgnY29kZV9xdWV1ZV90ZWxlZ3JhbScsIHJlZGlzVVJMKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBzdGFydCBsaXN0ZW5uaW5nIGZvciBxdWV1ZXMgbWVzc2FnZXNcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQG1lbWJlcm9mIENvZGVRdWV1ZUxpc3RlbmVyU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBsaXN0ZW4oKTogdm9pZCB7XG4gICAgICAgIGNvbnNvbGUuaW5mbyhgd2FpdGluZyBmb3IgdGhlIGpvYnNgKTtcbiAgICAgICAgdGhpcy5xdWV1ZVRlbGVncmFtLnByb2Nlc3ModGhpcy5wcm9jZXNzVGVsZWdyYW1Kb2IpO1xuICAgICAgICB0aGlzLnF1ZXVlU01TLnByb2Nlc3ModGhpcy5wcm9jZXNzU01TSm9iKTtcbiAgICAgICAgdGhpcy5xdWV1ZVBVU0gucHJvY2Vzcyh0aGlzLnByb2Nlc3NQVVNISm9iKTtcblxuICAgICAgICAvLyB0b2RvOiBtYWtlIGZvciB3aGF0c2FwcFxuICAgICAgICAvLyB0aGlzLnF1ZXVlUFVTSC5wcm9jZXNzKHRoaXMucHJvY2Vzc1doYXRzQXBwSm9iKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQcm9jZXNzIHNlbmRpbmcgY29kZSB0byB0ZWxlZ3JhbSBib3RcbiAgICAgKlxuICAgICAqIEBwYXJhbSBqb2JcbiAgICAgKiBAcGFyYW0gZG9uZVxuICAgICAqIEBtZW1iZXJvZiBDb2RlUXVldWVMaXN0ZW5lclNlcnZpY2VcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIHByb2Nlc3NUZWxlZ3JhbUpvYihqb2IsIGRvbmUpIHtcbiAgICAgICAgLy8gam9iLmRhdGEgY29udGFpbnMgdGhlIGN1c3RvbSBkYXRhIHBhc3NlZCB3aGVuIHRoZSBqb2Igd2FzIGNyZWF0ZWRcbiAgICAgICAgLy8gam9iLmlkIGNvbnRhaW5zIGlkIG9mIHRoaXMgam9iLlxuICAgICAgICBpZiAoam9iLmRhdGEuY2hhdF9pZCA9PT0gJycpIHtcbiAgICAgICAgICAgIGRvbmUobmV3IEVycm9yKCdDaGF0IGlkIGlzIGVtcHR5JykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChqb2IuZGF0YS5tZXNzYWdlID09PSAnJykge1xuICAgICAgICAgICAgZG9uZShuZXcgRXJyb3IoJ01lc3NhZ2UgaXMgZW1wdHknKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGVsZWdyYWZBcHAgPSBuZXcgVGVsZWdyYWYoRW52Q29uZmlnLlRFTEVHUkFNX0JPVF9LRVkpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGVsZWdyYWZBcHAudGVsZWdyYW0uc2VuZE1lc3NhZ2Uoam9iLmRhdGEuY2hhdF9pZCwgam9iLmRhdGEubWVzc2FnZSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGlmIChlLnJlc3BvbnNlICYmIGUucmVzcG9uc2UuZXJyb3JfY29kZSA9PT0gNDAzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3Bvc3RWZXJpZnkgLSB1c2VyIHdhcyBub3QgcmVnaXN0ZXJlZCBpbiB0ZWxlZ3JhbScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZG9uZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFByb2Nlc3Mgc2VuZGluZyBjb2RlIGJ5IFNNU1xuICAgICAqXG4gICAgICogQHBhcmFtIGpvYlxuICAgICAqIEBwYXJhbSBkb25lXG4gICAgICogQG1lbWJlcm9mIENvZGVRdWV1ZUxpc3RlbmVyU2VydmljZVxuICAgICAqL1xuICAgIHByaXZhdGUgcHJvY2Vzc1NNU0pvYihqb2IsIGRvbmUpIHtcblxuICAgICAgICBjb25zb2xlLmluZm8oYHByb2Nlc3NTTVNKb2Igc3RhcnRgKTtcblxuICAgICAgICBpZiAoam9iLmRhdGEucGhvbmVfbnVtYmVyID09PSAnJykge1xuICAgICAgICAgICAgZG9uZShuZXcgRXJyb3IoJ1Bob25lIG51bWJlciBpcyBlbXB0eScpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoam9iLmRhdGEuc2VydmljZSA9PT0gJycpIHtcbiAgICAgICAgICAgIGRvbmUobmV3IEVycm9yKCdTZXJ2aWNlIGlzIGVtcHR5JykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChqb2IuZGF0YS5zZXJ2aWNlICE9PSAna2F6dGVsJykge1xuICAgICAgICAgICAgZG9uZShuZXcgRXJyb3IoJ1NlcnZpY2Uga2F6YWh0ZWxlY29tIG9ubHkgY2FuIGJlIGhhbmRsZWQnKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGpvYi5kYXRhLmNvZGUgPT09ICcnKSB7XG4gICAgICAgICAgICBkb25lKG5ldyBFcnJvcignQ29kZSBpcyBlbXB0eScpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgbWVzc2FnZSA9ICfQktCw0Ygg0LrQvtC0INC/0L7QtNGC0LLQtdGA0LbQtNC10L3QuNGPINC00LvRjyDRgdC10YDQstC40YHQsCBcIicgKyBTZXJ2aWNlc1tqb2IuZGF0YS5zZXJ2aWNlXSArICdcIjogJyArIGpvYi5kYXRhLmNvZGU7XG4gICAgICAgIGlmIChqb2IuZGF0YS5yZWdpc3RyYXRpb24pIHtcbiAgICAgICAgICAgIG1lc3NhZ2UgPSAn0JLQsNGIINC60L7QtCDQv9C+0LTRgtCy0LXRgNC20LTQtdC90LjRjyDQtNC70Y8g0YHQtdGA0LLQuNGB0LAgVEZBOiAnICsgam9iLmRhdGEuY29kZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICB1cmk6ICdodHRwOi8vc21zYy5rei9zeXMvc2VuZC5waHAnLFxuICAgICAgICAgICAgZm9ybURhdGE6IHtcbiAgICAgICAgICAgICAgICBsb2dpbjogRW52Q29uZmlnLlNNU19VU0VSTkFNRSxcbiAgICAgICAgICAgICAgICBwc3c6IEVudkNvbmZpZy5TTVNfUEFTU1dPUkQsXG4gICAgICAgICAgICAgICAgcGhvbmVzOiBqb2IuZGF0YS5waG9uZV9udW1iZXIsXG4gICAgICAgICAgICAgICAgc2VuZGVyOiAnVHdvRkFfUycsXG4gICAgICAgICAgICAgICAgbWVzOiBtZXNzYWdlLFxuICAgICAgICAgICAgICAgIGNoYXJzZXQ6ICd1dGYtOCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVxdWVzdC5wb3N0KG9wdGlvbnMpLnRoZW4ociA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGBwcm9jZXNzU01TSm9iIGVuZGAsIHIpO1xuICAgICAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZScsIGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHJvY2VzcyBzZW5kaW5nIGNvZGUgb24gZGV2aWNlXG4gICAgICpcbiAgICAgKiBAcGFyYW0gam9iXG4gICAgICogQHBhcmFtIGRvbmVcbiAgICAgKiBAbWVtYmVyb2YgQ29kZVF1ZXVlTGlzdGVuZXJTZXJ2aWNlXG4gICAgICovXG4gICAgcHJpdmF0ZSBwcm9jZXNzUFVTSEpvYihqb2IsIGRvbmUpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgZmNtID0gbmV3IGdjbS5TZW5kZXIoRW52Q29uZmlnLkZJUkVCQVNFX0NMT1VEX0tFWSk7XG5cbiAgICAgICAgaWYgKCFqb2IuZGF0YS50aXRsZSB8fCAham9iLmRhdGEubWVzc2FnZSkge1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKGBDb2RlUXVldWVMaXN0ZW5lclNlcnZpY2VAcHJvY2Vzc1BVU0hKb2I6IENhbiBub3Qgc2VuZCBwdXNoIG5vdGlmaWNhdGlvbi0gbm90IHRpdGxlIG9yIG1lc3NhZ2UgcHJvdmlkZWQuYCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWpvYi5kYXRhLnB1c2hfdG9rZW4pIHtcbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgQ29kZVF1ZXVlTGlzdGVuZXJTZXJ2aWNlQHByb2Nlc3NQVVNISm9iOiBDYW4gbm90IHNlbmQgcHVzaCBub3RpZmljYXRpb24tIG5vdCBwdXNoX3Rva2VuIHByb3ZpZGVkLmApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxldCBtZXNzYWdlID0gbmV3IGdjbS5NZXNzYWdlKHtcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbjoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBqb2IuZGF0YS50aXRsZSxcbiAgICAgICAgICAgICAgICBpY29uOiAnMkZBJyxcbiAgICAgICAgICAgICAgICBib2R5OiBqb2IuZGF0YS5tZXNzYWdlXG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZjbS5zZW5kTm9SZXRyeShtZXNzYWdlLCBbam9iLmRhdGEucHVzaF90b2tlbl0sIChlcnIsIHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBDb2RlUXVldWVMaXN0ZW5lclNlcnZpY2VAcHJvY2Vzc1BVU0hKb2JAc2VuZE5vUmV0cnk6IEZpcmViYXNlIGVycm9yYCwgZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2UnLCBlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUuaW5mbyhgQ29kZVF1ZXVlTGlzdGVuZXJTZXJ2aWNlQHByb2Nlc3NQVVNISm9iOiBwcm9jZXNzZWRgKTtcbiAgICAgICAgZG9uZSgpO1xuICAgIH1cbn1cbiJdfQ==