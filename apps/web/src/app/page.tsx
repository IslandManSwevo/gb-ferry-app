'use client';

import { PriorityStatCard } from '@/components/compliance/PriorityStatCard';
import { VesselReadinessList } from '@/components/compliance/VesselReadinessList';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { WeatherWidget } from '@/components/ui/WeatherWidget';
import { api } from '@/lib/api';
import { Activity, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { VesselReadiness } from '@/components/compliance/VesselReadinessList';

interface Event {
  id: string;
  action: string;
  timestamp: string;
  actionDescription?: string;
  userName?: string;
}

interface DashboardData {
  summary: {
    totalVessels: number;
    compliantVessels: number;
    totalCrew: number;
    expiringCertifications: number;
    blockingIssues: number;
    criticalIssues: number;
  };
  vessels: VesselReadiness[];
  alerts: Array<{
    id: string;
    severity: 'blocking' | 'critical' | 'warning' | 'info';
    type: string;
    title: string;
    description: string;
  }>;
  metrics: {
    safeManningCompliance: number;
    certificateValidityRate: number;
    auditTrailCoverage: number;
  };
}

function getEventColor(action: string = ''): string {
  if (action.includes('CREATE')) return '#33FF33';
  if (action.includes('UPDATE')) return '#00FFFF';
  if (action.includes('DELETE') || action.includes('REVOKE')) return '#FF4B2B';
  if (action.includes('CBP') || action.includes('SUBMIT')) return '#FFB000';
  return 'rgba(51,255,51,0.5)';
}

function getAlertBorderColor(severity: string): string {
  if (severity === 'blocking') return 'rgba(255,75,43,0.5)';
  if (severity === 'critical') return 'rgba(255,75,43,0.35)';
  return 'rgba(255,176,0,0.4)';
}
function getAlertBgColor(severity: string): string {
  if (severity === 'blocking') return 'rgba(255,75,43,0.07)';
  if (severity === 'critical') return 'rgba(255,75,43,0.05)';
  return 'rgba(255,176,0,0.05)';
}
function getAlertTextColor(severity: string): string {
  if (severity === 'blocking' || severity === 'critical') return '#FF4B2B';
  return '#FFB000';
}

function formatEventTime(timestamp: string | null | undefined): string {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Unknown';
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return date.toLocaleDateString();
}

const weatherSnapshot = {
  location: 'Nassau Harbor',
  condition: 'Clear skies',
  temperatureC: 29,
  windKts: 14,
  waveHeightM: 1.1,
  visibilityNm: 7,
  updatedAt: new Date().toISOString(),
  advisory: 'Harbor open. Monitor gusts near channel buoys.',
};

export default function DashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, auditRes] = await Promise.all([
        api.compliance.dashboard(),
        api.audit.list({ limit: 5 }),
      ]);
      if (dashRes.error) setError(dashRes.error);
      else if (dashRes.data) setDashboard(dashRes.data);
      if (auditRes.data) setEvents(auditRes.data.items || []);
    } catch {
      setError('System error while synchronizing data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const criticalCertExpiry = useMemo(
    () => dashboard?.alerts?.filter((a) => a.severity === 'critical').length ?? 0,
    [dashboard?.alerts]
  );
  const dashboardVessels = useMemo(() => dashboard?.vessels || [], [dashboard?.vessels]);
  const criticalAlerts = dashboard?.alerts?.filter((a) =>
    ['blocking', 'critical'].includes(a.severity)
  ) ?? [];

  return (
    <DashboardLayout contentClassName="p-4 md:p-6">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-[15px] tracking-[0.06em] uppercase text-[#33FF33] font-semibold">
              Compliance Command Center
            </h1>
            <span className="font-mono text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 border border-[rgba(0,255,255,0.3)] text-[#00FFFF] bg-[rgba(0,255,255,0.04)]">
              <span className="inline-block w-1.5 h-1.5 bg-[#00FFFF] mr-1.5 animate-pulse" aria-hidden />
              REGULATORY OVERSIGHT
            </span>
          </div>
          <p className="font-mono text-[11px] text-[rgba(51,255,51,0.4)]">
            Real-time STCW monitoring · PSC inspection readiness · Certificate expiry tracking
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshCw size={11} className={loading ? 'animate-spin' : ''} />}
          onClick={fetchDashboard}
          disabled={loading}
        >
          Sync
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 px-4 py-3 border border-[rgba(255,75,43,0.4)] bg-[rgba(255,75,43,0.06)] flex items-center gap-3">
          <span className="font-mono text-[11px] text-[#FF4B2B]">{error}</span>
          <button
            className="ml-auto font-mono text-[10px] text-[rgba(255,75,43,0.5)] hover:text-[#FF4B2B] transition-colors"
            onClick={() => setError(null)}
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Blocking / critical alerts */}
      {criticalAlerts.map((alert) => (
        <div
          key={alert.id}
          className="mb-4 px-4 py-3 flex items-start gap-3"
          style={{
            border: `1px solid ${getAlertBorderColor(alert.severity)}`,
            background: getAlertBgColor(alert.severity),
          }}
        >
          <div className="flex flex-col gap-0.5 flex-1">
            <span
              className="font-mono text-[11px] tracking-wide font-semibold"
              style={{ color: getAlertTextColor(alert.severity) }}
            >
              {alert.title}
            </span>
            <span className="font-mono text-[11px] text-[rgba(51,255,51,0.5)]">
              {alert.description}
            </span>
          </div>
        </div>
      ))}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          {/* KPI row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PriorityStatCard
              title="BLOCKING ISSUES"
              value={dashboard?.summary?.blockingIssues ?? 0}
              priority="BLOCKING"
              description="Immediate action required. Fleet operations restricted."
            />
            <PriorityStatCard
              title="CRITICAL DEFICIENCIES"
              value={criticalCertExpiry || (dashboard?.summary?.criticalIssues ?? 0)}
              priority="CRITICAL"
              description="Compliance gap detected. High risk of PSC detention."
            />
            <PriorityStatCard
              title="EXPIRING DOCUMENTS"
              value={dashboard?.summary?.expiringCertifications ?? 0}
              priority="WARNING"
              description="Certifications requiring renewal within 30 days."
            />
          </div>

          {/* Vessel readiness */}
          {dashboardVessels.length > 0 && (
            <VesselReadinessList vessels={dashboardVessels} />
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <WeatherWidget
            loading={loading}
            location={weatherSnapshot.location}
            condition={weatherSnapshot.condition}
            temperatureC={weatherSnapshot.temperatureC}
            windKts={weatherSnapshot.windKts}
            waveHeightM={weatherSnapshot.waveHeightM}
            visibilityNm={weatherSnapshot.visibilityNm}
            updatedAt={weatherSnapshot.updatedAt}
            advisory={weatherSnapshot.advisory}
            onRefresh={fetchDashboard}
          />

          {/* Compliance event stream */}
          <Card>
            <CardHeader
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/audit')}
                >
                  Full Log
                </Button>
              }
            >
              <span className="flex items-center gap-2">
                <Activity size={13} />
                COMPLIANCE EVENT STREAM
              </span>
            </CardHeader>
            <CardContent className="p-0 max-h-[320px] overflow-y-auto">
              {events.length === 0 ? (
                <p className="font-mono text-[10px] text-[rgba(51,255,51,0.25)] text-center py-10 tracking-widest">
                  — NO RECENT ACTIVITY —
                </p>
              ) : (
                events.map((event, idx) => (
                  <div
                    key={event.id || idx}
                    className="flex gap-3 px-4 py-3 border-b border-[rgba(51,255,51,0.06)] last:border-b-0"
                  >
                    <div
                      className="w-[3px] flex-shrink-0 self-stretch"
                      style={{ background: getEventColor(event.action) }}
                    />
                    <div className="flex-1 flex flex-col gap-0.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className="font-mono text-[10px] tracking-wider uppercase font-semibold"
                          style={{ color: getEventColor(event.action) }}
                        >
                          {(event.action || '').replace(/_/g, ' ')}
                        </span>
                        <span className="font-mono text-[10px] text-[rgba(51,255,51,0.3)] flex-shrink-0">
                          {formatEventTime(event.timestamp)}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-[rgba(51,255,51,0.6)]">
                        {event.actionDescription ||
                          `${event.userName || 'System'} · ${event.action || 'activity'}`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
