import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserRole, AccountType } from '../../database/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ACCOUNT_TYPE_KEY } from '../decorators/account-type.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles and account types from metadata
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredAccountTypes = this.reflector.getAllAndOverride<AccountType[]>(
      ACCOUNT_TYPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles or account types are required, allow access
    if (!requiredRoles && !requiredAccountTypes) {
      return true;
    }

    // Get user from request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Check account type requirements
    if (requiredAccountTypes && !requiredAccountTypes.includes(user.accountType)) {
      return false;
    }

    // Check role requirements
    if (requiredRoles && !requiredRoles.includes(user.role)) {
      return false;
    }

    return true;
  }
}