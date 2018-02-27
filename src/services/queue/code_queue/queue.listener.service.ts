
import { EnvConfig } from '../../../config/env';
import { Component } from '@nestjs/common';
import { Log } from 'hlf-node-utils';
import * as Queue from 'bull';

@Component()
export class CodeQueueListenerService {

    public queueSMS;
    public queuePUSH;

    /**
     * Creates an instance of QueueService.
     * @memberof QueueService
     */
    constructor() {
        this.queueSMS = new Queue('code_queue_sms', `redis://${EnvConfig.REDIS_HOST}:${EnvConfig.REDIS_PORT}`);
        this.queuePUSH = new Queue('code_queue_push', `redis://${EnvConfig.REDIS_HOST}:${EnvConfig.REDIS_PORT}`);
    }

    /**
     * start listeneing for queueSMS messages
     *
     * @private
     * @memberof QueueService
     */
    public listen(): void {
        Log.config.info(`waiting for the jobs`);

        this.queueSMS.process(function(job, done){

            // job.data contains the custom data passed when the job was created
            // job.id contains id of this job.
            Log.config.info(`process queueSMS`, job.data);
            done();
        });
        this.queuePUSH.process(function(job, done){

            // job.data contains the custom data passed when the job was created
            // job.id contains id of this job.
            Log.config.info(`process queuePUSH`, job.data);
            done();
        });
    }
}
