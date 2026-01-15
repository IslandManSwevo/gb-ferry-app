'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { GlassCard } from '@/components/ui/GlassCard';
import { canAccess, ROLES } from '@/lib/auth/access';
import { useUserRoles } from '@/lib/auth/roles';
import {
  AlertOutlined,
  ApiOutlined,
  AuditOutlined,
  BellOutlined,
  GlobalOutlined,
  HistoryOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  SecurityScanOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Checkbox,
  Col,
  Divider,
  Form,
  Input,
  Layout,
  Menu,
  message,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { fetchSettingsOptions, SettingsOptions } from './options';

const { Content } = Layout;
const { Title, Text } = Typography;

const settingsMenuDefs = [
  { key: 'org', icon: <GlobalOutlined />, label: 'Organization', feature: 'settings.org' },
  { key: 'users', icon: <TeamOutlined />, label: 'Users & Roster', feature: 'settings.users' },
  { key: 'roles', icon: <KeyOutlined />, label: 'Roles & Permissions', feature: 'settings.roles' },
  {
    key: 'ops-security',
    icon: <SafetyCertificateOutlined />,
    label: 'Operational Security',
    feature: 'settings.ops-security',
  },
  {
    key: 'notifications',
    icon: <BellOutlined />,
    label: 'Notifications',
    feature: 'settings.notifications',
  },
  {
    key: 'compliance',
    icon: <AlertOutlined />,
    label: 'Compliance Policy',
    feature: 'settings.compliance',
  },
  {
    key: 'integrations',
    icon: <ApiOutlined />,
    label: 'Integrations & API',
    feature: 'settings.integrations',
  },
  { key: 'system-log', icon: <AuditOutlined />, label: 'System Audit', feature: 'settings.audit' },
  { key: 'profile', icon: <UserOutlined />, label: 'My Profile', feature: 'settings.profile' },
];

const mockUsers = [
  {
    id: '1',
    name: 'Capt. James Wilson',
    email: 'j.wilson@gbferry.com',
    role: 'admin',
    status: 'active',
    department: 'Fleet Ops',
    lastLogin: '10m ago',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 's.johnson@gbferry.com',
    role: 'compliance_officer',
    status: 'active',
    department: 'Compliance',
    lastLogin: '2h ago',
  },
  {
    id: '3',
    name: 'Robert Chen',
    email: 'r.chen@gbferry.com',
    role: 'captain',
    status: 'active',
    department: 'Bridge',
    lastLogin: '5m ago',
  },
  {
    id: '4',
    name: 'Anita Desai',
    email: 'a.desai@gbferry.com',
    role: 'operations',
    status: 'away',
    department: 'Port Authority',
    lastLogin: '1d ago',
  },
];

const rolePermissions = [
  {
    feature: 'Passenger Check-In',
    admin: true,
    operations: true,
    captain: true,
    compliance: false,
  },
  {
    feature: 'Manifest Approval',
    admin: true,
    operations: false,
    captain: true,
    compliance: false,
  },
  {
    feature: 'Emergency Operations',
    admin: true,
    operations: true,
    captain: true,
    compliance: false,
  },
  {
    feature: 'Vessel Management',
    admin: true,
    operations: false,
    captain: false,
    compliance: false,
  },
  {
    feature: 'Certification Verify',
    admin: true,
    operations: false,
    captain: false,
    compliance: true,
  },
  { feature: 'System Settings', admin: true, operations: false, captain: false, compliance: false },
];

export default function SettingsPage() {
  const roles = useUserRoles();
  const [activeSection, setActiveSection] = useState('profile');
  const [options, setOptions] = useState<SettingsOptions | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  useEffect(() => {
    fetchSettingsOptions().then(setOptions);
  }, []);

  const visibleMenuItems = useMemo(() => {
    return settingsMenuDefs.filter((item) => canAccess(roles, item.feature));
  }, [roles]);

  useEffect(() => {
    if (visibleMenuItems.length > 0 && !visibleMenuItems.some((m) => m.key === activeSection)) {
      setActiveSection(visibleMenuItems[0].key);
    }
  }, [visibleMenuItems, activeSection]);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    message.success('Settings updated successfully');
  };

  const renderSection = () => {
    const labelStyle = { color: '#e6f7ff' };
    const activeDef = settingsMenuDefs.find((m) => m.key === activeSection);

    if (!activeDef || !canAccess(roles, activeDef.feature)) {
      return (
        <Alert
          message="Access Restricted"
          description="You do not have the required clearance to view this management module."
          type="error"
          showIcon
        />
      );
    }

    switch (activeSection) {
      case 'users':
        return (
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Title level={4} style={{ color: '#fff', margin: 0 }}>
                  Identity & Access Management
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Managing access for {mockUsers.length} staff members
                </Text>
              </div>
              <Button
                type="primary"
                icon={<UsergroupAddOutlined />}
                size="large"
                onClick={() => setIsInviteModalOpen(true)}
              >
                Onboard Staff
              </Button>
            </div>

            <Row gutter={16}>
              <Col span={8}>
                <GlassCard style={{ padding: '16px', textAlign: 'center' }}>
                  <Progress type="circle" percent={100} size={40} strokeColor="#52c41a" />
                  <div style={{ marginTop: 8 }}>
                    <Text strong style={{ color: '#fff' }}>
                      2FA Enrollment
                    </Text>
                    <br />
                    <Text style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>
                      Compulsory for all staff
                    </Text>
                  </div>
                </GlassCard>
              </Col>
              <Col span={8}>
                <GlassCard style={{ padding: '16px', textAlign: 'center' }}>
                  <Title level={4} style={{ color: '#fff', margin: 0 }}>
                    4
                  </Title>
                  <Text style={{ color: 'rgba(255,255,255,0.45)' }}>Active Licenses</Text>
                </GlassCard>
              </Col>
              <Col span={8}>
                <GlassCard style={{ padding: '16px', textAlign: 'center' }}>
                  <Badge count={2} offset={[10, 0]}>
                    <Title level={4} style={{ color: '#1890ff', margin: 0 }}>
                      2
                    </Title>
                  </Badge>
                  <br />
                  <Text style={{ color: 'rgba(255,255,255,0.45)' }}>Pending Approvals</Text>
                </GlassCard>
              </Col>
            </Row>

            <Table
              dataSource={mockUsers}
              pagination={false}
              className="maritime-table"
              columns={[
                {
                  title: 'User Identity',
                  key: 'user',
                  render: (_, r) => (
                    <Space>
                      <Avatar src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${r.id}`} />
                      <Space direction="vertical" size={0}>
                        <Text strong style={{ color: '#fff' }}>
                          {r.name}
                        </Text>
                        <Text style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                          {r.email}
                        </Text>
                      </Space>
                    </Space>
                  ),
                },
                {
                  title: 'Role',
                  dataIndex: 'role',
                  key: 'role',
                  render: (role: string) => <Tag color="blue">{role.toUpperCase()}</Tag>,
                },
                {
                  title: 'Last Activity',
                  dataIndex: 'lastLogin',
                  key: 'lastLogin',
                  render: (t) => <Text style={{ color: 'rgba(255,255,255,0.6)' }}>{t}</Text>,
                },
                {
                  title: 'Status',
                  key: 'status',
                  render: (_, r) => (
                    <Badge
                      status={r.status === 'active' ? 'success' : 'warning'}
                      text={<Text style={{ color: '#fff' }}>{r.status}</Text>}
                    />
                  ),
                },
                {
                  title: 'Control',
                  key: 'action',
                  render: () => (
                    <Space>
                      <Tooltip title="View Logs">
                        <Button
                          type="text"
                          icon={<HistoryOutlined />}
                          style={{ color: 'rgba(255,255,255,0.45)' }}
                        />
                      </Tooltip>
                      <Button type="link" size="small">
                        EDIT
                      </Button>
                    </Space>
                  ),
                },
              ]}
            />
          </Space>
        );

      case 'roles':
        return (
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <div>
              <Title level={4} style={{ color: '#fff', margin: 0 }}>
                RBAC Configuration
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.45)' }}>
                Define feature-level access for platform roles
              </Text>
            </div>

            <Table
              dataSource={rolePermissions}
              pagination={false}
              className="maritime-table"
              columns={[
                {
                  title: 'Feature / Module',
                  dataIndex: 'feature',
                  key: 'feature',
                  render: (f) => (
                    <Text strong style={{ color: '#fff' }}>
                      {f}
                    </Text>
                  ),
                },
                {
                  title: 'Admin',
                  dataIndex: 'admin',
                  key: 'admin',
                  render: (v) => <Checkbox checked={v} disabled />,
                },
                {
                  title: 'Operations',
                  dataIndex: 'operations',
                  key: 'ops',
                  render: (v) => <Checkbox checked={v} />,
                },
                {
                  title: 'Captain',
                  dataIndex: 'captain',
                  key: 'captain',
                  render: (v) => <Checkbox checked={v} />,
                },
                {
                  title: 'Compliance',
                  dataIndex: 'compliance',
                  key: 'comp',
                  render: (v) => <Checkbox checked={v} />,
                },
              ]}
            />

            <GlassCard
              style={{ background: 'rgba(24, 144, 255, 0.05)', border: '1px dashed #1890ff' }}
            >
              <Space direction="vertical" size={4}>
                <Text style={{ color: '#1890ff' }} strong>
                  <SecurityScanOutlined style={{ marginRight: 8 }} />
                  SuperAdmin Override Active
                </Text>
                <Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
                  Changes to these permissions will take effect across all logged-in sessions
                  immediately.
                </Text>
              </Space>
            </GlassCard>

            <Button type="primary" onClick={handleSave} loading={saving}>
              Commit Changes
            </Button>
          </Space>
        );

      case 'ops-security':
        return (
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <div>
              <Title level={4} style={{ color: '#fff', margin: 0 }}>
                Operational Guardrails
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.45)' }}>
                Preventive measures for fleet safety and manual overrides
              </Text>
            </div>

            <Form layout="vertical" onFinish={handleSave} form={form}>
              <GlassCard style={{ padding: '24px' }}>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Space direction="vertical" size={0}>
                      <Text strong style={labelStyle}>
                        Manifest Hard-Lock
                      </Text>
                      <Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                        Freeze manifest edits exactly 15 minutes before departure
                      </Text>
                    </Space>
                    <Form.Item
                      name="manifestLock"
                      valuePropName="checked"
                      initialValue={true}
                      noStyle
                    >
                      <Switch />
                    </Form.Item>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Space direction="vertical" size={0}>
                      <Text strong style={labelStyle}>
                        Remote Bridge Override
                      </Text>
                      <Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                        Allow shore-side ops to approve manifest if bridge sync fails
                      </Text>
                    </Space>
                    <Form.Item
                      name="remoteOverride"
                      valuePropName="checked"
                      initialValue={false}
                      noStyle
                    >
                      <Switch />
                    </Form.Item>
                  </div>
                </Space>
              </GlassCard>

              <div style={{ marginTop: 32 }}>
                <Text type="danger" strong style={{ display: 'block', marginBottom: 12 }}>
                  EMERGENCY FLEET SUSPENSION
                </Text>
                <GlassCard
                  style={{ background: 'rgba(255, 77, 79, 0.05)', border: '1px solid #ff4d4f' }}
                >
                  <Row align="middle" gutter={24}>
                    <Col flex="auto">
                      <Text style={{ color: '#fff' }}>Enable Global Lockout</Text>
                      <br />
                      <Text style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>
                        Terminating all user sessions and disabling check-in systems.
                      </Text>
                    </Col>
                    <Col>
                      <Button danger type="primary">
                        INITIATE LOCKDOWN
                      </Button>
                    </Col>
                  </Row>
                </GlassCard>
              </div>
            </Form>
          </Space>
        );

      case 'org':
        return (
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <div>
              <Title level={4} style={{ color: '#fff', margin: 0 }}>
                Organization Identity
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.45)' }}>
                Global platform settings and regional configurations
              </Text>
            </div>
            <Form layout="vertical" onFinish={handleSave}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label={<Text style={labelStyle}>Maritime Authority Name</Text>}
                    name="orgName"
                    initialValue="Grand Bahama Ferry Ltd."
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={<Text style={labelStyle}>Regional Headquarters</Text>}
                    name="hq"
                    initialValue="Nassau, Bahamas"
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label={<Text style={labelStyle}>Primary Timezone</Text>}
                    name="tz"
                    initialValue="America/Nassau"
                  >
                    <Select
                      options={(options?.timezones ?? []).map((t) => ({ label: t, value: t }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={<Text style={labelStyle}>Operational Currency</Text>}
                    name="currency"
                    initialValue="BSD"
                  >
                    <Select
                      options={[
                        { label: 'USD', value: 'USD' },
                        { label: 'BSD', value: 'BSD' },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Button type="primary" htmlType="submit" loading={saving}>
                Save Changes
              </Button>
            </Form>
          </Space>
        );

      case 'profile':
        return (
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <div>
              <Title level={4} style={{ color: '#fff', margin: 0 }}>
                Personal Profile
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.45)' }}>
                Manage your internal identification and credentials
              </Text>
            </div>
            <Row gutter={32}>
              <Col span={8} style={{ textAlign: 'center' }}>
                <Avatar
                  size={120}
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin"
                  style={{ border: '4px solid rgba(24, 144, 255, 0.2)' }}
                />
                <div style={{ marginTop: 16 }}>
                  <Button type="link">Change Avatar</Button>
                </div>
              </Col>
              <Col span={16}>
                <Form layout="vertical">
                  <Form.Item
                    label={<Text style={labelStyle}>Full Display Name</Text>}
                    initialValue="System Staff"
                  >
                    <Input disabled prefix={<UserOutlined />} />
                  </Form.Item>
                  <Form.Item
                    label={<Text style={labelStyle}>Email Address</Text>}
                    initialValue="staff@gbferry.com"
                  >
                    <Input disabled prefix={<ApiOutlined />} />
                  </Form.Item>
                  <Divider style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                  <Button type="primary" ghost icon={<AuditOutlined />}>
                    View My Activity Log
                  </Button>
                </Form>
              </Col>
            </Row>
          </Space>
        );

      default:
        return (
          <Alert
            message="Section coming soon"
            description="This configuration panel is currently being localized for the Bahamian regulatory region."
            type="info"
            showIcon
          />
        );
    }
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
          <div style={{ marginBottom: 32 }}>
            <Title level={2} style={{ color: '#fff', margin: 0 }}>
              <SecurityScanOutlined style={{ marginRight: 12, color: '#1890ff' }} />
              System Management Hub
            </Title>
            <Space style={{ marginTop: 8 }}>
              {roles.includes(ROLES.SUPERADMIN) && (
                <Tag color="gold" icon={<SafetyCertificateOutlined />}>
                  SUPERADMIN ACCESS
                </Tag>
              )}
              {roles.includes(ROLES.ADMIN) && !roles.includes(ROLES.SUPERADMIN) && (
                <Tag color="blue" icon={<SafetyCertificateOutlined />}>
                  ADMIN PRIVILEGES
                </Tag>
              )}
              <Text style={{ color: 'rgba(255,255,255,0.45)' }}>
                Staff Roles: {roles.join(', ').toUpperCase()}
              </Text>
            </Space>
          </div>

          <Row gutter={24}>
            <Col xs={24} lg={6}>
              <GlassCard style={{ padding: '8px' }}>
                <Menu
                  mode="vertical"
                  selectedKeys={[activeSection]}
                  items={visibleMenuItems}
                  onClick={({ key }) => setActiveSection(key)}
                  style={{ border: 'none', background: 'transparent', color: '#fff' }}
                  className="settings-sidebar-menu"
                />
              </GlassCard>
            </Col>
            <Col xs={24} lg={18}>
              <GlassCard style={{ minHeight: '600px', padding: '32px' }}>
                {renderSection()}
              </GlassCard>
            </Col>
          </Row>
        </Content>
      </Layout>

      <Modal
        title="Onboard New Staff Member"
        open={isInviteModalOpen}
        onCancel={() => setIsInviteModalOpen(false)}
        footer={[
          <Button key="c" onClick={() => setIsInviteModalOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="s"
            type="primary"
            onClick={() => {
              message.success('Invite sent to staff email');
              setIsInviteModalOpen(false);
            }}
          >
            Dispatch Invite
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="Staff Member Name" required>
            <Input placeholder="Capt. Jane Doe" />
          </Form.Item>
          <Form.Item label="Platform Email" required>
            <Input placeholder="jane.doe@gbferry.com" />
          </Form.Item>
          <Form.Item label="Initial Role Delegation" required>
            <Select placeholder="Assign role">
              <Select.Option value="captain">Vessel Master</Select.Option>
              <Select.Option value="operations">Ops Staff</Select.Option>
              <Select.Option value="compliance">Compliance Officer</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <style jsx global>{`
        .settings-sidebar-menu .ant-menu-item-selected {
          background-color: rgba(24, 144, 255, 0.1) !important;
          color: #1890ff !important;
          border-right: 2px solid #1890ff;
        }
        .settings-sidebar-menu .ant-menu-item:hover {
          color: #1890ff !important;
        }
        .maritime-table .ant-table {
          background: transparent !important;
          color: #fff !important;
        }
        .maritime-table .ant-table-thead > tr > th {
          background: rgba(255, 255, 255, 0.02) !important;
          color: rgba(255, 255, 255, 0.45) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 1px;
        }
        .maritime-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid rgba(255, 255, 255, 0.03) !important;
        }
        .maritime-table .ant-table-tbody > tr:hover > td {
          background: rgba(255, 255, 255, 0.01) !important;
        }
        .ant-checkbox-inner {
          background-color: rgba(255, 255, 255, 0.05) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }
      `}</style>
    </Layout>
  );
}
