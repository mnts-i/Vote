import { Body, Controller, Delete, Logger, Post, UseGuards } from '@nestjs/common';

// Guards
import { AuthenticateGuard } from 'src/guards/authenticate.guard';
import { AdministratorGuard } from 'src/guards/administrator.guard';

// Repositories
import { UsersRepository } from '../repos/users.repository';

// DTOs
import { GenerateTokensDto } from 'src/dto/generate-tokens.dto';

@UseGuards(AuthenticateGuard)
@Controller('/api/tokens')
export class TokensController {
    private readonly logger = new Logger(TokensController.name);

    constructor(
        private usersRepository: UsersRepository
    ) { }

    @UseGuards(AdministratorGuard)
    @Post('generate')
    async generateTokens(
        @Body() { count }: GenerateTokensDto
    ) {
        return this.usersRepository.generateTokens(count);
    }

    @UseGuards(AdministratorGuard)
    @Delete('truncate')
    async truncate() {
        const { affected } = await this.usersRepository.truncateTokens();

        return { affected };
    }
}