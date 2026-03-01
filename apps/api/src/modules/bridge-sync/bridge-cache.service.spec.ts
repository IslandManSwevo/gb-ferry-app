import { Test, TestingModule } from '@nestjs/testing';
import { BridgeCacheService } from './bridge-cache.service';

describe('BridgeCacheService', () => {
  let service: BridgeCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BridgeCacheService],
    }).compile();

    service = module.get<BridgeCacheService>(BridgeCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should store and retrieve data', () => {
    const data = { foo: 'bar' };
    service.set('test-key', data, 10000);
    const result = service.get('test-key');
    expect(result?.data).toEqual(data);
    expect(result?.isStale).toBe(false);
  });

  it('should mark entries as stale after TTL expires', () => {
    const data = { fleet: 'offline' };
    // set with TTL of -1ms (already expired)
    service.set('stale-key', data, -1);
    const result = service.get('stale-key');
    expect(result?.isStale).toBe(true);
  });

  it('should return null for a cache miss', () => {
    const result = service.get('missing-key');
    expect(result).toBeNull();
  });

  it('should report has() correctly', () => {
    service.set('present-key', { x: 1 });
    expect(service.has('present-key')).toBe(true);
    expect(service.has('absent-key')).toBe(false);
  });

  it('should invalidate a cache entry', () => {
    service.set('delete-me', { data: true });
    service.invalidate('delete-me');
    expect(service.has('delete-me')).toBe(false);
  });

  it('should clear all entries', () => {
    service.set('key-a', 1);
    service.set('key-b', 2);
    service.clear();
    expect(service.has('key-a')).toBe(false);
    expect(service.has('key-b')).toBe(false);
  });
});
