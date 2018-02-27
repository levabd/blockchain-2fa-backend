
import { Controller, Get, Post, Body, Headers } from '@nestjs/common';
import { TwoFaService } from './2fa.service';
import { CarDto } from './2fa.model';
import { InvokeResult } from '../invokeresult.model';
import * as jwtDecode from 'jwt-decode';
import { JwtToken } from 'auth0';
import { ApiUseTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiUseTags('2fa')
@Controller('2fa')
export class CarController {

    /**
     * Creates an instance of CarController.
     * @param {TwoFaService} TwoFaService
     * @memberof CarController
     */
    constructor(private twoFaService: TwoFaService) { }

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
    getAll(@Headers('authorization') auth): Promise<CarDto[]> {
        return this.twoFaService.getAll(this.getUserId(auth));
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
        return this.twoFaService.create(carDto, this.getUserId(auth));
    }

}