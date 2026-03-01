import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PscRiskResponse } from './psc-risk.dto';
import { PscRiskService } from './psc-risk.service';

@ApiTags('PSC Compliance')
@Controller('psc')
export class PscRiskController {
  constructor(private readonly pscRiskService: PscRiskService) {}

  @Get('risk/:vesselId')
  @ApiOperation({ summary: 'Calculate PSC Risk Score for a vessel' })
  @ApiResponse({ status: 200, type: PscRiskResponse })
  async getRiskScore(@Param('vesselId') vesselId: string): Promise<PscRiskResponse> {
    return this.pscRiskService.calculateRiskScore(vesselId);
  }
}
