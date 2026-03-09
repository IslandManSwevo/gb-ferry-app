'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { GlassCard } from '@/components/ui/GlassCard';
import { api } from '@/lib/api';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  HistoryOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Descriptions,
  Empty,
  Form,
  Input,
  Layout,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useEffect, useState } from 'react';

const { Content } = Layout;
const { Title, Text } = Typography;

export default function VerificationQueuePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<any>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [docUrl, setDocUrl] = useState<string>('');
  const [verifying, setVerifying] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.certifications.getQueue();
      if (res.data) {
        setData(res.data);
      } else if (res.error) {
        message.error(res.error);
      }
    } catch (err) {
      message.error('Failed to load verification queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenVerify = async (record: any) => {
    setSelectedCert(record);
    setViewModalVisible(true);
    setDocUrl('');

    // Reset form with AI extracted values
    form.setFieldsValue({
      certificateNumber: record.aiExtractedCertNumber,
      expiryDate: record.aiExtractedExpiry ? record.aiExtractedExpiry.split('T')[0] : null,
      issuingAuthority: record.aiExtractedAuthority,
    });

    try {
      const res = await api.documents.getViewUrl(record.certificationId);
      if (res.data?.url) {
        setDocUrl(res.data.url);
      }
    } catch (err) {
      message.error('Failed to load document preview');
    }
  };

  const handleApprove = async () => {
    try {
      setVerifying(true);
      const values = await form.validateFields();
      const res = await api.certifications.verify(selectedCert.certificationId, values);

      if (res.error) {
        message.error(res.error);
      } else {
        message.success('Certification approved successfully');
        setViewModalVisible(false);
        fetchData();
      }
    } catch (err) {
      // Form validation failed or API error
    } finally {
      setVerifying(false);
    }
  };

  const handleReject = async () => {
    Modal.confirm({
      title: 'Reject Certification',
      content: (
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">
            Provide a reason for rejection. The document will be marked as REVOKED and a re-upload
            will be requested.
          </Text>
          <Input.TextArea
            placeholder="Reason for rejection (e.g. Blurry document, Incorrect type)..."
            id="rejection-reason"
            rows={4}
            style={{ marginTop: 12 }}
          />
        </div>
      ),
      okText: 'Confirm Rejection',
      okType: 'danger',
      onOk: async () => {
        const reason = (document.getElementById('rejection-reason') as HTMLTextAreaElement).value;
        if (!reason) {
          message.error('Rejection reason is required');
          return Promise.reject();
        }

        try {
          const res = await api.certifications.reject(selectedCert.certificationId, reason);
          if (res.error) {
            message.error(res.error);
          } else {
            message.success('Certification rejected');
            setViewModalVisible(false);
            fetchData();
          }
        } catch (err) {
          message.error('Failed to reject certification');
        }
      },
    });
  };

  const columns = [
    {
      title: 'Crew Member',
      dataIndex: 'crewName',
      key: 'crewName',
      render: (text: string, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: '#fff' }}>
            {text}
          </Text>
          <Text type="secondary" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>
            {record.crewRole} • {record.vesselName}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'certType',
      key: 'certType',
      render: (t: string) => (
        <Tag color="blue" style={{ background: 'rgba(24, 144, 255, 0.1)', borderColor: '#1890ff' }}>
          {t}
        </Tag>
      ),
    },
    {
      title: 'AI Confidence',
      dataIndex: 'aiConfidenceScore',
      key: 'aiConfidenceScore',
      render: (score: number) => {
        const color = score > 0.8 ? '#52c41a' : score > 0.5 ? '#faad14' : '#f5222d';
        return (
          <Space>
            <Badge color={color} />
            <Text style={{ color }}>{(score * 100).toFixed(0)}%</Text>
          </Space>
        );
      },
    },
    {
      title: 'Uploaded At',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      render: (d: string) => (
        <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px' }}>
          {new Date(d).toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'Renewal',
      dataIndex: 'isRenewal',
      key: 'isRenewal',
      render: (is: boolean) =>
        is ? (
          <Tag icon={<HistoryOutlined />} color="cyan">
            Renewal
          </Tag>
        ) : null,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          type="primary"
          size="small"
          ghost
          icon={<EyeOutlined />}
          onClick={() => handleOpenVerify(record)}
          style={{ background: 'rgba(24, 144, 255, 0.1)', border: '1px solid #1890ff' }}
        >
          Review
        </Button>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#0a1f33' }}>
      <AppSidebar />
      <Layout style={{ background: 'transparent' }}>
        <AppHeader />
        <Content style={{ margin: '24px', padding: '0' }}>
          <div style={{ marginBottom: 32 }}>
            <Title level={2} style={{ color: '#fff', margin: 0 }}>
              <SafetyCertificateOutlined style={{ marginRight: 12, color: '#1890ff' }} />
              Document Verification Queue
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.45)' }}>
              Human assessment required for AI-extracted maritime certifications.
            </Text>
          </div>

          <GlassCard>
            <Table
              columns={columns}
              dataSource={data}
              loading={loading}
              rowKey="certificationId"
              className="maritime-table"
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <Text style={{ color: 'rgba(255,255,255,0.45)' }}>
                        Verification queue is empty.
                      </Text>
                    }
                  />
                ),
              }}
            />
          </GlassCard>

          <Modal
            title={
              <Text style={{ color: '#fff', fontSize: '18px' }}>
                <EyeOutlined style={{ marginRight: 8 }} /> Verifying Certification
              </Text>
            }
            open={viewModalVisible}
            onCancel={() => setViewModalVisible(false)}
            width={1300}
            centered
            footer={[
              <Button key="reject" danger onClick={handleReject} icon={<CloseCircleOutlined />}>
                Reject Document
              </Button>,
              <Button
                key="back"
                onClick={() => setViewModalVisible(false)}
                style={{ background: 'transparent', color: 'rgba(255,255,255,0.65)' }}
              >
                Cancel
              </Button>,
              <Button
                key="submit"
                type="primary"
                loading={verifying}
                onClick={handleApprove}
                icon={<CheckCircleOutlined />}
              >
                Approve & Validate
              </Button>,
            ]}
            styles={{
              body: { padding: '0', background: '#0c2f4a' },
              header: {
                background: '#0a1f33',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                padding: '16px 24px',
              },
              footer: {
                background: '#0a1f33',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                padding: '16px 24px',
                margin: 0,
              },
            }}
          >
            <div style={{ display: 'flex', height: '75vh' }}>
              {/* Left: Document Viewer */}
              <div
                style={{
                  flex: 1,
                  background: '#000',
                  position: 'relative',
                  borderRight: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {docUrl ? (
                  docUrl.includes('pdf') || docUrl.includes('PDF') ? (
                    <iframe src={docUrl} width="100%" height="100%" style={{ border: 'none' }} />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 20,
                      }}
                    >
                      <img
                        src={docUrl}
                        alt="Document"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                          boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                        }}
                      />
                    </div>
                  )
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: 'rgba(255,255,255,0.2)',
                    }}
                  >
                    <EyeOutlined style={{ fontSize: 64, marginBottom: 16 }} />
                    <Text disabled>Requesting secure preview...</Text>
                  </div>
                )}
              </div>

              {/* Right: AI Data & Corrections */}
              <div
                style={{
                  width: 450,
                  overflowY: 'auto',
                  padding: '24px',
                  background: 'rgba(10, 31, 51, 0.4)',
                }}
              >
                <Title level={4} style={{ color: '#fff', marginBottom: 20 }}>
                  Extraction Review
                </Title>

                {selectedCert?.aiWarnings?.length > 0 && (
                  <Alert
                    type="warning"
                    showIcon
                    message="Extraction Warnings"
                    description={
                      <ul style={{ paddingLeft: 16, margin: 0, fontSize: '13px' }}>
                        {selectedCert.aiWarnings.map((w: string, i: number) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    }
                    style={{
                      marginBottom: 24,
                      background: 'rgba(250, 173, 20, 0.05)',
                      border: '1px solid rgba(250, 173, 20, 0.2)',
                    }}
                  />
                )}

                <Form form={form} layout="vertical" requiredMark={false}>
                  <Form.Item
                    label={
                      <Text style={{ color: 'rgba(255,255,255,0.65)' }}>Certificate Number</Text>
                    }
                    name="certificateNumber"
                    rules={[{ required: true }]}
                  >
                    <Input
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    />
                  </Form.Item>
                  <Form.Item
                    label={<Text style={{ color: 'rgba(255,255,255,0.65)' }}>Expiry Date</Text>}
                    name="expiryDate"
                    rules={[{ required: true }]}
                  >
                    <Input
                      type="date"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    />
                  </Form.Item>
                  <Form.Item
                    label={
                      <Text style={{ color: 'rgba(255,255,255,0.65)' }}>Issuing Authority</Text>
                    }
                    name="issuingAuthority"
                    rules={[{ required: true }]}
                  >
                    <Input
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    />
                  </Form.Item>

                  <div
                    style={{
                      marginTop: 32,
                      padding: '20px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <Descriptions column={1} size="small" colon={false}>
                      <Descriptions.Item label={<Text type="secondary">Crew Member</Text>}>
                        <Text style={{ color: '#fff' }}>{selectedCert?.crewName}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label={<Text type="secondary">Role</Text>}>
                        <Text style={{ color: '#fff' }}>{selectedCert?.crewRole}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label={<Text type="secondary">Type</Text>}>
                        <Tag color="blue">{selectedCert?.certType}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label={<Text type="secondary">AI Confidence</Text>}>
                        <Tag color={selectedCert?.aiConfidenceScore > 0.8 ? 'success' : 'warning'}>
                          {(selectedCert?.aiConfidenceScore * 100).toFixed(1)}%
                        </Tag>
                      </Descriptions.Item>
                      {selectedCert?.isRenewal && (
                        <Descriptions.Item label={<Text type="secondary">Renewal</Text>}>
                          <Tag color="cyan">REPLACES PREVIOUS</Tag>
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </div>
                </Form>
              </div>
            </div>
          </Modal>

          <style jsx global>{`
            .maritime-table .ant-table {
              background: transparent !important;
              color: #fff !important;
            }
            .maritime-table .ant-table-thead > tr > th {
              background: rgba(255, 255, 255, 0.03) !important;
              color: rgba(255, 255, 255, 0.45) !important;
              border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .maritime-table .ant-table-tbody > tr > td {
              border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
            }
            .maritime-table .ant-table-tbody > tr:hover > td {
              background: rgba(255, 255, 255, 0.02) !important;
            }

            .ant-btn-primary.ant-btn-background-ghost {
              background: rgba(24, 144, 255, 0.1) !important;
            }
            .ant-modal-content {
              background: #0a1f33 !important;
              padding: 0 !important;
              overflow: hidden;
              border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .ant-modal-header {
              background: #0a1f33 !important;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
              margin-bottom: 0 !important;
            }
            .ant-modal-title {
              color: #fff !important;
            }
            .ant-descriptions-item-label {
              color: rgba(255, 255, 255, 0.45) !important;
              padding-bottom: 8px !important;
            }
            .ant-descriptions-item-content {
              color: #fff !important;
              padding-bottom: 8px !important;
            }
          `}</style>
        </Content>
      </Layout>
    </Layout>
  );
}
