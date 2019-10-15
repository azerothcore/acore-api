import { Injectable, Req, Res } from '@nestjs/common';
import { AccountRepository } from './account.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { AccountPasswordRepository } from './account-password.repository';
import { AccountPasswordDto } from './dto/account-password.dto';

@Injectable()
export class AuthService
{
    constructor(
        @InjectRepository(AccountRepository) private accountRepository: AccountRepository,
        @InjectRepository(AccountPasswordRepository) private accountPasswordRepository: AccountPasswordRepository
    ) {}

    async signUp(authCredentialsDto: AuthCredentialsDto, @Res() res): Promise<void>
    {
        return this.accountRepository.signUp(authCredentialsDto, res);
    }

    async signIn(authCredentialsDto: AuthCredentialsDto, @Res() res): Promise<void>
    {
        return this.accountRepository.signIn(authCredentialsDto, res);
    }

    async forgotPassword(authCredentialsDto: AuthCredentialsDto, @Req() req, @Res() res): Promise<void>
    {
        return this.accountPasswordRepository.forgotPassword(authCredentialsDto, req, res);
    }

    async resetPassword(accountPasswordDto: AccountPasswordDto, @Res() res, token: string)
    {
        return this.accountPasswordRepository.resetPassword(accountPasswordDto, res, token);
    }
}
