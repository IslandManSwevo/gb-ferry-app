'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { api } from '@/lib/api';
import {
  BarChartOutlined,
  DashboardOutlined,
  InfoCircleOutlined,
  LineChartOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import {
  Card,
  Col,
  Empty,
  Grid,
  Layout,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useState } from 'react';
import useSWR from 'swr';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

export default function FleetAnalyticsPage() {
  const [lookbackMonths, setLookbackMonths] = useState(6);
  const screens = Grid.useBreakpoint();

  const { data: trends, isLoading: trendsLoading } = useSWR(
    ['fleet-analytics/trends', lookbackMonths],
    () => api.fleetAnalytics.trends(lookbackMonths).then((r) => r.data),
    { onError: () => message.error('Failed to load compliance trends'), refreshInterval: 60_000 }
  );

  const { data: vesselScores, isLoading: scoresLoading } = useSWR(
    'fleet-analytics/vessel-scores',
    () => api.fleetAnalytics.vesselScores().then((r) => r.data ?? []),
    { onError: () => message.error('Failed to load vessel scores'), refreshInterval: 60_000 }
  );

  const { data: forecast, isLoading: forecastLoading } = useSWR(
    'fleet-analytics/forecast',
    () => api.fleetAnalytics.forecast().then((r) => r.data),
    {
      onError: () => message.error('Failed to load certification forecast'),
      refreshInterval: 60_000,
    }
  );

  const loading = trendsLoading || scoresLoading || forecastLoading;

  const scoreColumns = [
    {
      title: 'Vessel',
      dataIndex: 'vesselName',
      key: 'vesselName',
      render: (text: string) => <Text style={{ color: '#e6f7ff' }}>{text}</Text>,
    },
    {
      title: 'Composite Score',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => (
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text style={{ color: score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f' }}>
              {score.toFixed(1)}
            </Text>
          </div>
          <Progress
            percent={score}
            size="small"
            strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'}
            showInfo={false}
          />
        </Space>
      ),
    },
    {
      title: 'PSC Risk',
      dataIndex: 'pscRisk',
      key: 'pscRisk',
      render: (risk: string) => (
        <Tag color={risk === 'LOW' ? 'success' : risk === 'MEDIUM' ? 'warning' : 'error'}>
          {risk}
        </Tag>
      ),
    },
  ];

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
              <Title level={2} style={{ color: '#fff', margin: 0 }}>
                <DashboardOutlined style={{ marginRight: 12, color: '#1890ff' }} />
                Fleet Analytics Dashboard
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                Predictive performance metrics, PSC risk scoring, and certification forecasting.
              </Text>
            </Col>
            <Col>
              <Select
                value={lookbackMonths}
                onChange={setLookbackMonths}
                style={{ width: 180 }}
                options={[
                  { value: 3, label: 'Last 3 Months' },
                  { value: 6, label: 'Last 6 Months' },
                  { value: 12, label: 'Last 12 Months' },
                ]}
              />
            </Col>
          </Row>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px' }}>
              <Spin size="large" />
              <Paragraph style={{ color: 'rgba(255,255,255,0.45)', marginTop: 16 }}>
                Aggregating fleet performance data...
              </Paragraph>
            </div>
          ) : (
            <Row gutter={[24, 24]}>
              {/* Trends Section */}
              <Col xs={24} lg={16}>
                <Card
                  title={
                    <Space>
                      <LineChartOutlined style={{ color: '#1890ff' }} />
                      <Text style={{ color: '#e6f7ff' }}>Compliance Trends</Text>
                    </Space>
                  }
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    marginBottom: 24,
                  }}
                  headStyle={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {trends?.series ? (
                    <Table
                      dataSource={trends.series}
                      columns={[
                        { title: 'Month', dataIndex: 'month', key: 'month' },
                        {
                          title: 'Pass Rate',
                          dataIndex: 'passRate',
                          key: 'passRate',
                          render: (rate: number) => (
                            <Text style={{ color: '#52c41a' }}>{rate.toFixed(1)}%</Text>
                          ),
                        },
                        {
                          title: 'Deficiencies',
                          dataIndex: 'deficiencyCount',
                          key: 'deficiencies',
                        },
                      ]}
                      pagination={false}
                      size="small"
                      className="maritime-table"
                      scroll={{ x: 'max-content' }}
                    />
                  ) : (
                    <Empty />
                  )}
                </Card>

                <Card
                  title={
                    <Space>
                      <SafetyCertificateOutlined style={{ color: '#52c41a' }} />
                      <Text style={{ color: '#e6f7ff' }}>Vessel Performance Scores</Text>
                    </Space>
                  }
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  headStyle={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <Table
                    dataSource={vesselScores}
                    columns={scoreColumns}
                    pagination={false}
                    className="maritime-table"
                    rowKey="vesselId"
                    scroll={{ x: 'max-content' }}
                  />
                </Card>
              </Col>

              {/* Forecast Section */}
              <Col xs={24} lg={8}>
                <Card
                  title={
                    <Space>
                      <BarChartOutlined style={{ color: '#faad14' }} />
                      <Text style={{ color: '#e6f7ff' }}>Certification Forecast</Text>
                    </Space>
                  }
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    height: '100%',
                  }}
                  headStyle={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div>
                      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                        EXPIRING IN 30 DAYS
                      </Text>
                      <Statistic
                        value={forecast?.summary?.next30Days || 0}
                        valueStyle={{ color: '#ff4d4f', fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                        EXPIRING IN 60 DAYS
                      </Text>
                      <Statistic
                        value={forecast?.summary?.next60Days || 0}
                        valueStyle={{ color: '#faad14', fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                        EXPIRING IN 90 DAYS
                      </Text>
                      <Statistic
                        value={forecast?.summary?.next90Days || 0}
                        valueStyle={{ color: '#1890ff', fontWeight: 700 }}
                      />
                    </div>

                    <div
                      style={{
                        marginTop: 24,
                        padding: 16,
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: 8,
                      }}
                    >
                      <Space>
                        <InfoCircleOutlined style={{ color: '#1890ff' }} />
                        <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
                          Forecast identifies upcoming compliance gaps based on STCW and Medical
                          certificate validity.
                        </Text>
                      </Space>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}
