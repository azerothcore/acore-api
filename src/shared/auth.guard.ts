import { CanActivate, ExecutionContext, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Account } from '../auth/account.entity';
import { AccountPassword } from '../auth/account_password.entity';

@Injectable()
export class AuthGuard implements CanActivate
{
    private decoded: any;

    async canActivate(context: ExecutionContext): Promise<boolean>
    {
        const request = context.switchToHttp().getRequest();
        return await this.validateToken(request);
    }

    private async validateToken(request: any): Promise<boolean>
    {
        let token;

        if (request.headers.authorization && request.headers.authorization.startsWith('Bearer'))
            token = request.headers.authorization.split(' ')[1];
        else if (request.cookies.jwt)
            token = request.cookies.jwt;

        if (!token)
            throw new UnauthorizedException('You are not logged in! Please log in to get access.');

        try
        {
            this.decoded = await jwt.verify(token, process.env.JWT_SECRET_KEY);
        }
        catch (error)
        {
            if (this.decoded === undefined)
                throw new UnauthorizedException('Invalid Token. Please log in again!');

            if (error.name === 'JsonWebTokenError')
                throw new UnauthorizedException('Invalid Token. Please log in again!');

            if (error.name === 'TokenExpiredError')
                throw new UnauthorizedException('Your token has expired! Please log in again');

            if (error)
                throw new InternalServerErrorException('Something went wrong! Please try again later');
        }

        const accountExists = await Account.findOne({ where: { id: this.decoded.id } });

        if (!accountExists)
            throw new UnauthorizedException('The account belonging to this token does no longer exist.');

        accountExists.sha_pass_hash = undefined;

        const accountPassword = await AccountPassword.findOne({ where: { id: this.decoded.id } });

        if (accountPassword && accountPassword.password_changed_at)
        {
            const changedTimestamp = accountPassword.password_changed_at.getTime() / 1000;

            if (this.decoded.iat < changedTimestamp)
                throw new UnauthorizedException('User recently changed password! Please log in again');
        }

        request.account = accountExists;

        return true;
    }
}
