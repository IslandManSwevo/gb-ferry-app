'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { BellOutlined, LockOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { Card, Col, Form, Input, Layout, Menu, Row, Switch, Typography } from 'antd';
import { useState } from 'react';

const { Content } = Layout;
const { Title, Text } = Typography;

const settingsMenu = [
  { key: 'profile', icon: <UserOutlined />, label: 'Profile' },
  { key: 'security', icon: <LockOutlined />, label: 'Security' },
  { key: 'notifications', icon: <BellOutlined />, label: 'Notifications' },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar />
      <Layout>
        <AppHeader />
        <Content style={{ margin: '24px', padding: '24px', background: '#f0f2f5' }}>
          <Title level={3} style={{ marginBottom: 24 }}>
            <SettingOutlined style={{ marginRight: 12 }} />
            Settings
          </Title>

          <Row gutter={24}>
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
              {activeSection === 'profile' && (
                <Card title="Profile Settings">
                  <Form layout="vertical" style={{ maxWidth: 500 }}>
                    <Form.Item label="Full Name">
                      <Input placeholder="John Smith" />
                    </Form.Item>
                    <Form.Item label="Email">
                      <Input placeholder="john@gbferry.com" disabled />
                    </Form.Item>
                    <Form.Item label="Department">
                      <Input placeholder="Operations" />
                    </Form.Item>
                  </Form>
                </Card>
              )}

              {activeSection === 'security' && (
                <Card title="Security Settings">
                  <Form layout="vertical" style={{ maxWidth: 500 }}>
                    <Form.Item label="Current Password">
                      <Input.Password />
                    </Form.Item>
                    <Form.Item label="New Password">
                      <Input.Password />
                    </Form.Item>
                    <Form.Item label="Confirm New Password">
                      <Input.Password />
                    </Form.Item>
                    <Form.Item label="Two-Factor Authentication">
                      <Switch />
                      <Text type="secondary" style={{ marginLeft: 12 }}>
                        Enable 2FA for additional security
                      </Text>
                    </Form.Item>
                  </Form>
                </Card>
              )}

              {activeSection === 'notifications' && (
                <Card title="Notification Preferences">
                  <Form layout="vertical">
                    <Form.Item label="Email Notifications">
                      <Switch defaultChecked />
                      <Text type="secondary" style={{ marginLeft: 12 }}>
                        Receive email alerts for critical events
                      </Text>
                    </Form.Item>
                    <Form.Item label="Certification Expiry Alerts">
                      <Switch defaultChecked />
                      <Text type="secondary" style={{ marginLeft: 12 }}>
                        Get notified 30 days before certifications expire
                      </Text>
                    </Form.Item>
                    <Form.Item label="Manifest Approval Reminders">
                      <Switch defaultChecked />
                      <Text type="secondary" style={{ marginLeft: 12 }}>
                        Remind when manifests are pending approval
                      </Text>
                    </Form.Item>
                    <Form.Item label="Safe Manning Alerts">
                      <Switch defaultChecked />
                      <Text type="secondary" style={{ marginLeft: 12 }}>
                        Alert when crew roster doesn&apos;t meet requirements
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
