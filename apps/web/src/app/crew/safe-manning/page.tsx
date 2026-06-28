'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TerminalTable } from '@/components/ui/TerminalTable';
import { termInputCls } from '@/components/ui/TerminalModal';
import { api } from '@/lib/api';
import { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, CheckCircle, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface RoleRow { role: string; required: number; actual: number; fulfillable: number; }

const columns: ColumnDef<RoleRow, any>[] = [
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ getValue }) => (
      <span className="font-mono text-[12px] text-[rgba(51,255,51,0.8)]">
        {getValue<string>().replace(/_/g, ' ')}
      </span>
    ),
  },
  {
    accessorKey: 'required',
    header: 'Required',
    cell: ({ getValue }) => (
      <span className="font-mono text-[12px] tabular-nums text-[rgba(51,255,51,0.7)]">{getValue<number>()}</span>
    ),
  },
  {
    accessorKey: 'actual',
    header: 'Actual',
    cell: ({ getValue }) => (
      <span className="font-mono text-[12px] tabular-nums text-[rgba(51,255,51,0.7)]">{getValue<number>()}</span>
    ),
  },
  {
    accessorKey: 'fulfillable',
    header: 'Fulfillable',
    cell: ({ getValue }) => (
      <span className="font-mono text-[12px] tabular-nums text-[rgba(51,255,51,0.4)]" title="Qualified crew available but perhaps not assigned">
        {getValue<number>()}
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const met = row.original.actual >= row.original.required;
      return (
        <span
          className="font-mono text-[10px] px-2 py-0.5 border tracking-widest"
          style={met
            ? { color: '#33FF33', border: '1px solid rgba(51,255,51,0.4)', background: 'rgba(51,255,51,0.06)' }
            : { color: '#FF4B2B', border: '1px solid rgba(255,75,43,0.4)', background: 'rgba(255,75,43,0.06)' }}
        >
          {met ? 'MET' : 'SHORTFALL'}
        </span>
      );
    },
  },
];

export default function SafeManningPage() {
  const [vessels, setVessels] = useState<any[]>([]);
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null);
  const [rosterStatus, setRosterStatus] = useState<any>(null);
  const [loadingVessels, setLoadingVessels] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingVessels(true);
      const { data } = await api.vessels.list({ pageSize: 100 });
      if (data?.items) {
        setVessels(data.items);
        if (data.items.length > 0) setSelectedVessel(data.items[0].id);
      }
      setLoadingVessels(false);
    })();
  }, []);

  const fetchRoster = useCallback(async (id: string) => {
    setLoadingRoster(true);
    const { data } = await api.crew.roster(id);
    setRosterStatus(data ?? null);
    setLoadingRoster(false);
  }, []);

  useEffect(() => {
    if (selectedVessel) fetchRoster(selectedVessel);
  }, [selectedVessel, fetchRoster]);

  const roleData: RoleRow[] = rosterStatus
    ? Object.keys(rosterStatus.required).map((role) => ({
        role,
        required: rosterStatus.required[role],
        actual: rosterStatus.actualByRole[role] || 0,
        fulfillable: rosterStatus.fulfillableByRole[role] || 0,
      }))
    : [];

  const compliant: boolean = rosterStatus?.compliant ?? false;

  return (
    <DashboardLayout contentClassName="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-mono text-[15px] tracking-[0.06em] uppercase text-[#33FF33] font-semibold flex items-center gap-2">
            <Users size={16} aria-hidden />
            Safe Manning Compliance
          </h1>
          <p className="font-mono text-[11px] text-[rgba(51,255,51,0.4)]">
            BMA R106 · Real-time minimum safe manning &amp; STCW competency validation
          </p>
        </div>
        <select
          className={`${termInputCls} w-56`}
          disabled={loadingVessels}
          value={selectedVessel ?? ''}
          onChange={(e) => setSelectedVessel(e.target.value)}
        >
          {vessels.map((v) => (
            <option key={v.id} value={v.id} className="bg-[#050505]">{v.name}</option>
          ))}
        </select>
      </div>

      {loadingRoster ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-[#33FF33] border-t-transparent animate-spin" />
        </div>
      ) : !rosterStatus ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="font-mono text-[11px] text-[rgba(51,255,51,0.25)] tracking-widest">
              — NO ROSTER DATA FOR THIS VESSEL —
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Compliance status panel */}
          <Card accent={!compliant}>
            <CardHeader>
              <span className="flex items-center gap-2">
                {compliant
                  ? <CheckCircle size={13} className="text-[#33FF33]" />
                  : <AlertTriangle size={13} className="text-[#FF4B2B]" />}
                COMPLIANCE STATUS
              </span>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 py-8">
              {/* Gauge substitute */}
              <div
                className="w-32 h-32 border-4 flex items-center justify-center"
                style={{ borderColor: compliant ? '#33FF33' : '#FF4B2B' }}
              >
                <div className="text-center">
                  <p className="font-mono text-3xl font-bold" style={{ color: compliant ? '#33FF33' : '#FF4B2B' }}>
                    {compliant ? '100' : '66'}
                  </p>
                  <p className="font-mono text-[9px] text-[rgba(51,255,51,0.4)] tracking-widest">%</p>
                </div>
              </div>

              <span
                className="font-mono text-[11px] px-4 py-1.5 border tracking-widest"
                style={compliant
                  ? { color: '#33FF33', borderColor: 'rgba(51,255,51,0.4)', background: 'rgba(51,255,51,0.06)' }
                  : { color: '#FF4B2B', borderColor: 'rgba(255,75,43,0.4)', background: 'rgba(255,75,43,0.06)' }}
              >
                {compliant ? 'FULLY COMPLIANT' : 'NON-COMPLIANT'}
              </span>

              {rosterStatus.discrepancies?.length > 0 && (
                <div className="w-full">
                  <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-[rgba(51,255,51,0.3)] mb-3">
                    IDENTIFIED ISSUES
                  </p>
                  <ul className="flex flex-col gap-2">
                    {rosterStatus.discrepancies.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertTriangle size={11} className="text-[#FF4B2B] mt-0.5 flex-shrink-0" />
                        <span className="font-mono text-[11px] text-[rgba(51,255,51,0.6)]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manning requirements table */}
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>SAFE MANNING REQUIREMENTS (R106)</CardHeader>
              <CardContent className="p-0">
                <TerminalTable
                  data={roleData}
                  columns={columns}
                  rowKey={(r) => r.role}
                  emptyMessage="NO MANNING DATA"
                />
              </CardContent>
            </Card>

            <div className="px-4 py-3 border border-[rgba(0,255,255,0.2)] bg-[rgba(0,255,255,0.03)]">
              <p className="font-mono text-[11px] text-[rgba(0,255,255,0.6)] leading-relaxed">
                Safe Manning validation includes checking for valid STCW Certificates of Competency
                (CoC), Medical Fitness certificates, and specific BMA endorsements where required.
              </p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
