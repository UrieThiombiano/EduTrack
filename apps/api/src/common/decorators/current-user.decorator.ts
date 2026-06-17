import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export interface JwtPayload { sub: number; email: string; role: string; etablissementId: number; }
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest().user as JwtPayload;
    return data ? user?.[data] : user;
  },
);
