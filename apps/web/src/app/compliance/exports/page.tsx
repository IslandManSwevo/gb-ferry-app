'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { api } from '@/lib/api';
import {
  CheckCircleOutlined,
  DownloadOutlined,
  ExportOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  LoadingOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Empty,
  Layout,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

interface Vessel {
  id: string;
  name: string;
  imoNumber?: string;
}

export default function ExportCenterPage() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [selectedVessel, setSelectedVessel] = useState<string | undefined>();
  const [loadingVessels, setLoadingVessels] = useState(true);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const [recentExports, setRecentExports] = useState<
    Array<{ vesselName: string; format: string; timestamp: string }>
  >([]);

  const fetchVessels = useCallback(async () => {
    setLoadingVessels(true);
    const { data, error } = await api.vessels.list({ pageSize: 100 });
    if (error) {
      message.error('Failed to load vessels');
    } else if (data) {
      setVessels(data.items || []);
      if (data.items?.length > 0) {
        setSelectedVessel(data.items[0].id);
      }
    }
    setLoadingVessels(false);
  }, []);

  useEffect(() => {
    fetchVessels();
  }, [fetchVessels]);

  const handleExport = async (format: 'csv' | 'json') => {
    if (!selectedVessel) {
      message.warning('Please select a vessel');
      return;
    }

    setExportingFormat(format);
    try {
      const { data, error } = await api.compliance.exportCrewCompliance(selectedVessel, format);
      if (error) {
        message.error('Export failed: ' + error);
        setExportingFormat(null);
        return;
      }

      // Trigger browser download
      if (data) {
        const blob = data instanceof Blob ? data : new Blob([data as any]);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const vessel = vessels.find((v) => v.id === selectedVessel);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.href = url;
        link.download = `crew-compliance-${vessel?.name?.replace(/\s+/g, '_') || selectedVessel}-${timestamp}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Track export history
        setRecentExports((prev) => [
          {
            vesselName: vessel?.name || selectedVessel,
            format: format.toUpperCase(),
            timestamp: new Date().toLocaleTimeString(),
          },
          ...prev.slice(0, 4),
        ]);
        message.success(`${format.toUpperCase()} export downloaded successfully`);
      }
    } catch (err) {
      message.error('Export failed');
    }
    setExportingFormat(null);
  };

  const exportTypes = [
    {
      key: 'crew-compliance',
      title: 'Crew Compliance Pack',
      description:
        'Full crew roster with certification status, safe manning validation, and medical certificate compliance. Suitable for regulatory submission.',
      icon: <TeamOutlined style={{ fontSize: 36, color: '#1890ff' }} />,
      formats: ['json', 'csv'] as const,
      regulatory: 'BMA R106 / STCW',
    },
    {
      key: 'cbp-crew-list',
      title: 'CBP Crew List (I-418)',
      description:
        'Crew data formatted for US Customs and Border Protection Form I-418 submission via the ACE portal.',
      icon: <FileTextOutlined style={{ fontSize: 36, color: '#722ed1' }} />,
      formats: ['json'] as const,
      regulatory: 'CBP / APIS',
      comingSoon: true,
    },
    {
      key: 'audit-trail',
      title: 'Compliance Audit Trail',
      description:
        'Complete audit log export for Port State Control inspections and ISO 27001 evidence collection.',
      icon: <SafetyCertificateOutlined style={{ fontSize: 36, color: '#13c2c2' }} />,
      formats: ['csv'] as const,
      regulatory: 'ISO 27001 / PSC',
      comingSoon: true,
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
          {/* Header */}
          <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
            <Col>
              <Title level={2} style={{ color: '#fff', margin: 0 }}>
                <ExportOutlined style={{ marginRight: 12 }} />
                Export Center
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                Generate regulatory-compliant exports for BMA, CBP, and audit purposes
              </Text>
            </Col>
          </Row>

          {/* Vessel Selector */}
          <Card
            style={{
              marginBottom: 24,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            bodyStyle={{ padding: 16 }}
          >
            <Space size="middle" align="center">
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                Target Vessel:
              </Text>
              {loadingVessels ? (
                <Spin indicator={<LoadingOutlined />} />
              ) : (
                <Select
                  value={selectedVessel}
                  onChange={setSelectedVessel}
                  style={{ width: 320 }}
                  placeholder="Select a vessel"
                  options={vessels.map((v) => ({
                    value: v.id,
                    label: `${v.name}${v.imoNumber ? ` (IMO: ${v.imoNumber})` : ''}`,
                  }))}
                />
              )}
              {selectedVessel && (
                <Tag color="blue">
                  {vessels.find((v) => v.id === selectedVessel)?.name || 'Selected'}
                </Tag>
              )}
            </Space>
          </Card>

          {/* Export Cards */}
          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            {exportTypes.map((type) => (
              <Col xs={24} md={8} key={type.key}>
                <Card
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    height: '100%',
                    transition: 'border-color 0.3s',
                  }}
                  hoverable
                  bodyStyle={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    padding: 24,
                  }}
                >
                  <Space align="start" size="large" style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 12,
                        background: 'rgba(24, 144, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {type.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <Title level={5} style={{ color: '#e6f7ff', margin: 0 }}>
                        {type.title}
                      </Title>
                      <Tag
                        style={{
                          marginTop: 4,
                          fontSize: 10,
                          border: 'none',
                          background: 'rgba(24, 144, 255, 0.15)',
                          color: '#69b1ff',
                        }}
                      >
                        {type.regulatory}
                      </Tag>
                    </div>
                  </Space>

                  <Paragraph
                    style={{
                      color: 'rgba(255,255,255,0.55)',
                      fontSize: 13,
                      flex: 1,
                      marginBottom: 16,
                    }}
                  >
                    {type.description}
                  </Paragraph>

                  {type.comingSoon ? (
                    <Tag
                      style={{
                        textAlign: 'center',
                        padding: '6px 0',
                        width: '100%',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px dashed rgba(255,255,255,0.15)',
                        color: 'rgba(255,255,255,0.45)',
                      }}
                    >
                      Coming in Phase 3
                    </Tag>
                  ) : (
                    <Space size="middle">
                      {type.formats.map((format) => (
                        <Button
                          key={format}
                          type={format === 'json' ? 'primary' : 'default'}
                          icon={
                            exportingFormat === format ? (
                              <LoadingOutlined />
                            ) : format === 'csv' ? (
                              <FileExcelOutlined />
                            ) : (
                              <DownloadOutlined />
                            )
                          }
                          onClick={() => handleExport(format as 'csv' | 'json')}
                          loading={exportingFormat === format}
                          disabled={!selectedVessel || exportingFormat !== null}
                        >
                          {format.toUpperCase()}
                        </Button>
                      ))}
                    </Space>
                  )}
                </Card>
              </Col>
            ))}
          </Row>

          {/* Recent Exports */}
          <Card
            title={
              <Text style={{ color: '#e6f7ff' }}>
                <CheckCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                Recent Exports (This Session)
              </Text>
            }
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            headStyle={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            {recentExports.length === 0 ? (
              <Empty
                description={
                  <Text style={{ color: 'rgba(255,255,255,0.35)' }}>
                    No exports yet. Select a vessel above and choose a format to begin.
                  </Text>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                {recentExports.map((exp, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 6,
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <Space>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                        {exp.vesselName} — Crew Compliance Pack
                      </Text>
                      <Tag color="blue">{exp.format}</Tag>
                    </Space>
                    <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                      {exp.timestamp}
                    </Text>
                  </div>
                ))}
              </Space>
            )}
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}
