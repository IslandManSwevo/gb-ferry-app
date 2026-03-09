import { PrismaService } from '@gbferry/database';
import { Injectable, Logger } from '@nestjs/common';

export interface ManningValidationResult {
  compliant: boolean;
  vesselId: string;
  msmdReferenceNumber: string;
  msmdExpired: boolean;
  deficiencies: ManningDeficiency[];
  warnings: ManningWarning[];
  crowdControlNote?: string;
}

export interface ManningDeficiency {
  role: string;
  required: number;
  assigned: number;
  shortfall: number;
  regulatoryBasis: string; // e.g. "SOLAS V/14 / BMA MN-018"
}

export interface ManningWarning {
  code: string;
  message: string;
}

@Injectable()
export class SafeManningEngine {
  private readonly logger = new Logger(SafeManningEngine.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate a vessel's current crew assignment against its BMA-issued MSMD.
   * This replaces the previous static SAFE_MANNING_REQUIREMENTS lookup.
   *
   * Regulatory basis:
   *   - SOLAS Regulation V/14.2
   *   - BMA Marine Notice MN-018 (Safe Manning Requirements)
   *   - BMA Information Bulletin No. 115
   *   - Bahamas Merchant Shipping Act 1976, Section 67
   */
  async validateVesselManning(
    vesselId: string,
    passengerCount?: number
  ): Promise<ManningValidationResult> {
    // 1. Fetch the vessel's MSMD
    const msmd = await this.prisma.vesselMSMD.findUnique({
      where: { vesselId },
    });

    if (!msmd) {
      // No MSMD on file is itself a compliance failure
      return {
        compliant: false,
        vesselId,
        msmdReferenceNumber: 'NOT_FOUND',
        msmdExpired: false,
        deficiencies: [],
        warnings: [
          {
            code: 'MSMD_MISSING',
            message:
              'No Minimum Safe Manning Document found for this vessel. ' +
              'A BMA-issued MSMD is required under SOLAS V/14.2 and BMA MN-018 ' +
              'before the vessel may depart.',
          },
        ],
      };
    }

    // Regulatory basis: dates in BMA certificates are typically inclusive of the expiry day.
    // Use UTC for consistent global comparison to avoid timezone-related detention risks.
    const nowUtc = new Date().getTime();
    const expiryUtc = new Date(msmd.expiryDate).getTime();
    const msmdExpired = expiryUtc < nowUtc;
    const deficiencies: ManningDeficiency[] = [];
    const warnings: ManningWarning[] = [];

    if (msmdExpired) {
      warnings.push({
        code: 'MSMD_EXPIRED',
        message: `MSMD ${msmd.msmdReferenceNumber} expired on ${msmd.expiryDate.toISOString().split('T')[0]} (UTC). Submit Form R.106 to the BMA for renewal.`,
      });
    }

    // 2. Count currently assigned crew by their role
    // Using role from CrewMember as established in schema
    const vessel = await this.prisma.vessel.findUnique({
      where: { id: vesselId },
      include: {
        crewMembers: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    if (!vessel) {
      throw new Error(`Vessel ${vesselId} not found`);
    }

    const assignedCrew = vessel.crewMembers;

    const countByRole = (roles: string[]) =>
      assignedCrew.filter((c: any) => roles.includes(c.role)).length;

    // 3. Check each MSMD-specified requirement
    const checks: Array<{
      label: string;
      roles: string[];
      required: number;
      basis: string;
    }> = [
      {
        label: 'Master',
        roles: ['MASTER'],
        required: msmd.masterRequired,
        basis: 'STCW II/2 / BMA MN-018',
      },
      {
        label: 'Chief Officer',
        roles: ['CHIEF_OFFICER'],
        required: msmd.chiefOfficerRequired,
        basis: 'STCW II/2 / BMA MN-018',
      },
      {
        label: 'Officer of the Watch (Deck)',
        roles: ['SECOND_OFFICER', 'THIRD_OFFICER', 'DECK_OFFICER'],
        required: msmd.deckOfficerRequired,
        basis: 'STCW II/1 or II/3 / BMA MN-018',
      },
      {
        label: 'Chief Engineer',
        roles: ['CHIEF_ENGINEER'],
        required: msmd.chiefEngineerRequired,
        basis: 'STCW III/2 / BMA MN-018',
      },
      {
        label: 'Engineer Officer of the Watch',
        roles: ['SECOND_ENGINEER', 'THIRD_ENGINEER', 'ENGINE_OFFICER'],
        required: msmd.engineerOfficerRequired,
        basis: 'STCW III/1 / BMA MN-018',
      },
      {
        label: 'Deck Ratings',
        roles: ['ABLE_SEAMAN', 'ORDINARY_SEAMAN'],
        required: msmd.ratingsDeckRequired,
        basis: 'STCW II/4-II/5 / BMA MN-018',
      },
      {
        label: 'Engine Ratings',
        roles: ['ENGINE_RATING', 'RATING'], // Mapping 'RATING' or 'ENGINE_RATING'
        required: msmd.ratingsEngineRequired,
        basis: 'STCW III/4-III/5 / BMA MN-018',
      },
      {
        label: 'Ship Security Officer',
        roles: ['SHIP_SECURITY_OFFICER', 'SECURITY_OFFICER'],
        required: msmd.securityOfficerRequired,
        basis: 'STCW VI/5 / ISPS Code / BMA MN-018',
      },
      {
        label: 'Radio Operator (GMDSS)',
        roles: ['RADIO_OPERATOR'],
        required: msmd.radioOperatorRequired,
        basis: 'STCW IV/2 / SOLAS IV / BMA MN-018',
      },
      {
        label: 'Cook',
        roles: ['COOK'],
        required: msmd.cookRequired,
        basis: 'BMA Marine Notice MN-037 / MLC 2006',
      },
    ];

    // 4. If vessel is sailing with passengers, apply crowd control requirement
    // BMA MN-018 "Other" category: passenger vessels require crowd control personnel
    const crowdControlRequired = msmd.crowdControlRequired;
    let crowdControlNote: string | undefined;

    if (passengerCount !== undefined && msmd.maxPassengersForManning) {
      if (passengerCount > msmd.maxPassengersForManning) {
        warnings.push({
          code: 'PASSENGER_COMPLEMENT_EXCEEDS_MSMD',
          message:
            `Current passenger count (${passengerCount}) exceeds the complement ` +
            `this MSMD was assessed for (${msmd.maxPassengersForManning}). ` +
            `Verify crowd control staffing with BMA per MN-018.`,
        });
      }
      crowdControlNote =
        'Crowd control personnel requirement applies per BMA MN-018 for passenger vessels.';
    }

    if (crowdControlRequired > 0) {
      const crowdControlAssigned = countByRole(['CROWD_CONTROL', 'PURSER', 'SAFETY_OFFICER']);
      if (crowdControlAssigned < crowdControlRequired) {
        deficiencies.push({
          role: 'Crowd Control (Passenger Vessel)',
          required: crowdControlRequired,
          assigned: crowdControlAssigned,
          shortfall: crowdControlRequired - crowdControlAssigned,
          regulatoryBasis: 'BMA MN-018 "Other" Category — Passenger Vessel',
        });
      }
    }

    // 5. Run all standard checks
    for (const check of checks) {
      if (check.required === 0) continue;
      const assigned = countByRole(check.roles);
      if (assigned < check.required) {
        deficiencies.push({
          role: check.label,
          required: check.required,
          assigned,
          shortfall: check.required - assigned,
          regulatoryBasis: check.basis,
        });
      }
    }

    return {
      compliant: deficiencies.length === 0 && !msmdExpired,
      vesselId,
      msmdReferenceNumber: msmd.msmdReferenceNumber,
      msmdExpired,
      deficiencies,
      warnings,
      crowdControlNote,
    };
  }
}
