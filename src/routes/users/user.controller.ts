import {Body, Controller, Get, Post, Res} from '@nestjs/common';
import {CarService} from './user.service';
import {CarDto} from './user.model';
import {ApiUseTags, ApiBearerAuth} from '@nestjs/swagger';
import {CodeQueueListenerService} from '../../services/code_sender/queue.service';

@ApiBearerAuth()
@ApiUseTags('v1/users')
@Controller('v1/users')
export class UserController {

    /**
     * Creates an instance of CarController.
     * @memberof CarController
     * @param carService
     * @param codeQueueListenerService
     */
    constructor(private carService: CarService,
                private codeQueueListenerService: CodeQueueListenerService) {
    }

    /**
     * Get all cars
     *
     * @returns {Promise<CarDto[]>}
     * @memberof CarController
     * @param res
     */
    @Get()
    getAll(@Res() res): void {
        this.codeQueueListenerService.queueSMS.add(
            {
                phone_number: '+77053237002',
                service: 'kazahtelecom',
                code: '205454',
            });        // return ;
        res.render('kazahtelecom/index', {message: 'Hello world!'});
    }

    @Get('verify-number')
    sendUserCode(): any {
        // todo do validation
        return {status: 'success'};
    }

    @Post('verify-number')
    verifyNumber(@Body() body): any {
        // todo do validation
        return {status: 'success'};
    }
}