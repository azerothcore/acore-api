import { Body, Controller, Get, Post, Res, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { AuthGuard } from '../shared/auth.guard';
import { Account } from './account.decorator';

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
    async forgotPassword(@Body() authCredentialsDto: AuthCredentialsDto, @Res() res): Promise<void>
    {
        return this.authService.forgotPassword(authCredentialsDto, res);
    }

    @Get('/testGuard')
    @UseGuards(new AuthGuard())
    async testGuard(@Res() res, @Account() account)
    {
        res.status(200).json({ status: 'success', account });
    }
}
