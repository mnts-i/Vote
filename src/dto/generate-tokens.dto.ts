import { IsInt, Min } from 'class-validator';

export class GenerateTokensDto {

    @IsInt()
    @Min(1, { message: 'Ο αριθμός tokens πρέπει να είναι τουλάχιστον 1' })
    count: number;
}