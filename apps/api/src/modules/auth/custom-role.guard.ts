import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

const META_ROLES = 'roles';

/**
 * Custom RoleGuard that checks roles from the custom 'roles' claim in the JWT token.
 * This is needed because our Keycloak realm puts roles in 'roles' claim instead of 'realm_access.roles'.
 */
@Injectable()
export class CustomRoleGuard implements CanActivate {
  private readonly logger = new Logger(CustomRoleGuard.name);

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get roles metadata from decorator
    const rolesMetadata = this.reflector.getAllAndOverride<{ roles: string[] }>(META_ROLES, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles decorator, allow access
    if (!rolesMetadata || !rolesMetadata.roles || rolesMetadata.roles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('No user found in request');
      return false;
    }

    // Get roles from user - these come from the custom 'roles' claim in the JWT
    const userRoles: string[] = user.roles || [];
    this.logger.verbose(`User roles from token: ${JSON.stringify(userRoles)}`);

    // Get required roles from decorator, stripping 'realm:' prefix if present
    const requiredRoles = rolesMetadata.roles.map((role: string) => {
      // Strip 'realm:' prefix if present since our custom claim doesn't use it
      return role.startsWith('realm:') ? role.substring(6) : role;
    });
    this.logger.verbose(`Required roles (normalized): ${JSON.stringify(requiredRoles)}`);

    // Check if user has any of the required roles (ANY matching mode)
    const hasRole = requiredRoles.some((requiredRole: string) => userRoles.includes(requiredRole));

    if (hasRole) {
      this.logger.verbose('Access granted - user has required role');
    } else {
      this.logger.verbose('Access denied - user does not have required role');
    }

    return hasRole;
  }
}
