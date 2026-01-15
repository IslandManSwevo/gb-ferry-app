'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { GlassCard } from '@/components/ui/GlassCard';
import { api } from '@/lib/api/client';
import { useCanAccess } from '@/lib/auth/roles';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Layout,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';

const { Content } = Layout;
const { Title } = Typography;
const { TextArea } = Input;

const columns = [
  {
    title: 'Inspection ID',
    dataIndex: 'id',
    key: 'id',
    render: (text: string) => <a>{text}</a>,
  },
  {
    title: 'Vessel',
    dataIndex: 'vesselId',
    key: 'vesselId',
    render: (vesselId: string, record: any) => record.vessel?.name || vesselId || 'N/A',
  },
  {
    title: 'Authority',
    dataIndex: 'authority',
    key: 'authority',
  },
  {
    title: 'Date',
    dataIndex: 'inspectionDate',
    key: 'inspectionDate',
    render: (date: string) => (date ? new Date(date).toLocaleDateString() : 'N/A'),
  },
  {
    title: 'Result',
    dataIndex: 'result',
    key: 'result',
    render: (result: string) => {
      if (result === 'PASSED' || result === 'Passed') {
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Passed
          </Tag>
        );
      }
      if (result === 'PASSED_WITH_OBSERVATIONS' || result === 'Passed with Observations') {
        return (
          <Tag icon={<CheckCircleOutlined />} color="warning">
            Passed (Obs)
          </Tag>
        );
      }
      return (
        <Tag icon={<CloseCircleOutlined />} color="error">
          Failed
        </Tag>
      );
    },
  },
  {
    title: 'Deficiencies',
    dataIndex: 'deficienciesCount',
    key: 'deficienciesCount',
    render: (count: number) => count || 0,
  },
  {
    title: 'Action',
    key: 'action',
    render: () => (
      <Space size="small">
        <Button type="link" size="small">
          View Report
        </Button>
      </Space>
    ),
  },
];

export default function InspectionsPage() {
  const canAccessPage = useCanAccess('inspections.manage');
  const [inspections, setInspections] = useState<any[]>([]);
  const [vessels, setVessels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchInspections = useCallback(async () => {
    setLoading(true);
    const { data, error } = await api.inspections.list();

    if (error) {
      message.error('Failed to load inspections');
      setInspections([]);
    } else {
      setInspections(data || []);
    }

    setLoading(false);
  }, []);

  const fetchVessels = useCallback(async () => {
    const { data, error } = await api.vessels.list();

    if (error) {
      message.error('Failed to load vessels');
    } else {
      setVessels(data?.items || []);
    }
  }, []);

  useEffect(() => {
    fetchInspections();
    fetchVessels();
  }, [fetchInspections, fetchVessels]);

  if (!canAccessPage) {
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
                  <SafetyOutlined style={{ fontSize: 40, color: '#ff4d4f' }} />
                </div>
                <div>
                  <Title level={3} style={{ color: '#fff', marginBottom: 8 }}>
                    Compliance Access Restricted
                  </Title>
                  <Typography.Text style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Recording and managing vessel inspections requires regulatory-level clearance.
                    Please authenticate with a Compliance Officer or Admin role to proceed.
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

  const handleSubmit = async (values: any) => {
    setSubmitting(true);

    const payload = {
      vesselId: values.vesselId,
      authority: values.authority,
      inspectionDate: values.inspectionDate.format('YYYY-MM-DD'),
      result: values.result,
      deficienciesCount: values.deficienciesCount || 0,
      notes: values.notes,
    };

    const { error } = await api.inspections.create(payload);

    setSubmitting(false);

    if (error) {
      message.error(`Failed to record inspection: ${error}`);
    } else {
      message.success('Inspection recorded successfully');
      setIsModalOpen(false);
      form.resetFields();
      await fetchInspections();
    }
  };

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
              <Title level={3} style={{ margin: 0 }}>
                <SafetyOutlined style={{ marginRight: 12 }} />
                Port State Control Inspections
              </Title>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
                Record Inspection
              </Button>
            </div>
            <Table
              columns={columns}
              dataSource={inspections.map((i, idx) => ({ ...i, key: i.id || idx }))}
              loading={loading}
            />
          </Card>
        </Content>
      </Layout>

      <Modal
        title="Record Port State Control Inspection"
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        confirmLoading={submitting}
        okText="Record Inspection"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            inspectionDate: dayjs(),
            deficienciesCount: 0,
          }}
        >
          <Form.Item
            name="vesselId"
            label="Vessel"
            rules={[{ required: true, message: 'Please select a vessel' }]}
          >
            <Select
              placeholder="Select vessel"
              options={vessels.map((v) => ({
                value: v.id,
                label: `${v.name} (${v.imoNumber || 'No IMO'})`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="authority"
            label="Inspection Authority"
            rules={[{ required: true, message: 'Please select authority' }]}
          >
            <Select placeholder="Select authority">
              <Select.Option value="Bahamas Maritime Authority">
                Bahamas Maritime Authority
              </Select.Option>
              <Select.Option value="US Coast Guard">US Coast Guard (USCG)</Select.Option>
              <Select.Option value="Transport Canada">Transport Canada</Select.Option>
              <Select.Option value="UK Maritime & Coastguard Agency">
                UK Maritime & Coastguard Agency
              </Select.Option>
              <Select.Option value="Paris MOU">Paris MOU</Select.Option>
              <Select.Option value="Tokyo MOU">Tokyo MOU</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="inspectionDate"
            label="Inspection Date"
            rules={[{ required: true, message: 'Please select date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="result"
            label="Inspection Result"
            rules={[{ required: true, message: 'Please select result' }]}
          >
            <Select placeholder="Select result">
              <Select.Option value="PASSED">Passed</Select.Option>
              <Select.Option value="PASSED_WITH_OBSERVATIONS">
                Passed with Observations
              </Select.Option>
              <Select.Option value="FAILED">Failed</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="deficienciesCount"
            label="Number of Deficiencies"
            rules={[{ required: true, message: 'Please enter deficiencies count' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="notes" label="Notes / Observations">
            <TextArea
              rows={4}
              placeholder="Enter any observations, deficiencies, or corrective actions required..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
