'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { CheckCircleOutlined, CloseCircleOutlined, TeamOutlined } from '@ant-design/icons';
import { Card, Col, Layout, Progress, Row, Table, Tag, Typography } from 'antd';

const { Content } = Layout;
const { Title, Text } = Typography;

const vesselColumns = [
  {
    title: 'Vessel',
    dataIndex: 'vessel',
    key: 'vessel',
    render: (text: string) => <a>{text}</a>,
  },
  {
    title: 'Required Crew',
    dataIndex: 'required',
    key: 'required',
  },
  {
    title: 'Actual Crew',
    dataIndex: 'actual',
    key: 'actual',
  },
  {
    title: 'Compliance',
    dataIndex: 'compliant',
    key: 'compliant',
    render: (compliant: boolean) => (
      compliant ? (
        <Tag icon={<CheckCircleOutlined />} color="success">Compliant</Tag>
      ) : (
        <Tag icon={<CloseCircleOutlined />} color="error">Non-Compliant</Tag>
      )
    ),
  },
];

// Placeholder data
const vesselData = [
  { key: '1', vessel: 'MV Bahama Spirit', required: 12, actual: 14, compliant: true },
  { key: '2', vessel: 'MV Island Princess', required: 10, actual: 8, compliant: false },
];

const roleRequirements = [
  { role: 'Master', required: 1, actual: 1, status: 'met' },
  { role: 'Chief Officer', required: 1, actual: 1, status: 'met' },
  { role: 'Second Officer', required: 1, actual: 1, status: 'met' },
  { role: 'Chief Engineer', required: 1, actual: 1, status: 'met' },
  { role: 'Second Engineer', required: 1, actual: 0, status: 'missing' },
  { role: 'Able Seaman', required: 4, actual: 4, status: 'met' },
  { role: 'Ordinary Seaman', required: 2, actual: 2, status: 'met' },
];

export default function SafeManningPage() {
  const totalCompliant = vesselData.filter(v => v.compliant).length;
  const complianceRate = Math.round((totalCompliant / vesselData.length) * 100);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar />
      <Layout>
        <AppHeader />
        <Content style={{ margin: '24px', padding: '24px', background: '#f0f2f5' }}>
          <Row gutter={[24, 24]}>
            <Col span={8}>
              <Card>
                <Text type="secondary">Fleet Compliance Rate</Text>
                <Progress
                  type="circle"
                  percent={complianceRate}
                  status={complianceRate === 100 ? 'success' : 'exception'}
                  style={{ display: 'block', marginTop: 16 }}
                />
              </Card>
            </Col>
            <Col span={16}>
              <Card>
                <Title level={4}>Role Requirements (MV Bahama Spirit)</Title>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={roleRequirements.map((r, i) => ({ ...r, key: i }))}
                  columns={[
                    { title: 'Role', dataIndex: 'role', key: 'role' },
                    { title: 'Required', dataIndex: 'required', key: 'required' },
                    { title: 'Actual', dataIndex: 'actual', key: 'actual' },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      key: 'status',
                      render: (status: string) => (
                        status === 'met' ? (
                          <Tag color="success">Met</Tag>
                        ) : (
                          <Tag color="error">Missing</Tag>
                        )
                      ),
                    },
                  ]}
                />
              </Card>
            </Col>
          </Row>

          <Card style={{ marginTop: 24 }}>
            <Title level={3} style={{ marginBottom: 24 }}>
              <TeamOutlined style={{ marginRight: 12 }} />
              Safe Manning Overview
            </Title>
            <Table columns={vesselColumns} dataSource={vesselData} pagination={false} />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}
