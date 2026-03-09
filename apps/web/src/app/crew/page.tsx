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
  DatePicker,
  Divider,
  Form,
  Input,
  Layout,
  Modal,
  Progress,
  Row,
  Select,
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
  const [vessels, setVessels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedCrew, setSelectedCrew] = useState<any | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dashboard, setDashboard] = useState<any | null>(null);
  const [form] = Form.useForm();

  const fetchCrew = useCallback(async () => {
    setLoading(true);
    try {
      const [crewResult, dashResult, vesselResult] = await Promise.all([
        api.crew.list(),
        api.compliance.dashboard(),
        api.vessels.list({ pageSize: 100 }),
      ]);

      if (crewResult.error) {
        message.error(crewResult.error || 'Failed to load crew registry');
      } else if (crewResult.data) {
        setCrew(crewResult.data.items || []);
      }

      if (dashResult.data) {
        setDashboard(dashResult.data);
      }

      // FIX-06: Handle vessel fetch errors and clear stale data
      if (vesselResult.error) {
        message.error(vesselResult.error || 'Failed to fetch vessel list');
        setVessels([]);
      } else if (vesselResult.data) {
        setVessels(vesselResult.data.items || []);
      }
    } catch (err: any) {
      message.error('System error occurred while loading crew data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCrew();
  }, [fetchCrew]);

  const handleOnboard = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        ...values,
        dateOfBirth: values.dateOfBirth.format('YYYY-MM-DD'),
        passportExpiryDate: values.passportExpiryDate.format('YYYY-MM-DD'),
      };

      const { error } = await api.crew.create(payload);
      if (error) {
        // FIX-06: Normalize error object to string to prevent [object Object]
        const errorMsg =
          typeof error === 'string'
            ? error
            : (error as any).message || JSON.stringify(error) || 'Failed to onboard crew member';
        message.error(errorMsg);
      } else {
        message.success('Crew member onboarded successfully');
        setIsOnboardModalOpen(false);
        form.resetFields();
        fetchCrew();
      }
    } catch (err: any) {
      // Form validation errors handled by Ant Design UI
    } finally {
      setSubmitting(false);
    }
  };

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
      c.rank?.toLowerCase().includes(searchText.toLowerCase()) ||
      c.vesselName?.toLowerCase().includes(searchText.toLowerCase())
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
        // FIX-06: Robust date check for certification logic
        const expiringCount =
          record.certifications?.filter((c: any) => {
            if (!c.expirationDate) return false;
            const expirationDate = new Date(c.expirationDate);
            if (isNaN(expirationDate.getTime())) return false;

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
    c.certifications?.some((cert: any) => {
      const d = new Date(cert.expirationDate);
      return !isNaN(d.getTime()) && d < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    })
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
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => setIsOnboardModalOpen(true)}
              >
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
                    percent={
                      crew.length > 0
                        ? (crew.filter((c) => c.status === 'ACTIVE').length / crew.length) * 100
                        : 0
                    }
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
                    style={{
                      color:
                        (dashboard?.summary?.expiringCertifications || expiringTotal) > 0
                          ? '#ff4d4f'
                          : '#52c41a',
                      margin: 0,
                    }}
                  >
                    {dashboard?.summary?.expiringCertifications ?? expiringTotal} Expiring
                  </Title>
                  <Space size={4}>
                    <Tag
                      color={
                        (dashboard?.summary?.expiringCertifications || expiringTotal) > 0
                          ? 'error'
                          : 'success'
                      }
                    >
                      {(dashboard?.summary?.expiringCertifications || expiringTotal) > 0
                        ? 'Action required within 30 days'
                        : 'All certifications current'}
                    </Tag>
                    {dashboard?.metrics?.certificateValidityRate != null && (
                      <Tag color="blue" style={{ fontSize: 10 }}>
                        {dashboard.metrics.certificateValidityRate.toFixed(0)}% valid
                      </Tag>
                    )}
                  </Space>
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
                  <Title
                    level={4}
                    style={{
                      color:
                        (dashboard?.metrics?.safeManningCompliance ?? 100) >= 100
                          ? '#52c41a'
                          : '#faad14',
                      margin: 0,
                    }}
                  >
                    {(dashboard?.metrics?.safeManningCompliance ?? 100).toFixed(0)}% Coverage
                  </Title>
                  <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px' }}>
                    {dashboard?.summary?.compliantVessels ?? '—'} /{' '}
                    {dashboard?.summary?.totalVessels ?? '—'} vessels meet BMA R106 requirements
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

      <Modal
        title="Onboard New Crew Member"
        open={isOnboardModalOpen}
        onOk={handleOnboard}
        onCancel={() => {
          setIsOnboardModalOpen(false);
          form.resetFields();
        }}
        confirmLoading={submitting}
        width={800}
        styles={{
          body: { background: '#0c2f4a', color: '#fff', padding: '24px' },
          mask: { backdropFilter: 'blur(4px)' },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            gender: 'MALE',
            role: 'DECK_OFFICER',
            nationality: 'Bahamian',
            passportIssuingCountry: 'BHS',
          }}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="givenNames"
                label={<Text style={{ color: '#e6f7ff' }}>Given Names</Text>}
                rules={[{ required: true, message: 'First names are required' }]}
              >
                <Input placeholder="e.g. John Albert" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="familyName"
                label={<Text style={{ color: '#e6f7ff' }}>Family Name</Text>}
                rules={[{ required: true, message: 'Last name is required' }]}
              >
                <Input placeholder="e.g. Smith" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                name="dateOfBirth"
                label={<Text style={{ color: '#e6f7ff' }}>Date of Birth</Text>}
                rules={[{ required: true }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="nationality"
                label={<Text style={{ color: '#e6f7ff' }}>Nationality</Text>}
                rules={[{ required: true }]}
              >
                <Input placeholder="e.g. Bahamian" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="gender"
                label={<Text style={{ color: '#e6f7ff' }}>Gender</Text>}
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { label: 'Male', value: 'MALE' },
                    { label: 'Female', value: 'FEMALE' },
                    { label: 'Other', value: 'OTHER' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ borderColor: 'rgba(255,255,255,0.1)' }}>TRAVEL DOCUMENTS</Divider>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="passportNumber"
                label={<Text style={{ color: '#e6f7ff' }}>Passport Number</Text>}
                rules={[{ required: true }]}
              >
                <Input placeholder="e.g. P1234567" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="passportExpiryDate"
                label={<Text style={{ color: '#e6f7ff' }}>Passport Expiry</Text>}
                rules={[{ required: true }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="seamanBookNumber"
                label={<Text style={{ color: '#e6f7ff' }}>Seaman Book No.</Text>}
              >
                <Input placeholder="e.g. SB998877" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="passportIssuingCountry"
                label={<Text style={{ color: '#e6f7ff' }}>Issuing Country (ISO)</Text>}
              >
                <Input placeholder="BHS" maxLength={3} />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ borderColor: 'rgba(255,255,255,0.1)' }}>ASSIGNMENT</Divider>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="role"
                label={<Text style={{ color: '#e6f7ff' }}>Rank / Role</Text>}
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { label: 'Master / Captain', value: 'MASTER' },
                    { label: 'Chief Officer', value: 'CHIEF_OFFICER' },
                    { label: 'Deck Officer', value: 'DECK_OFFICER' },
                    { label: 'Chief Engineer', value: 'CHIEF_ENGINEER' },
                    { label: 'Engineer Officer', value: 'ENGINEER_OFFICER' },
                    { label: 'Rating', value: 'RATING' },
                    { label: 'Cook / Steward', value: 'COOK_STEWARD' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="vesselId"
                label={<Text style={{ color: '#e6f7ff' }}>Assign to Vessel</Text>}
              >
                <Select
                  placeholder="Select vessel"
                  allowClear
                  options={vessels.map((v) => ({ label: v.name, value: v.id }))}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

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
