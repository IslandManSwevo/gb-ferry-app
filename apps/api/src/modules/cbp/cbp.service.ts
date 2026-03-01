import { decryptField, Prisma, PrismaService } from '@gbferry/database';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import {
  ACE_GATEWAY,
  ACECrewPayload,
  ACEGateway,
  ACESubmissionResult,
} from './ace-gateway.interface';

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

    // 2. Transform to CBP Format (Handling PII Decryption)
    const cbpPayload = this.transformToCbpPayload(vessel);

    // 3. Submit via Gateway (Abstracted ACE interaction)
    const result = await this.aceGateway.submitCrewList(cbpPayload, formType);

    // 4. Update Database
    const submission = await this.prisma.cbpSubmission.create({
      data: {
        vessel: { connect: { id: vesselId } },
        formType,
        status: result.status === 'ACCEPTED' ? 'SUBMITTED' : 'REJECTED',
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

  /**
   * Internal data transformation logic for CBP
   */
  private transformToCbpPayload(vessel: VesselWithCrew): ACECrewPayload {
    const crew = vessel.crewMembers.map((c) => ({
      familyName: c.familyName,
      givenNames: c.givenNames,
      role: c.role,
      nationality: c.nationality,
      dateOfBirth:
        c.dateOfBirth instanceof Date
          ? c.dateOfBirth.toISOString().split('T')[0]
          : String(c.dateOfBirth),
      travelDocNumber: this.safeDecrypt(c.passportNumber) || '',
    }));

    return {
      vesselId: vessel.id,
      vesselInfo: {
        name: vessel.name,
        imoNumber: vessel.imoNumber,
        callSign: vessel.callSign || undefined,
        flag: vessel.flagState,
      },
      crew,
      submissionTime: new Date(),
    };
  }

  private safeDecrypt(value: string | null | undefined): string | null {
    if (!value) return null;
    try {
      return decryptField(value);
    } catch (e: any) {
      this.logger.warn(`Decryption failed during CBP transformation: ${e.message}`);
      return null;
    }
  }
}
