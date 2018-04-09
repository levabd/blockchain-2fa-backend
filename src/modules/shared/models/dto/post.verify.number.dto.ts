import {ApiModelProperty} from '@nestjs/swagger';

export class PostVerifyNumberDTO {
    // noinspection TsLint
    @ApiModelProperty()
    phone_number: string;
    // noinspection TsLint
    @ApiModelProperty()
    readonly push_token: string;
    @ApiModelProperty()
    readonly code: string;
    readonly lang: string;
}