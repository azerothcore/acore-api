import * as nodemailer from 'nodemailer';
import * as htmlToText from 'html-to-text';

export class Email
{
    private readonly to: string;
    private readonly username: string;
    private readonly url: string;
    private readonly from: string;

    constructor(account, url)
    {
        this.to = account.reg_mail;
        this.username = account.username;
        this.url = url;
        this.from = process.env.MAIL_FROM;
    }

    private newTransport(mailOptions)
    {
        return nodemailer.createTransport(
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

    private async send(template, subject)
    {
        // @TODO FIXME PUG OR EJS TEMPLATE FOR SENDING EMAIL
        const html = template;
        const mailOptions = { from: this.from, to: this.to, subject, html, text: htmlToText.fromString(html) };
        await this.newTransport(mailOptions);
    }

    async sendPasswordReset()
    {
        const template =
        `
            <h1>Forgot your password?</h1>
            <p>Submit a patch request with your new password and password confirm to: <a href="${this.url}">Reset my password</a></p>
            <p>Your password reset token (valid for only 10 minutes)</p>
            <p>If you didn't forget your password, please ignore this email</p>
        `;

        await this.send(template, 'AzerothJS Reset Password');
    }
}
