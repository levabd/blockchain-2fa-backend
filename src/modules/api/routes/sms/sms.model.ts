import { ApiModelProperty } from '@nestjs/swagger';

export class SmsBodyDto {
    @ApiModelProperty()
    readonly id: string;
    @ApiModelProperty()
    readonly phone: string;
    @ApiModelProperty()
    readonly charset: string;
    @ApiModelProperty()
    readonly status: string;
    @ApiModelProperty()
    readonly time: string;
    @ApiModelProperty()
    readonly ts: string;
    @ApiModelProperty()
    readonly snt: string;
    @ApiModelProperty()
    readonly sha1: string;
}