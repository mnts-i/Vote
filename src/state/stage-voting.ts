import { Server } from 'socket.io';
import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

// DTOs
import { VoteDto } from 'src/dto/vote.dto';

// Entities
import { Star } from 'src/entities/star.entity';

// Services
import { VoteService } from 'src/services/vote.service';

// Types
import { Stage, type Voting } from './types';

@WebSocketGateway()
export class StageVoting extends Stage<Voting> {
    private readonly logger = new Logger(StageVoting.name);

    @WebSocketServer()
    private server: Server;

    private star: Star;
    private started: Date;
    private currentVotes: number;

    constructor(
        private readonly voteService: VoteService
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

    async enable(props: Voting['props']) {
        await super.enable(props);
        
        this.star = props.star;
        this.started = new Date();
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

            this.server.emit('state', this.getState());

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
}