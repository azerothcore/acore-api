import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
  ValidationPipe,
  Get,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { AccountDto } from './dto/account.dto';
import { AuthGuard } from '../shared/auth.guard';
import { Account } from './account.decorator';
import { getConnection } from 'typeorm';
import { Account as AccountEntity } from './account.entity';
import { AccountPasswordDto } from './dto/account_password.dto';
import { EmailDto } from './dto/email.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  async signUp(
    @Body(ValidationPipe) accountDto: AccountDto,
    @Res() response: Response,
  ): Promise<void> {
    return this.authService.signUp(accountDto, response);
  }

  @Post('/signin')
  async signIn(
    @Body() accountDto: AccountDto,
    @Res() response: Response,
  ): Promise<void> {
    return this.authService.signIn(accountDto, response);
  }

  @Get('/logout')
  logout(@Res() response: Response): void {
    response.cookie('jwt', 'logout', {
      expires: new Date(Date.now() + 10),
      httpOnly: true,
    });
    response.status(HttpStatus.OK).json({ status: 'success' });
  }

  @Patch('/updateMyPassword')
  @UseGuards(new AuthGuard())
  async updatePassword(
    @Body(ValidationPipe) accountPasswordDto: AccountPasswordDto,
    @Res() response: Response,
    @Account('id') accountId: number,
  ): Promise<void> {
    return this.authService.updatePassword(
      accountPasswordDto,
      response,
      accountId,
    );
  }

  @Patch('/updateMyEmail')
  @UseGuards(new AuthGuard())
  async updateEmail(
    @Body(ValidationPipe) emailDto: EmailDto,
    @Account('id') accountId: number,
  ) {
    return this.authService.updateEmail(emailDto, accountId);
  }

  @Patch('/unban')
  @UseGuards(new AuthGuard())
  async unban(@Account('id') accountId: number): Promise<object> {
    return this.authService.unban(accountId);
  }

  @Post('/forgotPassword')
  async forgotPassword(
    @Body() accountDto: AccountDto,
    @Req() request: Request,
  ) {
    return this.authService.forgotPassword(accountDto, request);
  }

  @Patch('/resetPassword/:token')
  async resetPassword(
    @Body(ValidationPipe) accountPasswordDto: AccountPasswordDto,
    @Param('token') token: string,
  ) {
    return this.authService.resetPassword(accountPasswordDto, token);
  }

  @Get('/pulse/:days')
  async pulse(@Param('days') days: number): Promise<AccountEntity[]> {
    return await getConnection()
      .getRepository(AccountEntity)
      .createQueryBuilder('auth')
      .select(['COUNT(*) AS accounts', 'COUNT(DISTINCT(last_ip)) AS IPs'])
      .where('DATEDIFF(NOW(), last_login) < ' + days)
      .getRawMany();
  }
}
