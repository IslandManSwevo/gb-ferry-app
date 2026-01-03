'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { GlassCard } from '@/components/ui/GlassCard';
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
import { Alert, Button, Card, Col, Layout, Row, Skeleton, Space, Statistic, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

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
  const canViewCrew = useCanAccess('crew.view');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const response = await api.compliance.dashboard();
    
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setDashboard(response.data);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const criticalAlerts = dashboard?.alerts?.filter(a => a.severity === 'critical') || [];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar />
      <Layout>
        <AppHeader />
        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: 'linear-gradient(135deg, #001529 0%, #003a70 100%)',
            minHeight: 'calc(100vh - 64px - 48px)',
          }}
        >
          <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
            <Col>
              <Title level={2} style={{ color: '#fff', margin: 0 }}>
                Operations Dashboard
              </Title>
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

          {/* Error Alert */}
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

          {/* Critical Alerts */}
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

          {/* Quick Stats */}
          <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
            <Col xs={24} sm={12} lg={6}>
              <GlassCard>
                {loading ? (
                  <Skeleton active paragraph={false} />
                ) : (
                  <Statistic
                    title={<Text style={{ color: 'rgba(255,255,255,0.85)' }}>Today&apos;s Passengers</Text>}
                    value={dashboard?.summary?.todaysPassengers ?? 0}
                    prefix={<UserOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                )}
              </GlassCard>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <GlassCard>
                {loading ? (
                  <Skeleton active paragraph={false} />
                ) : (
                  <Statistic
                    title={<Text style={{ color: 'rgba(255,255,255,0.85)' }}>Active Crew</Text>}
                    value={dashboard?.summary?.totalCrew ?? 0}
                    prefix={<TeamOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                )}
              </GlassCard>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <GlassCard>
                {loading ? (
                  <Skeleton active paragraph={false} />
                ) : (
                  <Statistic
                    title={<Text style={{ color: 'rgba(255,255,255,0.85)' }}>Pending Manifests</Text>}
                    value={dashboard?.summary?.pendingManifests ?? 0}
                    prefix={<FileProtectOutlined />}
                    valueStyle={{ color: dashboard?.summary?.pendingManifests ? '#faad14' : '#52c41a' }}
                  />
                )}
              </GlassCard>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <GlassCard>
                {loading ? (
                  <Skeleton active paragraph={false} />
                ) : (
                  <Statistic
                    title={<Text style={{ color: 'rgba(255,255,255,0.85)' }}>Cert Expirations</Text>}
                    value={dashboard?.summary?.expiringCertifications ?? 0}
                    suffix="/ 30 days"
                    prefix={<SafetyCertificateOutlined />}
                    valueStyle={{ color: dashboard?.summary?.expiringCertifications ? '#ff4d4f' : '#52c41a' }}
                  />
                )}
              </GlassCard>
            </Col>
          </Row>

          {/* Quick Actions */}
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card
                title="Quick Actions"
                bordered={false}
                style={{ background: 'rgba(255,255,255,0.95)' }}
              >
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
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card
                title="Compliance Status"
                bordered={false}
                style={{ background: 'rgba(255,255,255,0.95)' }}
              >
                {loading ? (
                  <Skeleton active />
                ) : (
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <Card size="small" style={{ 
                      background: (dashboard?.metrics?.safeManningCompliance ?? 0) >= 100 ? '#f6ffed' : '#fffbe6', 
                      borderColor: (dashboard?.metrics?.safeManningCompliance ?? 0) >= 100 ? '#b7eb8f' : '#ffe58f' 
                    }}>
                      <Row justify="space-between" align="middle">
                        <Col>
                          <Text strong>Safe Manning Compliance</Text>
                        </Col>
                        <Col>
                          <Text style={{ 
                            color: (dashboard?.metrics?.safeManningCompliance ?? 0) >= 100 ? '#52c41a' : '#faad14' 
                          }}>
                            {dashboard?.metrics?.safeManningCompliance ?? 0}%
                          </Text>
                        </Col>
                      </Row>
                    </Card>
                    <Card size="small" style={{ 
                      background: (dashboard?.metrics?.manifestApprovalRate ?? 0) >= 90 ? '#f6ffed' : '#fffbe6', 
                      borderColor: (dashboard?.metrics?.manifestApprovalRate ?? 0) >= 90 ? '#b7eb8f' : '#ffe58f' 
                    }}>
                      <Row justify="space-between" align="middle">
                        <Col>
                          <Text strong>Manifest Approval Rate</Text>
                        </Col>
                        <Col>
                          <Text style={{ 
                            color: (dashboard?.metrics?.manifestApprovalRate ?? 0) >= 90 ? '#52c41a' : '#faad14' 
                          }}>
                            {dashboard?.metrics?.manifestApprovalRate ?? 0}%
                          </Text>
                        </Col>
                      </Row>
                    </Card>
                    <Card size="small" style={{ background: '#f0f5ff', borderColor: '#adc6ff' }}>
                      <Row justify="space-between" align="middle">
                        <Col>
                          <Text strong>Compliant Vessels</Text>
                        </Col>
                        <Col>
                          <Text style={{ color: '#1890ff' }}>
                            {dashboard?.summary?.compliantVessels ?? 0} / {dashboard?.summary?.totalVessels ?? 0}
                          </Text>
                        </Col>
                      </Row>
                    </Card>
                  </Space>
                )}
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
}
