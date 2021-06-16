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
    const charactersConnection = getConnection('charactersConnection');

    const scores = await elunaConnection
      .getRepository(EventscriptScore)
      .createQueryBuilder('eventscript_score')
      .select([
        '*'
      ])
      .getRawMany();


    const accountIds = scores.map(s => s.account_id).join(',');

    const characters = await charactersConnection
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
    .where("account IN (" + accountIds +")")
    .groupBy('account')
    .getRawMany();

    const charactersData = {};
    for (const character of characters) {
      charactersData[character.account] = { ...character };
    }

    scores.forEach((score, idx) => {
      scores[idx] = {
        ...charactersData[scores[idx].account_id],
        score_earned_current: scores[idx].score_earned_current,
        score_earned_total: scores[idx].score_earned_total,
       };
      delete scores[idx].account;
    });

    return scores;
  }

  @Get('/eventscript_encounters')
  async eventscript_encounters() {
    const elunaConnection = getConnection('elunaConnection');
    const charactersConnection = getConnection('charactersConnection');

    const encounters = await elunaConnection
      .getRepository(EventscriptEncounters)
      .createQueryBuilder('eventscript_encounters')
      .select([
        '*'
      ])
      .getRawMany();

    const guids = [...(new Set (encounters.map(s => s.playerGuid)))].join(',');

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

    encounters.forEach((score, idx) => {
      encounters[idx] = { ...charactersNames[score.playerGuid], ...encounters[idx] };
      delete encounters[idx].playerGuid;
    });

    return encounters;
  }


}
