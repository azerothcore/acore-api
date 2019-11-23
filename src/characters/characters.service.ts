import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Characters } from './characters.entity';
import { Like, Repository } from 'typeorm';
import { RecoveryItemDTO } from './dto/recovery_item.dto';
import { RecoveryItem } from './recovery_item.entity';
import { Soap } from '../shared/soap';
import { CharactersDto } from './dto/characters.dto';
import { Misc } from '../shared/misc';
import { CharacterBanned } from './character_banned.entity';
import { Worldstates } from './worldstates.entity';

@Injectable()
export class CharactersService
{
    constructor(
        @InjectRepository(Characters, 'charactersConnection')
        private readonly charactersRepository: Repository<Characters>,
        @InjectRepository(RecoveryItem, 'charactersConnection')
        private readonly recoveryItemRepository: Repository<RecoveryItem>,
        @InjectRepository(CharacterBanned, 'charactersConnection')
        private readonly characterBannedRepository: Repository<CharacterBanned>,
        @InjectRepository(Worldstates, 'charactersConnection')
        private readonly worldstatesRepository: Repository<Worldstates>,
    ) {}

    async search_worldstates(param: Worldstates): Promise<Worldstates[]>
    {
        return await this.worldstatesRepository.find({ comment: Like(`%${param.comment}%`) });
    }

    async recoveryItemList(guid: number, accountId: number): Promise<RecoveryItem[]>
    {
        const characters = await this.charactersRepository.findOne({ select: ['guid'], where: { account: accountId } });

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

    async recoveryHeroList(accountId: number): Promise<Characters[]>
    {
        return await this.charactersRepository.find(
        {
            select: ['guid', 'class', 'totaltime', 'totalKills', 'deleteInfos_Name'],
            where: { deleteInfos_Account: accountId }
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

    async unban(charactersDto: CharactersDto, accountId: number): Promise<object>
    {
        const characters = await this.charactersRepository.findOne({ select: ['guid', 'name'], where: { account: accountId } });

        if (characters.guid !== +charactersDto.guid)
            throw new NotFoundException('Account with that character not found');

        const characterBanned = await this.characterBannedRepository.findOne({ where: { guid: charactersDto.guid, active: 1 } });

        if (!characterBanned)
            throw new BadRequestException('Your character is not ban!');

        await Misc.setCoin(5, accountId);

        Soap.command(`unban character ${characters.name}`);

        return { status: 'success' };
    }

    async rename(charactersDto: CharactersDto, accountId: number): Promise<object>
    {
        return this.characterCommand(charactersDto, accountId, 'rename', 5);
    }

    async customize(charactersDto: CharactersDto, accountId: number): Promise<object>
    {
        return this.characterCommand(charactersDto, accountId, 'customize', 5);
    }

    async changeFaction(charactersDto: CharactersDto, accountId: number): Promise<object>
    {
        return this.characterCommand(charactersDto, accountId, 'changeFaction', 10);
    }

    async changeRace(charactersDto: CharactersDto, accountId: number): Promise<object>
    {
        return this.characterCommand(charactersDto, accountId, 'changeRace', 10);
    }

    async boost(charactersDto: CharactersDto, accountId: number): Promise<object>
    {
        return this.characterCommand(charactersDto, accountId, 'level', 5, 80);
    }

    async unstuck(charactersDto: CharactersDto, accountId: number): Promise<object>
    {
        const characters = await this.charactersRepository.findOne({ select: ['guid', 'name'], where: { account: accountId } });

        if (characters.guid !== charactersDto.guid)
            throw new NotFoundException('Account with that character not found');

        Soap.command(`unstuck ${characters.name} graveyard`);
        Soap.command(`revive ${characters.name}`);

        return { status: 'success' };
    }

    private async characterCommand(charactersDto: CharactersDto, accountId: number, command: string, coin: number, option?: number): Promise<object>
    {
        const characters = await this.charactersRepository.findOne({ select: ['guid', 'name'], where: { account: accountId } });

        if (characters.guid !== +charactersDto.guid)
            throw new NotFoundException('Account with that character not found');

        await Misc.setCoin(coin, accountId);

        Soap.command(`character ${command} ${characters.name} ${option}`);

        return { status: 'success' };
    }
}
