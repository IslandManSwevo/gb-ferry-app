'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import {
  AlertOutlined,
  ApiOutlined,
  BellOutlined,
  FieldTimeOutlined,
  LockOutlined,
  SettingOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Card,
  Col,
  Divider,
  Form,
  Input,
  Layout,
  Menu,
  Row,
  Select,
  Switch,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { fetchSettingsOptions, SettingsOptions } from './options';

const { Content } = Layout;
const { Title, Text } = Typography;

const integerRangeRule = (min: number, max: number, label: string) => ({
  validator: (_: unknown, value: any) => {
    if (value === undefined || value === null || value === '') return Promise.resolve();
    const num = Number(value);
    if (!Number.isInteger(num)) return Promise.reject(new Error(`${label} must be an integer`));
    if (num < min || num > max)
      return Promise.reject(new Error(`${label} must be between ${min} and ${max}`));
    return Promise.resolve();
  },
});

const settingsMenu = [
  { key: 'org', icon: <ToolOutlined />, label: 'Organization' },
  { key: 'access', icon: <LockOutlined />, label: 'Access & Security' },
  { key: 'notifications', icon: <BellOutlined />, label: 'Notifications' },
  { key: 'operations', icon: <FieldTimeOutlined />, label: 'Operations Defaults' },
  { key: 'compliance', icon: <AlertOutlined />, label: 'Compliance' },
  { key: 'integrations', icon: <ApiOutlined />, label: 'Integrations & API' },
  { key: 'profile', icon: <UserOutlined />, label: 'My Profile' },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('org');
  const [options, setOptions] = useState<SettingsOptions | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSettingsOptions()
      .then((opts) => {
        if (!cancelled) {
          setOptions(opts);
          setLoadingOptions(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOptionsError('Failed to load settings options');
          setLoadingOptions(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const sectionTitle = useMemo(() => {
    const match = settingsMenu.find((item) => item.key === activeSection);
    return match?.label || 'Settings';
  }, [activeSection]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar />
      <Layout>
        <AppHeader />
        <Content style={{ margin: '24px', padding: '24px', background: '#f0f2f5' }}>
          <Title level={3} style={{ marginBottom: 8 }}>
            <SettingOutlined style={{ marginRight: 12 }} />
            Settings
          </Title>
          <Text type="secondary">
            Company-wide controls for security, operations, compliance, and your personal profile.
          </Text>

          {optionsError && (
            <Text type="danger" style={{ display: 'block', marginTop: 8 }}>
              {optionsError}
            </Text>
          )}

          <Row gutter={24} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Card size="small">
                <Menu
                  mode="vertical"
                  selectedKeys={[activeSection]}
                  onClick={({ key }) => setActiveSection(key)}
                  items={settingsMenu}
                  style={{ border: 'none' }}
                />
              </Card>
            </Col>

            <Col span={18}>
              {activeSection === 'org' && (
                <Card title={sectionTitle}>
                  <Form layout="vertical">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="Company Name">
                          <Input placeholder="Grand Bahama Ferry" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="Support Email">
                          <Input placeholder="support@example.com" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="Default Timezone">
                          <Select
                            loading={loadingOptions}
                            disabled={!options}
                            options={(options?.timezones ?? []).map((t) => ({
                              label: t,
                              value: t,
                            }))}
                            defaultValue="America/Nassau"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="Default Locale / Formats">
                          <Select
                            loading={loadingOptions}
                            disabled={!options}
                            options={(options?.locales ?? []).map((l) => ({ label: l, value: l }))}
                            defaultValue="en-US"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="Default Departure Port">
                          <Select
                            loading={loadingOptions}
                            disabled={!options}
                            options={(options?.ports ?? []).map((p) => ({ label: p, value: p }))}
                            defaultValue="Nassau"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="Default Arrival Port">
                          <Select
                            loading={loadingOptions}
                            disabled={!options}
                            options={(options?.ports ?? []).map((p) => ({ label: p, value: p }))}
                            defaultValue="Freeport"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Divider />
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="manifestCutoffMinutes"
                          label="Manifest Cutoff (minutes before departure)"
                          rules={[
                            { required: true, message: 'Enter manifest cutoff minutes' },
                            integerRangeRule(0, 720, 'Manifest cutoff'),
                          ]}
                        >
                          <Input type="number" min={0} max={720} placeholder="60" suffix="min" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="checkinOpensHours"
                          label="Check-in Opens (hours before departure)"
                          rules={[
                            { required: true, message: 'Enter check-in opening hours' },
                            integerRangeRule(1, 168, 'Check-in opening'),
                          ]}
                        >
                          <Input type="number" min={1} max={168} placeholder="24" suffix="hrs" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form>
                </Card>
              )}

              {activeSection === 'access' && (
                <Card title={sectionTitle}>
                  <Form layout="vertical">
                    <Form.Item label="Default Role for New Users">
                      <Select
                        defaultValue="operations"
                        options={[
                          { label: 'Operations', value: 'operations' },
                          { label: 'Captain', value: 'captain' },
                          { label: 'Compliance Officer', value: 'compliance_officer' },
                          { label: 'Viewer', value: 'viewer' },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item label="Session Timeout (minutes)">
                      <Input placeholder="60" suffix="min" />
                    </Form.Item>
                    <Form.Item label="Force Re-authentication Interval">
                      <Select
                        defaultValue="24h"
                        options={[
                          { label: '12 hours', value: '12h' },
                          { label: '24 hours', value: '24h' },
                          { label: '7 days', value: '7d' },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item label="Two-Factor Authentication Policy">
                      <Select
                        defaultValue="admin-required"
                        options={[
                          { label: 'Off', value: 'off' },
                          { label: 'Required for admins', value: 'admin-required' },
                          { label: 'Required for all users', value: 'all' },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item label="IP Allowlist (CIDR, comma separated)">
                      <Input placeholder="203.0.113.0/24, 198.51.100.0/24" />
                    </Form.Item>
                  </Form>
                </Card>
              )}

              {activeSection === 'notifications' && (
                <Card title={sectionTitle}>
                  <Form layout="vertical">
                    <Form.Item label="Operational Alerts (in-app)">
                      <Switch defaultChecked />
                      <Text type="secondary" style={{ marginLeft: 12 }}>
                        Passenger, manifest, and crew events
                      </Text>
                    </Form.Item>
                    <Form.Item label="Compliance Alerts (email)">
                      <Switch defaultChecked />
                      <Text type="secondary" style={{ marginLeft: 12 }}>
                        Certification expiry and inspection readiness
                      </Text>
                    </Form.Item>
                    <Form.Item label="Quiet Hours">
                      <Input placeholder="22:00-06:00" />
                      <Text type="secondary">Suppress non-critical alerts overnight</Text>
                    </Form.Item>
                    <Form.Item label="Escalation Target (critical)">
                      <Input placeholder="ops-lead@example.com" />
                    </Form.Item>
                  </Form>
                </Card>
              )}

              {activeSection === 'operations' && (
                <Card title={sectionTitle}>
                  <Form layout="vertical">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="documentExpiryWarning"
                          label="Document Expiry Warning"
                          rules={[
                            { required: true, message: 'Enter expiry warning window' },
                            integerRangeRule(1, 365, 'Expiry warning'),
                          ]}
                        >
                          <Input type="number" min={1} max={365} placeholder="30" suffix="days" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="criticalExpiryThreshold"
                          label="Critical Expiry Threshold"
                          rules={[
                            { required: true, message: 'Enter critical expiry threshold' },
                            integerRangeRule(1, 365, 'Critical expiry threshold'),
                          ]}
                        >
                          <Input type="number" min={1} max={365} placeholder="7" suffix="days" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item
                      name="safeManningThreshold"
                      label="Safe Manning Threshold"
                      rules={[
                        { required: true, message: 'Enter safe manning threshold' },
                        integerRangeRule(0, 100, 'Safe manning threshold'),
                      ]}
                    >
                      <Input type="number" min={0} max={100} placeholder="100" suffix="%" />
                      <Text type="secondary">
                        Percent of required positions that must be filled
                      </Text>
                    </Form.Item>
                    <Form.Item label="Manifest Approval Required">
                      <Switch defaultChecked />
                      <Text type="secondary" style={{ marginLeft: 12 }}>
                        Require approver sign-off before export
                      </Text>
                    </Form.Item>
                  </Form>
                </Card>
              )}

              {activeSection === 'compliance' && (
                <Card title={sectionTitle}>
                  <Form layout="vertical">
                    <Form.Item label="Enabled Jurisdictions">
                      <Select
                        mode="multiple"
                        defaultValue={['Bahamas']}
                        loading={loadingOptions}
                        disabled={!options}
                        options={(options?.jurisdictions ?? []).map((j) => ({
                          label: j,
                          value: j,
                        }))}
                      />
                    </Form.Item>
                    <Form.Item label="Default Export Format">
                      <Select
                        defaultValue="csv"
                        options={[
                          { label: 'CSV', value: 'csv' },
                          { label: 'XML', value: 'xml' },
                          { label: 'PDF', value: 'pdf' },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item label="Data Retention (manifests)">
                      <Select
                        defaultValue="365"
                        options={[
                          { label: '180 days', value: '180' },
                          { label: '365 days', value: '365' },
                          { label: '730 days', value: '730' },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item label="Audit Log Retention">
                      <Select
                        defaultValue="365"
                        options={[
                          { label: '180 days', value: '180' },
                          { label: '365 days', value: '365' },
                          { label: '730 days', value: '730' },
                        ]}
                      />
                    </Form.Item>
                  </Form>
                </Card>
              )}

              {activeSection === 'integrations' && (
                <Card title={sectionTitle}>
                  <Form layout="vertical">
                    <Form.Item
                      name="webhookEndpoint"
                      label="Webhook Endpoint"
                      rules={[
                        { required: true, message: 'Enter webhook endpoint' },
                        { type: 'url', message: 'Enter a valid URL' },
                        {
                          validator: (_, value) => {
                            if (!value) return Promise.resolve();
                            return value.startsWith('https://')
                              ? Promise.resolve()
                              : Promise.reject(new Error('Webhook endpoint must use HTTPS'));
                          },
                        },
                      ]}
                    >
                      <Input placeholder="https://example.com/webhooks/compliance" />
                    </Form.Item>
                    <Form.Item label="Signing Secret">
                      <Input.Password placeholder="••••••••" />
                      <Text type="secondary">Used to verify inbound webhook signatures</Text>
                    </Form.Item>
                    <Divider>Storage</Divider>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="Storage Provider">
                          <Select
                            defaultValue="minio"
                            options={[
                              { label: 'MinIO', value: 'minio' },
                              { label: 'AWS S3', value: 's3' },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="Bucket Name">
                          <Input placeholder="documents" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Divider>API Tokens</Divider>
                    <Card size="small" type="inner" title="Personal Access Token">
                      <Row gutter={12}>
                        <Col span={12}>
                          <Form.Item label="Scope">
                            <Select
                              defaultValue="read"
                              options={[
                                { label: 'Read', value: 'read' },
                                { label: 'Read/Write', value: 'rw' },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label="Expiry">
                            <Select
                              defaultValue="30d"
                              options={[
                                { label: '7 days', value: '7d' },
                                { label: '30 days', value: '30d' },
                                { label: '90 days', value: '90d' },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Tag color="blue">No token generated</Tag>
                    </Card>
                  </Form>
                </Card>
              )}

              {activeSection === 'profile' && (
                <Card title={sectionTitle}>
                  <Form layout="vertical" style={{ maxWidth: 520 }}>
                    <Form.Item label="Full Name">
                      <Input placeholder="First Last" />
                    </Form.Item>
                    <Form.Item label="Email">
                      <Input placeholder="user@example.com" disabled />
                    </Form.Item>
                    <Form.Item label="Department">
                      <Input placeholder="Operations" />
                    </Form.Item>
                    <Divider>Two-Factor Authentication</Divider>
                    <Form.Item label="Enable 2FA">
                      <Switch />
                      <Text type="secondary" style={{ marginLeft: 12 }}>
                        Protect your account with TOTP
                      </Text>
                    </Form.Item>
                  </Form>
                </Card>
              )}
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
}
