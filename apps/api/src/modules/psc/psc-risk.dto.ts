export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface RiskBreakdownItem {
  category: string;
  points: number;
  description: string;
}

export class PscRiskResponse {
  vesselId!: string;
  score!: number;
  level!: RiskLevel;
  breakdown!: RiskBreakdownItem[];
  calculatedAt!: Date;
}
