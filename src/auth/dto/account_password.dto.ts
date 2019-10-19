import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class AccountPasswordDto
{
    readonly passwordCurrent: string;

    @IsString()
    @MinLength(8)
    @MaxLength(20)
    @Matches(/((?=.*\d)|(?=.&\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'Password too weak' })
    readonly password: string;

    @IsString()
    readonly passwordConfirm: string;
}
