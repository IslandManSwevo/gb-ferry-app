import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'nest-keycloak-connect';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles({ roles: ['realm:admin', 'realm:superadmin', 'realm:compliance_officer'] })
  @ApiOperation({ summary: 'List all application users' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async findAll() {
    return this.usersService.findAll();
  }
}
