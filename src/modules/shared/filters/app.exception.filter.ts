import { ExceptionFilter, Catch } from '@nestjs/common';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
    catch(exception, response) {
        response
            .status(500)
            .json({
                error: `Internal Server Error.`,
                details: exception.response.message
            });
    }
}