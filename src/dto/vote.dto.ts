import { PickType } from '@nestjs/mapped-types';
import { IsInt, IsPositive, IsString, Max, Min } from 'class-validator';

// DTOs
import { TokenDto } from './token.dto';

export class VoteDto extends PickType(TokenDto, ['token']) {

    @IsInt()
    @IsPositive()
    starId: number;

    @IsInt()
    @Min(1)
    @Max(10)
    score: number;
}