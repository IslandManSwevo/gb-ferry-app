'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { api } from '@/lib/api';
import { useCanAccess } from '@/lib/auth/roles';
import {
  CloudUploadOutlined,
  FileProtectOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Layout,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useState } from 'react';
import useSWR from 'swr';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

export default function CBPCompliancePage() {
  const canSubmit = useCanAccess('cbp.submit');
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null);
  const [formType, setFormType] = useState<'I_418' | 'eNOAD'>('I_418');
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { data: vesselData } = useSWR('vessels', () =>
    api.vessels.list({ pageSize: 100 }).then((r) => r.data?.items ?? [])
  );
  const vessels = vesselData ?? [];

  const { data: submissions = [], mutate: mutateSubmissions } = useSWR(
    'cbp/submissions',
    () => api.cbp.submissions().then((r) => r.data || [])
  );

  const handleSubmit = async () => {
    if (!selectedVessel) {
      message.error('Please select a vessel');
      return;
    }

    setLoading(true);
    const { data, error } = await api.cbp.submitCrewList(selectedVessel, formType);
    setLoading(false);

    if (error) {
      message.error(`Submission failed: ${error}`);
    } else {
      message.success(`Successfully submitted ${formType} (ID: ${data.submissionId})`);
      setIsModalVisible(false);
      void mutateSubmissions();
    }
  };

  const submissionColumns = [
    {
      title: 'Vessel',
      dataIndex: ['vessel', 'name'],
      key: 'vessel',
      render: (text: string) => <Text style={{ color: '#e6f7ff' }}>{text}</Text>,
    },
    {
      title: 'Form Type',
      dataIndex: 'formType',
      key: 'formType',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'SUBMITTED' ? 'success' : 'error'}>{status}</Tag>
      ),
    },
    {
      title: 'Transmission ID',
      dataIndex: 'transmissionId',
      key: 'transmissionId',
      render: (id: string) => <code style={{ color: '#fff' }}>{id}</code>,
    },
    {
      title: 'Submitted At',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date: string) => (
        <Text style={{ color: 'rgba(255,255,255,0.65)' }}>{new Date(date).toLocaleString()}</Text>
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
          <Row justify="space-between" align="middle" style={{ marginBottom: 32 }}>
            <Col>
              <Title level={2} style={{ color: '#fff', margin: 0 }}>
                <FileProtectOutlined style={{ marginRight: 12, color: '#1890ff' }} />
                US CBP Regulatory Reporting
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                Electronic Notice of Arrival/Departure (eNOAD) & Form I-418 Crew Manifest
                submissions.
              </Text>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<CloudUploadOutlined />}
                size="large"
                disabled={!canSubmit}
                onClick={() => setIsModalVisible(true)}
              >
                New Submission
              </Button>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Card
                title={
                  <Space>
                    <HistoryOutlined style={{ color: '#1890ff' }} />
                    <Text style={{ color: '#e6f7ff' }}>Recent Submissions</Text>
                  </Space>
                }
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                headStyle={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Table
                  dataSource={submissions}
                  columns={submissionColumns}
                  pagination={{ pageSize: 5 }}
                  rowKey="id"
                  className="maritime-table"
                />
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                title={
                  <Space>
                    <InfoCircleOutlined style={{ color: '#faad14' }} />
                    <Text style={{ color: '#e6f7ff' }}>CBP Filing Requirements</Text>
                  </Space>
                }
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                headStyle={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Space direction="vertical" size="middle">
                  <Alert
                    message="Submission Deadlines"
                    description="eNOAD must be submitted at least 96 hours before arrival in US ports (or before departure if voyage is < 96 hours)."
                    type="warning"
                    showIcon
                    style={{ background: 'rgba(250, 173, 20, 0.1)', border: 'none' }}
                  />
                  <Paragraph style={{ color: 'rgba(255,255,255,0.65)' }}>
                    All crew members must have valid Travel Documents (Passport/Seafarer ID) and
                    Visa information (if applicable) present in their profile for a successful
                    transmission.
                  </Paragraph>
                  <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <SafetyCertificateOutlined style={{ color: '#52c41a' }} />
                    <Text style={{ color: '#e6f7ff' }}>AES-256 PII Encryption Active</Text>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>

          <Modal
            title="Submit Regulatory Crew List"
            open={isModalVisible}
            onOk={handleSubmit}
            onCancel={() => setIsModalVisible(false)}
            confirmLoading={loading}
            okText="Submit to CBP ACE"
            width={600}
            styles={{
              body: { background: '#0c2f4a', color: '#fff' },
              mask: { backdropFilter: 'blur(4px)' },
            }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%', marginTop: 16 }}>
              <div>
                <Text
                  style={{ color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 8 }}
                >
                  SELECT VESSEL
                </Text>
                <Select
                  placeholder="Choose vessel..."
                  style={{ width: '100%' }}
                  onChange={setSelectedVessel}
                  options={vessels.map((v) => ({ label: v.name, value: v.id }))}
                />
              </div>

              <div>
                <Text
                  style={{ color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 8 }}
                >
                  FILING TYPE
                </Text>
                <Radio.Group
                  onChange={(e) => setFormType(e.target.value)}
                  value={formType}
                  buttonStyle="solid"
                >
                  <Radio.Button value="I_418">Form I-418 (Crew List)</Radio.Button>
                  <Radio.Button value="eNOAD">eNOA/D (Notice of Arrival)</Radio.Button>
                </Radio.Group>
              </div>

              <Alert
                message="Data Validation"
                description="The system will automatically validate STCW certificates and safe manning compliance before transmission."
                type="info"
                showIcon
              />
            </Space>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
}
