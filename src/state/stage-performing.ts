import { Server } from 'socket.io';
import { Injectable } from '@nestjs/common';

// Entities
import { Star } from 'src/entities/star.entity';

// Types
import { Performing, Stage } from './types';

@Injectable()
export class StagePerforming implements Stage<Performing> {
    private star: Star;

    async getState() {
        return {
            stage: 'PERFORMING' as const,
            star: this.star,
        };
    }

    async enable(_server: Server, props: Performing['props']) {
        this.star = props.star;
    }

    async afterEnable() { }
    async beforeDisable() { }
}