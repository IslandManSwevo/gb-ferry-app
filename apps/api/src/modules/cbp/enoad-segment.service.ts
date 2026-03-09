import { PrismaService } from '@gbferry/database';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EnoAdSegmentService {
  private readonly logger = new Logger(EnoAdSegmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records a USCG eNOAD Notice ID received from NVMC.
   * This ID is critical for arrival/departure verification.
   */
  async linkNoticeId(segmentId: string, noticeId: string): Promise<any> {
    this.logger.log(`Linking eNOAD Segment ${segmentId} to USCG Notice ID: ${noticeId}`);

    return this.prisma.eNoadSegment.update({
      where: { id: segmentId },
      data: {
        uscgNoticeId: noticeId,
        status: 'ACCEPTED',
      },
    });
  }

  /**
   * Generates a timeline of segments for a multi-port voyage.
   */
  async getVoyageTimeline(vesselId: string): Promise<any[]> {
    return this.prisma.eNoadSegment.findMany({
      where: { vesselId },
      orderBy: { eta: 'asc' },
      include: {
        i418Submission: true,
      },
    });
  }
}
