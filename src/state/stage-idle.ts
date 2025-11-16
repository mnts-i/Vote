import { WebSocketGateway } from '@nestjs/websockets';

// Types
import { Stage, Idle } from './types';

@WebSocketGateway()
export class StageIdle extends Stage<Idle> {
    async getState() {
        return { stage: 'IDLE' as const };
    }
}