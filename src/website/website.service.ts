import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './post.entity';

@Injectable()
export class WebsiteService {
  constructor(
    @InjectRepository(Post, 'websiteConnection')
    private postRepository: Repository<Post>,
  ) {}
}
