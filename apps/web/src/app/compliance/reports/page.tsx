'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, StatCard } from '@/components/ui/card';
import { TerminalTable } from '@/components/ui/TerminalTable';
import { termInputCls } from '@/components/ui/TerminalModal';
import { api } from '@/lib/api';
import { ColumnDef } from '@tanstack/react-table';
import { BarChart2, CheckCircle, FileText, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

/* ── Types ────────────────────────────────────────────────── */
interface PscTrendsData {
  reportType: string;
  period: { from?: string; to?: string };
  summary: { totalInspections: number; inspectionsWithDeficiencies: number; totalDeficiencies: number };
  trends: { byCode: Record<string, number>; bySeverity: Record<string, number> };
}
interface FleetSnapshotData {
  reportType: string;
  snapshotDate: string;
  vessels: Array<{ vesselName: string; vesselImo: string; isCompliant: boolean; deficiencies: string[]; crewCount: number }>;
  summary: { totalVessels: number; compliantVessels: number; overallComplianceRate: number };
}

/* ── Columns ──────────────────────────────────────────────── */
const deficiencyColumns: ColumnDef<any, any>[] = [
  {
    accessorKey: 'code',
    header: 'Deficiency Code',
    cell: ({ getValue }) => (
      <span className="font-mono text-[12px] text-[rgba(51,255,51,0.8)]">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: 'count',
    header: 'Occurrences',
    cell: ({ getValue }) => {
      const n = getValue<number>();
      const color = n > 3 ? '#FF4B2B' : n > 1 ? '#FFB000' : 'rgba(51,255,51,0.5)';
      return <span className="font-mono text-[12px] tabular-nums" style={{ color }}>{n}</span>;
    },
  },
];

const fleetColumns: ColumnDef<any, any>[] = [
  {
    id: 'vessel',
    header: 'Vessel',
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-[12px] text-[rgba(51,255,51,0.8)]">{row.original.vesselName}</span>
        <span className="font-mono text-[10px] text-[rgba(51,255,51,0.4)]">IMO: {row.original.vesselImo ?? 'N/A'}</span>
      </div>
    ),
  },
  {
    accessorKey: 'crewCount',
    header: 'Crew',
    cell: ({ getValue }) => (
      <span className="font-mono text-[12px] tabular-nums text-[rgba(51,255,51,0.7)]">{getValue<number>()}</span>
    ),
  },
  {
    accessorKey: 'isCompliant',
    header: 'Status',
    cell: ({ getValue }) => {
      const ok = getValue<boolean>();
      return ok ? (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 border border-[rgba(51,255,51,0.4)] text-[#33FF33] bg-[rgba(51,255,51,0.06)] tracking-widest">
          <CheckCircle size={10} />COMPLIANT
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 border border-[rgba(255,75,43,0.4)] text-[#FF4B2B] bg-[rgba(255,75,43,0.06)] tracking-widest">
          <XCircle size={10} />NON-COMPLIANT
        </span>
      );
    },
  },
  {
    accessorKey: 'deficiencies',
    header: 'Deficiencies',
    cell: ({ getValue }) => {
      const defs = getValue<string[]>() ?? [];
      if (!defs.length) return <span className="font-mono text-[11px] text-[rgba(51,255,51,0.25)]">None</span>;
      return (
        <div className="flex flex-col gap-0.5">
          {defs.slice(0, 3).map((d, i) => (
            <span key={i} className="font-mono text-[11px] text-[#FF4B2B]">{d}</span>
          ))}
          {defs.length > 3 && (
            <span className="font-mono text-[10px] text-[rgba(51,255,51,0.35)]">+{defs.length - 3} more</span>
          )}
        </div>
      );
    },
  },
];

/* ── Page ─────────────────────────────────────────────────── */
export default function ComplianceReportsPage() {
  const [reportType, setReportType] = useState('fleet_compliance_snapshot');
  const [loading, setLoading] = useState(false);
  const [pscData, setPscData] = useState<PscTrendsData | null>(null);
  const [fleetData, setFleetData] = useState<FleetSnapshotData | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  const generateReport = useCallback(async () => {
    setLoading(true);
    const params: any = { type: reportType };
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;

    const { data } = await api.compliance.reports(params);
    if (data) {
      setLastGenerated(new Date().toLocaleTimeString());
      if (reportType === 'psc_deficiency_trends') {
        setPscData(data);
        setFleetData(null);
      } else {
        setFleetData(data);
        setPscData(null);
      }
    }
    setLoading(false);
  }, [reportType, dateFrom, dateTo]);

  useEffect(() => { generateReport(); }, [generateReport]);

  const byCodeData = pscData
    ? Object.entries(pscData.trends.byCode).map(([code, count]) => ({ code, count }))
    : [];

  return (
    <DashboardLayout contentClassName="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-mono text-[15px] tracking-[0.06em] uppercase text-[#33FF33] font-semibold flex items-center gap-2">
            <BarChart2 size={16} aria-hidden />
            Compliance Reports
          </h1>
          <p className="font-mono text-[11px] text-[rgba(51,255,51,0.4)]">
            PSC trend analysis · Fleet compliance snapshots · Regulatory audit data
            {lastGenerated && (
              <span className="ml-3 text-[rgba(51,255,51,0.3)]">Generated {lastGenerated}</span>
            )}
          </p>
        </div>
        <Button
          variant="ghost"
          icon={<RefreshCw size={11} className={loading ? 'animate-spin' : ''} />}
          onClick={generateReport}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardContent className="py-3">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-[rgba(51,255,51,0.4)]">
                Report Type
              </label>
              <select
                className={`${termInputCls} w-56`}
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="fleet_compliance_snapshot" className="bg-[#050505]">Fleet Compliance Snapshot</option>
                <option value="psc_deficiency_trends" className="bg-[#050505]">PSC Deficiency Trends</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-[rgba(51,255,51,0.4)]">From</label>
              <input type="date" className={`${termInputCls} w-40`} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-[rgba(51,255,51,0.4)]">To</label>
              <input type="date" className={`${termInputCls} w-40`} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <Button icon={<FileText size={11} />} onClick={generateReport} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-8 h-8 border-2 border-[#33FF33] border-t-transparent animate-spin" />
          <p className="font-mono text-[11px] text-[rgba(51,255,51,0.3)] tracking-wider">
            GENERATING COMPLIANCE REPORT...
          </p>
        </div>
      )}

      {/* Fleet Snapshot */}
      {!loading && fleetData && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="TOTAL VESSELS" value={fleetData.summary.totalVessels} status="info" />
            <StatCard label="COMPLIANT" value={`${fleetData.summary.compliantVessels} / ${fleetData.summary.totalVessels}`} status="ok" />
            <div className="border border-[rgba(51,255,51,0.2)] bg-[#050505] p-4 flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-[rgba(51,255,51,0.4)]">Compliance Rate</span>
              <span
                className="font-mono text-3xl font-bold tabular-nums"
                style={{ color: fleetData.summary.overallComplianceRate >= 90 ? '#33FF33' : '#FF4B2B' }}
              >
                {fleetData.summary.overallComplianceRate.toFixed(1)}%
              </span>
              <div className="h-1 w-full bg-[rgba(51,255,51,0.08)] mt-1">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${fleetData.summary.overallComplianceRate}%`,
                    background: fleetData.summary.overallComplianceRate >= 90 ? '#33FF33' : '#FF4B2B',
                  }}
                />
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <span className="flex items-center gap-2">
                <ShieldCheck size={13} />
                VESSEL COMPLIANCE DETAIL
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <TerminalTable
                data={fleetData.vessels}
                columns={fleetColumns}
                rowKey={(r) => r.vesselImo ?? r.vesselName}
                emptyMessage="NO VESSEL DATA"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* PSC Trends */}
      {!loading && pscData && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="TOTAL INSPECTIONS" value={pscData.summary.totalInspections} status="info" />
            <StatCard
              label="WITH DEFICIENCIES"
              value={pscData.summary.inspectionsWithDeficiencies}
              status={pscData.summary.inspectionsWithDeficiencies > 0 ? 'critical' : 'ok'}
            />
            <StatCard
              label="TOTAL DEFICIENCIES"
              value={pscData.summary.totalDeficiencies}
              status={pscData.summary.totalDeficiencies > 0 ? 'warning' : 'ok'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <span className="flex items-center gap-2"><BarChart2 size={13} />DEFICIENCIES BY CODE</span>
              </CardHeader>
              <CardContent className="p-0">
                {byCodeData.length > 0 ? (
                  <TerminalTable data={byCodeData} columns={deficiencyColumns} rowKey={(r) => r.code} emptyMessage="NO DEFICIENCIES" />
                ) : (
                  <p className="font-mono text-[11px] text-[rgba(51,255,51,0.25)] text-center py-12 tracking-widest">— NO DEFICIENCIES RECORDED —</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <span className="flex items-center gap-2"><BarChart2 size={13} />SEVERITY BREAKDOWN</span>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 pt-2">
                {Object.entries(pscData.trends.bySeverity).map(([severity, count]) => {
                  const pct = pscData.summary.totalDeficiencies > 0
                    ? (count / pscData.summary.totalDeficiencies) * 100
                    : 0;
                  const color = severity === 'major' ? '#FF4B2B' : severity === 'minor' ? '#FFB000' : '#33FF33';
                  return (
                    <div key={severity} className="flex flex-col gap-1">
                      <div className="flex justify-between">
                        <span className="font-mono text-[11px] text-[rgba(51,255,51,0.7)] capitalize">{severity}</span>
                        <span className="font-mono text-[11px] tabular-nums" style={{ color }}>{count}</span>
                      </div>
                      <div className="h-1 w-full bg-[rgba(51,255,51,0.08)]">
                        <div className="h-full" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* No data */}
      {!loading && !fleetData && !pscData && (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="font-mono text-[11px] text-[rgba(51,255,51,0.25)] tracking-widest">
              — SELECT A REPORT TYPE AND CLICK GENERATE —
            </p>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
