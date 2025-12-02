import { StateGateway } from 'src/gateways/state.gateway';
import fs from 'fs-extra';
import { join } from 'node:path';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Injectable, Logger, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';

// Entities
import { Star } from 'src/entities/star.entity';

// DTOs
import { CreateStarDto } from 'src/dto/create-star.dto';

// Services
import { ImageService } from 'src/services/image.service';

@Injectable()
export class StarsRepository implements OnApplicationBootstrap {
    private readonly cache = new Map<number, Star>();
    private readonly logger = new Logger(StarsRepository.name);
    private readonly imagesDir = join(process.cwd(), 'data', 'images');

    constructor(
        private readonly stateGateway: StateGateway,
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
            order: { position: 'ASC' }
        });
    }

    async create(data: CreateStarDto) {
        const lastStar = await this.repository.findOne({
            select: ['position'],
            where: {},
            order: {
                position: 'DESC'
            }
        });

        const position = lastStar?.position ?? 1;

        return this.repository.save({ ...data, position });
    }

    async update(id: number, data: CreateStarDto) {
        const star = await this.fetchById(id);

        const newStar = await this.repository.save({ ...star, ...data });

        this.cache.set(id, newStar);

        await this.stateGateway.invalidate();

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

        this.cache.delete(id);

        await this.stateGateway.invalidate();
    }

    async uploadImage(id: number, file: Express.Multer.File) {
        const star = await this.fetchById(id);
        const image = await this.imageService.compressImage(file);
        const oldImage = star.image ? join(this.imagesDir, star.image) : null;

        if (oldImage) {
            await fs.remove(oldImage);
        }

        // Update and store to cache
        this.cache.set(id, await this.repository.save({ ...star, image }));

        this.logger.log('Profile image uploaded for: ' + star.name);

        await this.stateGateway.invalidate();
    }

    async reorder(ids: number[]) {
        for (const [pos, id] of ids.entries()) {
            await this.repository.update({ id }, { position: pos + 1 });
        }
    }
}