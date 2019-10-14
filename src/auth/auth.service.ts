import { Injectable, Res } from '@nestjs/common';
import { AccountRepository } from './account.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { AccountPasswordRepository } from './account-password.repository';

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

    async forgotPassword(authCredentialsDto: AuthCredentialsDto, @Res() res): Promise<void>
    {
        return this.accountPasswordRepository.forgotPassword(authCredentialsDto, res);
    }
}
