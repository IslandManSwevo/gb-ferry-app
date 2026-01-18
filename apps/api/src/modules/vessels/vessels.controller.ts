import { Vessel, VesselDocument } from '@gbferry/database';
import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'nest-keycloak-connect';
import { VesselsService } from './vessels.service';

@ApiTags('vessels')
@ApiBearerAuth()
@Controller('vessels')
export class VesselsController {
  constructor(private readonly vesselsService: VesselsService) {}

  @Post()
  @Roles({ roles: ['realm:admin', 'realm:compliance_officer'] })
  @ApiOperation({ summary: 'Register a new vessel' })
  @ApiResponse({ status: 201, description: 'Vessel registered' })
  async create(@Body() createDto: any): Promise<Vessel> {
    return this.vesselsService.create(createDto);
  }

  @Get()
  @Roles({
    roles: [
      'realm:captain',
      'realm:admin',
      'realm:operations',
      'realm:compliance_officer',
      'realm:regulator',
    ],
  })
  @ApiOperation({ summary: 'List all vessels' })
  @ApiResponse({ status: 200, description: 'List of vessels' })
  async findAll(): Promise<{ items: Vessel[]; total: number }> {
    return this.vesselsService.findAll();
  }

  @Get(':id')
  @Roles({
    roles: [
      'realm:captain',
      'realm:admin',
      'realm:operations',
      'realm:compliance_officer',
      'realm:regulator',
    ],
  })
  @ApiOperation({ summary: 'Get vessel details including compliance status' })
  @ApiResponse({ status: 200, description: 'Vessel details' })
  async findOne(@Param('id') id: string): Promise<any> {
    return this.vesselsService.findOne(id);
  }

  @Put(':id')
  @Roles({ roles: ['realm:admin', 'realm:compliance_officer', 'realm:captain'] })
  @ApiOperation({ summary: 'Update vessel information' })
  @ApiResponse({ status: 200, description: 'Vessel updated' })
  async update(@Param('id') id: string, @Body() updateDto: any): Promise<Vessel> {
    return this.vesselsService.update(id, updateDto);
  }

  @Get(':id/documents')
  @Roles({ roles: ['realm:admin', 'realm:compliance_officer', 'realm:captain'] })
  @ApiOperation({ summary: 'Get wet-lease and registration documents' })
  @ApiResponse({ status: 200, description: 'List of vessel documents' })
  async getDocuments(
    @Param('id') id: string
  ): Promise<{ vesselId: string; documents: VesselDocument[] }> {
    return this.vesselsService.getDocuments(id);
  }

  @Post(':id/documents')
  @Roles({ roles: ['realm:admin', 'realm:compliance_officer', 'realm:captain'] })
  @ApiOperation({ summary: 'Upload a new document for the vessel' })
  @ApiResponse({ status: 201, description: 'Document uploaded' })
  async uploadDocument(@Param('id') id: string, @Body() documentDto: any): Promise<VesselDocument> {
    return this.vesselsService.uploadDocument(id, documentDto);
  }
}
