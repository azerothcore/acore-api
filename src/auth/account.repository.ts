import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { EntityRepository, Repository } from 'typeorm';
import { Account } from './account.entity';
import { AccountDto } from './dto/account.dto';
import { BadRequestException, ConflictException, HttpStatus, InternalServerErrorException, Res, UnauthorizedException } from '@nestjs/common';
import { AccountPasswordDto } from './dto/account_password.dto';
import { AccountPassword } from './account_password.entity';
import { EmailDto } from './dto/email.dto';

@EntityRepository(Account)
export class AccountRepository extends Repository<Account>
{
    async signUp(accountDto: AccountDto, @Res() res): Promise<void>
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
            AccountRepository.createToken(account, HttpStatus.CREATED, res);
        }
        catch (error)
        {
            if (error.code === 'ER_DUP_ENTRY')
                throw new ConflictException('Username already exists');
            else
                throw new InternalServerErrorException('Something went wrong! Please try again later.');
        }
    }

    async signIn(accountDto: AccountDto, @Res() res): Promise<void>
    {
        const { username, password } = accountDto;
        const account = await this.findOne({ where: { username } });

        if (!account || (await AccountRepository.hashPassword(username, password)) !== account.sha_pass_hash)
            throw new UnauthorizedException('Incorrect username or password');

        AccountRepository.createToken(account, HttpStatus.OK, res);
    }

    async updatePassword(accountPasswordDto: AccountPasswordDto, @Res() res, accountID)
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

        AccountRepository.createToken(account, HttpStatus.OK, res);
    }

    async updateEmail(emailDto: EmailDto, @Res() res, accountID)
    {
        const { password, emailCurrent, email, emailConfirm } = emailDto;
        const account = await this.findOne({ where: { id: accountID } });

        if (emailCurrent.toUpperCase() !== account.reg_mail)
            throw new BadRequestException('Your current email is wrong!');

        if (emailConfirm.toUpperCase() !== email.toUpperCase())
            throw new BadRequestException('Email does not match');

        if ((await AccountRepository.hashPassword(account.username, password)) !== account.sha_pass_hash)
            throw new UnauthorizedException('Your current password is wrong!');

        account.reg_mail = email.toUpperCase();
        await account.save();

        res.status(HttpStatus.OK).json({ status: 'success', message: 'Your email has been changed successfully!' });
    }

    private static async hashPassword(username: string, password: string): Promise<string>
    {
        return crypto.createHash('sha1').update(`${username.toUpperCase()}:${password}`.toUpperCase()).digest('hex').toUpperCase();
    }

    private static createToken(account: any, statusCode: number, res: any): void
    {
        const token = jwt.sign({ id: account.id }, process.env.JWT_SECRET_KEY, { expiresIn: process.env.JWT_EXPIRES_IN });

        account.sha_pass_hash = undefined;
        account.v = undefined;
        account.s = undefined;

        res.status(statusCode).json({ status: 'success', token, data: { account } });
    }
}
