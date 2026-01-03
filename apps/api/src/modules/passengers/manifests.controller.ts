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
import { ManifestsService } from './manifests.service';

@ApiTags('passengers')
@ApiBearerAuth()
@Controller('manifests')
export class ManifestsController {
  constructor(private readonly manifestsService: ManifestsService) {}

  @Post()
  @ApiOperation({ summary: 'Generate a new manifest for a sailing' })
  @ApiResponse({ status: 201, description: 'Manifest generated (pending approval)' })
  async generate(@Body() generateDto: any): Promise<any> {
    return this.manifestsService.generate(generateDto);
  }

  @Get()
  @ApiOperation({ summary: 'List manifests with filters' })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'pending', 'approved', 'submitted'] })
  @ApiQuery({ name: 'date', required: false })
  @ApiResponse({ status: 200, description: 'List of manifests' })
  async findAll(
    @Query('status') status?: string,
    @Query('date') date?: string,
  ): Promise<any> {
    return this.manifestsService.findAll({ status, date });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get manifest details' })
  @ApiResponse({ status: 200, description: 'Manifest details with passenger list' })
  async findOne(@Param('id') id: string): Promise<any> {
    return this.manifestsService.findOne(id);
  }

  @Put(':id/approve')
  @ApiOperation({ summary: 'Manually approve a manifest (required before submission)' })
  @ApiResponse({ status: 200, description: 'Manifest approved' })
  @ApiResponse({ status: 400, description: 'Manifest cannot be approved (validation errors)' })
  async approve(@Param('id') id: string, @Body() approvalDto: any): Promise<any> {
    return this.manifestsService.approve(id, approvalDto);
  }

  @Put(':id/submit')
  @ApiOperation({ summary: 'Mark manifest as submitted to authorities' })
  @ApiResponse({ status: 200, description: 'Manifest marked as submitted' })
  async submit(@Param('id') id: string, @Body() body: { submittedBy: string }): Promise<any> {
    return this.manifestsService.submit(id, body.submittedBy);
  }
}
