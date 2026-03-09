import { PrismaService } from '@gbferry/database';
import { Injectable, Logger } from '@nestjs/common';

interface AuditLogFilters {
  entityType?: string;
  entityId?: string;
  action?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  limit: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  private getPrimaryRole(roles?: string[]): string {
    if (!roles || roles.length === 0) return 'user';
    return roles[0] || 'user';
  }

  async resolveOrCreateUserFromKeycloak(params: {
    keycloakId: string;
    email?: string;
    preferredUsername?: string;
    firstName?: string;
    lastName?: string;
    roles?: string[];
  }): Promise<{ id: string; email: string; role: string } | null> {
    try {
      const role = this.getPrimaryRole(params.roles);
      const synthesizedEmail = `${params.keycloakId}@keycloak.local`;
      const effectiveEmail = params.email || synthesizedEmail;

      const existingByKeycloak = await this.prisma.user.findUnique({
        where: { keycloakId: params.keycloakId },
        select: { id: true, email: true, role: true },
      });

      if (existingByKeycloak) {
        const updated = await this.prisma.user.update({
          where: { keycloakId: params.keycloakId },
          data: {
            ...(params.email ? { email: params.email } : {}),
            ...(params.firstName ? { firstName: params.firstName } : {}),
            ...(params.lastName ? { lastName: params.lastName } : {}),
            role,
            isActive: true,
          },
          select: { id: true, email: true, role: true },
        });

        return updated;
      }

      if (params.email) {
        const existingByEmail = await this.prisma.user.findUnique({
          where: { email: params.email },
          select: { id: true },
        });

        if (existingByEmail) {
          const relinked = await this.prisma.user.update({
            where: { email: params.email },
            data: {
              keycloakId: params.keycloakId,
              ...(params.firstName ? { firstName: params.firstName } : {}),
              ...(params.lastName ? { lastName: params.lastName } : {}),
              role,
              isActive: true,
            },
            select: { id: true, email: true, role: true },
          });

          return relinked;
        }
      }

      const created = await this.prisma.user.create({
        data: {
          keycloakId: params.keycloakId,
          email: effectiveEmail,
          firstName: params.firstName,
          lastName: params.lastName,
          role,
          isActive: true,
        },
        select: { id: true, email: true, role: true },
      });

      return created;
    } catch (error) {
      this.logger.error('User mapping from Keycloak failed:', error);
      return null;
    }
  }

  async log(entry: {
    entityType: string;
    entityId?: string;
    entityName?: string;
    action: string;
    actionDescription?: string;
    userId?: string;
    userName?: string;
    userRole?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: any;
    previousValue?: any;
    newValue?: any;
    changedFields?: string[];
    reason?: string;
    compliance?: string;
  }): Promise<any> {
    try {
      const metadata = {
        ...(entry.details || {}),
        ...(entry.compliance ? { compliance: entry.compliance } : {}),
      };

      // FIX-05: Recursive redaction to prevent PII leakage in deep objects
      this.redactSensitiveData(metadata);

      let resolvedUserId: string;
      let resolvedUserName: string;
      let resolvedUserRole: string;

      if (entry.userId && entry.userId !== 'system') {
        const user = await this.prisma.user.findUnique({
          where: { id: entry.userId },
        });

        if (user) {
          resolvedUserId = user.id;
          resolvedUserName = entry.userName || user.email || 'Unknown';
          resolvedUserRole = entry.userRole || user.role || 'user';
        } else {
          const unmappedUser = await this.resolveUnmappedUser();
          resolvedUserId = unmappedUser.id;
          resolvedUserName = entry.userName || 'Unmapped User';
          resolvedUserRole = entry.userRole || 'unmapped';
        }
      } else {
        const systemUser = await this.resolveSystemUser();
        resolvedUserId = systemUser.id;
        resolvedUserName = entry.userName || 'System';
        resolvedUserRole = entry.userRole || 'system';
      }

      const auditEntry = await this.prisma.auditLog.create({
        data: {
          entityType: entry.entityType,
          entityId: entry.entityId || '',
          entityName: entry.entityName,
          action: entry.action as any,
          actionDescription: entry.actionDescription,
          userId: resolvedUserId,
          userName: resolvedUserName,
          userRole: resolvedUserRole,
          ipAddress: entry.ipAddress || 'unknown',
          userAgent: entry.userAgent || 'unknown',
          previousValue: entry.previousValue,
          newValue: entry.newValue,
          changedFields: entry.changedFields || [],
          reason: entry.reason,
          metadata: this.safeMetadata(metadata),
          timestamp: new Date(),
        },
      });
      return auditEntry;
    } catch (error) {
      // Audit should not crash the main transaction
      this.logger.error('Audit log persistence failed:', error);
      return null;
    }
  }

  /**
   * Returns a sanitized, circular-safe version of the metadata object.
   * Handles BigInt serialization and prevents Infinite recursion.
   */
  private safeMetadata(obj: any): any {
    try {
      const seen = new WeakSet();
      const stringified = JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) return '[Circular]';
          seen.add(value);
        }
        if (typeof value === 'bigint') return value.toString();
        return value;
      });
      return JSON.parse(stringified);
    } catch (err) {
      this.logger.warn('Failed to safely stringify metadata, using fallback', err);
      return { _error: 'Unserializable metadata', _raw: String(obj).slice(0, 500) };
    }
  }

  private async resolveSystemUser(): Promise<{ id: string; email: string; role: string }> {
    const SYSTEM_KEYCLOAK_ID = 'SYSTEM_AUDIT_USER';
    const SYSTEM_EMAIL = 'system@gbferry.internal';

    return this.findOrCreateAuditUser(
      SYSTEM_KEYCLOAK_ID,
      SYSTEM_EMAIL,
      'System',
      'Audit',
      'system'
    );
  }

  private async resolveUnmappedUser(): Promise<{ id: string; email: string; role: string }> {
    const UNMAPPED_KEYCLOAK_ID = 'UNMAPPED_AUDIT_USER';
    const UNMAPPED_EMAIL = 'unmapped@gbferry.internal';

    return this.findOrCreateAuditUser(
      UNMAPPED_KEYCLOAK_ID,
      UNMAPPED_EMAIL,
      'Unmapped',
      'User',
      'unmapped'
    );
  }

  private async findOrCreateAuditUser(
    keycloakId: string,
    email: string,
    firstName: string,
    lastName: string,
    role: string
  ): Promise<{ id: string; email: string; role: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { keycloakId },
      select: { id: true, email: true, role: true },
    });

    if (existing) return existing;

    return this.prisma.user.create({
      data: {
        keycloakId,
        email,
        firstName,
        lastName,
        role,
        isActive: true,
      },
      select: { id: true, email: true, role: true },
    });
  }

  /**
   * Recursively redacts sensitive keys from an object.
   * Protects against circular references via WeakSet.
   * Only iterates own properties using Object.keys.
   */
  private redactSensitiveData(obj: any, visited = new WeakSet()): void {
    if (!obj || typeof obj !== 'object') return;
    if (visited.has(obj)) return;

    visited.add(obj);

    const sensitiveKeys = [
      'passportNumber',
      'visaNumber',
      'alienRegistrationNumber',
      'password',
      'token',
      'secret',
      'ssn',
      'dob',
      'dateOfBirth',
    ];

    Object.keys(obj).forEach((key) => {
      const val = obj[key];
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk.toLowerCase()))) {
        obj[key] = '***REDACTED***';
      } else if (val && typeof val === 'object') {
        this.redactSensitiveData(val, visited);
      }
    });
  }

  async logAuthFailure(params: {
    userId?: string;
    userName?: string;
    ipAddress?: string;
    userAgent?: string;
    reason?: string;
  }): Promise<any> {
    return this.log({
      action: 'FAILED_LOGIN',
      entityType: 'auth',
      userId: params.userId,
      userName: params.userName,
      ipAddress: params.ipAddress || 'unknown',
      userAgent: params.userAgent || 'unknown',
      reason: params.reason,
      compliance: 'Authentication failure logged for security monitoring (Audit-Ready)',
    });
  }

  async logDataExport(params: {
    entityType: string;
    entityId?: string;
    userId?: string;
    userName?: string;
    ipAddress?: string;
    userAgent?: string;
    reason?: string;
    details?: any;
  }): Promise<any> {
    return this.log({
      action: 'DATA_EXPORT',
      entityType: params.entityType,
      entityId: params.entityId,
      userId: params.userId,
      userName: params.userName,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      reason: params.reason,
      details: params.details,
      compliance: 'Data export logged for regulator visibility',
    });
  }

  async getAuditLog(filters: AuditLogFilters): Promise<any> {
    const skip = (filters.page - 1) * filters.limit;

    const whereClause = {
      ...(filters.entityType && { entityType: filters.entityType }),
      ...(filters.entityId && { entityId: filters.entityId }),
      ...(filters.action && { action: filters.action as any }),
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.dateFrom && {
        timestamp: {
          gte: new Date(filters.dateFrom),
        },
      }),
      ...(filters.dateTo && {
        timestamp: {
          lte: new Date(filters.dateTo),
        },
      }),
    };

    const logs = await this.prisma.auditLog.findMany({
      where: whereClause as any,
      orderBy: { timestamp: 'desc' },
      skip,
      take: filters.limit,
    });

    const total = await this.prisma.auditLog.count({
      where: whereClause as any,
    });

    return {
      data: logs,
      total,
      page: filters.page,
      limit: filters.limit,
      pages: Math.ceil(total / filters.limit),
      filters: {
        entityType: filters.entityType,
        action: filters.action,
        dateRange: {
          from: filters.dateFrom,
          to: filters.dateTo,
        },
      },
    };
  }

  async getExportHistory(): Promise<any> {
    const exports = await this.prisma.auditLog.findMany({
      where: {
        action: {
          in: ['MANIFEST_EXPORTED', 'CREW_EXPORT', 'DATA_EXPORT'] as any,
        },
      } as any,
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    return {
      data: exports,
      total: exports.length,
    };
  }

  async getEntityHistory(entityType: string, entityId: string): Promise<any> {
    const history = await this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { timestamp: 'asc' },
    });

    return {
      entityType,
      entityId,
      history,
      totalEvents: history.length,
    };
  }
}
