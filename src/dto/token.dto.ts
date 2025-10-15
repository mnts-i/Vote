import { IsString, Length } from 'class-validator';

export class TokenDto {
    
    @IsString()
    @Length(12, 12)
    token: string;
}