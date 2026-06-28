import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const CERT_LABELS: Record<string, string> = {
  SMC: 'Safety Management Certificate',
  DOC: 'Document of Compliance',
  PASSENGER_SHIP_SAFETY: 'Passenger Ship Safety Certificate',
  LOAD_LINE: 'Load Line Certificate',
  RADIO_LICENSE: 'Radio License / Ship Station',
  TONNAGE: 'Tonnage Certificate',
  ISSC: 'International Ship Security Certificate',
  MSMD: 'Minimum Safe Manning Document',
};

interface Certificate {
  type: string;
  referenceNumber: string;
  expiryDate?: string;
  status: string;
  daysUntilExpiry?: number;
  daysUntilVerification?: number;
}

export interface VesselCertificateReport {
  overallStatus?: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';
  mmsiNumber?: string;
  missingCertificates: string[];
  expiredCertificates: Certificate[];
  expiringCertificates: Certificate[];
  validCertificates: Certificate[];
}

function statusStyle(s: string) {
  if (s === 'VALID') return { color: '#00F2FE', border: 'rgba(0,242,254,0.35)' };
  if (s === 'EXPIRING_SOON') return { color: '#FFB000', border: 'rgba(255,176,0,0.35)' };
  return { color: '#FF4B2B', border: 'rgba(255,75,43,0.35)' };
}

function overallBorderColor(status?: string) {
  if (status === 'COMPLIANT') return 'rgba(0,242,254,0.3)';
  if (status === 'WARNING') return 'rgba(255,176,0,0.3)';
  return 'rgba(255,75,43,0.3)';
}

export function VesselCertificateCard({ report }: { report: VesselCertificateReport }) {
  const missingCerts = report?.missingCertificates ?? [];
  const allCerts = [
    ...(report?.expiredCertificates ?? []),
    ...(report?.expiringCertificates ?? []),
    ...(report?.validCertificates ?? []),
  ];

  return (
    <Card style={{ borderColor: overallBorderColor(report?.overallStatus) }}>
      <CardHeader>
        <span className="flex items-center gap-2">
          <ShieldCheck size={13} />
          VESSEL CERTIFICATES
          {report?.mmsiNumber && (
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-[rgba(0,242,254,0.3)] text-[#00F2FE] bg-[rgba(0,242,254,0.06)] tracking-widest">
              MMSI: {report.mmsiNumber}
            </span>
          )}
        </span>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {missingCerts.length > 0 && (
          <div className="rounded-xl border border-[rgba(255,75,43,0.35)] bg-[rgba(255,75,43,0.06)] px-4 py-3 flex items-start gap-2">
            <AlertTriangle size={13} className="text-[#FF4B2B] mt-0.5 flex-shrink-0" />
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[11px] text-[#FF4B2B] font-semibold">
                {missingCerts.length} mandatory certificate(s) not on file
              </span>
              <span className="font-mono text-[11px] text-[rgba(255,75,43,0.7)]">
                {missingCerts.map((t) => CERT_LABELS[t] ?? t).join(', ')}
              </span>
            </div>
          </div>
        )}

        {/* Certificate table */}
        <div className="flex flex-col">
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr] border-b border-[var(--border)] pb-2 mb-1">
            {['CERTIFICATE', 'REFERENCE', 'EXPIRY', 'STATUS'].map((h) => (
              <span key={h} className="font-mono text-[10px] text-[var(--muted-foreground)] tracking-[0.08em]">{h}</span>
            ))}
          </div>
          {allCerts.map((cert) => {
            const { color, border } = statusStyle(cert.status);
            const tooltip = cert.daysUntilExpiry != null
              ? `${cert.daysUntilExpiry}d until expiry`
              : cert.daysUntilVerification != null
              ? `${cert.daysUntilVerification}d until verification`
              : undefined;
            return (
              <div
                key={`${cert.type}-${cert.referenceNumber}`}
                className="grid grid-cols-[2fr_1.5fr_1fr_1fr] py-2.5 border-b border-[var(--border)] last:border-b-0"
              >
                <span className="font-mono text-[11px] text-[var(--muted-foreground)]">{CERT_LABELS[cert.type] ?? cert.type}</span>
                <span className="font-mono text-[11px] text-[#00F2FE] tabular-nums">{cert.referenceNumber}</span>
                <span className="font-mono text-[11px] text-[var(--muted-foreground)] tabular-nums">
                  {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString('en-CA') : 'Permanent'}
                </span>
                <span
                  title={tooltip}
                  className="font-mono text-[10px] px-1.5 py-0.5 rounded tracking-widest self-start"
                  style={{ color, borderColor: border, border: `1px solid ${border}`, background: `${color}10` }}
                >
                  {cert.status.replace(/_/g, ' ')}
                </span>
              </div>
            );
          })}
          {allCerts.length === 0 && (
            <p className="font-mono text-[11px] text-[var(--muted-foreground)] py-4 tracking-widest text-center">
              No certificates on file
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
