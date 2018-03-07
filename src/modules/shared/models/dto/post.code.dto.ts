import {ApiModelProperty} from '@nestjs/swagger';

export class PostCodeDTO {
    @ApiModelProperty()
    readonly event: string;
    // noinspection TsLint
    @ApiModelProperty()
    readonly service: string;
    // noinspection TsLint
    @ApiModelProperty()
    readonly phone_number: string;
    // noinspection TsLint
    @ApiModelProperty()
    readonly embeded: boolean;
    // noinspection TsLint
    @ApiModelProperty()
    readonly client_timestamp: string;
    // noinspection TsLint
    @ApiModelProperty()
    readonly cert: string;
}