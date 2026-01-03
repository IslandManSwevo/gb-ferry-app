export const ROLES = {
  ADMIN: 'admin',
  COMPLIANCE_OFFICER: 'compliance_officer',
  OPERATIONS: 'operations',
  CAPTAIN: 'captain',
  REGULATOR: 'regulator',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const FEATURE_ACCESS: Record<string, Role[]> = {
  // Passenger features
  'passengers.checkin': [ROLES.ADMIN, ROLES.OPERATIONS, ROLES.CAPTAIN],
  'passengers.view': [ROLES.ADMIN, ROLES.OPERATIONS, ROLES.CAPTAIN, ROLES.COMPLIANCE_OFFICER],
  'manifests.generate': [ROLES.ADMIN, ROLES.OPERATIONS],
  'manifests.approve': [ROLES.ADMIN, ROLES.CAPTAIN],
  'manifests.submit': [ROLES.ADMIN, ROLES.COMPLIANCE_OFFICER],

  // Crew features
  'crew.manage': [ROLES.ADMIN, ROLES.CAPTAIN],
  'crew.view': [ROLES.ADMIN, ROLES.CAPTAIN, ROLES.COMPLIANCE_OFFICER],
  'certifications.manage': [ROLES.ADMIN, ROLES.COMPLIANCE_OFFICER],
  'certifications.view': [ROLES.ADMIN, ROLES.CAPTAIN, ROLES.COMPLIANCE_OFFICER],

  // Vessel features
  'vessels.manage': [ROLES.ADMIN],
  'vessels.view': [ROLES.ADMIN, ROLES.CAPTAIN, ROLES.COMPLIANCE_OFFICER],
  'documents.upload': [ROLES.ADMIN, ROLES.COMPLIANCE_OFFICER],

  // Compliance features
  'compliance.dashboard': [ROLES.ADMIN, ROLES.COMPLIANCE_OFFICER],
  'compliance.export': [ROLES.ADMIN, ROLES.COMPLIANCE_OFFICER],
  'compliance.reports': [ROLES.ADMIN, ROLES.COMPLIANCE_OFFICER, ROLES.REGULATOR],
  'inspections.manage': [ROLES.ADMIN, ROLES.COMPLIANCE_OFFICER],

  // Audit
  'audit.view': [ROLES.ADMIN, ROLES.COMPLIANCE_OFFICER, ROLES.REGULATOR],

  // Settings
  'settings.manage': [ROLES.ADMIN],
};

export function canAccess(roles: string[], feature: string): boolean {
  const allowedRoles = FEATURE_ACCESS[feature] || [];
  return roles.some((role) => allowedRoles.includes(role as Role));
}
