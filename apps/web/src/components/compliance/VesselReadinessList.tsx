import { CheckCircle, Navigation, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export interface VesselReadiness {
  id: string;
  name: string;
  imoNumber?: string;
  isCompliant: boolean;
  safeManningCompliant: boolean;
  certificatesCompliant: boolean;
  readinessStatus?: 'READY' | 'WARNING' | 'BLOCKED';
  assignedCrew?: number;
  requiredCrew?: number;
  blockers?: string[];
}

const STATUS_CONFIG = {
  BLOCKED: { color: '#FF4B2B', border: 'rgba(255,75,43,0.4)', Icon: XCircle, label: 'BLOCKED' },
  WARNING: { color: '#FFB000', border: 'rgba(255,176,0,0.4)', Icon: AlertTriangle, label: 'WARNING' },
  READY:   { color: '#33FF33', border: 'rgba(51,255,51,0.4)',  Icon: CheckCircle, label: 'READY' },
} as const;

export function VesselReadinessList({ vessels }: { vessels: VesselReadiness[] }) {
  if (!vessels || vessels.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="font-mono text-[11px] text-[rgba(51,255,51,0.25)] tracking-widest">
            — NO VESSELS FOUND IN FLEET —
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <span className="flex items-center gap-2">
          <Navigation size={13} />
          VESSEL DEPARTURE READINESS
        </span>
      </CardHeader>
      <CardContent className="p-0">
        {vessels.map((v, index) => {
          const readiness = v.readinessStatus ?? (v.isCompliant ? 'READY' : 'BLOCKED');
          const { color, border, Icon, label } = STATUS_CONFIG[readiness];
          const isLast = index === vessels.length - 1;

          return (
            <div
              key={v.id}
              className={`flex items-center justify-between px-5 py-4 ${!isLast ? 'border-b border-[rgba(51,255,51,0.06)]' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} style={{ color }} />
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[13px] text-[rgba(51,255,51,0.85)] font-medium">{v.name}</span>
                  <span className="font-mono text-[11px] text-[rgba(51,255,51,0.4)]">
                    IMO: {v.imoNumber ?? 'N/A'}
                    {v.assignedCrew !== undefined && ` · Manning: ${v.assignedCrew}/${v.requiredCrew}`}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-0.5">
                <span
                  className="font-mono text-[10px] px-2 py-0.5 border tracking-widest"
                  style={{ color, borderColor: border, background: `${color}10` }}
                >
                  {label}
                </span>
                {v.blockers && v.blockers.length > 0 && (
                  <span className="font-mono text-[10px] text-[rgba(255,75,43,0.5)]">
                    {v.blockers[0]}{v.blockers.length > 1 ? ` +${v.blockers.length - 1} more` : ''}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
