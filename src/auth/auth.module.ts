import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountRepository } from './account.repository';
import { AccountPasswordRepository } from './account_password.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [AccountRepository, AccountPasswordRepository],
      'authConnection',
    ),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
