import { Dayjs } from 'dayjs';

// Type
import { Star } from 'src/entities/star.entity';

export type StageName = 'IDLE' | 'PERFORMING' | 'VOTING' | 'RESULTS';

export interface BaseState { 
    stage: StageName;
    props: unknown;
};

export interface Idle extends BaseState {
    stage: 'IDLE';
    props: undefined;
};

export interface Performing extends BaseState {
    stage: 'PERFORMING';
    star: Star;
    props: {
        star: Star;
    };
};

export interface Voting extends BaseState {
    stage: 'VOTING';
    star: Star;
    started: Dayjs;
    currentVotes: number;
    props: {
        star: Star;
    };
};

export interface Results extends BaseState {
    stage: 'RESULTS';
    biggestAvg: number;
    biggestScore: number;
    biggestShrunk: number;
    countDuration: number;
    stars: Array<
        Star & {
            state: 'WAITING' | 'COUNTING' | 'FINISHED';
            started: Dayjs | null;
            avg: number;
            totalScore: number;
            totalVotes: number;
            shrunkScore: number;
        }
    >;
    props: {
        countDuration: number;
    };
};

export type State = Idle | Performing | Voting | Results;

export abstract class Stage<S extends State = any> {
    protected enabled = false;

    abstract getState(): Promise<Omit<S, 'props'>>;

    async invalidate() { }
    
    async beforeEnable(): Promise<void> { }
    
    async afterEnable(): Promise<void> {
        this.enabled = true;
    }

    async enable(props: S['props']): Promise<void> { }

    async beforeDisable(): Promise<void> { }

    async afterDisable(): Promise<void> {
        this.enabled = false;
    }
}