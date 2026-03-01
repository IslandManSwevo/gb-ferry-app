import { Controller, Sse } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, fromEvent, map } from 'rxjs';

export interface AlertMessage {
  id: string;
  type: 'EXPIRY_WARNING' | 'MANNING_ALERT' | 'SYSTEM_INFO';
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error';
}

@Controller('notifications')
export class NotificationsController {
  constructor(private eventEmitter: EventEmitter2) {}

  @Sse('stream')
  // For production we would use @UseGuards(JwtAuthGuard) and parse tokens from query or headers
  // but for local dev simplicity in SSE, we'll keep it open or use a simple query param
  streamEvents(): Observable<MessageEvent> {
    return fromEvent(this.eventEmitter, 'alert.broadcast').pipe(
      map((payload: unknown) => {
        const data = payload as AlertMessage;
        return { data } as MessageEvent;
      })
    );
  }
}
