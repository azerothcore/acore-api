import { EntityRepository, getConnection, Repository } from 'typeorm';
import { Remote } from './remote.entity';
import { Characters } from '../characters/characters.entity';
import { NotFoundException } from '@nestjs/common';
import { RemoteDto } from './dto/remote.dto';

@EntityRepository(Remote)
export class RemoteRepository extends Repository<Remote>
{
    async createRemote(remoteDto: RemoteDto, accountID: number, type: number, message: string)
    {
        const characters =  await RemoteRepository.getCharactersList(accountID);

        if (characters.length === 0)
            throw new NotFoundException('Character not found');

        const Guid = characters.map(character => character.guid).find(guid => guid == remoteDto.guid);

        if (!Guid)
            throw new NotFoundException('Account with that character not found');

        const remote = this.create();
        remote.guid = Guid;
        remote.type = type;
        await remote.save();

        return { status: 'success', message };
    }

    private static async getCharactersList(accountID: number)
    {
        const connection = getConnection('charactersConnection');
        return await connection
            .getRepository(Characters)
            .createQueryBuilder('characters')
            .where(`account = ${accountID}`)
            .select(['characters.guid as guid', 'characters.name as name'])
            .getRawMany();
    }
}
