import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './account.entity';
import { AccountPassword } from './account_password.entity';
import { AccountInformation } from './account_information.entity';
import { AccountBanned } from './account_banned.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [Account, AccountPassword, AccountInformation, AccountBanned],
      'authConnection',
    ),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
