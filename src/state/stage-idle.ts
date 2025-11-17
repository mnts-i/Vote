import { WebSocketGateway } from '@nestjs/websockets';

// Types
import { Stage, Idle } from './types';

@WebSocketGateway({ cors: true })
export class StageIdle extends Stage<Idle> {
    async getState() {
        return { stage: 'IDLE' as const };
    }
}