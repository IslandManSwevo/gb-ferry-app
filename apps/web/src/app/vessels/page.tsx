'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { useCanAccess } from '@/lib/auth/roles';
import {
  AppstoreOutlined,
  CompassOutlined,
  ContainerOutlined,
  DashboardOutlined,
  GlobalOutlined,
  PlusOutlined,
  SearchOutlined,
  TableOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Col,
  Divider,
  Input,
  Layout,
  message,
  Progress,
  Row,
  Segmented,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';

import { useCallback, useEffect, useState } from 'react';

const { Content } = Layout;
const { Title, Text } = Typography;

export default function VesselsPage() {
  const canAccessPage = useCanAccess('vessels.view');
  const [vessels, setVessels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchText, setSearchText] = useState('');

  const fetchVessels = useCallback(async () => {
    setLoading(true);
    const { data, error } = await api.vessels.list();
    if (error) {
      message.error('Failed to load vessel registry');
    } else if (data) {
      setVessels(data.items || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVessels();
  }, [fetchVessels]);

  const filteredVessels = vessels.filter(
    (v) =>
      v.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      v.imoNumber?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Vessel Identity',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: '#1890ff' }}>
            {text}
          </Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            IMO: {record.imoNumber}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Class/Type',
      dataIndex: 'type',
      key: 'type',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Flag State',
      dataIndex: 'flagState',
      key: 'flagState',
    },
    {
      title: 'Tonnage (GT)',
      dataIndex: 'grossTonnage',
      key: 'grossTonnage',
      render: (val: number) => val?.toLocaleString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, any> = {
          ACTIVE: { status: 'ok', label: 'In Service' },
          UNDER_MAINTENANCE: { status: 'warning', label: 'Maintenance' },
          OUT_OF_SERVICE: { status: 'critical', label: 'Out of Service' },
        };
        const config = statusMap[status] || { status: 'warning', label: status };
        return <StatusBadge status={config.status} label={config.label} compact />;
      },
    },
    {
      title: 'Compliance',
      key: 'compliance',
      render: () => <Progress percent={100} size="small" status="success" />,
    },
    {
      title: 'Action',
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button type="link" size="small" style={{ color: '#1890ff' }}>
            DASHBOARD
          </Button>
          <Button type="link" size="small">
            DOCUMENTS
          </Button>
        </Space>
      ),
    },
  ];

  const renderGridView = () => (
    <Row gutter={[24, 24]}>
      {loading
        ? Array(6)
            .fill(0)
            .map((_, i) => (
              <Col xs={24} md={12} lg={8} key={i}>
                <GlassCard>
                  <Skeleton active />
                </GlassCard>
              </Col>
            ))
        : filteredVessels.map((vessel) => (
            <Col xs={24} md={12} lg={8} key={vessel.id}>
              <GlassCard
                hoverable
                style={{
                  borderLeft:
                    vessel.status === 'ACTIVE' ? '4px solid #52c41a' : '4px solid #faad14',
                  transition: 'all 0.3s',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Space direction="vertical" size={0}>
                    <Title level={4} style={{ margin: 0, color: '#e6f7ff' }}>
                      {vessel.name}
                    </Title>
                    <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px' }}>
                      IMO: {vessel.imoNumber}
                    </Text>
                  </Space>
                  <Badge status={vessel.status === 'ACTIVE' ? 'success' : 'warning'} />
                </div>

                <Divider style={{ margin: '12px 0', borderColor: 'rgba(255,255,255,0.1)' }} />

                <Row gutter={[8, 8]}>
                  <Col span={12}>
                    <Space direction="vertical" size={0}>
                      <Text style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>
                        TYPE
                      </Text>
                      <Text style={{ color: '#e6f7ff' }}>{vessel.type}</Text>
                    </Space>
                  </Col>
                  <Col span={12}>
                    <Space direction="vertical" size={0}>
                      <Text style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>
                        FLAG
                      </Text>
                      <Text style={{ color: '#e6f7ff' }}>{vessel.flagState}</Text>
                    </Space>
                  </Col>
                  <Col span={24} style={{ marginTop: '8px' }}>
                    <Text style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>
                      DOCUMENT COMPLIANCE
                    </Text>
                    <Progress percent={92} size="small" strokeColor="#52c41a" />
                  </Col>
                </Row>

                <Divider style={{ margin: '12px 0', borderColor: 'rgba(255,255,255,0.1)' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button ghost size="small" icon={<ContainerOutlined />}>
                    Docs
                  </Button>
                  <Button type="primary" size="small" icon={<DashboardOutlined />}>
                    Fleet Ops
                  </Button>
                </div>
              </GlassCard>
            </Col>
          ))}
      {!loading && filteredVessels.length === 0 && (
        <Col span={24}>
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <CompassOutlined style={{ fontSize: 48, color: 'rgba(255,255,255,0.2)' }} />
            <Text style={{ display: 'block', marginTop: 16, color: 'rgba(255,255,255,0.45)' }}>
              No vessels matching your search criteria
            </Text>
          </div>
        </Col>
      )}
    </Row>
  );

  if (!canAccessPage) {
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GlassCard style={{ maxWidth: 600, padding: 40, textAlign: 'center' }}>
              <Space direction="vertical" size="large">
                <div
                  style={{
                    width: 80,
                    height: 80,
                    background: 'rgba(24, 144, 255, 0.1)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                  }}
                >
                  <GlobalOutlined style={{ fontSize: 40, color: '#1890ff' }} />
                </div>
                <div>
                  <Title level={3} style={{ color: '#fff', marginBottom: 8 }}>
                    Registry Access Restricted
                  </Title>
                  <Text style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Fleet registry and vessel status data is reserved for authorized operational
                    staff. Please authenticate with a higher clearance role to view the registry.
                  </Text>
                </div>
                <Button type="primary" size="large" onClick={() => window.history.back()}>
                  Return to Dashboard
                </Button>
              </Space>
            </GlassCard>
          </Content>
        </Layout>
      </Layout>
    );
  }

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
                <GlobalOutlined style={{ marginRight: 12 }} />
                Fleet Registry
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.75)' }}>
                Managing {vessels.length} active vessels across Group Bahama routes
              </Text>
            </Col>
            <Col>
              <Space size="middle">
                <Segmented
                  value={viewMode}
                  onChange={(v) => setViewMode(v as any)}
                  options={[
                    { value: 'grid', icon: <AppstoreOutlined /> },
                    { value: 'list', icon: <TableOutlined /> },
                  ]}
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                />
                <Button type="primary" icon={<PlusOutlined />} size="large">
                  Register New Vessel
                </Button>
              </Space>
            </Col>
          </Row>

          <GlassCard style={{ marginBottom: 24 }}>
            <Input
              placeholder="Search by vessel name or IMO number..."
              prefix={<SearchOutlined style={{ color: 'rgba(255,255,255,0.45)' }} />}
              size="large"
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
              }}
            />
          </GlassCard>

          {viewMode === 'grid' ? (
            renderGridView()
          ) : (
            <GlassCard>
              <Table
                columns={columns}
                dataSource={filteredVessels}
                loading={loading}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                style={{ background: 'transparent' }}
                className="maritime-table"
              />
            </GlassCard>
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
            .ant-segmented-item-selected {
              background-color: rgba(24, 144, 255, 0.5) !important;
              color: #fff !important;
            }
            .ant-segmented-item {
              color: rgba(255, 255, 255, 0.65);
            }
          `}</style>
        </Content>
      </Layout>
    </Layout>
  );
}
