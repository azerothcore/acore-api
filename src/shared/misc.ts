import { AccountInformation } from '../auth/account_information.entity';
import { BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';

export class Misc
{
    static async setCoin(coin: number, accountId: number): Promise<void>
    {
        const accountInformation = await AccountInformation.findOne({ where: { id: accountId } });

        if (!accountInformation || accountInformation.coins < coin)
            throw new BadRequestException(`You dont have enough coin (${coin})`);

        accountInformation.coins -= coin;
        await accountInformation.save();
    }

    static async hashPassword(username: string, password: string): Promise<string>
    {
        return createHash('sha1').update(`${username.toUpperCase()}:${password}`.toUpperCase()).digest('hex').toUpperCase();
    }
}
