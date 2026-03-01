import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { BridgeCacheService } from './bridge-cache.service';
import { BridgeSyncInterceptor } from './bridge-sync.interceptor';

function buildMockContext(path = '/crew', method = 'GET') {
  const mockResponse = {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
  };
  const mockRequest = { path, method };
  const http = {
    getRequest: () => mockRequest,
    getResponse: () => mockResponse,
  };
  return {
    switchToHttp: () => http,
    response: mockResponse,
  } as unknown as ExecutionContext;
}

describe('BridgeSyncInterceptor', () => {
  let interceptor: BridgeSyncInterceptor;
  let cacheService: BridgeCacheService;

  beforeEach(() => {
    cacheService = new BridgeCacheService();
    interceptor = new BridgeSyncInterceptor(cacheService);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should pass through data and populate the cache on success', (done) => {
    const ctx = buildMockContext('/crew');
    const handler: CallHandler = { handle: () => of({ data: [{ id: 'c1' }] }) };

    interceptor.intercept(ctx, handler).subscribe({
      next: (data) => {
        expect(data).toEqual({ data: [{ id: 'c1' }] });
        expect(cacheService.has('bridge:GET:/crew')).toBe(true);
        done();
      },
    });
  });

  it('should serve stale cache on DB failure', (done) => {
    const ctx = buildMockContext('/crew');
    const staleData = { data: [{ id: 'cached-crew' }] };

    // Pre-populate cache
    cacheService.set('bridge:GET:/crew', staleData);

    const dbError = new Error("Can't reach database server");
    dbError.constructor = { name: 'PrismaClientInitializationError' } as any;
    const handler: CallHandler = { handle: () => throwError(() => dbError) };

    interceptor.intercept(ctx, handler).subscribe({
      next: (data) => {
        expect(data).toEqual(staleData);
        const res = (ctx.switchToHttp() as any).getResponse();
        expect(res.setHeader).toHaveBeenCalledWith('X-Data-Source', 'bridge-cache');
        done();
      },
    });
  });

  it('should re-throw non-DB errors (no cache fallback)', (done) => {
    const ctx = buildMockContext('/crew');
    const authError = new Error('Unauthorized');
    const handler: CallHandler = { handle: () => throwError(() => authError) };

    interceptor.intercept(ctx, handler).subscribe({
      error: (err) => {
        expect(err.message).toBe('Unauthorized');
        done();
      },
    });
  });
});
