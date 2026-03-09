import { STCWRoleName, STCW_ROLE_HIERARCHY } from '@gbferry/dto';
import { Injectable, Logger } from '@nestjs/common';

export interface SubstitutionCheckResult {
  canSubstitute: boolean;
  reason?: string;
}

@Injectable()
export class STCWSubstitutionService {
  private readonly logger = new Logger(STCWSubstitutionService.name);

  /**
   * Checks if a certificate for 'heldRole' can be used to fulfill a requirement for 'requiredRole'
   */
  canSubstitute(requiredRole: string, heldRole: string): SubstitutionCheckResult {
    // 1. Guard against empty roles
    if (!requiredRole || !heldRole) {
      return { canSubstitute: false, reason: 'Missing role information' };
    }

    // 2. Exact match is always allowed
    if (requiredRole === heldRole) {
      return { canSubstitute: true };
    }

    // 3. Lookup the requirement in the hierarchy
    const reqRole = requiredRole as STCWRoleName;
    const requiredDef = STCW_ROLE_HIERARCHY[reqRole];

    if (!requiredDef) {
      return {
        canSubstitute: false,
        reason: `Required role '${requiredRole}' not found in STCW hierarchy`,
      };
    }

    // 4. Check if the held role is in the substitution list
    const substitutionList = Array.isArray(requiredDef.canBeFilledBy)
      ? requiredDef.canBeFilledBy
      : [];

    if (substitutionList.includes(heldRole as STCWRoleName)) {
      return { canSubstitute: true };
    }

    return {
      canSubstitute: false,
      reason: `${heldRole} is not an authorized substitute for ${requiredRole}. Authorized: ${substitutionList.join(
        ', '
      )}`,
    };
  }

  /**
   * Determine whether a vessel should be assessed under STCW II/1 or II/3
   * based on its gross tonnage.
   * Ferries under 500 GT operating near-coastal use the II/3 standard.
   */
  getApplicableSTCWRegulation(role: string, vesselGT: number): string {
    const roleName = role as STCWRoleName;
    const def = STCW_ROLE_HIERARCHY[roleName];

    if (!def) {
      throw new Error(`Role '${role}' is not a recognized STCW role in the hierarchy.`);
    }

    if (def.gtThreshold && vesselGT < def.gtThreshold && def.stcwRegulationSmallVessel) {
      return def.stcwRegulationSmallVessel;
    }
    return def.stcwRegulation;
  }
}
