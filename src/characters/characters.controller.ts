import { Body, Controller, Get, Post, Param, Query, UseGuards, Patch } from '@nestjs/common';
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

@Controller('characters')
export class CharactersController
{
    constructor(private readonly charactersService: CharactersService) {}

    @Get('/online')
    async online()
    {
        const connection = getConnection('charactersConnection');
        return await connection
            .getRepository(Characters)
            .createQueryBuilder('characters')
            .leftJoinAndSelect(GuildMember, 'gm', 'gm.guid = characters.guid')
            .leftJoinAndSelect(Guild, 'g', 'g.guildid = gm.guildid')
            .where('online = 1')
            .select(['characters.guid as guid',
                     'characters.name as name',
                     'characters.race as race',
                     'characters.class as class',
                     'characters.gender as gender',
                     'characters.level as level',
                     'characters.map as map',
                     'characters.instance_id as instance_id',
                     'characters.zone as zone',
                     'gm.guildid as guildId',
                     'g.name as guildName'])
            .getRawMany();
    }

    /* Arena routes */

    @Get('/arena_team/id/:arenaTeamId')
    async arena_team_id(@Param('arenaTeamId') arenaTeamId: number)
    {
        return this.charactersService.arena_team_id(arenaTeamId);
    }

    @Get('/arena_team/type/:type/')
    async arena_team(@Param('type') type: number)
    {
        const connection = getConnection('charactersConnection');
        return await connection
            .getRepository(ArenaTeam)
            .createQueryBuilder('arena_team')
            .innerJoinAndSelect(Characters, 'c', 'c.guid = arena_team.captainGuid')
            .select(['c.name AS captainName',
                     'c.race AS captainRace',
                     'arena_team.*'])
            .where('arena_team.type = ' + type)
            .orderBy({ 'arena_team.rating': 'DESC' })
            .getRawMany();
    }

    @Get('/arena_team_member/:arenaTeamId')
    async arena_team_member(@Param('arenaTeamId') arenaTeamId: number)
    {
        const connection = getConnection('charactersConnection');
        return await connection
            .getRepository(ArenaTeamMember)
            .createQueryBuilder('arena_team_member')
            .innerJoinAndSelect(Characters, 'c', 'c.guid = arena_team_member.guid')
            .innerJoinAndSelect(ArenaTeam, 'at', 'at.arenaTeamId = arena_team_member.arenaTeamId')
            .leftJoinAndSelect(CharacterArenaStats, 'cas', `
                (arena_team_member.guid = cas.guid AND at.type =
                    (CASE cas.slot
                        WHEN 0 THEN 2
                        WHEN 1 THEN 3
                        WHEN 2 THEN 5
                    END)
                )`)
            .select(['arena_team_member.*',
                     'c.name AS name',
                     'c.class AS class',
                     'c.race AS race',
                     'c.gender AS gender',
                     'cas.matchmakerRating as matchmakerRating'])
            .where('at.arenaTeamId = ' + arenaTeamId)
            .getRawMany();
    }

    @Get('search/worldstates')
    async search_worldstates(@Query() param: Worldstates)
    {
        return this.charactersService.search_worldstates(param);
    }

    @Get('/recoveryItemList/:guid')
    @UseGuards(new AuthGuard())
    async recoveryItemList(@Param('guid') guid: number, @Account('id') accountID: number)
    {
        return this.charactersService.recoveryItemList(guid, accountID);
    }

    @Post('/recoveryItem')
    @UseGuards(new AuthGuard())
    async recoveryItem(@Body() recoveryItemDto: RecoveryItemDTO, @Account('id') accountID: number): Promise<object>
    {
        return this.charactersService.recoveryItem(recoveryItemDto, accountID);
    }

    @Get('/recoveryHeroList')
    @UseGuards(new AuthGuard())
    async recoveryHeroList(@Account('id') accountID: number)
    {
        return this.charactersService.recoveryHeroList(accountID);
    }

    @Post('/recoveryHero')
    @UseGuards(new AuthGuard())
    async recoveryHero(@Body() charactersDto: CharactersDto, @Account('id') accountID: number): Promise<object>
    {
        return this.charactersService.recoveryHero(charactersDto, accountID);
    }

    @Patch('/unban')
    @UseGuards(new AuthGuard())
    async unban(@Body() charactersDto: CharactersDto, @Account('id') accountID: number): Promise<object>
    {
        return this.charactersService.unban(charactersDto, accountID);
    }
}
