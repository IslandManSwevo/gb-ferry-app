import { AuditAction } from '@gbferry/database';
import { BadRequestException, Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser, type KeycloakUser } from '../auth/current-user.decorator';
import { AuditService } from './audit.service';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  private normalizeAuditAction(action: unknown): AuditAction {
    if (typeof action !== 'string') return AuditAction.READ;

    const values = Object.values(AuditAction) as string[];
    if (values.includes(action)) return action as AuditAction;

    return AuditAction.READ;
  }

  @Post()
  @ApiOperation({ summary: 'Create an audit log entry' })
  @ApiResponse({ status: 201, description: 'Audit log entry created' })
  @ApiResponse({ status: 400, description: 'Invalid audit payload or missing user claims' })
  async createAuditLog(
    @Body()
    body: {
      entityType?: string;
      entityId?: string;
      entityName?: string;
      action?: string;
      actionDescription?: string;
      details?: any;
      previousValue?: any;
      newValue?: any;
      changedFields?: string[];
      reason?: string;
      compliance?: string;
    },
    @CurrentUser() user: KeycloakUser,
    @Req() req: Request
  ): Promise<any> {
    if (!body?.entityType) {
      throw new BadRequestException('entityType is required');
    }

    const keycloakId = user?.sub;
    const email = user?.email;

    if (!keycloakId) {
      throw new BadRequestException('Missing Keycloak subject (sub)');
    }

    // Email is preferred for stable identity, but may be absent if Keycloak client scopes
    // don't include it. We fall back to a synthetic email derived from `sub`.
    const effectiveEmail = email || `${keycloakId}@keycloak.local`;

    const mappedUser = await this.auditService.resolveOrCreateUserFromKeycloak({
      keycloakId,
      email: email || undefined,
      preferredUsername: user?.preferredUsername,
      firstName: user?.givenName,
      lastName: user?.familyName,
      roles: user?.roles,
    });

    if (!mappedUser) {
      throw new BadRequestException('Unable to map authenticated user');
    }

    const action = this.normalizeAuditAction(body.action);

    const forwardedFor = (req.headers['x-forwarded-for'] as string | undefined)
      ?.split(',')[0]
      ?.trim();
    const ipAddress = forwardedFor || req.ip;
    const userAgent = req.headers['user-agent'] as string | undefined;
    const userRole = user?.roles?.[0] || mappedUser.role || 'user';
    const userName = user?.preferredUsername || user?.name || effectiveEmail;

    const result = await this.auditService.log({
      entityType: body.entityType,
      entityId: body.entityId,
      entityName: body.entityName,
      action,
      actionDescription: body.actionDescription,
      userId: mappedUser.id,
      userName,
      userRole,
      ipAddress,
      userAgent,
      details: body.details,
      previousValue: body.previousValue,
      newValue: body.newValue,
      changedFields: body.changedFields,
      reason: body.reason,
      compliance: body.compliance,
    });

    return result;
  }

  @Get()
  @ApiOperation({ summary: 'Get audit log entries' })
  @ApiQuery({
    name: 'entityType',
    required: false,
    enum: ['passenger', 'crew', 'vessel', 'manifest', 'certification'],
  })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({
    name: 'action',
    required: false,
    enum: ['create', 'update', 'delete', 'export', 'approve'],
  })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Audit log entries' })
  async getAuditLog(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<any> {
    return this.auditService.getAuditLog({
      entityType,
      entityId,
      action,
      userId,
      dateFrom,
      dateTo,
      page: page || 1,
      limit: limit || 50,
    });
  }

  @Get('exports')
  @ApiOperation({ summary: 'Get data export history (for regulator review)' })
  @ApiResponse({ status: 200, description: 'Export history' })
  async getExportHistory(): Promise<any> {
    return this.auditService.getExportHistory();
  }
}
