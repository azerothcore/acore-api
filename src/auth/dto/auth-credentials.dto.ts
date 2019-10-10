import { IsEmail, IsString, Matches, MaxLength, MinLength, Validate } from 'class-validator';

export class AuthCredentialsDto
{
    @MinLength(4)
    @MaxLength(20)
    @Matches(/^[A-Za-z0-9_]+$/, { message: 'Please enter a valid username' })
    username: string;

    @IsString()
    @MinLength(8)
    @MaxLength(20)
    @Matches(/((?=.*\d)|(?=.&\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'Password too weak' })
    password: string;

    @IsString()
    passwordConfirm: string;

    @IsEmail({}, { message: 'Please enter a valid email address' })
    email: string;
}
