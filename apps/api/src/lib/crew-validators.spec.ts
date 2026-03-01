/**
 * crew-validators.spec.ts
 *
 * Unit tests for the Compliance Rules Engine.
 * No I/O, no mocks needed — pure function testing.
 *
 * Skills applied: testing-patterns (factory functions, describe/it structure)
 */

import {
  checkCertificateExpiringWithin30Days,
  getVesselCategory,
  roleMatches,
  validateCertificateExpiry,
  validateCrewCompliance,
  validateMedicalCertificate,
  validateSafeManningRequirement,
} from './crew-validators';

// ─── Factories ────────────────────────────────────────────────────────────────

const FUTURE_DATE = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const PAST_DATE = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const EXPIRING_SOON_DATE = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split('T')[0];

const getMockCrewMember = (
  overrides: Partial<{
    id: string;
    name: string;
    role: any;
    hasMedical: boolean;
    medicalExpiryDate: string;
    certifications: Array<{ type: string; expiryDate: string }>;
  }> = {}
) => ({
  id: 'crew-001',
  name: 'John Doe',
  role: 'MASTER' as any,
  hasMedical: true,
  medicalExpiryDate: FUTURE_DATE,
  certifications: [{ type: 'STCW_COC', expiryDate: FUTURE_DATE }],
  ...overrides,
});

const getMockCrewRoster = (
  overrides: Partial<{
    id: string;
    name: string;
    role: any;
  }> = {}
) => [{ id: 'crew-001', name: 'Master Smith', role: 'MASTER' as any, ...overrides }];

// ─── getVesselCategory ────────────────────────────────────────────────────────

describe('getVesselCategory', () => {
  it('returns FERRY_SMALL for vessels under 500 GT', () => {
    expect(getVesselCategory(499)).toBe('FERRY_SMALL');
    expect(getVesselCategory(0)).toBe('FERRY_SMALL');
  });

  it('returns FERRY_MEDIUM for vessels 500–2999 GT', () => {
    expect(getVesselCategory(500)).toBe('FERRY_MEDIUM');
    expect(getVesselCategory(2999)).toBe('FERRY_MEDIUM');
  });

  it('returns FERRY_LARGE for vessels 3000 GT and above', () => {
    expect(getVesselCategory(3000)).toBe('FERRY_LARGE');
    expect(getVesselCategory(10000)).toBe('FERRY_LARGE');
  });
});

// ─── roleMatches ──────────────────────────────────────────────────────────────

describe('roleMatches', () => {
  it('exact role always matches', () => {
    expect(roleMatches('MASTER', 'MASTER')).toBe(true);
    expect(roleMatches('CHIEF_ENGINEER', 'CHIEF_ENGINEER')).toBe(true);
    expect(roleMatches('ABLE_SEAMAN', 'ABLE_SEAMAN')).toBe(true);
  });

  it('senior rank fills junior billet (substitution up)', () => {
    expect(roleMatches('MASTER', 'CHIEF_OFFICER')).toBe(true);
    expect(roleMatches('CHIEF_OFFICER', 'ABLE_SEAMAN')).toBe(true);
    expect(roleMatches('CHIEF_ENGINEER', 'SECOND_ENGINEER')).toBe(true);
  });

  it('junior rank cannot fill senior billet', () => {
    expect(roleMatches('ABLE_SEAMAN', 'MASTER')).toBe(false);
    expect(roleMatches('SECOND_OFFICER', 'MASTER')).toBe(false);
    expect(roleMatches('SECOND_ENGINEER', 'CHIEF_ENGINEER')).toBe(false);
  });

  it('deck and engineering are separate tracks', () => {
    expect(roleMatches('MASTER', 'CHIEF_ENGINEER')).toBe(false);
    expect(roleMatches('CHIEF_ENGINEER', 'MASTER')).toBe(false);
  });
});

// ─── validateCertificateExpiry ────────────────────────────────────────────────

describe('validateCertificateExpiry', () => {
  it('returns null for a valid (future) certificate', () => {
    const result = validateCertificateExpiry(FUTURE_DATE, 'c1', 'Smith', 'STCW_COC');
    expect(result).toBeNull();
  });

  it('returns an error for an expired certificate', () => {
    const result = validateCertificateExpiry(PAST_DATE, 'c1', 'Smith', 'STCW_COC');
    expect(result).not.toBeNull();
    expect(result!.code).toBe('CERTIFICATE_EXPIRED');
    expect(result!.severity).toBe('error');
    expect(result!.crewMemberId).toBe('c1');
  });

  it('returns null for an unparseable date string (Invalid Date evaluates as NaN, not expired)', () => {
    // Note: new Date('not-a-date') returns Invalid Date in Node.js — it does NOT throw.
    // NaN < today === false, so the expiry check returns null.
    // The catch block in validateCertificateExpiry is defensive for environments that may throw.
    const result = validateCertificateExpiry('not-a-date', 'c1', 'Smith', 'STCW_COC');
    expect(result).toBeNull();
  });
});

// ─── checkCertificateExpiringWithin30Days ─────────────────────────────────────

describe('checkCertificateExpiringWithin30Days', () => {
  it('returns null for a certificate valid for more than 30 days', () => {
    const result = checkCertificateExpiringWithin30Days(FUTURE_DATE, 'c1', 'Smith', 'STCW_COC');
    expect(result).toBeNull();
  });

  it('returns a warning for a cert expiring within 30 days', () => {
    const result = checkCertificateExpiringWithin30Days(
      EXPIRING_SOON_DATE,
      'c1',
      'Smith',
      'STCW_COC'
    );
    expect(result).not.toBeNull();
    expect(result!.code).toBe('CERTIFICATE_EXPIRING_SOON');
    expect(result!.severity).toBe('warning');
  });

  it('returns null for an already-expired certificate (different error path)', () => {
    // Past dates result in negative days — not in the 1–30 window
    const result = checkCertificateExpiringWithin30Days(PAST_DATE, 'c1', 'Smith', 'STCW_COC');
    expect(result).toBeNull();
  });
});

// ─── validateMedicalCertificate ───────────────────────────────────────────────

describe('validateMedicalCertificate', () => {
  it('returns no errors when medical cert is valid', () => {
    const errors = validateMedicalCertificate('c1', 'Smith', true, FUTURE_DATE);
    expect(errors).toHaveLength(0);
  });

  it('returns MEDICAL_CERTIFICATE_MISSING error when hasMedical is false', () => {
    const errors = validateMedicalCertificate('c1', 'Smith', false);
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('MEDICAL_CERTIFICATE_MISSING');
    expect(errors[0].severity).toBe('error');
  });

  it('returns expiry error when medical cert is expired', () => {
    const errors = validateMedicalCertificate('c1', 'Smith', true, PAST_DATE);
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('CERTIFICATE_EXPIRED');
  });

  it('populates warnings array when medical cert is expiring within 30 days', () => {
    const warnings: any[] = [];
    const errors = validateMedicalCertificate('c1', 'Smith', true, EXPIRING_SOON_DATE, warnings);
    expect(errors).toHaveLength(0); // Not an error — a warning
    expect(warnings).toHaveLength(1);
    expect(warnings[0].code).toBe('CERTIFICATE_EXPIRING_SOON');
  });

  it('does not push warnings when warnings array is not provided', () => {
    // Should not throw when warnings param is undefined
    expect(() => validateMedicalCertificate('c1', 'Smith', true, EXPIRING_SOON_DATE)).not.toThrow();
  });
});

// ─── validateCrewCompliance ───────────────────────────────────────────────────

describe('validateCrewCompliance', () => {
  it('marks crew as compliant when all certs and medical are valid', () => {
    const crew = [getMockCrewMember()];
    const result = validateCrewCompliance(crew);
    expect(result.compliant).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('reports error for crew member missing medical cert', () => {
    const crew = [getMockCrewMember({ hasMedical: false, medicalExpiryDate: undefined })];
    const result = validateCrewCompliance(crew);
    expect(result.compliant).toBe(false);
    expect(result.errors.some((e) => e.code === 'MEDICAL_CERTIFICATE_MISSING')).toBe(true);
  });

  it('reports error for crew member with expired STCW cert', () => {
    const crew = [
      getMockCrewMember({
        certifications: [{ type: 'STCW_COC', expiryDate: PAST_DATE }],
      }),
    ];
    const result = validateCrewCompliance(crew);
    expect(result.compliant).toBe(false);
    expect(result.errors.some((e) => e.code === 'CERTIFICATE_EXPIRED')).toBe(true);
  });

  it('reports warning (not error) for cert expiring within 30 days', () => {
    const crew = [
      getMockCrewMember({
        certifications: [{ type: 'STCW_COC', expiryDate: EXPIRING_SOON_DATE }],
      }),
    ];
    const result = validateCrewCompliance(crew);
    expect(result.compliant).toBe(true); // Warnings don't affect compliant flag
    expect(result.warnings.some((w) => w.code === 'CERTIFICATE_EXPIRING_SOON')).toBe(true);
  });

  it('handles empty crew roster as compliant', () => {
    const result = validateCrewCompliance([]);
    expect(result.compliant).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ─── validateSafeManningRequirement ──────────────────────────────────────────

describe('validateSafeManningRequirement', () => {
  it('returns compliant when crew meets exact requirements', () => {
    const crew = [{ id: 'c1', name: 'Master Smith', role: 'MASTER' as any }];
    const result = validateSafeManningRequirement(crew, {
      requirements: [{ role: 'MASTER', minimumCount: 1 }],
    });
    expect(result.compliant).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns error when a required role is not filled', () => {
    const crew = [{ id: 'c1', name: 'Smith', role: 'ABLE_SEAMAN' as any }];
    const result = validateSafeManningRequirement(crew, {
      requirements: [
        { role: 'MASTER', minimumCount: 1 },
        { role: 'ABLE_SEAMAN', minimumCount: 1 },
      ],
    });
    expect(result.compliant).toBe(false);
    expect(result.errors.some((e) => e.code === 'INSUFFICIENT_CREW')).toBe(true);
  });

  it('applies tonnage-based heuristic when no requirements provided', () => {
    // A small vessel (< 500 GT) needs at least MASTER
    const crew = [{ id: 'c1', name: 'Smith', role: 'MASTER' as any }];
    const result = validateSafeManningRequirement(crew, {
      vesselGrossTonnage: 400,
    });
    // MASTER is satisfied; other roles may fail
    expect(result.required['MASTER']).toBe(1);
    expect(result.fulfillableByRole['MASTER']).toBeGreaterThanOrEqual(1);
  });

  it('returns MISSING_SAFE_MANNING_INPUT error when no requirements and no tonnage', () => {
    const crew = getMockCrewRoster();
    const result = validateSafeManningRequirement(crew, {});
    expect(result.compliant).toBe(false);
    expect(result.errors[0].code).toBe('MISSING_SAFE_MANNING_INPUT');
  });

  it('allows senior rank to satisfy junior role billet', () => {
    // MASTER can fill CHIEF_OFFICER billet via substitution
    const crew = [{ id: 'c1', name: 'Smith', role: 'MASTER' as any }];
    const result = validateSafeManningRequirement(crew, {
      requirements: [{ role: 'CHIEF_OFFICER', minimumCount: 1 }],
    });
    expect(result.compliant).toBe(true);
  });
});
