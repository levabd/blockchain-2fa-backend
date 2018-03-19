import {ApiModelProperty} from '@nestjs/swagger';

export class PostKaztelUserDTO {

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
    readonly Region: string;

    @ApiModelProperty()
    readonly PersonalAccount: number;

    @ApiModelProperty()
    readonly Question: string;

    @ApiModelProperty()
    readonly Answer: string;

    @ApiModelProperty()
    readonly AdditionalData: string;
}
