'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AuditOutlined, FilterOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, DatePicker, Input, Layout, Select, Space, Table, Tag, Typography } from 'antd';

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
  { key: '1', timestamp: '2026-01-02 14:32:15', user: 'ops@gbferry.com', action: 'PASSENGER_CHECKIN', entityType: 'Passenger', entityId: 'pass-abc-123', details: 'Passenger John Smith checked in', ipAddress: '192.168.1.100' },
  { key: '2', timestamp: '2026-01-02 14:30:45', user: 'captain@gbferry.com', action: 'MANIFEST_APPROVED', entityType: 'Manifest', entityId: 'man-2026-001', details: 'Manifest approved for sailing NAS → FPB', ipAddress: '192.168.1.105' },
  { key: '3', timestamp: '2026-01-02 14:25:00', user: 'ops@gbferry.com', action: 'MANIFEST_GENERATED', entityType: 'Manifest', entityId: 'man-2026-001', details: 'Manifest generated with 248 passengers', ipAddress: '192.168.1.100' },
  { key: '4', timestamp: '2026-01-02 13:15:30', user: 'admin@gbferry.com', action: 'CREW_CREATE', entityType: 'CrewMember', entityId: 'crew-xyz-789', details: 'New crew member added: John Martinez', ipAddress: '192.168.1.50' },
  { key: '5', timestamp: '2026-01-02 12:00:00', user: 'compliance@gbferry.com', action: 'CERTIFICATION_VERIFY', entityType: 'Certification', entityId: 'cert-456', details: 'STCW certificate verified', ipAddress: '192.168.1.120' },
];

export default function AuditLogPage() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar />
      <Layout>
        <AppHeader />
        <Content style={{ margin: '24px', padding: '24px', background: '#f0f2f5' }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
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
                    { value: 'Passenger', label: 'Passenger' },
                    { value: 'Manifest', label: 'Manifest' },
                    { value: 'CrewMember', label: 'Crew Member' },
                    { value: 'Certification', label: 'Certification' },
                    { value: 'Vessel', label: 'Vessel' },
                  ]}
                />
                <Select
                  placeholder="Action"
                  style={{ width: 180 }}
                  allowClear
                  options={[
                    { value: 'PASSENGER_CHECKIN', label: 'Passenger Check-In' },
                    { value: 'MANIFEST_GENERATED', label: 'Manifest Generated' },
                    { value: 'MANIFEST_APPROVED', label: 'Manifest Approved' },
                    { value: 'CREW_CREATE', label: 'Crew Created' },
                    { value: 'CERTIFICATION_VERIFY', label: 'Cert Verified' },
                  ]}
                />
                <RangePicker />
                <Button icon={<FilterOutlined />}>Filter</Button>
              </Space>
            </div>
            <Table 
              columns={columns} 
              dataSource={data} 
              pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `Total ${total} entries` }}
            />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}
