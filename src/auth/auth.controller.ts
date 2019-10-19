import { Body, Controller, Param, Patch, Post, Req, Res, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AccountDto } from './dto/account.dto';
import { AuthGuard } from '../shared/auth.guard';
import { Account } from './account.decorator';
import { AccountPasswordDto } from './dto/account_password.dto';

@Controller('auth')
export class AuthController
{
    constructor(private readonly authService: AuthService) {}

    @Post('/signup')
    async signUp(@Body(ValidationPipe) accountDto: AccountDto, @Res() res): Promise<void>
    {
        return this.authService.signUp(accountDto, res);
    }

    @Post('/signin')
    async signIn(@Body() accountDto: AccountDto, @Res() res): Promise<void>
    {
        return this.authService.signIn(accountDto, res);
    }

    @Patch('/updateMyPassword')
    @UseGuards(new AuthGuard())
    async updatePassword(@Body(ValidationPipe) accountPasswordDto: AccountPasswordDto, @Res() res, @Account('id') accountID)
    {
        return this.authService.updatePassword(accountPasswordDto, res, accountID);
    }

    @Post('/forgotPassword')
    async forgotPassword(@Body() accountDto: AccountDto, @Req() req, @Res() res): Promise<void>
    {
        return this.authService.forgotPassword(accountDto, req, res);
    }

    @Patch('/resetPassword/:token')
    async resetPassword(@Body(ValidationPipe) accountPasswordDto: AccountPasswordDto, @Res() res, @Param('token') token: string): Promise<void>
    {
        return this.authService.resetPassword(accountPasswordDto, res, token);
    }
}
