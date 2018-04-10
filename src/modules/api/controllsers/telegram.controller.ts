import {Controller, Get, HttpStatus, Post, Query, Req, Res} from '@nestjs/common';
import {User} from '../../../services/telegram/user';
import {TelegramServer} from '../../../services/telegram/telegram.server';

@Controller('v1/api/telegram')
export class TelegramController {

    constructor(private telegramServer: TelegramServer) {}

    @Get('/')
    getUser(@Req() req, @Res() res) {
        User.find({})
            .then((users) => {
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(users);
            })
            .catch((err) => {
                console.log(err);
                res.sendStatus(500);
            });
    }

    @Post('/send')
    async sendNumber(@Req() req, @Res() res,
                     @Query('phone_number') phoneNumber: string,
                     @Query('message') message: string) {

        let number = phoneNumber;
        if (number.charAt(0) === '+') {
            number = number.substring(1);
        }
        let telegramUser = await this.telegramServer.userExists(new RegExp('^8|7' + number.substring(1) + '$', 'i'));
        console.log('telegramUser', telegramUser);
        if (!telegramUser) {
            return res.status(HttpStatus.BAD_GATEWAY).json({user: ['User select telegram, but not registered in it yet.']});
        }
        this.telegramServer.telegrafApp.telegram.sendMessage(telegramUser.chatId, message, {
            parse_mode: 'HTML'
        });
    }

}