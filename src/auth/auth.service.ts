import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountRepository } from './account.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountDto } from './dto/account.dto';
import { AccountPasswordRepository } from './account_password.repository';
import { AccountPasswordDto } from './dto/account_password.dto';
import { EmailDto } from './dto/email.dto';
import { RemoteRepository, Type } from './remote.repository';
import { RemoteDto } from './dto/remote.dto';
import { Request, Response } from 'express';
import { getConnection } from 'typeorm';
import { Characters } from '../characters/characters.entity';
import { Misc } from '../shared/misc';
import { Soap } from '../shared/soap';

@Injectable()
export class AuthService
{
    constructor(
        @InjectRepository(AccountRepository)
        private readonly accountRepository: AccountRepository,
        @InjectRepository(AccountPasswordRepository)
        private readonly accountPasswordRepository: AccountPasswordRepository,
        @InjectRepository(RemoteRepository)
        private readonly remoteRepository: RemoteRepository
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

    async rename(remoteDto: RemoteDto, accountId: number): Promise<object>
    {
        return AuthService.characterCommand(remoteDto, accountId, 'rename', 5);
    }

    async customize(remoteDto: RemoteDto, accountId: number): Promise<object>
    {
        return AuthService.characterCommand(remoteDto, accountId, 'customize', 5);
    }

    async changeFaction(remoteDto: RemoteDto, accountId: number): Promise<object>
    {
        return AuthService.characterCommand(remoteDto, accountId, 'changeFaction', 10);
    }

    async changeRace(remoteDto: RemoteDto, accountId: number): Promise<object>
    {
        return AuthService.characterCommand(remoteDto, accountId, 'changeRace', 10);
    }

    async boost(remoteDto: RemoteDto, accountId: number): Promise<object>
    {
        return AuthService.characterCommand(remoteDto, accountId, 'level', 5, 80);
    }

    async profession(remoteDto: RemoteDto, accountId: number): Promise<object>
    {
        return this.remoteRepository.createRemote(remoteDto, accountId, Type.PROFESSION);
    }

    private static async characterCommand(remoteDto: RemoteDto, accountId: number, command: string, coin: number, option?): Promise<object>
    {
        const characters = await getConnection('charactersConnection').getRepository(Characters)
            .createQueryBuilder('characters')
            .where(`account = ${accountId}`)
            .select(['characters.guid as guid', 'characters.name as name'])
            .getRawOne();

        if (characters.guid !== remoteDto.guid)
            throw new NotFoundException('Account with that character not found');

        await Misc.setCoin(coin, accountId);

        Soap.command(`character ${command} ${characters.name} ${option}`);

        return { status: 'success' };
    }
}
