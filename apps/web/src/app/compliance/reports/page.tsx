'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { api } from '@/lib/api';
import {
  AlertOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  LoadingOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
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
import { useCallback, useEffect, useState } from 'react';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

interface PscTrendsData {
  reportType: string;
  period: { from?: string; to?: string };
  summary: {
    totalInspections: number;
    inspectionsWithDeficiencies: number;
    totalDeficiencies: number;
  };
  trends: {
    byCode: Record<string, number>;
    bySeverity: Record<string, number>;
  };
}

interface FleetSnapshotData {
  reportType: string;
  snapshotDate: string;
  vessels: Array<{
    vesselName: string;
    vesselImo: string;
    isCompliant: boolean;
    deficiencies: string[];
    crewCount: number;
  }>;
  summary: {
    totalVessels: number;
    compliantVessels: number;
    overallComplianceRate: number;
  };
}

export default function ComplianceReportsPage() {
  const [reportType, setReportType] = useState<string>('fleet_compliance_snapshot');
  const [loading, setLoading] = useState(false);
  const [pscData, setPscData] = useState<PscTrendsData | null>(null);
  const [fleetData, setFleetData] = useState<FleetSnapshotData | null>(null);
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  const generateReport = useCallback(async () => {
    setLoading(true);
    const params: any = { type: reportType };
    if (dateRange) {
      params.dateFrom = dateRange[0]?.format('YYYY-MM-DD');
      params.dateTo = dateRange[1]?.format('YYYY-MM-DD');
    }

    const { data, error } = await api.compliance.reports(params);
    if (error) {
      message.error('Failed to generate report');
    } else if (data) {
      setLastGenerated(new Date().toISOString());
      if (reportType === 'psc_deficiency_trends') {
        setPscData(data);
        setFleetData(null);
      } else {
        setFleetData(data);
        setPscData(null);
      }
    }
    setLoading(false);
  }, [reportType, dateRange]);

  useEffect(() => {
    generateReport();
  }, [generateReport]);

  // PSC Deficiency columns
  const deficiencyCodeColumns = [
    {
      title: 'Deficiency Code',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <Text strong style={{ color: '#e6f7ff' }}>
          {code}
        </Text>
      ),
    },
    {
      title: 'Occurrences',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: any, b: any) => a.count - b.count,
      render: (count: number) => (
        <Tag color={count > 3 ? 'error' : count > 1 ? 'warning' : 'default'}>{count}</Tag>
      ),
    },
  ];

  // Fleet snapshot columns
  const fleetColumns = [
    {
      title: 'Vessel',
      dataIndex: 'vesselName',
      key: 'vesselName',
      render: (name: string, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: '#e6f7ff' }}>
            {name}
          </Text>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
            IMO: {record.vesselImo || 'N/A'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Crew',
      dataIndex: 'crewCount',
      key: 'crewCount',
      render: (count: number) => <Text style={{ color: 'rgba(255,255,255,0.85)' }}>{count}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'isCompliant',
      key: 'isCompliant',
      render: (compliant: boolean) =>
        compliant ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            COMPLIANT
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="error">
            NON-COMPLIANT
          </Tag>
        ),
    },
    {
      title: 'Deficiencies',
      dataIndex: 'deficiencies',
      key: 'deficiencies',
      render: (defs: string[]) => {
        if (!defs || defs.length === 0) {
          return <Text style={{ color: 'rgba(255,255,255,0.35)' }}>None</Text>;
        }
        return (
          <Space direction="vertical" size={2}>
            {defs.slice(0, 3).map((d, i) => (
              <Text key={i} style={{ fontSize: 11, color: '#ff7875' }}>
                <WarningOutlined style={{ marginRight: 4 }} />
                {d}
              </Text>
            ))}
            {defs.length > 3 && (
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                +{defs.length - 3} more
              </Text>
            )}
          </Space>
        );
      },
    },
  ];

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
          {/* Header */}
          <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
            <Col>
              <Title level={2} style={{ color: '#fff', margin: 0 }}>
                <BarChartOutlined style={{ marginRight: 12 }} />
                Compliance Reports
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                PSC trend analysis · Fleet compliance snapshots · Regulatory audit data
              </Text>
            </Col>
            {lastGenerated && (
              <Col>
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                  Last generated: {new Date(lastGenerated).toLocaleTimeString()}
                </Text>
              </Col>
            )}
          </Row>

          {/* Controls */}
          <Card
            style={{
              marginBottom: 24,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            bodyStyle={{ padding: 16 }}
          >
            <Space wrap size="middle">
              <Select
                value={reportType}
                onChange={setReportType}
                style={{ width: 280 }}
                options={[
                  { value: 'fleet_compliance_snapshot', label: '📊 Fleet Compliance Snapshot' },
                  { value: 'psc_deficiency_trends', label: '📈 PSC Deficiency Trends' },
                ]}
              />
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [any, any] | null)}
                style={{ width: 280 }}
              />
              <Button
                type="primary"
                icon={loading ? <LoadingOutlined /> : <FileTextOutlined />}
                onClick={generateReport}
                loading={loading}
                size="large"
              >
                Generate Report
              </Button>
              <Button icon={<ReloadOutlined />} onClick={generateReport} disabled={loading}>
                Refresh
              </Button>
            </Space>
          </Card>

          {/* Loading State */}
          {loading && (
            <div style={{ textAlign: 'center', padding: 80 }}>
              <Spin size="large" />
              <Paragraph style={{ color: 'rgba(255,255,255,0.65)', marginTop: 16 }}>
                Generating compliance report...
              </Paragraph>
            </div>
          )}

          {/* Fleet Compliance Snapshot */}
          {!loading && fleetData && (
            <>
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} md={8}>
                  <Card
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <Statistic
                      title={<Text style={{ color: 'rgba(255,255,255,0.65)' }}>Total Vessels</Text>}
                      value={fleetData.summary.totalVessels}
                      valueStyle={{ color: '#1890ff' }}
                      prefix={<SafetyCertificateOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <Statistic
                      title={<Text style={{ color: 'rgba(255,255,255,0.65)' }}>Compliant</Text>}
                      value={fleetData.summary.compliantVessels}
                      valueStyle={{ color: '#52c41a' }}
                      suffix={`/ ${fleetData.summary.totalVessels}`}
                      prefix={<CheckCircleOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <Statistic
                      title={
                        <Text style={{ color: 'rgba(255,255,255,0.65)' }}>Compliance Rate</Text>
                      }
                      value={fleetData.summary.overallComplianceRate}
                      precision={1}
                      suffix="%"
                      valueStyle={{
                        color:
                          fleetData.summary.overallComplianceRate >= 90 ? '#52c41a' : '#ff4d4f',
                      }}
                    />
                    <Progress
                      percent={fleetData.summary.overallComplianceRate}
                      strokeColor={
                        fleetData.summary.overallComplianceRate >= 90 ? '#52c41a' : '#ff4d4f'
                      }
                      showInfo={false}
                      style={{ marginTop: 8 }}
                    />
                  </Card>
                </Col>
              </Row>

              <Card
                title={
                  <Space>
                    <SafetyCertificateOutlined style={{ color: '#1890ff' }} />
                    <Text style={{ color: '#e6f7ff' }}>Vessel Compliance Detail</Text>
                  </Space>
                }
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                headStyle={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Table
                  columns={fleetColumns}
                  dataSource={fleetData.vessels.map((v, i) => ({ ...v, key: i }))}
                  pagination={false}
                  className="maritime-table"
                />
              </Card>
            </>
          )}

          {/* PSC Deficiency Trends */}
          {!loading && pscData && (
            <>
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} md={8}>
                  <Card
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <Statistic
                      title={<Text style={{ color: 'rgba(255,255,255,0.65)' }}>Inspections</Text>}
                      value={pscData.summary.totalInspections}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <Statistic
                      title={
                        <Text style={{ color: 'rgba(255,255,255,0.65)' }}>With Deficiencies</Text>
                      }
                      value={pscData.summary.inspectionsWithDeficiencies}
                      valueStyle={{
                        color:
                          pscData.summary.inspectionsWithDeficiencies > 0 ? '#ff4d4f' : '#52c41a',
                      }}
                      prefix={<AlertOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <Statistic
                      title={
                        <Text style={{ color: 'rgba(255,255,255,0.65)' }}>Total Deficiencies</Text>
                      }
                      value={pscData.summary.totalDeficiencies}
                      valueStyle={{
                        color: pscData.summary.totalDeficiencies > 0 ? '#faad14' : '#52c41a',
                      }}
                    />
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Card
                    title={
                      <Text style={{ color: '#e6f7ff' }}>
                        <BarChartOutlined style={{ marginRight: 8 }} />
                        Deficiencies by Code
                      </Text>
                    }
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    headStyle={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {Object.keys(pscData.trends.byCode).length > 0 ? (
                      <Table
                        columns={deficiencyCodeColumns}
                        dataSource={Object.entries(pscData.trends.byCode).map(([code, count]) => ({
                          key: code,
                          code,
                          count,
                        }))}
                        pagination={false}
                        size="small"
                        className="maritime-table"
                      />
                    ) : (
                      <Empty
                        description={
                          <Text style={{ color: 'rgba(255,255,255,0.45)' }}>
                            No deficiencies recorded
                          </Text>
                        }
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )}
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card
                    title={
                      <Text style={{ color: '#e6f7ff' }}>
                        <WarningOutlined style={{ marginRight: 8 }} />
                        Severity Breakdown
                      </Text>
                    }
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    headStyle={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                      {Object.entries(pscData.trends.bySeverity).map(([severity, count]) => (
                        <div key={severity}>
                          <Row justify="space-between" style={{ marginBottom: 4 }}>
                            <Text
                              style={{
                                color: 'rgba(255,255,255,0.85)',
                                textTransform: 'capitalize',
                              }}
                            >
                              {severity}
                            </Text>
                            <Text style={{ color: 'rgba(255,255,255,0.65)' }}>{count}</Text>
                          </Row>
                          <Progress
                            percent={
                              pscData.summary.totalDeficiencies > 0
                                ? (count / pscData.summary.totalDeficiencies) * 100
                                : 0
                            }
                            strokeColor={
                              severity === 'major'
                                ? '#ff4d4f'
                                : severity === 'minor'
                                  ? '#faad14'
                                  : '#52c41a'
                            }
                            showInfo={false}
                          />
                        </div>
                      ))}
                    </Space>
                  </Card>
                </Col>
              </Row>
            </>
          )}

          {/* No data state */}
          {!loading && !fleetData && !pscData && (
            <Card
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                textAlign: 'center',
                padding: 40,
              }}
            >
              <Empty
                description={
                  <Text style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Select a report type and click Generate to view compliance data
                  </Text>
                }
              />
            </Card>
          )}

          {/* Table styling */}
          <style jsx global>{`
            .maritime-table .ant-table {
              background: transparent !important;
              color: #e6f7ff !important;
            }
            .maritime-table .ant-table-thead > tr > th {
              background: rgba(255, 255, 255, 0.05) !important;
              color: rgba(255, 255, 255, 0.85) !important;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
            }
            .maritime-table .ant-table-tbody > tr > td {
              border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
            }
            .maritime-table .ant-table-tbody > tr:hover > td {
              background: rgba(255, 255, 255, 0.02) !important;
            }
          `}</style>
        </Content>
      </Layout>
    </Layout>
  );
}
