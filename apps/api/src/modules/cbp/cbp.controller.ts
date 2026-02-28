import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'nest-keycloak-connect';
import { CBPService } from './cbp.service';

@ApiTags('cbp')
@ApiBearerAuth()
@Controller('cbp')
export class CBPController {
  constructor(private readonly cbpService: CBPService) {}

  @Post('vessel/:vesselId/submit-crew-list')
  @Roles({ roles: ['realm:compliance_officer', 'realm:admin'] })
  @ApiOperation({ summary: 'Submit crew list and enoad to CBP' })
  @ApiResponse({ status: 201, description: 'CBP submission initiated' })
  async submitCrewList(
    @Param('vesselId') vesselId: string,
    @Body('formType') formType: 'I_418' | 'eNOAD'
  ): Promise<any> {
    // Ideally user context comes from request but mocked for now 'system_user'
    return this.cbpService.submitCrewList(vesselId, 'system_user', formType);
  }
}
