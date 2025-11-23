import { FileInterceptor } from '@nestjs/platform-express';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';

// Guards
import { AuthenticateGuard } from 'src/guards/authenticate.guard';
import { AdministratorGuard } from 'src/guards/administrator.guard';

// Pipes
import { ImageMimeValidationPipe } from 'src/pipes/image-mime-validation.pipe';

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
    
    @UseGuards(AdministratorGuard)
    @Delete(':id/image')
    deleteStarImage(
        @Param('id', ParseIntPipe) id: number
    ) { 
        return this.starsRepository.deleteImage(id);
    }

    @UseGuards(AdministratorGuard)
    @UseInterceptors(FileInterceptor('file'))
    @Post(':id/image')
    uploadStarImage(
        @Param('id', ParseIntPipe) id: number,
        @UploadedFile(
            new ImageMimeValidationPipe(),
        ) file: Express.Multer.File
    ) {
        return this.starsRepository.uploadImage(id, file);
    }
}