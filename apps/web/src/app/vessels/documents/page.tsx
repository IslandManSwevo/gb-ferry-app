'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { api } from '@/lib/api';
import { FileTextOutlined, UploadOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Layout,
  Modal,
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
  VALID: 'green',
  EXPIRING: 'orange',
  EXPIRED: 'red',
  PENDING_REVIEW: 'blue',
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

  const columns = useMemo(
    () => [
      {
        title: 'Document',
        dataIndex: 'title',
        key: 'title',
        render: (text: string, record: DocumentRow) => (
          <Space direction="vertical" size={0}>
            <Text strong>{text}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.fileName}
            </Text>
          </Space>
        ),
      },
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
      },
      {
        title: 'Vessel ID',
        dataIndex: 'vesselId',
        key: 'vesselId',
      },
      {
        title: 'Expiry',
        dataIndex: 'expiryDate',
        key: 'expiryDate',
        render: (value?: string) => (value ? dayjs(value).format('YYYY-MM-DD') : '—'),
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
              <div>
                <Title level={3} style={{ margin: 0 }}>
                  <FileTextOutlined style={{ marginRight: 12 }} />
                  Vessel Documents
                </Title>
                <Text type="secondary">
                  Uploads run through server-side metadata extraction and are audited.
                </Text>
              </div>
              <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadOpen(true)}>
                Upload Document
              </Button>
            </div>

            <Space style={{ marginBottom: 16 }} wrap>
              <Input.Search
                allowClear
                placeholder="Search title/type/description"
                onSearch={(v) => handleFilterChange('q', v || undefined)}
                style={{ width: 260 }}
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
              <Input
                allowClear
                placeholder="Vessel ID"
                style={{ width: 200 }}
                onChange={(e) => handleFilterChange('vesselId', e.target.value || undefined)}
              />
            </Space>

            <Table
              rowKey="id"
              columns={columns}
              dataSource={data}
              loading={loading}
              pagination={{ current: page, pageSize, total, showSizeChanger: true }}
              onChange={handleTableChange}
            />
          </Card>
        </Content>
      </Layout>

      <Modal
        title="Upload vessel document"
        open={uploadOpen}
        onCancel={() => setUploadOpen(false)}
        onOk={submitUpload}
        confirmLoading={uploading}
        okText="Upload"
      >
        <Form layout="vertical" form={form} initialValues={{ documentType: undefined }}>
          <Form.Item
            name="name"
            label="Document name"
            rules={[{ required: true, message: 'Enter a document name' }]}
          >
            <Input placeholder="e.g., Safe Manning Certificate" />
          </Form.Item>
          <Form.Item
            name="vesselId"
            label="Vessel ID"
            rules={[{ required: true, message: 'Enter vessel id' }]}
          >
            <Input placeholder="UUID" />
          </Form.Item>
          <Form.Item name="documentType" label="Document type">
            <Input placeholder="Optional type override" />
          </Form.Item>
          <Form.Item name="expiryDate" label="Expiry date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="metadata" label="Metadata (JSON object)">
            <Input.TextArea
              placeholder='{"comment":"optional"}'
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>
          <Form.Item label="File" required>
            <Dragger {...uploadProps} accept="application/pdf">
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">Drop a PDF or click to browse</p>
              <p className="ant-upload-hint">Server will extract metadata and audit the upload.</p>
            </Dragger>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
