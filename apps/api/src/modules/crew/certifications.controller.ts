import { Certification } from '@gbferry/database';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'nest-keycloak-connect';
import { CurrentUser, KeycloakUser } from '../auth/current-user.decorator';
import { CertificationsService } from './certifications.service';

@ApiTags('crew-certifications')
@ApiBearerAuth()
@Controller('crew/certifications')
export class CertificationsController {
  constructor(private readonly certificationsService: CertificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List certifications across crew members' })
  @ApiQuery({ name: 'crewId', required: false })
  @ApiResponse({ status: 200, description: 'List of certifications' })
  async findAll(@Query('crewId') crewId?: string): Promise<any[]> {
    const { data } = await this.certificationsService.findAll({ crewId });
    return data.map((cert: any) => ({
      id: cert.id,
      crewName: `${cert.crew?.familyName || 'Unknown'} ${cert.crew?.givenNames || ''}`,
      type: cert.type,
      certificateNumber: cert.certificateNumber,
      issuingAuthority: cert.issuingAuthority,
      issueDate: cert.issueDate,
      expiryDate: cert.expiryDate,
      status: cert.status,
    }));
  }

  @Get('verification-queue')
  @Roles({ roles: ['COMPLIANCE_OFFICER', 'ADMIN', 'SUPERADMIN'] })
  @ApiOperation({ summary: 'Get certifications awaiting verification' })
  async getVerificationQueue() {
    return this.certificationsService.getPendingVerificationQueue();
  }

  @Post(':id/verify')
  @Roles({ roles: ['COMPLIANCE_OFFICER', 'ADMIN', 'SUPERADMIN'] })
  @ApiOperation({ summary: 'Verify a certification' })
  async verifyCertification(
    @Param('id') certId: string,
    @Body() body: any,
    @CurrentUser() user: KeycloakUser
  ): Promise<Certification> {
    return this.certificationsService.verifyCertification(certId, user.sub, body.corrections);
  }

  @Post(':id/reject')
  @Roles({ roles: ['COMPLIANCE_OFFICER', 'ADMIN', 'SUPERADMIN'] })
  @ApiOperation({ summary: 'Reject a certification' })
  async rejectCertification(
    @Param('id') certId: string,
    @Body() body: any,
    @CurrentUser() user: KeycloakUser
  ): Promise<void> {
    return this.certificationsService.rejectCertification(certId, user.sub, body.reason);
  }
}
