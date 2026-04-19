import { ROLES_KEY } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enums/roles.enum';
import {
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }
  canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    console.log('requiredRoles', requiredRoles);
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (info && info?.name === 'TokenExpiredError') {
      throw new HttpException(`Token is expired`, 401);
    }
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
