import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Put,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { VesselsService } from './vessels.service';

@ApiTags('vessels')
@ApiBearerAuth()
@Controller('vessels')
export class VesselsController {
  constructor(private readonly vesselsService: VesselsService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new vessel' })
  @ApiResponse({ status: 201, description: 'Vessel registered' })
  async create(@Body() createDto: any) {
    return this.vesselsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all vessels' })
  @ApiResponse({ status: 200, description: 'List of vessels' })
  async findAll() {
    return this.vesselsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vessel details including compliance status' })
  @ApiResponse({ status: 200, description: 'Vessel details' })
  async findOne(@Param('id') id: string) {
    return this.vesselsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update vessel information' })
  @ApiResponse({ status: 200, description: 'Vessel updated' })
  async update(@Param('id') id: string, @Body() updateDto: any) {
    return this.vesselsService.update(id, updateDto);
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Get wet-lease and registration documents' })
  @ApiResponse({ status: 200, description: 'List of vessel documents' })
  async getDocuments(@Param('id') id: string) {
    return this.vesselsService.getDocuments(id);
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Upload a new document for the vessel' })
  @ApiResponse({ status: 201, description: 'Document uploaded' })
  async uploadDocument(
    @Param('id') id: string,
    @Body() documentDto: any,
  ) {
    return this.vesselsService.uploadDocument(id, documentDto);
  }
}
