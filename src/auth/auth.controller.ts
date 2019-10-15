import { Body, Controller, Get, Param, Patch, Post, Req, Res, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { AuthGuard } from '../shared/auth.guard';
import { Account } from './account.decorator';
import { AccountPasswordDto } from './dto/account-password.dto';

@Controller('auth')
export class AuthController
{
    constructor(private authService: AuthService) {}

    @Post('/signup')
    async signUp(@Body(ValidationPipe) authCredentialsDto: AuthCredentialsDto, @Res() res): Promise<void>
    {
        return this.authService.signUp(authCredentialsDto, res);
    }

    @Post('/signin')
    async signIn(@Body() authCredentialsDto: AuthCredentialsDto, @Res() res): Promise<void>
    {
        return this.authService.signIn(authCredentialsDto, res);
    }

    @Post('/forgotPassword')
    async forgotPassword(@Body() authCredentialsDto: AuthCredentialsDto, @Req() req, @Res() res): Promise<void>
    {
        return this.authService.forgotPassword(authCredentialsDto, req, res);
    }

    @Patch('/resetPassword/:token')
    async resetPassword(@Body(ValidationPipe) accountPasswordDto: AccountPasswordDto, @Res() res, @Param('token') token: string)
    {
        return this.authService.resetPassword(accountPasswordDto, res, token);
    }

    @Get('/testGuard')
    @UseGuards(new AuthGuard())
    async testGuard(@Res() res, @Account() account)
    {
        res.status(200).json({ status: 'success', account });
    }
}
