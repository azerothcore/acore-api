import { AccountInformation } from '../auth/account_information.entity';
import { BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { BigInteger } from 'jsbn';
import * as sha1 from 'js-sha1';

export class Misc {
  static async setCoin(coin: number, accountId: number): Promise<void> {
    const accountInformation = await AccountInformation.findOne({
      where: { id: accountId },
    });

    if (!accountInformation || accountInformation.coins < coin) {
      throw new BadRequestException([`You dont have enough coin (${coin})`]);
    }

    accountInformation.coins -= coin;
    await accountInformation.save();
  }

  static calculateSRP6Verifier(
    username: string,
    password: string,
    salt?: Buffer,
  ): Buffer {
    if (!salt) {
      salt = randomBytes(32);
    }

    const N = new BigInteger(
      '894B645E89E1535BBDAD5B8B290650530801B18EBFBF5E8FAB3C82872A3E9BB7',
      16,
    );
    const g = new BigInteger('7', 16);

    const h1 = Buffer.from(
      sha1.arrayBuffer(`${username}:${password}`.toUpperCase()),
    );

    const h2 = Buffer.from(
      sha1.arrayBuffer(Buffer.concat([salt, h1])),
    ).reverse();

    const h2bigint = new BigInteger(h2.toString('hex'), 16);

    const verifierBigint = g.modPow(h2bigint, N);

    let verifier: Buffer = Buffer.from(verifierBigint.toByteArray()).reverse();

    verifier = verifier.slice(0, 32);
    if (verifier.length != 32) {
      verifier = Buffer.concat([verifier], 32);
    }

    return verifier;
  }

  static verifySRP6(
    username: string,
    password: string,
    salt: Buffer,
    verifier: Buffer,
  ): boolean {
    const generated: Buffer = this.calculateSRP6Verifier(
      username,
      password,
      salt,
    );

    return Buffer.compare(generated, verifier) === 0 ? true : false;
  }
}
