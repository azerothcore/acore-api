import { Injectable } from '@nestjs/common';
import { AccountRepository } from './account.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountDto } from './dto/account.dto';
import { AccountPasswordRepository } from './account_password.repository';
import { AccountPasswordDto } from './dto/account_password.dto';
import { EmailDto } from './dto/email.dto';
import { RemoteRepository } from './remote.repository';
import { RemoteDto } from './dto/remote.dto';
import { Request, Response } from 'express';

@Injectable()
export class AuthService
{
    constructor(
        @InjectRepository(AccountRepository) private readonly accountRepository: AccountRepository,
        @InjectRepository(AccountPasswordRepository) private readonly accountPasswordRepository: AccountPasswordRepository,
        @InjectRepository(RemoteRepository) private readonly remoteRepository: RemoteRepository
    ) {}

    async signUp(accountDto: AccountDto, response: Response)
    {
        return this.accountRepository.signUp(accountDto, response);
    }

    async signIn(accountDto: AccountDto, response: Response)
    {
        return this.accountRepository.signIn(accountDto, response);
    }

    async updatePassword(accountPasswordDto: AccountPasswordDto, response: Response, accountID: number)
    {
        return this.accountRepository.updatePassword(accountPasswordDto, response, accountID);
    }

    async updateEmail(emailDto: EmailDto, accountID: number)
    {
        return this.accountRepository.updateEmail(emailDto, accountID);
    }

    async forgotPassword(accountDto: AccountDto, request: Request)
    {
        return this.accountPasswordRepository.forgotPassword(accountDto, request);
    }

    async resetPassword(accountPasswordDto: AccountPasswordDto, token: string)
    {
        return this.accountPasswordRepository.resetPassword(accountPasswordDto, token);
    }

    async rename(remoteDto: RemoteDto, accountID: number)
    {
        return this.remoteRepository.createRemote(remoteDto, accountID, 1, 'Renamed');
    }

    async customize(remoteDto: RemoteDto, accountID: number)
    {
        return this.remoteRepository.createRemote(remoteDto, accountID, 2, 'Customize');
    }

    async changeFaction(remoteDto: RemoteDto, accountID: number)
    {
        return this.remoteRepository.createRemote(remoteDto, accountID, 3, 'Change Faction');
    }

    async changeRace(remoteDto: RemoteDto, accountID: number)
    {
        return this.remoteRepository.createRemote(remoteDto, accountID, 4, 'Change Race');
    }
}
