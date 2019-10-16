import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { EntityRepository, Repository } from 'typeorm';
import { Account } from './account.entity';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { BadRequestException, ConflictException, HttpStatus, InternalServerErrorException, Res, UnauthorizedException } from '@nestjs/common';
import { AccountPasswordDto } from './dto/account-password.dto';
import { AccountPassword } from './account-password.entity';

@EntityRepository(Account)
export class AccountRepository extends Repository<Account>
{
    async signUp(authCredentialsDto: AuthCredentialsDto, @Res() res): Promise<void>
    {
        const { username, password, email } = authCredentialsDto;
        const account = this.create();
        const emailExists = await this.findOne({ reg_mail: email });

        if (emailExists)
            throw new ConflictException('Email address already exists');

        if (authCredentialsDto.passwordConfirm !== password)
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
                throw new InternalServerErrorException();
        }
    }

    async signIn(authCredentialsDto: AuthCredentialsDto, @Res() res): Promise<void>
    {
        const { username, password } = authCredentialsDto;
        const account = await this.findOne({ where: { username } });

        if (!account || (await AccountRepository.hashPassword(username, password)) !== account.sha_pass_hash)
            throw new UnauthorizedException('Incorrect username or password');

        AccountRepository.createToken(account, HttpStatus.OK, res);
    }

    async updatePassword(accountPasswordDto: AccountPasswordDto, @Res() res, accountID)
    {
        const account = await this.findOne({ where: { id: accountID } });

        if (!account || (await AccountRepository.hashPassword(account.username, accountPasswordDto.passwordCurrent)) !== account.sha_pass_hash)
            throw new UnauthorizedException('Your current password is wrong!');

        if (accountPasswordDto.passwordConfirm !== accountPasswordDto.password)
            throw new BadRequestException('Password does not match');

        account.sha_pass_hash = await AccountRepository.hashPassword(account.username, accountPasswordDto.password);
        await account.save();

        const accountPassword = new AccountPassword();
        accountPassword.id = account.id;
        accountPassword.password_changed_at = new Date(Date.now() - 1000);
        await accountPassword.save();

        AccountRepository.createToken(account, HttpStatus.OK, res);
    }

    private static async hashPassword(username: string, password: string): Promise<string>
    {
        return crypto.createHash('sha1').update(`${username.toUpperCase()}:${password}`.toUpperCase()).digest('hex').toUpperCase();
    }

    private static createToken(account: any, statusCode: number, res: any): void
    {
        const token = jwt.sign({ id: account.id }, process.env.JWT_SECRET_KEY, { expiresIn: process.env.JWT_EXPIRES_IN });

        account.sha_pass_hash = undefined;

        res.status(statusCode).json({ status: 'success', token, data: { account } });
    }
}
