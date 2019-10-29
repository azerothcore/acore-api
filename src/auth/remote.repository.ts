import { EntityRepository, Repository } from 'typeorm';
import { Remote } from './remote.entity';
import { NotFoundException } from '@nestjs/common';
import { RemoteDto } from './dto/remote.dto';
import { CharactersController } from '../characters/characters.controller';

export enum Type
{
    RENAME = 1,
    CUSTOMIZE = 2,
    CHANGE_FACTION = 3,
    CHANGE_RACE = 4,
    BOOST = 5,
    PROFESSION = 6
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

        const remote = this.create();
        remote.guid = Guid;
        remote.type = type;
        remote.profession = type === Type.PROFESSION ? remoteDto.profession : 0;
        await remote.save();

        return { status: 'success' };
    }
}
