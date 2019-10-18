import { Body, Controller, Get, Param, Patch, Post, Req, Res, UseGuards, ValidationPipe } from '@nestjs/common';
import { WorldService } from './world.service';

@Controller('world')
export class WorldController
{
    constructor(private worldService: WorldService) {}
    // TODO
}
