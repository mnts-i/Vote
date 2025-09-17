import { IsInt, IsPositive, IsString, Length, Max, Min } from 'class-validator';

export class VoteDto {

    @IsString()
    id: string;
    
    @IsString()
    @Length(12, 12)
    token: string;

    @IsInt()
    @IsPositive()
    starId: number;

    @IsInt()
    @Min(1)
    @Max(10)
    score: number;
}