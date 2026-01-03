import {
    Body,
    Controller,
    Delete,
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
import { PassengersService } from './passengers.service';

@ApiTags('passengers')
@ApiBearerAuth()
@Controller('passengers')
export class PassengersController {
  constructor(private readonly passengersService: PassengersService) {}

  @Post('checkin')
  @ApiOperation({ summary: 'Check in a passenger for a sailing' })
  @ApiResponse({ status: 201, description: 'Passenger checked in successfully' })
  @ApiResponse({ status: 400, description: 'Invalid passenger data' })
  async checkIn(@Body() checkInDto: any): Promise<any> {
    return this.passengersService.checkIn(checkInDto);
  }

  @Get()
  @ApiOperation({ summary: 'List passengers with optional filters' })
  @ApiQuery({ name: 'sailingId', required: false })
  @ApiQuery({ name: 'date', required: false })
  @ApiResponse({ status: 200, description: 'List of passengers' })
  async findAll(
    @Query('sailingId') sailingId?: string,
    @Query('date') date?: string,
  ): Promise<any> {
    return this.passengersService.findAll({ sailingId, date });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get passenger details by ID' })
  @ApiResponse({ status: 200, description: 'Passenger details' })
  @ApiResponse({ status: 404, description: 'Passenger not found' })
  async findOne(@Param('id') id: string): Promise<any> {
    return this.passengersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update passenger information' })
  @ApiResponse({ status: 200, description: 'Passenger updated' })
  async update(@Param('id') id: string, @Body() updateDto: any): Promise<any> {
    return this.passengersService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove passenger from sailing (soft delete)' })
  @ApiResponse({ status: 200, description: 'Passenger removed' })
  async remove(@Param('id') id: string): Promise<any> {
    return this.passengersService.remove(id);
  }
}
