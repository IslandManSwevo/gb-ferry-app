'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { WeatherWidget } from '@/components/ui/WeatherWidget';
import { api } from '@/lib/api';
import { UserAddOutlined } from '@ant-design/icons';
import {
  Alert,
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
  Steps,
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

interface WeatherSnapshot {
  location: string;
  condition: string;
  temperatureC?: number;
  windKts?: number;
  waveHeightM?: number;
  visibilityNm?: number;
  updatedAt?: string;
  advisory?: string;
}

const portCoordinates: Record<string, { lat: number; lon: number; label: string }> = {
  nassau: { lat: 25.06, lon: -77.34, label: 'Nassau Harbor' },
  freeport: { lat: 26.53, lon: -78.7, label: 'Freeport Harbor' },
  abaco: { lat: 26.4, lon: -77.0, label: 'Marsh Harbour' },
};

function mapSailingStatus(status?: string): SailingStatus {
  if (!status) return 'on-time';
  if (status === 'in_progress') return 'boarding';
  if (status === 'delayed') return 'delayed';
  return 'on-time';
}

function formatSailingLabel(sailing?: SailingOption) {
  if (!sailing) return 'Select a sailing';
  return `${sailing.departurePort} → ${sailing.arrivalPort}`;
}

function formatDeparture(sailing?: SailingOption) {
  if (!sailing) return '--';
  const dt = dayjs(sailing.departureTime);
  return dt.isValid() ? dt.format('MMM D • HH:mm') : '--';
}

function resolvePortKey(port?: string) {
  if (!port) return undefined;
  const lower = port.toLowerCase();
  if (lower.includes('nas')) return 'nassau';
  if (lower.includes('free')) return 'freeport';
  if (lower.includes('aba') || lower.includes('marsh')) return 'abaco';
  return undefined;
}

export default function CheckInPage() {
  const [form] = Form.useForm();
  const [sailings, setSailings] = useState<SailingOption[]>([]);
  const [sailingsLoading, setSailingsLoading] = useState(true);
  const [selectedSailing, setSelectedSailing] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const expiryDate = Form.useWatch('identityDocExpiry', form);

  const loadSailings = useCallback(async () => {
    setSailingsLoading(true);
    const { data, error } = await api.passengers.sailings();
    if (error || !data) {
      message.error(error || 'Unable to load sailings');
      setSailingsLoading(false);
      return;
    }

    const normalized = data.map((s: any) => ({
      id: s.id,
      departurePort: s.departurePort,
      arrivalPort: s.arrivalPort,
      vesselName: s.vesselName,
      departureTime: s.departureTime,
      arrivalTime: s.arrivalTime,
      capacity: s.capacity,
      checkedIn: s.checkedIn ?? 0,
      status: mapSailingStatus(s.status),
    })) as SailingOption[];

    setSailings(normalized);
    const defaultId = normalized[0]?.id ?? null;
    setSelectedSailing(defaultId);
    if (defaultId) {
      form.setFieldsValue({
        sailingId: defaultId,
        portOfEmbarkation: normalized[0]?.departurePort,
        portOfDisembarkation: normalized[0]?.arrivalPort,
      });
    }
    setSailingsLoading(false);
  }, [form]);

  const loadWeather = useCallback(async (port?: string) => {
    const portKey = resolvePortKey(port);
    const coords = portKey ? portCoordinates[portKey] : portCoordinates.nassau;
    setWeatherLoading(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&hourly=wave_height`;
      const res = await fetch(url);
      const data = await res.json();
      const current = data.current_weather;

      const condition =
        typeof current?.weathercode === 'number' ? `Code ${current.weathercode}` : 'Conditions';

      setWeather({
        location: coords.label,
        condition,
        temperatureC: current?.temperature ?? undefined,
        windKts: current?.windspeed ? Math.round(current.windspeed * 0.539957) : undefined,
        waveHeightM: data?.hourly?.wave_height?.[0] ?? undefined,
        visibilityNm: undefined,
        updatedAt: current?.time,
        advisory: current?.windspeed > 25 ? 'High winds reported' : undefined,
      });
    } catch (err) {
      console.error('Weather fetch failed', err);
      message.warning('Live weather unavailable; showing defaults');
      setWeather(null);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSailings();
  }, [loadSailings]);

  useEffect(() => {
    const sailing = sailings.find((s) => s.id === selectedSailing);
    if (sailing) {
      form.setFieldsValue({
        sailingId: sailing.id,
        portOfEmbarkation: sailing.departurePort,
        portOfDisembarkation: sailing.arrivalPort,
      });
      void loadWeather(sailing.departurePort);
    }
  }, [form, loadWeather, sailings, selectedSailing]);

  const selected = useMemo(
    () => sailings.find((s) => s.id === selectedSailing) ?? sailings[0],
    [sailings, selectedSailing]
  );

  const capacityUsage = useMemo(() => {
    if (!selected?.capacity || selected.capacity === 0) return 0;
    return Math.min(100, Math.round(((selected.checkedIn ?? 0) / selected.capacity) * 100));
  }, [selected]);

  const capacityStatus = capacityUsage >= 95 ? 'critical' : capacityUsage >= 85 ? 'warning' : 'ok';

  const expiryWarning = useMemo(() => {
    if (!expiryDate || !selected?.departureTime) return null;
    const sailingDate = dayjs(selected.departureTime);
    const expiry = dayjs(expiryDate);
    if (!sailingDate.isValid() || !expiry.isValid()) return null;
    const daysDiff = expiry.diff(sailingDate, 'day');
    if (daysDiff < 0) return 'Document expires before sailing date';
    if (daysDiff < 30) return `Document expires in ${daysDiff} days (under 30-day buffer)`;
    return null;
  }, [expiryDate, selected?.departureTime]);

  const handleSubmit = async (values: any) => {
    if (!selected) {
      message.error('Select a sailing');
      return;
    }

    setSubmitting(true);
    const payload = {
      sailingId: values.sailingId,
      sailingDate: selected.departureTime,
      familyName: values.familyName,
      givenNames: values.givenNames,
      dateOfBirth: values.dateOfBirth?.format('YYYY-MM-DD'),
      nationality: values.nationality,
      gender: values.gender,
      identityDocType: values.identityDocType,
      identityDocNumber: values.identityDocNumber,
      identityDocExpiry: values.identityDocExpiry?.format('YYYY-MM-DD'),
      identityDocCountry: values.identityDocCountry || values.nationality,
      portOfEmbarkation: values.portOfEmbarkation,
      portOfDisembarkation: values.portOfDisembarkation,
      cabinOrSeat: values.cabinOrSeat,
      specialInstructions: values.specialInstructions,
      consentGiven: !!values.consentGiven,
      consentProvidedAt: new Date().toISOString(),
    };

    const { error } = await api.passengers.checkIn(payload);
    setSubmitting(false);

    if (error) {
      message.error(error);
      return;
    }

    message.success('Passenger checked in');
    form.resetFields();
    form.setFieldsValue({
      sailingId: selected.id,
      portOfEmbarkation: selected.departurePort,
      portOfDisembarkation: selected.arrivalPort,
    });
    await loadSailings();
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
                Passenger Check-In
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.75)' }}>
                Capture documents and board faster with readiness signals
              </Text>
            </Col>
            <Col>
              <StatusBadge status={capacityStatus} label={`Capacity ${capacityUsage}%`} />
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} xl={16}>
              <GlassCard intensity="medium">
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <div>
                    <Title level={4} style={{ color: '#e6f7ff', marginBottom: 4 }}>
                      <UserAddOutlined style={{ marginRight: 8 }} />
                      Staged Check-In
                    </Title>
                    <Text style={{ color: 'rgba(230,247,255,0.75)' }}>
                      3-step flow: select sailing, capture passenger details, confirm boarding
                    </Text>
                  </div>

                  <Steps
                    current={1}
                    items={[
                      { title: 'Select Sailing' },
                      { title: 'Passenger Details' },
                      { title: 'Boarding Summary' },
                    ]}
                  />

                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{ sailingId: selected?.id }}
                  >
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="sailingId"
                          label="Sailing"
                          rules={[{ required: true, message: 'Choose a sailing' }]}
                        >
                          <Select
                            placeholder="Select sailing"
                            loading={sailingsLoading}
                            onChange={(value) => setSelectedSailing(value)}
                            optionRender={(option) => {
                              const sailing = (option.data as any)?.sailing as
                                | SailingOption
                                | undefined;
                              if (!sailing) return option.label;
                              const percent = sailing.capacity
                                ? Math.min(
                                    100,
                                    Math.round((sailing.checkedIn / sailing.capacity) * 100)
                                  )
                                : 0;
                              const status = sailing.status === 'delayed' ? 'warning' : 'ok';
                              return (
                                <Space direction="vertical" size={2} style={{ width: '100%' }}>
                                  <Space size={8} align="center">
                                    <StatusBadge
                                      status={status}
                                      label={formatSailingLabel(sailing)}
                                      compact
                                    />
                                    <Text type="secondary">{formatDeparture(sailing)}</Text>
                                  </Space>
                                  {sailing.capacity ? (
                                    <Progress
                                      percent={percent}
                                      size="small"
                                      strokeColor={
                                        percent >= 95
                                          ? '#ff4d4f'
                                          : percent >= 85
                                            ? '#faad14'
                                            : '#52c41a'
                                      }
                                      showInfo={false}
                                    />
                                  ) : (
                                    <Text type="secondary">Capacity pending</Text>
                                  )}
                                </Space>
                              );
                            }}
                            options={sailings.map((s) => ({
                              value: s.id,
                              label: `${formatSailingLabel(s)} (${formatDeparture(s)})`,
                              sailing: s,
                            }))}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={6}>
                        <Form.Item name="cabinOrSeat" label="Cabin/Seat">
                          <Input placeholder="A101" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={6}>
                        <Form.Item name="baggage" label="Baggage Tags">
                          <Input placeholder="2" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider style={{ borderColor: 'rgba(255,255,255,0.08)' }} />

                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="familyName"
                          label="Family Name"
                          rules={[{ required: true, message: 'Please enter family name' }]}
                        >
                          <Input placeholder="Smith" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="givenNames"
                          label="Given Names"
                          rules={[{ required: true, message: 'Please enter given names' }]}
                        >
                          <Input placeholder="John William" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name="dateOfBirth"
                          label="Date of Birth"
                          rules={[{ required: true, message: 'Please select date of birth' }]}
                        >
                          <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name="nationality"
                          label="Nationality"
                          rules={[{ required: true, message: 'Please select nationality' }]}
                        >
                          <Select placeholder="Select nationality">
                            <Select.Option value="USA">United States</Select.Option>
                            <Select.Option value="BHS">Bahamas</Select.Option>
                            <Select.Option value="GBR">United Kingdom</Select.Option>
                            <Select.Option value="CAN">Canada</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name="gender"
                          label="Gender"
                          rules={[{ required: true, message: 'Please select gender' }]}
                        >
                          <Select placeholder="Select gender">
                            <Select.Option value="M">Male</Select.Option>
                            <Select.Option value="F">Female</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name="identityDocType"
                          label="Document Type"
                          rules={[{ required: true }]}
                        >
                          <Select placeholder="Select document type">
                            <Select.Option value="PASSPORT">Passport</Select.Option>
                            <Select.Option value="NATIONAL_ID">National ID</Select.Option>
                            <Select.Option value="SEAMAN_BOOK">Seaman Book</Select.Option>
                            <Select.Option value="TRAVEL_DOCUMENT">Travel Document</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name="identityDocNumber"
                          label="Document Number"
                          rules={[{ required: true, message: 'Please enter document number' }]}
                        >
                          <Input placeholder="123456789" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name="identityDocExpiry"
                          label="Document Expiry"
                          rules={[
                            { required: true, message: 'Please add expiry date' },
                            {
                              validator: (_, value) => {
                                if (!value || !selected?.departureTime) return Promise.resolve();
                                const sailingDate = dayjs(selected.departureTime);
                                if (!sailingDate.isValid()) return Promise.resolve();
                                if (value.isBefore(sailingDate, 'day')) {
                                  return Promise.reject(
                                    new Error('Document expires before sailing date')
                                  );
                                }
                                return Promise.resolve();
                              },
                            },
                          ]}
                          extra={
                            expiryWarning ? <Text type="danger">{expiryWarning}</Text> : undefined
                          }
                        >
                          <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name="identityDocCountry"
                          label="Document Issuing Country"
                          rules={[{ required: true, message: 'Select issuing country' }]}
                        >
                          <Select placeholder="Select country">
                            <Select.Option value="USA">United States</Select.Option>
                            <Select.Option value="BHS">Bahamas</Select.Option>
                            <Select.Option value="GBR">United Kingdom</Select.Option>
                            <Select.Option value="CAN">Canada</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name="portOfEmbarkation"
                          label="Port of Embarkation"
                          rules={[{ required: true, message: 'Select embarkation port' }]}
                        >
                          <Select placeholder="Departure port">
                            <Select.Option value="Nassau">Nassau</Select.Option>
                            <Select.Option value="Freeport">Freeport</Select.Option>
                            <Select.Option value="Abaco">Abaco</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name="portOfDisembarkation"
                          label="Port of Disembarkation"
                          rules={[{ required: true, message: 'Select arrival port' }]}
                        >
                          <Select placeholder="Arrival port">
                            <Select.Option value="Nassau">Nassau</Select.Option>
                            <Select.Option value="Freeport">Freeport</Select.Option>
                            <Select.Option value="Abaco">Abaco</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                      <Col span={24}>
                        <Form.Item name="specialInstructions" label="Special Instructions">
                          <Input.TextArea rows={3} placeholder="Accessibility, medical, etc." />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      name="consentGiven"
                      valuePropName="checked"
                      rules={[
                        {
                          validator: (_, value) =>
                            value
                              ? Promise.resolve()
                              : Promise.reject(new Error('Consent is required to board')),
                        },
                      ]}
                    >
                      <Checkbox>I confirm passenger consent to travel</Checkbox>
                    </Form.Item>

                    <Alert
                      message="Remind passenger to keep ID handy at boarding gate."
                      type="info"
                      showIcon
                      style={{ marginTop: 8, marginBottom: 16 }}
                    />

                    <Row justify="end">
                      <Space>
                        <Button onClick={() => form.resetFields()}>Clear</Button>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                          Complete Check-In
                        </Button>
                      </Space>
                    </Row>
                  </Form>
                </Space>
              </GlassCard>
            </Col>
            <Col xs={24} xl={8}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <GlassCard intensity="medium">
                  <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
                    <Col>
                      <Title level={4} style={{ margin: 0, color: '#e6f7ff' }}>
                        Sailing Readiness
                      </Title>
                      <Text style={{ color: 'rgba(230,247,255,0.75)' }}>
                        {formatSailingLabel(selected)}
                      </Text>
                    </Col>
                    <Col>
                      <StatusBadge
                        status={selected?.status === 'delayed' ? 'warning' : 'ok'}
                        label={
                          selected?.status === 'boarding'
                            ? 'Boarding'
                            : selected?.status === 'delayed'
                              ? 'Delayed'
                              : 'On time'
                        }
                        compact
                      />
                    </Col>
                  </Row>
                  <Text style={{ color: '#e6f7ff', fontWeight: 600 }}>
                    {formatDeparture(selected)}
                  </Text>
                  <Text style={{ color: 'rgba(230,247,255,0.75)' }}>
                    Vessel {selected?.vesselName || 'TBD'}
                  </Text>
                  <Divider style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                  <Row gutter={[12, 12]}>
                    <Col span={12}>
                      <Text style={{ color: 'rgba(255,255,255,0.75)' }}>Capacity</Text>
                      <Progress
                        percent={capacityUsage}
                        strokeColor={
                          capacityStatus === 'critical'
                            ? '#ff4d4f'
                            : capacityStatus === 'warning'
                              ? '#faad14'
                              : '#52c41a'
                        }
                        showInfo
                      />
                    </Col>
                    <Col span={12}>
                      <Text style={{ color: 'rgba(255,255,255,0.75)' }}>Checked-In</Text>
                      <div style={{ color: '#e6f7ff', fontWeight: 600, fontSize: 18 }}>
                        {selected?.checkedIn ?? 0} / {selected?.capacity ?? 'n/a'}
                      </div>
                      <Text type="secondary">
                        {selected?.capacity != null
                          ? Math.max((selected.capacity ?? 0) - (selected?.checkedIn ?? 0), 0)
                          : 'Capacity pending'}{' '}
                        {selected?.capacity != null ? 'seats remaining' : ''}
                      </Text>
                    </Col>
                  </Row>
                  {selected?.weatherAdvisory && (
                    <Alert
                      message={selected.weatherAdvisory}
                      type="warning"
                      showIcon
                      style={{ marginTop: 12 }}
                    />
                  )}
                </GlassCard>

                <GlassCard intensity="medium">
                  <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
                    <Col>
                      <Title level={4} style={{ margin: 0 }}>
                        Boarding Summary
                      </Title>
                      <Text type="secondary">Documents and security checks</Text>
                    </Col>
                  </Row>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <Space align="center" size={12}>
                      <StatusBadge status="ok" label="Passport verified" compact />
                      <StatusBadge status="ok" label="Photo match" compact />
                      <StatusBadge status="warning" label="Bag tags pending" compact />
                    </Space>
                    <Text type="secondary">
                      Mark bag tags complete after labels printed at kiosk.
                    </Text>
                  </Space>
                </GlassCard>

                <WeatherWidget
                  loading={weatherLoading}
                  location={weather?.location || 'Harbor'}
                  condition={weather?.condition || 'Weather data pending'}
                  temperatureC={weather?.temperatureC}
                  windKts={weather?.windKts}
                  waveHeightM={weather?.waveHeightM}
                  visibilityNm={weather?.visibilityNm}
                  updatedAt={weather?.updatedAt}
                  advisory={weather?.advisory}
                  onRefresh={() => loadWeather(selected?.departurePort)}
                />
              </Space>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
}
