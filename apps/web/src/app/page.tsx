'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { api } from '@/lib/api';
import { useCanAccess } from '@/lib/auth/roles';
import {
  FileProtectOutlined,
  ReloadOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Layout,
  Progress,
  Row,
  Skeleton,
  Space,
  Statistic,
  Typography,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import type { StatusKind } from '../components/ui/StatusBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { WeatherWidget } from '../components/ui/WeatherWidget';

const { Content } = Layout;
const { Title, Text } = Typography;

interface DashboardData {
  summary: {
    totalVessels: number;
    compliantVessels: number;
    expiringCertifications: number;
    pendingManifests: number;
    totalCrew?: number;
    todaysPassengers?: number;
  };
  metrics: {
    safeManningCompliance: number;
    manifestApprovalRate: number;
  };
  alerts: Array<{
    id: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
  }>;
}

type AlertStatus = Extract<StatusKind, 'ok' | 'warning' | 'critical'>;

export default function DashboardPage() {
  const router = useRouter();
  const canCheckIn = useCanAccess('passengers.checkin');
  const canViewManifests = useCanAccess('passengers.view');
  const canViewCrew = useCanAccess('crew.view');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

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
    setError(null);

    const response = await api.compliance.dashboard();

    if (response.error) {
      // Fallback stub so UI remains usable even if API is unreachable
      setDashboard({
        summary: {
          totalVessels: 0,
          compliantVessels: 0,
          expiringCertifications: 0,
          pendingManifests: 0,
          totalCrew: 0,
          todaysPassengers: 0,
        },
        metrics: { safeManningCompliance: 0, manifestApprovalRate: 0 },
        alerts: [],
      });
      setUsingFallback(true);
      setError(null);
    } else if (response.data) {
      setDashboard(response.data);
      setUsingFallback(false);
      setError(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const criticalAlerts = dashboard?.alerts?.filter((a) => a.severity === 'critical') || [];
  const passengersToday = dashboard?.summary?.todaysPassengers ?? 0;
  const pendingManifests = dashboard?.summary?.pendingManifests ?? 0;
  const crewReadyPct = dashboard?.metrics?.safeManningCompliance ?? 0;
  const alertsSeverity: AlertStatus = criticalAlerts.length
    ? 'critical'
    : pendingManifests > 0
      ? 'warning'
      : 'ok';
  const totalVessels = dashboard?.summary?.totalVessels ?? 0;
  const compliantVessels = dashboard?.summary?.compliantVessels ?? 0;
  const hasFleetData = totalVessels > 0;
  const fleetStatus: StatusKind = hasFleetData
    ? compliantVessels >= totalVessels
      ? 'ok'
      : 'warning'
    : 'warning';
  const fleetLabel = hasFleetData
    ? compliantVessels >= totalVessels
      ? 'All clear'
      : 'Review vessels'
    : 'No data';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar />
      <Layout>
        <AppHeader />
        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: 'linear-gradient(135deg, #0a1f33 0%, #0c2f4a 45%, #0b3a5d 100%)',
            minHeight: 'calc(100vh - 64px - 48px)',
          }}
        >
          <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
            <Col>
              <Title level={2} style={{ color: '#fff', margin: 0 }}>
                Operations & Readiness
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.75)' }}>
                Live view of compliance, crew readiness, and passenger operations
              </Text>
            </Col>
            <Col>
              <Button
                icon={<ReloadOutlined spin={loading} />}
                onClick={fetchDashboard}
                disabled={loading}
              >
                Refresh
              </Button>
            </Col>
          </Row>

          {error && (
            <Alert
              message="Failed to load dashboard"
              description={error}
              type="error"
              showIcon
              closable
              style={{ marginBottom: 24 }}
              action={
                <Button size="small" onClick={fetchDashboard}>
                  Retry
                </Button>
              }
            />
          )}

          {usingFallback && (
            <Alert
              message="Using offline snapshot"
              description="Live dashboard data is unavailable; showing placeholder values."
              type="warning"
              showIcon
              closable
              style={{ marginBottom: 16 }}
            />
          )}

          {criticalAlerts.length > 0 && (
            <Alert
              message="Critical Compliance Alerts"
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {criticalAlerts.map((alert) => (
                    <li key={alert.id}>{alert.message}</li>
                  ))}
                </ul>
              }
              type="error"
              icon={<WarningOutlined />}
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} md={8}>
              <GlassCard style={{ background: 'linear-gradient(135deg, #003f5c 0%, #0077be 70%)' }}>
                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                  <Text style={{ color: '#e6f7ff', opacity: 0.85, fontWeight: 600 }}>
                    Operations Now
                  </Text>
                  <Space align="center" size={12}>
                    <StatusBadge
                      status={alertsSeverity}
                      label={alertsSeverity === 'critical' ? 'Action needed' : 'Running'}
                    />
                    <Text style={{ color: '#e6f7ff' }}>
                      {passengersToday} pax today • {pendingManifests} manifests pending
                    </Text>
                  </Space>
                  <Progress
                    percent={Math.min(100, crewReadyPct)}
                    strokeColor={crewReadyPct >= 100 ? '#52c41a' : '#ffb020'}
                    showInfo={false}
                  />
                  <Text type="secondary">Crew readiness</Text>
                </Space>
              </GlassCard>
            </Col>
            <Col xs={24} md={8}>
              <GlassCard style={{ background: 'linear-gradient(135deg, #00c9a7 0%, #0077be 90%)' }}>
                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                  <Text style={{ color: '#e6f7ff', opacity: 0.85, fontWeight: 600 }}>
                    Weather Watch
                  </Text>
                  <Space align="center" size={12}>
                    <StatusBadge status="ok" label={weatherSnapshot.condition} />
                    <Text style={{ color: '#e6f7ff' }}>
                      Wind {weatherSnapshot.windKts} kts • Seas {weatherSnapshot.waveHeightM} m
                    </Text>
                  </Space>
                  <Text type="secondary">
                    Updated{' '}
                    {new Date(weatherSnapshot.updatedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </Space>
              </GlassCard>
            </Col>
            <Col xs={24} md={8}>
              <GlassCard
                style={{
                  background: 'linear-gradient(135deg, #312e81 0%, #4338ca 60%, #2563eb 100%)',
                }}
              >
                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                  <Text style={{ color: '#e6f7ff', opacity: 0.85, fontWeight: 600 }}>
                    Compliance Pulse
                  </Text>
                  <Space align="center" size={12}>
                    <StatusBadge
                      status={criticalAlerts.length ? 'critical' : 'ok'}
                      label={criticalAlerts.length ? `${criticalAlerts.length} critical` : 'Clear'}
                    />
                    <Text style={{ color: '#e6f7ff' }}>
                      Certs expiring: {dashboard?.summary?.expiringCertifications ?? 0}
                    </Text>
                  </Space>
                  <Text type="secondary">Pending manifests: {pendingManifests}</Text>
                </Space>
              </GlassCard>
            </Col>
          </Row>

          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            <Col xs={24} xl={16}>
              <GlassCard>
                {loading ? (
                  <Skeleton active />
                ) : (
                  <>
                    <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
                      <Col>
                        <Title level={4} style={{ color: '#e6f7ff', margin: 0 }}>
                          Operational Readiness
                        </Title>
                        <Text style={{ color: 'rgba(230,247,255,0.75)' }}>
                          Crew, manifests, and compliance status
                        </Text>
                      </Col>
                      <Col>
                        <StatusBadge
                          status={
                            (dashboard?.metrics?.safeManningCompliance ?? 0) >= 100
                              ? 'ok'
                              : 'warning'
                          }
                          label={
                            (dashboard?.metrics?.safeManningCompliance ?? 0) >= 100
                              ? 'Ready'
                              : 'Staffing attention'
                          }
                        />
                      </Col>
                    </Row>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title={
                            <Text style={{ color: 'rgba(255,255,255,0.7)' }}>
                              Today&apos;s Passengers
                            </Text>
                          }
                          value={dashboard?.summary?.todaysPassengers ?? 0}
                          prefix={<UserOutlined />}
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title={
                            <Text style={{ color: 'rgba(255,255,255,0.7)' }}>Active Crew</Text>
                          }
                          value={dashboard?.summary?.totalCrew ?? 0}
                          prefix={<TeamOutlined />}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title={
                            <Text style={{ color: 'rgba(255,255,255,0.7)' }}>
                              Pending Manifests
                            </Text>
                          }
                          value={dashboard?.summary?.pendingManifests ?? 0}
                          prefix={<FileProtectOutlined />}
                          valueStyle={{
                            color: dashboard?.summary?.pendingManifests ? '#f0a400' : '#52c41a',
                          }}
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title={
                            <Text style={{ color: 'rgba(255,255,255,0.7)' }}>
                              Cert Expirations (30d)
                            </Text>
                          }
                          value={dashboard?.summary?.expiringCertifications ?? 0}
                          prefix={<SafetyCertificateOutlined />}
                          valueStyle={{
                            color: dashboard?.summary?.expiringCertifications
                              ? '#ff7875'
                              : '#52c41a',
                          }}
                        />
                      </Col>
                    </Row>
                    <Divider style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={8}>
                        <Space direction="vertical" size={4}>
                          <Text style={{ color: 'rgba(255,255,255,0.75)' }}>
                            Safe Manning Compliance
                          </Text>
                          <Progress
                            percent={dashboard?.metrics?.safeManningCompliance ?? 0}
                            strokeColor={
                              (dashboard?.metrics?.safeManningCompliance ?? 0) >= 100
                                ? '#52c41a'
                                : '#faad14'
                            }
                            showInfo
                          />
                        </Space>
                      </Col>
                      <Col xs={24} md={8}>
                        <Space direction="vertical" size={4}>
                          <Text style={{ color: 'rgba(255,255,255,0.75)' }}>
                            Manifest Approval Rate
                          </Text>
                          <Progress
                            percent={dashboard?.metrics?.manifestApprovalRate ?? 0}
                            strokeColor={
                              (dashboard?.metrics?.manifestApprovalRate ?? 0) >= 90
                                ? '#52c41a'
                                : '#faad14'
                            }
                            showInfo
                          />
                        </Space>
                      </Col>
                      <Col xs={24} md={8}>
                        <Space direction="vertical" size={8}>
                          <Text style={{ color: 'rgba(255,255,255,0.75)' }}>Fleet Compliance</Text>
                          <Space size={12} align="center">
                            <Text style={{ color: '#e6f7ff', fontSize: 18, fontWeight: 600 }}>
                              {dashboard?.summary?.compliantVessels ?? 0} /{' '}
                              {dashboard?.summary?.totalVessels ?? 0}
                            </Text>
                            <StatusBadge status={fleetStatus} label={fleetLabel} compact />
                          </Space>
                        </Space>
                      </Col>
                    </Row>
                  </>
                )}
              </GlassCard>
            </Col>
            <Col xs={24} xl={8}>
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
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={14}>
              <GlassCard>
                <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
                  <Col>
                    <Title level={4} style={{ margin: 0 }}>
                      Priority Alerts
                    </Title>
                    <Text type="secondary">Compliance and operational risks</Text>
                  </Col>
                  <Col>
                    <StatusBadge
                      status={criticalAlerts.length ? 'critical' : 'ok'}
                      label={criticalAlerts.length ? `${criticalAlerts.length} critical` : 'Stable'}
                      compact
                    />
                  </Col>
                </Row>
                {loading ? (
                  <Skeleton active paragraph={{ rows: 3 }} />
                ) : criticalAlerts.length ? (
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    {criticalAlerts.map((alert) => (
                      <Card key={alert.id} size="small" style={{ borderColor: '#ff7875' }}>
                        <Space align="center">
                          <WarningOutlined style={{ color: '#d4380d' }} />
                          <Text strong>{alert.message}</Text>
                          <StatusBadge
                            status={alert.severity === 'critical' ? 'critical' : 'warning'}
                            label={alert.severity}
                            compact
                          />
                        </Space>
                      </Card>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">No critical alerts. Monitoring continues.</Text>
                )}
              </GlassCard>
            </Col>
            <Col xs={24} lg={10}>
              <GlassCard>
                <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
                  <Col>
                    <Title level={4} style={{ margin: 0 }}>
                      Quick Actions
                    </Title>
                    <Text type="secondary">Shortest paths to keep trips on time</Text>
                  </Col>
                </Row>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {canCheckIn && (
                    <Button
                      type="primary"
                      icon={<UserOutlined />}
                      block
                      size="large"
                      onClick={() => router.push('/passengers/checkin')}
                    >
                      New Passenger Check-In <RightOutlined />
                    </Button>
                  )}
                  {canViewManifests && (
                    <Button
                      icon={<FileProtectOutlined />}
                      block
                      size="large"
                      onClick={() => router.push('/passengers/manifests')}
                    >
                      Generate Manifest <RightOutlined />
                    </Button>
                  )}
                  {canViewCrew && (
                    <Button
                      icon={<TeamOutlined />}
                      block
                      size="large"
                      onClick={() => router.push('/crew')}
                    >
                      Crew Roster <RightOutlined />
                    </Button>
                  )}
                </Space>
              </GlassCard>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
}
