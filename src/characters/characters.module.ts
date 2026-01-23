import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CharacterBanned } from './character_banned.entity';
import { CharactersController } from './characters.controller';
import { Characters } from './characters.entity';
import { CharactersService } from './characters.service';
import { LogArenaFights } from './log_arena_fights.entity';
import { LogArenaMemberstats } from './log_arena_memberstats.entity';
import { RecoveryItem } from './recovery_item.entity';
import { Worldstates } from './worldstates.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        Characters,
        RecoveryItem,
        CharacterBanned,
        Worldstates,
        LogArenaFights,
        LogArenaMemberstats,
      ],
      'charactersConnection',
    ),
  ],
  controllers: [CharactersController],
  providers: [CharactersService],
})
export class CharactersModule {}
