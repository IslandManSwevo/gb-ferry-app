'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StatusBadge, StatusKind } from '@/components/ui/StatusBadge';
import { TerminalTable } from '@/components/ui/TerminalTable';
import { api } from '@/lib/api';
import { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CertRecord {
  id: string;
  crewMember?: { familyName?: string; givenNames?: string };
  type?: string;
  certificateNumber?: string;
  issuingAuthority?: string;
  expiryDate?: string;
  status?: string;
}

function certStatus(record: CertRecord): StatusKind {
  if (!record.expiryDate) return 'ok';
  const d = new Date(record.expiryDate);
  if (isNaN(d.getTime())) return 'warning';
  if (d.getTime() < Date.now()) return 'critical';
  if (d.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000) return 'warning';
  return 'ok';
}

function certLabel(record: CertRecord): string {
  if (!record.expiryDate) return 'VALID';
  const d = new Date(record.expiryDate);
  if (isNaN(d.getTime())) return 'ERROR';
  if (d.getTime() < Date.now()) return 'EXPIRED';
  if (d.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000) return 'EXPIRING';
  return 'VALID';
}

const columns: ColumnDef<CertRecord, any>[] = [
  {
    accessorKey: 'crewMember',
    header: 'Crew Member',
    cell: ({ getValue }) => {
      const crew = getValue<CertRecord['crewMember']>();
      const name = `${crew?.givenNames ?? ''} ${crew?.familyName ?? 'Unknown'}`.trim();
      const initial = (crew?.familyName ?? name).charAt(0).toUpperCase();
      return (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[rgba(0,242,254,0.1)] flex items-center justify-center flex-shrink-0">
            <span className="font-mono text-[11px] text-[#00F2FE] font-semibold">{initial}</span>
          </div>
          <span className="font-mono text-[12px] text-[rgba(0,242,254,0.8)]">{name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'type',
    header: 'Document Type',
    cell: ({ getValue }) => (
      <span className="font-mono text-[11px] px-2 py-0.5 border border-[rgba(0,242,254,0.3)] text-[#00F2FE] bg-[rgba(0,242,254,0.05)]">
        {getValue<string>() ?? '—'}
      </span>
    ),
  },
  {
    accessorKey: 'certificateNumber',
    header: 'Cert No.',
    cell: ({ getValue }) => (
      <span className="font-mono text-[11px] text-[rgba(0,242,254,0.7)] tracking-wider">
        {getValue<string>() ?? '—'}
      </span>
    ),
  },
  {
    accessorKey: 'issuingAuthority',
    header: 'Issuing Authority',
    cell: ({ getValue }) => (
      <span className="font-mono text-[11px] text-[rgba(0,242,254,0.45)]">
        {getValue<string>() ?? '—'}
      </span>
    ),
  },
  {
    accessorKey: 'expiryDate',
    header: 'Expiry Date',
    sortingFn: 'datetime',
    cell: ({ getValue, row }) => {
      const dateStr = getValue<string>();
      if (!dateStr) return <span className="font-mono text-[11px] text-[rgba(0,242,254,0.25)]">N/A</span>;
      const d = new Date(dateStr);
      if (isNaN(d.getTime()))
        return <span className="font-mono text-[11px] text-[#FF4B2B]">Invalid</span>;
      const isExpiring = certStatus(row.original) === 'warning' || certStatus(row.original) === 'critical';
      return (
        <span
          className="font-mono text-[11px] tabular-nums"
          style={{ color: isExpiring ? '#FF4B2B' : 'rgba(0,242,254,0.7)' }}
        >
          {d.toLocaleDateString()}
        </span>
      );
    },
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <StatusBadge status={certStatus(row.original)} label={certLabel(row.original)} compact />
    ),
  },
  {
    id: 'action',
    header: '',
    enableSorting: false,
    cell: () => (
      <Button
        variant="ghost"
        size="sm"
        icon={<ShieldCheck size={11} />}
        onClick={() => {}}
      >
        Verify
      </Button>
    ),
  },
];

export default function CertificationsPage() {
  const [data, setData] = useState<CertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.certifications.list();
        if (!mounted) return;
        if (res.data) setData(res.data);
        else if (res.error) setError(res.error);
      } catch {
        if (mounted) setError('Failed to load certifications');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const expiringCount = data.filter((d) => certStatus(d) === 'warning').length;
  const expiredCount = data.filter((d) => certStatus(d) === 'critical').length;

  return (
    <DashboardLayout contentClassName="p-6">
      {/* Alerts banner */}
      {(expiringCount > 0 || expiredCount > 0) && (
        <div className="mb-8 px-4 py-3 border border-[rgba(255,176,0,0.4)] bg-[rgba(255,176,0,0.06)] flex items-start gap-3">
          <AlertTriangle size={11} className="text-[#FFB000] mt-0.5 flex-shrink-0" aria-hidden />
          <span className="font-mono text-[10px] text-[#FFB000] tracking-widest uppercase">
            CERT ALERT
          </span>
          <span className="font-mono text-[11px] text-[rgba(255,176,0,0.8)]">
            {expiredCount > 0 && `${expiredCount} expired`}
            {expiredCount > 0 && expiringCount > 0 && ' · '}
            {expiringCount > 0 && `${expiringCount} expiring within 30 days`}
            {' — immediate action required'}
          </span>
        </div>
      )}

      {error && (
        <div className="mb-8 px-4 py-3 border border-[rgba(255,75,43,0.4)] bg-[rgba(255,75,43,0.06)]">
          <span className="font-mono text-[11px] text-[#FF4B2B]">{error}</span>
        </div>
      )}

      <Card>
        <CardHeader
          action={
            <span className="font-mono text-[10px] text-[rgba(0,242,254,0.4)] tracking-widest">
              {data.length} RECORDS
            </span>
          }
        >
          <span className="flex items-center gap-2">
            <ShieldCheck size={13} />
            CREW CERTIFICATIONS
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <TerminalTable
            data={data}
            columns={columns}
            loading={loading}
            rowKey={(r) => r.id}
            emptyMessage="NO CERTIFICATIONS FOUND"
          />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
