import {ApiModelProperty} from '@nestjs/swagger';

export class PostClientUserDTO {

    @ApiModelProperty()
    readonly PhoneNumber: string;

    @ApiModelProperty()
    readonly Uin: number;

    @ApiModelProperty()
    readonly Name: string;

    @ApiModelProperty()
    IsVerified: boolean;

    @ApiModelProperty()
    readonly Email: string;

    @ApiModelProperty()
    readonly Sex: string;

    @ApiModelProperty()
    readonly Birthdate: number;

    @ApiModelProperty()
    PushToken: string;

    @ApiModelProperty()
    readonly AdditionalData: string;

    @ApiModelProperty()
    Logs: any;
}
