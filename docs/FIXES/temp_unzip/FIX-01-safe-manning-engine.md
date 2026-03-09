# FIX-01: Per-Vessel Safe Manning Engine (BMA R106 / MN-018)

## Regulatory Background

Under **SOLAS Regulation V/14.2**, **BMA Marine Notice MN-018**, and the **Bahamas Merchant Shipping Act 1976 Section 67**, every registered vessel must hold an individual **Minimum Safe Manning Document (MSMD)** issued by the BMA. This document is vessel-specific — it is not a category-based lookup table. It is derived from Form R.106 (Rev. 05, June 2024) submitted to the BMA, taking into account the vessel's gross tonnage, route, equipment, and intended operation.

**The current platform's `SAFE_MANNING_REQUIREMENTS` static object is non-compliant.** It assigns role requirements by generic vessel type (e.g. `FERRY_SMALL`), which the BMA does not recognize. The BMA may issue different MSMDs for two vessels of identical size if their routes, equipment, or operational profiles differ.

Additionally, BMA MN-018 requires that the MSMD include non-watchkeeping personnel required for emergency duties, mooring, and crowd control — roles your current engine ignores entirely.

---

## What Needs to Change

### 1. Prisma Schema — Store the MSMD per vessel

Add a `VesselMSMD` model that stores the BMA-issued manning requirements directly against each vessel, rather than computing them from a static lookup.

```prisma
// packages/database/prisma/schema.prisma

model VesselMSMD {
  id              String   @id @default(cuid())
  vesselId        String   @unique
  vessel          Vessel   @relation(fields: [vesselId], references: [id])

  // BMA Form R.106 fields
  msmdReferenceNumber  String    // e.g. "BMA-MSMD-2024-00123"
  issueDate            DateTime
  expiryDate           DateTime
  issuingAuthority     String    @default("Bahamas Maritime Authority")

  // Required watchkeeping complement (from MSMD table)
  masterRequired          Int  @default(1)
  chiefOfficerRequired    Int  @default(0)
  deckOfficerRequired     Int  @default(0)  // OOW / Officer of the Watch
  chiefEngineerRequired   Int  @default(1)
  engineerOfficerRequired Int  @default(0)
  ratingsDeckRequired     Int  @default(0)
  ratingsEngineRequired   Int  @default(0)

  // BMA MN-018 "Other" category — non-watchkeeping required personnel
  securityOfficerRequired Int  @default(0)  // STCW VI/5
  radioOperatorRequired   Int  @default(0)  // GMDSS
  cookRequired            Int  @default(0)  // BMA MN-037
  // Crowd control is required for passenger vessels per BMA MN-018
  crowdControlRequired    Int  @default(0)

  // Operational limits noted on the MSMD
  maxPassengersForManning Int?  // Manning may vary by passenger complement
  operationalArea         String? // e.g. "Near-coastal, Bahamas domestic"

  // Scanned MSMD document
  documentS3Key String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("vessel_msmd")
}
```

---

### 2. DTO — MSMD Upsert

```typescript
// packages/dto/src/vessel-msmd.dto.ts
import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpsertVesselMSMDDto {
  @IsString()
  msmdReferenceNumber: string;

  @IsDateString()
  issueDate: string;

  @IsDateString()
  expiryDate: string;

  @IsInt() @Min(0) masterRequired: number;
  @IsInt() @Min(0) chiefOfficerRequired: number;
  @IsInt() @Min(0) deckOfficerRequired: number;
  @IsInt() @Min(0) chiefEngineerRequired: number;
  @IsInt() @Min(0) engineerOfficerRequired: number;
  @IsInt() @Min(0) ratingsDeckRequired: number;
  @IsInt() @Min(0) ratingsEngineRequired: number;
  @IsInt() @Min(0) securityOfficerRequired: number;
  @IsInt() @Min(0) radioOperatorRequired: number;
  @IsInt() @Min(0) cookRequired: number;
  @IsInt() @Min(0) crowdControlRequired: number;

  @IsOptional() @IsInt() maxPassengersForManning?: number;
  @IsOptional() @IsString() operationalArea?: string;
}
```

---

### 3. Safe Manning Engine — Replace the static lookup

```typescript
// apps/api/src/modules/compliance/safe-manning.engine.ts

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
    passengerCount?: number,
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

    const msmdExpired = new Date(msmd.expiryDate) < new Date();
    const deficiencies: ManningDeficiency[] = [];
    const warnings: ManningWarning[] = [];

    if (msmdExpired) {
      warnings.push({
        code: 'MSMD_EXPIRED',
        message: `MSMD ${msmd.msmdReferenceNumber} expired on ${msmd.expiryDate.toISOString().split('T')[0]}. Submit Form R.106 to the BMA for renewal.`,
      });
    }

    // 2. Count currently assigned crew by their STCW role
    const assignedCrew = await this.prisma.crewAssignment.groupBy({
      by: ['stcwRole'],
      where: {
        vesselId,
        status: 'ACTIVE',
      },
      _count: { stcwRole: true },
    });

    const countByRole = (roles: string[]): number =>
      assignedCrew
        .filter((a) => roles.includes(a.stcwRole))
        .reduce((sum, a) => sum + a._count.stcwRole, 0);

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
        roles: ['SECOND_ENGINEER', 'THIRD_ENGINEER', 'ENGINEER_OFFICER'],
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
        roles: ['MOTORMAN', 'OILER', 'ENGINE_RATING'],
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
        roles: ['RADIO_OPERATOR', 'GMDSS_OPERATOR'],
        required: msmd.radioOperatorRequired,
        basis: 'STCW IV/2 / SOLAS IV / BMA MN-018',
      },
      {
        label: 'Cook',
        roles: ['COOK', 'CHIEF_COOK'],
        required: msmd.cookRequired,
        basis: 'BMA Marine Notice MN-037 / MLC 2006',
      },
    ];

    // 4. If vessel is sailing with passengers, apply crowd control requirement
    // BMA MN-018 "Other" category: passenger vessels require crowd control personnel
    let crowdControlRequired = msmd.crowdControlRequired;
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
      const crowdControlAssigned = countByRole(['CROWD_CONTROL', 'SAFETY_OFFICER', 'PURSER']);
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
```

---

### 4. Unit Tests

```typescript
// apps/api/src/test/safe-manning.engine.spec.ts

import { SafeManningEngine } from '../modules/compliance/safe-manning.engine';

describe('SafeManningEngine', () => {
  let engine: SafeManningEngine;
  let prismaMock: any;

  const baseMSMD = {
    vesselId: 'vessel-001',
    msmdReferenceNumber: 'BMA-MSMD-2024-00123',
    issueDate: new Date('2024-01-01'),
    expiryDate: new Date('2029-01-01'), // 5-year validity
    masterRequired: 1,
    chiefOfficerRequired: 1,
    deckOfficerRequired: 1,
    chiefEngineerRequired: 1,
    engineerOfficerRequired: 1,
    ratingsDeckRequired: 2,
    ratingsEngineRequired: 0,
    securityOfficerRequired: 1,
    radioOperatorRequired: 1,
    cookRequired: 1,
    crowdControlRequired: 2,
    maxPassengersForManning: 150,
    operationalArea: 'Near-coastal, Bahamas domestic',
  };

  beforeEach(() => {
    prismaMock = {
      vesselMSMD: { findUnique: jest.fn() },
      crewAssignment: { groupBy: jest.fn() },
    };
    engine = new SafeManningEngine(prismaMock as any);
  });

  it('should return MSMD_MISSING deficiency when no MSMD on file', async () => {
    prismaMock.vesselMSMD.findUnique.mockResolvedValue(null);
    const result = await engine.validateVesselManning('vessel-001');
    expect(result.compliant).toBe(false);
    expect(result.warnings[0].code).toBe('MSMD_MISSING');
  });

  it('should flag MSMD_EXPIRED when expiry date has passed', async () => {
    prismaMock.vesselMSMD.findUnique.mockResolvedValue({
      ...baseMSMD,
      expiryDate: new Date('2020-01-01'),
    });
    prismaMock.crewAssignment.groupBy.mockResolvedValue([]);
    const result = await engine.validateVesselManning('vessel-001');
    expect(result.msmdExpired).toBe(true);
    expect(result.warnings.some((w) => w.code === 'MSMD_EXPIRED')).toBe(true);
  });

  it('should return compliant when all MSMD roles are filled', async () => {
    prismaMock.vesselMSMD.findUnique.mockResolvedValue(baseMSMD);
    prismaMock.crewAssignment.groupBy.mockResolvedValue([
      { stcwRole: 'MASTER', _count: { stcwRole: 1 } },
      { stcwRole: 'CHIEF_OFFICER', _count: { stcwRole: 1 } },
      { stcwRole: 'SECOND_OFFICER', _count: { stcwRole: 1 } },
      { stcwRole: 'CHIEF_ENGINEER', _count: { stcwRole: 1 } },
      { stcwRole: 'SECOND_ENGINEER', _count: { stcwRole: 1 } },
      { stcwRole: 'ABLE_SEAMAN', _count: { stcwRole: 2 } },
      { stcwRole: 'SHIP_SECURITY_OFFICER', _count: { stcwRole: 1 } },
      { stcwRole: 'GMDSS_OPERATOR', _count: { stcwRole: 1 } },
      { stcwRole: 'COOK', _count: { stcwRole: 1 } },
      { stcwRole: 'CROWD_CONTROL', _count: { stcwRole: 2 } },
    ]);
    const result = await engine.validateVesselManning('vessel-001');
    expect(result.compliant).toBe(true);
    expect(result.deficiencies).toHaveLength(0);
  });

  it('should detect shortfall when Master is missing', async () => {
    prismaMock.vesselMSMD.findUnique.mockResolvedValue(baseMSMD);
    prismaMock.crewAssignment.groupBy.mockResolvedValue([
      // No MASTER assigned
      { stcwRole: 'CHIEF_OFFICER', _count: { stcwRole: 1 } },
    ]);
    const result = await engine.validateVesselManning('vessel-001');
    const masterDeficiency = result.deficiencies.find((d) => d.role === 'Master');
    expect(masterDeficiency).toBeDefined();
    expect(masterDeficiency!.shortfall).toBe(1);
    expect(masterDeficiency!.regulatoryBasis).toContain('STCW II/2');
  });

  it('should warn when passenger count exceeds MSMD assessment complement', async () => {
    prismaMock.vesselMSMD.findUnique.mockResolvedValue(baseMSMD);
    prismaMock.crewAssignment.groupBy.mockResolvedValue([]);
    const result = await engine.validateVesselManning('vessel-001', 200);
    expect(result.warnings.some((w) => w.code === 'PASSENGER_COMPLEMENT_EXCEEDS_MSMD')).toBe(true);
  });
});
```

---

## Migration Notes

1. Create a new Keycloak-protected API endpoint `PUT /api/v1/vessels/:vesselId/msmd` (role: `COMPLIANCE_OFFICER`, `SUPERADMIN`) for uploading MSMD data.
2. Add a UI step in vessel onboarding that requires MSMD entry before a vessel can be set to operational status.
3. The departure readiness check on the dashboard must call `SafeManningEngine.validateVesselManning()` — not the old static object.
4. Emit an audit log entry (`MSMD_VALIDATED`, `MSMD_DEFICIENCY_DETECTED`) for every validation run.

## References
- BMA Marine Notice MN-018: Safe Manning Requirements
- BMA Form R.106 Rev. 05 (June 2024): Application for Minimum Safe Manning Document
- BMA Information Bulletin No. 115: Safe Manning Requirements Guidance
- SOLAS Regulation V/14.1-14.2
- Bahamas Merchant Shipping Act 1976, Section 67
- IMO Resolution A.1079(28)
