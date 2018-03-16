import {ApiModelProperty} from '@nestjs/swagger';

export class PostUserDTO {

    @ApiModelProperty()
    readonly Name: string;

    @ApiModelProperty()
    readonly PhoneNumber: string;

    @ApiModelProperty()
    readonly Service: string;

    @ApiModelProperty()
    readonly ClientTimestamp: string;

    @ApiModelProperty()
    readonly Uin: number;

    @ApiModelProperty()
    readonly Sex: string;

    @ApiModelProperty()
    readonly Email: string;

    @ApiModelProperty()
    readonly Birthdate: number;

    @ApiModelProperty()
    readonly Method: string;
}
