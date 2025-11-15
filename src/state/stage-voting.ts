import { Server, Socket } from 'socket.io';
import { VoteDto } from 'src/dto/vote.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';

// Entities
import { Star } from 'src/entities/star.entity';

// Services
import { VoteService } from 'src/services/vote.service';

// Types
import { Stage, Voting } from './types';

@Injectable()
export class StageVoting implements Stage<Voting> {
    private readonly logger = new Logger(StageVoting.name);

    private server: Server;

    private star: Star;
    private started: Date;
    private currentVotes: number;

    constructor(
        private readonly voteService: VoteService
    ) { }

    async getState() {
        return {
            stage: 'VOTING' as const,
            star: this.star,
            started: this.started,
            currentVotes: this.currentVotes,
        };
    }

    async enable(server: Server, props: Voting['props']) {
        this.star = props.star;
        this.started = new Date();
        this.currentVotes = 0;

        this.server = server;
    }

    async afterEnable() {
        this.server.on('connection', this.onConnect);

        for (const socket of this.server.sockets.sockets.values()) {
            
        }

        this.logger.log('Attached vote listener!');

        this.logger.log(`Updating initial votes count for star: ${this.star.name}`);
        this.currentVotes = (await this.voteService.fetchStarVotes(this.star.id)).size;
    }

    async beforeDisable() {
        this.server.off('connection', this.onConnect);
        this.logger.log('Dettached vote listener!');
    }

    private onConnect(socket: Socket) {
        socket.on('vote', this.onVote);
    }

    private async onVote(data: any, cb: (payload: { error?: string; }) => void) {
        try {
            const payload = plainToInstance(VoteDto, data, { excludeExtraneousValues: true });
            const errors = await validate(payload);
    
            if (errors && errors.length !== 0) {
                throw new BadRequestException('Λάθος payload');
            }

            const votesMap = await this.voteService.vote(data);

            this.currentVotes = votesMap.size;

            this.server.emit('state', this.getState());

            cb({});
        } catch (err) {

            // In case the error is not a BadRequest and NotFound exception then display an error in the console
            if (!(err instanceof BadRequestException) && !(err instanceof NotFoundException)) {
                this.logger.error('Σφάλμα κατά την ψηφοφορία');
                this.logger.error(err);
            }

            cb({ error: err.message || 'Προέκυψε κάποιο σφάλμα' });
        }
    }
}