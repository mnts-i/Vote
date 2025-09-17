import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';

// Entities
import { Star } from 'src/entities/star.entity';

@Injectable()
export class StarsRepository {
    private readonly cache = new Map<number, Star>();

    constructor(
        @InjectRepository(Star)
        private repository: Repository<Star>
    ) { }

    async fetchById(id: number) {
        const cachedStar = this.cache.get(id);

        if (cachedStar) {
            return cachedStar;
        }

        const fetchedStar = await this.repository.findOneBy({ id });

        if (!fetchedStar) {
            throw new NotFoundException('Δε βρέθηκε το επιλεγμένο ταλέντο');
        }

        this.cache.set(id, fetchedStar);

        return fetchedStar;
    }
}