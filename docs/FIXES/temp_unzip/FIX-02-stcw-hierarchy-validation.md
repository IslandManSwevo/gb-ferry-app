# FIX-02: STCW Certification Hierarchy & Substitution Rules

## Regulatory Background

The **STCW Convention (as amended by the 2010 Manila Amendments, in force 1 January 2012)** establishes a strict certification hierarchy for seafarers. Chapters II (Deck) and III (Engine) of the STCW Code define minimum competency standards at two levels:

- **Management Level** — Master, Chief Mate, Chief Engineer, Second Engineer
- **Operational Level** — Officer in Charge of a Navigational Watch (OOW), Engineer Officer of the Watch

A seafarer certified at **operational level cannot substitute upward** for a management-level role. The STCW Code does not permit a Third Officer (OOW) to stand in for a Chief Officer (management level). This is not a policy preference — it is a hard regulatory boundary enforced by Port State Control.

**The current platform has this backwards.** The substitution map `SECOND_OFFICER: ['THIRD_OFFICER', 'DECK_OFFICER']` implies lower-ranked officers can substitute upward, which is non-compliant and dangerous.

Additionally, for **passenger ferries operating near-coastal routes**, the BMA applies **STCW Regulation II/3** (vessels under 500 GT, near-coastal voyages) rather than II/1 (500 GT or more), meaning the platform must assess which STCW regulation governs each vessel based on its gross tonnage.

---

## STCW Deck Hierarchy (Management → Operational → Rating)

```
MASTER              ← STCW II/2 (Management Level)
  └── CHIEF_OFFICER ← STCW II/2 (Management Level)
        └── OOW     ← STCW II/1 (≥500GT) or II/3 (<500GT, near-coastal)
              └── ABLE_SEAMAN (AS)  ← STCW II/4, II/5
                    └── ORDINARY_SEAMAN ← STCW VI/1 (Basic Training only)
```

## STCW Engine Hierarchy

```
CHIEF_ENGINEER      ← STCW III/2 (≥3000kW, Management Level)
  └── SECOND_ENGINEER ← STCW III/2 (Management Level)
        └── ENGINEER_OOW ← STCW III/1 (≥750kW, Operational Level)
              └── ENGINE_RATING ← STCW III/4, III/5
```

**Substitution Rule: A seafarer may only substitute for an equal or lower rank within the same department. Management level cannot be filled by operational level.**

---

## What Needs to Change

### 1. STCW Role Definitions & Certification Map

Replace the flat substitution map with a structured hierarchy that encodes STCW regulation references and the directionality of substitution.

```typescript
// packages/dto/src/stcw-hierarchy.ts

export type STCWLevel = 'MANAGEMENT' | 'OPERATIONAL' | 'SUPPORT' | 'RATING' | 'BASIC';
export type STCWDepartment = 'DECK' | 'ENGINE' | 'RADIO' | 'SECURITY' | 'CATERING' | 'GENERAL';

export interface STCWRoleDefinition {
  role: string;
  level: STCWLevel;
  department: STCWDepartment;
  /**
   * Which STCW regulation governs this role's certification.
   * May be conditional on vessel GT (see gtThreshold).
   */
  stcwRegulation: string;
  /**
   * For GT-dependent certifications (e.g. STCW II/1 vs II/3).
   * If the vessel is BELOW this GT, use stcwRegulationSmallVessel instead.
   */
  gtThreshold?: number;
  stcwRegulationSmallVessel?: string;
  /**
   * Roles that MAY substitute for this role.
   * Substitution is ONLY downward (higher rank filling a lower-rank slot).
   * A role may never be filled by a lower-ranked role.
   */
  canBeFilledBy: string[];
  /**
   * Required revalidation interval in months (Manila Amendment standard: 60 months).
   */
  revalidationMonths: number;
  /**
   * Required BMA endorsement for Bahamas-flagged vessels.
   */
  bmaEndorsementRequired: boolean;
}

/**
 * Authoritative STCW role hierarchy for GB Ferry crew compliance platform.
 *
 * Regulatory basis:
 *   - STCW Convention as amended by 2010 Manila Amendments
 *   - BMA Marine Notice MN-021: Passenger Ship Training & Certification
 *   - BMA Seafarers & Manning requirements
 *   - STCW Code Chapters II, III, IV, VI
 */
export const STCW_ROLE_HIERARCHY: Record<string, STCWRoleDefinition> = {
  // ─── DECK DEPARTMENT ──────────────────────────────────────────────────────

  MASTER: {
    role: 'MASTER',
    level: 'MANAGEMENT',
    department: 'DECK',
    stcwRegulation: 'STCW II/2',
    gtThreshold: 500,
    stcwRegulationSmallVessel: 'STCW II/3',
    // Master can only be filled by another Master. No upward substitution exists.
    canBeFilledBy: ['MASTER'],
    revalidationMonths: 60,
    bmaEndorsementRequired: true,
  },

  CHIEF_OFFICER: {
    role: 'CHIEF_OFFICER',
    level: 'MANAGEMENT',
    department: 'DECK',
    stcwRegulation: 'STCW II/2',
    // Chief Officer may be filled by a Master (higher rank, same department).
    // A Second Officer (operational level) CANNOT fill a Chief Officer slot.
    canBeFilledBy: ['MASTER', 'CHIEF_OFFICER'],
    revalidationMonths: 60,
    bmaEndorsementRequired: true,
  },

  SECOND_OFFICER: {
    role: 'SECOND_OFFICER',
    level: 'OPERATIONAL',
    department: 'DECK',
    stcwRegulation: 'STCW II/1',
    gtThreshold: 500,
    stcwRegulationSmallVessel: 'STCW II/3',
    // OOW slot can be filled by Chief Officer or Master (both higher ranked).
    // A Third Officer CANNOT fill a Second Officer slot — both are operational level
    // but Third Officer holds less seniority; the MSMD will specify if 3/O is acceptable.
    // Default: only equal or higher rank.
    canBeFilledBy: ['MASTER', 'CHIEF_OFFICER', 'SECOND_OFFICER'],
    revalidationMonths: 60,
    bmaEndorsementRequired: true,
  },

  THIRD_OFFICER: {
    role: 'THIRD_OFFICER',
    level: 'OPERATIONAL',
    department: 'DECK',
    stcwRegulation: 'STCW II/1',
    gtThreshold: 500,
    stcwRegulationSmallVessel: 'STCW II/3',
    canBeFilledBy: ['MASTER', 'CHIEF_OFFICER', 'SECOND_OFFICER', 'THIRD_OFFICER'],
    revalidationMonths: 60,
    bmaEndorsementRequired: true,
  },

  DECK_OFFICER: {
    role: 'DECK_OFFICER',
    level: 'OPERATIONAL',
    department: 'DECK',
    stcwRegulation: 'STCW II/3', // Near-coastal / small vessel
    canBeFilledBy: ['MASTER', 'CHIEF_OFFICER', 'SECOND_OFFICER', 'THIRD_OFFICER', 'DECK_OFFICER'],
    revalidationMonths: 60,
    bmaEndorsementRequired: true,
  },

  ABLE_SEAMAN: {
    role: 'ABLE_SEAMAN',
    level: 'RATING',
    department: 'DECK',
    stcwRegulation: 'STCW II/4 / II/5',
    canBeFilledBy: ['MASTER', 'CHIEF_OFFICER', 'SECOND_OFFICER', 'THIRD_OFFICER', 'ABLE_SEAMAN'],
    revalidationMonths: 60,
    bmaEndorsementRequired: false,
  },

  ORDINARY_SEAMAN: {
    role: 'ORDINARY_SEAMAN',
    level: 'BASIC',
    department: 'DECK',
    stcwRegulation: 'STCW VI/1',
    canBeFilledBy: [
      'MASTER',
      'CHIEF_OFFICER',
      'SECOND_OFFICER',
      'THIRD_OFFICER',
      'ABLE_SEAMAN',
      'ORDINARY_SEAMAN',
    ],
    revalidationMonths: 60,
    bmaEndorsementRequired: false,
  },

  // ─── ENGINE DEPARTMENT ────────────────────────────────────────────────────

  CHIEF_ENGINEER: {
    role: 'CHIEF_ENGINEER',
    level: 'MANAGEMENT',
    department: 'ENGINE',
    stcwRegulation: 'STCW III/2',
    canBeFilledBy: ['CHIEF_ENGINEER'],
    revalidationMonths: 60,
    bmaEndorsementRequired: true,
  },

  SECOND_ENGINEER: {
    role: 'SECOND_ENGINEER',
    level: 'MANAGEMENT',
    department: 'ENGINE',
    stcwRegulation: 'STCW III/2',
    // Chief Engineer (higher management) can fill Second Engineer slot.
    // A Third Engineer (operational level) CANNOT fill this slot.
    canBeFilledBy: ['CHIEF_ENGINEER', 'SECOND_ENGINEER'],
    revalidationMonths: 60,
    bmaEndorsementRequired: true,
  },

  THIRD_ENGINEER: {
    role: 'THIRD_ENGINEER',
    level: 'OPERATIONAL',
    department: 'ENGINE',
    stcwRegulation: 'STCW III/1',
    canBeFilledBy: ['CHIEF_ENGINEER', 'SECOND_ENGINEER', 'THIRD_ENGINEER'],
    revalidationMonths: 60,
    bmaEndorsementRequired: true,
  },

  ENGINEER_OFFICER: {
    role: 'ENGINEER_OFFICER',
    level: 'OPERATIONAL',
    department: 'ENGINE',
    stcwRegulation: 'STCW III/1',
    canBeFilledBy: ['CHIEF_ENGINEER', 'SECOND_ENGINEER', 'THIRD_ENGINEER', 'ENGINEER_OFFICER'],
    revalidationMonths: 60,
    bmaEndorsementRequired: true,
  },

  ENGINE_RATING: {
    role: 'ENGINE_RATING',
    level: 'RATING',
    department: 'ENGINE',
    stcwRegulation: 'STCW III/4 / III/5',
    canBeFilledBy: [
      'CHIEF_ENGINEER',
      'SECOND_ENGINEER',
      'THIRD_ENGINEER',
      'ENGINEER_OFFICER',
      'ENGINE_RATING',
    ],
    revalidationMonths: 60,
    bmaEndorsementRequired: false,
  },

  // ─── RADIOCOMMUNICATIONS ─────────────────────────────────────────────────

  GMDSS_OPERATOR: {
    role: 'GMDSS_OPERATOR',
    level: 'OPERATIONAL',
    department: 'RADIO',
    stcwRegulation: 'STCW IV/2',
    canBeFilledBy: ['GMDSS_OPERATOR'],
    revalidationMonths: 60,
    bmaEndorsementRequired: true,
  },

  // ─── SECURITY ────────────────────────────────────────────────────────────

  SHIP_SECURITY_OFFICER: {
    role: 'SHIP_SECURITY_OFFICER',
    level: 'SUPPORT',
    department: 'SECURITY',
    stcwRegulation: 'STCW VI/5 / ISPS Code',
    // SSO may be the Master — ISPS Code Part B, Para 12.1
    canBeFilledBy: ['MASTER', 'CHIEF_OFFICER', 'SHIP_SECURITY_OFFICER'],
    revalidationMonths: 60,
    bmaEndorsementRequired: true,
  },

  // ─── CATERING / PASSENGER VESSEL ─────────────────────────────────────────

  CHIEF_COOK: {
    role: 'CHIEF_COOK',
    level: 'SUPPORT',
    department: 'CATERING',
    stcwRegulation: 'MLC 3.2',
    canBeFilledBy: ['CHIEF_COOK'],
    revalidationMonths: 60,
    bmaEndorsementRequired: false,
  },

  PURSER: {
    role: 'PURSER',
    level: 'SUPPORT',
    department: 'CATERING',
    stcwRegulation: 'STCW V/2',
    canBeFilledBy: ['PURSER'],
    revalidationMonths: 60,
    bmaEndorsementRequired: false,
  },

  SAFETY_OFFICER: {
    role: 'SAFETY_OFFICER',
    level: 'OPERATIONAL',
    department: 'GENERAL',
    stcwRegulation: 'STCW II/2',
    canBeFilledBy: ['MASTER', 'CHIEF_OFFICER', 'SAFETY_OFFICER'],
    revalidationMonths: 60,
    bmaEndorsementRequired: false,
  },

  CROWD_CONTROL: {
    role: 'CROWD_CONTROL',
    level: 'BASIC',
    department: 'GENERAL',
    stcwRegulation: 'STCW V/2 / BMA MN-021',
    canBeFilledBy: ['MASTER', 'CHIEF_OFFICER', 'PURSER', 'SAFETY_OFFICER', 'CROWD_CONTROL'],
    revalidationMonths: 60,
    bmaEndorsementRequired: false,
  },

  RADIO_OPERATOR: {
    role: 'RADIO_OPERATOR',
    level: 'OPERATIONAL',
    department: 'RADIO',
    stcwRegulation: 'STCW IV/2',
    canBeFilledBy: ['MASTER', 'CHIEF_OFFICER', 'SECOND_OFFICER', 'THIRD_OFFICER', 'RADIO_OPERATOR'],
    revalidationMonths: 60,
    bmaEndorsementRequired: true,
  },
};
```

---

### 2. Substitution Validator Service

```typescript
// apps/api/src/modules/compliance/stcw-substitution.service.ts

import { Injectable } from '@nestjs/common';
import { STCW_ROLE_HIERARCHY } from '@gbferry/dto';

export interface SubstitutionCheckResult {
  allowed: boolean;
  reason: string;
  regulatoryBasis?: string;
}

@Injectable()
export class STCWSubstitutionService {
  /**
   * Check whether a crew member holding `assignedRole` may fill a slot
   * designated for `requiredRole` on the MSMD.
   *
   * Key rule: substitution is only downward.
   * A lower-ranked officer may NOT fill a higher-ranked slot.
   */
  canSubstitute(assignedRole: string, requiredRole: string): SubstitutionCheckResult {
    const requiredDef = STCW_ROLE_HIERARCHY[requiredRole];

    if (!requiredDef) {
      return { allowed: false, reason: `Unknown required role: ${requiredRole}` };
    }

    if (!STCW_ROLE_HIERARCHY[assignedRole]) {
      return { allowed: false, reason: `Unknown assigned role: ${assignedRole}` };
    }

    if (requiredDef.canBeFilledBy.includes(assignedRole)) {
      return {
        allowed: true,
        reason: `${assignedRole} is authorised to fill ${requiredRole} slot`,
        regulatoryBasis: requiredDef.stcwRegulation,
      };
    }

    return {
      allowed: false,
      reason:
        `${assignedRole} is NOT authorised to substitute for ${requiredRole}. ` +
        `Under ${requiredDef.stcwRegulation}, this role requires equal or higher rank. ` +
        `Authorised substitutes: ${requiredDef.canBeFilledBy.join(', ')}.`,
      regulatoryBasis: requiredDef.stcwRegulation,
    };
  }

  /**
   * Determine whether a vessel should be assessed under STCW II/1 or II/3
   * based on its gross tonnage.
   * Ferries under 500 GT operating near-coastal use the II/3 standard.
   */
  getApplicableSTCWRegulation(role: string, vesselGT: number): string {
    const def = STCW_ROLE_HIERARCHY[role];
    if (!def) return 'UNKNOWN';
    if (def.gtThreshold && vesselGT < def.gtThreshold && def.stcwRegulationSmallVessel) {
      return def.stcwRegulationSmallVessel;
    }
    return def.stcwRegulation;
  }
}
```

---

### 3. Unit Tests

```typescript
// apps/api/src/test/stcw-substitution.spec.ts

import { STCWSubstitutionService } from '../modules/compliance/stcw-substitution.service';

describe('STCWSubstitutionService', () => {
  let service: STCWSubstitutionService;

  beforeEach(() => {
    service = new STCWSubstitutionService();
  });

  // ── Correct downward substitutions ────────────────────────────────────────

  it('should allow Master to fill Chief Officer slot (higher fills lower)', () => {
    expect(service.canSubstitute('MASTER', 'CHIEF_OFFICER').allowed).toBe(true);
  });

  it('should allow Chief Engineer to fill Second Engineer slot', () => {
    expect(service.canSubstitute('CHIEF_ENGINEER', 'SECOND_ENGINEER').allowed).toBe(true);
  });

  it('should allow Second Officer to fill Third Officer slot', () => {
    expect(service.canSubstitute('SECOND_OFFICER', 'THIRD_OFFICER').allowed).toBe(true);
  });

  it('should allow Master to act as Ship Security Officer per ISPS Code Part B', () => {
    expect(service.canSubstitute('MASTER', 'SHIP_SECURITY_OFFICER').allowed).toBe(true);
  });

  // ── Illegal upward substitutions (the bug being fixed) ───────────────────

  it('CRITICAL: should REJECT Third Officer filling Second Officer slot', () => {
    const result = service.canSubstitute('THIRD_OFFICER', 'SECOND_OFFICER');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('NOT authorised');
  });

  it('CRITICAL: should REJECT Second Engineer filling Chief Engineer slot', () => {
    const result = service.canSubstitute('SECOND_ENGINEER', 'CHIEF_ENGINEER');
    expect(result.allowed).toBe(false);
  });

  it('CRITICAL: should REJECT Able Seaman filling Officer of the Watch slot', () => {
    expect(service.canSubstitute('ABLE_SEAMAN', 'SECOND_OFFICER').allowed).toBe(false);
  });

  it('CRITICAL: should REJECT Third Engineer filling Second Engineer (management level)', () => {
    const result = service.canSubstitute('THIRD_ENGINEER', 'SECOND_ENGINEER');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('STCW III/2');
  });

  // ── GT-based regulation selection ─────────────────────────────────────────

  it('should return STCW II/3 for Master on vessel under 500GT', () => {
    const reg = service.getApplicableSTCWRegulation('MASTER', 250);
    expect(reg).toBe('STCW II/3');
  });

  it('should return STCW II/2 for Master on vessel 500GT or above', () => {
    const reg = service.getApplicableSTCWRegulation('MASTER', 750);
    expect(reg).toBe('STCW II/2');
  });
});
```

---

### Rollout Strategy

1. **Phase 1: Validation Proxy**: Deploy the `STCWSubstitutionService` in "Shadow Mode" where it logs discrepancies between the old and new logic without blocking assignments.
2. **Phase 2: Database Migration**: Execute the `stcw-role-alignment` migration to update existing `CrewMember.role` values to the new union type.
3. **Phase 3: Enforcement**: Enable the strict `canSubstitute` check in the assignment flow and departure validation.

### Rollback Plan

1. **Emergency logic switch**: If critical role mismatches are detected, toggle the `STCW_STRICT_ENFORCEMENT` feature flag to `false` to revert to exact-match only.
2. **Data Reversion**: If role mapping causes system-wide blocks, the `stcw-role-alignment` migration includes a `down` script to revert role strings to the previous 1.x flat schema.

## References

- STCW Convention, 2010 Manila Amendments (in force 1 January 2012)
- STCW Code Chapter II (Deck) — Regulations II/1, II/2, II/3, II/4, II/5
- STCW Code Chapter III (Engine) — Regulations III/1, III/2, III/4, III/5
- STCW Code Chapter IV (Radio) — Regulation IV/2
- STCW Code Chapter V — Regulation V/2 (Passenger vessel crowd management)
- STCW Code Chapter VI — Regulation VI/5 (Ship Security Officer)
- BMA Marine Notice MN-021: Passenger Ship Training and Certification
- ISPS Code Part B, Paragraph 12.1 (SSO designation)
- MLC 2006 (Cook certification, BMA MN-037)
