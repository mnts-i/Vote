import utc from 'dayjs/plugin/utc';
import dayjs, { Dayjs } from 'dayjs';
import { Server } from 'socket.io';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

dayjs.extend(utc);

// DTOs
import { VoteDto } from 'src/dto/vote.dto';
import { MyVoteDto } from 'src/dto/my-vote.dto';

// Entities
import { Star } from 'src/entities/star.entity';

// Services
import { VoteService } from 'src/services/vote.service';

// Types
import { Stage, type Voting } from './types';

@WebSocketGateway({ cors: true })
export class StageVoting extends Stage<Voting> {
    private readonly logger = new Logger(StageVoting.name);

    @WebSocketServer()
    private server: Server;

    private star: Star;
    private started: Dayjs;
    private currentVotes: number;

    constructor(
        private readonly voteService: VoteService,

        @InjectEntityManager()
        private readonly manager: EntityManager,
    ) {
        super();
    }

    async getState() {
        return {
            stage: 'VOTING' as const,
            star: this.star,
            started: this.started,
            currentVotes: this.currentVotes,
        };
    }

    async invalidate() {
        const star = await this.manager.getRepository(Star).findOneBy({ id: this.star.id });

        if (!star) {
            throw new NotFoundException('Δε βρέθηκε το ταλέντο');
        }

        this.star = star;
        this.server.emit('state', await this.getState());
    }

    async enable(props: Voting['props']) {
        await super.enable(props);
        
        this.star = props.star;
        this.started = dayjs.utc();
        this.currentVotes = 0;
    }

    async afterEnable(): Promise<void> {
        await super.afterEnable();

        // The star might have previous votes?
        this.currentVotes = (await this.voteService.fetchStarVotes(this.star.id)).size;
    }

    async afterDisable(): Promise<void> {
        await super.afterDisable();

        this.voteService.clearCache(this.star.id);
    }

    @SubscribeMessage('vote')
    async onVote(
        @MessageBody() payload: VoteDto,
    ) {
        if (!this.enabled || !this.server) {
            return;
        }

        try {
            const votesMap = await this.voteService.vote(payload);

            this.currentVotes = votesMap.size;

            this.server.emit('state', await this.getState());

            return {};
        } catch (err) {

            // In case the error is not a BadRequest and NotFound exception then display an error in the console
            if (!(err instanceof BadRequestException) && !(err instanceof NotFoundException)) {
                this.logger.error('Σφάλμα κατά την ψηφοφορία');
                this.logger.error(err);
            }

            return { error: err.message || 'Προέκυψε κάποιο σφάλμα' };
        }
    }

    @SubscribeMessage('my-vote')
    async onMyVote(
        @MessageBody() payload: MyVoteDto
    ) {
        if (!this.enabled || !this.server) {
            return;
        }

        try {
            const vote = await this.voteService.getVote(payload);

            return { vote };
        } catch (err) {

            // In case the error is not a BadRequest and NotFound exception then display an error in the console
            if (!(err instanceof BadRequestException) && !(err instanceof NotFoundException)) {
                this.logger.error('Σφάλμα κατά την λήψη ατομικής ψήφου');
                this.logger.error(err);
            }

            return { error: err.message || 'Προέκυψε κάποιο σφάλμα' };
        }
    }
}