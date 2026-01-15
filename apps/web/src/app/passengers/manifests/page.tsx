'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { GlassCard } from '@/components/ui/GlassCard';
import { api } from '@/lib/api/client';
import { useCanAccess } from '@/lib/auth/roles';
import { DownloadOutlined, FileProtectOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Layout, message, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';

const { Content } = Layout;
const { Title } = Typography;

const columns = [
  {
    title: 'Manifest ID',
    dataIndex: 'id',
    key: 'id',
    render: (text: string) => <a>{text}</a>,
  },
  {
    title: 'Sailing',
    dataIndex: 'sailing',
    key: 'sailing',
    render: (_: any, record: any) =>
      `${record.sailing?.departurePort || 'N/A'} → ${record.sailing?.arrivalPort || 'N/A'}`,
  },
  {
    title: 'Date',
    dataIndex: 'sailingDate',
    key: 'sailingDate',
    render: (date: string) => new Date(date).toLocaleDateString(),
  },
  {
    title: 'Passengers',
    dataIndex: 'passengerCount',
    key: 'passengerCount',
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => {
      const colors: Record<string, string> = {
        APPROVED: 'green',
        DRAFT: 'orange',
        SUBMITTED: 'blue',
        REJECTED: 'red',
      };
      return <Tag color={colors[status?.toUpperCase()] || 'default'}>{status}</Tag>;
    },
  },
  {
    title: 'Action',
    key: 'action',
    render: (_: any, record: any) => (
      <Space size="small">
        <Button type="link" size="small">
          View
        </Button>
        {record.status === 'DRAFT' && (
          <Button type="link" size="small">
            Approve
          </Button>
        )}
        {record.status === 'APPROVED' && (
          <Button type="link" size="small" icon={<DownloadOutlined />}>
            Export
          </Button>
        )}
      </Space>
    ),
  },
];

export default function ManifestsPage() {
  const canViewManifests = useCanAccess('passengers.view');
  const canGenerateManifest = useCanAccess('manifests.generate');
  const [manifests, setManifests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sailings, setSailings] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSailing, setSelectedSailing] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const loadManifests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await api.manifests.list();

    if (error) {
      message.error('Failed to load manifests');
      setManifests([]);
    } else {
      setManifests(data?.items || []);
    }

    setLoading(false);
  }, []);

  const loadSailings = useCallback(async () => {
    const { data, error } = await api.passengers.sailings();

    if (error) {
      message.error('Failed to load sailings');
    } else {
      setSailings(data || []);
    }
  }, []);

  useEffect(() => {
    loadManifests();
    loadSailings();
  }, [loadManifests, loadSailings]);

  const handleGenerateManifest = async () => {
    if (!selectedSailing) {
      message.error('Please select a sailing');
      return;
    }

    const sailing = sailings.find((s) => s.id === selectedSailing);
    if (!sailing) {
      message.error('Selected sailing not found');
      return;
    }

    setGenerating(true);

    const { data, error } = await api.manifests.generate({
      sailingId: selectedSailing,
      sailingDate: sailing.departureTime,
    });

    setGenerating(false);

    if (error) {
      message.error(`Failed to generate manifest: ${error}`);
    } else {
      message.success(`Manifest generated successfully: ${data.id}`);
      setLoading(false);
      setIsModalOpen(false);
      setSelectedSailing(null);
      await loadManifests();
    }
  };

  useEffect(() => {
    loadManifests();
  }, [loadManifests]);

  if (!canViewManifests) {
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GlassCard style={{ maxWidth: 600, padding: 40, textAlign: 'center' }}>
              <Space direction="vertical" size="large">
                <div
                  style={{
                    width: 80,
                    height: 80,
                    background: 'rgba(255, 77, 79, 0.1)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                  }}
                >
                  <FileProtectOutlined style={{ fontSize: 40, color: '#ff4d4f' }} />
                </div>
                <div>
                  <Title level={3} style={{ color: '#fff', marginBottom: 8 }}>
                    Voyage Data Restricted
                  </Title>
                  <Typography.Text style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Regulatory voyage manifests contain sensitive passenger data and are restricted
                    to authorized operational and compliance staff only.
                  </Typography.Text>
                </div>
                <Button type="primary" size="large" onClick={() => window.history.back()}>
                  Return to Dashboard
                </Button>
              </Space>
            </GlassCard>
          </Content>
        </Layout>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar />
      <Layout>
        <AppHeader />
        <Content style={{ margin: '24px', padding: '24px', background: '#f0f2f5' }}>
          <Card>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <Title level={2} style={{ color: '#fff', margin: 0 }}>
                  Voyage Manifests
                </Title>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsModalOpen(true)}
                  disabled={!canGenerateManifest}
                >
                  Generate Manifest
                </Button>
              </div>
            </div>
            <Table
              columns={columns}
              dataSource={manifests.map((m, idx) => ({ ...m, key: m.id || idx }))}
              loading={loading}
            />
          </Card>
        </Content>
      </Layout>

      <Modal
        title="Generate Passenger Manifest"
        open={isModalOpen}
        onOk={handleGenerateManifest}
        onCancel={() => {
          setIsModalOpen(false);
          setSelectedSailing(null);
        }}
        confirmLoading={generating}
        okText="Generate"
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Select Sailing:
          </label>
          <Select
            style={{ width: '100%' }}
            placeholder="Choose a sailing to generate manifest for"
            value={selectedSailing}
            onChange={setSelectedSailing}
            options={sailings.map((s) => ({
              value: s.id,
              label: `${s.departurePort} → ${s.arrivalPort} (${new Date(s.departureTime).toLocaleString()})`,
            }))}
          />
        </div>
        <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: 4, fontSize: 13 }}>
          <strong>Note:</strong> This will generate a draft manifest from all checked-in passengers
          for the selected sailing.
        </div>
      </Modal>
    </Layout>
  );
}
