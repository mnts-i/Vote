import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';

// DTOs
import { VoteDto } from 'src/dto/vote.dto';

// Entities
import { Vote } from 'src/entities/vote.entity';

// Repositories
import { UsersRepository } from 'src/repos/users.repository';
import { StarsRepository } from 'src/repos/stars.repository';

@Injectable()
export class VoteService {
    constructor(
        private usersRepository: UsersRepository,
        private starsRepository: StarsRepository,

        @InjectRepository(Vote)
        private votesRepository: Repository<Vote>,
    ) { }

    async vote({ token, starId, score }: VoteDto) {
        const star = await this.starsRepository.fetchById(starId);
        const user = await this.usersRepository.fetchByToken(token);

        // Check if the user has already voted the selected star
        if (await this.votesRepository.findOneBy({ starId: star.id, userId: user.id })) {
            throw new BadRequestException('Έχεις ήδη ψηφίσει αυτό το άτομο');
        }

        return await this.votesRepository.save({
            score,
            starId: star.id,
            userId: user.id,
        });
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