import {Middleware, NestMiddleware, ExpressMiddleware, HttpStatus} from '@nestjs/common';
import * as crc32 from 'crc-32';
import {EnvConfig} from '../../../config/env';
import {decimalToHexString, md5} from '../../../services/helpers/helpers';

@Middleware()
export class FrontendApiKeyCheckerMiddleware implements NestMiddleware {
    resolve(...args: any[]): ExpressMiddleware {
        return (req, res, next) => {
            if (!req.headers['api-key']) {
                console.log('FrontendApiKeyCheckerMiddleware@resolve: attempt to execute query with no ip key');
                return res.status(HttpStatus.UNAUTHORIZED).json({error: 'Wrong API key'});
            }
            // Генерация ключа API к текущему запросу
            const apiKey = req.headers['api-key'];
            const queryData = req.method === 'POST' ? req.body : req.query;
            const phoneNumber = `${queryData.phone_number}` || '';
            let strArray = [];
            Object.keys(queryData).forEach((key) => {
                strArray.push(`${key}:${queryData[key]}`);
            });
            const bodySrc = crc32.bstr(strArray.join(';')+';');
            const hash = md5(`${req.path}::body::${ decimalToHexString(bodySrc)}::key::${EnvConfig.API_KEY_FRONTEND}::phone_number::${phoneNumber}`);
            if (hash !== apiKey.substring(0, apiKey.length - 17)) {
                console.log(`FrontendApiKeyCheckerMiddleware@resolve: attempt to execute query with wrong api key: ${apiKey}`);
                return res.status(HttpStatus.UNAUTHORIZED).json({error: 'Wrong API key'});
            }
            next();
        };
    }
}