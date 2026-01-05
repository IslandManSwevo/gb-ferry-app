/**
 * Crew & Certification Validators
 *
 * Implements BMA Safe Manning Regulations (R106)
 * and STCW/Medical Certificate compliance checks
 */

import { CrewRole } from '@gbferry/dto';

/**
 * Validation error structure
 */
export interface CertificationError {
  crewMemberId: string;
  crewName: string;
  certificateType: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

/**
 * Safe Manning Requirement per BMA R106
 * Different vessel types have different crew role requirements
 */
export const SAFE_MANNING_REQUIREMENTS: Record<string, Record<string, number>> = {
  // Passenger Ferry (< 500 GT)
  FERRY_SMALL: {
    MASTER: 1,
    CHIEF_OFFICER: 1,
    ABLE_SEAMAN: 1,
    ENGINEER: 1,
  },

  // Passenger Ferry (500-3000 GT)
  FERRY_MEDIUM: {
    MASTER: 1,
    CHIEF_OFFICER: 1,
    SECOND_OFFICER: 1,
    ABLE_SEAMAN: 2,
    CHIEF_ENGINEER: 1,
    SECOND_ENGINEER: 1,
    RATING: 1,
  },

  // Passenger Ferry (> 3000 GT)
  FERRY_LARGE: {
    MASTER: 1,
    CHIEF_OFFICER: 1,
    SECOND_OFFICER: 2,
    THIRD_OFFICER: 1,
    ABLE_SEAMAN: 3,
    CHIEF_ENGINEER: 1,
    SECOND_ENGINEER: 2,
    THIRD_ENGINEER: 1,
    ELECTRO_TECHNICAL_OFFICER: 1,
    CHIEF_STEWARD: 1,
    STEWARD: 2,
  },
};

/**
 * Determine vessel category based on gross tonnage
 */
export function getVesselCategory(grossTonnage: number): string {
  if (grossTonnage < 500) {
    return 'FERRY_SMALL';
  } else if (grossTonnage < 3000) {
    return 'FERRY_MEDIUM';
  } else {
    return 'FERRY_LARGE';
  }
}

/**
 * Check if a crew role matches the required type
 * Some roles can substitute (e.g., DECK_OFFICER for ABLE_SEAMAN)
 */
export function roleMatches(actualRole: CrewRole, requiredRole: string): boolean {
  // Allow only equal or higher-ranked substitutions; never allow junior crew to fill senior billets
  const roleMap: Record<string, string[]> = {
    MASTER: ['MASTER'],
    CHIEF_OFFICER: ['CHIEF_OFFICER', 'MASTER'],
    SECOND_OFFICER: ['SECOND_OFFICER', 'CHIEF_OFFICER', 'MASTER'],
    THIRD_OFFICER: ['THIRD_OFFICER', 'SECOND_OFFICER', 'CHIEF_OFFICER', 'MASTER'],
    DECK_OFFICER: ['DECK_OFFICER', 'THIRD_OFFICER', 'SECOND_OFFICER', 'CHIEF_OFFICER', 'MASTER'],

    ABLE_SEAMAN: [
      'ABLE_SEAMAN',
      'DECK_OFFICER',
      'THIRD_OFFICER',
      'SECOND_OFFICER',
      'CHIEF_OFFICER',
      'MASTER',
    ],
    ORDINARY_SEAMAN: [
      'ORDINARY_SEAMAN',
      'ABLE_SEAMAN',
      'DECK_OFFICER',
      'THIRD_OFFICER',
      'SECOND_OFFICER',
      'CHIEF_OFFICER',
      'MASTER',
    ],
    RATING: [
      'RATING',
      'ORDINARY_SEAMAN',
      'ABLE_SEAMAN',
      'DECK_OFFICER',
      'THIRD_OFFICER',
      'SECOND_OFFICER',
      'CHIEF_OFFICER',
      'MASTER',
    ],

    CHIEF_ENGINEER: ['CHIEF_ENGINEER'],
    SECOND_ENGINEER: ['SECOND_ENGINEER', 'CHIEF_ENGINEER'],
    THIRD_ENGINEER: ['THIRD_ENGINEER', 'SECOND_ENGINEER', 'CHIEF_ENGINEER'],
    ENGINE_OFFICER: ['ENGINE_OFFICER', 'THIRD_ENGINEER', 'SECOND_ENGINEER', 'CHIEF_ENGINEER'],
    ELECTRO_TECHNICAL_OFFICER: ['ELECTRO_TECHNICAL_OFFICER', 'CHIEF_ENGINEER'],

    CHIEF_STEWARD: ['CHIEF_STEWARD'],
    STEWARD: ['STEWARD', 'CHIEF_STEWARD'],
    COOK: ['COOK', 'STEWARD', 'CHIEF_STEWARD'],
  };

  return (roleMap[requiredRole] || []).includes(actualRole);
}

/**
 * Validate safe manning for a vessel
 *
 * BMA R106: "The shipowner shall ensure that the ship is manned in accordance
 * with the Safe Manning Document."
 */
export function validateSafeManningRequirement(
  assignedCrew: Array<{ id: string; name: string; role: CrewRole }>,
  options: {
    requirements?: Array<{ role: string; minimumCount: number }>;
    vesselGrossTonnage?: number;
  } = {}
): {
  compliant: boolean;
  errors: CertificationError[];
  warnings: CertificationError[];
  required: Record<string, number>;
  /**
   * Assigned headcount by role as recorded on the roster.
   * Does not account for substitutions.
   */
  actualByRole: Record<string, number>;
  /**
   * Headcount per required role based on substitution rules (roleMatches).
   * Each requirement is evaluated independently, so a crew member may satisfy multiple required roles.
   */
  fulfillableByRole: Record<string, number>;
} {
  const errors: CertificationError[] = [];
  const warnings: CertificationError[] = [];

  // Build requirement map from the vessel's Safe Manning Document if provided
  const requirements: Record<string, number> = (options.requirements || []).reduce(
    (acc, req) => {
      acc[req.role] = Math.max(acc[req.role] || 0, req.minimumCount);
      return acc;
    },
    {} as Record<string, number>
  );

  // Fallback to tonnage-based heuristic only when no authoritative document exists
  if (!options.requirements || options.requirements.length === 0) {
    if (options.vesselGrossTonnage === undefined || options.vesselGrossTonnage === null) {
      return {
        compliant: false,
        errors: [
          {
            crewMemberId: '',
            crewName: 'Vessel Manning',
            certificateType: 'SAFE_MANNING',
            message:
              'Safe manning validation requires either vessel-specific requirements or gross tonnage.',
            code: 'MISSING_SAFE_MANNING_INPUT',
            severity: 'error',
          },
        ],
        warnings,
        required: {},
        actualByRole: {},
        fulfillableByRole: {},
      };
    }

    const category = getVesselCategory(options.vesselGrossTonnage);
    Object.assign(requirements, SAFE_MANNING_REQUIREMENTS[category]);
  }

  if (Object.keys(requirements).length === 0) {
    return {
      compliant: true,
      errors,
      warnings,
      required: {},
      actualByRole: {},
      fulfillableByRole: {},
    };
  }

  // Count crew by role
  const crewByRole: Record<string, number> = {};
  assignedCrew.forEach((crew) => {
    crewByRole[crew.role] = (crewByRole[crew.role] || 0) + 1;
  });

  // Track how many crew can fulfill each required role (considering substitution rules)
  const fulfillableByRole: Record<string, number> = {};

  // Check each requirement
  Object.entries(requirements).forEach(([requiredRole, requiredCount]) => {
    let actualCount = 0;

    // Count crew members that can fulfill this role
    assignedCrew.forEach((crew) => {
      if (roleMatches(crew.role, requiredRole)) {
        actualCount++;
      }
    });

    fulfillableByRole[requiredRole] = actualCount;

    if (actualCount < requiredCount) {
      errors.push({
        crewMemberId: '',
        crewName: 'Vessel Manning',
        certificateType: 'SAFE_MANNING',
        message: `Insufficient crew for role ${requiredRole}: required ${requiredCount}, assigned ${actualCount}`,
        code: 'INSUFFICIENT_CREW',
        severity: 'error',
      });
    }
  });

  return {
    compliant: errors.length === 0,
    errors,
    warnings,
    required: requirements,
    actualByRole: crewByRole,
    fulfillableByRole,
  };
}

// ===========================================
// CERTIFICATION VALIDATORS
// ===========================================

/**
 * BMA STCW Certificate Types
 * See: packages/dto/src/certification.ts
 */
export const STCW_CERTIFICATE_TYPES = [
  'STCW_OFFICER_IN_CHARGE',
  'STCW_MASTER',
  'STCW_CHIEF_ENGINEER',
  'STCW_OFFICER_IN_CHARGE_ENGINEERING',
  'STCW_RESTRICTED',
  'STCW_BASIC_SAFETY',
  'STCW_ADVANCED_FIRE_FIGHTING',
  'STCW_FIRST_AID_CPR',
];

/**
 * Validate certificate is not expired
 */
export function validateCertificateExpiry(
  expiryDate: string,
  crewId: string,
  crewName: string,
  certType: string
): CertificationError | null {
  try {
    const expiry = new Date(expiryDate);
    const today = new Date();

    if (expiry < today) {
      return {
        crewMemberId: crewId,
        crewName: crewName,
        certificateType: certType,
        message: `${certType} certificate expired on ${expiryDate}`,
        code: 'CERTIFICATE_EXPIRED',
        severity: 'error',
      };
    }

    return null;
  } catch {
    return {
      crewMemberId: crewId,
      crewName: crewName,
      certificateType: certType,
      message: 'Invalid certificate expiry date format',
      code: 'INVALID_DATE',
      severity: 'error',
    };
  }
}

/**
 * Check if certificate is expiring within 30 days (warning level)
 */
export function checkCertificateExpiringWithin30Days(
  expiryDate: string,
  crewId: string,
  crewName: string,
  certType: string
): CertificationError | null {
  try {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
      return {
        crewMemberId: crewId,
        crewName: crewName,
        certificateType: certType,
        message: `${certType} certificate expires in ${daysUntilExpiry} days (${expiryDate})`,
        code: 'CERTIFICATE_EXPIRING_SOON',
        severity: 'warning',
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Validate medical (ENG1 or PEME) certificate
 * BMA requirement: All crew must have valid medical certificate
 */
export function validateMedicalCertificate(
  crewId: string,
  crewName: string,
  hasMedical: boolean,
  medicalExpiryDate?: string
): CertificationError[] {
  const errors: CertificationError[] = [];

  // Medical certificate is required
  if (!hasMedical) {
    errors.push({
      crewMemberId: crewId,
      crewName: crewName,
      certificateType: 'MEDICAL_ENG1',
      message: 'Medical certificate (ENG1 or PEME) is required',
      code: 'MEDICAL_CERTIFICATE_MISSING',
      severity: 'error',
    });
  } else if (medicalExpiryDate) {
    // Check expiry
    const expiryError = validateCertificateExpiry(
      medicalExpiryDate,
      crewId,
      crewName,
      'MEDICAL_ENG1'
    );
    if (expiryError) {
      errors.push(expiryError);
    }

    // Check if expiring soon
    const expiringWarning = checkCertificateExpiringWithin30Days(
      medicalExpiryDate,
      crewId,
      crewName,
      'MEDICAL_ENG1'
    );
    if (expiringWarning) {
      // Note: This would be added to warnings, not errors
    }
  }

  return errors;
}

/**
 * Comprehensive crew compliance check
 * Validates all certifications for a crew roster
 */
export function validateCrewCompliance(
  crew: Array<{
    id: string;
    name: string;
    role: CrewRole;
    hasMedical: boolean;
    medicalExpiryDate?: string;
    certifications: Array<{
      type: string;
      expiryDate: string;
    }>;
  }>
): {
  compliant: boolean;
  errors: CertificationError[];
  warnings: CertificationError[];
} {
  const errors: CertificationError[] = [];
  const warnings: CertificationError[] = [];

  crew.forEach((crewMember) => {
    // 1. Medical certificate
    const medicalErrors = validateMedicalCertificate(
      crewMember.id,
      crewMember.name,
      crewMember.hasMedical,
      crewMember.medicalExpiryDate
    );
    errors.push(...medicalErrors);

    // 2. STCW certifications
    crewMember.certifications.forEach((cert) => {
      // Check expiry
      const expiryError = validateCertificateExpiry(
        cert.expiryDate,
        crewMember.id,
        crewMember.name,
        cert.type
      );
      if (expiryError) {
        errors.push(expiryError);
      }

      // Check if expiring soon
      const expiringWarning = checkCertificateExpiringWithin30Days(
        cert.expiryDate,
        crewMember.id,
        crewMember.name,
        cert.type
      );
      if (expiringWarning) {
        warnings.push(expiringWarning);
      }
    });
  });

  return {
    compliant: errors.length === 0,
    errors,
    warnings,
  };
}
