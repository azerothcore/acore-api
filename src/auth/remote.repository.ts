import { EntityRepository, Repository } from 'typeorm';
import { Remote } from './remote.entity';
import { NotFoundException } from '@nestjs/common';
import { RemoteDto } from './dto/remote.dto';
import { CharactersController } from '../characters/characters.controller';
import { Misc } from '../shared/misc';

export enum Type
{
    RENAME = 1,
    CUSTOMIZE = 2,
    CHANGE_FACTION = 3,
    CHANGE_RACE = 4,
    BOOST = 5,
    PROFESSION = 6
}

enum Profession
{
    ALCHEMY = 1,
    BLACKSMITHING = 2,
    ENCHANTING = 3,
    ENGINEERING = 4,
    INSCRIPTION = 5,
    JEWELCRAFTING = 6,
    LEATHERWORKING = 7,
    TAILORING = 8,
    MINING = 9,
    SKINNING = 10,
    HERBALISM = 11,
    COOKING = 12,
    FIRST_AID = 13,
    FISHING = 14
}

@EntityRepository(Remote)
export class RemoteRepository extends Repository<Remote>
{
    async createRemote(remoteDto: RemoteDto, accountID: number, type: Type): Promise<object>
    {
        const characters =  await new CharactersController(undefined).getGuid(accountID);

        if (characters.length === 0)
            throw new NotFoundException('Character not found');

        const Guid = characters.map((character): number => character.guid).find((guid: number): boolean => guid === +remoteDto.guid);

        if (!Guid)
            throw new NotFoundException('Account with that character not found');

        let coin;

        switch (type)
        {
            case Type.RENAME:
                coin = 5;
                break;
            case Type.CUSTOMIZE:
                coin = 10;
                break;
            case Type.CHANGE_FACTION:
                coin = 20;
                break;
            case Type.CHANGE_RACE:
                coin = 15;
                break;
            case Type.BOOST:
                coin = 5;
                break;
            case Type.PROFESSION:
            {
                switch (remoteDto.profession)
                {
                    case Profession.ALCHEMY:
                    case Profession.BLACKSMITHING:
                    case Profession.ENCHANTING:
                    case Profession.ENGINEERING:
                    case Profession.INSCRIPTION:
                    case Profession.JEWELCRAFTING:
                    case Profession.LEATHERWORKING:
                    case Profession.TAILORING:
                    case Profession.MINING:
                    case Profession.SKINNING:
                    case Profession.HERBALISM:
                        coin = 10;
                        break;
                    case Profession.COOKING:
                    case Profession.FIRST_AID:
                    case Profession.FISHING:
                        coin = 5;
                        break;
                }
                break;
            }
            default:
                break;
        }

        await Misc.setCoin(coin, accountID);

        const remote = this.create();
        remote.guid = Guid;
        remote.type = type;
        remote.profession = type === Type.PROFESSION ? remoteDto.profession : 0;
        await remote.save();

        return { status: 'success' };
    }
}
