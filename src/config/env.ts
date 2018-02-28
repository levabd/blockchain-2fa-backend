import 'dotenv/config';

export interface ProcessEnv {
    [key: string]: string | undefined;
}

/**
 * node EnvConfig variables,
 * copy .env.example file, rename to .env
 *
 * @export
 * @class EnvConfig
 */
export class EnvConfig {

    // NODE
    public static NODE_ENV = process.env['NODE_ENV'] || 'LOCAL';
    public static PORT = process.env['PORT'] || 4001;

    // AWS
    public static AWS_ACCESS_KEY = process.env['AWS_ACCESS_KEY'] || '';
    public static AWS_SECRET_ACCESS_KEY = process.env['AWS_SECRET_ACCESS_KEY'] || '';
    public static AWS_REGION = process.env['AWS_REGION'] || '';
    public static AWS_QUEUE_NAME = process.env['AWS_QUEUE_NAME'] || '';
    public static BYPASS_QUEUE = process.env['BYPASS_QUEUE'] || '';

    // FABRIC
    public static PEER_HOST = process.env['PEER_HOST'] || 'localhost';
    public static ORDERER_HOST = process.env['ORDERER_HOST'] || 'localhost';

    // PUSHER
    public static PUSHER_KEY = process.env['PUSHER_KEY'];
    public static PUSHER_APP_ID = process.env['PUSHER_APP_ID'];
    public static PUSHER_SECRET = process.env['PUSHER_SECRET'];
    public static PUSHER_CLUSTER = process.env['PUSHER_CLUSTER'];

    // Auth0
    public static AUTH0_CLIENT_SECRET = process.env['AUTH0_CLIENT_SECRET'];
    public static AUTH0_CLIENT_ID = process.env['AUTH0_CLIENT_ID'];
    public static AUTH0_DOMAIN = process.env['AUTH0_DOMAIN'];
    public static AUTH0_AUDIENCE = process.env['AUTH0_AUDIENCE'];

    // Redis configuration
    public static REDIS_HOST = process.env['REDIS_HOST'];
    public static REDIS_PORT = process.env['REDIS_PORT'];

    // Redis configuration
    public static SMS_USERNAME = process.env['SMS_USERNAME'];
    public static SMS_PASSWORD = process.env['SMS_PASSWORD'];
    public static SMS_CALLBACK_TOKEN = process.env['SMS_CALLBACK_TOKEN'];
}