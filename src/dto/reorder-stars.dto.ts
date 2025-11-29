import { IsArray, IsInt, IsPositive } from 'class-validator';

export class ReorderStarsDto {

    @IsArray()
    @IsInt({ each: true })
    @IsPositive({ each: true })
    ids: number[];
}