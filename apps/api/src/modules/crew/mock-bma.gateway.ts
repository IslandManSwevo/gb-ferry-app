import { Certification } from '@gbferry/database';
import { Injectable, Logger } from '@nestjs/common';
import { VerificationGateway, VerificationResult } from './verification-gateway.interface';

/**
 * Mock BMA/IMO verification gateway for development and testing.
 * Simulates network latency and returns deterministic results based on cert data.
 *
 * Behavior:
 *   - Certs with 'FAKE' in certificateNumber → INVALID
 *   - Expired certs → INVALID
 *   - All others → VALID
 */
@Injectable()
export class MockBMAGateway implements VerificationGateway {
  private readonly logger = new Logger(MockBMAGateway.name);

  supports(_issuingCountry: string, _issuingAuthority: string): boolean {
    // Mock handles everything — used as fallback in dev
    return true;
  }

  async verify(certification: Certification): Promise<VerificationResult> {
    this.logger.log(
      `[MOCK] Verifying cert ${certification.certificateNumber} ` +
        `from ${certification.issuingAuthority} (${certification.issuingCountry})`
    );

    // Simulate network delay (200-600ms)
    await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 400));

    const isFake = certification.certificateNumber.includes('FAKE');
    const isExpired = certification.expiryDate < new Date();
    const isValid = !isFake && !isExpired;

    const source =
      certification.issuingCountry === 'BS'
        ? 'Bahamas Maritime Authority (BMA) — MOCK'
        : 'IMO GISIS Verification Service — MOCK';

    return {
      verified: isValid,
      status: isValid ? 'VALID' : 'INVALID',
      authorityResponse: {
        source,
        timestamp: new Date().toISOString(),
        reference: `MOCK-VR-${Math.floor(Math.random() * 1000000)}`,
        matchDetails: {
          name: isValid ? 'MATCHED' : 'MISMATCH',
          number: certification.certificateNumber,
          expiry: certification.expiryDate.toISOString(),
        },
      },
      verificationDate: new Date(),
    };
  }
}
