'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SafetyCertificateOutlined, WarningOutlined } from '@ant-design/icons';
import { Alert, Card, Layout, Table, Tag, Typography } from 'antd';

const { Content } = Layout;
const { Title } = Typography;

const columns = [
  {
    title: 'Crew Member',
    dataIndex: 'crewName',
    key: 'crewName',
    render: (text: string) => <a>{text}</a>,
  },
  {
    title: 'Certificate Type',
    dataIndex: 'type',
    key: 'type',
  },
  {
    title: 'Certificate Number',
    dataIndex: 'certNumber',
    key: 'certNumber',
  },
  {
    title: 'Issuing Authority',
    dataIndex: 'authority',
    key: 'authority',
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
        'Pending Verification': 'blue',
      };
      return <Tag color={colors[status] || 'default'}>{status}</Tag>;
    },
  },
];

// Placeholder data
const data = [
  { key: '1', crewName: 'Capt. James Wilson', type: 'Master Mariner', certNumber: 'MM-2024-001', authority: 'Bahamas Maritime Authority', expiryDate: '2027-06-15', status: 'Valid' },
  { key: '2', crewName: 'John Martinez', type: 'Chief Officer', certNumber: 'CO-2023-042', authority: 'Bahamas Maritime Authority', expiryDate: '2026-01-20', status: 'Expiring Soon' },
  { key: '3', crewName: 'Sarah Johnson', type: 'STCW Basic Safety', certNumber: 'STCW-2022-189', authority: 'Bahamas Maritime Authority', expiryDate: '2025-12-01', status: 'Expired' },
];

export default function CertificationsPage() {
  const expiringCount = data.filter(d => d.status === 'Expiring Soon').length;
  const expiredCount = data.filter(d => d.status === 'Expired').length;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar />
      <Layout>
        <AppHeader />
        <Content style={{ margin: '24px', padding: '24px', background: '#f0f2f5' }}>
          {(expiringCount > 0 || expiredCount > 0) && (
            <Alert
              message="Certification Alerts"
              description={`${expiredCount} expired and ${expiringCount} expiring soon. Immediate action required.`}
              type="warning"
              icon={<WarningOutlined />}
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}
          <Card>
            <Title level={3} style={{ marginBottom: 24 }}>
              <SafetyCertificateOutlined style={{ marginRight: 12 }} />
              Crew Certifications
            </Title>
            <Table columns={columns} dataSource={data} />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}
