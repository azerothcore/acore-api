import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CharacterAchievement } from './character_achievement.entity';
import { CharacterAchievementProgress } from './character_achievement_progress.entity';
import { CharacterBanned } from './character_banned.entity';
import { CharactersController } from './characters.controller';
import { Characters } from './characters.entity';
import { CharactersService } from './characters.service';
import { LogArenaFights } from './log_arena_fights.entity';
import { LogArenaMemberstats } from './log_arena_memberstats.entity';
import { RecoveryItem } from './recovery_item.entity';
import { DbcService } from '../storage/dbc.service';
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
        CharacterAchievement,
        CharacterAchievementProgress,
      ],
      'charactersConnection',
    ),
  ],
  controllers: [CharactersController],
  providers: [CharactersService, DbcService],
})
export class CharactersModule {}
