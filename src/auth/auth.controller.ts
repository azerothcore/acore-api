import { Body, Controller, Get, Post, Res, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { AuthGuard } from '../shared/auth.guard';

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

    @Get('/testGuard')
    @UseGuards(new AuthGuard())
    async testGuard(@Res() res)
    {
        res.status(200).json({ status: 'success', guard: 'DATA' });
    }
}
