import { PickType } from '@nestjs/mapped-types';
import { IsInt, IsPositive } from 'class-validator';

// DTOs
import { TokenDto } from './token.dto';

export class MyVoteDto extends PickType(TokenDto, ['token']) {

    @IsInt()
    @IsPositive()
    starId: number;
}