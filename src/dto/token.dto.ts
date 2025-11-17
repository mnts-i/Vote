import { ToLowerCase, Trim } from '@buka/class-transformer-extra';
import { IsString, Length } from 'class-validator';

export class TokenDto {
    
    @Trim()
    @ToLowerCase()
    @IsString()
    @Length(11, 11)
    token: string;
}