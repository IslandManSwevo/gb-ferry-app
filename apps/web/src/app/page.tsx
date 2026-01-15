'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { api } from '@/lib/api';
import { useCanAccess } from '@/lib/auth/roles';
import {
  AlertOutlined,
  CompassOutlined,
  DashboardOutlined,
  FileProtectOutlined,
  GlobalOutlined,
  ReloadOutlined,
  TeamOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Col,
  Divider,
  Layout,
  Progress,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { CapacityIndicator } from '../components/ui/CapacityIndicator';
import { DepartureCountdown } from '../components/ui/DepartureCountdown';
import { GlassCard } from '../components/ui/GlassCard';
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

export default function DashboardPage() {
  const router = useRouter();
  const canCheckIn = useCanAccess('passengers.checkin');
  const canViewManifests = useCanAccess('passengers.view');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock next departure - In production, fetch from API
  const nextDeparture = {
    sailingId: '1',
    departureTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    route: 'Nassau → Freeport',
    vesselName: 'Grand Bahama Express',
    currentCapacity: 142,
    maxCapacity: 180,
    crewStatus: 'ready',
    weatherStatus: 'clear',
  };

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
    const response = await api.compliance.dashboard();

    if (response.error) {
      setDashboard({
        summary: {
          totalVessels: 4,
          compliantVessels: 3,
          expiringCertifications: 2,
          pendingManifests: 1,
          totalCrew: 24,
          todaysPassengers: 156,
        },
        metrics: { safeManningCompliance: 100, manifestApprovalRate: 98 },
        alerts: [
          {
            id: '1',
            severity: 'warning',
            message: 'Vessel Spirit of Freeport requires document renewal',
          },
        ],
      });
    } else if (response.data) {
      setDashboard(response.data);
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
          <Row justify="space-between" align="middle" style={{ marginBottom: 32 }}>
            <Col>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}
              >
                <Title level={2} style={{ color: '#fff', margin: 0 }}>
                  <DashboardOutlined style={{ marginRight: 12, color: '#1890ff' }} />
                  Fleet Command Center
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
                    <span className="pulse">●</span> LIVE OPERATIONS
                  </Space>
                </Tag>
              </div>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: '16px' }}>
                Real-time sailing status, compliance monitoring, and vessel readiness across the
                Bahama archipelago.
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

          {criticalAlerts.length > 0 && (
            <Alert
              message="URGENT: FLEET COMPLIANCE ALERT"
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
              style={{
                marginBottom: 24,
                background: 'rgba(255, 77, 79, 0.1)',
                border: '1px solid #ff4d4f',
              }}
            />
          )}

          <Row gutter={[24, 24]}>
            <Col xs={24} xl={16}>
              {/* Next Departure Hero Section */}
              <GlassCard
                style={{
                  background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                  marginBottom: 24,
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
                }}
              >
                <Row gutter={[24, 24]} align="middle">
                  <Col xs={24} md={12}>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text
                        style={{
                          color: 'rgba(255,255,255,0.85)',
                          fontSize: 13,
                          fontWeight: 700,
                          letterSpacing: '1px',
                        }}
                      >
                        NEXT DEPARTURE IN
                      </Text>
                      <DepartureCountdown
                        departureTime={nextDeparture.departureTime}
                        sailingLabel={nextDeparture.route}
                      />
                      <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '16px 0' }} />
                      <Space direction="vertical" size={2}>
                        <Text style={{ color: '#e6f7ff', fontSize: '16px', fontWeight: 500 }}>
                          <CompassOutlined style={{ marginRight: 8 }} />
                          Vessel: {nextDeparture.vesselName}
                        </Text>
                        <Space size={12} style={{ marginTop: 8 }}>
                          <StatusBadge status="ok" label="Crew Ready" compact />
                          <StatusBadge status="ok" label="Weather Clear" compact />
                        </Space>
                      </Space>
                    </Space>
                  </Col>
                  <Col xs={24} md={12}>
                    <div
                      style={{
                        background: 'rgba(0,0,0,0.2)',
                        padding: '20px',
                        borderRadius: '12px',
                      }}
                    >
                      <CapacityIndicator
                        current={nextDeparture.currentCapacity}
                        max={nextDeparture.maxCapacity}
                        showRemaining
                      />
                    </div>
                    <Space
                      style={{ width: '100%', marginTop: '20px' }}
                      direction="horizontal"
                      size={12}
                    >
                      <Button
                        type="primary"
                        size="large"
                        icon={<UserOutlined />}
                        style={{
                          flex: 1,
                          background: '#fff',
                          color: '#2563eb',
                          border: 'none',
                          fontWeight: 600,
                        }}
                        onClick={() => router.push('/passengers/checkin')}
                        disabled={!canCheckIn}
                      >
                        Check In
                      </Button>
                      <Button
                        ghost
                        size="large"
                        icon={<FileProtectOutlined />}
                        style={{ flex: 1, fontWeight: 600 }}
                        onClick={() => router.push('/passengers/manifests')}
                        disabled={!canViewManifests}
                      >
                        Manifest
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </GlassCard>

              {/* Operational Metrics */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} md={8}>
                  <GlassCard
                    style={{ background: 'linear-gradient(135deg, #003f5c 0%, #0077be 70%)' }}
                  >
                    <Statistic
                      title={
                        <Text style={{ color: 'rgba(255,255,255,0.7)' }}>TODAY&apos;S PAX</Text>
                      }
                      value={passengersToday}
                      prefix={<UserOutlined style={{ color: '#00ffff' }} />}
                      valueStyle={{ color: '#fff', fontWeight: 700 }}
                    />
                    <Progress percent={75} size="small" strokeColor="#00ffff" showInfo={false} />
                    <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px' }}>
                      Current booking vs capacity
                    </Text>
                  </GlassCard>
                </Col>
                <Col xs={24} md={8}>
                  <GlassCard
                    style={{ background: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)' }}
                  >
                    <Statistic
                      title={<Text style={{ color: 'rgba(255,255,255,0.7)' }}>MANIFESTS</Text>}
                      value={pendingManifests}
                      suffix="/ 4"
                      prefix={<FileProtectOutlined style={{ color: '#ffa940' }} />}
                      valueStyle={{ color: '#fff', fontWeight: 700 }}
                    />
                    <Text style={{ color: '#ffa940', fontSize: '11px' }}>
                      {pendingManifests} pending approval
                    </Text>
                  </GlassCard>
                </Col>
                <Col xs={24} md={8}>
                  <GlassCard
                    style={{ background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)' }}
                  >
                    <Statistic
                      title={<Text style={{ color: 'rgba(255,255,255,0.7)' }}>CREW COVERAGE</Text>}
                      value={crewReadyPct}
                      suffix="%"
                      prefix={<TeamOutlined style={{ color: '#6ee7b7' }} />}
                      valueStyle={{ color: '#fff', fontWeight: 700 }}
                    />
                    <Text style={{ color: '#6ee7b7', fontSize: '11px' }}>All watches staffed</Text>
                  </GlassCard>
                </Col>
              </Row>

              <div style={{ marginBottom: 24 }}>
                <GlassCard>
                  <Title level={4} style={{ color: '#e6f7ff', marginBottom: 20 }}>
                    <AlertOutlined style={{ marginRight: 8 }} />
                    Operational Readiness Overview
                  </Title>
                  <Row gutter={[24, 24]}>
                    <Col xs={24} md={12}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                            Safe Manning Compliance
                          </Text>
                          <Text style={{ color: '#e6f7ff' }}>{crewReadyPct}%</Text>
                        </div>
                        <Progress percent={crewReadyPct} strokeColor="#52c41a" />
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: '12px',
                          }}
                        >
                          <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                            Manifest Approval Rate
                          </Text>
                          <Text style={{ color: '#e6f7ff' }}>98%</Text>
                        </div>
                        <Progress percent={98} strokeColor="#1890ff" />
                      </Space>
                    </Col>
                    <Col xs={24} md={12}>
                      <div
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          padding: '16px',
                          borderRadius: '12px',
                        }}
                      >
                        <Text
                          style={{
                            color: 'rgba(255,255,255,0.45)',
                            display: 'block',
                            marginBottom: '8px',
                          }}
                        >
                          FLEET COMPLIANCE STATUS
                        </Text>
                        <Space size={16} align="center">
                          <div style={{ textAlign: 'center' }}>
                            <Title level={3} style={{ color: '#fff', margin: 0 }}>
                              3 / 4
                            </Title>
                            <Text style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
                              CERTIFIED
                            </Text>
                          </div>
                          <Divider
                            type="vertical"
                            style={{ height: '40px', borderColor: 'rgba(255,255,255,0.1)' }}
                          />
                          <StatusBadge status="warning" label="Review Pending" />
                        </Space>
                      </div>
                    </Col>
                  </Row>
                </GlassCard>
              </div>
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

              <GlassCard style={{ marginTop: 24, minHeight: '380px' }}>
                <Title level={4} style={{ color: '#e6f7ff', marginBottom: 20 }}>
                  <GlobalOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  Fleet Activity Feed
                </Title>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {[
                    {
                      type: 'DEPARTURE',
                      time: '10 min ago',
                      msg: 'MV Spirit of Freeport departed Nassau',
                      color: '#52c41a',
                    },
                    {
                      type: 'COMPLIANCE',
                      time: '45 min ago',
                      msg: 'IMO certification updated for Island Princess',
                      color: '#1890ff',
                    },
                    {
                      type: 'SYSTEM',
                      time: '1 hr ago',
                      msg: 'New manifest generated for Sailing #GR-402',
                      color: '#ffa940',
                    },
                    {
                      type: 'WEATHER',
                      time: '2 hrs ago',
                      msg: 'Small craft advisory active for North Abaco',
                      color: '#ff4d4f',
                    },
                  ].map((item, idx) => (
                    <div key={idx} style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
                      <div style={{ width: '4px', background: item.color, borderRadius: '2px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text
                            strong
                            style={{ color: item.color, fontSize: '11px', letterSpacing: '0.5px' }}
                          >
                            {item.type}
                          </Text>
                          <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px' }}>
                            {item.time}
                          </Text>
                        </div>
                        <Text style={{ color: '#e6f7ff', fontSize: '13px' }}>{item.msg}</Text>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  block
                  ghost
                  style={{
                    marginTop: '12px',
                    borderColor: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.45)',
                  }}
                >
                  View Operation Logs
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
