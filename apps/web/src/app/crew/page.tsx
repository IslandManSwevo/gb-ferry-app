'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PlusOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons';
import { Button, Card, Input, Layout, Space, Table, Tag, Typography } from 'antd';

const { Content } = Layout;
const { Title } = Typography;

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
      <Space>
        <span>{count} active</span>
        {record.expiringCerts > 0 && (
          <Tag color="warning">{record.expiringCerts} expiring</Tag>
        )}
      </Space>
    ),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => {
      const colors: Record<string, string> = {
        'Active': 'green',
        'On Leave': 'orange',
        'Inactive': 'default',
      };
      return <Tag color={colors[status] || 'default'}>{status}</Tag>;
    },
  },
  {
    title: 'Action',
    key: 'action',
    render: () => (
      <Space size="small">
        <Button type="link" size="small">View</Button>
        <Button type="link" size="small">Certifications</Button>
      </Space>
    ),
  },
];

// Placeholder data
const data = [
  { key: '1', name: 'Capt. James Wilson', role: 'Master', vessel: 'MV Bahama Spirit', certCount: 5, expiringCerts: 0, status: 'Active' },
  { key: '2', name: 'John Martinez', role: 'Chief Officer', vessel: 'MV Bahama Spirit', certCount: 4, expiringCerts: 1, status: 'Active' },
  { key: '3', name: 'Sarah Johnson', role: 'Chief Engineer', vessel: 'MV Bahama Spirit', certCount: 6, expiringCerts: 2, status: 'Active' },
];

export default function CrewPage() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar />
      <Layout>
        <AppHeader />
        <Content style={{ margin: '24px', padding: '24px', background: '#f0f2f5' }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
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
