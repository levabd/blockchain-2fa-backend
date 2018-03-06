import {ApiModelProperty} from '@nestjs/swagger';

export class PostVerifyDTO {
    @ApiModelProperty()
    readonly code: string;
    // noinspection TsLint
    @ApiModelProperty()
    readonly phone_number: string;
    @ApiModelProperty()
    service: string;
    // noinspection TsLint
    @ApiModelProperty()
    readonly push_token: string;
}