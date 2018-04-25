import {EnvConfig} from './config/env';
import {NestFactory} from '@nestjs/core';
import {ApplicationModule} from './modules/app.module';
import {SwaggerModule, DocumentBuilder} from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import {NestApplicationOptions} from '@nestjs/common/interfaces/nest-application-options.interface';
import {HttpsOptions} from '@nestjs/common/interfaces/https-options.interface';
const fs = require('fs');

class MyHttpsOptions implements HttpsOptions {
    key?: any;
    cert?: any;
    ca?: any;
}

class MyOptions implements NestApplicationOptions {
    httpsOptions?: HttpsOptions;
}

async function bootstrap() {
    const httpsOptions = new MyHttpsOptions();
    httpsOptions.key = fs.readFileSync('tmp/privkey.pem');
    httpsOptions.cert = fs.readFileSync('tmp/cert.pem');
    httpsOptions.ca = fs.readFileSync('tmp/chain.pem');
    let mo = new MyOptions();
    mo.httpsOptions = httpsOptions;

    const app = await NestFactory.create(ApplicationModule, mo);
    app.init();
    app.use(bodyParser.json());
    /**
     * Headers setup
     */
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, api-key');
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
    // app.use(express.static(__dirname + '/modules/web/public'));
    // app.set('views', __dirname + '/modules/web/pwa/dist');
    // app.set('view engine', 'html');

    /**
     * Start Chainservice API
     */
    await app.listen(+EnvConfig.PORT, () => {
        console.log(`Started Chain-service on PORT ${EnvConfig.PORT}`);
    });
}

bootstrap();