import { AccountInformation } from '../auth/account_information.entity';
import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

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

    static async hashPassword(username: string, password: string): Promise<string>
    {
        return crypto.createHash('sha1').update(`${username.toUpperCase()}:${password}`.toUpperCase()).digest('hex').toUpperCase();
    }
}
