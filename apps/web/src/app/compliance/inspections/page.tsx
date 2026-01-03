'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { CheckCircleOutlined, CloseCircleOutlined, PlusOutlined, SafetyOutlined } from '@ant-design/icons';
import { Button, Card, Layout, Space, Table, Tag, Typography } from 'antd';

const { Content } = Layout;
const { Title } = Typography;

const columns = [
  {
    title: 'Inspection ID',
    dataIndex: 'id',
    key: 'id',
    render: (text: string) => <a>{text}</a>,
  },
  {
    title: 'Vessel',
    dataIndex: 'vessel',
    key: 'vessel',
  },
  {
    title: 'Authority',
    dataIndex: 'authority',
    key: 'authority',
  },
  {
    title: 'Date',
    dataIndex: 'date',
    key: 'date',
  },
  {
    title: 'Result',
    dataIndex: 'result',
    key: 'result',
    render: (result: string) => {
      if (result === 'Passed') {
        return <Tag icon={<CheckCircleOutlined />} color="success">Passed</Tag>;
      }
      if (result === 'Passed with Observations') {
        return <Tag icon={<CheckCircleOutlined />} color="warning">Passed (Obs)</Tag>;
      }
      return <Tag icon={<CloseCircleOutlined />} color="error">Failed</Tag>;
    },
  },
  {
    title: 'Deficiencies',
    dataIndex: 'deficiencies',
    key: 'deficiencies',
  },
  {
    title: 'Action',
    key: 'action',
    render: () => (
      <Space size="small">
        <Button type="link" size="small">View Report</Button>
      </Space>
    ),
  },
];

// Placeholder data
const data = [
  { key: '1', id: 'INS-2026-001', vessel: 'MV Bahama Spirit', authority: 'Bahamas Maritime Authority', date: '2026-01-02', result: 'Passed', deficiencies: 0 },
  { key: '2', id: 'INS-2025-089', vessel: 'MV Island Princess', authority: 'US Coast Guard', date: '2025-12-15', result: 'Passed with Observations', deficiencies: 2 },
  { key: '3', id: 'INS-2025-076', vessel: 'MV Bahama Spirit', authority: 'Bahamas Maritime Authority', date: '2025-11-20', result: 'Passed', deficiencies: 0 },
];

export default function InspectionsPage() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar />
      <Layout>
        <AppHeader />
        <Content style={{ margin: '24px', padding: '24px', background: '#f0f2f5' }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Title level={3} style={{ margin: 0 }}>
                <SafetyOutlined style={{ marginRight: 12 }} />
                Port State Control Inspections
              </Title>
              <Button type="primary" icon={<PlusOutlined />}>
                Record Inspection
              </Button>
            </div>
            <Table columns={columns} dataSource={data} />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}
