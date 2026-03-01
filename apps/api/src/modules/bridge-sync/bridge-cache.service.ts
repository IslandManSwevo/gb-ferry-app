import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttlMs: number;
}

@Injectable()
export class BridgeCacheService {
  private readonly logger = new Logger(BridgeCacheService.name);
  private readonly store = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T, ttlMs = 30 * 60 * 1000): void {
    this.store.set(key, { data, cachedAt: Date.now(), ttlMs });
    this.logger.debug(`Cached [${key}] (TTL: ${ttlMs / 1000}s)`);
  }

  get<T>(key: string): { data: T; isStale: boolean } | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const age = Date.now() - entry.cachedAt;
    const isStale = age > entry.ttlMs;

    return { data: entry.data, isStale };
  }

  has(key: string): boolean {
    return this.store.has(key);
  }

  invalidate(key: string): void {
    this.store.delete(key);
    this.logger.debug(`Invalidated cache key [${key}]`);
  }

  clear(): void {
    this.store.clear();
    this.logger.debug('Cache cleared');
  }
}
