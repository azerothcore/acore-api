import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Account = createParamDecorator((data, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return data ? req.account[data] : req.account;
});
