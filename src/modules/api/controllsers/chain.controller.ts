import {Controller, Get, HttpStatus, Query, Res} from '@nestjs/common';
import {ApiUseTags} from '@nestjs/swagger';

import {EnvConfig} from '../../../config/env';
import * as request from 'request-promise-native';

import {ChainService} from '../../../services/sawtooth/chain.service';
import {CodeQueueListenerService} from '../../../services/code_sender/queue.service';

@ApiUseTags('v1/api/chain')
@Controller('v1/api/chain')
export class ChainController {

    constructor(private chainService: ChainService,
                private codeQueueListenerService: CodeQueueListenerService) {
    }

    @Get('/batch_statuses')
    async getBatchStatus(@Res() res, @Query('id') id: string): Promise<any> {
        if (!id) {
            return res.status(HttpStatus.BAD_REQUEST).json({error: `Id is empty`});
        }
        let data;
        try {
            data = await request.get({
                uri: `${EnvConfig.VALIDATOR_REST_API}/batch_statuses`,
                json: true, // Automatically parses the JSON string in the response
                qs: {id: id}
            }).then(response => {
                return response.data[0];
            }).catch(error => {
                console.log('result ', error);
                throw new Error(error);
            });

        } catch (e) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({error: e});
        }

        return res.status(HttpStatus.OK).json({
            status: data.status,
            invalid_transactions: data.invalid_transactions
        });
    }
}