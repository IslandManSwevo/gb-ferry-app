import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PscRiskResponse } from './psc-risk.dto';
import { PscRiskService } from './psc-risk.service';

@ApiTags('PSC Compliance')
@Controller('psc')
export class PscRiskController {
  constructor(private readonly pscRiskService: PscRiskService) {}

  @Get('risk/:vesselId')
  @ApiOperation({ summary: 'Calculate PSC Risk Score for a vessel' })
  @ApiQuery({ name: 'referenceDate', required: false, description: 'Point-in-time for calculation (ISO format)' })
  @ApiResponse({ status: 200, type: PscRiskResponse })
  async getRiskScore(
    @Param('vesselId') vesselId: string,
    @Query('referenceDate') referenceDate?: string
  ): Promise<PscRiskResponse> {
    const refDate = referenceDate ? new Date(referenceDate) : new Date();
    return this.pscRiskService.calculateRiskScore(vesselId, refDate);
  }
}
