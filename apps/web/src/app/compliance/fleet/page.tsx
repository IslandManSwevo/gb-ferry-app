'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, StatCard } from '@/components/ui/card';
import { TerminalTable } from '@/components/ui/TerminalTable';
import { termInputCls } from '@/components/ui/TerminalModal';
import { api } from '@/lib/api';
import { ColumnDef } from '@tanstack/react-table';
import { BarChart2, Info, ShieldCheck, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import useSWR from 'swr';

/* ── Column defs ─────────────────────────────────────────── */
const trendColumns: ColumnDef<any, any>[] = [
  {
    accessorKey: 'month',
    header: 'Month',
    cell: ({ getValue }) => (
      <span className="font-mono text-[11px] text-[rgba(0,242,254,0.7)] tabular-nums">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: 'passRate',
    header: 'Pass Rate',
    cell: ({ getValue }) => (
      <span className="font-mono text-[12px] tabular-nums text-[#00F2FE]">
        {getValue<number>().toFixed(1)}%
      </span>
    ),
  },
  {
    accessorKey: 'deficiencyCount',
    header: 'Deficiencies',
    cell: ({ getValue }) => {
      const n = getValue<number>();
      return (
        <span className="font-mono text-[12px] tabular-nums" style={{ color: n > 0 ? '#FF4B2B' : 'rgba(0,242,254,0.5)' }}>
          {n}
        </span>
      );
    },
  },
];

function scoreColor(score: number) {
  if (score >= 80) return '#00F2FE';
  if (score >= 60) return '#FFB000';
  return '#FF4B2B';
}
function riskStatus(risk: string): 'ok' | 'warning' | 'critical' {
  if (risk === 'LOW') return 'ok';
  if (risk === 'MEDIUM') return 'warning';
  return 'critical';
}

const scoreColumns: ColumnDef<any, any>[] = [
  {
    accessorKey: 'vesselName',
    header: 'Vessel',
    cell: ({ getValue }) => (
      <span className="font-mono text-[12px] text-[rgba(0,242,254,0.8)]">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: 'score',
    header: 'Composite Score',
    cell: ({ getValue }) => {
      const score = getValue<number>();
      return (
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[12px] tabular-nums" style={{ color: scoreColor(score) }}>
            {score.toFixed(1)}
          </span>
          <div className="h-1 w-24 bg-[rgba(0,242,254,0.08)]">
            <div className="h-full" style={{ width: `${score}%`, background: scoreColor(score) }} />
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'pscRisk',
    header: 'PSC Risk',
    cell: ({ getValue }) => {
      const risk = getValue<string>();
      const s = riskStatus(risk);
      const colors = {
        ok: { color: '#00F2FE', border: 'rgba(0,242,254,0.4)', bg: 'rgba(0,242,254,0.06)' },
        warning: { color: '#FFB000', border: 'rgba(255,176,0,0.4)', bg: 'rgba(255,176,0,0.06)' },
        critical: { color: '#FF4B2B', border: 'rgba(255,75,43,0.4)', bg: 'rgba(255,75,43,0.06)' },
      }[s];
      return (
        <span
          className="font-mono text-[10px] px-2 py-0.5 border tracking-widest"
          style={{ color: colors.color, borderColor: colors.border, background: colors.bg }}
        >
          {risk}
        </span>
      );
    },
  },
];

/* ── Page ─────────────────────────────────────────────────── */
export default function FleetAnalyticsPage() {
  const [lookbackMonths, setLookbackMonths] = useState(6);

  const { data: trends, isLoading: trendsLoading } = useSWR(
    ['fleet-analytics/trends', lookbackMonths],
    () => api.fleetAnalytics.trends(lookbackMonths).then((r) => r.data),
    { refreshInterval: 60_000 }
  );
  const { data: vesselScores, isLoading: scoresLoading } = useSWR(
    'fleet-analytics/vessel-scores',
    () => api.fleetAnalytics.vesselScores().then((r) => r.data ?? []),
    { refreshInterval: 60_000 }
  );
  const { data: forecast, isLoading: forecastLoading } = useSWR(
    'fleet-analytics/forecast',
    () => api.fleetAnalytics.forecast().then((r) => r.data),
    { refreshInterval: 60_000 }
  );

  const loading = trendsLoading || scoresLoading || forecastLoading;

  return (
    <DashboardLayout contentClassName="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-mono text-[15px] tracking-[0.06em] uppercase text-[#00F2FE] font-semibold flex items-center gap-2">
            <BarChart2 size={16} aria-hidden />
            Fleet Analytics Dashboard
          </h1>
          <p className="font-mono text-[11px] text-[rgba(0,242,254,0.4)]">
            Predictive performance metrics · PSC risk scoring · Certification forecasting
          </p>
        </div>
        <select
          className={`${termInputCls} w-48`}
          value={lookbackMonths}
          onChange={(e) => setLookbackMonths(Number(e.target.value))}
        >
          <option value={3} className="bg-[#0B132B]">Last 3 Months</option>
          <option value={6} className="bg-[#0B132B]">Last 6 Months</option>
          <option value={12} className="bg-[#0B132B]">Last 12 Months</option>
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-8 h-8 border-2 border-[#00F2FE] border-t-transparent animate-spin" />
          <p className="font-mono text-[11px] text-[rgba(0,242,254,0.3)] tracking-wider">
            AGGREGATING FLEET PERFORMANCE DATA...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Left — tables */}
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <span className="flex items-center gap-2">
                  <TrendingUp size={13} />
                  COMPLIANCE TRENDS
                </span>
              </CardHeader>
              <CardContent className="p-0">
                {trends?.series?.length > 0 ? (
                  <TerminalTable
                    data={trends.series}
                    columns={trendColumns}
                    rowKey={(r: any) => r.month}
                    emptyMessage="NO TREND DATA"
                  />
                ) : (
                  <p className="font-mono text-[11px] text-[rgba(0,242,254,0.25)] text-center py-12 tracking-widest">
                    — NO DATA —
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <span className="flex items-center gap-2">
                  <ShieldCheck size={13} />
                  VESSEL PERFORMANCE SCORES
                </span>
              </CardHeader>
              <CardContent className="p-0">
                <TerminalTable
                  data={vesselScores ?? []}
                  columns={scoreColumns}
                  rowKey={(r: any) => r.vesselId}
                  emptyMessage="NO VESSEL SCORES"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right — forecast */}
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <span className="flex items-center gap-2">
                  <BarChart2 size={13} />
                  CERTIFICATION FORECAST
                </span>
              </CardHeader>
              <CardContent className="flex flex-col gap-6 pt-2">
                <StatCard
                  label="EXPIRING IN 30 DAYS"
                  value={forecast?.summary?.next30Days ?? 0}
                  status="critical"
                  className="border-none"
                />
                <StatCard
                  label="EXPIRING IN 60 DAYS"
                  value={forecast?.summary?.next60Days ?? 0}
                  status="warning"
                  className="border-none"
                />
                <StatCard
                  label="EXPIRING IN 90 DAYS"
                  value={forecast?.summary?.next90Days ?? 0}
                  status="info"
                  className="border-none"
                />
              </CardContent>
            </Card>

            <div className="px-4 py-3 border border-[rgba(0,242,254,0.2)] bg-[rgba(0,242,254,0.03)] flex items-start gap-2">
              <Info size={12} className="text-[#00F2FE] mt-0.5 flex-shrink-0" />
              <p className="font-mono text-[11px] text-[rgba(0,242,254,0.6)] leading-relaxed">
                Forecast identifies upcoming compliance gaps based on STCW and Medical certificate validity.
              </p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
