import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CrewService } from './crew.service';

@ApiTags('crew-certifications')
@ApiBearerAuth()
@Controller('crew/certifications')
export class CertificationsController {
  constructor(private readonly crewService: CrewService) {}

  @Get()
  @ApiOperation({ summary: 'List certifications across crew members' })
  @ApiQuery({ name: 'crewId', required: false })
  @ApiResponse({ status: 200, description: 'List of certifications' })
  async findAll(@Query('crewId') crewId?: string): Promise<any[]> {
    // We can reuse the CrewService findAll and extract certifications to match the frontend shape
    const { data: crewMembers } = await this.crewService.findAll({} as any, 'system');

    const allCerts: any[] = [];
    crewMembers.forEach((crew) => {
      if (crewId && crew.id !== crewId) return;

      if (crew.certifications && Array.isArray(crew.certifications)) {
        crew.certifications.forEach((cert: any) => {
          allCerts.push({
            id: cert.id,
            crewName: `${crew.familyName} ${crew.givenNames}`,
            type: cert.type,
            certificateNumber: cert.certificateNumber,
            issuingAuthority: cert.issuingAuthority,
            issueDate: cert.issueDate,
            expiryDate: cert.expiryDate,
            status: cert.status,
          });
        });
      }
    });

    return allCerts;
  }
}
