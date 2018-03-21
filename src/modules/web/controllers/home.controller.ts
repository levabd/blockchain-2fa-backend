import {Controller, Get, Post,  Res} from '@nestjs/common';
import {ApiUseTags} from '@nestjs/swagger';
import * as path from 'path';

const resolvePath = (file: string) => path.resolve(__dirname , '..', `pwa/dist/${file}`);

@ApiUseTags('v1/web')
@Controller('v1/web')
export class HomeController {

    /**
     * Example page
     * @memberof HomeController
     * @param res
     */
    @Get('example')
    example(@Res() res): void {
        console.log('path', resolvePath('index.html'));
        res.redirect('http://localhost:3003/');
    }

    /**
     * Example page
     * @memberof HomeController
     * @param res
     */
    @Post('example-handler')
    exampleHandler(@Res() res): void {
        res.render('example/choise');
    }

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