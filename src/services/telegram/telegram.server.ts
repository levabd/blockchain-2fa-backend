// const Telegraf = require('telegraf')
// const Extra = require('telegraf/extra')
// const Markup = require('telegraf/markup')
const session = require('telegraf/session');
const Telegraf = require('telegraf');
const config = require('config');
const User = require('./lib/user');
const telegramStartHandler = require('./telegram.start.handler');
const telegramContactHandler = require('./telegram.contact.handler');
let Messages = {
    hello: 'Добрый день, %s!\nНажмите кнопку "Отправить номер" внизу, чтобы начать.',
    exist: 'Вы уже зарегистрированы.',
    registered: 'Все хорошо. Вы зарегистрированы.',
    notyournumber: 'Вероятно, это не ваш номер :('
};
export class TelegramServer {
    telegrafApp: any;

    constructor() {
        let telegramStartHandler1 = telegramStartHandler(User, Messages);
        let telegramContactHandler1 = telegramContactHandler(User, Messages);

        this.telegrafApp = new Telegraf(config.token);
        this.telegrafApp.use(session());

        this.telegrafApp.command('start', telegramStartHandler1.route);
        this.telegrafApp.on('contact', telegramContactHandler1.route);
    }
}
