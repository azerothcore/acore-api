import { Module } from '@nestjs/common';
import { CharactersController } from './characters.controller';
import { CharactersService } from './characters.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module(
{
    imports: [TypeOrmModule.forFeature([])],
    controllers: [CharactersController],
    providers: [CharactersService]
})
export class CharactersModule {}
