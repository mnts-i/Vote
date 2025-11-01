import { Body, Controller, Post } from '@nestjs/common';

// DTOs
import { TokenDto } from 'src/dto/token.dto';

// Repositories
import { UsersRepository } from '../repos/users.repository';

@Controller('api/users')
export class UsersController {
    constructor(
        private usersRepository: UsersRepository,
    ) { }

    @Post('validate')
    async validate(
        @Body() { token }: TokenDto
    ) {
        return await this.usersRepository.validateToken(token);
    }

    @Post('login')
    async login(
        @Body() { token }: TokenDto
    ) {
        return this.usersRepository.fetchByToken(token);
    }
}