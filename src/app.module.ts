import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Websocket Gateways
import { VoteGateway } from './gateways/vote.gateway';

// Entities
import { Star } from './entities/star.entity';
import { User } from './entities/user.entity';
import { Vote } from './entities/vote.entity';

// Controllers
import { UsersController } from './controllers/users.controller';

// Repositories
import { UsersRepository } from './repos/users.repository';
import { StarsRepository } from './repos/stars.repository';

// Services
import { VoteService } from './services/vote.service';

@Module({
	imports: [
		ScheduleModule.forRoot(),

		TypeOrmModule.forRoot({
			type: 'better-sqlite3',
			database: join(process.cwd(), 'database.sqlite3'),
			entities: [Star, User, Vote],
			synchronize: true,
		}),

		TypeOrmModule.forFeature([Star, User, Vote])
	],
	controllers: [
		UsersController,
	],
	providers: [
		VoteGateway,

		UsersRepository,
		StarsRepository,

		VoteService,
	]
})
export class AppModule { }
