import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { CertificationsService } from './certifications.service';

@ApiTags('crew')
@ApiBearerAuth()
@Controller('certifications')
export class CertificationsController {
  constructor(private readonly certificationsService: CertificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a certification to a crew member' })
  @ApiResponse({ status: 201, description: 'Certification added' })
  async create(@Body() createDto: any): Promise<any> {
    return this.certificationsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'List certifications with expiry filters' })
  @ApiQuery({ name: 'crewId', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'expiringWithinDays', required: false })
  @ApiResponse({ status: 200, description: 'List of certifications' })
  async findAll(
    @Query('crewId') crewId?: string,
    @Query('type') type?: string,
    @Query('expiringWithinDays') expiringWithinDays?: number,
  ): Promise<any> {
    return this.certificationsService.findAll({ crewId, type, expiringWithinDays });
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get certifications expiring within 30 days' })
  @ApiResponse({ status: 200, description: 'List of expiring certifications' })
  async getExpiring(): Promise<any> {
    return this.certificationsService.getExpiring();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get certification details' })
  @ApiResponse({ status: 200, description: 'Certification details' })
  async findOne(@Param('id') id: string): Promise<any> {
    return this.certificationsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update certification (e.g., renewal)' })
  @ApiResponse({ status: 200, description: 'Certification updated' })
  async update(@Param('id') id: string, @Body() updateDto: any): Promise<any> {
    return this.certificationsService.update(id, updateDto);
  }
}
