import { Injectable, Logger } from '@nestjs/common';
import { ACEGateway, ACESubmissionResult } from './ace-gateway.interface';

@Injectable()
export class MockACEGateway implements ACEGateway {
  private readonly logger = new Logger(MockACEGateway.name);

  async submitCrewList(
    vesselData: any,
    formType: 'I_418' | 'eNOAD'
  ): Promise<ACESubmissionResult> {
    this.logger.log(`Mocking CBP ACE Submission for ${formType} - Vessel: ${vesselData.vesselId}`);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Simulate a failure for specific test cases (e.g., if vessel name is 'FAKE')
    if (vesselData.vesselInfo?.name?.includes('FAKE')) {
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
      message: `CBP ACE received ${vesselData.crew.length} crew records for vessel ${vesselData.vesselInfo?.imoNumber}`,
      timestamp: new Date(),
    };
  }
}
