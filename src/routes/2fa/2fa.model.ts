import { ApiModelProperty } from '@nestjs/swagger';

export class TwoFaUserDto {
    @ApiModelProperty()
    readonly Key: string;
    @ApiModelProperty()
    readonly PhoneNumber: string;
    @ApiModelProperty()
    readonly PushToken: string;
}