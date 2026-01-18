import { ExecutionContext, Inject, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AuthGuard,
  KEYCLOAK_CONNECT_OPTIONS,
  KEYCLOAK_INSTANCE,
  KEYCLOAK_LOGGER,
  KEYCLOAK_MULTITENANT_SERVICE,
  KeycloakConnectConfig,
  KeycloakMultiTenantService,
} from 'nest-keycloak-connect';
import { AuditService } from '../audit/audit.service';

/**
 * Auth guard that logs authentication failures for security monitoring.
 */
@Injectable()
export class LoggingAuthGuard extends AuthGuard {
  constructor(
    @Inject(KEYCLOAK_INSTANCE) singleTenant: any,
    @Inject(KEYCLOAK_CONNECT_OPTIONS) keycloakOpts: KeycloakConnectConfig,
    @Inject(KEYCLOAK_LOGGER) logger: Logger,
    @Inject(KEYCLOAK_MULTITENANT_SERVICE) multiTenant: KeycloakMultiTenantService,
    reflector: Reflector,
    private readonly auditService: AuditService
  ) {
    super(singleTenant, keycloakOpts, logger, multiTenant, reflector);
  }

  private extractClientIp(request: any): string | undefined {
    const headers = request?.headers || {};
    const xfwd = headers['x-forwarded-for'] || headers['X-Forwarded-For'];
    const xreal = headers['x-real-ip'] || headers['X-Real-IP'];
    const forwarded = Array.isArray(xfwd) ? xfwd.join(',') : xfwd;
    const parsedForwarded = forwarded
      ? forwarded
          .split(',')
          .map((v: string) => v.trim())
          .filter((v: string) => v)
      : [];
    return (
      parsedForwarded[0] || (typeof xreal === 'string' ? xreal.trim() : undefined) || request?.ip
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: any = context.switchToHttp().getRequest();
    const headers = request?.headers || {};

    try {
      const result = (await super.canActivate(context)) as boolean;

      // If result is truthy but user is absent, log a soft failure
      const user = request?.user;
      if (!user) {
        const ipAddress = this.extractClientIp(request);
        const userAgent = headers['user-agent'] || headers['User-Agent'];
        this.auditService
          .logAuthFailure({
            userId: undefined,
            userName: undefined,
            ipAddress,
            userAgent,
            reason: 'unauthorized',
          })
          .catch(() => undefined);
      }

      return result;
    } catch (err: any) {
      const user = request?.user;
      const ipAddress = this.extractClientIp(request);
      const userAgent = headers['user-agent'] || headers['User-Agent'];
      const userName = user?.preferred_username || user?.email;
      const userId = user?.sub || user?.id || user?.userId || user?.preferred_username;
      const reason = err?.message || 'unauthorized';

      this.auditService
        .logAuthFailure({ userId, userName, ipAddress, userAgent, reason })
        .catch(() => undefined);

      throw err;
    }
  }
}
