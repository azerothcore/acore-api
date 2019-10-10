import { Injectable } from '@nestjs/common';
import { AccountRepository } from './account.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';

@Injectable()
export class AuthService
{
    constructor(@InjectRepository(AccountRepository) private accountRepository: AccountRepository) {}

    async signUp(authCredentialsDto: AuthCredentialsDto): Promise<void>
    {
        return this.accountRepository.signUp(authCredentialsDto);
    }
}
