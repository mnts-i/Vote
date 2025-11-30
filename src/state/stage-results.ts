import utc from 'dayjs/plugin/utc';
import dayjs, { Dayjs } from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

dayjs.extend(utc);
dayjs.extend(duration);

// Entities
import { Star } from 'src/entities/star.entity';

// Services
import { VoteService } from 'src/services/vote.service';

// Types
import { Stage, type Results } from './types';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

@WebSocketGateway({ cors: true })
export class StageResults extends Stage<Results> {
    private readonly TICK_RATE = 100;
    private readonly logger = new Logger(StageResults.name);

    @WebSocketServer()
    private server: Server;

    private stars: Results['stars'];
    private started: Dayjs;
    private progress: number;
    private finished: boolean;

    private biggestAvg: number;
    private biggestScore: number;
    private biggestShrunk: number;
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
            started: this.started,
            progress: this.progress,
            finished: this.finished,
            biggestAvg: this.biggestAvg,
            biggestScore: this.biggestScore,
            biggestShrunk: this.biggestShrunk,
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

        let biggestAvg = 0;
        let biggestScore = 0;
        let biggestShrunk = 0;

        this.stars = stars.map((s) => {
            const entry = rankings[s.id];

            const avg = entry?.avg ?? 0;
            const totalScore = entry?.totalScore ?? 0;
            const totalVotes = entry?.totalVotes ?? 0;
            const shrunkScore = entry?.shrunkScore ?? 0;

            biggestAvg = avg > biggestAvg ? avg : biggestAvg;
            biggestScore = totalScore > biggestScore ? totalScore : biggestScore;
            biggestShrunk = shrunkScore > biggestShrunk ? shrunkScore : biggestShrunk;

            return { ...s, avg, totalScore, totalVotes, shrunkScore, animating: true, visibleScore: 0 };
        });

        console.log(this.stars);

        this.biggestAvg = biggestAvg;
        this.biggestScore = biggestScore;
        this.biggestShrunk = biggestShrunk;

        this.logger.log('Starting results loop...');

        this.loop = null;
        this.started = dayjs.utc();
        this.progress = 0;
        this.finished = false;

        this.runLoop();
    }

    async beforeDisable(): Promise<void> {
        await super.beforeDisable();

        if (this.loop !== null) {
            this.logger.log('Clearing running loop...');
            this.clearLoop();
        }
    }

    private clearLoop = () => {
        if (this.loop !== null) {
            clearTimeout(this.loop);
            this.loop = null;
        }
    }

    private async runLoop() {
        const diff = dayjs.utc().diff(this.started, 'milliseconds');
        const progress = clamp(diff / this.countDuration, 0, 1);

        if (this.finished) { return; }

        this.progress = progress * 100;

        // Done
        if (progress >= 1) {
            this.finished = true;
            this.calculateOrder(progress);
            this.clearLoop();
            await this.emitState();
            this.logger.log('Completed showing results!');
        }

        // Tick
        if (progress < 1) {
            this.logger.log(`Ticking: ${(progress * 100).toFixed(2)}%`);
            this.calculateOrder(progress);
            this.emitState();
            this.loop = setTimeout(() => this.runLoop(), this.TICK_RATE);
        }
    }

    private calculateOrder(progress: number) {
        const stars = this.stars.map(s => {
            const maxProgress = clamp(s.shrunkScore / this.biggestShrunk, 0, 1);
            const currentProgress = clamp(progress / maxProgress, 0, 1);

            const animating = currentProgress < 1;
            const visibleScore = s.shrunkScore * currentProgress;

            if (s.animating && !animating) {
                this.logger.log(`Count completed for: ${s.name}`);
            }

            return {
                ...s,
                animating,
                visibleScore: Number.isInteger(visibleScore)
                    ? visibleScore
                    : +visibleScore.toFixed(2),
            };
        }).sort((a, b) => b.visibleScore - a.visibleScore);

        this.stars = stars;
    }

    private async emitState() {
        this.server.emit('state', await this.getState());
    }
}