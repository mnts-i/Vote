import { Trim } from '@buka/class-transformer-extra';
import { IsOptional, IsString } from 'class-validator';

export class CreateStarDto {

    @Trim()
    @IsString()
    name: string;

    @IsOptional()
    @Trim()
    @IsString()
    field?: string;

    @IsOptional()
    @Trim()
    @IsString()
    color?: string;
}