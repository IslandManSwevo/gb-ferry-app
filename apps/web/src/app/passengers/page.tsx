'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PlusOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Input, Layout, Space, Table, Tag, Typography } from 'antd';
import { useRouter } from 'next/navigation';

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
    title: 'Document',
    dataIndex: 'document',
    key: 'document',
  },
  {
    title: 'Nationality',
    dataIndex: 'nationality',
    key: 'nationality',
  },
  {
    title: 'Sailing',
    dataIndex: 'sailing',
    key: 'sailing',
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => {
      const colors: Record<string, string> = {
        'Checked In': 'green',
        'Pending': 'orange',
        'Cancelled': 'red',
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
        <Button type="link" size="small">Edit</Button>
      </Space>
    ),
  },
];

// Placeholder data
const data = [
  { key: '1', name: 'John Smith', document: 'US-123456789', nationality: 'USA', sailing: 'NAS → FPB', status: 'Checked In' },
  { key: '2', name: 'Maria Garcia', document: 'ES-987654321', nationality: 'ESP', sailing: 'NAS → FPB', status: 'Pending' },
  { key: '3', name: 'David Brown', document: 'UK-456789123', nationality: 'GBR', sailing: 'FPB → NAS', status: 'Checked In' },
];

export default function PassengersPage() {
  const router = useRouter();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar />
      <Layout>
        <AppHeader />
        <Content style={{ margin: '24px', padding: '24px', background: '#f0f2f5' }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Title level={3} style={{ margin: 0 }}>
                <UserOutlined style={{ marginRight: 12 }} />
                Passenger List
              </Title>
              <Space>
                <Input
                  placeholder="Search passengers..."
                  prefix={<SearchOutlined />}
                  style={{ width: 250 }}
                />
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => router.push('/passengers/checkin')}
                >
                  New Check-In
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
