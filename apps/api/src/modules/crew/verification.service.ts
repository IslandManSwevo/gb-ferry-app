import { Certification } from '@gbferry/database';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  VERIFICATION_GATEWAY,
  VerificationGateway,
  VerificationResult,
} from './verification-gateway.interface';

/**
 * Orchestrator service that routes verification requests to the appropriate gateway.
 *
 * Uses strategy pattern: each gateway implements `supports()` to declare which
 * issuing country / authority it handles. The first matching gateway wins.
 *
 * If no gateway matches, returns NOT_FOUND status (graceful degradation).
 *
 * Skills applied:
 *   - nestjs-expert: DI token injection, provider array pattern
 *   - api-patterns: interface abstraction, separation of transport from logic
 *   - cc-skill-backend-patterns: service layer pattern — business logic separated from data access
 */
@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    @Inject(VERIFICATION_GATEWAY)
    private readonly gateways: VerificationGateway[]
  ) {
    this.logger.log(`VerificationService initialized with ${this.gateways.length} gateway(s)`);
  }

  /**
   * Verify a certification by routing to the first gateway that supports it.
   */
  async verifyCertification(certification: Certification): Promise<VerificationResult> {
    const gateway = this.gateways.find((g) =>
      g.supports(certification.issuingCountry, certification.issuingAuthority)
    );

    if (!gateway) {
      this.logger.warn(
        `No verification gateway found for country=${certification.issuingCountry}, ` +
          `authority=${certification.issuingAuthority}`
      );

      return {
        verified: false,
        status: 'NOT_FOUND',
        authorityResponse: {
          source: 'VerificationService',
          reason: `No gateway registered for ${certification.issuingCountry} / ${certification.issuingAuthority}`,
          timestamp: new Date().toISOString(),
        },
        verificationDate: new Date(),
      };
    }

    this.logger.log(
      `Routing cert ${certification.certificateNumber} → ${gateway.constructor.name}`
    );

    return gateway.verify(certification);
  }
}
