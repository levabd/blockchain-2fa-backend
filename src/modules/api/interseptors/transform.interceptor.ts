import { Interceptor, NestInterceptor, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import {Log} from 'hlf-node-utils';

@Interceptor()
export class TransformInterceptor implements NestInterceptor {
    intercept(dataOrRequest, context: ExecutionContext, stream$: Observable<any>): Observable<any> {
        return stream$.map((data) => {
            Log.app.debug('data', data);
        });
    }
}
