import { log, promisify } from 'util';
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Account } from '../auth/account.entity';

@Injectable()
export class AuthGuard implements CanActivate
{
    private decoded: any;

    async canActivate(context: ExecutionContext): Promise<boolean>
    {
        const request = context.switchToHttp().getRequest();

        await this.validateToken(request.headers.authorization);

        return true;
    }

    private async validateToken(auth: string)
    {
        let token;

        if (auth && auth.startsWith('Bearer'))
            token = auth.split(' ')[1];

        if (!token)
            throw new UnauthorizedException('You are not logged in! Please log in to get access.');

        try
        {
            this.decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);
        }
        catch (error)
        {
            if (this.decoded === undefined)
                throw new UnauthorizedException('Invalid Token. Please log in again!');

            if (error.name === 'JsonWebTokenError')
                throw new UnauthorizedException('Invalid Token. Please log in again!');

            if (error.name === 'TokenExpiredError')
                throw new UnauthorizedException('Your token has expired! Please log in again');
        }

        const accountExists = await Account.findOne({ where: { id: this.decoded.id } });

        if (!accountExists)
            throw new UnauthorizedException('The account belonging to this token does no longer exist.');
    }
}
