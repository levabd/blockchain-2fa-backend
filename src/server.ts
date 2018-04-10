import {EnvConfig} from './config/env';
import {NestFactory} from '@nestjs/core';
import {ApplicationModule} from './modules/app.module';
import {SwaggerModule, DocumentBuilder} from '@nestjs/swagger';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import {AppExceptionFilter} from './modules/shared/filters/app.exception.filter';

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
    // app.useGlobalFilters(new AppExceptionFilter());

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

    /**
     * Start Chainservice API
     */
    await app.listen(+EnvConfig.PORT, () => {
        console.log(`Started Chain-service on PORT ${EnvConfig.PORT}`);
    });
}

bootstrap();