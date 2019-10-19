import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap()
{
    const logger = new Logger('bootstrap');
    const app = await NestFactory.create(AppModule);
    const port = process.env.WEBSITE_PORT || 3000;
    app.enableCors();
    await app.listen(port);
    logger.log(`Application listening on port ${port}`);
}

bootstrap();
