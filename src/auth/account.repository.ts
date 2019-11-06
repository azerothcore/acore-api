import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { EntityRepository, Repository } from 'typeorm';
import { Account } from './account.entity';
import { AccountDto } from './dto/account.dto';
import { BadRequestException, ConflictException, HttpStatus, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { AccountPasswordDto } from './dto/account_password.dto';
import { AccountPassword } from './account_password.entity';
import { EmailDto } from './dto/email.dto';
import { Response } from 'express';
import { AccountBanned } from './account_banned.entity';

@EntityRepository(Account)
export class AccountRepository extends Repository<Account>
{
    async signUp(accountDto: AccountDto, response: Response): Promise<void>
    {
        const { username, password, email, passwordConfirm } = accountDto;
        const account = this.create();
        const emailExists = await this.findOne({ reg_mail: email });

        if (emailExists)
            throw new ConflictException('Email address already exists');

        if (passwordConfirm !== password)
            throw new BadRequestException('Password does not match');

        account.username = username.toUpperCase();
        account.sha_pass_hash = await AccountRepository.hashPassword(username, password);
        account.reg_mail = email.toUpperCase();

        try
        {
            await account.save();
            AccountRepository.createToken(account, HttpStatus.CREATED, response);
        }
        catch (error)
        {
            if (error.code === 'ER_DUP_ENTRY')
                throw new ConflictException('Username already exists');
            else
                throw new InternalServerErrorException('Something went wrong! Please try again later.');
        }
    }

    async signIn(accountDto: AccountDto, response: Response): Promise<void>
    {
        const { username, password }: { username: string, password: string } = accountDto;
        const account = await this.findOne({ where: { username } });

        if (!account || (await AccountRepository.hashPassword(username, password)) !== account.sha_pass_hash)
            throw new UnauthorizedException('Incorrect username or password');

        AccountRepository.createToken(account, HttpStatus.OK, response);
    }

    async updatePassword(accountPasswordDto: AccountPasswordDto, response: Response, accountID: number): Promise<void>
    {
        const { passwordCurrent, password, passwordConfirm } = accountPasswordDto;
        const account = await this.findOne({ where: { id: accountID } });

        if ((await AccountRepository.hashPassword(account.username, passwordCurrent)) !== account.sha_pass_hash)
            throw new UnauthorizedException('Your current password is wrong!');

        if (passwordConfirm !== password)
            throw new BadRequestException('Password does not match');

        account.v = '0';
        account.s = '0';
        account.sha_pass_hash = await AccountRepository.hashPassword(account.username, password);
        await account.save();

        const accountPassword = new AccountPassword();
        accountPassword.id = account.id;
        accountPassword.password_changed_at = new Date(Date.now() - 1000);
        await accountPassword.save();

        AccountRepository.createToken(account, HttpStatus.OK, response);
    }

    async updateEmail(emailDto: EmailDto, accountID: number): Promise<object>
    {
        const { password, emailCurrent, email, emailConfirm } = emailDto;
        const account = await this.findOne({ where: { id: accountID } });

        if (emailCurrent.toUpperCase() !== account.reg_mail)
            throw new BadRequestException('Your current email is wrong!');

        if (emailConfirm.toUpperCase() !== email.toUpperCase())
            throw new BadRequestException('Email does not match');

        if (email.toUpperCase() === account.reg_mail)
            throw new ConflictException('That email address already exists');

        if ((await AccountRepository.hashPassword(account.username, password)) !== account.sha_pass_hash)
            throw new UnauthorizedException('Your current password is wrong!');

        account.reg_mail = email.toUpperCase();
        await account.save();

        return { status: 'success', message: 'Your email has been changed successfully!' };
    }

    async unban(accountID: number): Promise<object>
    {
        const accountBanned = await AccountBanned.findOne({ where: { id: accountID, active: 1 } });

        if (!accountBanned)
            throw new BadRequestException('Your account is not ban!');

        accountBanned.active = 0;
        await accountBanned.save();

        return { status: 'success' };
    }

    private static async hashPassword(username: string, password: string): Promise<string>
    {
        return crypto.createHash('sha1').update(`${username.toUpperCase()}:${password}`.toUpperCase()).digest('hex').toUpperCase();
    }

    private static createToken(account: any, statusCode: number, response: Response): void
    {
        const token = jwt.sign({ id: account.id }, process.env.JWT_SECRET_KEY, { expiresIn: process.env.JWT_EXPIRES_IN });

        response.cookie('jwt', token,
        {
            expires: new Date(Date.now() + +process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
            httpOnly: true
        });

        account.sha_pass_hash = undefined;
        account.v = undefined;
        account.s = undefined;

        response.status(statusCode).json({ status: 'success', token, account });
    }
}
