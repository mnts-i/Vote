import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';

// Websocket Gateways
import { StateGateway } from './gateways/state.gateway';

// Guards
import { AuthenticateGuard } from './guards/authenticate.guard';
import { AdministratorGuard } from './guards/administrator.guard';

// Pipes
import { ImageMimeValidationPipe } from './pipes/image-mime-validation.pipe';

// Entities
import { Star } from './entities/star.entity';
import { User } from './entities/user.entity';
import { Vote } from './entities/vote.entity';

// Controllers
import { StarsController } from './controllers/stars.controller';
import { UsersController } from './controllers/users.controller';
import { StateController } from './controllers/state.controller';
import { TokensController } from './controllers/tokens.controller';

// Repositories
import { UsersRepository } from './repos/users.repository';
import { StarsRepository } from './repos/stars.repository';

// Services
import { VoteService } from './services/vote.service';
import { ImageService } from './services/image.service';

// State Stages
import { StageIdle } from './state/stage-idle';
import { StageVoting } from './state/stage-voting';
import { StageResults } from './state/stage-results';
import { StagePerforming } from './state/stage-performing';

@Module({
	imports: [
		ScheduleModule.forRoot(),

		ServeStaticModule.forRoot({
			rootPath: join(process.cwd(), 'data', 'images'),
			serveRoot: '/images',
		}, {
			rootPath: join(process.cwd(), 'static'),
		}),

		TypeOrmModule.forRoot({
			type: 'better-sqlite3',
			database: join(process.cwd(), 'data', 'database.sqlite3'),

			entities: [join(process.cwd(), 'dist', '**', '*.entity.{ts,js}')],
			migrations: [join(process.cwd(), 'dist', 'migrations', '*.js')],
			migrationsRun: true,
		}),

		TypeOrmModule.forFeature([Star, User, Vote])
	],
	controllers: [
		StarsController,
		UsersController,
		StateController,
		TokensController,
	],
	providers: [
		StateGateway,

		AuthenticateGuard,
		AdministratorGuard,

		ImageMimeValidationPipe,

		UsersRepository,
		StarsRepository,

		VoteService,
		ImageService,

		StageIdle,
		StageVoting,
		StageResults,
		StagePerforming,
	]
})
export class AppModule { }
