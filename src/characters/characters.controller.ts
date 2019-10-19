import { Body, Controller, Get, Param, Patch, Post, Req, Res, UseGuards, ValidationPipe } from '@nestjs/common';
import { CharactersService } from './characters.service';
import { getConnection } from 'typeorm';
import { Characters } from './characters.entity';
import { GuildMember } from './guild_member.entity';
import { Guild } from './guild.entity';

@Controller('characters')
export class CharactersController
{
    constructor(private charactersService: CharactersService) {}

   @Get('/online')
    async online()
    {
        const connection = getConnection();
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

}
