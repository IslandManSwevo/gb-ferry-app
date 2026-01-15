'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { useCanAccess } from '@/lib/auth/roles';
import {
  ClockCircleOutlined,
  PhoneOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Col,
  Input,
  Layout,
  Modal,
  Progress,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';

const { Content } = Layout;
const { Title, Text } = Typography;

export default function CrewPage() {
  const canAccessPage = useCanAccess('crew.view');
  const [crew, setCrew] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedCrew, setSelectedCrew] = useState<any | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const fetchCrew = useCallback(async () => {
    setLoading(true);
    const { data, error } = await api.crew.list();
    if (error) {
      message.error('Failed to load crew registry');
    } else if (data) {
      setCrew(data.items || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCrew();
  }, [fetchCrew]);

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
                  <TeamOutlined style={{ fontSize: 40, color: '#1890ff' }} />
                </div>
                <div>
                  <Title level={3} style={{ color: '#fff', marginBottom: 8 }}>
                    Crew Registry Restricted
                  </Title>
                  <Text style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Access to crew documents and duty rosters is restricted to authorized personnel.
                    Please contact your department head for access clearance.
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

  const handleContactCrew = (member: any) => {
    setSelectedCrew(member);
    setIsContactModalOpen(true);
  };

  const filteredCrew = crew.filter(
    (c) =>
      c.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      c.rank?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Crew Identity',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (text: string, record: any) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1890ff' }} icon={<TeamOutlined />} />
          <Space direction="vertical" size={0}>
            <Text strong style={{ color: '#e6f7ff' }}>
              {text}
            </Text>
            <Text type="secondary" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>
              ID: {record.id.slice(0, 8)}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Rank / Role',
      dataIndex: 'rank',
      key: 'rank',
      render: (rank: string) => <Tag color="blue">{rank}</Tag>,
    },
    {
      title: 'Assigned Vessel',
      dataIndex: 'vesselName',
      key: 'vesselName',
      render: (name: string) =>
        name || <Text style={{ color: 'rgba(255,255,255,0.25)' }}>Unassigned</Text>,
    },
    {
      title: 'Compliance',
      key: 'compliance',
      render: (record: any) => {
        const expiringCount =
          record.certifications?.filter((c: any) => {
            const expirationDate = new Date(c.expirationDate);
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            return expirationDate < thirtyDaysFromNow;
          }).length || 0;

        return (
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Progress
              percent={expiringCount > 0 ? 80 : 100}
              size="small"
              status={expiringCount > 0 ? 'exception' : 'success'}
              showInfo={false}
            />
            <Text style={{ fontSize: '10px', color: expiringCount > 0 ? '#ff4d4f' : '#52c41a' }}>
              {expiringCount > 0 ? `${expiringCount} certs expiring` : 'Fully Compliant'}
            </Text>
          </Space>
        );
      },
    },
    {
      title: 'Duty Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, any> = {
          ACTIVE: { status: 'ok', label: 'On Duty' },
          ON_LEAVE: { status: 'warning', label: 'On Leave' },
          OFF_DUTY: { status: 'muted', label: 'Off Duty' },
        };
        const config = statusMap[status] || { status: 'warning', label: status };
        return <StatusBadge status={config.status} label={config.label} compact />;
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (record: any) => (
        <Space size="middle">
          <Button
            type="primary"
            shape="circle"
            icon={<PhoneOutlined />}
            size="small"
            onClick={() => handleContactCrew(record)}
          />
          <Button type="link" size="small" style={{ color: '#1890ff' }}>
            PROFILE
          </Button>
        </Space>
      ),
    },
  ];

  const expiringTotal = crew.filter((c) =>
    c.certifications?.some(
      (cert: any) => new Date(cert.expirationDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    )
  ).length;

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
                <TeamOutlined style={{ marginRight: 12 }} />
                Crew Operations
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.75)' }}>
                Managing {crew.length} maritime professionals across Group Bahama fleet
              </Text>
            </Col>
            <Col>
              <Button type="primary" icon={<PlusOutlined />} size="large">
                Onboard New Crew
              </Button>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={8}>
              <GlassCard>
                <Space direction="vertical" size={8}>
                  <Text style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
                    <ClockCircleOutlined style={{ marginRight: 8 }} />
                    Watch Distribution
                  </Text>
                  <Title level={4} style={{ color: '#fff', margin: 0 }}>
                    {crew.filter((c) => c.status === 'ACTIVE').length} On Watch
                  </Title>
                  <Progress
                    percent={(crew.filter((c) => c.status === 'ACTIVE').length / crew.length) * 100}
                    strokeColor="#1890ff"
                    showInfo={false}
                  />
                </Space>
              </GlassCard>
            </Col>
            <Col xs={24} md={8}>
              <GlassCard>
                <Space direction="vertical" size={8}>
                  <Text style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
                    <SafetyCertificateOutlined style={{ marginRight: 8 }} />
                    Certification Health
                  </Text>
                  <Title
                    level={4}
                    style={{ color: expiringTotal > 0 ? '#ff4d4f' : '#52c41a', margin: 0 }}
                  >
                    {expiringTotal} Attention Needed
                  </Title>
                  <Tag color={expiringTotal > 0 ? 'error' : 'success'}>
                    {expiringTotal > 0 ? 'Action required for 30d windows' : 'Fleet compliant'}
                  </Tag>
                </Space>
              </GlassCard>
            </Col>
            <Col xs={24} md={8}>
              <GlassCard>
                <Space direction="vertical" size={8}>
                  <Text style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
                    <TeamOutlined style={{ marginRight: 8 }} />
                    Safe Manning
                  </Text>
                  <Title level={4} style={{ color: '#fff', margin: 0 }}>
                    100% Coverage
                  </Title>
                  <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px' }}>
                    All 4 vessels currently meet minimum requirements
                  </Text>
                </Space>
              </GlassCard>
            </Col>
          </Row>

          <GlassCard style={{ marginBottom: 24 }}>
            <Input
              placeholder="Search by name, rank, or vessel..."
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

          <GlassCard>
            <Table
              columns={columns}
              dataSource={filteredCrew}
              loading={loading}
              rowKey="id"
              pagination={{ pageSize: 15 }}
              style={{ background: 'transparent' }}
              className="maritime-table"
            />
          </GlassCard>
        </Content>
      </Layout>

      {/* Contact Modal */}
      <Modal
        title="Establishing Secure Link"
        open={isContactModalOpen}
        onCancel={() => setIsContactModalOpen(false)}
        footer={[
          <Button key="end" danger type="primary" onClick={() => setIsContactModalOpen(false)}>
            END SECURE CALL
          </Button>,
        ]}
      >
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Avatar
            size={80}
            style={{ backgroundColor: '#1890ff', marginBottom: 16 }}
            icon={<TeamOutlined />}
          />
          <Title level={3} style={{ marginBottom: 8 }}>
            {selectedCrew?.fullName}
          </Title>
          <Text type="secondary">{selectedCrew?.rank}</Text>
          <div style={{ marginTop: '24px' }}>
            <Tag color="processing" style={{ padding: '8px 24px', borderRadius: '20px' }}>
              <Space>
                <span className="pulse">●</span>
                ENCRYPTED VOICE LINK ACTIVE
              </Space>
            </Tag>
          </div>
        </div>
      </Modal>

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
        .pulse {
          animation: pulse-animation 2s infinite;
        }
        @keyframes pulse-animation {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </Layout>
  );
}
