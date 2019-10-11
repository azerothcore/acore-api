import { Injectable, Res } from '@nestjs/common';
import { AccountRepository } from './account.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';

@Injectable()
export class AuthService
{
    constructor(@InjectRepository(AccountRepository) private accountRepository: AccountRepository) {}

    async signUp(authCredentialsDto: AuthCredentialsDto, @Res() res): Promise<void>
    {
        return this.accountRepository.signUp(authCredentialsDto, res);
    }

    async signIn(authCredentialsDto: AuthCredentialsDto, @Res() res): Promise<void>
    {
        return this.accountRepository.signIn(authCredentialsDto, res);
    }
}
