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
      dataIndex: 'crewMember',
      key: 'crewName',
      render: (crew: any) => (
        <Space>
          <Avatar src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${crew?.familyName}`} />
          <Text strong style={{ color: '#e6f7ff' }}>{crew?.givenNames} {crew?.familyName}</Text>
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
      render: (t: string) => <Text style={{ fontFamily: 'monospace', color: '#fff' }}>{t}</Text>,
    },
    {
      title: 'Issuing Authority',
      dataIndex: 'issuingAuthority',
      key: 'issuingAuthority',
      responsive: ['md'] as any,
      render: (t: string) => <Text style={{ color: 'rgba(255,255,255,0.65)' }}>{t}</Text>,
    },
    {
      title: 'Expiry Date',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date: string) => {
        const d = new Date(date);
        const isExpiring = d.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
        return <Text style={{ color: isExpiring ? '#ff4d4f' : '#fff' }}>{d.toLocaleDateString()}</Text>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string, record: any) => {
        const d = new Date(record.expiryDate);
        const isExpired = d.getTime() < Date.now();
        const isExpiring = d.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
        const status = isExpired ? 'critical' : isExpiring ? 'warning' : 'ok';
        const label = isExpired ? 'EXPIRED' : isExpiring ? 'EXPIRING' : 'VALID';
        return <StatusBadge status={status} label={label} compact />;
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: () => (
        <Button
          type="link"
          icon={<SafetyCertificateOutlined />}
          style={{ color: '#1890ff' }}
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
        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: 'linear-gradient(135deg, #0a1f33 0%, #0c2f4a 45%, #0b3a5d 100%)',
            minHeight: 'calc(100vh - 64px - 48px)',
          }}
        >
          {(expiringCount > 0 || expiredCount > 0) && (
            <Alert
              message="Certification Alerts"
              description={`${expiredCount} expired and ${expiringCount} expiring soon. Immediate action required.`}
              type="warning"
              icon={<WarningOutlined />}
              showIcon
              style={{
                marginBottom: 24,
                background: 'rgba(250, 173, 20, 0.1)',
                border: '1px solid #faad14',
              }}
            />
          )}
          <GlassCard>
            <Title level={3} style={{ marginBottom: 24, color: '#fff' }}>
              <SafetyCertificateOutlined style={{ marginRight: 12, color: '#1890ff' }} />
              Crew Certifications
            </Title>
            <Table
              columns={columns}
              dataSource={data}
              loading={loading}
              scroll={{ x: 'max-content' }}
              className="maritime-table"
              rowKey="id"
            />
          </GlassCard>

          <style jsx global>{`
            .maritime-table .ant-table {
              background: transparent !important;
              color: #e6f7ff !important;
            }
            .maritime-table .ant-table-thead > tr > th {
              background: rgba(255, 255, 255, 0.05) !important;
              color: rgba(255, 255, 255, 0.85) !important;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
            }
            .maritime-table .ant-table-tbody > tr > td {
              border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
            }
            .maritime-table .ant-table-tbody > tr:hover > td {
              background: rgba(255, 255, 255, 0.02) !important;
            }
          `}</style>
        </Content>
      </Layout>
    </Layout>
  );
}
