'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { DownloadOutlined, ExportOutlined, FileExcelOutlined, FilePdfOutlined, FileTextOutlined } from '@ant-design/icons';
import { Button, Card, Col, Layout, Row, Select, Space, Typography } from 'antd';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const exportTypes = [
  {
    title: 'Passenger Manifest (BMA Format)',
    description: 'Export manifest in Bahamas Maritime Authority required format',
    icon: <FileExcelOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
    formats: ['CSV', 'XML'],
  },
  {
    title: 'US CBP Advance Manifest',
    description: 'Export for US Customs and Border Protection submission',
    icon: <FileTextOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
    formats: ['XML'],
  },
  {
    title: 'Crew List (IMO FAL Form 5)',
    description: 'Export crew list in IMO FAL Convention format',
    icon: <FilePdfOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />,
    formats: ['PDF', 'CSV'],
  },
  {
    title: 'Compliance Audit Report',
    description: 'Full compliance status report for regulatory review',
    icon: <FilePdfOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
    formats: ['PDF'],
  },
];

export default function ExportCenterPage() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar />
      <Layout>
        <AppHeader />
        <Content style={{ margin: '24px', padding: '24px', background: '#f0f2f5' }}>
          <Title level={3} style={{ marginBottom: 24 }}>
            <ExportOutlined style={{ marginRight: 12 }} />
            Export Center
          </Title>

          <Row gutter={[24, 24]}>
            {exportTypes.map((type, index) => (
              <Col xs={24} md={12} key={index}>
                <Card>
                  <Space align="start" size="large">
                    {type.icon}
                    <div style={{ flex: 1 }}>
                      <Title level={5} style={{ margin: 0 }}>{type.title}</Title>
                      <Paragraph type="secondary" style={{ marginBottom: 12 }}>
                        {type.description}
                      </Paragraph>
                      <Space>
                        <Select
                          placeholder="Select sailing"
                          style={{ width: 200 }}
                          options={[
                            { value: 'sail-1', label: 'NAS → FPB (Jan 2, 14:00)' },
                            { value: 'sail-2', label: 'FPB → NAS (Jan 2, 18:30)' },
                          ]}
                        />
                        {type.formats.map((format) => (
                          <Button key={format} icon={<DownloadOutlined />}>
                            {format}
                          </Button>
                        ))}
                      </Space>
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
}
