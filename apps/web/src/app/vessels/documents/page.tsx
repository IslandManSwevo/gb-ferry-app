'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { FileTextOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Layout, Space, Table, Tag, Typography, Upload } from 'antd';

const { Content } = Layout;
const { Title } = Typography;

const columns = [
  {
    title: 'Document Name',
    dataIndex: 'name',
    key: 'name',
    render: (text: string) => <a>{text}</a>,
  },
  {
    title: 'Type',
    dataIndex: 'type',
    key: 'type',
  },
  {
    title: 'Vessel',
    dataIndex: 'vessel',
    key: 'vessel',
  },
  {
    title: 'Expiry Date',
    dataIndex: 'expiryDate',
    key: 'expiryDate',
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => {
      const colors: Record<string, string> = {
        'Valid': 'green',
        'Expiring Soon': 'orange',
        'Expired': 'red',
        'Pending Review': 'blue',
      };
      return <Tag color={colors[status] || 'default'}>{status}</Tag>;
    },
  },
  {
    title: 'Action',
    key: 'action',
    render: () => (
      <Space size="small">
        <Button type="link" size="small">Download</Button>
        <Button type="link" size="small">Verify</Button>
      </Space>
    ),
  },
];

// Placeholder data
const data = [
  { key: '1', name: 'Certificate of Registry', type: 'Registration', vessel: 'MV Bahama Spirit', expiryDate: '2027-12-31', status: 'Valid' },
  { key: '2', name: 'Safety Management Certificate', type: 'ISM', vessel: 'MV Bahama Spirit', expiryDate: '2026-06-15', status: 'Valid' },
  { key: '3', name: 'Wet-Lease Agreement', type: 'Charter', vessel: 'MV Island Princess', expiryDate: '2026-01-15', status: 'Expiring Soon' },
  { key: '4', name: 'Passenger Ship Safety Certificate', type: 'SOLAS', vessel: 'MV Bahama Spirit', expiryDate: '2026-03-01', status: 'Pending Review' },
];

export default function VesselDocumentsPage() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar />
      <Layout>
        <AppHeader />
        <Content style={{ margin: '24px', padding: '24px', background: '#f0f2f5' }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Title level={3} style={{ margin: 0 }}>
                <FileTextOutlined style={{ marginRight: 12 }} />
                Vessel Documents & Wet-Lease
              </Title>
              <Upload>
                <Button type="primary" icon={<UploadOutlined />}>
                  Upload Document
                </Button>
              </Upload>
            </div>
            <Table columns={columns} dataSource={data} />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}
