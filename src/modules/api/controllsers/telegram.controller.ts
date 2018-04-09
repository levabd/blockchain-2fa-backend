import {Controller, Get, Post, Req, Res} from '@nestjs/common';
import {User} from '../../../services/telegram/user';
import {TelegramServer} from '../../../services/telegram/telegram.server';

@Controller('v1/api/telegram')
export class TelegramController {

    constructor(private telegramServer: TelegramServer) {}

    @Get('/')
    getUser(@Req() req, @Res() res) {
        User.find({})
            .then((users) => {
                res.render('index', {users});
            })
            .catch((err) => {
                console.log(err);
                res.sendStatus(500);
            });
    }

    @Post('/send/:number')
    sendNumber(@Req() req, @Res() res) {
        let number = req.params.number;
        let self = this;
        User.findOne({number})
            .then((currentUser) => {
                console.log('send to:', number, 'text:', req.body.text);
                if (currentUser) {
                    let options = {
                        parse_mode: 'HTML'
                    };
                    self.telegramServer.telegrafApp.sendMessage(currentUser.chatId, req.body.text, options);
                    res.sendStatus('200');
                } else {
                    console.log('not found');
                    res.sendStatus('404');
                }
            })
            .catch((err) => {
                console.log(err);
                res.sendStatus(500);
            });
    }

}