export interface ACESubmissionResult {
  submissionId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'PENDING';
  message?: string;
  timestamp: Date;
}

export interface ACEGateway {
  submitCrewList(
    vesselData: any, 
    formType: 'I_418' | 'eNOAD'
  ): Promise<ACESubmissionResult>;
}

export const ACE_GATEWAY = 'ACE_GATEWAY';
