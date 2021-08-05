import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';

import { CharactersService } from './characters.service';
import { getConnection } from 'typeorm';
import { Characters } from './characters.entity';
import { GuildMember } from './guild_member.entity';
import { Guild } from './guild.entity';
import { ArenaTeam } from './arena_team.entity';
import { ArenaTeamMember } from './arena_team_member.entity';
import { CharacterArenaStats } from './character_arena_stats.entity';
import { Worldstates } from './worldstates.entity';
import { AuthGuard } from '../shared/auth.guard';
import { Account } from '../auth/account.decorator';
import { RecoveryItemDTO } from './dto/recovery_item.dto';
import { CharactersDto } from './dto/characters.dto';
import { RecoveryItem } from './recovery_item.entity';
import { BattlegroundDeserters } from './battleground_deserters.entity';
import { AccountAccess } from '../auth/account_access.entity';

@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get('/online')
  async online() {

    const accountGMs = await getConnection('authConnection')
      .getRepository(AccountAccess)
      .createQueryBuilder('account_access')
      .select(['id'])
      .where('gmlevel > 0')
      .getRawMany();

    const GmIds = accountGMs.map(aa => aa.id);

    const connection = getConnection('charactersConnection');
    const characters = await connection
      .getRepository(Characters)
      .createQueryBuilder('characters')
      .leftJoinAndSelect(GuildMember, 'gm', 'gm.guid = characters.guid')
      .leftJoinAndSelect(Guild, 'g', 'g.guildid = gm.guildid')
      .where('online = 1 AND account NOT IN (' + GmIds.join(',') + ')')
      .select([
        'characters.guid as guid',
        'characters.name as name',
        'characters.race as race',
        'characters.class as class',
        'characters.gender as gender',
        'characters.level as level',
        'characters.map as map',
        'characters.instance_id as instance_id',
        'characters.zone as zone',
        'gm.guildid as guildId',
        'g.name as guildName',
      ])
      .getRawMany();

      return characters;
  }

  /* characters statistics */
  @Get('/stats')
  async characters_stats() {
    const connection = getConnection('charactersConnection');
    return await connection
      .getRepository(Characters)
      .createQueryBuilder('characters')
      .select(['characters.race as race', 'characters.class as class', 'characters.level as level'])
      .getRawMany();
  }

  /* battleground_deserters */
  @Get('/battleground_deserters/:count')
  async battleground_deserters(@Param('count') count: number, @Query() query) {
    let from = 0;
    let where = '';

    if (!!query['from']) {
      from = query['from'];
    }

    if (!!query['name']) {
      where = `UPPER(name) LIKE UPPER('%${query['name']}%')`;
    }

    const connection = getConnection('charactersConnection');
    return await connection
      .getRepository(BattlegroundDeserters)
      .createQueryBuilder('battleground_deserters')
      .innerJoinAndSelect(
        Characters,
        'c',
        'c.guid = battleground_deserters.guid',
      )
      .select([
        'battleground_deserters.*',
        'c.account as account',
        'c.guid AS guid',
        'c.name AS name',
        'c.level AS level',
        'c.race AS race',
        'c.class AS class',
        'c.gender AS gender',
      ])
      .where(where)
      .orderBy({ 'battleground_deserters.datetime': 'DESC' })
      .offset(from)
      .limit(count)
      .getRawMany();
  }

  /* Arena routes */

  @Get('/arena_team/id/:arenaTeamId')
  async arena_team_id(@Param('arenaTeamId') arenaTeamId: number) {
    const connection = getConnection('charactersConnection');
    return await connection
      .getRepository(ArenaTeam)
      .createQueryBuilder('arena_team')
      .innerJoinAndSelect(Characters, 'c', 'c.guid = arena_team.captainGuid')
      .select([
        'c.name AS captainName',
        'c.race AS captainRace',
        'arena_team.*',
      ])
      .where('arena_team.arenaTeamId = ' + arenaTeamId)
      .getRawMany();
  }

  @Get('/arena_team/type/:type/')
  async arena_team(@Param('type') type: number) {
    const connection = getConnection('charactersConnection');
    return await connection
      .getRepository(ArenaTeam)
      .createQueryBuilder('arena_team')
      .innerJoinAndSelect(Characters, 'c', 'c.guid = arena_team.captainGuid')
      .select([
        'c.name AS captainName',
        'c.race AS captainRace',
        'arena_team.*',
      ])
      .where('arena_team.type = ' + type)
      .orderBy({ 'arena_team.rating': 'DESC' })
      .getRawMany();
  }

  @Get('/arena_team_member/:arenaTeamId')
  async arena_team_member(@Param('arenaTeamId') arenaTeamId: number) {
    const connection = getConnection('charactersConnection');
    return await connection
      .getRepository(ArenaTeamMember)
      .createQueryBuilder('arena_team_member')
      .innerJoinAndSelect(Characters, 'c', 'c.guid = arena_team_member.guid')
      .innerJoinAndSelect(
        ArenaTeam,
        'at',
        'at.arenaTeamId = arena_team_member.arenaTeamId',
      )
      .leftJoinAndSelect(
        CharacterArenaStats,
        'cas',
        `
                (arena_team_member.guid = cas.guid AND at.type =
                    (CASE cas.slot
                        WHEN 0 THEN 2
                        WHEN 1 THEN 3
                        WHEN 2 THEN 5
                    END)
                )`,
      )
      .select([
        'arena_team_member.*',
        'c.name AS name',
        'c.class AS class',
        'c.race AS race',
        'c.gender AS gender',
        'cas.matchmakerRating as matchmakerRating',
      ])
      .where('at.arenaTeamId = ' + arenaTeamId)
      .getRawMany();
  }

  @Get('search/worldstates')
  async search_worldstates(
    @Query() param: Worldstates,
  ): Promise<Worldstates[]> {
    return this.charactersService.search_worldstates(param);
  }

  @Get('/recoveryItemList/:guid')
  @UseGuards(new AuthGuard())
  async recoveryItemList(
    @Param('guid') guid: number,
    @Account('id') accountId: number,
  ): Promise<RecoveryItem[]> {
    return this.charactersService.recoveryItemList(guid, accountId);
  }

  @Post('/recoveryItem')
  @UseGuards(new AuthGuard())
  async recoveryItem(
    @Body() recoveryItemDto: RecoveryItemDTO,
    @Account('id') accountId: number,
  ) {
    return this.charactersService.recoveryItem(recoveryItemDto, accountId);
  }

  @Get('/recoveryHeroList')
  @UseGuards(new AuthGuard())
  async recoveryHeroList(
    @Account('id') accountId: number,
  ): Promise<Characters[]> {
    return this.charactersService.recoveryHeroList(accountId);
  }

  @Post('/recoveryHero')
  @UseGuards(new AuthGuard())
  async recoveryHero(
    @Body() charactersDto: CharactersDto,
    @Account('id') accountId: number,
  ) {
    return this.charactersService.recoveryHero(charactersDto, accountId);
  }

  @Patch('/unban')
  @UseGuards(new AuthGuard())
  async unban(
    @Body() charactersDto: CharactersDto,
    @Account('id') accountId: number,
  ){
    return this.charactersService.unban(charactersDto, accountId);
  }

  @Post('/rename')
  @UseGuards(new AuthGuard())
  async rename(
    @Body() charactersDto: CharactersDto,
    @Account('id') accountId: number,
  ) {
    return this.charactersService.rename(charactersDto, accountId);
  }

  @Post('/customize')
  @UseGuards(new AuthGuard())
  async customize(
    @Body() charactersDto: CharactersDto,
    @Account('id') accountId: number,
  ) {
    return this.charactersService.customize(charactersDto, accountId);
  }

  @Post('/changeFaction')
  @UseGuards(new AuthGuard())
  async changeFaction(
    @Body() charactersDto: CharactersDto,
    @Account('id') accountId: number,
  ) {
    return this.charactersService.changeFaction(charactersDto, accountId);
  }

  @Post('/changeRace')
  @UseGuards(new AuthGuard())
  async changeRace(
    @Body() charactersDto: CharactersDto,
    @Account('id') accountId: number,
  ) {
    return this.charactersService.changeRace(charactersDto, accountId);
  }

  @Post('/boost')
  @UseGuards(new AuthGuard())
  async boost(
    @Body() charactersDto: CharactersDto,
    @Account('id') accountId: number,
  ) {
    return this.charactersService.boost(charactersDto, accountId);
  }

  @Post('/unstuck')
  @UseGuards(new AuthGuard())
  async unstuck(
    @Body() charactersDto: CharactersDto,
    @Account('id') accountId: number,
  ) {
    return this.charactersService.unstuck(charactersDto, accountId);
  }
}
