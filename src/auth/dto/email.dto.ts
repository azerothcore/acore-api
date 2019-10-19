import { IsEmail } from 'class-validator';

export class EmailDto
{
    readonly password: string;

    readonly emailCurrent: string;

    @IsEmail({}, { message: 'Please enter a valid email address' })
    readonly email: string;

    readonly emailConfirm: string;
}
