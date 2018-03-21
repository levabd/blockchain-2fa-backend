import { Middleware, NestMiddleware, ExpressMiddleware } from '@nestjs/common';
import {Log} from 'hlf-node-utils';

@Middleware()
export class LoggerMiddleware implements NestMiddleware {
    resolve(...args: any[]): ExpressMiddleware {
        return (req, res, next) => {
            Log.app.debug('Request', req.path);
            next();
        };
    }
}