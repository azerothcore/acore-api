import { Injectable } from '@nestjs/common';
import { AccountRepository } from './account.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountDto } from './dto/account.dto';
import { AccountPasswordRepository } from './account_password.repository';
import { AccountPasswordDto } from './dto/account_password.dto';
import { EmailDto } from './dto/email.dto';
import { RemoteRepository, Type } from './remote.repository';
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

    async signUp(accountDto: AccountDto, response: Response): Promise<void>
    {
        return this.accountRepository.signUp(accountDto, response);
    }

    async signIn(accountDto: AccountDto, response: Response): Promise<void>
    {
        return this.accountRepository.signIn(accountDto, response);
    }

    async updatePassword(accountPasswordDto: AccountPasswordDto, response: Response, accountID: number): Promise<void>
    {
        return this.accountRepository.updatePassword(accountPasswordDto, response, accountID);
    }

    async updateEmail(emailDto: EmailDto, accountID: number): Promise<object>
    {
        return this.accountRepository.updateEmail(emailDto, accountID);
    }

    async unban(accountID: number): Promise<object>
    {
        return this.accountRepository.unban(accountID);
    }

    async forgotPassword(accountDto: AccountDto, request: Request): Promise<object>
    {
        return this.accountPasswordRepository.forgotPassword(accountDto, request);
    }

    async resetPassword(accountPasswordDto: AccountPasswordDto, token: string): Promise<object>
    {
        return this.accountPasswordRepository.resetPassword(accountPasswordDto, token);
    }

    async rename(remoteDto: RemoteDto, accountID: number): Promise<object>
    {
        return this.remoteRepository.createRemote(remoteDto, accountID, Type.RENAME);
    }

    async customize(remoteDto: RemoteDto, accountID: number): Promise<object>
    {
        return this.remoteRepository.createRemote(remoteDto, accountID, Type.CUSTOMIZE);
    }

    async changeFaction(remoteDto: RemoteDto, accountID: number): Promise<object>
    {
        return this.remoteRepository.createRemote(remoteDto, accountID, Type.CHANGE_FACTION);
    }

    async changeRace(remoteDto: RemoteDto, accountID: number): Promise<object>
    {
        return this.remoteRepository.createRemote(remoteDto, accountID, Type.CHANGE_RACE);
    }

    async boost(remoteDto: RemoteDto, accountID: number): Promise<object>
    {
        return this.remoteRepository.createRemote(remoteDto, accountID, Type.BOOST);
    }

    async profession(remoteDto: RemoteDto, accountID: number): Promise<object>
    {
        return this.remoteRepository.createRemote(remoteDto, accountID, Type.PROFESSION);
    }
}
