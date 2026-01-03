'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { GlobalOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Input, Layout, Space, Table, Tag, Typography } from 'antd';

const { Content } = Layout;
const { Title } = Typography;

const columns = [
  {
    title: 'Vessel Name',
    dataIndex: 'name',
    key: 'name',
    render: (text: string) => <a>{text}</a>,
  },
  {
    title: 'IMO Number',
    dataIndex: 'imoNumber',
    key: 'imoNumber',
  },
  {
    title: 'Type',
    dataIndex: 'type',
    key: 'type',
  },
  {
    title: 'Flag State',
    dataIndex: 'flagState',
    key: 'flagState',
  },
  {
    title: 'Gross Tonnage',
    dataIndex: 'grossTonnage',
    key: 'grossTonnage',
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => {
      const colors: Record<string, string> = {
        'Active': 'green',
        'Under Maintenance': 'orange',
        'Out of Service': 'red',
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
        <Button type="link" size="small">Documents</Button>
      </Space>
    ),
  },
];

// Placeholder data
const data = [
  { key: '1', name: 'MV Bahama Spirit', imoNumber: 'IMO1234567', type: 'Passenger Ferry', flagState: 'Bahamas', grossTonnage: 2500, status: 'Active' },
  { key: '2', name: 'MV Island Princess', imoNumber: 'IMO7654321', type: 'Passenger Ferry', flagState: 'Bahamas', grossTonnage: 1800, status: 'Active' },
];

export default function VesselsPage() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar />
      <Layout>
        <AppHeader />
        <Content style={{ margin: '24px', padding: '24px', background: '#f0f2f5' }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Title level={3} style={{ margin: 0 }}>
                <GlobalOutlined style={{ marginRight: 12 }} />
                Vessel Registry
              </Title>
              <Space>
                <Input
                  placeholder="Search vessels..."
                  prefix={<SearchOutlined />}
                  style={{ width: 250 }}
                />
                <Button type="primary" icon={<PlusOutlined />}>
                  Add Vessel
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
