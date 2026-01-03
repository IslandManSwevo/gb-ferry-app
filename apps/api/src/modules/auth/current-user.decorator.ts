import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * User information extracted from Keycloak token
 */
export interface KeycloakUser {
  sub: string;           // Keycloak user ID
  email: string;
  emailVerified: boolean;
  name: string;
  preferredUsername: string;
  givenName: string;
  familyName: string;
  roles: string[];       // Realm roles
}

/**
 * Decorator to extract the current authenticated user from the request
 * 
 * Usage:
 * @Get('profile')
 * getProfile(@CurrentUser() user: KeycloakUser) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof KeycloakUser | undefined, ctx: ExecutionContext): KeycloakUser | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as KeycloakUser;

    if (!user) {
      return null;
    }

    // If a specific property is requested, return just that
    if (data) {
      return user[data];
    }

    return user;
  },
);
