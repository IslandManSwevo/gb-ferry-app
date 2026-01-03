'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { DownloadOutlined, FileProtectOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Layout, Space, Table, Tag, Typography } from 'antd';

const { Content } = Layout;
const { Title } = Typography;

const columns = [
  {
    title: 'Manifest ID',
    dataIndex: 'id',
    key: 'id',
    render: (text: string) => <a>{text}</a>,
  },
  {
    title: 'Sailing',
    dataIndex: 'sailing',
    key: 'sailing',
  },
  {
    title: 'Date',
    dataIndex: 'date',
    key: 'date',
  },
  {
    title: 'Passengers',
    dataIndex: 'passengerCount',
    key: 'passengerCount',
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => {
      const colors: Record<string, string> = {
        'APPROVED': 'green',
        'DRAFT': 'orange',
        'SUBMITTED': 'blue',
        'REJECTED': 'red',
      };
      return <Tag color={colors[status] || 'default'}>{status}</Tag>;
    },
  },
  {
    title: 'Action',
    key: 'action',
    render: (_: any, record: any) => (
      <Space size="small">
        <Button type="link" size="small">View</Button>
        {record.status === 'DRAFT' && <Button type="link" size="small">Approve</Button>}
        {record.status === 'APPROVED' && (
          <Button type="link" size="small" icon={<DownloadOutlined />}>Export</Button>
        )}
      </Space>
    ),
  },
];

// Placeholder data
const data = [
  { key: '1', id: 'MAN-2026-0001', sailing: 'NAS → FPB', date: '2026-01-02', passengerCount: 248, status: 'APPROVED' },
  { key: '2', id: 'MAN-2026-0002', sailing: 'FPB → NAS', date: '2026-01-02', passengerCount: 185, status: 'DRAFT' },
  { key: '3', id: 'MAN-2026-0003', sailing: 'NAS → FPB', date: '2026-01-03', passengerCount: 0, status: 'DRAFT' },
];

export default function ManifestsPage() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar />
      <Layout>
        <AppHeader />
        <Content style={{ margin: '24px', padding: '24px', background: '#f0f2f5' }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Title level={3} style={{ margin: 0 }}>
                <FileProtectOutlined style={{ marginRight: 12 }} />
                Passenger Manifests
              </Title>
              <Button type="primary" icon={<PlusOutlined />}>
                Generate Manifest
              </Button>
            </div>
            <Table columns={columns} dataSource={data} />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}
