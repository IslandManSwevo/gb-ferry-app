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

  /**
   * Daily Compliance Scan - Runs at 00:01 every day.
   * Scans all crew and vessels for expiring certifications or missing safe manning.
   */
  @Cron('1 0 * * *')
  async runDailyComplianceScan() {
    this.logger.log('Starting daily compliance and certificate scan...');

    // 1. Scan for expiring certifications (within 30 days)
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const expiringCerts = await this.prisma.certification.findMany({
      where: {
        status: { in: ['VALID', 'EXPIRING'] },
        expiryDate: { lte: thirtyDaysFromNow, gt: new Date() },
      },
      include: { crew: true },
    });

    for (const cert of expiringCerts) {
      const daysLeft = Math.ceil((cert.expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      const severity = daysLeft < 7 ? 'error' : 'warning';

      // Update status to EXPIRING if not already
      if (cert.status === 'VALID' && daysLeft <= 30) {
        await this.prisma.certification.update({
          where: { id: cert.id },
          data: { status: 'EXPIRING' },
        });
      }

      this.emitAlert({
        type: 'EXPIRY_WARNING',
        severity,
        message: `${cert.type} for ${cert.crew.givenNames} ${cert.crew.familyName} expires in ${daysLeft} days.`,
        entityId: cert.id,
        entityType: 'certification',
      });
    }

    // placeholder for Safe Manning Scan integration point
    this.logger.debug('Daily compliance scan completed.');
  }

  /**
   * Hourly Expiration Update - Runs at the top of every hour.
   * Moves 'VALID' or 'EXPIRING' certificates to 'EXPIRED' if they passed their date.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async updateExpiredCertificates() {
    const now = new Date();
    const result = await this.prisma.certification.updateMany({
      where: {
        status: { in: ['VALID', 'EXPIRING'] },
        expiryDate: { lt: now },
      },
      data: { status: 'EXPIRED' },
    });

    if (result.count > 0) {
      this.logger.log(`Auto-expired ${result.count} certifications.`);
    }
  }

  private emitAlert(params: {
    type: string;
    severity: 'info' | 'warning' | 'error';
    message: string;
    entityId?: string;
    entityType?: string;
  }) {
    const alert: AlertMessage = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: params.type,
      severity: params.severity,
      message: params.message,
      timestamp: new Date().toISOString(),
      ...(params.entityId && { entityId: params.entityId }),
      ...(params.entityType && { entityType: params.entityType }),
    };

    this.eventEmitter.emit('alert.broadcast', alert);
  }
}
