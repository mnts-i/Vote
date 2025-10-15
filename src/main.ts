import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

// Modules
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { cors: true });

	app.useGlobalPipes(new ValidationPipe({
		always: true,
		transform: true,
	}));

	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
