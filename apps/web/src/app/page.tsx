'use client';

import { PriorityStatCard } from '@/components/compliance/PriorityStatCard';
import { VesselReadinessList } from '@/components/compliance/VesselReadinessList';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { api } from '@/lib/api';
import {
  DashboardOutlined,
  GlobalOutlined,
  ReloadOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Alert, Button, Col, Grid, Layout, Row, Space, Tag, Typography, message } from 'antd';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { WeatherWidget } from '../components/ui/WeatherWidget';

const { Content } = Layout;
const { Title, Text } = Typography;

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

export default function DashboardPage() {
  const router = useRouter();
  const screens = Grid.useBreakpoint();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

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

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, auditRes] = await Promise.all([
        api.compliance.dashboard(),
        api.audit.list({ limit: 5 }),
      ]);

      // FIX-06: Handle dashboard API errors
      if (dashRes.error) {
        message.error(dashRes.error || 'Failed to sync live dashboard data');
      } else if (dashRes.data) {
        setDashboard(dashRes.data);
      }

      // FIX-06: Handle audit API errors
      if (auditRes.error) {
        message.error('Failed to sync recent activity stream');
      } else if (auditRes.data) {
        setEvents(auditRes.data.items || []);
      }
    } catch (error: any) {
      // Catch network or unhandled errors
      message.error('System error occurred while synchronizing data');
      console.error('Fetch dashboard error:', error);
    } finally {
      // FIX-06: Guarantee setLoading(false) runs
      setLoading(false);
    }
  }, []);

  // FIX-06: Robust date validation for event time formatting
  const formatEventTime = (timestamp: string | null | undefined) => {
    if (!timestamp) return 'Unknown time';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Unknown time';

    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return date.toLocaleDateString();
  };

  const getEventColor = useCallback((action: string = '') => {
    if (action.includes('CREATE')) return '#52c41a';
    if (action.includes('UPDATE')) return '#1890ff';
    if (action.includes('DELETE') || action.includes('REVOKE')) return '#ff4d4f';
    if (action.includes('CBP') || action.includes('SUBMIT')) return '#ffa940';
    return '#1890ff';
  }, []);

  const getComplianceColor = useCallback((severity: string) => {
    switch (severity) {
      case 'blocking':
        return '#ff4d4f';
      case 'critical':
        return '#ff7a45';
      case 'warning':
        return '#faad14';
      default:
        return '#1890ff';
    }
  }, []);

  const criticalCertExpiry = useMemo(
    () => dashboard?.alerts?.filter((a) => a.severity === 'critical').length ?? 0,
    [dashboard?.alerts]
  );

  const dashboardVessels = useMemo(() => dashboard?.vessels || [], [dashboard?.vessels]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar />
      <Layout>
        <AppHeader />
        <Content
          style={{
            margin: screens.md ? '24px' : '12px',
            padding: screens.md ? '24px' : '16px',
            background: 'linear-gradient(135deg, #0a1f33 0%, #0c2f4a 45%, #0b3a5d 100%)',
            minHeight: 'calc(100vh - 64px - 48px)',
          }}
        >
          <Row justify="space-between" align="middle" style={{ marginBottom: 32 }}>
            <Col>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}
              >
                <Title level={2} style={{ color: '#fff', margin: 0 }}>
                  <DashboardOutlined style={{ marginRight: 12, color: '#1890ff' }} />
                  Compliance Command Center
                </Title>
                <Tag
                  color="cyan"
                  style={{
                    border: 'none',
                    background: 'rgba(0, 255, 255, 0.1)',
                    color: '#00ffff',
                    padding: '0 12px',
                  }}
                >
                  <Space>
                    <span className="pulse">●</span> REGULATORY OVERSIGHT
                  </Space>
                </Tag>
              </div>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: '16px' }}>
                Real-time regulatory tracking, STCW certificate expiry monitoring, and PSC
                inspection readiness.
              </Text>
            </Col>
            <Col>
              <Button
                type="primary"
                ghost
                icon={<ReloadOutlined spin={loading} />}
                onClick={fetchDashboard}
                disabled={loading}
                style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
              >
                Sync Data
              </Button>
            </Col>
          </Row>

          {dashboard?.alerts
            ?.filter((a) => ['blocking', 'critical'].includes(a.severity))
            .map((alert) => (
              <Alert
                key={alert.id}
                message={alert.title}
                description={alert.description}
                type={alert.severity === 'blocking' ? 'error' : 'warning'}
                icon={<WarningOutlined />}
                showIcon
                style={{
                  marginBottom: 16,
                  background: `${getComplianceColor(alert.severity)}1a`,
                  border: `1px solid ${getComplianceColor(alert.severity)}`,
                }}
              />
            ))}

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} md={8}>
                  <PriorityStatCard
                    title="BLOCKING ISSUES"
                    value={dashboard?.summary?.blockingIssues ?? 0}
                    priority="BLOCKING"
                    description="Immediate action required. Fleet operations restricted."
                  />
                </Col>
                <Col xs={24} md={8}>
                  <PriorityStatCard
                    title="CRITICAL DEFICIENCIES"
                    value={criticalCertExpiry || (dashboard?.summary?.criticalIssues ?? 0)}
                    priority="CRITICAL"
                    description="Compliance gap detected. High risk of PSC detention."
                  />
                </Col>
                <Col xs={24} md={8}>
                  <PriorityStatCard
                    title="EXPIRING DOCUMENTS"
                    value={dashboard?.summary?.expiringCertifications ?? 0}
                    priority="WARNING"
                    description="Certifications requiring renewal within 30 days."
                  />
                </Col>
              </Row>

              {dashboardVessels.length > 0 && <VesselReadinessList vessels={dashboardVessels} />}
            </Col>

            <Col xs={24} lg={8}>
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

              <GlassCard style={{ marginTop: 24, minHeight: '380px' }}>
                <Title level={4} style={{ color: '#e6f7ff', marginBottom: 20 }}>
                  <GlobalOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  Compliance Event Stream
                </Title>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {events.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <Text style={{ color: 'rgba(255,255,255,0.25)' }}>No recent activity</Text>
                    </div>
                  ) : (
                    events.map((event, idx) => (
                      <div
                        key={event.id || idx}
                        style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}
                      >
                        <div
                          style={{
                            width: '4px',
                            background: getEventColor(event.action),
                            borderRadius: '2px',
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text
                              strong
                              style={{
                                color: getEventColor(event.action),
                                fontSize: '11px',
                                letterSpacing: '0.5px',
                              }}
                            >
                              {/* FIX-06: Guard against undefined action */}
                              {(event.action || '').replace(/_/g, ' ')}
                            </Text>
                            <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px' }}>
                              {/* FIX-06: Guard against undefined timestamp */}
                              {formatEventTime(event.timestamp)}
                            </Text>
                          </div>
                          <Text style={{ color: '#e6f7ff', fontSize: '13px' }}>
                            {event.actionDescription ||
                              `${event.userName || 'System'} performed ${event.action || 'activity'}`}
                          </Text>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Button
                  block
                  ghost
                  style={{
                    marginTop: '12px',
                    borderColor: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.45)',
                  }}
                  onClick={() => router.push('/audit')}
                >
                  View Full Audit Log
                </Button>
              </GlassCard>
            </Col>
          </Row>
        </Content>
      </Layout>
      <style jsx global>{`
        .pulse {
          animation: pulse-animation 2s infinite;
          display: inline-block;
          margin-right: 4px;
        }
        @keyframes pulse-animation {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.5;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .ant-statistic-title {
          font-size: 11px !important;
          letter-spacing: 1px;
          margin-bottom: 8px !important;
        }
      `}</style>
    </Layout>
  );
}
