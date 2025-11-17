import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

// Entities
import { Star } from 'src/entities/star.entity';

// Services
import { VoteService } from 'src/services/vote.service';

// Types
import { Stage, type Voting } from './types';

@WebSocketGateway({ cors: true })
export class StageResults extends Stage<Voting> {
    private readonly logger = new Logger(StageResults.name);

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

        this.logger.log('Started results animation');
    }

    async afterDisable(): Promise<void> {
        await super.afterDisable();

        this.voteService.clearCache(this.star.id);
    }
}