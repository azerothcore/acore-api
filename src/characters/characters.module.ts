import { Module } from '@nestjs/common';
import { CharactersController } from './characters.controller';
import { CharactersService } from './characters.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Characters } from './characters.entity';
import { CharacterBanned } from './character_banned.entity';
import { RecoveryItem } from './recovery_item.entity';
import { AzerothMail } from './azeroth_mail.entity';
import { Worldstates } from './worldstates.entity';
import { ArenaTeam } from './arena_team.entity';

@Module(
{
    imports:
    [
        TypeOrmModule.forFeature(
        [Characters, CharacterBanned, RecoveryItem, AzerothMail, Worldstates, ArenaTeam],
        'charactersConnection')
    ],
    controllers: [CharactersController],
    providers: [CharactersService]
})
export class CharactersModule {}
