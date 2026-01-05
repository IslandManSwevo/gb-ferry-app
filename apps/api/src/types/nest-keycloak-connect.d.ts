// Minimal module declarations to satisfy TypeScript when deep-importing nest-keycloak-connect internals
// Used by LoggingAuthGuard constructor injection

declare module 'keycloak-connect' {
  interface Keycloak {}
  const Keycloak: any;
  export = Keycloak;
}

declare module 'nest-keycloak-connect/dist/constants' {
  export const KEYCLOAK_CONNECT_OPTIONS: string;
  export const KEYCLOAK_INSTANCE: string;
  export const KEYCLOAK_LOGGER: string;
  export const KEYCLOAK_MULTITENANT_SERVICE: string;
}

declare module 'nest-keycloak-connect/dist/guards/auth.guard' {
  import { CanActivate, ExecutionContext } from '@nestjs/common';
  export class AuthGuard implements CanActivate {
    constructor(...args: any[]);
    canActivate(context: ExecutionContext): any;
  }
}

declare module 'nest-keycloak-connect/dist/interface/keycloak-connect-options.interface' {
  export interface KeycloakConnectConfig {
    [key: string]: any;
  }
}

declare module 'nest-keycloak-connect/dist/services/keycloak-multitenant.service' {
  export class KeycloakMultiTenantService {}
}
