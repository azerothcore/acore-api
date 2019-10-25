import { EntityRepository, getConnection, Repository } from 'typeorm';
import { Remote } from './remote.entity';
import { Characters } from '../characters/characters.entity';
import { NotFoundException } from '@nestjs/common';
import { RemoteDto } from './dto/remote.dto';

export enum Type
{
    RENAME = 1,
    CUSTOMIZE = 2,
    CHANGE_FACTION = 3,
    CHANGE_RACE = 4,
    BOOST = 5
}

@EntityRepository(Remote)
export class RemoteRepository extends Repository<Remote>
{
    async createRemote(remoteDto: RemoteDto, accountID: number, type: Type, message: string): Promise<object>
    {
        const characters =  await RemoteRepository.getGuid(accountID);

        if (characters.length === 0)
            throw new NotFoundException('Character not found');

        const Guid = characters.map((character): number => character.guid).find((guid: number): boolean => guid === +remoteDto.guid);

        if (!Guid)
            throw new NotFoundException('Account with that character not found');

        const remote = this.create();
        remote.guid = Guid;
        remote.type = type;
        await remote.save();

        return { status: 'success', message };
    }

    private static async getGuid(accountID: number): Promise<any[]>
    {
        const connection = getConnection('charactersConnection');
        return await connection
            .getRepository(Characters)
            .createQueryBuilder('characters')
            .where(`account = ${accountID}`)
            .select(['characters.guid as guid'])
            .getRawMany();
    }
}
