import { AccountInformation } from '../auth/account_information.entity';
import { BadRequestException } from '@nestjs/common';

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
}
