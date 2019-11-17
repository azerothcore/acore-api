import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Characters } from './characters.entity';
import { Repository } from 'typeorm';
import { RecoveryItemDTO } from './dto/recovery_item.dto';
import { RecoveryItem } from './recovery_item.entity';
import { Soap } from '../shared/soap';
import { CharactersDto } from './dto/characters.dto';
import { Misc } from '../shared/misc';

@Injectable()
export class CharactersService
{
    constructor(
        @InjectRepository(Characters, 'charactersConnection')
        private readonly charactersRepository: Repository<Characters>,
        @InjectRepository(RecoveryItem, 'charactersConnection')
        private readonly recoveryItemRepository: Repository<RecoveryItem>,
    ) {}

    async recoveryItemList(guid: number, accountID: number)
    {
        const characters = await this.charactersRepository.findOne({ select: ['guid'], where: { account: accountID } });

        if (characters.guid !== +guid)
            throw new NotFoundException('Account with that character not found');

        return await this.recoveryItemRepository.find({ where: { Guid: guid } });
    }

    async recoveryItem(recoveryItemDto: RecoveryItemDTO, accountId: number): Promise<object>
    {
        const characters = await this.charactersRepository.findOne({ select: ['guid', 'name'], where: { account: accountId } });
        const recoveryItem = await this.recoveryItemRepository.findOne({ select: ['Count'], where: { Id: recoveryItemDto.id } });

        if (characters.guid !== recoveryItemDto.guid)
            throw new NotFoundException('Account with that character not found');

        if (!recoveryItem)
            throw new NotFoundException('Item Not Found');

        await this.recoveryItemRepository.delete({ Id: recoveryItemDto.id });

        Soap.command(`send items ${characters.name} "Recovery Item" "AzerothJS Recovery Item" ${recoveryItemDto.itemEntry}:${recoveryItem.Count}`);

        return { status: 'success' };
    }

    async recoveryHeroList(accountId: number): Promise<object>
    {
        return await this.charactersRepository.find(
        {
            where: { deleteInfos_Account: accountId },
            select: ['guid', 'class', 'totaltime', 'totalKills', 'deleteInfos_Name']
        });
    }

    async recoveryHero(charactersDto: CharactersDto, accountId: number): Promise<object>
    {
        const characters = await this.charactersRepository.findOne({ select: ['guid', 'deleteInfos_Name'], where: { deleteInfos_Account: accountId } });

        if (characters.guid !== +charactersDto.guid)
            throw new NotFoundException('Account with that character not found');

        await Misc.setCoin(10, accountId);

        Soap.command(`character deleted restore ${charactersDto.guid} ${characters.deleteInfos_Name} ${accountId}`);

        return { status: 'success' };
    }
}
