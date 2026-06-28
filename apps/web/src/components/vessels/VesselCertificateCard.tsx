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
  if (s === 'VALID') return { color: '#33FF33', border: 'rgba(51,255,51,0.4)' };
  if (s === 'EXPIRING_SOON') return { color: '#FFB000', border: 'rgba(255,176,0,0.4)' };
  return { color: '#FF4B2B', border: 'rgba(255,75,43,0.4)' };
}

function overallColor(status?: string) {
  if (status === 'COMPLIANT') return 'rgba(51,255,51,0.2)';
  if (status === 'WARNING') return 'rgba(255,176,0,0.2)';
  return 'rgba(255,75,43,0.2)';
}

export function VesselCertificateCard({ report }: { report: VesselCertificateReport }) {
  const missingCerts = report?.missingCertificates ?? [];
  const allCerts = [
    ...(report?.expiredCertificates ?? []),
    ...(report?.expiringCertificates ?? []),
    ...(report?.validCertificates ?? []),
  ];

  return (
    <Card style={{ borderColor: overallColor(report?.overallStatus) }}>
      <CardHeader>
        <span className="flex items-center gap-2">
          <ShieldCheck size={13} />
          VESSEL CERTIFICATES
          {report?.mmsiNumber && (
            <span className="font-mono text-[10px] px-1.5 py-0.5 border border-[rgba(0,255,255,0.3)] text-[#00FFFF] bg-[rgba(0,255,255,0.04)] tracking-widest">
              MMSI: {report.mmsiNumber}
            </span>
          )}
        </span>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 p-4">
        {missingCerts.length > 0 && (
          <div className="border border-[rgba(255,75,43,0.4)] bg-[rgba(255,75,43,0.06)] px-3 py-3 flex items-start gap-2">
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
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr] border-b border-[rgba(51,255,51,0.1)] pb-2 mb-1">
            {['CERTIFICATE', 'REFERENCE', 'EXPIRY', 'STATUS'].map((h) => (
              <span key={h} className="font-mono text-[10px] text-[rgba(51,255,51,0.35)] tracking-[0.1em]">{h}</span>
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
                className="grid grid-cols-[2fr_1.5fr_1fr_1fr] py-2 border-b border-[rgba(51,255,51,0.04)] last:border-b-0"
              >
                <span className="font-mono text-[11px] text-[rgba(51,255,51,0.7)]">{CERT_LABELS[cert.type] ?? cert.type}</span>
                <span className="font-mono text-[11px] text-[#00FFFF] tabular-nums">{cert.referenceNumber}</span>
                <span className="font-mono text-[11px] text-[rgba(51,255,51,0.55)] tabular-nums">
                  {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString('en-CA') : 'Permanent'}
                </span>
                <span title={tooltip} className="font-mono text-[10px] px-1.5 py-0.5 border tracking-widest self-start" style={{ color, borderColor: border, background: `${color}10` }}>
                  {cert.status.replace(/_/g, ' ')}
                </span>
              </div>
            );
          })}
          {allCerts.length === 0 && (
            <p className="font-mono text-[11px] text-[rgba(51,255,51,0.25)] py-4 tracking-widest">
              — NO CERTIFICATES ON FILE —
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
