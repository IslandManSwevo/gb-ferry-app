import { decryptField, Prisma } from '@gbferry/database';
import { Injectable, Logger } from '@nestjs/common';
import { ACECrewPayload } from './ace-gateway.interface';

type VesselWithCrew = Prisma.VesselGetPayload<{
  include: { crewMembers: { where: { deletedAt: null } } };
}>;

/**
 * CbpTransformer — SRP: owns the mapping from domain entities → CBP wire format.
 *
 * Isolating this from CBPService means:
 *  - Field-level mapping is unit-testable without mocking Prisma or ACE.
 *  - IMO FAL/CBP format updates are a single-file change.
 */
@Injectable()
export class CbpTransformer {
  private readonly logger = new Logger(CbpTransformer.name);

  toAcePayload(vessel: VesselWithCrew): ACECrewPayload {
    return {
      vesselId: vessel.id,
      vesselInfo: {
        name: vessel.name,
        imoNumber: vessel.imoNumber,
        callSign: vessel.callSign || undefined,
        flag: vessel.flagState,
      },
      crew: vessel.crewMembers.map((c) => ({
        familyName: c.familyName,
        givenNames: c.givenNames,
        role: c.role,
        nationality: c.nationality,
        dateOfBirth: this.formatDate(c.dateOfBirth),
        travelDocNumber: this.safeDecrypt(c.passportNumber) || '',
      })),
      submissionTime: new Date(),
    };
  }

  private formatDate(date: Date | string | null): string {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().split('T')[0];
  }

  private safeDecrypt(value: string | null | undefined): string | null {
    if (!value) return null;
    try {
      return decryptField(value);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`Decryption failed during CBP transformation: ${msg}`);
      return null;
    }
  }
}
