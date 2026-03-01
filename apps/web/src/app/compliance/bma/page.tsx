'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SafetyCertificateOutlined } from '@ant-design/icons';
import { Card, Empty, Layout, Space, Typography } from 'antd';

const { Content } = Layout;
const { Title, Text } = Typography;

export default function BmaEndorsementsPage() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar />
      <Layout>
        <AppHeader />
        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: 'linear-gradient(135deg, #0a1f33 0%, #0c2f4a 45%, #0b3a5d 100%)',
            minHeight: 'calc(100vh - 64px - 48px)',
          }}
        >
          <Card
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              textAlign: 'center',
              padding: '60px 0',
            }}
          >
            <Empty
              image={<SafetyCertificateOutlined style={{ fontSize: 64, color: '#1890ff' }} />}
              description={
                <Space direction="vertical">
                  <Title level={3} style={{ color: '#fff' }}>
                    BMA Endorsements Manager
                  </Title>
                  <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                    This module is used for tracking Bahamas Maritime Authority specific
                    endorsements.
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Currently integrated with the main Certifications registry.
                  </Text>
                </Space>
              }
            />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}
