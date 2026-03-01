import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { LoggingAuthGuard } from '../auth/logging-auth.guard';
import { SettingsService, SettingUpdateDto } from './settings.service';

@UseGuards(LoggingAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get(':group')
  getGroupSettings(@Param('group') group: string) {
    return this.settingsService.getGroupSettings(group);
  }

  @Put(':group')
  updateGroupSettings(
    @Param('group') group: string,
    @Body() dto: { settings: SettingUpdateDto[] },
    @CurrentUser() user: any
  ): Promise<any> {
    return this.settingsService.updateGroupSettings(
      group,
      dto.settings,
      user?.id || user?.sub || 'system'
    );
  }
}
