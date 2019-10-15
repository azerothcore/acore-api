import * as crypto from 'crypto';
import { EntityRepository, MoreThan, Repository } from 'typeorm';
import { AccountPassword } from './account-password.entity';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { BadRequestException, InternalServerErrorException, NotFoundException, Req, Res } from '@nestjs/common';
import { Account } from './account.entity';
import { Email } from '../shared/email';
import { AccountPasswordDto } from './dto/account-password.dto';

@EntityRepository(AccountPassword)
export class AccountPasswordRepository extends Repository<AccountPassword>
{
    async forgotPassword(authCredentialsDto: AuthCredentialsDto, @Req() req, @Res() res): Promise<void>
    {
        const account = await Account.findOne({ reg_mail: authCredentialsDto.email });

        if (!account)
            throw new NotFoundException('There is no account with email address');

        const resetToken: string = crypto.randomBytes(32).toString('hex');
        const passwordResetExpires: any = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        const passwordResetToken: string = crypto.createHash('sha256').update(resetToken).digest('hex');

        const accountPassword = new AccountPassword();
        accountPassword.id = account.id;
        accountPassword.password_reset_expires = passwordResetExpires;
        accountPassword.password_reset_token = passwordResetToken;
        await accountPassword.save();

        try
        {
            const resetURL = `${req.protocol}://${req.get('host')}/auth/resetPassword/${resetToken}`;
            await new Email(account, resetURL).sendPasswordReset();
            res.status(200).json({ status: 'success', message: 'Token sent to email' });
        }
        catch (error)
        {
            await this.delete(account.id);

            if (error)
                throw new InternalServerErrorException('There was an error sending the email. Try again later!');
        }
    }

    async resetPassword(accountPasswordDto: AccountPasswordDto, @Res() res, token: string)
    {
        const { password, passwordConfirm } = accountPasswordDto;
        const hashedToken: string = crypto.createHash('sha256').update(token).digest('hex');
        const accountPassword = await this.findOne({ where: { password_reset_token: hashedToken, password_reset_expires: MoreThan(new Date()) } });

        if (!accountPassword)
            throw new BadRequestException('Token is invalid or has expired');

        if (passwordConfirm !== password)
            throw new BadRequestException('Password does not match');

        const account = await Account.findOne({ where: { id: accountPassword.id } });
        const SHA = await crypto.createHash('sha1').update(`${account.username.toUpperCase()}:${password}`.toUpperCase()).digest('hex').toUpperCase();
        account.sha_pass_hash = SHA;
        await account.save();

        accountPassword.password_changed_at = new Date(Date.now() - 1000);
        accountPassword.password_reset_expires = null;
        accountPassword.password_reset_token = null;
        await accountPassword.save();

        res.status(200).json({ status: 'success', message: 'Your password has been reset successfully!' });
    }
}
