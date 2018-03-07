import {ApiModelProperty} from '@nestjs/swagger';
import {PostCodeDTO} from './post.code.dto';

export class PostVerifyCodeDTO extends PostCodeDTO{
    @ApiModelProperty()
    readonly code: number;
    @ApiModelProperty()
    readonly remember: boolean;
}