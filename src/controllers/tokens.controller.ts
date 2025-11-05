import { Body, Controller, Logger, Post } from '@nestjs/common';

// Repositories
import { UsersRepository } from '../repos/users.repository';

// DTOs
import { GenerateTokensDto } from 'src/dto/generate-tokens.dto';

@Controller('/api/tokens')
export class TokensController {
    private readonly logger = new Logger(TokensController.name);

    constructor(
        private usersRepository: UsersRepository
    ) { }

    @Post('generate')
    async generateTokens(
        @Body() { count }: GenerateTokensDto
    ) {
        return this.usersRepository.generateTokens(count);
    }
}