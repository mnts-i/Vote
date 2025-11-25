import utc from 'dayjs/plugin/utc';
import dayjs, { Dayjs } from 'dayjs';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

dayjs.extend(utc);

// Entities
import { Star } from 'src/entities/star.entity';

// Services
import { VoteService } from 'src/services/vote.service';

// Types
import { Stage, type Results } from './types';

@WebSocketGateway({ cors: true })
export class StageResults extends Stage<Results> {
    private readonly logger = new Logger(StageResults.name);

    @WebSocketServer()
    private server: Server;

    private stars: Results['stars'];
    private biggestScore: number;
    private countDuration: number;

    private loop: NodeJS.Timeout | null = null;

    constructor(
        private readonly voteService: VoteService,

        @InjectEntityManager()
        private readonly manager: EntityManager,
    ) {
        super();
    }

    async getState() {
        return {
            stage: 'RESULTS' as const,
            stars: this.stars,
            biggestScore: this.biggestScore,
            countDuration: this.countDuration,
        };
    }

    async enable(props: Results['props']) {
        await super.enable(props);

        this.countDuration = props.countDuration;
    }

    async afterEnable(): Promise<void> {
        await super.afterEnable();

        this.logger.log('Fetching stars and rankings...');

        const stars = await this.manager.getRepository(Star).find();
        const rankings = await this.voteService.getRankings();

        console.log(rankings)

        let biggestScore = 0;

        this.stars = stars.map(s => {
            const entry = rankings.find(r => r.starId === s.id);

            const totalScore = entry?.totalScore ?? 0;
            const totalVotes = entry?.totalVotes ?? 0;

            return { ...s, totalScore, totalVotes, state: 'WAITING', started: null };
        });

        this.biggestScore = biggestScore;

        this.logger.log('Starting results loop...');

        this.runLoop();
    }

    async beforeDisable(): Promise<void> {
        await super.beforeDisable();

        if (this.loop) {
            this.logger.log('Clearing running loop...');
            clearTimeout(this.loop);
        }
    }

    private async runLoop() {
        const idx = this.stars.findIndex(s => s.state === 'WAITING');
        const pending = this.stars.reduce((total, s) => s.state === 'WAITING' ? total + 1 : total, 0);

        if (idx === -1) {
            this.server.emit('state', await this.getState());
            this.logger.log('Completed showing results!!!');
            return;
        }

        this.stars[idx].state = 'COUNTING';
        this.stars[idx].started = dayjs.utc();

        this.logger.log('Showing: ' + this.stars[idx].name);

        this.loop = setTimeout(() => {
            this.stars[idx].state = 'FINISHED';
            this.runLoop();
        }, pending === 0 ? 100 : this.countDuration);

        this.server.emit('state', await this.getState());
    }
}