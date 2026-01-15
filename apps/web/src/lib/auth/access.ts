export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  COMPLIANCE_OFFICER: 'compliance_officer',
  OPERATIONS: 'operations',
  CAPTAIN: 'captain',
  REGULATOR: 'regulator',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const FEATURE_ACCESS: Record<string, Role[]> = {
  // Passenger features
  'passengers.checkin': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.OPERATIONS, ROLES.CAPTAIN],
  'passengers.view': [
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.OPERATIONS,
    ROLES.CAPTAIN,
    ROLES.COMPLIANCE_OFFICER,
  ],
  'manifests.generate': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.OPERATIONS],
  'manifests.approve': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.CAPTAIN],
  'manifests.submit': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COMPLIANCE_OFFICER],

  // Crew features
  'crew.manage': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.CAPTAIN],
  'crew.view': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.CAPTAIN, ROLES.COMPLIANCE_OFFICER],
  'certifications.manage': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COMPLIANCE_OFFICER],
  'certifications.view': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.CAPTAIN, ROLES.COMPLIANCE_OFFICER],

  // Vessel features
  'vessels.manage': [ROLES.SUPERADMIN, ROLES.ADMIN],
  'vessels.view': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.CAPTAIN, ROLES.COMPLIANCE_OFFICER],
  'documents.upload': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COMPLIANCE_OFFICER],

  // Compliance features
  'compliance.dashboard': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COMPLIANCE_OFFICER],
  'compliance.export': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COMPLIANCE_OFFICER],
  'compliance.reports': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COMPLIANCE_OFFICER, ROLES.REGULATOR],
  'inspections.manage': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COMPLIANCE_OFFICER],

  // Audit
  'audit.view': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COMPLIANCE_OFFICER, ROLES.REGULATOR],

  // Settings / System Management
  'settings.view': [
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.COMPLIANCE_OFFICER,
    ROLES.OPERATIONS,
    ROLES.CAPTAIN,
  ],
  'settings.org': [ROLES.SUPERADMIN, ROLES.ADMIN],
  'settings.users': [ROLES.SUPERADMIN, ROLES.ADMIN],
  'settings.roles': [ROLES.SUPERADMIN],
  'settings.ops-security': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.CAPTAIN],
  'settings.notifications': [
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.COMPLIANCE_OFFICER,
    ROLES.OPERATIONS,
    ROLES.CAPTAIN,
  ],
  'settings.compliance': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COMPLIANCE_OFFICER],
  'settings.integrations': [ROLES.SUPERADMIN, ROLES.ADMIN],
  'settings.audit': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COMPLIANCE_OFFICER],
  'settings.profile': [
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.COMPLIANCE_OFFICER,
    ROLES.OPERATIONS,
    ROLES.CAPTAIN,
    ROLES.REGULATOR,
  ],
};

export function canAccess(roles: string[], feature: string): boolean {
  const allowedRoles = FEATURE_ACCESS[feature] || [];
  // Superadmin always has access to everything
  if (roles.includes(ROLES.SUPERADMIN)) return true;
  return roles.some((role) => allowedRoles.includes(role as Role));
}
