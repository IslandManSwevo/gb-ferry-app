import { ConfigService } from '@nestjs/config';
import { BMAGateway } from './bma.gateway';

// Mock global fetch
global.fetch = jest.fn();

describe('BMAGateway', () => {
  let gateway: BMAGateway;
  let configService: jest.Mocked<ConfigService>;

  const mockCert: any = {
    certificateNumber: 'BMA-12345',
    issuingAuthority: 'Bahamas Maritime Authority',
    type: 'STCW_COC',
  };

  beforeEach(() => {
    configService = {
      get: jest.fn().mockImplementation((key: string, _default: any) => {
        if (key === 'BMA_VERIFICATION_URL') return 'https://boris.local/verify';
        if (key === 'BMA_TIMEOUT_MS') return 1000;
        return _default;
      }),
    } as any;

    gateway = new BMAGateway(configService);
    jest.clearAllMocks();
  });

  describe('supports', () => {
    it('should support BS country or Bahamas authority', () => {
      expect(gateway.supports('BS', 'Any')).toBe(true);
      expect(gateway.supports('US', 'Bahamas Maritime Authority')).toBe(true);
      expect(gateway.supports('US', 'USCG')).toBe(false);
    });
  });

  describe('verify', () => {
    it('should parse JSON response successfully', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({ status: 'VALID' }),
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await gateway.verify(mockCert);

      expect(result.status).toBe('VALID');
      expect(result.verified).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should parse HTML response successfully', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: jest.fn().mockResolvedValue('<html><body>Certificate is VALID</body></html>'),
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await gateway.verify(mockCert);

      expect(result.status).toBe('VALID');
      expect(result.verified).toBe(true);
    });

    it('should fall back to HTTP retries and open circuit breaker', async () => {
      // Setup fetch to always reject to trigger circuit breaker
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Connection reset'));

      // Speed up test drastically by mocking setTimeout
      jest.spyOn(global, 'setTimeout').mockImplementation((cb: any) => {
        cb();
        return 0 as any;
      });

      // Max failures = 5 to open circuit
      for (let i = 0; i < 5; i++) {
        await gateway.verify(mockCert);
      }

      // Check circuit breaker is open (6th request)
      const circuitResult = await gateway.verify(mockCert);

      expect(circuitResult.status).toBe('PENDING');
      expect(circuitResult.authorityResponse.reason).toContain('Circuit breaker open');
    });
  });
});
