import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Misc } from '../shared/misc';
import { Soap } from '../shared/soap';
import { CharacterBanned } from './character_banned.entity';
import { Characters } from './characters.entity';
import { CharactersDto } from './dto/characters.dto';
import { LogArenaFightsQueryDto } from './dto/log_arena_fights.dto';
import { RecoveryItemDTO } from './dto/recovery_item.dto';
import { LogArenaFights } from './log_arena_fights.entity';
import { RecoveryItem } from './recovery_item.entity';
import { Worldstates } from './worldstates.entity';

@Injectable()
export class CharactersService {
  constructor(
    @InjectRepository(Characters, 'charactersConnection')
    private readonly charactersRepository: Repository<Characters>,
    @InjectRepository(RecoveryItem, 'charactersConnection')
    private readonly recoveryItemRepository: Repository<RecoveryItem>,
    @InjectRepository(CharacterBanned, 'charactersConnection')
    private readonly characterBannedRepository: Repository<CharacterBanned>,
    @InjectRepository(Worldstates, 'charactersConnection')
    private readonly worldstatesRepository: Repository<Worldstates>,
    @InjectRepository(LogArenaFights, 'charactersConnection')
    private readonly logArenaFightsRepository: Repository<LogArenaFights>,
  ) {}

  async search_worldstates(param: Worldstates): Promise<Worldstates[]> {
    return await this.worldstatesRepository.find({
      comment: Like(`%${param.comment}%`),
    });
  }

  async recoveryItemList(
    guid: number,
    accountId: number,
  ): Promise<RecoveryItem[]> {
    const characters = await this.charactersRepository.findOne({
      select: ['guid'],
      where: { account: accountId },
    });

    if (characters?.guid !== +guid) {
      throw new NotFoundException(['Account with that character not found']);
    }

    return await this.recoveryItemRepository.find({ where: { Guid: guid } });
  }

  async recoveryItem(recoveryItemDto: RecoveryItemDTO, accountId: number) {
    const characters = await this.charactersRepository.findOne({
      select: ['guid', 'name'],
      where: { account: accountId },
    });
    const recoveryItem = await this.recoveryItemRepository.findOne({
      select: ['Count'],
      where: { Id: recoveryItemDto.id },
    });

    if (characters?.guid !== recoveryItemDto.guid) {
      throw new NotFoundException(['Account with that character not found']);
    }

    if (!recoveryItem) {
      throw new NotFoundException(['Item Not Found']);
    }

    await this.recoveryItemRepository.delete({ Id: recoveryItemDto.id });

    Soap.command(
      `send items ${characters.name} "Recovery Item" "AzerothJS Recovery Item" ${recoveryItemDto.itemEntry}:${recoveryItem.Count}`,
    );

    return { status: 'success' };
  }

  async recoveryHeroList(accountId: number): Promise<Characters[]> {
    return await this.charactersRepository.find({
      select: ['guid', 'class', 'totaltime', 'totalKills', 'deleteInfos_Name'],
      where: { deleteInfos_Account: accountId },
    });
  }

  async recoveryHero(charactersDto: CharactersDto, accountId: number) {
    const characters = await this.charactersRepository.findOne({
      select: ['guid', 'deleteInfos_Name'],
      where: { deleteInfos_Account: accountId },
    });

    if (characters?.guid !== +charactersDto.guid) {
      throw new NotFoundException(['Account with that character not found']);
    }

    await Misc.setCoin(10, accountId);

    Soap.command(
      `character deleted restore ${charactersDto.guid} ${characters.deleteInfos_Name} ${accountId}`,
    );

    return { status: 'success' };
  }

  async unban(charactersDto: CharactersDto, accountId: number) {
    const characters = await this.charactersRepository.findOne({
      select: ['guid', 'name'],
      where: { account: accountId },
    });

    if (characters?.guid !== +charactersDto.guid) {
      throw new NotFoundException('Account with that character not found');
    }

    const characterBanned = await this.characterBannedRepository.findOne({
      where: { guid: charactersDto.guid, active: 1 },
    });

    if (!characterBanned) {
      throw new BadRequestException('Your character is not ban!');
    }

    await Misc.setCoin(5, accountId);

    Soap.command(`unban character ${characters.name}`);

    return { status: 'success' };
  }

  async rename(charactersDto: CharactersDto, accountId: number) {
    return this.characterCommand(charactersDto, accountId, 'rename', 5);
  }

  async customize(charactersDto: CharactersDto, accountId: number) {
    return this.characterCommand(charactersDto, accountId, 'customize', 5);
  }

  async changeFaction(charactersDto: CharactersDto, accountId: number) {
    return this.characterCommand(charactersDto, accountId, 'changeFaction', 10);
  }

  async changeRace(charactersDto: CharactersDto, accountId: number) {
    return this.characterCommand(charactersDto, accountId, 'changeRace', 10);
  }

  async boost(charactersDto: CharactersDto, accountId: number) {
    return this.characterCommand(charactersDto, accountId, 'level', 5, 80);
  }

  async unstuck(charactersDto: CharactersDto, accountId: number) {
    const characters = await this.charactersRepository.findOne({
      select: ['guid', 'name'],
      where: { account: accountId },
    });

    if (characters?.guid !== charactersDto.guid) {
      throw new NotFoundException(['Account with that character not found']);
    }

    Soap.command(`unstuck ${characters.name} graveyard`);
    Soap.command(`revive ${characters.name}`);

    return { status: 'success' };
  }

  private async characterCommand(
    charactersDto: CharactersDto,
    accountId: number,
    command: string,
    coin: number,
    option?: number,
  ) {
    const characters = await this.charactersRepository.findOne({
      select: ['guid', 'name'],
      where: { account: accountId },
    });

    if (characters?.guid !== +charactersDto.guid) {
      throw new NotFoundException(['Account with that character not found']);
    }

    await Misc.setCoin(coin, accountId);

    Soap.command(`character ${command} ${characters.name} ${option}`);

    return { status: 'success' };
  }

  async getLogArenaFights(query: LogArenaFightsQueryDto): Promise<any[]> {
    const queryBuilder = this.logArenaFightsRepository
      .createQueryBuilder('laf')
      .leftJoin(
        'arena_team',
        'winner_team',
        'winner_team.arenaTeamId = laf.winner',
      )
      .leftJoin(
        'arena_team',
        'loser_team',
        'loser_team.arenaTeamId = laf.loser',
      )
      .leftJoin('log_arena_memberstats', 'lam', 'lam.fight_id = laf.fight_id')
      .leftJoin('characters', 'c', 'c.guid = lam.guid')
      .select([
        'laf.fight_id as fight_id',
        'laf.type as type',
        'laf.winner as winner',
        'laf.time as time',
        'laf.loser as loser',
        'laf.duration as duration',
        'laf.winner_tr as winner_tr',
        'laf.winner_mmr as winner_mmr',
        'laf.winner_tr_change as winner_tr_change',
        'laf.loser_tr as loser_tr',
        'laf.loser_mmr as loser_mmr',
        'laf.loser_tr_change as loser_tr_change',
        'laf.currOnline as currOnline',
        'CASE WHEN laf.type IN (3, 4) THEN "" ELSE COALESCE(winner_team.name, "") END as winner_name',
        'CASE WHEN laf.type IN (3, 4) THEN "" ELSE COALESCE(loser_team.name, "") END as loser_name',
        'JSON_ARRAYAGG(CASE WHEN lam.team = laf.winner THEN JSON_OBJECT("name", c.name, "race", c.race, "class", c.class, "gender", c.gender) END) as winner_members',
        'JSON_ARRAYAGG(CASE WHEN lam.team = laf.loser THEN JSON_OBJECT("name", c.name, "race", c.race, "class", c.class, "gender", c.gender) END) as loser_members',
      ])
      .groupBy('laf.fight_id')
      .addGroupBy('laf.type')
      .addGroupBy('laf.winner')
      .addGroupBy('laf.time')
      .addGroupBy('laf.loser')
      .orderBy('laf.time', 'DESC')
      .limit(query.limit || 20);

    if (query.type) {
      queryBuilder.andWhere('laf.type = :type', {
        type: query.type,
      });
    }

    if (query.year) {
      queryBuilder.andWhere('YEAR(laf.time) = :year', {
        year: query.year,
      });
    }

    if (query.month) {
      queryBuilder.andWhere('MONTH(laf.time) = :month', {
        month: query.month,
      });
    }

    if (query.minLevel) {
      queryBuilder.andWhere('c.level >= :minLevel', {
        minLevel: query.minLevel,
      });
    }

    if (query.maxLevel) {
      queryBuilder.andWhere('c.level <= :maxLevel', {
        maxLevel: query.maxLevel,
      });
    }

    return await queryBuilder.getRawMany();
  }
}
