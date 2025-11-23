import { Server } from 'socket.io';
import { EntityManager } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

// Entities
import { Star } from 'src/entities/star.entity';

// Types
import { Performing, Stage } from './types';

@WebSocketGateway({ cors: true })
export class StagePerforming extends Stage<Performing> {
    private star: Star;

    @WebSocketServer()
    private server: Server;

    constructor(
        @InjectEntityManager()
        private readonly manager: EntityManager
    ) {
        super();
    }

    async getState() {
        return {
            stage: 'PERFORMING' as const,
            star: this.star,
        };
    }

    async invalidate() {
        const star = await this.manager.getRepository(Star).findOneBy({ id: this.star.id });

        if (!star) {
            throw new NotFoundException('Δε βρέθηκε το ταλέντο');
        }

        this.star = star;
        this.server.emit('state', await this.getState());
    }

    async enable(props: Performing['props']) {
        await super.enable(props);

        this.star = props.star;
    }
}