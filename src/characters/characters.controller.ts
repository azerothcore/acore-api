import { Body, Controller, Get, Param, Patch, Post, Req, Res, UseGuards, ValidationPipe } from '@nestjs/common';
import { CharactersService } from './characters.service';

@Controller('characters')
export class CharactersController
{
    constructor(private charactersService: CharactersService) {}
    // TODO
}
