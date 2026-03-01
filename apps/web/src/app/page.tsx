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
  SafetyCertificateOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Col,
  Divider,
  Grid,
  Layout,
  Progress,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
  message,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { CrewManningIndicator } from '../components/ui/CrewManningIndicator';
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
    totalCrew: number;
    upcomingInspections: number;
    nonCompliantAlertsCount: number;
  };
  metrics: {
    safeManningCompliance: number;
    certificateValidityRate: number;
    auditTrailCoverage: number;
  };
  alerts: Array<{
    id: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const screens = Grid.useBreakpoint();
  const canManageCrew = useCanAccess('crew.manage');
  const canExportCompliance = useCanAccess('compliance.export');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock next departure for readiness overview
  const nextDeparture = {
    vesselId: '1',
    departureTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    route: 'Nassau → Freeport',
    vesselName: 'Grand Bahama Express',
    assignedCrew: 22,
    requiredCrew: 22,
    complianceStatus: 'ready',
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
      message.error(response.error || 'Failed to sync live dashboard data: API Error');
    } else if (response.data) {
      setDashboard(response.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const criticalAlerts = dashboard?.alerts?.filter((a) => a.severity === 'critical') || [];
  const expiringCerts = dashboard?.summary?.expiringCertifications ?? 0;
  const currentCrewCount = dashboard?.summary?.totalCrew ?? 0;
  const crewReadyPct = dashboard?.metrics?.safeManningCompliance ?? 0;

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
              {/* Next Departure Readiness Hero Section */}
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
                        NEXT DEPARTURE READINESS
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
                          <StatusBadge status="ok" label="Crew Validated" compact />
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
                      <CrewManningIndicator
                        current={nextDeparture.assignedCrew}
                        required={nextDeparture.requiredCrew}
                        label="SAFE MANNING"
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
                        icon={<SafetyCertificateOutlined />}
                        style={{
                          flex: 1,
                          background: '#fff',
                          color: '#2563eb',
                          border: 'none',
                          fontWeight: 600,
                        }}
                        onClick={() => router.push('/crew/certifications')}
                        disabled={!canManageCrew}
                      >
                        Verify Certs
                      </Button>
                      <Button
                        ghost
                        size="large"
                        icon={<FileProtectOutlined />}
                        style={{ flex: 1, fontWeight: 600 }}
                        onClick={() => router.push('/compliance/cbp')}
                        disabled={!canExportCompliance}
                      >
                        CBP Form I-418
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
                      title={<Text style={{ color: 'rgba(255,255,255,0.7)' }}>ACTIVE CREW</Text>}
                      value={currentCrewCount}
                      prefix={<TeamOutlined style={{ color: '#00ffff' }} />}
                      valueStyle={{ color: '#fff', fontWeight: 700 }}
                    />
                    <Progress percent={100} size="small" strokeColor="#00ffff" showInfo={false} />
                    <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px' }}>
                      Registered STCW Active Mariners
                    </Text>
                  </GlassCard>
                </Col>
                <Col xs={24} md={8}>
                  <GlassCard
                    style={{ background: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)' }}
                  >
                    <Statistic
                      title={<Text style={{ color: 'rgba(255,255,255,0.7)' }}>EXPIRING CERTS</Text>}
                      value={expiringCerts}
                      suffix="/ 30 Days"
                      prefix={<WarningOutlined style={{ color: '#ffa940' }} />}
                      valueStyle={{ color: '#fff', fontWeight: 700 }}
                    />
                    <Text style={{ color: '#ffa940', fontSize: '11px' }}>
                      {expiringCerts} expiring or missing documents
                    </Text>
                  </GlassCard>
                </Col>
                <Col xs={24} md={8}>
                  <GlassCard
                    style={{ background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)' }}
                  >
                    <Statistic
                      title={
                        <Text style={{ color: 'rgba(255,255,255,0.7)' }}>FLEET MANNING (R106)</Text>
                      }
                      value={crewReadyPct}
                      suffix="%"
                      prefix={<SafetyCertificateOutlined style={{ color: '#6ee7b7' }} />}
                      valueStyle={{ color: '#fff', fontWeight: 700 }}
                    />
                    <Text style={{ color: '#6ee7b7', fontSize: '11px' }}>
                      Compliance rate across all vessels
                    </Text>
                  </GlassCard>
                </Col>
              </Row>

              <div style={{ marginBottom: 24 }}>
                <GlassCard>
                  <Title level={4} style={{ color: '#e6f7ff', marginBottom: 20 }}>
                    <AlertOutlined style={{ marginRight: 8 }} />
                    Port State Control Readiness
                  </Title>
                  <Row gutter={[24, 24]}>
                    <Col xs={24} md={12}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                            Fleet Safe Manning Coverage
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
                            STCW Certificate Validity
                          </Text>
                          <Text style={{ color: '#e6f7ff' }}>
                            {dashboard?.metrics?.certificateValidityRate ?? 98}%
                          </Text>
                        </div>
                        <Progress
                          percent={dashboard?.metrics?.certificateValidityRate ?? 98}
                          strokeColor="#1890ff"
                        />
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
                          CBP EXPORT STATUS
                        </Text>
                        <Space size={16} align="center">
                          <div style={{ textAlign: 'center' }}>
                            <Title level={3} style={{ color: '#fff', margin: 0 }}>
                              ALL OK
                            </Title>
                            <Text style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
                              ACE FILINGS
                            </Text>
                          </div>
                          <Divider
                            type="vertical"
                            style={{ height: '40px', borderColor: 'rgba(255,255,255,0.1)' }}
                          />
                          <StatusBadge status="ok" label="I-418 Transmitted" />
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
                  Compliance Event Stream
                </Title>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {[
                    {
                      type: 'PSC INSPECTION',
                      time: '10 min ago',
                      msg: 'USCG Cleared boarding on Spirit of Freeport, zero deficiencies.',
                      color: '#52c41a',
                    },
                    {
                      type: 'CERTIFICATION',
                      time: '45 min ago',
                      msg: 'Updated Medical Certificate for Captain A. Smith',
                      color: '#1890ff',
                    },
                    {
                      type: 'CBP SUBMISSION',
                      time: '1 hr ago',
                      msg: 'I-418 Crew List successfully sent for Voyage #GR-402',
                      color: '#ffa940',
                    },
                    {
                      type: 'ALERT',
                      time: '2 hrs ago',
                      msg: 'Chief Engineer BMA Endorsement expiring in 5 days',
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
