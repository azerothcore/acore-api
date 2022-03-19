import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { Account } from '../auth/account.entity';
import { AccountPassword } from '../auth/account_password.entity';
import { AccountInformation } from '../auth/account_information.entity';
import { getRepository } from 'typeorm';

@Injectable()
export class AuthGuard implements CanActivate {
  private decoded: any;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    return await this.validateToken(request);
  }

  private async validateToken(request: any): Promise<boolean> {
    let token: string;

    if (
      request.headers.authorization &&
      request.headers.authorization.startsWith('Bearer')
    )
      token = request.headers.authorization.split(' ')[1];
    else if (request.cookies?.jwt) {
      token = request.cookies.jwt;
    }

    if (!token) {
      throw new UnauthorizedException([
        'You are not logged in! Please log in to get access.',
      ]);
    }

    try {
      this.decoded = verify(token, process.env.JWT_SECRET_KEY);
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || this.decoded === undefined) {
        throw new UnauthorizedException([
          'Invalid Token. Please log in again!',
        ]);
      }

      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException([
          'Your token has expired! Please log in again',
        ]);
      }

      if (error) {
        throw new InternalServerErrorException([
          'Something went wrong! Please try again later',
        ]);
      }
    }

    const accountExists = await getRepository(
      Account,
      'authConnection',
    ).findOne({
      where: { id: this.decoded.id },
    });

    if (!accountExists) {
      throw new UnauthorizedException([
        'The account belonging to this token does no longer exist.',
      ]);
    }

    delete accountExists.salt;
    delete accountExists.verifier;

    const accountPassword = await getRepository(
      AccountPassword,
      'authConnection',
    ).findOne({
      where: { id: this.decoded.id },
    });

    if (
      request.url === '/auth/updateMyPassword' &&
      accountPassword &&
      accountPassword.password_changed_at
    ) {
      const changedTimestamp =
        accountPassword.password_changed_at.getTime() / 1000;

      if (this.decoded.iat < changedTimestamp) {
        throw new UnauthorizedException([
          'User recently changed password! Please log in again',
        ]);
      }
    }

    const accountInformation = await getRepository(
      AccountInformation,
      'authConnection',
    ).findOne({
      where: { id: this.decoded.id },
    });

    request.account = { ...accountExists, ...accountInformation };

    return true;
  }
}
