import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { OnGatewayConnection, OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

// Types
import { type Stage, type State } from 'src/state/types';

// Stages
import { StageIdle } from 'src/state/stage-idle';
import { StageVoting } from 'src/state/stage-voting';
import { StageResults } from 'src/state/stage-results';
import { StagePerforming } from 'src/state/stage-performing';

@WebSocketGateway()
export class StateGateway implements OnGatewayConnection {
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
        this.logger.log('New socket.io connection: ' + client.id);
    }

    async getState() {
        return this.stage.getState();
    }

    async setStage<S extends State>(name: S['stage'], props: S['props']) {
        if (!this.server) {
            return;
        }

        await this.stage.beforeDisable();

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

        await this.stage.enable(props);
        await this.stage.afterEnable();

        this.server.emit('state', await this.getState());
        this.logger.log('Stage changed to: ' + this.stage);
    }
}