import { Server } from 'socket.io';

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

export interface Stage<S extends State = any> {
    getState: () => Promise<Omit<S, 'props'>>;

    enable: (server: Server, props: S['props']) => Promise<void>;
    
    afterEnable: () => Promise<void>;
    beforeDisable: () => Promise<void>;
}