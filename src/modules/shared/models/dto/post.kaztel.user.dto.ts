import {ApiModelProperty} from '@nestjs/swagger';

export class PostClientUserDTO {

    @ApiModelProperty()
    readonly Name: string;

    @ApiModelProperty()
    readonly PhoneNumber: string;

    @ApiModelProperty()
    readonly Uin: number;

    @ApiModelProperty()
    readonly Sex: string;

    @ApiModelProperty()
    readonly Email: string;

    @ApiModelProperty()
    readonly Birthdate: number;

    @ApiModelProperty()
    readonly PushToken: string;

    @ApiModelProperty()
    readonly AdditionalData: string;

    @ApiModelProperty()
    Logs: any;
}
