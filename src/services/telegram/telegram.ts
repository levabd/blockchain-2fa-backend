import {EnvConfig} from '../../config/env';

const Telegraf = require('telegraf')

export class TelegramBotService {
    bot: any;

    init() {
        // Включ    ить опрос сервера
        this.bot =  new Telegraf(EnvConfig.TELEGRAM_BOT_KEY);
        let self = this;
        // Написать мне ... (/echo Hello World! - пришлет сообщение с этим приветствием.)
        this.bot.onText(function (msg, match) {
            let fromId = msg.from.id;
            let resp = match[1];
            self.bot.sendMessage(fromId, resp);
        });

        // Простая команда без параметров.
        this.bot.on('message', function (msg) {
            let chatId = msg.chat.id;
            // Фотография может быть: путь к файлу, поток(stream) или параметр file_id
            self.bot.sendMessage(chatId, 'Милые котята');
        });
    }
}