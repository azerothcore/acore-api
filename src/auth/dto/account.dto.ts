import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class AccountDto
{
    @MinLength(4)
    @MaxLength(20)
    @Matches(/^[A-Za-z0-9_]+$/, { message: 'Please enter a valid username' })
    readonly username: string;

    @IsString()
    @MinLength(8)
    @MaxLength(20)
    @Matches(/((?=.*\d)|(?=.&\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'Password too weak' })
    readonly password: string;

    @IsString()
    readonly passwordConfirm: string;

    @IsEmail({}, { message: 'Please enter a valid email address' })
    readonly email: string;
}
