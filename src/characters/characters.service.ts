import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Characters } from './characters.entity';
import { getConnection, Repository } from 'typeorm';
import { CharacterBanned } from './character_banned.entity';
import { CharactersDto } from './dto/characters.dto';
import { Misc } from '../shared/misc';

@Injectable()
export class CharactersService
{
    constructor(
        @InjectRepository(Characters, 'charactersConnection')
        private readonly charactersRepository: Repository<Characters>,
        @InjectRepository(CharacterBanned, 'charactersConnection')
        private readonly characterBannedRepository: Repository<CharacterBanned>,
    ) {}

    async unban(charactersDto: CharactersDto, accountID: number)
    {
        const characters = await this.charactersRepository.find({ where: { account: accountID }, select: ['guid'] });

        if (characters.length === 0)
            throw new NotFoundException('Character not found');

        const Guid = characters.map((character): number => character.guid).find((charGuid: number): boolean => charGuid === +charactersDto.guid);

        if (!Guid)
            throw new NotFoundException('Account with that character not found');

        const _characterBanned = await this.characterBannedRepository.findOne({ where: { guid: charactersDto.guid, active: 1 } });

        if (!_characterBanned)
            throw new BadRequestException('Your character is not ban!');

        await Misc.setCoin(5, accountID);

        await getConnection('charactersConnection').getRepository(CharacterBanned)
            .createQueryBuilder('character_banned')
            .update(CharacterBanned)
            .set({ active: 0 })
            .where(`guid = ${charactersDto.guid}`)
            .execute();

        // @TODO SHOULD BE
        // _characterBanned.active = 0;
        // await _characterBanned.save();

        return { status: 'success' };
    }
}
