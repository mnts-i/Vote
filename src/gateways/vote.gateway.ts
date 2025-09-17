import dayjs from 'dayjs';
import prettyTime from 'pretty-time';
import { Cron } from '@nestjs/schedule';
import { Server } from 'socket.io';
import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { MessageBody, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

// DTOs
import { VoteDto } from 'src/dto/vote.dto';

// Services
import { VoteService } from 'src/services/vote.service';

@WebSocketGateway(48455, { namespace: 'vote' })
export class VoteGateway implements OnGatewayInit {
    private readonly logger = new Logger(VoteGateway.name);

    @WebSocketServer()
    server: Server;

    constructor(
        private voteService: VoteService,
    ) { }

    afterInit(server: Server) {
        this.server = server;
    }

    @SubscribeMessage('vote')
    async onVote(@MessageBody() data: VoteDto) {
        const id = data.id;

        try {
            const vote = await this.voteService.vote(data);

            return { id, vote, success: true };
        } catch (err) {

            // In case the error is not a BadRequest and NotFound exception then display an error in the console
            if (!(err instanceof BadRequestException) && !(err instanceof NotFoundException)) {
                this.logger.error('Σφάλμα κατά την ψηφοφορία');
                this.logger.error(err);
            }

            return { id, error: err.message || 'Προέκυψε κάποιο σφάλμα' };
        }
    }

    @Cron('*/3 * * * * *')
    async broadcastResults() {
        if (!this.server) {
            return;
        }

        const startTime = process.hrtime();

        this.server.emit('rankings', await this.voteService.getRankings());

        const benchmark = process.hrtime(startTime);

        this.logger.log(`${dayjs().format('YYYY-MM-DD HH:mm:ss')}: Brodcasted votes ( ${prettyTime(benchmark)} )`);
    }
}