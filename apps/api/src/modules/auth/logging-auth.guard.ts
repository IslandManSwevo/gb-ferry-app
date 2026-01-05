import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from 'nest-keycloak-connect';
import { AuditService } from '../audit/audit.service';

/**
 * Auth guard that logs authentication failures for security monitoring.
 */
@Injectable()
export class LoggingAuthGuard extends AuthGuard {
  constructor(private readonly auditService: AuditService) {
    super();
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext, status?: any) {
    if (err || !user) {
      const request: any = context.switchToHttp().getRequest();
      const ipAddress = request?.ip;
      const userAgent = request?.headers?.['user-agent'];
      const userName = user?.preferred_username || user?.email;
      const reason = err?.message || info?.message || 'unauthorized';

      // Fire-and-forget; auth should still return the original error
      this.auditService
        .logAuthFailure({ userId: undefined, userName, ipAddress, userAgent, reason })
        .catch(() => undefined);
    }

    return super.handleRequest(err, user, info, context, status);
  }
}
