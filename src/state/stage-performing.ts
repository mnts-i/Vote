import { WebSocketGateway } from '@nestjs/websockets';

// Entities
import { Star } from 'src/entities/star.entity';

// Types
import { Performing, Stage } from './types';

@WebSocketGateway({ cors: true })
export class StagePerforming extends Stage<Performing> {
    private star: Star;

    async getState() {
        return {
            stage: 'PERFORMING' as const,
            star: this.star,
        };
    }

    async enable(props: Performing['props']) {
        await super.enable(props);

        this.star = props.star;
    }
}