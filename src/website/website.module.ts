import { Module } from '@nestjs/common';
import { WebsiteController } from './website.controller';
import { WebsiteService } from './website.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostRepository } from './post.repository';

@Module({
  imports: [TypeOrmModule.forFeature([PostRepository], 'websiteConnection')],
  controllers: [WebsiteController],
  providers: [WebsiteService],
})
export class WebsiteModule {}
