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
import { CrewService } from './crew.service';

@ApiTags('crew')
@ApiBearerAuth()
@Controller('crew')
export class CrewController {
  constructor(private readonly crewService: CrewService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new crew member' })
  @ApiResponse({ status: 201, description: 'Crew member created' })
  async create(@Body() createDto: any): Promise<any> {
    return this.crewService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'List crew members with filters' })
  @ApiQuery({ name: 'vesselId', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'certStatus', required: false, enum: ['valid', 'expiring', 'expired'] })
  @ApiResponse({ status: 200, description: 'List of crew members' })
  async findAll(
    @Query('vesselId') vesselId?: string,
    @Query('role') role?: string,
    @Query('certStatus') certStatus?: string,
  ): Promise<any> {
    return this.crewService.findAll({ vesselId, role, certStatus });
  }

  @Get('roster/:vesselId')
  @ApiOperation({ summary: 'Get crew roster for a specific vessel' })
  @ApiResponse({ status: 200, description: 'Crew roster with safe manning compliance' })
  async getRoster(@Param('vesselId') vesselId: string): Promise<any> {
    return this.crewService.getRoster(vesselId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get crew member details' })
  @ApiResponse({ status: 200, description: 'Crew member details with certifications' })
  async findOne(@Param('id') id: string): Promise<any> {
    return this.crewService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update crew member information' })
  @ApiResponse({ status: 200, description: 'Crew member updated' })
  async update(@Param('id') id: string, @Body() updateDto: any): Promise<any> {
    return this.crewService.update(id, updateDto);
  }
}
