import {Controller, Get, Post, Req, Res} from '@nestjs/common';
import {Log} from 'hlf-node-utils';

@Controller('v1/web')
export class HomeController {

    /**
     * Get home page
     * @memberof HomeController
     * @param res
     */
    @Get('')
    home(@Res() res): void {
        res.render('home');
    }

    /**
     * Get about page
     * @param res
     */
    @Get('about')
    about(@Res() res): void {
        res.render('about');
    }

    /**
     * Login
     */
    @Post('login')
    login(): void {
        // todo обработать запрос логина
    }

}