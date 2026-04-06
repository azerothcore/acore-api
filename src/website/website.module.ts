import { Module } from '@nestjs/common';
import { WebsiteController } from './website.controller';
import { WebsiteService } from './website.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post], 'websiteConnection')],
  controllers: [WebsiteController],
  providers: [WebsiteService],
})
export class WebsiteModule {}
