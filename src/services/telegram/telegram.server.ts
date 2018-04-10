// const Telegraf = require('telegraf')
// const Extra = require('telegraf/extra')
// const Markup = require('telegraf/markup')
import {EnvConfig} from '../../config/env';

const session = require('telegraf/session');
const Telegraf = require('telegraf');
const {User} = require('./user');
import {telegramStartHandler} from './telegram.start.handler';
import {telegramContactHandler} from './telegram.contact.handler';

let Messages = {
    hello: 'Добрый день, %s!\nНажмите кнопку "Отправить номер" внизу, чтобы начать.',
    exist: 'Вы уже зарегистрированы.',
    registered: 'Вы зарегистрированы на сервисе 2FA. Теперь вы сможете получать секретный код используя Telegram.',
    notyournumber: 'Вероятно, это не ваш номер.'
};

export class TelegramServer {
    telegrafApp: any;

    constructor() {
        let telegramStartHandler1 = telegramStartHandler(User, Messages);
        let telegramContactHandler1 = telegramContactHandler(User, Messages);

        this.telegrafApp = new Telegraf(EnvConfig.TELEGRAM_BOT_KEY);
        this.telegrafApp.use(session());

        this.telegrafApp.command('start', telegramStartHandler1.route);
        this.telegrafApp.on('contact', telegramContactHandler1.route);
        this.telegrafApp.startPolling();
    }

    async userExists(pattern: any): Promise<any> {
        return await User.findOne({number: pattern}, (err, currentUser) => {
            if (currentUser) {
                return currentUser;
            } else {
                return null;
            }
        });
    }
}