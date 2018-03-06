import * as express from 'express';
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import {TwoFaService} from '../../src/routes/users/user.service';
import {UserController} from '../../src/routes/users/user.controller';
import {ApplicationModule} from '../../src/modules/app.module';

describe('UserController', () => {
    let server;
    let app: INestApplication;

    const twofaService = { queryUser: () => ['test'] };

    beforeAll(async () => {
        const module = await Test.createTestingModule({
            components: [ApplicationModule],
        })
            .overrideComponent(TwoFaService)
            .useValue(twofaService)
            .compile();

        server = express();
        app = module.createNestApplication(server);
        await app.init();
    });

    it(`/GET /v1/users/verify-number`, () => {
        return request(server)
            .get('/v1/users/verify-number')
            .expect(200)
            .expect({
                data: twofaService.queryUser(),
            });
    });

    afterAll(async () => {
        await app.close();
    });
});