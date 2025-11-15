import { Injectable } from '@nestjs/common';

// Types
import { Stage, Idle } from './types';

@Injectable()
export class StageIdle implements Stage<Idle> {
    async getState() {
        return { stage: 'IDLE' as const };
    }

    async enable() { }
    async afterEnable() { }
    async beforeDisable() { }
}