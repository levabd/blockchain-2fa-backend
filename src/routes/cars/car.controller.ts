import {Controller, Get, Post, Body, Headers, Res} from '@nestjs/common';
import {CarService} from './car.service';
import {CarDto} from './car.model';
import {InvokeResult} from '../invokeresult.model';
import * as jwtDecode from 'jwt-decode';
import {JwtToken} from 'auth0';
import {ApiUseTags, ApiBearerAuth} from '@nestjs/swagger';
import {CodeQueueListenerService} from '../../services/code_sender/queue.service';
import {Log} from 'hlf-node-utils';

@ApiBearerAuth()
@ApiUseTags('cars')
@Controller('cars')
export class CarController {

    /**
     * Creates an instance of CarController.
     * @memberof CarController
     * @param carService
     * @param codeQueueListenerService
     */
    constructor(private carService: CarService,
                private codeQueueListenerService: CodeQueueListenerService) {
    }

    getUserId(auth) {
        if (auth) {
            const token: JwtToken = jwtDecode(auth.split(' ')[1]);
            return token.sub.split('|')[1];
        } else {
            return 'dummyUserID';
        }
    }

    /**
     * Get all cars
     *
     * @param {{}} params
     * @param {string} [headerParams]
     * @returns {Promise<CarDto[]>}
     * @memberof CarController
     */
    @Get()
    getAll(@Res() res):void {
        this.codeQueueListenerService.queueSMS.add({phone_number: '454257844'});
        // return ;
        res.render('kazahtelecom/index', { message: 'Hello world!' });
    }

    /**
     * Create new car
     *
     * @param {CarDto} carDto
     * @param {string} [headerParams]
     * @returns {*}
     * @memberof CarController
     */
    @Post()
    create(@Body() carDto: CarDto, @Headers('authorization') auth): Promise<InvokeResult> {
        return this.carService.create(carDto, this.getUserId(auth));
    }
}