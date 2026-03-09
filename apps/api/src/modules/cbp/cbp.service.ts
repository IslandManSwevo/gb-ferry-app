import { Prisma, PrismaService } from '@gbferry/database';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { ACE_GATEWAY, ACEGateway, ACESubmissionResult } from './ace-gateway.interface';
import { CbpTransformer } from './cbp-transformer.service';

// Define focused type for Vessel with Crew for CBP submission
type VesselWithCrew = Prisma.VesselGetPayload<{
  include: {
    crewMembers: {
      where: { deletedAt: null };
    };
  };
}>;

@Injectable()
export class CBPService {
  private readonly logger = new Logger(CBPService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly cbpTransformer: CbpTransformer,
    @Inject(ACE_GATEWAY) private readonly aceGateway: ACEGateway
  ) {}

  /**
   * Submit eNOA/D or I-418 for Crew to CBP ACE Portal
   */
  async submitCrewList(
    vesselId: string,
    userId: string,
    formType: 'I_418' | 'eNOAD'
  ): Promise<ACESubmissionResult> {
    this.logger.log(`Starting CBP submission (${formType}) for vessel ${vesselId}`);

    // 1. Fetch data efficiently (Single Query)
    const vessel = (await this.prisma.vessel.findUnique({
      where: { id: vesselId },
      include: {
        crewMembers: {
          where: {
            deletedAt: null,
            status: 'ACTIVE',
          },
        },
      },
    })) as VesselWithCrew | null;

    if (!vessel) {
      throw new NotFoundException(`Vessel ${vesselId} not found`);
    }

    // 2. Transform to CBP Format
    const cbpPayload = this.cbpTransformer.toAcePayload(vessel);

    // 3. Submit via Gateway (Abstracted ACE interaction)
    const result = await this.aceGateway.submitCrewList(cbpPayload, formType);

    // 4. Update Database
    const submission = await this.prisma.cbpSubmission.create({
      data: {
        vessel: { connect: { id: vesselId } },
        formType,
        status: result.status === 'ACCEPTED' ? 'ACCEPTED' : 'REJECTED',
        transmissionId: result.submissionId,
        submittedAt:
          result.timestamp instanceof Date ? result.timestamp.toISOString() : result.timestamp,
      },
    });

    // 5. ISO 27001 A.8.15: Regulatory Submission Audit
    await this.auditService.log({
      action: 'CBP_APIS_SUBMITTED',
      entityId: submission.id,
      entityType: 'cbpSubmission',
      userId: userId,
      details: {
        formType,
        submissionId: result.submissionId,
        crewCount: vessel.crewMembers.length,
        status: result.status,
        message: result.message,
      },
      compliance: `US CBP ACE Submission - Status: ${result.status}`,
    });

    return result;
  }
}
