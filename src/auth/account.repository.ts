import { sign } from 'jsonwebtoken';
import { EntityRepository, Repository } from 'typeorm';

import { Account } from './account.entity';
import { AccountDto } from './dto/account.dto';
import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AccountPasswordDto } from './dto/account_password.dto';
import { AccountPassword } from './account_password.entity';
import { EmailDto } from './dto/email.dto';
import { Response } from 'express';
import { AccountBanned } from './account_banned.entity';
import { AccountInformation } from './account_information.entity';
import { Misc } from '../shared/misc';

@EntityRepository(Account)
export class AccountRepository extends Repository<Account> {
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
    const account = this.create();

    const emailExists = await this.findOne({ reg_mail: email });
    const phoneExists = await AccountInformation.findOne({ phone });

    if (emailExists) {
      throw new ConflictException(['Email address already exists']);
    }

    if (phoneExists) {
      throw new ConflictException(['Phone already exists']);
    }

    if (passwordConfirm !== password) {
      throw new BadRequestException(['Password does not match']);
    }

    account.username = username.toUpperCase();
    account.sha_pass_hash = await Misc.hashPassword(username, password);
    account.reg_mail = email.toUpperCase();

    try {
      await account.save();

      const accountInformation = new AccountInformation();
      accountInformation.id = account.id;
      accountInformation.first_name = firstName;
      accountInformation.last_name = lastName;
      accountInformation.phone = phone;
      await accountInformation.save();

      AccountRepository.createToken(account, HttpStatus.CREATED, response);
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
    const account = await this.findOne({ where: { username } });

    if (
      !account ||
      (await Misc.hashPassword(username, password)) !== account.sha_pass_hash
    ) {
      throw new UnauthorizedException(['Incorrect username or password']);
    }

    AccountRepository.createToken(account, HttpStatus.OK, response);
  }

  async updatePassword(
    accountPasswordDto: AccountPasswordDto,
    response: Response,
    accountId: number,
  ): Promise<void> {
    const { passwordCurrent, password, passwordConfirm } = accountPasswordDto;
    const account = await this.findOne({ where: { id: accountId } });

    if (
      (await Misc.hashPassword(account.username, passwordCurrent)) !==
      account.sha_pass_hash
    ) {
      throw new UnauthorizedException(['Your current password is wrong!']);
    }

    if (passwordConfirm !== password) {
      throw new BadRequestException(['Password does not match']);
    }

    account.v = '0';
    account.s = '0';
    account.sha_pass_hash = await Misc.hashPassword(account.username, password);
    await account.save();

    const accountPassword = new AccountPassword();
    accountPassword.id = account.id;
    accountPassword.password_changed_at = new Date(Date.now() - 1000);
    await accountPassword.save();

    AccountRepository.createToken(account, HttpStatus.OK, response);
  }

  async updateEmail(emailDto: EmailDto, accountId: number) {
    const { password, emailCurrent, email, emailConfirm } = emailDto;
    const account = await this.findOne({ where: { id: accountId } });

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
      (await Misc.hashPassword(account.username, password)) !==
      account.sha_pass_hash
    ) {
      throw new UnauthorizedException(['Your current password is wrong!']);
    }

    account.reg_mail = email.toUpperCase();
    await account.save();

    return {
      status: 'success',
      message: ['Your email has been changed successfully!'],
    };
  }

  async unban(accountId: number) {
    const accountBanned = await AccountBanned.findOne({
      where: { id: accountId, active: 1 },
    });

    if (!accountBanned) {
      throw new BadRequestException(['Your account is not banned!']);
    }

    await Misc.setCoin(10, accountId);

    accountBanned.active = 0;
    await accountBanned.save();

    return { status: 'success' };
  }

  private static createToken(
    account: any,
    statusCode: number,
    response: Response,
  ): void {
    const token = sign({ id: account.id }, process.env.JWT_SECRET_KEY, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    delete account.sha_pass_hash;
    delete account.v;
    delete account.s;

    response.status(statusCode).json({ status: 'success', token, account });
  }
}
