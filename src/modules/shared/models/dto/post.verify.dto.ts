import {ApiModelProperty} from '@nestjs/swagger';

export class PostVerifyCodeDTO{
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
    client_timestamp: string;
    // noinspection TsLint
    @ApiModelProperty()
    readonly cert: string;
    // noinspection TsLint
    @ApiModelProperty()
    readonly code: number;
    @ApiModelProperty()
    readonly lang: string;
    @ApiModelProperty()
    readonly status: string;
    @ApiModelProperty()
    readonly method: string;
}