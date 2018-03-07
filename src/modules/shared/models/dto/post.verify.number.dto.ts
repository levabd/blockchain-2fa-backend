import {ApiModelProperty} from '@nestjs/swagger';

export class PostVerifyNumberDTO {
    @ApiModelProperty()
    readonly event: string;
    // noinspection TsLint
    @ApiModelProperty()
    service: string;
    // noinspection TsLint
    @ApiModelProperty()
    readonly phone_number: string;
    // noinspection TsLint
    @ApiModelProperty()
    readonly embeded: boolean;
    // noinspection TsLint
    @ApiModelProperty()
    readonly client_timestamp: number;
    // noinspection TsLint
    @ApiModelProperty()
    readonly cert: string;
}