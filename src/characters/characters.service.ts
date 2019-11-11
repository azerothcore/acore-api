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

    async recoveryHeroList(accountID: number)
    {
        return await this.charactersRepository.find(
        {
            where: { deleteInfos_Account: accountID },
            select: ['guid', 'class', 'totaltime', 'totalKills', 'deleteInfos_Name']
        });
    }

    async recoveryHero(charactersDto: CharactersDto, accountID: number): Promise<object>
    {
        const characters = await this.charactersRepository.find({ where: { deleteInfos_Account: accountID }, select: ['guid'] });
        this.characterGuidValidation(characters, charactersDto.guid);

        await Misc.setCoin(20, accountID);

        await getConnection('charactersConnection').getRepository(Characters)
            .createQueryBuilder('characters')
            .update(Characters)
            .set({ account: accountID, name: 'Recovery', deleteInfos_Account: null, deleteInfos_Name: null, deleteDate: null })
            .where(`guid = ${charactersDto.guid} AND deleteInfos_Account = ${accountID}`)
            .execute();

        // @TODO SHOULD BE.
        // const updateCharacter = await this.charactersRepository.findOne({ where: { guid: charactersDto.guid, deleteInfos_Account: accountID } });
        // updateCharacter.account = accountID;
        // updateCharacter.name = 'Recovery';
        // updateCharacter.deleteInfos_Account = null;
        // updateCharacter.deleteInfos_Name = null;
        // updateCharacter.deleteDate = null;
        // await updateCharacter.save();

        return { status: 'success' };
    }

    async unban(charactersDto: CharactersDto, accountID: number): Promise<object>
    {
        const characters = await this.charactersRepository.find({ where: { account: accountID }, select: ['guid'] });
        this.characterGuidValidation(characters, charactersDto.guid);

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

        // @TODO SHOULD BE.
        // _characterBanned.active = 0;
        // await _characterBanned.save();

        return { status: 'success' };
    }

    characterGuidValidation(characters, guid): boolean
    {
        if (characters.length === 0)
            throw new NotFoundException('Character not found');

        const Guid = characters.map((character): number => character.guid).find((charGuid: number): boolean => charGuid === guid);

        if (!Guid)
            throw new NotFoundException('Account with that character not found');

        return true;
    }
}
