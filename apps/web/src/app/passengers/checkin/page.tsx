'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { WeatherWidget } from '@/components/ui/WeatherWidget';
import { api } from '@/lib/api';
import { useCanAccess } from '@/lib/auth/roles';
import {
  CheckCircleOutlined,
  CompassOutlined,
  DeleteOutlined,
  IdcardOutlined,
  PlusOutlined,
  SafetyOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  Layout,
  message,
  Progress,
  Row,
  Select,
  Space,
  Switch,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';

const { Content } = Layout;
const { Title, Text } = Typography;

type SailingStatus = 'on-time' | 'delayed' | 'boarding';

interface SailingOption {
  id: string;
  departurePort: string;
  arrivalPort: string;
  vesselName?: string;
  departureTime: string;
  arrivalTime?: string | null;
  capacity?: number | null;
  checkedIn: number;
  weatherAdvisory?: string;
  status: SailingStatus;
}

export default function CheckInPage() {
  const canAccessPage = useCanAccess('passengers.checkin');
  const [form] = Form.useForm();
  const [sailings, setSailings] = useState<SailingOption[]>([]);
  const [sailingsLoading, setSailingsLoading] = useState(true);
  const [selectedSailing, setSelectedSailing] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);

  const loadSailings = useCallback(async () => {
    setSailingsLoading(true);
    const { data, error } = await api.passengers.sailings();
    if (error || !data) {
      message.error(error || 'Unable to load sailings');
      setSailingsLoading(false);
      return;
    }

    const normalized = data.map((s: any) => ({
      ...s,
      status: s.status === 'in_progress' ? 'boarding' : s.status || 'on-time',
    })) as SailingOption[];

    setSailings(normalized);
    const defaultId = normalized[0]?.id ?? null;
    setSelectedSailing(defaultId);
    if (defaultId) {
      form.setFieldsValue({
        sailingId: defaultId,
        portOfEmbarkation: normalized[0]?.departurePort,
        portOfDisembarkation: normalized[0]?.arrivalPort,
        passengers: [{}], // Initial passenger for bulk mode
      });
    }
    setSailingsLoading(false);
  }, [form]);

  useEffect(() => {
    loadSailings();
  }, [loadSailings]);

  const selected = useMemo(
    () => sailings.find((s) => s.id === selectedSailing) ?? sailings[0],
    [sailings, selectedSailing]
  );

  const capacityUsage = useMemo(() => {
    if (!selected?.capacity || selected.capacity === 0) return 0;
    return Math.min(100, Math.round(((selected.checkedIn ?? 0) / selected.capacity) * 100));
  }, [selected]);

  const handleSubmit = async (values: any) => {
    if (!selected) {
      message.error('Select a sailing');
      return;
    }

    setSubmitting(true);
    const passengers = bulkMode ? values.passengers : [values];

    let successCount = 0;
    for (const p of passengers) {
      const payload = {
        sailingId: values.sailingId || selected.id,
        sailingDate: selected.departureTime,
        familyName: p.familyName,
        givenNames: p.givenNames,
        dateOfBirth: p.dateOfBirth?.format('YYYY-MM-DD'),
        nationality: p.nationality,
        gender: p.gender,
        identityDocType: p.identityDocType,
        identityDocNumber: p.identityDocNumber,
        identityDocExpiry: p.identityDocExpiry?.format('YYYY-MM-DD'),
        identityDocCountry: p.identityDocCountry || p.nationality,
        portOfEmbarkation: values.portOfEmbarkation || selected.departurePort,
        portOfDisembarkation: values.portOfDisembarkation || selected.arrivalPort,
        cabinOrSeat: p.cabinOrSeat,
        baggage: p.baggage,
        consentGiven: !!values.bulkConsent || !!p.consentGiven,
        consentProvidedAt: new Date().toISOString(),
      };

      const { error } = await api.passengers.checkIn(payload);
      if (!error) successCount++;
    }

    setSubmitting(false);
    if (successCount === passengers.length) {
      message.success(`Successfully checked in ${successCount} passenger(s)`);
      form.resetFields();
      loadSailings();
    } else {
      message.warning(
        `Checked in ${successCount} of ${passengers.length} passengers. Some errors occurred.`
      );
    }
  };

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
                    Access Restricted
                  </Title>
                  <Text style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Your current role does not have authorization to perform passenger check-ins.
                    Please contact your system administrator if you believe this is an error.
                  </Text>
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
                <IdcardOutlined style={{ marginRight: 12, color: '#1890ff' }} />
                Passenger Check-In
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: '16px' }}>
                Secure documentation and manifest verification for{' '}
                {selected?.departurePort || 'current'} departures
              </Text>
            </Col>
            <Col>
              <Space size="large">
                <Space>
                  <Text style={{ color: '#fff' }}>Group Mode</Text>
                  <Switch checked={bulkMode} onChange={setBulkMode} />
                </Space>
                <StatusBadge
                  status={capacityUsage > 90 ? 'critical' : 'ok'}
                  label={`Sailing Load: ${capacityUsage}%`}
                />
              </Space>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} xl={16}>
              <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <GlassCard style={{ marginBottom: 24 }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="sailingId"
                        label={<Text style={{ color: '#e6f7ff' }}>Active Sailing</Text>}
                        rules={[{ required: true }]}
                      >
                        <Select
                          loading={sailingsLoading}
                          onChange={setSelectedSailing}
                          options={sailings.map((s) => ({
                            value: s.id,
                            label: `${s.departurePort} → ${s.arrivalPort} (${dayjs(s.departureTime).format('HH:mm')})`,
                          }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        name="portOfEmbarkation"
                        label={<Text style={{ color: '#e6f7ff' }}>Departure</Text>}
                      >
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        name="portOfDisembarkation"
                        label={<Text style={{ color: '#e6f7ff' }}>Arrival</Text>}
                      >
                        <Input disabled />
                      </Form.Item>
                    </Col>
                  </Row>
                </GlassCard>

                {bulkMode ? (
                  <Form.List name="passengers">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restField }, index) => (
                          <GlassCard key={key} style={{ marginBottom: 16, position: 'relative' }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: 16,
                              }}
                            >
                              <Title level={5} style={{ color: '#e6f7ff', margin: 0 }}>
                                <UserAddOutlined style={{ marginRight: 8 }} />
                                Passenger #{index + 1}
                              </Title>
                              {fields.length > 1 && (
                                <Button
                                  danger
                                  ghost
                                  icon={<DeleteOutlined />}
                                  size="small"
                                  onClick={() => remove(name)}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                            <Row gutter={16}>
                              <Col span={12}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'givenNames']}
                                  label={
                                    <Text style={{ color: 'rgba(255,255,255,0.6)' }}>
                                      Given Names
                                    </Text>
                                  }
                                  rules={[{ required: true }]}
                                >
                                  <Input />
                                </Form.Item>
                              </Col>
                              <Col span={12}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'familyName']}
                                  label={
                                    <Text style={{ color: 'rgba(255,255,255,0.6)' }}>
                                      Family Name
                                    </Text>
                                  }
                                  rules={[{ required: true }]}
                                >
                                  <Input />
                                </Form.Item>
                              </Col>
                            </Row>
                            <Row gutter={16}>
                              <Col span={8}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'dateOfBirth']}
                                  label={
                                    <Text style={{ color: 'rgba(255,255,255,0.6)' }}>
                                      Date of Birth
                                    </Text>
                                  }
                                  rules={[{ required: true }]}
                                >
                                  <DatePicker style={{ width: '100%' }} />
                                </Form.Item>
                              </Col>
                              <Col span={8}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'nationality']}
                                  label={
                                    <Text style={{ color: 'rgba(255,255,255,0.6)' }}>
                                      Nationality
                                    </Text>
                                  }
                                  rules={[{ required: true }]}
                                >
                                  <Input />
                                </Form.Item>
                              </Col>
                              <Col span={8}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'gender']}
                                  label={
                                    <Text style={{ color: 'rgba(255,255,255,0.6)' }}>Gender</Text>
                                  }
                                  rules={[{ required: true }]}
                                >
                                  <Select
                                    options={[
                                      { label: 'Male', value: 'M' },
                                      { label: 'Female', value: 'F' },
                                    ]}
                                  />
                                </Form.Item>
                              </Col>
                            </Row>
                            <Divider
                              style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.05)' }}
                            />
                            <Row gutter={16}>
                              <Col span={8}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'identityDocType']}
                                  label={
                                    <Text style={{ color: 'rgba(255,255,255,0.6)' }}>Doc Type</Text>
                                  }
                                  rules={[{ required: true }]}
                                >
                                  <Select
                                    options={[
                                      { label: 'Passport', value: 'PASSPORT' },
                                      { label: 'National ID', value: 'NATIONAL_ID' },
                                    ]}
                                  />
                                </Form.Item>
                              </Col>
                              <Col span={8}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'identityDocNumber']}
                                  label={
                                    <Text style={{ color: 'rgba(255,255,255,0.6)' }}>
                                      Doc Number
                                    </Text>
                                  }
                                  rules={[{ required: true }]}
                                >
                                  <Input />
                                </Form.Item>
                              </Col>
                              <Col span={8}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'identityDocExpiry']}
                                  label={
                                    <Text style={{ color: 'rgba(255,255,255,0.6)' }}>Expiry</Text>
                                  }
                                  rules={[{ required: true }]}
                                >
                                  <DatePicker style={{ width: '100%' }} />
                                </Form.Item>
                              </Col>
                            </Row>
                          </GlassCard>
                        ))}
                        <Button
                          type="dashed"
                          onClick={() => add()}
                          block
                          icon={<PlusOutlined />}
                          style={{
                            color: '#e6f7ff',
                            borderColor: 'rgba(255,255,255,0.2)',
                            marginBottom: 24,
                            height: '50px',
                          }}
                        >
                          Add Another Participant
                        </Button>
                      </>
                    )}
                  </Form.List>
                ) : (
                  <GlassCard style={{ marginBottom: 24 }}>
                    {/* Single Passenger Form (Simplified) */}
                    <Title level={4} style={{ color: '#e6f7ff', marginBottom: 20 }}>
                      Passenger Information
                    </Title>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="givenNames"
                          label={
                            <Text style={{ color: 'rgba(255,255,255,0.6)' }}>Given Names</Text>
                          }
                          rules={[{ required: true }]}
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="familyName"
                          label={
                            <Text style={{ color: 'rgba(255,255,255,0.6)' }}>Family Name</Text>
                          }
                          rules={[{ required: true }]}
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="identityDocNumber"
                          label={
                            <Text style={{ color: 'rgba(255,255,255,0.6)' }}>
                              Passport / ID Number
                            </Text>
                          }
                          rules={[{ required: true }]}
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="nationality"
                          label={
                            <Text style={{ color: 'rgba(255,255,255,0.6)' }}>Issuing Country</Text>
                          }
                          rules={[{ required: true }]}
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          name="dateOfBirth"
                          label={
                            <Text style={{ color: 'rgba(255,255,255,0.6)' }}>Date of Birth</Text>
                          }
                          rules={[{ required: true }]}
                        >
                          <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="gender"
                          label={<Text style={{ color: 'rgba(255,255,255,0.6)' }}>Gender</Text>}
                          rules={[{ required: true }]}
                        >
                          <Select
                            options={[
                              { label: 'Male', value: 'M' },
                              { label: 'Female', value: 'F' },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="identityDocExpiry"
                          label={<Text style={{ color: 'rgba(255,255,255,0.6)' }}>Doc Expiry</Text>}
                          rules={[{ required: true }]}
                        >
                          <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Divider style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                    <Form.Item
                      name="consentGiven"
                      valuePropName="checked"
                      rules={[{ required: true, message: 'Required' }]}
                    >
                      <Checkbox style={{ color: '#fff' }}>
                        I confirm safety briefing and document validity
                      </Checkbox>
                    </Form.Item>
                  </GlassCard>
                )}

                {bulkMode && (
                  <GlassCard style={{ marginBottom: 24, background: 'rgba(24, 144, 255, 0.05)' }}>
                    <Form.Item
                      name="bulkConsent"
                      valuePropName="checked"
                      rules={[{ required: true, message: 'Group consent required' }]}
                    >
                      <Checkbox style={{ color: '#fff' }}>
                        <Text strong style={{ color: '#fff' }}>
                          GROUP ATTESTATION:
                        </Text>
                        <br />I verify that all passengers in this group have providing valid
                        documentation and have received the maritime safety brief.
                      </Checkbox>
                    </Form.Item>
                  </GlassCard>
                )}

                <Row justify="end">
                  <Col>
                    <Button
                      type="primary"
                      size="large"
                      htmlType="submit"
                      loading={submitting}
                      style={{
                        height: '56px',
                        padding: '0 48px',
                        fontSize: '18px',
                        borderRadius: '8px',
                      }}
                    >
                      Complete {bulkMode ? 'Group' : ''} Check-In
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Col>

            <Col xs={24} xl={8}>
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <GlassCard>
                  <Title level={4} style={{ color: '#e6f7ff', marginBottom: 16 }}>
                    <CompassOutlined style={{ marginRight: 8 }} />
                    Sailing Readiness
                  </Title>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text style={{ color: 'rgba(255,255,255,0.45)' }}>Vessel</Text>
                      <Text strong style={{ color: '#fff' }}>
                        {selected?.vesselName || 'TBD'}
                      </Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text style={{ color: 'rgba(255,255,255,0.45)' }}>Departure</Text>
                      <Text strong style={{ color: '#fff' }}>
                        {dayjs(selected?.departureTime).format('HH:mm')}
                      </Text>
                    </div>
                    <Divider style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.1)' }} />
                    <Text
                      style={{ color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 8 }}
                    >
                      CAPACITY UTILIZATION
                    </Text>
                    <Progress
                      percent={capacityUsage}
                      strokeColor={capacityUsage > 90 ? '#ff4d4f' : '#52c41a'}
                      status={capacityUsage > 90 ? 'exception' : 'active'}
                    />
                    <Text
                      style={{
                        color: '#fff',
                        fontSize: '16px',
                        fontWeight: 600,
                        display: 'block',
                        textAlign: 'center',
                        marginTop: 8,
                      }}
                    >
                      {selected?.checkedIn ?? 0} / {selected?.capacity ?? 0} PAX
                    </Text>
                  </Space>
                </GlassCard>

                <GlassCard
                  style={{ background: 'rgba(24, 144, 255, 0.05)', border: '1px dashed #1890ff' }}
                >
                  <Title level={4} style={{ color: '#1890ff', marginBottom: 16 }}>
                    <SafetyOutlined style={{ marginRight: 8 }} />
                    Compliance Quick-List
                  </Title>
                  <Space direction="vertical" size="middle">
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <CheckCircleOutlined style={{ color: '#52c41a', marginTop: 4 }} />
                      <Text style={{ color: '#e6f7ff' }}>
                        Document image must be clear and readable
                      </Text>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <CheckCircleOutlined style={{ color: '#52c41a', marginTop: 4 }} />
                      <Text style={{ color: '#e6f7ff' }}>
                        Expiry must be at least 30 days post-sailing
                      </Text>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <CheckCircleOutlined style={{ color: '#52c41a', marginTop: 4 }} />
                      <Text style={{ color: '#e6f7ff' }}>
                        Manifest data synchronized with CBP APIS
                      </Text>
                    </div>
                  </Space>
                </GlassCard>

                <WeatherWidget
                  loading={false}
                  location={selected?.departurePort || 'Port'}
                  condition="Partly Cloudy"
                  temperatureC={28}
                  windKts={12}
                  waveHeightM={0.8}
                  updatedAt={new Date().toISOString()}
                />
              </Space>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
}
