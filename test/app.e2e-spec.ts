import 'dotenv/config';
import * as request from 'supertest';
import { AccountDto } from '../src/auth/dto/account.dto';
import { HttpStatus } from '@nestjs/common';

const app = 'http://localhost:3000';

describe('Auth', () =>
{
    const account: AccountDto =
    {
        username: 'AzerothJS',
        firstName: 'Azeroth',
        lastName: 'API',
        phone: '+989171111111',
        password: 'Azer0thjs!@',
        passwordConfirm: 'Azer0thjs!@',
        email: 'Azeroth@Example.com'
    };

    it('Should SignUp Account', () =>
    {
        return request(app)
            .post('/auth/signup')
            .set('Accept', 'application/json')
            .send(account)
            .expect(HttpStatus.CREATED);
    });

    it('Should Reject Duplicate Account, Email, Phone', () =>
    {
        return request(app)
            .post('/auth/signup')
            .set('Accept', 'application/json')
            .send(account)
            .expect(HttpStatus.CONFLICT);
    });

    it('Should SignIn Account', () =>
    {
        return request(app)
            .post('/auth/signin')
            .set('Accept', 'application/json')
            .send({ username: account.username, password: account.password })
            .expect(HttpStatus.OK);
    });
});
