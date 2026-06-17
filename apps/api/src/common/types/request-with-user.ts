import { Request } from 'express';
import { JwtPayload } from '../decorators/current-user.decorator';

export interface RequestWithUser extends Request {
  user: JwtPayload;
}
