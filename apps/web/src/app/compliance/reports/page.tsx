'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { BarChartOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import { Button, Card, Col, DatePicker, Layout, Row, Select, Space, Table, Typography } from 'antd';

const { Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const columns = [
  {
    title: 'Report Name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Type',
    dataIndex: 'type',
    key: 'type',
  },
  {
    title: 'Generated',
    dataIndex: 'generatedAt',
    key: 'generatedAt',
  },
  {
    title: 'Period',
    dataIndex: 'period',
    key: 'period',
  },
  {
    title: 'Action',
    key: 'action',
    render: () => (
      <Button type="link" size="small" icon={<DownloadOutlined />}>
        Download
      </Button>
    ),
  },
];

// Placeholder data
const data = [
  { key: '1', name: 'Monthly Compliance Summary', type: 'Compliance', generatedAt: '2026-01-01', period: 'December 2025' },
  { key: '2', name: 'Safe Manning Report', type: 'Crew', generatedAt: '2025-12-15', period: 'Q4 2025' },
  { key: '3', name: 'Manifest Approval Log', type: 'Passenger', generatedAt: '2025-12-01', period: 'November 2025' },
];

export default function ComplianceReportsPage() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar />
      <Layout>
        <AppHeader />
        <Content style={{ margin: '24px', padding: '24px', background: '#f0f2f5' }}>
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Card>
                <Title level={3} style={{ marginBottom: 24 }}>
                  <BarChartOutlined style={{ marginRight: 12 }} />
                  Generate Compliance Report
                </Title>
                <Space wrap>
                  <Select
                    placeholder="Report Type"
                    style={{ width: 200 }}
                    options={[
                      { value: 'compliance_summary', label: 'Compliance Summary' },
                      { value: 'safe_manning', label: 'Safe Manning Report' },
                      { value: 'manifest_log', label: 'Manifest Approval Log' },
                      { value: 'certification_status', label: 'Certification Status' },
                    ]}
                  />
                  <Select
                    placeholder="Vessel"
                    style={{ width: 200 }}
                    options={[
                      { value: 'all', label: 'All Vessels' },
                      { value: 'vessel-1', label: 'MV Bahama Spirit' },
                      { value: 'vessel-2', label: 'MV Island Princess' },
                    ]}
                  />
                  <RangePicker />
                  <Button type="primary" icon={<FileTextOutlined />}>
                    Generate Report
                  </Button>
                </Space>
              </Card>
            </Col>

            <Col span={24}>
              <Card>
                <Title level={4}>
                  <Text type="secondary">Recent Reports</Text>
                </Title>
                <Table columns={columns} dataSource={data} pagination={false} />
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
}
