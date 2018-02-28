import { ApiModelProperty } from '@nestjs/swagger';

export class SmsBodyDto {
    @ApiModelProperty()
    readonly Id: string;
    @ApiModelProperty()
    readonly Phone: string;
    @ApiModelProperty()
    readonly Status: string;
}