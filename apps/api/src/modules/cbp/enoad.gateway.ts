import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ACECrewPayload, ACEGateway, ACESubmissionResult } from './ace-gateway.interface';

/**
 * eNOAD SOAP gateway for CBP crew list submission.
 *
 * Based on research: US crew manifests go through the USCG eNOAD system
 * (Electronic Notice of Arrival/Departure), which exposes a SOAP web service
 * at noad.nvmc.uscg.gov.
 *
 * Methods: noadSubmit (takes XML string, returns GUID)
 * Test endpoint: https://testnoad.nvmc.uscg.gov/noadwebservice/noadwebservice.asmx
 * Prod endpoint: https://noad.nvmc.uscg.gov/noadwebservice/noadwebservice.asmx
 *
 * This gateway:
 *   - Builds SOAP XML envelope from typed ACECrewPayload
 *   - POSTs to the noadSubmit SOAP action
 *   - Parses GUID from response
 *   - Retry: 2 attempts, exponential backoff
 *   - Timeout: 30s
 *
 * Environment: ENOAD_URL, ENOAD_TEST_URL
 */
@Injectable()
export class EnoAdGateway implements ACEGateway {
  private readonly logger = new Logger(EnoAdGateway.name);
  private readonly endpointUrl: string;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    const isTest = this.configService.get<string>('ENOAD_ENVIRONMENT', 'test') === 'test';
    this.endpointUrl = isTest
      ? this.configService.get<string>(
          'ENOAD_TEST_URL',
          'https://testnoad.nvmc.uscg.gov/noadwebservice/noadwebservice.asmx'
        )
      : this.configService.get<string>(
          'ENOAD_URL',
          'https://noad.nvmc.uscg.gov/noadwebservice/noadwebservice.asmx'
        );
    this.timeoutMs = this.configService.get<number>('ENOAD_TIMEOUT_MS', 30_000);

    this.logger.log(
      `eNOAD Gateway initialized → ${this.endpointUrl} (${isTest ? 'TEST' : 'PROD'})`
    );
  }

  async submitCrewList(
    payload: ACECrewPayload,
    formType: 'I_418' | 'eNOAD'
  ): Promise<ACESubmissionResult> {
    this.logger.log(
      `Submitting ${formType} via eNOAD SOAP — vessel ${payload.vesselInfo.imoNumber}, ` +
        `${payload.crew.length} crew members`
    );

    const soapXml = this.buildSoapEnvelope(payload, formType);

    try {
      const result = await this.sendWithRetry(soapXml, 2);
      this.logger.log(`eNOAD submission accepted: ${result.submissionId}`);
      return result;
    } catch (error) {
      this.logger.error(`eNOAD submission failed: ${(error as Error).message}`);
      return {
        submissionId: `ENOAD-FAIL-${Date.now()}`,
        status: 'REJECTED',
        message: `eNOAD SOAP submission failed: ${(error as Error).message}`,
        timestamp: new Date(),
      };
    }
  }

  private async sendWithRetry(soapXml: string, maxRetries: number): Promise<ACESubmissionResult> {
    let lastError: Error = new Error('No attempts made');

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await this.executeSoapRequest(soapXml);
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries) {
          const delay = Math.pow(2, i) * 2000; // 2s, 4s
          this.logger.warn(`eNOAD attempt ${i + 1} failed, retrying in ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  }

  private async executeSoapRequest(soapXml: string): Promise<ACESubmissionResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(this.endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          SOAPAction: '"http://noadwebservice/noadSubmit"',
        },
        body: soapXml,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`eNOAD HTTP ${response.status}: ${response.statusText}`);
      }

      const responseXml = await response.text();
      return this.parseSoapResponse(responseXml);
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseSoapResponse(xml: string): ACESubmissionResult {
    // Extract GUID from SOAP response envelope
    const guidMatch =
      xml.match(/<noadSubmitResult>(.+?)<\/noadSubmitResult>/i) ||
      xml.match(/<guid>(.+?)<\/guid>/i) ||
      xml.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);

    if (!guidMatch) {
      // Check for SOAP fault
      const faultMatch = xml.match(/<faultstring>(.+?)<\/faultstring>/i);
      if (faultMatch) {
        throw new Error(`eNOAD SOAP Fault: ${faultMatch[1]}`);
      }
      throw new Error('eNOAD response did not contain a submission GUID');
    }

    return {
      submissionId: guidMatch[1],
      status: 'ACCEPTED',
      message: `eNOAD received submission. Tracking GUID: ${guidMatch[1]}`,
      timestamp: new Date(),
    };
  }

  /**
   * Build SOAP envelope for the noadSubmit method.
   * The XML schema follows the NVMC eNOAD specification.
   */
  private buildSoapEnvelope(payload: ACECrewPayload, formType: string): string {
    const crewXml = payload.crew
      .map(
        (member) => `
        <CrewMember>
          <FamilyName>${this.escapeXml(member.familyName)}</FamilyName>
          <GivenNames>${this.escapeXml(member.givenNames)}</GivenNames>
          <DateOfBirth>${member.dateOfBirth}</DateOfBirth>
          <Nationality>${this.escapeXml(member.nationality)}</Nationality>
          <PassportNumber>${this.escapeXml(member.travelDocNumber)}</PassportNumber>
          <Rank>${this.escapeXml(member.role)}</Rank>
        </CrewMember>`
      )
      .join('');

    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:noad="http://noadwebservice/">
  <soap:Header/>
  <soap:Body>
    <noad:noadSubmit>
      <noad:xmlData><![CDATA[
        <NOAD>
          <FormType>${formType}</FormType>
          <SubmissionTime>${payload.submissionTime.toISOString()}</SubmissionTime>
          <Vessel>
            <Name>${this.escapeXml(payload.vesselInfo.name)}</Name>
            <IMONumber>${this.escapeXml(payload.vesselInfo.imoNumber)}</IMONumber>
            <CallSign>${this.escapeXml(payload.vesselInfo.callSign || '')}</CallSign>
            <Flag>${this.escapeXml(payload.vesselInfo.flag)}</Flag>
          </Vessel>
          <CrewList>${crewXml}
          </CrewList>
        </NOAD>
      ]]></noad:xmlData>
    </noad:noadSubmit>
  </soap:Body>
</soap:Envelope>`;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
