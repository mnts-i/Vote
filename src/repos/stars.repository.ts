import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';

// Entities
import { Star } from 'src/entities/star.entity';

// DTOs
import { CreateStarDto } from 'src/dto/create-star.dto';

@Injectable()
export class StarsRepository {
    private readonly cache = new Map<number, Star>();

    constructor(
        @InjectRepository(Star)
        private repository: Repository<Star>
    ) { }

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

        await this.repository.delete({ id: star.id });

        this.cache.delete(id);
    }
}