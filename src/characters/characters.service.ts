import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { InjectRepository } from '@nestjs/typeorm';
import {
  AchievementCategory,
  AchievementWithQuantity,
} from 'src/storage/dbc.interface';
import { Like, Repository } from 'typeorm';
import { Misc } from '../shared/misc';
import { Soap } from '../shared/soap';
import { DbcService } from '../storage/dbc.service';
import { CharacterAchievement } from './character_achievement.entity';
import { CharacterAchievementProgress } from './character_achievement_progress.entity';
import { CharacterBanned } from './character_banned.entity';
import { Characters } from './characters.entity';
import { CharactersDto } from './dto/characters.dto';
import {
  AchievementProgressEntry,
  CharacterAchievementSummary,
  CharacterDetail,
  PlayerMonthlyGames,
  StatusResponse,
} from './dto/characters.interface';
import { LogArenaFightResponse } from './dto/log_arena_fight.interface';
import { LogArenaFightsStatsResponse } from './dto/log_arena_fight_stats.interface';
import { LogArenaFightsQueryDto } from './dto/log_arena_fights.dto';
import { RecoveryItemDTO } from './dto/recovery_item.dto';
import { LogArenaFights } from './log_arena_fights.entity';
import { LogArenaMemberstats } from './log_arena_memberstats.entity';
import { RecoveryItem } from './recovery_item.entity';
import { Worldstates } from './worldstates.entity';

@Injectable()
export class CharactersService implements OnModuleInit {
  private readonly logger = new Logger(CharactersService.name);
  private achievementsSummaryCache: CharacterAchievementSummary[] = [];

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
    @InjectRepository(LogArenaMemberstats, 'charactersConnection')
    private readonly logArenaMemberstatsRepository: Repository<LogArenaMemberstats>,
    @InjectRepository(CharacterAchievement, 'charactersConnection')
    private readonly characterAchievementRepository: Repository<CharacterAchievement>,
    @InjectRepository(CharacterAchievementProgress, 'charactersConnection')
    private readonly characterAchievementProgressRepository: Repository<CharacterAchievementProgress>,
    private readonly dbcService: DbcService,
  ) {}

  async onModuleInit() {
    await this.refreshAchievementsSummary();
  }

  @Cron(CronExpression.EVERY_HOUR)
  async refreshAchievementsSummary() {
    const startTime = Date.now();

    const rows = await this.characterAchievementRepository
      .createQueryBuilder('cha')
      .leftJoin('characters', 'ch', 'cha.guid = ch.guid')
      .select([
        'cha.guid as guid',
        'ch.account as account',
        'ch.name as name',
        'ch.level as level',
        'ch.race as race',
        'ch.class as class',
        'ch.gender as gender',
        'GROUP_CONCAT(cha.achievement) as achievementIds',
      ])
      .groupBy('cha.guid')
      .getRawMany();

    const allAchievementIds = new Set<number>();
    for (const row of rows) {
      if (row.achievementIds) {
        for (const id of row.achievementIds.split(',')) {
          allAchievementIds.add(+id);
        }
      }
    }

    const achievementIdArray = Array.from(allAchievementIds);
    const alliancePointsMap = this.dbcService.getAchievementPoints(
      achievementIdArray,
      1,
    );
    const hordePointsMap = this.dbcService.getAchievementPoints(
      achievementIdArray,
      0,
    );

    const ALLIANCE_RACES = new Set([1, 3, 4, 7, 11]);

    this.achievementsSummaryCache = rows
      .map((row) => {
        const ids = row.achievementIds
          ? row.achievementIds.split(',').map(Number)
          : [];
        const pointsMap = ALLIANCE_RACES.has(row.race)
          ? alliancePointsMap
          : hordePointsMap;
        const points = ids.reduce(
          (sum: number, id: number) => sum + (pointsMap.get(id) || 0),
          0,
        );

        return {
          guid: row.guid,
          achievement_points: points,
          account: row.account,
          name: row.name,
          level: row.level,
          race: row.race,
          class: row.class,
          gender: row.gender,
        };
      })
      .sort((a, b) => b.achievement_points - a.achievement_points);

    this.logger.log(
      `Achievements summary refreshed in ${Date.now() - startTime}ms`,
    );
  }

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

  async recoveryItem(
    recoveryItemDto: RecoveryItemDTO,
    accountId: number,
  ): Promise<StatusResponse> {
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

  async recoveryHero(
    charactersDto: CharactersDto,
    accountId: number,
  ): Promise<StatusResponse> {
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

  async unban(
    charactersDto: CharactersDto,
    accountId: number,
  ): Promise<StatusResponse> {
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

  async rename(
    charactersDto: CharactersDto,
    accountId: number,
  ): Promise<StatusResponse> {
    return this.characterCommand(charactersDto, accountId, 'rename', 5);
  }

  async customize(
    charactersDto: CharactersDto,
    accountId: number,
  ): Promise<StatusResponse> {
    return this.characterCommand(charactersDto, accountId, 'customize', 5);
  }

  async changeFaction(
    charactersDto: CharactersDto,
    accountId: number,
  ): Promise<StatusResponse> {
    return this.characterCommand(charactersDto, accountId, 'changeFaction', 10);
  }

  async changeRace(
    charactersDto: CharactersDto,
    accountId: number,
  ): Promise<StatusResponse> {
    return this.characterCommand(charactersDto, accountId, 'changeRace', 10);
  }

  async boost(
    charactersDto: CharactersDto,
    accountId: number,
  ): Promise<StatusResponse> {
    return this.characterCommand(charactersDto, accountId, 'level', 5, 80);
  }

  async unstuck(
    charactersDto: CharactersDto,
    accountId: number,
  ): Promise<StatusResponse> {
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
  ): Promise<StatusResponse> {
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

  async getLogArenaFights(
    query: LogArenaFightsQueryDto,
  ): Promise<LogArenaFightResponse[]> {
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
        'CASE WHEN laf.type IN (1, 4) THEN "" ELSE COALESCE(winner_team.name, "") END as winner_name',
        'CASE WHEN laf.type IN (1, 4) THEN "" ELSE COALESCE(loser_team.name, "") END as loser_name',
        'JSON_ARRAYAGG(CASE WHEN lam.team = laf.winner THEN JSON_OBJECT("name", c.name, "race", c.race, "class", c.class, "gender", c.gender, "level", c.level) END) as winner_members',
        'JSON_ARRAYAGG(CASE WHEN lam.team = laf.loser THEN JSON_OBJECT("name", c.name, "race", c.race, "class", c.class, "gender", c.gender, "level", c.level) END) as loser_members',
      ])
      .groupBy('laf.fight_id')
      .addGroupBy('laf.type')
      .addGroupBy('laf.winner')
      .addGroupBy('laf.time')
      .addGroupBy('laf.loser')
      .orderBy('laf.time', 'DESC')
      .limit((query.limit > 500 ? 500 : query.limit) || 20);

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

    const logArenaFightsResponse = (await queryBuilder.getRawMany()).map(
      (fight: LogArenaFightResponse) => {
        fight.winner_members = fight.winner_members.filter(
          (member) => member !== null,
        );

        fight.loser_members = fight.loser_members.filter(
          (member) => member !== null,
        );

        return fight;
      },
    );

    return logArenaFightsResponse;
  }

  async getLogArenaFightStats(
    fight_id: number,
  ): Promise<LogArenaFightsStatsResponse> {
    const fight = await this.logArenaFightsRepository
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
      .leftJoin(
        'characters',
        'winner_captain',
        'winner_captain.guid = winner_team.captainGuid',
      )
      .leftJoin(
        'characters',
        'loser_captain',
        'loser_captain.guid = loser_team.captainGuid',
      )
      .select([
        'laf.fight_id as fight_id',
        'laf.time as time',
        'laf.type as type',
        'laf.duration as duration',
        'laf.winner as winner',
        'laf.winner_tr as winner_tr',
        'laf.winner_mmr as winner_mmr',
        'laf.winner_tr_change as winner_tr_change',
        'laf.loser as loser',
        'laf.loser_tr as loser_tr',
        'laf.loser_mmr as loser_mmr',
        'laf.loser_tr_change as loser_tr_change',
        'winner_team.name as winner_team_name',
        'winner_captain.race as winner_captain_race',
        'loser_team.name as loser_team_name',
        'loser_captain.race as loser_captain_race',
      ])
      .where('laf.fight_id = :fight_id', { fight_id })
      .getRawOne();

    if (!fight) {
      throw new NotFoundException('Arena fight not found');
    }

    const memberStats = await this.logArenaMemberstatsRepository
      .createQueryBuilder('lam')
      .leftJoin('characters', 'c', 'c.guid = lam.guid')
      .select([
        'lam.fight_id as fight_id',
        'lam.member_id as member_id',
        'lam.name as name',
        'lam.guid as guid',
        'lam.team as team',
        'lam.account as account',
        'lam.damage as damage',
        'lam.heal as heal',
        'lam.kblows as kblows',
        'c.race as race',
        'c.gender as gender',
        'c.class as class',
        'c.level as level',
      ])
      .where('lam.fight_id = :fight_id', { fight_id })
      .orderBy('lam.member_id', 'ASC')
      .getRawMany();

    const nextFight = await this.logArenaFightsRepository
      .createQueryBuilder('laf')
      .select('laf.fight_id')
      .where('laf.fight_id > :fight_id', { fight_id })
      .orderBy('laf.fight_id', 'ASC')
      .limit(1)
      .getRawOne();

    const previousFight = await this.logArenaFightsRepository
      .createQueryBuilder('laf')
      .select('laf.fight_id')
      .where('laf.fight_id < :fight_id', { fight_id })
      .orderBy('laf.fight_id', 'DESC')
      .limit(1)
      .getRawOne();

    return {
      fight,
      memberStats,
      fight_id_next: nextFight?.laf_fight_id || null,
      fight_id_previous: previousFight?.laf_fight_id || null,
    };
  }

  getCharacterAchievements(
    page: number,
    limit: number,
  ): {
    data: CharacterAchievementSummary[];
    total: number;
    page: number;
    limit: number;
  } {
    const total = this.achievementsSummaryCache.length;
    const start = (page - 1) * limit;
    const data = this.achievementsSummaryCache.slice(start, start + limit);
    return { data, total, page, limit };
  }

  async getCharacterAchievementByGuid(
    guid: number,
    category?: number,
  ): Promise<CharacterAchievement[]> {
    if (category !== undefined) {
      // Get achievements in this category from DBC
      const categoryAchievements = this.dbcService.getAchievementsByCategory(
        category,
      );
      const categoryAchievementIds = new Set(
        categoryAchievements.map((a) => a.ID),
      );

      // Get character's achievements and filter by category
      const characterAchievements = await this.characterAchievementRepository.find(
        { where: { guid } },
      );

      return characterAchievements.filter((ca) =>
        categoryAchievementIds.has(ca.achievement),
      );
    }

    return this.characterAchievementRepository.find({ where: { guid } });
  }

  async getAchievementProgress(
    guid?: number,
    category?: number,
  ): Promise<{ error: string } | AchievementProgressEntry[]> {
    if (!guid) {
      return { error: 'please insert at least one parameter' };
    }

    const progressRows = await this.characterAchievementProgressRepository.find(
      { where: { guid } },
    );

    const criteriaIds = progressRows.map((p) => p.criteria);
    const criteriaMap = this.dbcService.getCriteriaByIds(criteriaIds);

    // Map criteria -> achievement, optionally filter by category
    const achievementIds = new Set<number>();
    for (const criteria of criteriaMap.values()) {
      achievementIds.add(criteria.Achievement);
    }

    const achievements =
      category !== undefined
        ? this.dbcService.getAchievementsByIds(
            Array.from(achievementIds),
            category,
          )
        : this.dbcService.getAchievementsByIds(Array.from(achievementIds));
    const achievementMap = new Map(achievements.map((a) => [a.ID, a]));

    return progressRows
      .filter((p) => {
        const criteria = criteriaMap.get(p.criteria);
        return criteria && achievementMap.has(criteria.Achievement);
      })
      .map((p) => {
        const criteria = criteriaMap.get(p.criteria);
        return {
          achievement: criteria?.Achievement,
          counter: p.counter,
        };
      });
  }

  getAchievementCategories(): AchievementCategory[] {
    return this.dbcService.getAllCategories();
  }

  getAchievementCategory(id: number): AchievementCategory | undefined {
    return this.dbcService.getCategoryById(id);
  }

  getAchievementsByCategory(
    category: number,
    faction?: string,
  ): AchievementWithQuantity[] {
    return this.dbcService.getAchievementsByCategoryWithQuantity(
      category,
      faction,
    );
  }

  async getCharacterById(guid: number): Promise<CharacterDetail> {
    const character = await this.charactersRepository
      .createQueryBuilder('characters')
      .leftJoin('guild_member', 'gm', 'gm.guid = characters.guid')
      .leftJoin('guild', 'g', 'g.guildid = gm.guildid')
      .select([
        'characters.guid as guid',
        'characters.name as name',
        'characters.race as race',
        'characters.class as class',
        'characters.level as level',
        'characters.gender as gender',
        'g.name as guildName',
      ])
      .where('characters.guid = :guid', { guid })
      .getRawOne();

    if (!character) {
      throw new NotFoundException('Character not found');
    }

    return character;
  }

  async getPlayersMonthlyGames(
    excludeType?: number | number[],
    month?: number,
    year?: number,
  ): Promise<PlayerMonthlyGames[]> {
    const currentDate = new Date();
    const currentYear = year ?? currentDate.getFullYear();
    const currentMonth = month ?? currentDate.getMonth() + 1;

    // Normalize excludeType to always be an array
    const excludeTypes =
      excludeType !== undefined
        ? Array.isArray(excludeType)
          ? excludeType
          : [excludeType]
        : undefined;

    // Get top 100 players with most won games
    const topPlayersQuery = this.logArenaMemberstatsRepository
      .createQueryBuilder('lam')
      .leftJoin('log_arena_fights', 'laf', 'laf.fight_id = lam.fight_id')
      .leftJoin('characters', 'c', 'c.guid = lam.guid')
      .select([
        'lam.guid as guid',
        'c.name as name',
        'c.level as level',
        'c.race as race',
        'c.gender as gender',
        'c.class as class',
        'COUNT(DISTINCT CASE WHEN lam.team = laf.winner THEN lam.fight_id END) as totalGames',
      ])
      .where('YEAR(laf.time) = :year', { year: currentYear })
      .andWhere('MONTH(laf.time) = :month', { month: currentMonth })
      .groupBy('lam.guid')
      .addGroupBy('c.name')
      .addGroupBy('c.level')
      .addGroupBy('c.race')
      .addGroupBy('c.gender')
      .addGroupBy('c.class')
      .orderBy('totalGames', 'DESC')
      .limit(100);

    if (excludeTypes !== undefined) {
      topPlayersQuery.andWhere('laf.type NOT IN (:...excludeTypes)', {
        excludeTypes,
      });
    }

    const topPlayers = await topPlayersQuery.getRawMany();

    if (topPlayers.length === 0) {
      return [];
    }

    // Get games by type for all top players
    const playerGuids = topPlayers.map((p) => p.guid);
    const gamesByTypeQuery = this.logArenaMemberstatsRepository
      .createQueryBuilder('lam')
      .leftJoin('log_arena_fights', 'laf', 'laf.fight_id = lam.fight_id')
      .select([
        'lam.guid as guid',
        'laf.type as type',
        'COUNT(DISTINCT lam.fight_id) as gameCount',
      ])
      .where('lam.guid IN (:...playerGuids)', { playerGuids })
      .andWhere('lam.team = laf.winner')
      .andWhere('YEAR(laf.time) = :year', { year: currentYear })
      .andWhere('MONTH(laf.time) = :month', { month: currentMonth })
      .groupBy('lam.guid')
      .addGroupBy('laf.type');

    if (excludeTypes !== undefined) {
      gamesByTypeQuery.andWhere('laf.type NOT IN (:...excludeTypes)', {
        excludeTypes,
      });
    }

    const gamesByTypeResults = await gamesByTypeQuery.getRawMany();

    // Map games by type to each player
    const gamesByTypeMap = new Map<number, { type: number; game: number }[]>();

    gamesByTypeResults.forEach((result) => {
      if (!gamesByTypeMap.has(result.guid)) {
        gamesByTypeMap.set(result.guid, []);
      }
      gamesByTypeMap.get(result.guid).push({
        type: result.type,
        game: parseInt(result.gameCount, 10),
      });
    });

    // Combine the data
    return topPlayers.map((player) => ({
      character: {
        guid: player.guid,
        name: player.name,
        level: player.level,
        race: player.race,
        gender: player.gender,
        class: player.class,
      },
      totalGames: parseInt(player.totalGames, 10),
      gamesByType: gamesByTypeMap.get(player.guid) || [],
    }));
  }
}
