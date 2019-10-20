import { createParamDecorator } from '@nestjs/common';

export const Account = createParamDecorator((data, req) =>
{
    return data ? req.account[data] : req.account;
});
