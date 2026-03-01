import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { BridgeCacheService } from './bridge-cache.service';

// TTL of 2 hours for bridge-cached compliance data
const BRIDGE_CACHE_TTL_MS = 2 * 60 * 60 * 1000;

function isMissError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  // Prisma DB unavailable errors
  return (
    err.constructor?.name === 'PrismaClientInitializationError' ||
    err.message.includes("Can't reach database server") ||
    err.message.includes('connect ECONNREFUSED')
  );
}

@Injectable()
export class BridgeSyncInterceptor implements NestInterceptor {
  private readonly logger = new Logger(BridgeSyncInterceptor.name);

  constructor(private readonly cacheService: BridgeCacheService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const cacheKey = `bridge:${req.method}:${req.path}`;

    return next.handle().pipe(
      // On success — populate the cache
      tap((data) => {
        this.cacheService.set(cacheKey, data, BRIDGE_CACHE_TTL_MS);
        this.logger.debug(`Bridge cache updated: ${cacheKey}`);
      }),
      // On failure — serve from cache if DB is unreachable
      catchError((err: unknown) => {
        if (isMissError(err) && this.cacheService.has(cacheKey)) {
          const cached = this.cacheService.get(cacheKey);
          this.logger.warn(`DB unavailable — serving stale cache for: ${cacheKey}`);
          res.setHeader('X-Data-Source', 'bridge-cache');
          res.setHeader(
            'X-Cache-Age-Seconds',
            cached ? String(Math.round((Date.now() - (cached as any).cachedAt) / 1000)) : 'unknown'
          );
          return of(cached?.data);
        }
        return throwError(() => err);
      })
    );
  }
}
