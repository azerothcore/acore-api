import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Characters } from './characters.entity';
import { getConnection, Like, Repository } from 'typeorm';
import { CharacterBanned } from './character_banned.entity';
import { CharactersDto } from './dto/characters.dto';
import { Misc } from '../shared/misc';
import { RecoveryItem } from './recovery_item.entity';
import { RecoveryItemDTO } from './dto/recovery_item.dto';
import { AzerothMail } from './azeroth_mail.entity';
import { Worldstates } from './worldstates.entity';

@Injectable()
export class CharactersService
{
    constructor(
        @InjectRepository(Characters, 'charactersConnection')
        private readonly charactersRepository: Repository<Characters>,
        @InjectRepository(CharacterBanned, 'charactersConnection')
        private readonly characterBannedRepository: Repository<CharacterBanned>,
        @InjectRepository(RecoveryItem, 'charactersConnection')
        private readonly recoveryItemRepository: Repository<RecoveryItem>,
        @InjectRepository(AzerothMail, 'charactersConnection')
        private readonly azerothMailRepository: Repository<AzerothMail>,
        @InjectRepository(Worldstates, 'charactersConnection')
        private readonly worldstatesRepository: Repository<Worldstates>,
    ) {}

    async search_worldstates(param: Worldstates)
    {
        return await this.worldstatesRepository.find({ comment: Like(`%${param.comment}%`) });
    }

    async recoveryItemList(guid: number, accountID: number)
    {
        const characters = await this.charactersRepository.find({ where: { account: accountID }, select: ['guid'] });
        Misc.characterGuidValidation(characters, +guid);

        return await this.recoveryItemRepository.find({ where: { Guid: guid } });
    }

    async recoveryItem(recoveryItemDto: RecoveryItemDTO, accountID: number): Promise<object>
    {
        const characters = await this.charactersRepository.find({ where: { account: accountID }, select: ['guid'] });
        Misc.characterGuidValidation(characters, +recoveryItemDto.guid);

        const recoveryItem = await this.recoveryItemRepository.count({ where: { Guid: recoveryItemDto.guid, ItemEntry: recoveryItemDto.itemEntry } });

        if (!recoveryItem)
            throw new NotFoundException('Item Not Found');

        await Misc.setCoin(8, accountID);
        await this.recoveryItemRepository.delete({ Guid: recoveryItemDto.guid, ItemEntry: recoveryItemDto.itemEntry });

        await getConnection('charactersConnection').getRepository(AzerothMail)
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

        // @TODO SHOULD BE.
        // const azerothMail = this.azerothMailRepository.create();
        // azerothMail.subject = 'Recovery Item';
        // azerothMail.guid = recoveryItemDto.guid;
        // azerothMail.entry = recoveryItemDto.itemEntry;
        // azerothMail.count = 1;
        // await azerothMail.save();

        return { status: 'success' };
    }

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
        Misc.characterGuidValidation(characters, +charactersDto.guid);

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
        Misc.characterGuidValidation(characters, +charactersDto.guid);

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
}
