import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';

// Guards
import { AuthenticateGuard } from 'src/guards/authenticate.guard';
import { AdministratorGuard } from 'src/guards/administrator.guard';

// Repositories
import { StarsRepository } from '../repos/stars.repository';

// Stars
import { CreateStarDto } from 'src/dto/create-star.dto';

@UseGuards(AuthenticateGuard)
@Controller('/api/stars')
export class StarsController {
    constructor(
        private readonly starsRepository: StarsRepository
    ) { }

    @Get('all')
    fetchAll() {
        return this.starsRepository.fetchAll();
    }

    @Get(':id')
    fetchStar(
        @Param('id', ParseIntPipe) id: number
    ) {
        return this.starsRepository.fetchById(id);
    }

    @UseGuards(AdministratorGuard)
    @Post()
    createStar(
        @Body() data: CreateStarDto,
    ) {
        return this.starsRepository.create(data);
    }

    @UseGuards(AdministratorGuard)
    @Patch(':id')
    updateStar(
        @Param('id', ParseIntPipe) id: number,
        @Body() data: CreateStarDto,
    ) {
        return this.starsRepository.update(id, data);
    }

    @UseGuards(AdministratorGuard)
    @Delete(':id')
    deleteStar(
        @Param('id', ParseIntPipe) id: number
    ) {
        return this.starsRepository.delete(id);
    }
}