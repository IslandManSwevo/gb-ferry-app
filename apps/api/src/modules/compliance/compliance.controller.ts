import { Inspection } from '@gbferry/database';
import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Roles } from 'nest-keycloak-connect';
import { AuditService } from '../audit/audit.service';
import { ComplianceAdapterService } from './compliance-adapter.service';
import { ComplianceService } from './compliance.service';

@ApiTags('compliance')
@ApiBearerAuth()
@Controller('compliance')
export class ComplianceController {
  constructor(
    private readonly complianceService: ComplianceService,
    private readonly adapterService: ComplianceAdapterService,
    private readonly auditService: AuditService
  ) {}

  @Get('inspections')
  @Roles({ roles: ['realm:compliance_officer', 'realm:admin', 'realm:regulator'] })
  @ApiOperation({ summary: 'List all vessel inspections' })
  @ApiQuery({ name: 'vesselId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'List of inspections' })
  async findAllInspections(
    @Query('vesselId') vesselId?: string,
    @Query('status') status?: string
  ): Promise<any> {
    return this.complianceService.findAllInspections({ vesselId, status });
  }

  @Get('dashboard')
  @Roles({ roles: ['realm:compliance_officer', 'realm:admin'] })
  @ApiOperation({ summary: 'Get compliance dashboard overview' })
  @ApiResponse({ status: 200, description: 'Compliance dashboard data' })
  async getDashboard() {
    return this.complianceService.getDashboard();
  }

  @Get('reports')
  @Roles({ roles: ['realm:compliance_officer', 'realm:admin', 'realm:regulator'] })
  @ApiOperation({ summary: 'List available compliance reports' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'List of reports' })
  async getReports(
    @Query('type') type?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ): Promise<any> {
    return this.complianceService.getReports({ type, dateFrom, dateTo });
  }

  @Get('export/manifest/:manifestId')
  @Roles({ roles: ['realm:compliance_officer', 'realm:admin'] })
  @ApiOperation({ summary: 'Export manifest in regulatory format' })
  @ApiQuery({ name: 'format', enum: ['csv', 'xlsx', 'pdf', 'xml'] })
  @ApiQuery({ name: 'jurisdiction', enum: ['bahamas', 'jamaica', 'barbados'], required: false })
  @ApiResponse({ status: 200, description: 'Exported file' })
  async exportManifest(
    @Param('manifestId') manifestId: string,
    @Query('format') format: string,
    @Query('jurisdiction') jurisdiction: string = 'bahamas',
    @Res() res: Response
  ) {
    const exported = await this.adapterService.exportManifest(manifestId, format, jurisdiction);

    try {
      await this.auditService.logDataExport({
        entityType: 'Manifest',
        entityId: manifestId,
        details: {
          action: 'MANIFEST_EXPORTED',
          format,
          jurisdiction,
        },
        reason: 'Compliance manifest export',
      });
    } catch (err) {
      console.error('Audit log failed for MANIFEST_EXPORTED', err);
    }

    res.setHeader('Content-Type', exported.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
    res.send(exported.data);
  }

  @Get('export/crew-compliance/:vesselId')
  @Roles({ roles: ['realm:compliance_officer', 'realm:admin'] })
  @ApiOperation({ summary: 'Export crew compliance pack for a vessel' })
  @ApiQuery({ name: 'format', enum: ['pdf', 'xlsx'] })
  @ApiResponse({ status: 200, description: 'Crew compliance pack' })
  async exportCrewCompliance(
    @Param('vesselId') vesselId: string,
    @Query('format') format: string,
    @Res() res: Response
  ) {
    const exported = await this.adapterService.exportCrewCompliance(vesselId, format);

    try {
      await this.auditService.logDataExport({
        entityType: 'Vessel',
        entityId: vesselId,
        details: {
          action: 'CREW_EXPORT',
          format,
          pack: 'crew-compliance',
        },
        reason: 'Crew compliance export',
      });
    } catch (err) {
      console.error('Audit log failed for CREW_EXPORT', err);
    }

    res.setHeader('Content-Type', exported.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
    res.send(exported.data);
  }

  @Post('inspections')
  @Roles({ roles: ['realm:compliance_officer', 'realm:admin'] })
  @ApiOperation({ summary: 'Record an inspection event' })
  @ApiResponse({ status: 201, description: 'Inspection recorded' })
  async recordInspection(@Body() inspectionDto: any): Promise<Inspection> {
    return this.complianceService.recordInspection(inspectionDto);
  }
}
