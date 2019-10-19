import { Injectable, Req, Res } from '@nestjs/common';
import { AccountRepository } from './account.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountDto } from './dto/account.dto';
import { AccountPasswordRepository } from './account_password.repository';
import { AccountPasswordDto } from './dto/account_password.dto';
import { Account } from './account.decorator';

@Injectable()
export class AuthService
{
    constructor(
        @InjectRepository(AccountRepository) private readonly accountRepository: AccountRepository,
        @InjectRepository(AccountPasswordRepository) private readonly accountPasswordRepository: AccountPasswordRepository
    ) {}

    async signUp(accountDto: AccountDto, @Res() res): Promise<void>
    {
        return this.accountRepository.signUp(accountDto, res);
    }

    async signIn(accountDto: AccountDto, @Res() res): Promise<void>
    {
        return this.accountRepository.signIn(accountDto, res);
    }

    async updatePassword(accountPasswordDto: AccountPasswordDto, @Res() res, @Account() accountID)
    {
        return this.accountRepository.updatePassword(accountPasswordDto, res, accountID);
    }

    async forgotPassword(accountDto: AccountDto, @Req() req, @Res() res): Promise<void>
    {
        return this.accountPasswordRepository.forgotPassword(accountDto, req, res);
    }

    async resetPassword(accountPasswordDto: AccountPasswordDto, @Res() res, token: string): Promise<void>
    {
        return this.accountPasswordRepository.resetPassword(accountPasswordDto, res, token);
    }
}
