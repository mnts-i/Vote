
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
    started: Date;
    currentVotes: number;
    props: {
        star: Star;
    };
};

export interface Results extends BaseState {
    stage: 'RESULTS';
    biggestScore: number;
    countDuration: number;
    stars: Array<
        Star & {
            state: 'WAITING' | 'COUNTING' | 'FINISHED';
            votes: number[];
            started: number | null;
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