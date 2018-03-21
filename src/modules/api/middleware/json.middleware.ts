import {Middleware, NestMiddleware, ExpressMiddleware, HttpStatus} from '@nestjs/common';


@Middleware()
export class JsonMiddleware implements NestMiddleware {
    resolve(...args: any[]): ExpressMiddleware {
        return (req, res, next) => {
            const acceptheader = req.headers['accept'] || req.headers['Accept'] || false;
            if (acceptheader && acceptheader.search('application/json')===-1) {
                console.log('JsonMiddleware@resolve: app api wait json data. Not json type given in header!');
                return res.status(HttpStatus.METHOD_NOT_ALLOWED).json('Not Acceptable');
            }
            next();
        };
    }
}