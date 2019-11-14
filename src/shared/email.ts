import { createTransport } from 'nodemailer';
import { fromString } from 'html-to-text';
import { Account } from '../auth/account.entity';

interface IEmail
{
    from: string;
    to: string;
    subject: string;
    html: string;
    text: string;
}

export class Email
{
    private readonly to: string;
    private readonly username: string;
    private readonly url: string;
    private readonly from: string;

    constructor(account: Account, url: string)
    {
        this.to = account.reg_mail;
        this.username = account.username;
        this.url = url;
        this.from = process.env.MAIL_FROM;
    }

    private static newTransport(mailOptions: IEmail): object
    {
        return createTransport(
        {
            host: process.env.MAIL_HOST,
            port: +process.env.MAIL_PORT,
            auth:
            {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD
            }
        }).sendMail(mailOptions);
    }

    private async send(template: string, subject: string): Promise<void>
    {
        const mailOptions: IEmail = { from: this.from, to: this.to, subject, html: template, text: fromString(template) };
        await Email.newTransport(mailOptions);
    }

    async sendPasswordReset(): Promise<void>
    {
        const template: string =
        `
            <h1>Forgot your password?</h1>
            <p>Submit a patch request with your new password and password confirm to: <a href="${this.url}">Reset my password</a></p>
            <p>Your password reset token (valid for only 10 minutes)</p>
            <p>If you didn't forget your password, please ignore this email</p>
        `;

        await this.send(template, 'AzerothJS Reset Password');
    }
}
