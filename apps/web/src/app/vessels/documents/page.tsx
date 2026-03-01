'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { api } from '@/lib/api';
import { FileTextOutlined, SafetyCertificateOutlined, UploadOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Layout,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Dragger } = Upload;

interface DocumentRow {
  id: string;
  title: string;
  type: string;
  vesselId: string;
  expiryDate?: string;
  status: string;
  uploadedAt?: string;
  fileName: string;
}

const statusColor: Record<string, string> = {
  VALID: 'success',
  EXPIRING: 'warning',
  EXPIRED: 'error',
  PENDING_REVIEW: 'processing',
};

export default function VesselDocumentsPage() {
  const [data, setData] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<{
    vesselId?: string;
    type?: string;
    status?: string;
    q?: string;
  }>({});
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [form] = Form.useForm();

  // Watch documentType to auto-fill and lock the name
  const selectedType = Form.useWatch('documentType', form);

  const typeMap: Record<string, string> = {
    R102: 'Registry Certificate (R102)',
    R106: 'Safe Manning (R106)',
    SHIPS_LIBRARY: "Ship's Library",
    RADIO_LICENSE: 'Radio License',
    CLASS_CERT: 'Classification Certificate',
  };

  const handleValuesChange = (changedValues: any) => {
    if (changedValues.documentType) {
      const newName = typeMap[changedValues.documentType];
      if (newName) {
        form.setFieldsValue({ name: newName });
      } else if (changedValues.documentType === 'OTHER') {
        form.setFieldsValue({ name: '' });
      }
    }
  };

  const isNameLocked = !!selectedType && selectedType !== 'OTHER';

  const columns = useMemo(
    () => [
      {
        title: 'Document',
        dataIndex: 'title',
        key: 'title',
        render: (text: string, record: DocumentRow) => (
          <Space direction="vertical" size={0}>
            <Text strong style={{ color: '#fff' }}>
              {text}
            </Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{record.fileName}</Text>
          </Space>
        ),
      },
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        render: (type: string) => <Text style={{ color: '#e6f7ff' }}>{type}</Text>,
      },
      {
        title: 'Expiry',
        dataIndex: 'expiryDate',
        key: 'expiryDate',
        render: (value?: string) => (
          <Text style={{ color: value ? '#fff' : 'rgba(255,255,255,0.25)' }}>
            {value ? dayjs(value).format('YYYY-MM-DD') : '—'}
          </Text>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => <Tag color={statusColor[status] || 'default'}>{status}</Tag>,
      },
    ],
    []
  );

  const loadData = async (nextPage = page, nextPageSize = pageSize, nextFilters = filters) => {
    setLoading(true);
    const res = await api.documents.list({
      vesselId: nextFilters.vesselId,
      type: nextFilters.type,
      status: nextFilters.status,
      q: nextFilters.q,
      page: nextPage,
      limit: nextPageSize,
    });

    if (res.error || !res.data) {
      message.error(res.error || 'Failed to load documents');
      setLoading(false);
      return;
    }

    setData(res.data.data || []);
    setTotal(res.data.total);
    setPage(res.data.page);
    setPageSize(res.data.limit);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTableChange = (pagination: any) => {
    loadData(pagination.current, pagination.pageSize);
  };

  const handleFilterChange = (key: keyof typeof filters, value?: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    loadData(1, pageSize, next);
  };

  const uploadProps = {
    multiple: false,
    fileList,
    beforeUpload: (file: any) => {
      setFileList([file]);
      return false; // prevent auto-upload
    },
    onRemove: () => setFileList([]),
  };

  const submitUpload = async () => {
    const values = await form.validateFields();
    if (!fileList.length) {
      message.error('Please select a file');
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append('file', fileList[0] as File);
    fd.append('name', values.name);
    fd.append('entityType', 'vessel');
    fd.append('entityId', values.vesselId);
    if (values.documentType) fd.append('documentType', values.documentType);
    if (values.expiryDate) fd.append('expiryDate', values.expiryDate.toISOString());
    if (values.metadata) fd.append('metadata', JSON.stringify(values.metadata));

    const res = await api.documents.upload(fd);
    setUploading(false);
    if (res.error) {
      message.error(res.error || 'Upload failed');
      return;
    }
    message.success('Document uploaded');
    setUploadOpen(false);
    setFileList([]);
    form.resetFields();
    loadData();
  };

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
                <FileTextOutlined style={{ marginRight: 12, color: '#1890ff' }} />
                Vessel Document Registry
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                Immutable storage for BMA R102-R106 certificates and ship&apos;s library.
              </Text>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                size="large"
                onClick={() => setUploadOpen(true)}
              >
                Upload Document
              </Button>
            </Col>
          </Row>

          <Card
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            headStyle={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Space style={{ marginBottom: 24 }} wrap>
              <Input.Search
                allowClear
                placeholder="Search title/type/description"
                onSearch={(v) => handleFilterChange('q', v || undefined)}
                style={{ width: 300 }}
              />
              <Select
                allowClear
                placeholder="Status"
                style={{ width: 180 }}
                onChange={(v) => handleFilterChange('status', v)}
                options={[
                  { label: 'Valid', value: 'VALID' },
                  { label: 'Expiring', value: 'EXPIRING' },
                  { label: 'Expired', value: 'EXPIRED' },
                  { label: 'Pending Review', value: 'PENDING_REVIEW' },
                ]}
              />
              <Tag color="blue" icon={<SafetyCertificateOutlined />}>
                AI EXTRACTION ENABLED
              </Tag>
            </Space>

            <Table
              rowKey="id"
              columns={columns}
              dataSource={data}
              loading={loading}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} documents`,
              }}
              onChange={handleTableChange}
              className="maritime-table"
            />
          </Card>

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
            .ant-input-search .ant-input,
            .ant-select-selector {
              background: rgba(255, 255, 255, 0.05) !important;
              border: 1px solid rgba(255, 255, 255, 0.1) !important;
              color: #fff !important;
            }
            .ant-input {
              background: transparent !important;
              color: #fff !important;
            }
          `}</style>
        </Content>
      </Layout>

      <Modal
        title="Upload Vessel Document"
        open={uploadOpen}
        onCancel={() => setUploadOpen(false)}
        onOk={submitUpload}
        confirmLoading={uploading}
        okText="Upload to Cloud"
        width={600}
        styles={{
          body: { background: '#0c2f4a', color: '#fff' },
          mask: { backdropFilter: 'blur(4px)' },
        }}
      >
        <Form 
          layout="vertical" 
          form={form} 
          initialValues={{ documentType: undefined }}
          onValuesChange={handleValuesChange}
        >
          <Form.Item
            name="name"
            label={<Text style={{ color: '#e6f7ff' }}>Document Name</Text>}
            rules={[{ required: true, message: 'Enter a document name' }]}
          >
            <Input 
              placeholder="e.g., Safe Manning Certificate" 
              readOnly={isNameLocked}
              style={isNameLocked ? { background: 'rgba(255,255,255,0.05)', cursor: 'not-allowed' } : {}}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="vesselId"
                label={<Text style={{ color: '#e6f7ff' }}>Vessel ID</Text>}
                rules={[{ required: true, message: 'Enter vessel id' }]}
              >
                <Input placeholder="Vessel UUID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="expiryDate"
                label={<Text style={{ color: '#e6f7ff' }}>Expiry Date</Text>}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="documentType"
            label={<Text style={{ color: '#e6f7ff' }}>Document Type</Text>}
          >
            <Select
              placeholder="Select category"
              options={[
                { label: 'Registry Certificate (R102)', value: 'R102' },
                { label: 'Safe Manning (R106)', value: 'R106' },
                { label: "Ship's Library", value: 'SHIPS_LIBRARY' },
                { label: 'Radio License', value: 'RADIO_LICENSE' },
                { label: 'Classification Certificate', value: 'CLASS_CERT' },
                { label: 'Other Regulatory', value: 'OTHER' },
              ]}
            />
          </Form.Item>

          <Form.Item label={<Text style={{ color: '#e6f7ff' }}>Document File (PDF)</Text>} required>
            <Dragger
              {...uploadProps}
              accept="application/pdf"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px dashed rgba(255,255,255,0.2)',
              }}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined style={{ color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text" style={{ color: '#fff' }}>
                Drop PDF or Click to Browse
              </p>
              <p className="ant-upload-hint" style={{ color: 'rgba(255,255,255,0.45)' }}>
                AI will automatically extract dates and document numbers for verification.
              </p>
            </Dragger>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
