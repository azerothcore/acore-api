import { sign } from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Request, Response } from 'express';

import { Account } from './account.entity';
import { AccountPassword } from './account_password.entity';
import { AccountInformation } from './account_information.entity';
import { AccountBanned } from './account_banned.entity';
import { AccountDto } from './dto/account.dto';
import { AccountPasswordDto } from './dto/account_password.dto';
import { EmailDto } from './dto/email.dto';
import { Misc } from '../shared/misc';
import { Email } from '../shared/email';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Account, 'authConnection')
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(AccountPassword, 'authConnection')
    private readonly accountPasswordRepository: Repository<AccountPassword>,
    @InjectRepository(AccountInformation, 'authConnection')
    private readonly accountInformationRepository: Repository<AccountInformation>,
    @InjectRepository(AccountBanned, 'authConnection')
    private readonly accountBannedRepository: Repository<AccountBanned>,
  ) {}

  async signUp(accountDto: AccountDto, response: Response): Promise<void> {
    const {
      username,
      firstName,
      lastName,
      phone,
      password,
      email,
      passwordConfirm,
    } = accountDto;

    const emailExists = await this.accountRepository.findOne({
      where: { reg_mail: email },
    });
    const phoneExists = await this.accountInformationRepository.findOne({
      where: { phone },
    });

    if (emailExists) {
      throw new ConflictException(['Email address already exists']);
    }

    if (phoneExists) {
      throw new ConflictException(['Phone already exists']);
    }

    if (passwordConfirm !== password) {
      throw new BadRequestException(['Password does not match']);
    }

    const [salt, verifier] = Misc.GetSRP6RegistrationData(username, password);

    const account = this.accountRepository.create();
    account.username = username.toUpperCase();
    account.salt = salt;
    account.verifier = verifier;
    account.reg_mail = email.toUpperCase();

    try {
      await this.accountRepository.save(account);

      const accountInformation = new AccountInformation();
      accountInformation.id = account.id;
      accountInformation.first_name = firstName;
      accountInformation.last_name = lastName;
      accountInformation.phone = phone;
      await this.accountInformationRepository.save(accountInformation);

      AuthService.createToken(account, HttpStatus.CREATED, response);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException(['Username already exists']);
      } else {
        throw new InternalServerErrorException([
          'Something went wrong! Please try again later.',
        ]);
      }
    }
  }

  async signIn(accountDto: AccountDto, response: Response): Promise<void> {
    const { username, password } = accountDto;
    const account = await this.accountRepository.findOne({
      where: { username },
    });

    if (
      !account ||
      !Misc.verifySRP6(username, password, account.salt, account.verifier)
    ) {
      throw new UnauthorizedException(['Incorrect username or password']);
    }

    AuthService.createToken(account, HttpStatus.OK, response);
  }

  async updatePassword(
    accountPasswordDto: AccountPasswordDto,
    response: Response,
    accountId: number,
  ): Promise<void> {
    const { passwordCurrent, password, passwordConfirm } = accountPasswordDto;
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });

    if (
      !Misc.verifySRP6(
        account.username,
        passwordCurrent,
        account.salt,
        account.verifier,
      )
    ) {
      throw new UnauthorizedException(['Your current password is wrong!']);
    }

    if (passwordConfirm !== password) {
      throw new BadRequestException(['Password does not match']);
    }

    account.verifier = Misc.calculateSRP6Verifier(
      account.username,
      password,
      account.salt,
    );
    await this.accountRepository.save(account);

    const accountPassword = new AccountPassword();
    accountPassword.id = account.id;
    accountPassword.password_changed_at = new Date(Date.now() - 1000);
    await this.accountPasswordRepository.save(accountPassword);

    AuthService.createToken(account, HttpStatus.OK, response);
  }

  async updateEmail(emailDto: EmailDto, accountId: number) {
    const { password, emailCurrent, email, emailConfirm } = emailDto;
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });

    if (emailCurrent.toUpperCase() !== account.reg_mail) {
      throw new BadRequestException(['Your current email is wrong!']);
    }

    if (emailConfirm.toUpperCase() !== email.toUpperCase()) {
      throw new BadRequestException(['Email does not match']);
    }

    if (email.toUpperCase() === account.reg_mail) {
      throw new ConflictException(['That email address already exists']);
    }

    if (
      !Misc.verifySRP6(
        account.username,
        password,
        account.salt,
        account.verifier,
      )
    ) {
      throw new UnauthorizedException(['Your current password is wrong!']);
    }

    account.reg_mail = email.toUpperCase();
    await this.accountRepository.save(account);

    return {
      status: 'success',
      message: ['Your email has been changed successfully!'],
    };
  }

  async unban(accountId: number) {
    const accountBanned = await this.accountBannedRepository.findOne({
      where: { id: accountId, active: 1 },
    });

    if (!accountBanned) {
      throw new BadRequestException(['Your account is not banned!']);
    }

    await Misc.setCoin(10, accountId, this.accountInformationRepository);

    accountBanned.active = 0;
    await this.accountBannedRepository.save(accountBanned);

    return { status: 'success' };
  }

  async forgotPassword(accountDto: AccountDto, request: Request) {
    const account = await this.accountRepository.findOne({
      where: { reg_mail: accountDto.email },
    });

    if (!account) {
      throw new NotFoundException(['There is no account with email address']);
    }

    const resetToken: string = randomBytes(32).toString('hex');
    const passwordResetExpires: any = new Date(
      Date.now() + 10 * 60 * 1000,
    ).toISOString();
    const passwordResetToken: string = createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const accountPassword = this.accountPasswordRepository.create();
    accountPassword.id = account.id;
    accountPassword.password_reset_expires = passwordResetExpires;
    accountPassword.password_reset_token = passwordResetToken;
    await this.accountPasswordRepository.save(accountPassword);

    try {
      const resetURL = `${request.protocol}://${request.get(
        'host',
      )}/auth/resetPassword/${resetToken}`;
      await new Email(account, resetURL).sendPasswordReset();
      return { status: 'success', message: ['Token sent to email'] };
    } catch (error) {
      await this.accountPasswordRepository.delete(account.id);

      if (error)
        throw new InternalServerErrorException([
          'There was an error sending the email. Try again later!',
        ]);
    }
  }

  async resetPassword(accountPasswordDto: AccountPasswordDto, token: string) {
    const { password, passwordConfirm } = accountPasswordDto;
    const hashedToken: string = createHash('sha256')
      .update(token)
      .digest('hex');

    const accountPassword = await this.accountPasswordRepository.findOne({
      where: {
        password_reset_token: hashedToken,
        password_reset_expires: MoreThan(new Date()),
      },
    });

    if (!accountPassword) {
      throw new BadRequestException(['Token is invalid or has expired']);
    }

    if (passwordConfirm !== password) {
      throw new BadRequestException(['Password does not match']);
    }

    const account = await this.accountRepository.findOne({
      where: { id: accountPassword.id },
    });

    account.verifier = Misc.calculateSRP6Verifier(
      account.username,
      password,
      account.salt,
    );
    await this.accountRepository.save(account);

    accountPassword.password_changed_at = new Date(Date.now() - 1000);
    accountPassword.password_reset_expires = null;
    accountPassword.password_reset_token = null;
    await this.accountPasswordRepository.save(accountPassword);

    return {
      status: 'success',
      message: ['Your password has been reset successfully!'],
    };
  }

  private static createToken(
    account: any,
    statusCode: number,
    response: Response,
  ): void {
    const token = sign(
      { id: account.id },
      process.env.JWT_SECRET_KEY as string,
      {
        expiresIn: Number(process.env.JWT_EXPIRES_IN) || '90d',
      },
    );

    delete account.salt;
    delete account.verifier;

    response.status(statusCode).json({ status: 'success', token, account });
  }
}
