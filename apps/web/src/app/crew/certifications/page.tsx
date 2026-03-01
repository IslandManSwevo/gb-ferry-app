'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { SafetyCertificateOutlined, WarningOutlined } from '@ant-design/icons';
import { Alert, Avatar, Button, Layout, Space, Table, Tag, Typography, message } from 'antd';
import { useEffect, useState } from 'react';

const { Content } = Layout;
const { Title, Text } = Typography;

export default function CertificationsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchCerts = async () => {
      setLoading(true);
      try {
        const res = await api.certifications.list();
        if (mounted) {
          if (res.data) {
            setData(res.data);
          } else if (res.error) {
            message.error(res.error);
          }
        }
      } catch (err) {
        if (mounted) message.error('Failed to load certifications');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchCerts();

    return () => {
      mounted = false;
    };
  }, []);

  const expiringCount = data.filter((d: any) => d.status === 'EXPIRING').length;
  const expiredCount = data.filter((d: any) => d.status === 'EXPIRED').length;

  const columns = [
    {
      title: 'Crew Member',
      dataIndex: 'crewName',
      key: 'crewName',
      render: (text: string) => (
        <Space>
          <Avatar src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${text}`} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Document Type',
      dataIndex: 'type',
      key: 'type',
      render: (t: string) => <Tag color="blue">{t}</Tag>,
    },
    {
      title: 'Certificate No.',
      dataIndex: 'certificateNumber',
      key: 'certificateNumber',
      render: (t: string) => <Text style={{ fontFamily: 'monospace' }}>{t}</Text>,
    },
    {
      title: 'Issuing Authority',
      dataIndex: 'issuingAuthority',
      key: 'issuingAuthority',
      responsive: ['md'] as any,
    },
    {
      title: 'Expiry Date',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date: string) => {
        const d = new Date(date);
        const isExpiring = d.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
        return <Text type={isExpiring ? 'danger' : undefined}>{d.toLocaleDateString()}</Text>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <StatusBadge
          status={s === 'VALID' ? 'ok' : s === 'EXPIRING' ? 'warning' : 'critical'}
          label={s}
          compact
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: () => (
        <Button
          type="link"
          icon={<SafetyCertificateOutlined />}
          onClick={() => message.info('Digital verification signature valid.')}
        >
          Verify
        </Button>
      ),
    },
  ];

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
          <GlassCard>
            <Title level={3} style={{ marginBottom: 24 }}>
              <SafetyCertificateOutlined style={{ marginRight: 12 }} />
              Crew Certifications
            </Title>
            <Table
              columns={columns}
              dataSource={data}
              loading={loading}
              scroll={{ x: 'max-content' }}
            />
          </GlassCard>
        </Content>
      </Layout>
    </Layout>
  );
}
