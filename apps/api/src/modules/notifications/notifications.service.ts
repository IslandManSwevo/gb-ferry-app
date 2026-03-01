import { PrismaService } from '@gbferry/database';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AlertMessage } from './notifications.controller';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private demoModeCounter = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleComplianceChecks() {
    this.logger.debug('Running background compliance checks...');

    // Simulate real-world scanning of expiring certificates
    // For the demo showcase, we generate some synthetic alerts every tick!
    this.demoModeCounter++;

    let alert: AlertMessage | null = null;

    if (this.demoModeCounter % 3 === 1) {
      alert = {
        id: `alert-${Date.now()}`,
        type: 'EXPIRY_WARNING',
        severity: 'warning',
        message: 'STCW Basic Safety Training for crew member "John Doe" expires in 14 days.',
        timestamp: new Date().toISOString(),
      };
    } else if (this.demoModeCounter % 3 === 2) {
      alert = {
        id: `alert-${Date.now()}`,
        type: 'MANNING_ALERT',
        severity: 'error',
        message:
          'ALERT: MV Bahama Spirit falls below minimum safe manning levels in 48 hours due to medical leave.',
        timestamp: new Date().toISOString(),
      };
    } else {
      alert = {
        id: `alert-${Date.now()}`,
        type: 'SYSTEM_INFO',
        severity: 'info',
        message: 'Daily automated eNOAD transmission to CBP completed successfully.',
        timestamp: new Date().toISOString(),
      };
    }

    if (alert) {
      this.logger.debug(`Broadcasting alert: ${alert.message}`);
      this.eventEmitter.emit('alert.broadcast', alert);
    }
  }
}
