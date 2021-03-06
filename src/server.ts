import {EnvConfig} from './config/env';
import {NestFactory} from '@nestjs/core';
import {ApplicationModule} from './modules/app.module';
import {Log} from 'hlf-node-utils';
import {SwaggerModule, DocumentBuilder} from '@nestjs/swagger';

import * as express from 'express';
import * as bodyParser from 'body-parser';
import {AppExceptionFilter} from './modules/shared/filters/app.exception.filter';

import * as zmq from 'zeromq';

const sock = zmq.socket('pull');

async function bootstrap() {

    const app = await NestFactory.create(ApplicationModule);
    app.use(bodyParser.json());

    /**
     * Headers setup
     */
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        next();
    });
    app.useGlobalFilters(new AppExceptionFilter());

    /**
     * Swagger implementation
     */
    const options = new DocumentBuilder()
        .setTitle('Chainservice API')
        .setDescription('The Chainservice API')
        .setVersion('1.0')
        .addTag('Chainservice')
        .build();

    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('/api-swg', app, document);

    /**
     *  Set up static files
     */
    app.use(express.static(__dirname + '/modules/web/public'));
    app.set('views', __dirname + '/modules/web/pwa/dist');
    app.set('view engine', 'html');

    sock.connect('tcp://localhost:4004');
    sock.on('message', function (msg) {
        console.log('work: %s', msg.toString());
    });
    sock.on('sawtooth/state-delta', function (msg) {
        console.log('work: %s', msg.toString());
    });
    sock.on('sawtooth/block-commit', function (msg) {
        console.log('work: %s', msg.toString());
    });

    /**
     * Start Chainservice API
     */
    await app.listen(+EnvConfig.PORT, () => {
        Log.config.info(`Started Chain-service on PORT ${EnvConfig.PORT}`);
    });
}

bootstrap();