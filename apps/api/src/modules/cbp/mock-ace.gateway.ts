import { Injectable, Logger } from '@nestjs/common';
import { ACECrewPayload, ACEGateway, ACESubmissionResult } from './ace-gateway.interface';

@Injectable()
export class MockACEGateway implements ACEGateway {
  private readonly logger = new Logger(MockACEGateway.name);

  async submitCrewList(
    payload: ACECrewPayload,
    formType: 'I_418' | 'eNOAD'
  ): Promise<ACESubmissionResult> {
    this.logger.log(
      `[MOCK] CBP ACE Submission for ${formType} — Vessel: ${payload.vesselId}, ` +
        `crew count: ${payload.crew.length}`
    );

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Simulate rejection for FAKE vessels
    if (payload.vesselInfo.name.includes('FAKE')) {
      return {
        submissionId: `ACE-REJECT-${Date.now()}`,
        status: 'REJECTED',
        message: 'Invalid IMO number or Vessel Name mismatched in ACE registry.',
        timestamp: new Date(),
      };
    }

    return {
      submissionId: `ACE-${formType}-${Date.now()}`,
      status: 'ACCEPTED',
      message: `CBP ACE received ${payload.crew.length} crew records for vessel ${payload.vesselInfo.imoNumber}`,
      timestamp: new Date(),
    };
  }
}
