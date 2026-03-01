import { ConfigService } from '@nestjs/config';
import { ACECrewPayload } from './ace-gateway.interface';
import { EnoAdGateway } from './enoad.gateway';

// Mock global fetch
global.fetch = jest.fn();

describe('EnoAdGateway', () => {
  let gateway: EnoAdGateway;
  let configService: jest.Mocked<ConfigService>;

  const mockPayload: ACECrewPayload = {
    vesselId: 'test-vessel',
    vesselInfo: {
      name: 'Test Ship',
      imoNumber: 'IMO1234567',
      flag: 'BHS',
    },
    crew: [
      {
        familyName: 'Smith',
        givenNames: 'John',
        dateOfBirth: '1990-01-01',
        nationality: 'USA',
        travelDocNumber: 'P123456',
        role: 'MASTER',
      },
    ],
    submissionTime: new Date('2023-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    configService = {
      get: jest.fn().mockImplementation((key: string, _default: any) => {
        if (key === 'ENOAD_ENVIRONMENT') return 'test';
        if (key === 'ENOAD_TEST_URL') return 'https://testnoad.local';
        if (key === 'ENOAD_TIMEOUT_MS') return 1000;
        return _default;
      }),
    } as any;

    gateway = new EnoAdGateway(configService);
    jest.clearAllMocks();
  });

  describe('submitCrewList', () => {
    it('should successfully submit and parse GUID from XML response', async () => {
      // Mock successful XML response
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(`
          <?xml version="1.0" encoding="utf-8"?>
          <soap:Envelope>
            <soap:Body>
              <noadSubmitResponse>
                <noadSubmitResult>550e8400-e29b-41d4-a716-446655440000</noadSubmitResult>
              </noadSubmitResponse>
            </soap:Body>
          </soap:Envelope>
        `),
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await gateway.submitCrewList(mockPayload, 'eNOAD');

      expect(result.status).toBe('ACCEPTED');
      expect(result.submissionId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on network error and then succeed', async () => {
      // Fail first time
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network offline'));

      // Succeed second time
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue('<guid>11111111-2222-3333-4444-555555555555</guid>'),
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      // Disable retry delay for fast tests
      jest.spyOn(global, 'setTimeout').mockImplementation((cb: any) => {
        cb();
        return 0 as any;
      });

      const result = await gateway.submitCrewList(mockPayload, 'eNOAD');

      expect(result.status).toBe('ACCEPTED');
      expect(result.submissionId).toBe('11111111-2222-3333-4444-555555555555');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should throw SOAP fault and return REJECTED status if XML missing GUID', async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(`
          <soap:Envelope>
            <soap:Body>
              <soap:Fault>
                <faultstring>Server was unable to process request.</faultstring>
              </soap:Fault>
            </soap:Body>
          </soap:Envelope>
        `),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await gateway.submitCrewList(mockPayload, 'eNOAD');

      expect(result.status).toBe('REJECTED');
      expect(result.message).toContain('Server was unable to process request');
    });
  });
});
