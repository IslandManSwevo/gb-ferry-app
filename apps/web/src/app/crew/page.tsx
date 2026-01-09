'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PlusOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Input,
  Layout,
  Progress,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';

const { Content } = Layout;
const { Title, Text } = Typography;

const columns = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    render: (text: string) => <a>{text}</a>,
  },
  {
    title: 'Role',
    dataIndex: 'role',
    key: 'role',
  },
  {
    title: 'Vessel',
    dataIndex: 'vessel',
    key: 'vessel',
  },
  {
    title: 'Certifications',
    dataIndex: 'certCount',
    key: 'certCount',
    render: (count: number, record: any) => (
      <Space direction="vertical" size={4}>
        <Space>
          <span>{count} active</span>
          {record.expiringCerts > 0 && <Tag color="orange">{record.expiringCerts} expiring</Tag>}
        </Space>
        <Progress
          percent={Math.max(0, 100 - record.expiringCerts * 10)}
          size="small"
          strokeColor={
            record.expiringCerts > 1
              ? '#ff4d4f'
              : record.expiringCerts === 1
                ? '#faad14'
                : '#52c41a'
          }
          showInfo={false}
        />
      </Space>
    ),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => {
      const colors: Record<string, string> = {
        Active: 'green',
        'On Leave': 'orange',
        Inactive: 'default',
      };
      return <Tag color={colors[status] || 'default'}>{status}</Tag>;
    },
  },
  {
    title: 'Duty',
    dataIndex: 'duty',
    key: 'duty',
    render: (duty: string) => (
      <StatusBadge
        status={duty === 'On Watch' ? 'ok' : duty === 'Next Watch' ? 'warning' : 'muted'}
        label={duty}
        compact
      />
    ),
  },
  {
    title: 'Action',
    key: 'action',
    render: () => (
      <Space size="small">
        <Button type="link" size="small">
          View
        </Button>
        <Button type="link" size="small">
          Certifications
        </Button>
      </Space>
    ),
  },
];

// Placeholder data
const data = [
  {
    key: '1',
    name: 'Capt. James Wilson',
    role: 'Master',
    vessel: 'MV Bahama Spirit',
    certCount: 5,
    expiringCerts: 0,
    status: 'Active',
    duty: 'On Watch',
  },
  {
    key: '2',
    name: 'John Martinez',
    role: 'Chief Officer',
    vessel: 'MV Bahama Spirit',
    certCount: 4,
    expiringCerts: 1,
    status: 'Active',
    duty: 'Next Watch',
  },
  {
    key: '3',
    name: 'Sarah Johnson',
    role: 'Chief Engineer',
    vessel: 'MV Bahama Spirit',
    certCount: 6,
    expiringCerts: 2,
    status: 'Active',
    duty: 'Reserve',
  },
];

export default function CrewPage() {
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
          }}
        >
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} md={8}>
              <GlassCard intensity="medium">
                <Space direction="vertical" size={4}>
                  <Text style={{ color: '#e6f7ff', fontWeight: 600 }}>On Watch</Text>
                  <Space align="center">
                    <StatusBadge status="ok" label="Bridge staffed" />
                    <Text style={{ color: '#e6f7ff', opacity: 0.8 }}>
                      3/3 critical roles filled
                    </Text>
                  </Space>
                </Space>
              </GlassCard>
            </Col>
            <Col xs={24} md={8}>
              <GlassCard intensity="medium">
                <Space direction="vertical" size={4}>
                  <Text style={{ color: '#e6f7ff', fontWeight: 600 }}>Certifications</Text>
                  <Space align="center">
                    <StatusBadge status="warning" label="Expiring soon" />
                    <Text style={{ color: '#e6f7ff', opacity: 0.8 }}>3 expiring in 30d</Text>
                  </Space>
                </Space>
              </GlassCard>
            </Col>
            <Col xs={24} md={8}>
              <GlassCard intensity="medium">
                <Space direction="vertical" size={4}>
                  <Text style={{ color: '#e6f7ff', fontWeight: 600 }}>Coverage</Text>
                  <Space align="center">
                    <StatusBadge status="ok" label="All vessels staffed" />
                    <Text style={{ color: '#e6f7ff', opacity: 0.8 }}>Next watch: 14:00</Text>
                  </Space>
                </Space>
              </GlassCard>
            </Col>
          </Row>

          <Card>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <Title level={3} style={{ margin: 0 }}>
                <TeamOutlined style={{ marginRight: 12 }} />
                Crew Roster
              </Title>
              <Space>
                <Input
                  placeholder="Search crew..."
                  prefix={<SearchOutlined />}
                  style={{ width: 250 }}
                />
                <Button type="primary" icon={<PlusOutlined />}>
                  Add Crew Member
                </Button>
              </Space>
            </div>
            <Table columns={columns} dataSource={data} />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}
