import { EntityManager, Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';

// DTOs
import { VoteDto } from 'src/dto/vote.dto';
import { MyVoteDto } from 'src/dto/my-vote.dto';

// Entities
import { Vote } from 'src/entities/vote.entity';
import { Star } from 'src/entities/star.entity';
import { User } from 'src/entities/user.entity';

type VoteCache = Map<number, Map<number, number>>;

type RankingsResult = {
    [key: number]: {
        avg: number;
        starId: number;
        totalVotes: number;
        totalScore: number;
        shrunkScore: number;
    };
};

@Injectable()
export class VoteService {
    private cache: VoteCache = new Map();

    constructor(
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
            const star = await tx.getRepository(Star).findOneBy({ id: starId });
            const user = await tx.getRepository(User).findOneBy({ token });

            if (!star) {
                throw new NotFoundException('Δε βρέθηκε το επιλεγμένο ταλέντο');
            }

            if (!user) {
                throw new NotFoundException('Δε βρέθηκε ο χρήστης');
            }

            const votesMap = await this.fetchStarVotes(star.id, tx);

            await tx.getRepository(Vote).upsert({
                score,
                starId: star.id,
                userId: user.id,
            }, {
                conflictPaths: ['userId', 'starId'],
                skipUpdateIfNoValuesChanged: true,
            });

            votesMap.set(user.id, score);

            return votesMap;
        });
    }

    async getVote({ token, starId }: MyVoteDto) {
        return this.manager.transaction(async (tx) => {
            const user = await tx.getRepository(User).findOneBy({ token });

            if (!user) {
                throw new NotFoundException('Δε βρέθηκε ο χρήστης');
            }

            const votesMap = await this.fetchStarVotes(starId, tx);

            return votesMap.get(user.id) ?? null;
        });
    }

    clearCache(starId?: number) {
        typeof starId === 'number' && !Number.isNaN(starId)
            ? this.cache.delete(starId)
            : this.cache.clear();
    }

    async getRankings() {
        const votes = await this.votesRepository.find({
            select: ['starId', 'score'],
            order: {
                starId: 'ASC'
            }
        });

        console.log(votes)

        let totalStars = 0;

        const votesMap = votes.reduce((map, { score, starId }) => {
            totalStars += score;

            map.set(starId, [...(map.get(starId) ?? []), score]);

            return map;
        }, new Map<number, number[]>());

        const totalVotes = votes.length;
        const globalMean = totalStars / totalVotes;

        const k = 8;

        return Array.from(votesMap.entries()).reduce((map, [starId, scores]) => {
            const v = scores.length;
            const sum = scores.reduce((acc, s) => acc + s, 0);
            const avg = v > 0 ? sum / v : 0;

            const shrunkScore = v > 0
                ? (v * avg + k * globalMean) / (v + k)
                : globalMean;

            map[starId] = {
                avg,
                starId,
                totalVotes: v,
                totalScore: sum,
                shrunkScore,
            };

            return map;
        }, {} as RankingsResult);
    }
}