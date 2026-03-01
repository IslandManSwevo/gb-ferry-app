export interface ACECrewEntry {
  familyName: string;
  givenNames: string;
  dateOfBirth: string;
  nationality: string;
  travelDocNumber: string;
  role: string;
}

export interface ACECrewPayload {
  vesselId: string;
  vesselInfo: {
    name: string;
    imoNumber: string;
    callSign?: string;
    flag: string;
  };
  crew: ACECrewEntry[];
  submissionTime: Date;
}

export interface ACESubmissionResult {
  submissionId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'PENDING';
  message?: string;
  timestamp: Date;
}

export interface ACEGateway {
  submitCrewList(
    payload: ACECrewPayload,
    formType: 'I_418' | 'eNOAD'
  ): Promise<ACESubmissionResult>;
}

export const ACE_GATEWAY = 'ACE_GATEWAY';
