import 'dotenv/config';
import {_hash} from '../services/helpers/helpers';

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
    public static API_KEY = process.env['API_KEY'] || 'sgdfhdmgdkfgjk';
    public static API_PATH = process.env['API_PATH'];
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

    // ClientService env variables
    public static KAZAHTELECOM_KEY = process.env['KAZAHTELECOM_KEY'];

    // Channels config
    public static TWOFA_CHANNEL = process.env['TWOFA_CHANNEL'];
    public static TWOFA_CHAINCODE = process.env['TWOFA_CHAINCODE'];
    public static KAZTEL_CHANNEL = process.env['KAZTEL_CHANNEL'];
    public static KAZTEL_CHAINCODE = process.env['KAZTEL_CHAINCODE'];

    public static FIREBASE_CLOUD_KEY = process.env['FIREBASE_CLOUD_KEY'];

    public static TFA_FAMILY_NAME = process.env['TFA_FAMILY_NAME'];
    public static TFA_FAMILY_VERSION = process.env['TFA_FAMILY_VERSION'];
    public static TFA_FAMILY_NAMESPACE = _hash(process.env['TFA_FAMILY_NAME']).substring(0, 6);

    public static KAZTEL_FAMILY_NAME = process.env['KAZTEL_FAMILY_NAME'];
    public static KAZTEL_FAMILY_VERSION = process.env['KAZTEL_FAMILY_VERSION'];
    public static KAZTEL_FAMILY_NAMESPACE_HASH = _hash(process.env['KAZTEL_FAMILY_NAME']).substring(0, 6);

    public static VALIDATOR_REST_API = process.env['VALIDATOR_REST_API'];

    public static COMMITED = 'COMMITED';
    public static INVALID = 'INVALID';
    public static PENDING = 'PENDING';
}