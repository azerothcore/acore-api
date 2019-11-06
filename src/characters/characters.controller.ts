import { Body, Controller, Get, Post, NotFoundException, Param, Query, UseGuards, BadRequestException, Patch } from '@nestjs/common';
import { CharactersService } from './characters.service';
import { getConnection } from 'typeorm';
import { Characters } from './characters.entity';
import { GuildMember } from './guild_member.entity';
import { Guild } from './guild.entity';
import { ArenaTeam } from './arena_team.entity';
import { ArenaTeamMember } from './arena_team_member.entity';
import { CharacterArenaStats } from './character_arena_stats.entity';
import { Worldstates } from './worldstates.entity';
import { RecoveryItem } from './recovery_item.entity';
import { AuthGuard } from '../shared/auth.guard';
import { Account } from '../auth/account.decorator';
import { RecoveryItemDTO } from './dto/recovery_item.dto';
import { AzerothMail } from './azeroth_mail.entity';
import { CharactersDto } from './dto/characters.dto';
import { CharacterBanned } from './character_banned.entity';

@Controller('characters')
export class CharactersController
{
    constructor(private charactersService: CharactersService) {}

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
        const connection = getConnection('charactersConnection');
        return await connection
            .getRepository(ArenaTeam)
            .createQueryBuilder('arena_team')
            .innerJoinAndSelect(Characters, 'c', 'c.guid = arena_team.captainGuid')
            .select(['c.name AS captainName',
                     'c.race AS captainRace',
                     'arena_team.*'])
            .where('arena_team.arenaTeamId = ' + arenaTeamId)
            .getRawMany();
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
        const connection = getConnection('charactersConnection');
        return await connection
            .getRepository(Worldstates)
            .createQueryBuilder('worldstates')
            .select(['worldstates.*'])
            .where('worldstates.comment LIKE "%' + param.comment + '%"')
            .getRawMany();
    }

    @Get('/recoveryItemList/:guid')
    @UseGuards(new AuthGuard())
    async recoveryItemList(@Param('guid') guid: number, @Account('id') accountID: number)
    {
        const characters = await this.getGuid(accountID);

        if (characters.length === 0)
            throw new NotFoundException('Character not found');

        const Guid = characters.map((character): number => character.guid).find((charGuid: number): boolean => charGuid === +guid);

        if (!Guid)
            throw new NotFoundException('Account with that character not found');

        const connection = getConnection('charactersConnection');
        return await connection
            .getRepository(RecoveryItem)
            .createQueryBuilder('recovery_item')
            .select(['recovery_item.*'])
            .where(`recovery_item.Guid = ${guid}`)
            .getRawMany();
    }

    @Post('/recoveryItem')
    @UseGuards(new AuthGuard())
    async recoveryItem(@Body() recoveryItemDto: RecoveryItemDTO, @Account('id') accountID: number): Promise<object>
    {
        const characters = await this.getGuid(accountID);

        if (characters.length === 0)
            throw new NotFoundException('Character not found');

        const Guid = characters.map((character): number => character.guid).find((charGuid: number): boolean => charGuid === +recoveryItemDto.guid);

        if (!Guid)
            throw new NotFoundException('Account with that character not found');

        const connection = getConnection('charactersConnection');

        const recoveryItem = await connection.getRepository(RecoveryItem)
            .createQueryBuilder('recovery_item')
            .where(`Guid = :guid AND ItemEntry = :itemEntry`, { guid: recoveryItemDto.guid, itemEntry: recoveryItemDto.itemEntry })
            .getCount();

        if (!recoveryItem)
            throw new NotFoundException('Item Not Found');

        await connection.getRepository(RecoveryItem)
            .createQueryBuilder('recovery_item')
            .delete()
            .where(`Guid = :guid AND ItemEntry = :itemEntry`, { guid: recoveryItemDto.guid, itemEntry: recoveryItemDto.itemEntry })
            .execute();

        await connection.getRepository(AzerothMail)
            .createQueryBuilder('azeroth_mail')
            .insert()
            .into(AzerothMail)
            .values(
            {
                subject: 'Recovery Item',
                guid: recoveryItemDto.guid,
                entry: recoveryItemDto.itemEntry,
                count: 1
            })
            .execute();

        return { status: 'success' };
    }

    @Get('/recoveryHeroList')
    @UseGuards(new AuthGuard())
    async recoveryHeroList(@Account('id') accountID: number)
    {
        const connection = getConnection('charactersConnection');
        return await connection
            .getRepository(Characters)
            .createQueryBuilder('characters')
            .where(`deleteInfos_Account = ${accountID}`)
            .select(['characters.guid as guid',
                    'characters.class as class',
                    'characters.totaltime as totaltime',
                    'characters.totalkills as totalkills',
                    'characters.deleteInfos_Name as deleteInfos_Name'])
            .getRawMany();
    }

    @Post('/recoveryHero')
    @UseGuards(new AuthGuard())
    async recoveryHero(@Body() charactersDto: CharactersDto, @Account('id') accountID: number)
    {
        const characters = await this.getDeleteAccountGuid(accountID);

        if (characters.length === 0)
            throw new NotFoundException('Character not found');

        const Guid = characters.map((character): number => character.guid).find((charGuid: number): boolean => charGuid === +charactersDto.guid);

        if (!Guid)
            throw new NotFoundException('Account with that character not found');

        const connection = getConnection('charactersConnection');
        await connection.getRepository(Characters)
            .createQueryBuilder('characters')
            .update(Characters)
            .set({ account: accountID, name: 'Recovery', deleteInfos_Account: null, deleteInfos_Name: null, deleteDate: null })
            .where(`guid = ${charactersDto.guid} AND deleteInfos_Account = ${accountID}`)
            .execute();

        return { status: 'success' };
    }

    @Patch('/unban')
    @UseGuards(new AuthGuard())
    async unban(@Body() charactersDto: CharactersDto, @Account('id') accountID: number): Promise<object>
    {
        const characters = await this.getGuid(accountID);

        if (characters.length === 0)
            throw new NotFoundException('Character not found');

        const Guid = characters.map((character): number => character.guid).find((charGuid: number): boolean => charGuid === +charactersDto.guid);

        if (!Guid)
            throw new NotFoundException('Account with that character not found');

        const connection = getConnection('charactersConnection');

        const characterBanned = await connection.getRepository(CharacterBanned)
            .createQueryBuilder('character_banned')
            .where(`guid = ${Guid} AND active = 1`)
            .select(['character_banned.guid as guid'])
            .getRawOne();

        if (!characterBanned)
            throw new BadRequestException('Your character is not ban!');

        await connection.getRepository(CharacterBanned)
            .createQueryBuilder('character_banned')
            .update(CharacterBanned)
            .set({ active: 0 })
            .where(`guid = ${charactersDto.guid}`)
            .execute();

        return { status: 'success' };
    }

    async getGuid(accountID: number): Promise<any[]>
    {
        const connection = getConnection('charactersConnection');
        return await connection
            .getRepository(Characters)
            .createQueryBuilder('characters')
            .where(`account = ${accountID}`)
            .select(['characters.guid as guid'])
            .getRawMany();
    }

    async getDeleteAccountGuid(accountID: number): Promise<any[]>
    {
        const connection = getConnection('charactersConnection');
        return await connection
            .getRepository(Characters)
            .createQueryBuilder('characters')
            .where(`deleteInfos_Account = ${accountID}`)
            .select(['characters.guid as guid'])
            .getRawMany();
    }
}
