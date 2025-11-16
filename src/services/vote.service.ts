import { EntityManager, Repository } from 'typeorm';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';

// DTOs
import { VoteDto } from 'src/dto/vote.dto';

// Entities
import { Vote } from 'src/entities/vote.entity';

// Repositories
import { UsersRepository } from 'src/repos/users.repository';
import { StarsRepository } from 'src/repos/stars.repository';

type VoteCache = Map<number, Map<number, number>>;

@Injectable()
export class VoteService {
    private cache: VoteCache = new Map();

    constructor(
        private usersRepository: UsersRepository,
        private starsRepository: StarsRepository,

        @InjectEntityManager()
        private manager: EntityManager,
        @InjectRepository(Vote)
        private votesRepository: Repository<Vote>,
    ) { }

    async fetchStarVotes(starId: number, tx?: EntityManager) {
        const cacheHit = this.cache.get(starId);

        if (cacheHit) {
            return cacheHit;
        }

        const repository = tx ? tx.getRepository(Vote) : this.votesRepository;
        const votes = await repository.findBy({ starId });

        const votesMap = votes.reduce((map, data) => map.set(data.userId, data.score), new Map<number, number>());

        this.cache.set(starId, votesMap);

        return votesMap;
    }

    async vote({ token, starId, score }: VoteDto) {
        return this.manager.transaction(async (tx) => {
            const star = await this.starsRepository.fetchById(starId, tx);
            const user = await this.usersRepository.fetchByToken(token, tx);

            const votesMap = await this.fetchStarVotes(star.id, tx);

            // Check if the user has already voted the selected star
            if (votesMap.has(user.id)) {
                throw new BadRequestException('Έχεις ήδη ψηφίσει αυτό το άτομο');
            }
    
            await tx.getRepository(Vote).save({
                score,
                starId: star.id,
                userId: user.id,
            });

            votesMap.set(user.id, score);

            return votesMap;
        });
    }

    clearCache(starId?: number) {
        typeof starId === 'number' && !Number.isNaN(starId)
            ? this.cache.delete(starId) 
            : this.cache.clear();
    }

    async getRankings() {
        return await this.votesRepository
            .createQueryBuilder('vote')
            .select('vote.starId')
            .addSelect('COUNT(vote.starId)', 'totalVotes')
            .addSelect('SUM(vote.score)', 'totalScore')
            .addSelect('AVG(vote.score)', 'avgScore')
            .groupBy('vote.starId')
            .orderBy('avgScore', 'DESC')
            .getRawMany<{
                starId: number;
                totalVotes: number;
                totalScore: number;
                avgScore: number;
            }>();
    }
}