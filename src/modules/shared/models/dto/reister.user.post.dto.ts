import {ApiModelProperty} from '@nestjs/swagger';

export class RegisterUserDTO {
    @ApiModelProperty()
    readonly PhoneNumber: string;
    @ApiModelProperty()
    readonly Name: string;
    @ApiModelProperty()
    readonly service: string;
    // noinspection TsLint
    @ApiModelProperty()
    readonly push_token: string;
}