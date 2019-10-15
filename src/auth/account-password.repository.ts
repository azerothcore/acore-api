import * as crypto from 'crypto';
import { EntityRepository, Repository } from 'typeorm';
import { AccountPassword } from './account-password.entity';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { InternalServerErrorException, NotFoundException, Req, Res } from '@nestjs/common';
import { Account } from './account.entity';
import { Email } from '../shared/email';

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
}
