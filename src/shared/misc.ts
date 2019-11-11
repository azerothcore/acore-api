import { AccountInformation } from '../auth/account_information.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

export class Misc
{
    static async setCoin(coin: number, accountID: number): Promise<void>
    {
        const accountInformation = await AccountInformation.findOne({ where: { id: accountID } });

        if (!accountInformation || accountInformation.coins < coin)
            throw new BadRequestException(`You dont have enough coin (${coin})`);

        accountInformation.coins -= coin;
        await accountInformation.save();
    }

    static characterGuidValidation(characters, guid: number): boolean
    {
        if (characters.length === 0)
            throw new NotFoundException('Character not found');

        const Guid = characters.map((character): number => character.guid).find((charGuid: number): boolean => charGuid === guid);

        if (!Guid)
            throw new NotFoundException('Account with that character not found');

        return true;
    }
}
