export type STCWLevel = 'MANAGEMENT' | 'OPERATIONAL' | 'SUPPORT' | 'RATING' | 'BASIC';
export type STCWDepartment = 'DECK' | 'ENGINE' | 'RADIO' | 'SECURITY' | 'CATERING' | 'GENERAL';

/**
 * Valid STCW role names as defined in the hierarchy.
 */
export type STCWRoleName =
  | 'MASTER'
  | 'CHIEF_OFFICER'
  | 'SECOND_OFFICER'
  | 'THIRD_OFFICER'
  | 'DECK_OFFICER'
  | 'ABLE_SEAMAN'
  | 'ORDINARY_SEAMAN'
  | 'CHIEF_ENGINEER'
  | 'SECOND_ENGINEER'
  | 'THIRD_ENGINEER'
  | 'ENGINEER_OFFICER'
  | 'ENGINE_RATING'
  | 'CHIEF_COOK'
  | 'COOK'
  | 'PURSER'
  | 'SAFETY_OFFICER'
  | 'SHIP_SECURITY_OFFICER'
  | 'CROWD_CONTROL'
  | 'RADIO_OPERATOR';

export interface STCWRoleDefinition {
  role: STCWRoleName;
  level: STCWLevel;
  department: STCWDepartment;
  stcwRegulation: string;
  gtThreshold?: number;
  stcwRegulationSmallVessel?: string;
  canBeFilledBy: STCWRoleName[];
  revalidationMonths: number;
  bmaEndorsementRequired: boolean;
}

export const STCW_ROLE_HIERARCHY: Record<STCWRoleName, STCWRoleDefinition> = {
  MASTER: {
    role: 'MASTER',
    level: 'MANAGEMENT',
    department: 'DECK',
    stcwRegulation: 'STCW II/2',
    gtThreshold: 500,
    stcwRegulationSmallVessel: 'STCW II/3',
    canBeFilledBy: ['MASTER'],
    revalidationMonths: 60,
    bmaEndorsementRequired: true,
  },
  CHIEF_OFFICER: {
    role: 'CHIEF_OFFICER',
    level: 'MANAGEMENT',
    department: 'DECK',
    stcwRegulation: 'STCW II/2',
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
    stcwRegulation: 'STCW II/3',
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
  CHIEF_COOK: {
    role: 'CHIEF_COOK',
    level: 'SUPPORT',
    department: 'CATERING',
    stcwRegulation: 'MLC 3.2',
    canBeFilledBy: ['CHIEF_COOK'],
    revalidationMonths: 60,
    bmaEndorsementRequired: false,
  },
  COOK: {
    role: 'COOK',
    level: 'SUPPORT',
    department: 'CATERING',
    stcwRegulation: 'MLC 3.2',
    canBeFilledBy: ['CHIEF_COOK', 'COOK'],
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
  SHIP_SECURITY_OFFICER: {
    role: 'SHIP_SECURITY_OFFICER',
    level: 'OPERATIONAL',
    department: 'SECURITY',
    stcwRegulation: 'STCW VI/5',
    canBeFilledBy: ['MASTER', 'CHIEF_OFFICER', 'SHIP_SECURITY_OFFICER'],
    revalidationMonths: 60,
    bmaEndorsementRequired: true,
  },
  CROWD_CONTROL: {
    role: 'CROWD_CONTROL',
    level: 'BASIC',
    department: 'GENERAL',
    stcwRegulation: 'STCW V/2',
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
