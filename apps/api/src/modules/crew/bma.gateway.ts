import { Certification } from '@gbferry/database';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VerificationGateway, VerificationResult } from './verification-gateway.interface';

/**
 * Resilient HTTP client utility — exponential backoff retry.
 * Pattern from cc-skill-backend-patterns.
 */
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: Error = new Error('fetchWithRetry: no attempts made');

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * baseDelayMs;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

/**
 * Real BMA BORIS verification gateway.
 *
 * Connects to the Bahamas Maritime Authority's BORIS (Bahamas Online
 * Registration Information System) certificate verification endpoint.
 *
 * - Supports BS (Bahamas) certs and any authority containing 'bahamas'
 * - Uses structured HTTP POST to BORIS verification endpoint
 * - Retry: 3 attempts, exponential backoff (1s, 2s, 4s)
 * - Circuit breaker: fail-open after consecutive failures
 * - Timeout: 10s per request
 *
 * Environment: BMA_VERIFICATION_URL
 */
@Injectable()
export class BMAGateway implements VerificationGateway {
  private readonly logger = new Logger(BMAGateway.name);
  private readonly verificationUrl: string;
  private readonly timeoutMs: number;

  // Simple circuit breaker state
  private consecutiveFailures = 0;
  private readonly maxConsecutiveFailures = 5;
  private circuitOpenUntil: Date | null = null;
  private readonly circuitResetMs = 60_000; // 1 min

  constructor(private readonly configService: ConfigService) {
    this.verificationUrl = this.configService.get<string>(
      'BMA_VERIFICATION_URL',
      'https://www.bahamasmaritime.com/verify'
    );
    this.timeoutMs = this.configService.get<number>('BMA_TIMEOUT_MS', 10_000);

    this.logger.log(`BMAGateway initialized → ${this.verificationUrl}`);
  }

  supports(issuingCountry: string, issuingAuthority: string): boolean {
    return issuingCountry === 'BS' || issuingAuthority.toLowerCase().includes('bahamas');
  }

  async verify(certification: Certification): Promise<VerificationResult> {
    this.logger.log(`Verifying cert ${certification.certificateNumber} via BMA BORIS`);

    // Circuit breaker — fail-open
    if (this.isCircuitOpen()) {
      this.logger.warn('BMA circuit breaker OPEN — returning PENDING status');
      return this.pendingResult(
        certification,
        'Circuit breaker open — BMA temporarily unavailable'
      );
    }

    try {
      const result = await fetchWithRetry(() => this.callBorisEndpoint(certification), 3, 1000);

      // Success — reset circuit breaker
      this.consecutiveFailures = 0;
      this.circuitOpenUntil = null;

      return result;
    } catch (error) {
      this.consecutiveFailures++;
      this.logger.error(
        `BMA verification failed (${this.consecutiveFailures}/${this.maxConsecutiveFailures}): ${(error as Error).message}`
      );

      if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
        this.circuitOpenUntil = new Date(Date.now() + this.circuitResetMs);
        this.logger.error(
          `BMA circuit breaker OPENED — will retry after ${this.circuitOpenUntil.toISOString()}`
        );
      }

      return this.errorResult(certification, (error as Error).message);
    }
  }

  /**
   * Makes an HTTP request to the BORIS verification endpoint.
   * In production, this sends the certificate number and tracking info.
   */
  private async callBorisEndpoint(certification: Certification): Promise<VerificationResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(this.verificationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'text/html, application/json',
        },
        body: new URLSearchParams({
          certificateNumber: certification.certificateNumber,
          issuingAuthority: certification.issuingAuthority,
          certificateType: certification.type,
        }).toString(),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`BMA BORIS returned HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        return this.parseJsonResponse(
          certification,
          (await response.json()) as Record<string, unknown>
        );
      }

      // BORIS returns HTML — parse the verification status from the page
      return this.parseHtmlResponse(certification, await response.text());
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseJsonResponse(
    certification: Certification,
    data: Record<string, unknown>
  ): VerificationResult {
    const status = data.status as string;
    const isValid = status === 'VALID' || status === 'valid';

    return {
      verified: isValid,
      status: isValid ? 'VALID' : 'INVALID',
      authorityResponse: {
        source: 'Bahamas Maritime Authority (BMA) BORIS',
        raw: data,
        timestamp: new Date().toISOString(),
      },
      verificationDate: new Date(),
    };
  }

  private parseHtmlResponse(certification: Certification, html: string): VerificationResult {
    // Look for known patterns in the BORIS verification page
    const lowerHtml = html.toLowerCase();
    const isValid =
      lowerHtml.includes('certificate is valid') ||
      lowerHtml.includes('verification successful') ||
      lowerHtml.includes('status: valid');

    const isNotFound =
      lowerHtml.includes('not found') ||
      lowerHtml.includes('no records') ||
      lowerHtml.includes('no matching certificate');

    let status: VerificationResult['status'] = 'INVALID';
    if (isValid) status = 'VALID';
    else if (isNotFound) status = 'NOT_FOUND';

    return {
      verified: isValid,
      status,
      authorityResponse: {
        source: 'Bahamas Maritime Authority (BMA) BORIS — HTML parsed',
        timestamp: new Date().toISOString(),
        certNumber: certification.certificateNumber,
        htmlLength: html.length,
      },
      verificationDate: new Date(),
    };
  }

  private isCircuitOpen(): boolean {
    if (!this.circuitOpenUntil) return false;
    if (new Date() > this.circuitOpenUntil) {
      // Circuit half-open — allow retry
      this.circuitOpenUntil = null;
      this.consecutiveFailures = 0;
      this.logger.log('BMA circuit breaker HALF-OPEN — allowing retry');
      return false;
    }
    return true;
  }

  private pendingResult(cert: Certification, reason: string): VerificationResult {
    return {
      verified: false,
      status: 'PENDING',
      authorityResponse: {
        source: 'BMA Gateway',
        reason,
        certNumber: cert.certificateNumber,
        timestamp: new Date().toISOString(),
      },
      verificationDate: new Date(),
    };
  }

  private errorResult(cert: Certification, errorMessage: string): VerificationResult {
    return {
      verified: false,
      status: 'ERROR',
      authorityResponse: {
        source: 'BMA Gateway',
        error: errorMessage,
        certNumber: cert.certificateNumber,
        timestamp: new Date().toISOString(),
      },
      verificationDate: new Date(),
    };
  }
}
