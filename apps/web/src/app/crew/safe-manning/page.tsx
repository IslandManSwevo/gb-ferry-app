'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { api } from '@/lib/api';
import {
  CheckCircleOutlined,
  InfoCircleOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Card,
  Col,
  Empty,
  Layout,
  List,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

export default function SafeManningPage() {
  const [vessels, setVessels] = useState<any[]>([]);
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null);
  const [rosterStatus, setRosterStatus] = useState<any>(null);
  const [loadingVessels, setLoadingVessels] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);

  const fetchVessels = async () => {
    setLoadingVessels(true);
    const { data } = await api.vessels.list({ pageSize: 100 });
    if (data?.items) {
      setVessels(data.items);
      if (data.items.length > 0) {
        setSelectedVessel(data.items[0].id);
      }
    }
    setLoadingVessels(false);
  };

  const fetchRosterStatus = useCallback(async (vesselId: string) => {
    setLoadingRoster(true);
    const { data, error } = await api.crew.roster(vesselId);
    if (error) {
      message.error(`Failed to fetch roster: ${error}`);
    } else {
      setRosterStatus(data);
    }
    setLoadingRoster(false);
  }, []);

  useEffect(() => {
    fetchVessels();
  }, []);

  useEffect(() => {
    if (selectedVessel) {
      fetchRosterStatus(selectedVessel);
    }
  }, [selectedVessel, fetchRosterStatus]);

  const roleColumns = [
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Text style={{ color: '#e6f7ff' }}>{role.replace(/_/g, ' ')}</Text>,
    },
    {
      title: 'Required',
      dataIndex: 'required',
      key: 'required',
      render: (val: number) => <Text style={{ color: '#fff' }}>{val}</Text>,
    },
    {
      title: 'Actual',
      dataIndex: 'actual',
      key: 'actual',
      render: (val: number) => <Text style={{ color: '#fff' }}>{val}</Text>,
    },
    {
      title: 'Fulfillable',
      dataIndex: 'fulfillable',
      key: 'fulfillable',
      render: (val: number) => (
        <Tooltip title="Qualified crew available but perhaps not assigned">
          <Text style={{ color: 'rgba(255,255,255,0.45)' }}>{val}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: any) => (
        <Tag color={record.actual >= record.required ? 'success' : 'error'}>
          {record.actual >= record.required ? 'MET' : 'SHORTFALL'}
        </Tag>
      ),
    },
  ];

  const roleData = rosterStatus
    ? Object.keys(rosterStatus.required).map((role) => ({
        role,
        required: rosterStatus.required[role],
        actual: rosterStatus.actualByRole[role] || 0,
        fulfillable: rosterStatus.fulfillableByRole[role] || 0,
      }))
    : [];

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
              <Title level={2} style={{ color: '#fff', margin: 0 }}>
                <TeamOutlined style={{ marginRight: 12, color: '#1890ff' }} />
                Safe Manning Compliance
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                BMA R106 Real-time validation of minimum safe manning levels and STCW competency.
              </Text>
            </Col>
            <Col>
              <Select
                loading={loadingVessels}
                value={selectedVessel}
                onChange={setSelectedVessel}
                style={{ width: 250 }}
                placeholder="Select Vessel"
                options={vessels.map((v) => ({ label: v.name, value: v.id }))}
              />
            </Col>
          </Row>

          {loadingRoster ? (
            <div style={{ textAlign: 'center', padding: '100px' }}>
              <Spin size="large" />
            </div>
          ) : rosterStatus ? (
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={8}>
                <Card
                  title={
                    <Space>
                      <CheckCircleOutlined
                        style={{ color: rosterStatus.compliant ? '#52c41a' : '#ff4d4f' }}
                      />
                      <Text style={{ color: '#e6f7ff' }}>Compliance Status</Text>
                    </Space>
                  }
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  headStyle={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Progress
                      type="dashboard"
                      percent={rosterStatus.compliant ? 100 : 66}
                      status={rosterStatus.compliant ? 'success' : 'exception'}
                      strokeColor={rosterStatus.compliant ? '#52c41a' : '#ff4d4f'}
                    />
                    <div style={{ marginTop: 16 }}>
                      <Tag
                        color={rosterStatus.compliant ? 'success' : 'error'}
                        style={{ fontSize: 16, padding: '4px 12px' }}
                      >
                        {rosterStatus.compliant ? 'FULLY COMPLIANT' : 'NON-COMPLIANT'}
                      </Tag>
                    </div>
                  </div>

                  {rosterStatus.discrepancies.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <Text
                        strong
                        style={{
                          color: 'rgba(255,255,255,0.45)',
                          display: 'block',
                          marginBottom: 8,
                        }}
                      >
                        IDENTIFIED ISSUES
                      </Text>
                      <List
                        size="small"
                        dataSource={rosterStatus.discrepancies}
                        renderItem={(item: string) => (
                          <List.Item style={{ border: 'none', padding: '4px 0' }}>
                            <Space align="start">
                              <WarningOutlined style={{ color: '#ff4d4f', marginTop: 4 }} />
                              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                                {item}
                              </Text>
                            </Space>
                          </List.Item>
                        )}
                      />
                    </div>
                  )}
                </Card>
              </Col>

              <Col xs={24} lg={16}>
                <Card
                  title={
                    <Space>
                      <InfoCircleOutlined style={{ color: '#1890ff' }} />
                      <Text style={{ color: '#e6f7ff' }}>Safe Manning Requirements (R106)</Text>
                    </Space>
                  }
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  headStyle={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <Table
                    dataSource={roleData}
                    columns={roleColumns}
                    pagination={false}
                    rowKey="role"
                    className="maritime-table"
                  />
                  <div
                    style={{
                      marginTop: 24,
                      padding: 16,
                      background: 'rgba(24,144,255,0.05)',
                      borderRadius: 8,
                    }}
                  >
                    <Paragraph style={{ color: 'rgba(255,255,255,0.65)', margin: 0, fontSize: 12 }}>
                      <strong>Note:</strong> Safe Manning validation includes checking for valid
                      STCW Certificates of Competency (CoC), Medical Fitness certificates, and
                      specific Bahamas Maritime Authority (BMA) endorsements where required.
                    </Paragraph>
                  </div>
                </Card>
              </Col>
            </Row>
          ) : (
            <Empty description="No roster data available for this vessel" />
          )}

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
            .ant-select-selector {
              background: rgba(255, 255, 255, 0.05) !important;
              border: 1px solid rgba(255, 255, 255, 0.1) !important;
              color: #fff !important;
            }
          `}</style>
        </Content>
      </Layout>
    </Layout>
  );
}
