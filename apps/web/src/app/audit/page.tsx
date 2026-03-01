'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
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

const { Content } = Layout;
const { Title } = Typography;
const { RangePicker } = DatePicker;

const columns = [
  {
    title: 'Timestamp',
    dataIndex: 'timestamp',
    key: 'timestamp',
    width: 180,
  },
  {
    title: 'User',
    dataIndex: 'user',
    key: 'user',
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
  },
  {
    title: 'Entity ID',
    dataIndex: 'entityId',
    key: 'entityId',
    render: (id: string) => <code style={{ fontSize: 11 }}>{id}</code>,
  },
  {
    title: 'Details',
    dataIndex: 'details',
    key: 'details',
    ellipsis: true,
  },
  {
    title: 'IP Address',
    dataIndex: 'ipAddress',
    key: 'ipAddress',
    width: 130,
  },
];

// Placeholder data
const data = [
  {
    key: '1',
    timestamp: '2026-01-02 14:32:15',
    user: 'compliance@gbferry.com',
    action: 'CBP_APIS_SUBMITTED',
    entityType: 'CbpSubmission',
    entityId: 'cbp-sub-001',
    details: 'CBP crew list submitted for MV Bahama Spirit',
    ipAddress: '192.168.1.100',
  },
  {
    key: '2',
    timestamp: '2026-01-02 14:30:45',
    user: 'captain@gbferry.com',
    action: 'CREW_CREATE',
    entityType: 'CrewMember',
    entityId: 'crew-xyz-789',
    details: 'New crew member added: John Martinez',
    ipAddress: '192.168.1.105',
  },
  {
    key: '3',
    timestamp: '2026-01-02 14:25:00',
    user: 'compliance@gbferry.com',
    action: 'DATA_EXPORT',
    entityType: 'Vessel',
    entityId: 'vessel-001',
    details: 'Compliance data exported for BMA audit (CSV)',
    ipAddress: '192.168.1.100',
  },
  {
    key: '4',
    timestamp: '2026-01-02 13:15:30',
    user: 'admin@gbferry.com',
    action: 'CERTIFICATION_VERIFY',
    entityType: 'Certification',
    entityId: 'cert-456',
    details: 'STCW certificate verified via BMA registry',
    ipAddress: '192.168.1.50',
  },
  {
    key: '5',
    timestamp: '2026-01-02 12:00:00',
    user: 'compliance@gbferry.com',
    action: 'COMPLIANCE_REPORT_GENERATED',
    entityType: 'Compliance',
    entityId: 'rpt-2026-001',
    details: 'Fleet compliance snapshot generated',
    ipAddress: '192.168.1.120',
  },
];

export default function AuditLogPage() {
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
                <AuditOutlined style={{ marginRight: 12 }} />
                Audit Log
              </Title>
              <Space wrap>
                <Input
                  placeholder="Search logs..."
                  prefix={<SearchOutlined />}
                  style={{ width: 200 }}
                />
                <Select
                  placeholder="Entity Type"
                  style={{ width: 150 }}
                  allowClear
                  options={[
                    { value: 'CrewMember', label: 'Crew Member' },
                    { value: 'Certification', label: 'Certification' },
                    { value: 'Vessel', label: 'Vessel' },
                    { value: 'CbpSubmission', label: 'CBP Submission' },
                    { value: 'Compliance', label: 'Compliance' },
                  ]}
                />
                <Select
                  placeholder="Action"
                  style={{ width: 180 }}
                  allowClear
                  options={[
                    { value: 'CREW_CREATE', label: 'Crew Created' },
                    { value: 'CERTIFICATION_VERIFY', label: 'Cert Verified' },
                    { value: 'CBP_APIS_SUBMITTED', label: 'CBP Submitted' },
                    { value: 'DATA_EXPORT', label: 'Data Export' },
                    { value: 'COMPLIANCE_REPORT_GENERATED', label: 'Report Generated' },
                  ]}
                />
                <RangePicker />
                <Button icon={<FilterOutlined />}>Filter</Button>
              </Space>
            </div>
            <Table
              columns={columns}
              dataSource={data}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} entries`,
              }}
            />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}
