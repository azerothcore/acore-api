import * as crypto from 'crypto';
import { EntityRepository, Repository } from 'typeorm';
import { Account } from './account.entity';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';

@EntityRepository(Account)
export class AccountRepository extends Repository<Account>
{
    async signUp(authCredentialsDto: AuthCredentialsDto): Promise<void>
    {
        const { username, password, email } = authCredentialsDto;
        const account = new Account();
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
        }
        catch (error)
        {
            if (error.code === 'ER_DUP_ENTRY')
                throw new ConflictException('Username already exists');
            else
                throw new InternalServerErrorException();
        }
    }

    private static async hashPassword(username: string, password: string): Promise<string>
    {
        return crypto.createHash('sha1').update(`${username.toUpperCase()}:${password}`.toUpperCase()).digest('hex').toUpperCase();
    }
}
