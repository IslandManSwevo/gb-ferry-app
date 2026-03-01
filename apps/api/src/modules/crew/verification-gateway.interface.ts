import { Certification } from '@gbferry/database';

export interface VerificationResult {
  verified: boolean;
  authorityResponse: Record<string, unknown>;
  verificationDate: Date;
  status: 'VALID' | 'INVALID' | 'PENDING' | 'NOT_FOUND' | 'ERROR';
}

/**
 * Strategy-pattern interface for certificate verification gateways.
 * Each implementation targets a specific maritime authority (BMA, IMO, etc).
 */
export interface VerificationGateway {
  /** Verify a certification against an external registry. */
  verify(certification: Certification): Promise<VerificationResult>;

  /** Whether this gateway can handle a cert from the given country/authority. */
  supports(issuingCountry: string, issuingAuthority: string): boolean;
}

/** NestJS DI injection token for VerificationGateway providers. */
export const VERIFICATION_GATEWAY = 'VERIFICATION_GATEWAY';
