import { PlatformSetting, PrismaService } from '@gbferry/database';
import { Injectable, Logger } from '@nestjs/common';

export interface SettingUpdateDto {
  key: string;
  value: any;
  description?: string;
}

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves all settings for a specific group, falling back to defaults if not present.
   */
  async getGroupSettings(group: string) {
    const records = await this.prisma.platformSetting.findMany({
      where: { group },
    });

    // Transform into a simple key/value map for the frontend
    return records.reduce(
      (acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      },
      {} as Record<string, any>
    );
  }

  /**
   * Bulk updates settings within a specific group.
   */
  async updateGroupSettings(
    group: string,
    settings: SettingUpdateDto[],
    userId: string
  ): Promise<PlatformSetting[]> {
    const results = await this.prisma.$transaction(
      settings.map((s) => {
        return this.prisma.platformSetting.upsert({
          where: {
            group_key: { group, key: s.key },
          },
          update: {
            value: s.value !== undefined ? s.value : undefined,
            description: s.description,
            updatedBy: userId,
          },
          create: {
            group,
            key: s.key,
            value: s.value,
            description: s.description,
            updatedBy: userId,
          },
        });
      })
    );

    this.logger.log(`User ${userId} updated ${results.length} settings in group '${group}'`);
    return results;
  }
}
