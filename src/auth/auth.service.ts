import { Injectable, Req, Res } from '@nestjs/common';
import { AccountRepository } from './account.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { AccountPasswordRepository } from './account-password.repository';
import { AccountPasswordDto } from './dto/account-password.dto';
import { Account } from './account.decorator';

@Injectable()
export class AuthService
{
    constructor(
        @InjectRepository(AccountRepository, 'authConnection') private accountRepository: AccountRepository,
        @InjectRepository(AccountPasswordRepository, 'authConnection') private accountPasswordRepository: AccountPasswordRepository
    ) {}

    async signUp(authCredentialsDto: AuthCredentialsDto, @Res() res): Promise<void>
    {
        return this.accountRepository.signUp(authCredentialsDto, res);
    }

    async signIn(authCredentialsDto: AuthCredentialsDto, @Res() res): Promise<void>
    {
        return this.accountRepository.signIn(authCredentialsDto, res);
    }

    async updatePassword(accountPasswordDto: AccountPasswordDto, @Res() res, @Account() accountID)
    {
        return this.accountRepository.updatePassword(accountPasswordDto, res, accountID);
    }

    async forgotPassword(authCredentialsDto: AuthCredentialsDto, @Req() req, @Res() res): Promise<void>
    {
        return this.accountPasswordRepository.forgotPassword(authCredentialsDto, req, res);
    }

    async resetPassword(accountPasswordDto: AccountPasswordDto, @Res() res, token: string): Promise<void>
    {
        return this.accountPasswordRepository.resetPassword(accountPasswordDto, res, token);
    }
}
