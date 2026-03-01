import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FleetAnalyticsService } from './fleet-analytics.service';

@ApiTags('fleet-analytics')
@ApiBearerAuth()
@Controller('fleet-analytics')
export class FleetAnalyticsController {
  constructor(private readonly analyticsService: FleetAnalyticsService) {}

  @Get('trends')
  @ApiOperation({ summary: 'Monthly PSC compliance trends (pass rate, deficiency counts)' })
  @ApiQuery({
    name: 'months',
    required: false,
    description: 'Number of months to look back (default: 6)',
  })
  @ApiResponse({ status: 200, description: 'Monthly compliance trend series' })
  async getTrends(@Query('months') months?: string) {
    return this.analyticsService.getComplianceTrends(months ? parseInt(months, 10) : 6);
  }

  @Get('vessel-scores')
  @ApiOperation({ summary: 'Composite 0–100 performance score per vessel' })
  @ApiResponse({ status: 200, description: 'List of vessels with performance scores' })
  async getVesselScores() {
    return this.analyticsService.getVesselPerformanceScores();
  }

  @Get('forecast')
  @ApiOperation({ summary: 'Certification expiry forecast (30/60/90-day buckets)' })
  @ApiResponse({ status: 200, description: 'Certification pipeline forecast' })
  async getForecast() {
    return this.analyticsService.getCertificationForecast();
  }
}
