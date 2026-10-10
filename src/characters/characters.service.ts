import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Repository } from 'typeorm';
import { AccountInformation } from '../auth/account_information.entity';
import { Misc } from '../shared/misc';
import { Soap } from '../shared/soap';
import {
  AchievementCategory,
  AchievementWithQuantity,
} from '../storage/dbc.interface';
import { DbcService } from '../storage/dbc.service';
import { CharacterAchievement } from './character_achievement.entity';
import { CharacterAchievementProgress } from './character_achievement_progress.entity';
import { CharacterBanned } from './character_banned.entity';
import { Characters } from './characters.entity';
import {
  ChallengeModesLeaderboardQueryDto,
  ChallengeModeSort,
  ChallengeModeSortDirection,
  ChallengeModeStatus,
} from './dto/challenge_modes.dto';
import {
  ChallengeModeCharacter,
  ChallengeModeStats,
} from './dto/challenge_modes.interface';
import { CharactersDto } from './dto/characters.dto';
import {
  AchievementProgressEntry,
  CharacterAchievementSummary,
  CharacterDetail,
  Paginated,
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
    @InjectDataSource('authConnection')
    private readonly authDataSource: DataSource,
    @InjectDataSource('charactersConnection')
    private readonly charactersDataSource: DataSource,
    private readonly dbcService: DbcService,
  ) {}

  // The challenge-modes module (r-o-b-o-t-o/challenge-modes) stores its tables in a
  // separate Eluna schema on the same server as the characters DB, so they are
  // reachable from the characters connection only when fully qualified.
  private challengeModesTable(): string {
    const database = process.env.ELUNA_DATABASE_NAME || 'acore_eluna';

    if (!/^[A-Za-z0-9_$]+$/.test(database)) {
      throw new Error(`Invalid ELUNA_DATABASE_NAME: ${database}`);
    }

    return `\`${database}\`.challenge_modes_character`;
  }

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
        'cha.achievement as achievement',
        'ch.account as account',
        'ch.name as name',
        'ch.level as level',
        'ch.race as race',
        'ch.class as class',
        'ch.gender as gender',
      ])
      .getRawMany();

    const allAchievementIds = new Set<number>();
    for (const row of rows) {
      allAchievementIds.add(row.achievement);
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

    const charMap = new Map<
      number,
      { info: (typeof rows)[0]; points: number }
    >();

    for (const row of rows) {
      const entry = charMap.get(row.guid);
      const pointsMap = ALLIANCE_RACES.has(row.race)
        ? alliancePointsMap
        : hordePointsMap;
      const pts = pointsMap.get(row.achievement) || 0;

      if (entry) {
        entry.points += pts;
      } else {
        charMap.set(row.guid, { info: row, points: pts });
      }
    }

    this.achievementsSummaryCache = Array.from(charMap.values())
      .map(({ info, points }) => ({
        guid: info.guid,
        achievement_points: points,
        account: info.account,
        name: info.name,
        level: info.level,
        race: info.race,
        class: info.class,
        gender: info.gender,
      }))
      .sort((a, b) => b.achievement_points - a.achievement_points);

    this.logger.log(
      `Achievements summary refreshed in ${Date.now() - startTime}ms`,
    );
  }

  async search_worldstates(param: Worldstates): Promise<Worldstates[]> {
    return await this.worldstatesRepository.find({
      where: { comment: Like(`%${param.comment}%`) },
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
    const character = await this.charactersRepository.findOne({
      select: ['guid', 'name'],
      where: { account: accountId, guid: recoveryItemDto.guid },
    });

    if (!character) {
      throw new NotFoundException(['Account with that character not found']);
    }

    const recoveryItem = await this.recoveryItemRepository.findOne({
      select: ['Id', 'ItemEntry', 'Count'],
      where: { Id: recoveryItemDto.id, Guid: character.guid },
    });

    if (!recoveryItem) {
      throw new NotFoundException(['Item Not Found']);
    }

    const { affected } = await this.recoveryItemRepository.delete({
      Id: recoveryItem.Id,
      Guid: character.guid,
    });

    if (!affected) {
      throw new NotFoundException(['Item Not Found']);
    }

    Soap.command(
      `send items ${character.name} "Recovery Item" "AzerothJS Recovery Item" ${recoveryItem.ItemEntry}:${recoveryItem.Count}`,
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

    await Misc.setCoin(
      10,
      accountId,
      this.authDataSource.getRepository(AccountInformation),
    );

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

    await Misc.setCoin(
      5,
      accountId,
      this.authDataSource.getRepository(AccountInformation),
    );

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

    await Misc.setCoin(
      coin,
      accountId,
      this.authDataSource.getRepository(AccountInformation),
    );

    Soap.command(`character ${command} ${characters.name} ${option}`);

    return { status: 'success' };
  }

  async getLogArenaFights(
    query: LogArenaFightsQueryDto,
  ): Promise<Paginated<LogArenaFightResponse>> {
    const limit = Math.min(query.limit ?? 20, 500);
    const page = query.page ?? 1;

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
        'CASE WHEN laf.type IN (1, 4) THEN "" ELSE COALESCE(winner_team.name, "") END as winner_name',
        'CASE WHEN laf.type IN (1, 4) THEN "" ELSE COALESCE(loser_team.name, "") END as loser_name',
        'JSON_ARRAYAGG(CASE WHEN lam.team = laf.winner THEN JSON_OBJECT("guid", lam.guid, "name", c.name, "race", c.race, "class", c.class, "gender", c.gender, "level", c.level, "damage", lam.damage, "heal", lam.heal, "kblows", lam.kblows) END) as winner_members',
        'JSON_ARRAYAGG(CASE WHEN lam.team = laf.loser THEN JSON_OBJECT("guid", lam.guid, "name", c.name, "race", c.race, "class", c.class, "gender", c.gender, "level", c.level, "damage", lam.damage, "heal", lam.heal, "kblows", lam.kblows) END) as loser_members',
      ])
      .groupBy('laf.fight_id')
      .addGroupBy('laf.type')
      .addGroupBy('laf.winner')
      .addGroupBy('laf.time')
      .addGroupBy('laf.loser')
      .orderBy('laf.time', 'DESC')
      .addOrderBy('laf.fight_id', 'DESC')
      .limit(limit)
      .offset((page - 1) * limit);

    const countQuery = this.logArenaFightsRepository.createQueryBuilder('laf');

    if (query.teamId) {
      const teamFilter = '(laf.winner = :teamId OR laf.loser = :teamId)';
      queryBuilder.andWhere(teamFilter, { teamId: query.teamId });
      countQuery.andWhere(teamFilter, { teamId: query.teamId });
    }

    if (query.playerGuid) {
      const playerFilter =
        'EXISTS (SELECT 1 FROM log_arena_memberstats lam_f WHERE lam_f.fight_id = laf.fight_id AND lam_f.guid = :playerGuid)';
      queryBuilder.andWhere(playerFilter, { playerGuid: query.playerGuid });
      countQuery.andWhere(playerFilter, { playerGuid: query.playerGuid });
    }

    if (query.type) {
      queryBuilder.andWhere('laf.type = :type', { type: query.type });
      countQuery.andWhere('laf.type = :type', { type: query.type });
    }

    if (query.year) {
      queryBuilder.andWhere('YEAR(laf.time) = :year', { year: query.year });
      countQuery.andWhere('YEAR(laf.time) = :year', { year: query.year });
    }

    if (query.month) {
      queryBuilder.andWhere('MONTH(laf.time) = :month', {
        month: query.month,
      });
      countQuery.andWhere('MONTH(laf.time) = :month', { month: query.month });
    }

    const [fights, total] = await Promise.all([
      queryBuilder.getRawMany(),
      countQuery.getCount(),
    ]);

    const data = fights.map((fight: LogArenaFightResponse) => {
      fight.winner_members = fight.winner_members.filter(
        (member) => member !== null,
      );

      fight.loser_members = fight.loser_members.filter(
        (member) => member !== null,
      );

      return fight;
    });

    return { data, total };
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
    name?: string,
  ): {
    data: CharacterAchievementSummary[];
    total: number;
    page: number;
    limit: number;
  } {
    let source = this.achievementsSummaryCache;

    if (name && name.trim() !== '') {
      const query = name.toLowerCase();
      source = source.filter((c) => c.name?.toLowerCase().includes(query));
    }

    const total = source.length;
    const start = (page - 1) * limit;
    const data = source.slice(start, start + limit);
    return { data, total, page, limit };
  }

  async getCharacterAchievementByGuid(
    guid: number,
    category?: number,
  ): Promise<CharacterAchievement[]> {
    if (category !== undefined) {
      // Get achievements in this category from DBC
      const categoryAchievements =
        this.dbcService.getAchievementsByCategory(category);
      const categoryAchievementIds = new Set(
        categoryAchievements.map((a) => a.ID),
      );

      // Get character's achievements and filter by category
      const characterAchievements =
        await this.characterAchievementRepository.find({ where: { guid } });

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

  getAllAchievements(faction?: string): AchievementWithQuantity[] {
    return this.dbcService.getAllAchievementsWithQuantity(faction);
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
    page = 1,
    limit = 100,
  ): Promise<Paginated<PlayerMonthlyGames>> {
    const currentDate = new Date();
    const currentYear = year ?? currentDate.getFullYear();
    const currentMonth = month ?? currentDate.getMonth() + 1;
    const pageSize = Math.min(limit, 100);

    // Normalize excludeType to always be an array
    const excludeTypes =
      excludeType !== undefined
        ? Array.isArray(excludeType)
          ? excludeType
          : [excludeType]
        : undefined;

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
      .addOrderBy('lam.guid', 'ASC')
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const countQuery = this.logArenaMemberstatsRepository
      .createQueryBuilder('lam')
      .leftJoin('log_arena_fights', 'laf', 'laf.fight_id = lam.fight_id')
      .select('COUNT(DISTINCT lam.guid)', 'total')
      .where('YEAR(laf.time) = :year', { year: currentYear })
      .andWhere('MONTH(laf.time) = :month', { month: currentMonth });

    if (excludeTypes !== undefined) {
      topPlayersQuery.andWhere('laf.type NOT IN (:...excludeTypes)', {
        excludeTypes,
      });
      countQuery.andWhere('laf.type NOT IN (:...excludeTypes)', {
        excludeTypes,
      });
    }

    const [topPlayers, countRow] = await Promise.all([
      topPlayersQuery.getRawMany(),
      countQuery.getRawOne<{ total: string }>(),
    ]);
    const total = parseInt(countRow?.total ?? '0', 10);

    if (topPlayers.length === 0) {
      return { data: [], total };
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
    const data = topPlayers.map((player) => ({
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

    return { data, total };
  }

  async getChallengeModesLeaderboard(
    query: ChallengeModesLeaderboardQueryDto,
  ): Promise<Paginated<ChallengeModeCharacter>> {
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const page = Math.max(query.page ?? 1, 1);
    const status = query.status ?? ChallengeModeStatus.All;

    const table = this.challengeModesTable();
    const params: unknown[] = [query.challenge];

    // Characters deleted while their run was still going lose their row entirely, but
    // a run abandoned via the character deletion queue keeps one, so active runs are
    // filtered against the live characters table the same way the in-game board does.
    const activeJoin =
      status === ChallengeModeStatus.Active
        ? 'INNER JOIN characters c ON c.guid = cmc.guid AND c.deleteInfos_Account IS NULL'
        : '';

    const statusCondition = {
      [ChallengeModeStatus.All]: '',
      [ChallengeModeStatus.Active]: 'AND cmc.completed = 0 AND cmc.dead = 0',
      [ChallengeModeStatus.Completed]: 'AND cmc.completed = 1',
      [ChallengeModeStatus.Dead]: 'AND cmc.dead = 1',
    }[status];

    // Ranks are computed over the whole bracket before the name/class filters are
    // applied, so a filtered view still shows each character's true standing.
    const outerConditions: string[] = [];

    if (query.name) {
      outerConditions.push('ranked.name LIKE CONCAT(?, "%")');
      params.push(query.name);
    }

    if (query.class) {
      outerConditions.push('ranked.class = ?');
      params.push(query.class);
    }

    const outerWhere = outerConditions.length
      ? `WHERE ${outerConditions.join(' AND ')}`
      : '';

    // The module records no completion date: it flips `completed` on the level-up that
    // reaches the cap, so the date of the matching level milestone achievement
    // (6 = level 10, 7 = level 20 … 13 = level 80) is the moment the run was won. It is
    // NULL for characters whose achievements are gone, i.e. hard-deleted ones.
    //
    // Wrapped in IF rather than written as a LEFT JOIN so the lookup runs only for the
    // handful of completed runs: as a join condition `completed = 1` is filtered after
    // the index dive, costing one dive per row of the whole bracket.
    const completedOn = `
      IF(cmc.completed = 1,
         (SELECT lvl.date FROM character_achievement lvl
           WHERE lvl.guid = cmc.guid
             AND lvl.achievement = 5 + FLOOR(cmc.level / 10)),
         NULL)
    `;

    // The module snapshots gender with Eluna's Player:GetGender(), which reads the unit
    // field that shapeshift models overwrite: creature_model_info.Gender is 2 (none) for
    // cat, moonkin, ghost wolf and friends, so a druid or shaman caught mid-form is stored
    // as gender 2. characters.gender is saved from PLAYER_BYTES_3 instead and is always
    // male or female, so it recovers the real value. Hard-deleted characters are gone from
    // that table and fall back to 0.
    //
    // IF-wrapped for the same reason as completed_on below: the lookup then runs only for
    // the few affected rows rather than once per row of the whole bracket.
    const gender = `
      IF(cmc.gender > 1,
         COALESCE((SELECT g.gender FROM characters g WHERE g.guid = cmc.guid), 0),
         cmc.gender)
    `;

    // played_time is NULL for characters that never levelled up; sorting those last
    // keeps them from outranking characters with a recorded time at the same level.
    const rankedSubQuery = `
      SELECT cmc.guid, cmc.account, cmc.name, cmc.race, cmc.class, ${gender} AS gender,
             cmc.level, cmc.challenge, cmc.completed, cmc.dead, cmc.died_on,
             cmc.char_deleted, cmc.played_time, ${completedOn} AS completed_on,
             RANK() OVER (
               ORDER BY cmc.completed DESC, cmc.level DESC,
                        cmc.played_time IS NULL, cmc.played_time ASC
             ) AS \`rank\`
      FROM ${table} cmc
      ${activeJoin}
      WHERE cmc.challenge = ?
      ${statusCondition}
    `;

    const [rows, countRows] = await Promise.all([
      this.charactersDataSource.query(
        `SELECT * FROM (${rankedSubQuery}) ranked
         ${outerWhere}
         ORDER BY ${this.challengeModesOrderBy(query)}
         LIMIT ? OFFSET ?`,
        [...params, limit, (page - 1) * limit],
      ),
      this.charactersDataSource.query(
        `SELECT COUNT(*) AS total FROM (${rankedSubQuery}) ranked ${outerWhere}`,
        params,
      ),
    ]);

    // RANK() comes back as a BIGINT, which the driver hands over as a string.
    const data = rows.map((row) => ({ ...row, rank: Number(row.rank) }));

    return { data, total: parseInt(countRows[0].total, 10) };
  }

  private challengeModesOrderBy(
    query: ChallengeModesLeaderboardQueryDto,
  ): string {
    const sort = query.sort ?? ChallengeModeSort.Rank;

    const columns = {
      [ChallengeModeSort.Rank]: '`rank`',
      [ChallengeModeSort.Level]: 'ranked.level',
      [ChallengeModeSort.PlayedTime]: 'ranked.played_time',
      [ChallengeModeSort.Status]:
        'CASE WHEN ranked.completed = 1 THEN 2 WHEN ranked.dead = 1 THEN 0 ELSE 1 END',
      [ChallengeModeSort.Date]: 'COALESCE(ranked.completed_on, ranked.died_on)',
    };

    const defaultDirections = {
      [ChallengeModeSort.Rank]: ChallengeModeSortDirection.Asc,
      [ChallengeModeSort.Level]: ChallengeModeSortDirection.Desc,
      [ChallengeModeSort.PlayedTime]: ChallengeModeSortDirection.Asc,
      [ChallengeModeSort.Status]: ChallengeModeSortDirection.Desc,
      [ChallengeModeSort.Date]: ChallengeModeSortDirection.Desc,
    };

    // Rank and status are computed from NOT NULL columns, so they never need the
    // nulls-last guard below.
    const nullable =
      sort !== ChallengeModeSort.Rank && sort !== ChallengeModeSort.Status;

    const column = columns[sort];
    const direction =
      (query.direction ?? defaultDirections[sort]) ===
      ChallengeModeSortDirection.Desc
        ? 'DESC'
        : 'ASC';

    // Characters without a value for the sorted column go last in either direction,
    // so a page never opens on a block of blanks.
    const nullsLast = nullable ? `${column} IS NULL, ` : '';

    return `${nullsLast}${column} ${direction}, ranked.name ASC`;
  }

  async getChallengeModesStats(): Promise<ChallengeModeStats[]> {
    const rows = await this.charactersDataSource.query(
      `SELECT cmc.challenge AS challenge,
              COUNT(*) AS total,
              SUM(cmc.completed = 0 AND cmc.dead = 0) AS active,
              SUM(cmc.completed = 1) AS completed,
              SUM(cmc.dead = 1) AS dead
       FROM ${this.challengeModesTable()} cmc
       GROUP BY cmc.challenge
       ORDER BY cmc.challenge ASC`,
    );

    return rows.map((row) => ({
      challenge: Number(row.challenge),
      total: Number(row.total),
      active: Number(row.active),
      completed: Number(row.completed),
      dead: Number(row.dead),
    }));
  }
}
