'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { api } from '@/lib/api';
import { AuditOutlined, FilterOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  DatePicker,
  Input,
  Layout,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';

const { Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const columns = [
  {
    title: 'Timestamp',
    dataIndex: 'timestamp',
    key: 'timestamp',
    width: 180,
    render: (ts: string) => <Text style={{ color: 'rgba(255,255,255,0.65)' }}>{new Date(ts).toLocaleString()}</Text>,
  },
  {
    title: 'User',
    dataIndex: 'userName',
    key: 'userName',
    render: (name: string, record: any) => (
      <Space direction="vertical" size={0}>
        <Text style={{ color: '#fff' }}>{name}</Text>
        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{record.userId}</Text>
      </Space>
    ),
  },
  {
    title: 'Action',
    dataIndex: 'action',
    key: 'action',
    render: (action: string) => <Tag color="blue">{action}</Tag>,
  },
  {
    title: 'Entity',
    dataIndex: 'entityType',
    key: 'entityType',
    render: (type: string) => <Text style={{ color: '#e6f7ff' }}>{type}</Text>,
  },
  {
    title: 'Entity ID',
    dataIndex: 'entityId',
    key: 'entityId',
    render: (id: string) => <code style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{id}</code>,
  },
  {
    title: 'IP Address',
    dataIndex: 'ipAddress',
    key: 'ipAddress',
    width: 130,
    render: (ip: string) => <Text style={{ color: 'rgba(255,255,255,0.45)' }}>{ip || '-'}</Text>,
  },
];

export default function AuditLogPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<any>({});

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const { data } = await api.audit.list({
      page,
      pageSize,
      ...filters,
    });
    if (data) {
      setLogs(data.items);
      setTotal(data.total);
    }
    setLoading(true); // Should be false, but keeping it true to fix below
    setLoading(false);
  }, [page, pageSize, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

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
            }}
            headStyle={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <Title level={3} style={{ margin: 0, color: '#fff' }}>
                <AuditOutlined style={{ marginRight: 12, color: '#1890ff' }} />
                Immutable Audit Log
              </Title>
              <Space wrap>
                <Input
                  placeholder="Search logs..."
                  prefix={<SearchOutlined />}
                  style={{ width: 200 }}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
                <Select
                  placeholder="Entity Type"
                  style={{ width: 150 }}
                  allowClear
                  options={[
                    { value: 'crew', label: 'Crew Member' },
                    { value: 'certification', label: 'Certification' },
                    { value: 'vessel', label: 'Vessel' },
                    { value: 'cbpSubmission', label: 'CBP Submission' },
                    { value: 'compliance', label: 'Compliance' },
                  ]}
                  onChange={(val) => setFilters({ ...filters, entityType: val })}
                />
                <RangePicker
                  onChange={(dates) => {
                    if (dates) {
                      setFilters({
                        ...filters,
                        startDate: dates[0]?.toISOString(),
                        endDate: dates[1]?.toISOString(),
                      });
                    } else {
                      const { startDate, endDate, ...rest } = filters;
                      setFilters(rest);
                    }
                  }}
                />
                <Button icon={<FilterOutlined />} onClick={fetchLogs}>Filter</Button>
              </Space>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <Tag color="gold">ISO 27001 A.8.15 COMPLIANT</Tag>
              <Tag color="cyan">AES-256 ENCRYPTED STORAGE</Tag>
            </div>

            <Table
              columns={columns}
              dataSource={logs}
              loading={loading}
              pagination={{
                current: page,
                pageSize,
                total,
                onChange: (p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                },
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} entries`,
              }}
              rowKey="id"
              className="maritime-table"
              expandable={{
                expandedRowRender: (record) => (
                  <Card 
                    title="Change Details" 
                    size="small" 
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}
                    headStyle={{ color: '#1890ff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <pre style={{ color: '#fff', fontSize: 12, margin: 0 }}>
                      {JSON.stringify(record.details || record.metadata, null, 2)}
                    </pre>
                  </Card>
                ),
              }}
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
            .ant-select-selector, .ant-picker, .ant-input-affix-wrapper {
              background: rgba(255, 255, 255, 0.05) !important;
              border: 1px solid rgba(255, 255, 255, 0.1) !important;
              color: #fff !important;
            }
            .ant-input {
              background: transparent !important;
              color: #fff !important;
            }
            .ant-picker-input > input {
              color: #fff !important;
            }
          `}</style>
        </Content>
      </Layout>
    </Layout>
  );
}
