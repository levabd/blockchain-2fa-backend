import {Middleware, NestMiddleware, ExpressMiddleware, HttpStatus} from '@nestjs/common';

import * as crc32 from 'crc-32';
import * as crypto from 'crypto';
import {EnvConfig} from '../../../config/env';

export const md5 = (contents: string) => crypto.createHash('md5').update(contents).digest('hex');

const decimalToHexString = (number) => {
    if (number < 0) {
        number = 0xFFFFFFFF + number + 1;
    }

    return number.toString(16).toLowerCase();
}

@Middleware()
export class FrontendApiKeyCheckerMiddleware implements NestMiddleware {
    resolve(...args: any[]): ExpressMiddleware {
        return (req, res, next) => {
            if (!req.headers['api-key']) {
                console.log('FrontendApiKeyCheckerMiddleware@resolve: attempt to execute query with no ip key');
                return res.status(HttpStatus.UNAUTHORIZED).json({error: 'Wrong API key'});
            }
            // console.log('req.headers[api-key]', req.headers['api-key']);
            // Генерация ключа API к текущему запросу
            const apiKey = req.headers['api-key'];
            const queryData = req.method === 'POST' ? req.body : req.query;
            const phoneNumber = `${queryData.phone_number}` || '';
            // console.log('queryData', queryData);
            let strArray = [];
            Object.keys(queryData).forEach((key) => {
                strArray.push(`${key}:${queryData[key]}`);
            });
            // console.log('req.path', req.path);
            // console.log('strArray', strArray);
            // console.log('EnvConfig.API_KEY', EnvConfig.API_KEY_FRONTEND);
            // console.log('phoneNumber', phoneNumber);
            // console.log('body', strArray.join(';')+';');

            const bodySrc = crc32.bstr(strArray.join(';')+';');
            // console.log('bodySrc ', decimalToHexString(bodySrc));
            // console.log(`${req.path}::body::${ decimalToHexString(bodySrc)}::key::${EnvConfig.API_KEY_FRONTEND}::phone_number::${phoneNumber}`);
            const hash = md5(`${req.path}::body::${ decimalToHexString(bodySrc)}::key::${EnvConfig.API_KEY_FRONTEND}::phone_number::${phoneNumber}`);
            // console.log('hash', hash);
            // console.log('отразанная строка',apiKey.substring(0, apiKey.length - 17) );
            if (hash !== apiKey.substring(0, apiKey.length - 17)) {
                console.log(`FrontendApiKeyCheckerMiddleware@resolve: attempt to execute query with wrong api key: ${apiKey}`);
                return res.status(HttpStatus.UNAUTHORIZED).json({error: 'Wrong API key'});
            }
            next();
        };
    }
}