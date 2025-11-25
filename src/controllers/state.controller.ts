import { Controller, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';

// Gateways
import { StateGateway } from 'src/gateways/state.gateway';

// Repositories
import { StarsRepository } from 'src/repos/stars.repository';

// Guards
import { AdministratorGuard } from 'src/guards/administrator.guard';
import { AuthenticateGuard } from 'src/guards/authenticate.guard';

@UseGuards(AuthenticateGuard, AdministratorGuard)
@Controller('/api/state')
export class StateController {
    constructor(
        private readonly stateGateway: StateGateway,
        private readonly starsRepository: StarsRepository,
    ) { }

    @Post('/idle')
    setToIdle() { 
        return this.stateGateway.setStage('IDLE', undefined);
    }

    @Post('/performing/:id')
    async setToPerforming(
        @Param('id', ParseIntPipe) starId: number
    ) {
        const star = await this.starsRepository.fetchById(starId);

        return this.stateGateway.setStage('PERFORMING', { star });
    }

    @Post('/voting/:id')
    async setToVoting(
        @Param('id', ParseIntPipe) starId: number
    ) {
        const star = await this.starsRepository.fetchById(starId);

        return this.stateGateway.setStage('VOTING', { star });
    }

    @Post('/results')
    setToResults() {
        return this.stateGateway.setStage('RESULTS', { countDuration: 8000 })
    }
}