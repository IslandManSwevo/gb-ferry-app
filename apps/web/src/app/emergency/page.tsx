'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { GlassCard } from '@/components/ui/GlassCard';
import { api } from '@/lib/api/client';
import {
  AlertOutlined,
  CloudOutlined,
  PhoneOutlined,
  SafetyOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Layout,
  message,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

export default function EmergencyPage() {
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [selectedCrew, setSelectedCrew] = useState<any | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [crew, setCrew] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [emergencyFeed, setEmergencyFeed] = useState<any[]>([
    { id: '1', time: '10:45 AM', type: 'System', message: 'Manual emergency protocol activated' },
    {
      id: '2',
      time: '10:42 AM',
      type: 'Weather',
      message: 'Small craft advisory issued for Northwest Bahamas',
    },
  ]);

  const loadCrew = useCallback(async () => {
    const { data, error } = await api.crew.list();
    if (!error && data) {
      setCrew(data?.items || []);
    }
  }, []);

  useEffect(() => {
    loadCrew();
  }, [loadCrew]);

  const handleIncidentReport = async (values: any) => {
    setSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newEntry = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'Incident',
      message: `Reported: ${values.incidentType} at ${values.location}`,
    };

    setEmergencyFeed([newEntry, ...emergencyFeed]);
    setSubmitting(false);
    message.success('Emergency incident reported successfully');
    setIsIncidentModalOpen(false);
    form.resetFields();
  };

  const handleContactCrew = (member: any) => {
    setSelectedCrew(member);
    setIsContactModalOpen(true);
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
          <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
            <Col>
              <Title level={2} style={{ color: '#fff', margin: 0 }}>
                <AlertOutlined style={{ marginRight: 12, color: '#ff4d4f' }} />
                Emergency Operations Hub
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: '16px' }}>
                Command center for time-critical maritime incidents and fleet safety
              </Text>
            </Col>
            <Col>
              <Tag color="error" style={{ fontSize: '14px', padding: '4px 12px' }}>
                <span style={{ marginRight: 8 }}>●</span> LIVE OPS MODE
              </Tag>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              {/* Critical Actions */}
              <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                <Col xs={24} md={12}>
                  <GlassCard
                    style={{
                      background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                      border: '2px solid rgba(255,77,79,0.3)',
                    }}
                  >
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                      <div>
                        <WarningOutlined style={{ fontSize: 32, color: '#fff' }} />
                        <Title level={4} style={{ color: '#fff', marginTop: 12 }}>
                          Report Emergency Incident
                        </Title>
                        <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                          Signal a medical, fire, or safety event to all relevant authorities.
                        </Text>
                      </div>
                      <Button
                        danger
                        type="primary"
                        size="large"
                        block
                        onClick={() => setIsIncidentModalOpen(true)}
                        style={{
                          background: '#fff',
                          color: '#dc2626',
                          border: 'none',
                          fontWeight: 600,
                        }}
                      >
                        Initialize Incident Response
                      </Button>
                    </Space>
                  </GlassCard>
                </Col>

                <Col xs={24} md={12}>
                  <GlassCard
                    style={{
                      background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                      border: '2px solid rgba(234,88,12,0.3)',
                    }}
                  >
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                      <div>
                        <CloudOutlined style={{ fontSize: 32, color: '#fff' }} />
                        <Title level={4} style={{ color: '#fff', marginTop: 12 }}>
                          Weather & Environment
                        </Title>
                        <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                          Advisory: Small craft warning active for Northern Abaco.
                        </Text>
                      </div>
                      <Button
                        type="primary"
                        size="large"
                        block
                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          backdropFilter: 'blur(4px)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          fontWeight: 600,
                        }}
                        onClick={() => setIsWeatherModalOpen(true)}
                      >
                        View Active Advisories
                      </Button>
                    </Space>
                  </GlassCard>
                </Col>
              </Row>

              {/* Emergency Contacts */}
              <GlassCard style={{ marginBottom: 24 }}>
                <Title level={4} style={{ color: '#e6f7ff', marginBottom: 16 }}>
                  <TeamOutlined style={{ marginRight: 8 }} />
                  Command Team Quick-Contact
                </Title>
                <Row gutter={[16, 16]}>
                  {crew.slice(0, 6).map((member) => (
                    <Col xs={24} sm={12} md={8} key={member.id}>
                      <Card
                        size="small"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                        hoverable
                        onClick={() => handleContactCrew(member)}
                      >
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <Text strong style={{ color: '#fff' }}>
                            {member.fullName || 'Crew Member'}
                          </Text>
                          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                            {member.rank || 'Position not set'}
                          </Text>
                          <Button
                            type="primary"
                            icon={<PhoneOutlined />}
                            size="small"
                            block
                            style={{
                              background: 'rgba(24, 144, 255, 0.2)',
                              borderColor: 'rgba(24, 144, 255, 0.4)',
                              marginTop: 8,
                            }}
                          >
                            CALL SECURE
                          </Button>
                        </Space>
                      </Card>
                    </Col>
                  ))}
                </Row>
                {crew.length === 0 && (
                  <Text type="secondary">
                    No crew members available. Add crew to enable quick contact.
                  </Text>
                )}
              </GlassCard>

              {/* Emergency Procedures */}
              <GlassCard>
                <Title level={4} style={{ color: '#e6f7ff', marginBottom: 16 }}>
                  <SafetyOutlined style={{ marginRight: 8 }} />
                  Standard Operating Procedures (SOPs)
                </Title>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={8}>
                    <Card
                      hoverable
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <Title level={5} style={{ color: '#ff7875', fontSize: '15px' }}>
                        Medical Procedure
                      </Title>
                      <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
                        1. Secure the casualty area
                        <br />
                        2. Deploy first responder kit
                        <br />
                        3. Page ship medical officer
                        <br />
                        4. Prep heli-vac pad (Bridge)
                      </Text>
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card
                      hoverable
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <Title level={5} style={{ color: '#ff7875', fontSize: '15px' }}>
                        Fire Procedure
                      </Title>
                      <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
                        1. Verify fire zone (Engine Rm)
                        <br />
                        2. Shut fuel intake valves
                        <br />
                        3. Don firefighting gear
                        <br />
                        4. Prep CO2 suppression
                      </Text>
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card
                      hoverable
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <Title level={5} style={{ color: '#ff7875', fontSize: '15px' }}>
                        MOB Recovery
                      </Title>
                      <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
                        1. Deploy MOB smoke signal
                        <br />
                        2. Hard turn to starboard
                        <br />
                        3. Mark chart plotter
                        <br />
                        4. Launch rescue tender
                      </Text>
                    </Card>
                  </Col>
                </Row>
              </GlassCard>
            </Col>

            <Col xs={24} lg={8}>
              {/* Emergency Feed */}
              <GlassCard style={{ height: '100%', minHeight: '600px' }}>
                <Title level={4} style={{ color: '#e6f7ff', marginBottom: 20 }}>
                  <span style={{ color: '#ff4d4f', marginRight: 8 }}>●</span> Live Incident Feed
                </Title>
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    {emergencyFeed.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          borderLeft: `3px solid ${item.type === 'Incident' ? '#ff4d4f' : '#1890ff'}`,
                          paddingLeft: '16px',
                          position: 'relative',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text
                            strong
                            style={{
                              color: item.type === 'Incident' ? '#ff4d4f' : '#1890ff',
                              fontSize: '12px',
                            }}
                          >
                            {item.type.toUpperCase()}
                          </Text>
                          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
                            {item.time}
                          </Text>
                        </div>
                        <div style={{ marginTop: '4px' }}>
                          <Text style={{ color: '#e6f7ff' }}>{item.message}</Text>
                        </div>
                      </div>
                    ))}
                  </Space>
                </div>
                <Divider style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                <Button block ghost style={{ color: 'rgba(255,255,255,0.6)' }}>
                  View Full Audit Log
                </Button>
              </GlassCard>
            </Col>
          </Row>
        </Content>
      </Layout>

      {/* Incident Report Modal */}
      <Modal
        title={
          <span style={{ color: '#fff' }}>
            <WarningOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
            EMERGENCY INCIDENT DECLARATION
          </span>
        }
        open={isIncidentModalOpen}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsIncidentModalOpen(false);
          form.resetFields();
        }}
        confirmLoading={submitting}
        okText="DECLARE INCIDENT"
        okButtonProps={{ danger: true, style: { fontWeight: 700 } }}
        cancelText="ABORT"
        width={600}
        style={{ top: 50 }}
      >
        <Form form={form} layout="vertical" onFinish={handleIncidentReport}>
          <Form.Item
            name="incidentType"
            label="Incident Classification"
            rules={[{ required: true, message: 'Priority classification required' }]}
          >
            <Select placeholder="Identify the threat...">
              <Select.Option value="medical">Medical - Critical Patient</Select.Option>
              <Select.Option value="fire">Fire / Smoke Detected</Select.Option>
              <Select.Option value="collision">Collision / Structural Failure</Select.Option>
              <Select.Option value="man_overboard">Man Overboard (MOB)</Select.Option>
              <Select.Option value="mechanical">Engine / Steering Failure</Select.Option>
              <Select.Option value="weather">Hazardous Sea State</Select.Option>
              <Select.Option value="security">Security / Breach of Peace</Select.Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="severity"
                label="Alert Severity"
                rules={[{ required: true, message: 'Severity level required' }]}
              >
                <Select placeholder="Crisis level">
                  <Select.Option value="critical">CRITICAL (Immediate danger)</Select.Option>
                  <Select.Option value="high">HIGH (Urgent)</Select.Option>
                  <Select.Option value="medium">MEDIUM (Escalating)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="location"
                label="Incident Location"
                rules={[{ required: true, message: 'Zone location required' }]}
              >
                <Input placeholder="Zone/Deck..." />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Situation Briefing"
            rules={[{ required: true, message: 'Provide a situational brief' }]}
          >
            <TextArea
              rows={4}
              placeholder="Provide concise details on current status and immediate needs..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Weather Modal */}
      <Modal
        title="Maritime Weather Advisories"
        open={isWeatherModalOpen}
        onCancel={() => setIsWeatherModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsWeatherModalOpen(false)}>
            Acknowledged
          </Button>,
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Alert
            message="Small Craft Advisory"
            description="Northwest Bahamas: Winds 20-25 kts from NE. Seas 6-9 ft. Small craft should remain in port."
            type="warning"
            showIcon
          />
          <Alert
            message="Gale Watch"
            description="Deep waters east of Abaco: Possible gale force winds later this evening."
            type="error"
            showIcon
          />
          <Divider />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>Local Nassau Tide:</Text>
            <Text strong>High 14:32 (0.9m)</Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>Barometric Pressure:</Text>
            <Text strong>1014mb (Falling)</Text>
          </div>
        </Space>
      </Modal>

      {/* Contact Modal */}
      <Modal
        title="Establishing Secure Link"
        open={isContactModalOpen}
        onCancel={() => setIsContactModalOpen(false)}
        footer={[
          <Button key="end" danger type="primary" onClick={() => setIsContactModalOpen(false)}>
            END SECURE CALL
          </Button>,
        ]}
      >
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Title level={3} style={{ marginBottom: 8 }}>
            {selectedCrew?.fullName}
          </Title>
          <Text type="secondary">{selectedCrew?.rank}</Text>
          <div style={{ marginTop: '24px' }}>
            <Tag color="processing" style={{ padding: '8px 24px', borderRadius: '20px' }}>
              <Space>
                <span className="pulse">●</span>
                ENCRYPTED VOICE LINK ACTIVE
              </Space>
            </Tag>
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        .pulse {
          animation: pulse-animation 2s infinite;
        }
        @keyframes pulse-animation {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </Layout>
  );
}
