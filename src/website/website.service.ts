import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostRepository } from './post.repository';

@Injectable()
export class WebsiteService
{
    constructor(@InjectRepository(PostRepository, 'websiteConnection') private postRepository: PostRepository) {}
}
