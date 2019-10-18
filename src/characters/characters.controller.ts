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
            .select(['characters.guid',
                     'characters.name',
                     'characters.race',
                     'characters.class',
                     'characters.gender',
                     'characters.level',
                     'characters.map',
                     'characters.instance_id',
                     'characters.zone',
                     'gm.guildid as guildId',
                     'g.name as guildName'])
            .getRawMany();
    }

}
