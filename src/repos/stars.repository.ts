import fs from 'fs-extra';
import { join } from 'node:path';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Injectable, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';

// Entities
import { Star } from 'src/entities/star.entity';

// DTOs
import { CreateStarDto } from 'src/dto/create-star.dto';

// Services
import { ImageService } from '../services/image.service';

@Injectable()
export class StarsRepository implements OnApplicationBootstrap {
    private readonly cache = new Map<number, Star>();
    private readonly imagesDir = join(process.cwd(), 'IMAGES');

    constructor(
        private readonly imageService: ImageService,
        @InjectRepository(Star)
        private readonly repository: Repository<Star>
    ) { }


    async onApplicationBootstrap() {
        await fs.ensureDir(this.imagesDir);
    }

    async fetchById(id: number, tx?: EntityManager) {
        const cachedStar = this.cache.get(id);

        if (cachedStar) {
            return cachedStar;
        }

        const repository = tx ? tx.getRepository(Star) : this.repository;
        const fetchedStar = await repository.findOneBy({ id });

        if (!fetchedStar) {
            throw new NotFoundException('Δε βρέθηκε το επιλεγμένο ταλέντο');
        }

        this.cache.set(id, fetchedStar);

        return fetchedStar;
    }

    fetchAll() {
        return this.repository.find({
            order: { createdAt: 'ASC' }
        });
    }

    async create(data: CreateStarDto) {
        return this.repository.save(data);
    }

    async update(id: number, data: CreateStarDto) {
        const star = await this.fetchById(id);

        const newStar = await this.repository.save({ ...star, ...data });

        this.cache.set(id, newStar);

        return newStar;
    }

    async delete(id: number) {
        const star = await this.fetchById(id);

        if (star.image) {
            await fs.remove(join(this.imagesDir, star.image));
        }

        await this.repository.delete({ id: star.id });

        this.cache.delete(id);
    }

    async deleteImage(id: number) {
        const star = await this.fetchById(id);

        if (!star.image) { return; }

        await fs.remove(join(this.imagesDir, star.image));
        await this.repository.save({ ...star, image: null });
    }

    async uploadImage(id: number, file: Express.Multer.File) {
        const star = await this.fetchById(id);

        const image = await this.imageService.compressImage(file);

        await this.repository.save({ ...star, image });
    }
}