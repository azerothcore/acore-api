import { Controller, Get } from '@nestjs/common';
import { Characters } from 'src/characters/characters.entity';
import { getConnection } from 'typeorm';
import { EventscriptEncounters } from './eventscript_encounters.entity';
import { EventscriptScore } from './eventscript_score.entity';

@Controller('eluna')
export class ElunaController {

  @Get('/eventscript_score')
  async eventscript_score() {
    const elunaConnection = getConnection('elunaConnection');

    return await elunaConnection
      .getRepository(EventscriptScore)
      .createQueryBuilder('eventscript_score')
      .select([
        '*'
      ])
      .getRawMany();
  }

  @Get('/eventscript_encounters')
  async eventscript_encounters() {
    const elunaConnection = getConnection('elunaConnection');
    const charactersConnection = getConnection('charactersConnection');

    const scores = await elunaConnection
      .getRepository(EventscriptEncounters)
      .createQueryBuilder('eventscript_encounters')
      .select([
        '*'
      ])
      .getRawMany();

    const guids = [...(new Set (scores.map(s => s.playerGuid)))].join(',');

    const players = await charactersConnection
      .getRepository(Characters)
      .createQueryBuilder('characters')
      .select([
        'guid',
        'account',
        'name',
        'class',
        'race',
        'level',
        'gender'
      ])
      .where("guid IN (" + guids +")")
      .getRawMany();

    const charactersNames = {};
    for (const player of players) {
      charactersNames[player.guid] = { ...player };
    }

    scores.forEach((score, idx) => {
      scores[idx] = { ...charactersNames[score.playerGuid], ...scores[idx] };
      delete scores[idx].playerGuid;
    });

    return scores;
  }


}
