export type STCWLevel = 'MANAGEMENT' | 'OPERATIONAL' | 'SUPPORT' | 'RATING' | 'BASIC';
export type STCWDepartment = 'DECK' | 'ENGINE' | 'RADIO' | 'SECURITY' | 'CATERING' | 'GENERAL';
export type STCWRoleName = 'MASTER' | 'CHIEF_OFFICER' | 'SECOND_OFFICER' | 'THIRD_OFFICER' | 'DECK_OFFICER' | 'ABLE_SEAMAN' | 'ORDINARY_SEAMAN' | 'CHIEF_ENGINEER' | 'SECOND_ENGINEER' | 'THIRD_ENGINEER' | 'ENGINEER_OFFICER' | 'ENGINE_RATING' | 'CHIEF_COOK' | 'COOK' | 'PURSER' | 'SAFETY_OFFICER' | 'SHIP_SECURITY_OFFICER' | 'CROWD_CONTROL' | 'RADIO_OPERATOR';
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
export declare const STCW_ROLE_HIERARCHY: Record<STCWRoleName, STCWRoleDefinition>;
