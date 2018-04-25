"use strict";
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
const session = require('telegraf/session');
const Telegraf = require('telegraf');
const { User } = require('./user');
const telegram_start_handler_1 = require("./telegram.start.handler");
const telegram_contact_handler_1 = require("./telegram.contact.handler");
let Messages = {
    hello: 'Добрый день, %s!\nНажмите кнопку "Отправить номер" внизу, чтобы начать.',
    exist: 'Вы уже зарегистрированы.',
    registered: 'Вы зарегистрированы на сервисе 2FA. Теперь вы сможете получать секретный код используя Telegram.',
    notyournumber: 'Вероятно, это не ваш номер.'
};
class TelegramServer {
    constructor() {
        let telegramStartHandler1 = telegram_start_handler_1.telegramStartHandler(User, Messages);
        let telegramContactHandler1 = telegram_contact_handler_1.telegramContactHandler(User, Messages);
        this.telegrafApp = new Telegraf(env_1.EnvConfig.TELEGRAM_BOT_KEY);
        this.telegrafApp.use(session());
        this.telegrafApp.command('start', telegramStartHandler1.route);
        this.telegrafApp.on('contact', telegramContactHandler1.route);
        this.telegrafApp.startPolling();
    }
    userExists(pattern) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield User.findOne({ number: pattern }, (err, currentUser) => {
                if (currentUser) {
                    return currentUser;
                }
                else {
                    return null;
                }
            });
        });
    }
}
exports.TelegramServer = TelegramServer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvcGVzaGtvdi9kZXYvcHJvamVjdHMvYmxvY2tjaGFpbi0yZmEtYmFja2VuZC9zcmMvc2VydmljZXMvdGVsZWdyYW0vdGVsZWdyYW0uc2VydmVyLnRzIiwic291cmNlcyI6WyIvaG9tZS9wZXNoa292L2Rldi9wcm9qZWN0cy9ibG9ja2NoYWluLTJmYS1iYWNrZW5kL3NyYy9zZXJ2aWNlcy90ZWxlZ3JhbS90ZWxlZ3JhbS5zZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUdBLDBDQUEyQztBQUUzQyxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUM1QyxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDckMsTUFBTSxFQUFDLElBQUksRUFBQyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqQyxxRUFBOEQ7QUFDOUQseUVBQWtFO0FBRWxFLElBQUksUUFBUSxHQUFHO0lBQ1gsS0FBSyxFQUFFLHlFQUF5RTtJQUNoRixLQUFLLEVBQUUsMEJBQTBCO0lBQ2pDLFVBQVUsRUFBRSxrR0FBa0c7SUFDOUcsYUFBYSxFQUFFLDZCQUE2QjtDQUMvQyxDQUFDO0FBRUY7SUFHSTtRQUNJLElBQUkscUJBQXFCLEdBQUcsNkNBQW9CLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ2pFLElBQUksdUJBQXVCLEdBQUcsaURBQXNCLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBRXJFLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxRQUFRLENBQUMsZUFBUyxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDNUQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUVoQyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLHVCQUF1QixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzlELElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDcEMsQ0FBQztJQUVLLFVBQVUsQ0FBQyxPQUFZOztZQUN6QixNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUMsTUFBTSxFQUFFLE9BQU8sRUFBQyxFQUFFLENBQUMsR0FBRyxFQUFFLFdBQVcsRUFBRSxFQUFFO2dCQUM5RCxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO29CQUNkLE1BQU0sQ0FBQyxXQUFXLENBQUM7Z0JBQ3ZCLENBQUM7Z0JBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ0osTUFBTSxDQUFDLElBQUksQ0FBQztnQkFDaEIsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztLQUFBO0NBQ0o7QUF4QkQsd0NBd0JDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gY29uc3QgVGVsZWdyYWYgPSByZXF1aXJlKCd0ZWxlZ3JhZicpXG4vLyBjb25zdCBFeHRyYSA9IHJlcXVpcmUoJ3RlbGVncmFmL2V4dHJhJylcbi8vIGNvbnN0IE1hcmt1cCA9IHJlcXVpcmUoJ3RlbGVncmFmL21hcmt1cCcpXG5pbXBvcnQge0VudkNvbmZpZ30gZnJvbSAnLi4vLi4vY29uZmlnL2Vudic7XG5cbmNvbnN0IHNlc3Npb24gPSByZXF1aXJlKCd0ZWxlZ3JhZi9zZXNzaW9uJyk7XG5jb25zdCBUZWxlZ3JhZiA9IHJlcXVpcmUoJ3RlbGVncmFmJyk7XG5jb25zdCB7VXNlcn0gPSByZXF1aXJlKCcuL3VzZXInKTtcbmltcG9ydCB7dGVsZWdyYW1TdGFydEhhbmRsZXJ9IGZyb20gJy4vdGVsZWdyYW0uc3RhcnQuaGFuZGxlcic7XG5pbXBvcnQge3RlbGVncmFtQ29udGFjdEhhbmRsZXJ9IGZyb20gJy4vdGVsZWdyYW0uY29udGFjdC5oYW5kbGVyJztcblxubGV0IE1lc3NhZ2VzID0ge1xuICAgIGhlbGxvOiAn0JTQvtCx0YDRi9C5INC00LXQvdGMLCAlcyFcXG7QndCw0LbQvNC40YLQtSDQutC90L7Qv9C60YMgXCLQntGC0L/RgNCw0LLQuNGC0Ywg0L3QvtC80LXRgFwiINCy0L3QuNC30YMsINGH0YLQvtCx0Ysg0L3QsNGH0LDRgtGMLicsXG4gICAgZXhpc3Q6ICfQktGLINGD0LbQtSDQt9Cw0YDQtdCz0LjRgdGC0YDQuNGA0L7QstCw0L3Riy4nLFxuICAgIHJlZ2lzdGVyZWQ6ICfQktGLINC30LDRgNC10LPQuNGB0YLRgNC40YDQvtCy0LDQvdGLINC90LAg0YHQtdGA0LLQuNGB0LUgMkZBLiDQotC10L/QtdGA0Ywg0LLRiyDRgdC80L7QttC10YLQtSDQv9C+0LvRg9GH0LDRgtGMINGB0LXQutGA0LXRgtC90YvQuSDQutC+0LQg0LjRgdC/0L7Qu9GM0LfRg9GPIFRlbGVncmFtLicsXG4gICAgbm90eW91cm51bWJlcjogJ9CS0LXRgNC+0Y/RgtC90L4sINGN0YLQviDQvdC1INCy0LDRiCDQvdC+0LzQtdGALidcbn07XG5cbmV4cG9ydCBjbGFzcyBUZWxlZ3JhbVNlcnZlciB7XG4gICAgdGVsZWdyYWZBcHA6IGFueTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBsZXQgdGVsZWdyYW1TdGFydEhhbmRsZXIxID0gdGVsZWdyYW1TdGFydEhhbmRsZXIoVXNlciwgTWVzc2FnZXMpO1xuICAgICAgICBsZXQgdGVsZWdyYW1Db250YWN0SGFuZGxlcjEgPSB0ZWxlZ3JhbUNvbnRhY3RIYW5kbGVyKFVzZXIsIE1lc3NhZ2VzKTtcblxuICAgICAgICB0aGlzLnRlbGVncmFmQXBwID0gbmV3IFRlbGVncmFmKEVudkNvbmZpZy5URUxFR1JBTV9CT1RfS0VZKTtcbiAgICAgICAgdGhpcy50ZWxlZ3JhZkFwcC51c2Uoc2Vzc2lvbigpKTtcblxuICAgICAgICB0aGlzLnRlbGVncmFmQXBwLmNvbW1hbmQoJ3N0YXJ0JywgdGVsZWdyYW1TdGFydEhhbmRsZXIxLnJvdXRlKTtcbiAgICAgICAgdGhpcy50ZWxlZ3JhZkFwcC5vbignY29udGFjdCcsIHRlbGVncmFtQ29udGFjdEhhbmRsZXIxLnJvdXRlKTtcbiAgICAgICAgdGhpcy50ZWxlZ3JhZkFwcC5zdGFydFBvbGxpbmcoKTtcbiAgICB9XG5cbiAgICBhc3luYyB1c2VyRXhpc3RzKHBhdHRlcm46IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBhd2FpdCBVc2VyLmZpbmRPbmUoe251bWJlcjogcGF0dGVybn0sIChlcnIsIGN1cnJlbnRVc2VyKSA9PiB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFVzZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY3VycmVudFVzZXI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59Il19