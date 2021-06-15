import { Module } from '@nestjs/common';
import { ElunaController } from './eluna.controller';
import { ElunaService } from './eluna.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventscriptEncounters } from './eventscript_encounters.entity';
import { EventscriptScore } from './eventscript_score.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [EventscriptEncounters, EventscriptScore],
      'elunaConnection',
    ),
  ],
  controllers: [ElunaController],
  providers: [ElunaService],
})
export class ElunaModule {}
