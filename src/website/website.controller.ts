import { Controller } from '@nestjs/common';
import { WebsiteService } from './website.service';

@Controller('website')
export class WebsiteController
{
    constructor(private websiteService: WebsiteService) {}
}
