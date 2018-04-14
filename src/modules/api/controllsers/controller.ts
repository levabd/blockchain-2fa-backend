import {PostClientUserDTO} from '../../shared/models/dto/post.kaztel.user.dto';
import {KaztelTransactionFamily} from '../../shared/families/kaztel.transaction.family';
import {TfaTransactionFamily} from '../../shared/families/tfa.transaction.family';
import {EgovTransactionFamily} from '../../shared/families/egov.transaction.family';
import {EnvConfig} from '../../../config/env';
import * as WebSocket from 'ws';
import * as changeCase from 'change-case';
import {sortNumber} from '../../../services/helpers/helpers';
import * as redis from 'redis';
import * as Promisefy from 'bluebird';
import {REJECT, RESEND_CODE, SEND_CODE, VALID} from '../../../config/constants';

const DICT = {
    ru: {
        not_verified: 'Пользователь не прошёл верификацию в мобильном приложении',
        telegram_bot_unregistered: 'Пользователь не зарегистрировался у боте телеграмма @BlockchainTfaBot',
        error_decode_user_bc: 'Ошибка при получении пользователя из блокчейна',
        unknown_error: 'Неизвестная ошибка'
    },
    en: {
        not_verified: 'User is not verified',
        telegram_bot_unregistered: 'User select telegram, but not registered in it yet',
        error_decode_user_bc: 'Cant decode user',
        unknown_error: 'User is not verified'
    },
};

export class ApiController {
    redisClient: any;
    constructor(public tfaTF: TfaTransactionFamily,
                public kaztelTF: KaztelTransactionFamily,
                public egovTF: EgovTransactionFamily,) {
        Promisefy.promisifyAll(redis);
        const redisURL = `redis://${EnvConfig.REDIS_HOST}:${EnvConfig.REDIS_PORT}`;
        this.redisClient = redis.createClient({url: redisURL});
    }

    transformLog(log: any, service: string): object {
        const fieldsToHandle = Object.keys(log);
        let obj = {};
        for (let f of fieldsToHandle) {
            if (f == 'Status' || f == 'ExpiredAt' || f == 'Method' || f == 'ActionTime') {
                continue;
            }
            obj[changeCase.snakeCase(f)] = log[f];
        }
        obj['service'] = service;
        return obj;
    }

    getLatestCode(user: any): any {

        let sendCodeArrayKeysSorted = [];
        const userKeys = Object.keys(user.Logs);

        if (userKeys.length === 0) {
            return {status: 'no_send_codes'};
        }

        const currentTimestamp = (new Date()).getTime() / 1000;
        const keysLength = userKeys.length - 1;
        let sendCodeArrayKeys = [];
        let validCodeArrayKeys = [];

        for (let i = 0; i <= userKeys.length; i++) {

            const log = user.Logs[userKeys[i]];

            if (!log.Status) {
                continue;
            }

            if (log.Status === SEND_CODE || log.Status === RESEND_CODE) {
                if (currentTimestamp <= log.ExpiredAt && log.Method === 'push') {
                    sendCodeArrayKeys.push(parseInt(userKeys[i], 10));
                }
            }
            if (log.Status === VALID||log.Status === REJECT) {
                validCodeArrayKeys.push(parseInt(userKeys[i], 10));
            }

            if (i !== keysLength) {
                continue;
            }

            if (sendCodeArrayKeys.length === 0) {
                return {status: 'no_send_codes'};
            }

            sendCodeArrayKeysSorted = sendCodeArrayKeys.sort(sortNumber);

            const latestCodeIndex = sendCodeArrayKeysSorted.length === 1
                ? sendCodeArrayKeysSorted[0]
                : sendCodeArrayKeysSorted[sendCodeArrayKeysSorted.length - 1];

            const latestLog = user.Logs[latestCodeIndex];

            if (!validCodeArrayKeys.length) {
                return {status: 'success', log: latestLog};
            }

            const validKeysLength = validCodeArrayKeys.length - 1;

            for (let j = 0; j < validCodeArrayKeys.length; j++) {

                const logValid = user.Logs[validCodeArrayKeys[j]];

                if (logValid.Code === latestLog.Code) {
                    return {status: 'no_code_used'};
                }

                if (j === validKeysLength) {
                    return {status: 'success', log: latestLog};
                }
            }
        }
    }

    getMessage(lang: string, locale = 'unknown_error'): string {
        let _lang = lang;
        if (!DICT[_lang]) {
            _lang = 'en';
        }

        return DICT[_lang][locale] || DICT[_lang]['unknown_error'];
    }

    getUserNotFoundMessage(lang: string) {
        return lang === 'ru' ? 'Пользователь не найден' : 'User not found';
    }

    openWsConnection(addresses: string[]): any {
        let ws = new WebSocket(`ws:${EnvConfig.VALIDATOR_REST_API_HOST_PORT}/subscriptions`);
        ws.onopen = () => {
            ws.send(JSON.stringify({
                'action': 'subscribe',
                'address_prefixes': addresses
            }));
        };
        ws.onclose = () => {
            try {
                ws.send(JSON.stringify({
                    'action': 'unsubscribe'
                }));
            } catch(e){
                console.log('e', e);
            }
        };
        return ws;
    }

    /**
     * Get user with by transaction fa,ily name
     *  we need to check 77050000000
     *         and check 87050000000
     * phone number can start with 8 or 7
     *
     * @param {string} phoneNumber
     * @param {string} service
     * @returns {Promise<PostClientUserDTO | null>}
     */
    async getUser(phoneNumber: string, service: string): Promise<PostClientUserDTO | null> {
        if (!phoneNumber){
            return null;
        }
        if (phoneNumber.charAt(0) === '+') {
            phoneNumber = phoneNumber.substring(1);
        }
        // we need to check 77050000000
        //        and check 87050000000
        // phone number can start with 8 or 7
        phoneNumber = phoneNumber.substr(phoneNumber.length - 10);

        // first check with 7
        const phoneNumberSeven = `7${phoneNumber}`;
        const phoneNumberEight = `8${phoneNumber}`;
        let user = null;
        try {
            user = await this._getUser(phoneNumberSeven, service);
            return user;
        } catch (e) {
            console.log(`Cant find user with phone number: ${phoneNumberSeven}. Trying to find with number: ${phoneNumberEight}`);
            try {
                user = await this._getUser(phoneNumberEight, service);
                return user;
            } catch (e) {
                console.log(`Cant find user with phone number: ${phoneNumberEight}. Return null`);
                return null;
            }
        }
    }

    /**
     * Get user by phone number and transaction family name
     *
     * @param {string} phoneNumber
     * @param {string} service
     * @returns {Promise<PostClientUserDTO | null>}
     * @private
     */
    private async _getUser(phoneNumber: string, service: string): Promise<PostClientUserDTO | null> {
        let user;
        try {
            switch (service) {
                case 'kaztel':
                    user = await this.kaztelTF.getUser(phoneNumber);
                    break;
                case 'egov':
                    user = await this.egovTF.getUser(phoneNumber);
                    break;
                default:
                    user = await this.tfaTF.getStateByPhoneNumber(phoneNumber);
                    break;
            }
            if (user.PhoneNumber == '') {
                return null;
            }
        } catch (e) {
            return null;
        }

        return user;
    }
}