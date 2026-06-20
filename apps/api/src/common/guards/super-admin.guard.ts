import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtPayload } from '../decorators/current-user.decorator';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user: JwtPayload = req.user;
    if (!user || user.role !== 'super_admin') {
      throw new ForbiddenException('Accès réservé à PUKRI AI Systems');
    }
    return true;
  }
}
