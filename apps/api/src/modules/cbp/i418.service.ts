import { CrewMember, I418CrewEntry, PrismaService } from '@gbferry/database';
import { Injectable, Logger } from '@nestjs/common';
import { EncryptionService } from '../security/encryption.service';

export interface DepartureReconciliation {
  joined: CrewMember[];
  separated: I418CrewEntry[];
  stayed: CrewMember[];
}

export interface I418Payload {
  vesselInfo: {
    name: string;
    imo: string;
    nationality: string;
  };
  voyageInfo: {
    voyageNumber: string;
    portOfEntry: string;
    arrivalDate: string;
    lastForeignPort: string;
  };
  crewList: Array<{
    familyName: string;
    givenNames: string;
    rank: string;
    nationality: string;
    dateOfBirth: string;
    placeOfBirth: string;
    passportNumber: string;
    passportCountry: string;
    passportExpiry: string;
    visaType?: string;
    visaNumber?: string;
    visaExpiry?: string;
  }>;
}

@Injectable()
export class I418Service {
  private readonly logger = new Logger(I418Service.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService
  ) {}

  /**
   * Generates a US CBP Form I-418 compatible payload for the specified submission.
   * Handles PII decryption for restricted fields (passports, visas).
   */
  async buildSubmissionPayload(submissionId: string): Promise<I418Payload> {
    const submission = await this.prisma.i418Submission.findUniqueOrThrow({
      where: { id: submissionId },
      include: {
        vessel: true,
        crewEntries: {
          include: { crewMember: true },
        },
      },
    });

    const vesselInfo = {
      name: submission.vessel.name,
      imo: submission.vessel.imoNumber,
      nationality: submission.vessel.flagState,
    };

    const voyageInfo = {
      voyageNumber: submission.voyageNumber,
      portOfEntry: submission.portOfEntry,
      arrivalDate: submission.arrivalDate.toISOString(),
      lastForeignPort: submission.lastForeignPort,
    };

    if (!submission.crewEntries || submission.crewEntries.length === 0) {
      this.logger.warn(`Submission ${submissionId} has no crew entries.`);
      return {
        vesselInfo,
        voyageInfo,
        crewList: [],
      };
    }

    const crewList = submission.crewEntries.map((entry: any) => {
      // FIX-15 & FIX-16: Defensive guards and try/catch for PII decryption
      let passportNumber = '[DECRYPTION_FAILED]';
      let visaNumber: string | undefined = undefined;

      try {
        const rawPassport = entry.crewMember.passportNumber;
        if (typeof rawPassport === 'string' && rawPassport.startsWith('enc:')) {
          passportNumber = this.encryptionService.decrypt(rawPassport) || '[DECRYPTION_FAILED]';
        } else if (rawPassport) {
          passportNumber = rawPassport;
        }

        const rawVisa = entry.crewMember.visaNumber;
        if (typeof rawVisa === 'string' && rawVisa.startsWith('enc:')) {
          visaNumber = this.encryptionService.decrypt(rawVisa) ?? undefined;
        } else if (rawVisa) {
          visaNumber = rawVisa;
        }
      } catch (error: any) {
        this.logger.error(
          `Failed to decrypt PII for crew ${entry.crewMember.id}: ${error.message}`
        );
        // Fallbacks already initialized
      }

      return {
        familyName: entry.crewMember.familyName,
        givenNames: entry.crewMember.givenNames,
        rank: entry.rank,
        nationality: entry.nationality,
        dateOfBirth: entry.crewMember.dateOfBirth.toISOString().split('T')[0],
        placeOfBirth: entry.crewMember.placeOfBirth,
        passportNumber,
        passportCountry: entry.crewMember.passportCountry,
        passportExpiry: entry.crewMember.passportExpiry.toISOString().split('T')[0],
        visaType: entry.crewMember.visaType ?? undefined,
        visaNumber,
        visaExpiry: entry.crewMember.visaExpiry?.toISOString().split('T')[0],
      };
    });

    return {
      vesselInfo,
      voyageInfo,
      crewList,
    };
  }

  /**
   * Reconciliation: Identifies crew members who joined or separated
   * during the vessel's stay in US waters.
   */
  async getDepartureReconciliation(vesselId: string): Promise<DepartureReconciliation | null> {
    const latestSubmission = await this.prisma.i418Submission.findFirst({
      where: { vesselId },
      orderBy: { arrivalDate: 'desc' },
      include: { crewEntries: true },
    });

    if (!latestSubmission) return null;

    const currentCrew = await this.prisma.crewMember.findMany({
      where: { vesselId, status: 'ACTIVE' },
    });

    const previousIds = new Set(
      latestSubmission.crewEntries.map((e: I418CrewEntry) => e.crewMemberId)
    );
    const currentIds = new Set(currentCrew.map((c: CrewMember) => c.id));

    return {
      joined: currentCrew.filter((c: CrewMember) => !previousIds.has(c.id)),
      separated: latestSubmission.crewEntries.filter(
        (e: I418CrewEntry) => !currentIds.has(e.crewMemberId)
      ),
      stayed: currentCrew.filter((c: CrewMember) => previousIds.has(c.id)),
    };
  }
}
