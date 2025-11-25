import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

// Types
import { type Stage, type State } from 'src/state/types';

// Stages
import { StageIdle } from 'src/state/stage-idle';
import { StageVoting } from 'src/state/stage-voting';
import { StageResults } from 'src/state/stage-results';
import { StagePerforming } from 'src/state/stage-performing';

@WebSocketGateway({ cors: true })
export class StateGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(StateGateway.name);
    
    private stage: Stage;

    @WebSocketServer()
    private server: Server;

    constructor(
        private readonly stageIdle: StageIdle,
        private readonly stageVoting: StageVoting,
        private readonly stageResults: StageResults,
        private readonly stagePerforming: StagePerforming,
    ) {
        this.stage = stageIdle;
    }

    async handleConnection(client: Socket) {
        client.emit('state', await this.getState());
        this.logger.log('New socket connected: ' + client.id);
    }

    handleDisconnect(client: Socket) {
        this.logger.log('Socket disconnected: ' + client.id);
    }

    invalidate() {
        return this.stage.invalidate();
    }

    async getState(): Promise<Omit<State, 'props'>> {
        return this.stage.getState();
    }

    async setStage<S extends State>(name: S['stage'], props: S['props']) {
        if (!this.server) {
            return;
        }

        const oldStage = this.stage;
        await oldStage.beforeDisable();

        if (name === 'IDLE') {
            this.stage = this.stageIdle;
        }

        if (name === 'VOTING') {
            this.stage = this.stageVoting;
        }

        if (name === 'PERFORMING') {
            this.stage = this.stagePerforming;
        }

        if (name === 'RESULTS') {
            this.stage = this.stageResults;
        }

        await oldStage.afterDisable();
        await this.stage.beforeEnable();
        
        await this.stage.enable(props);
        this.logger.log('Stage changed to: ' + name);
        
        await this.stage.afterEnable();

        this.server.emit('state', await this.getState());
    }
}