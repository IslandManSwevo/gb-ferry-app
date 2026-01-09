import { ReloadOutlined } from '@ant-design/icons';
import { Button, Col, Row, Space, Statistic, Typography } from 'antd';
import { GlassCard } from './GlassCard';
import { StatusBadge, StatusKind } from './StatusBadge';

const { Text } = Typography;

type RiskLevel = 'low' | 'elevated' | 'high';

interface WeatherWidgetProps {
  loading?: boolean;
  location: string;
  condition: string;
  temperatureC?: number;
  windKts?: number;
  waveHeightM?: number;
  visibilityNm?: number;
  updatedAt?: string;
  advisory?: string;
  onRefresh?: () => void;
}

function getRiskLevel(windKts?: number, waveHeightM?: number): RiskLevel {
  if ((windKts ?? 0) >= 25 || (waveHeightM ?? 0) >= 2.5) return 'high';
  if ((windKts ?? 0) >= 15 || (waveHeightM ?? 0) >= 1.5) return 'elevated';
  return 'low';
}

function toStatus(risk: RiskLevel): StatusKind {
  if (risk === 'high') return 'critical';
  if (risk === 'elevated') return 'warning';
  return 'ok';
}

export function WeatherWidget({
  loading,
  location,
  condition,
  temperatureC,
  windKts,
  waveHeightM,
  visibilityNm,
  updatedAt,
  advisory,
  onRefresh,
}: WeatherWidgetProps) {
  const risk = getRiskLevel(windKts, waveHeightM);
  const statusLabel = risk === 'high' ? 'High risk' : risk === 'elevated' ? 'Monitor' : 'Calm';

  return (
    <GlassCard>
      <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
        <Col>
          <Text style={{ color: '#e6f7ff', fontWeight: 600 }}>{location}</Text>
          <div>
            <StatusBadge status={toStatus(risk)} label={statusLabel} compact />
          </div>
        </Col>
        {onRefresh && (
          <Col>
            <Button
              size="small"
              icon={<ReloadOutlined spin={loading} />}
              onClick={onRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
          </Col>
        )}
      </Row>

      {loading ? (
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div style={{ height: 16, background: 'rgba(255,255,255,0.08)', borderRadius: 4 }} />
          <div style={{ height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
        </Space>
      ) : (
        <>
          <Row gutter={[12, 12]}>
            <Col span={12}>
              <Statistic
                title={<Text style={{ color: 'rgba(255,255,255,0.7)' }}>Conditions</Text>}
                value={condition}
                valueStyle={{ color: '#e6f7ff', fontSize: 18 }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title={<Text style={{ color: 'rgba(255,255,255,0.7)' }}>Temperature</Text>}
                value={temperatureC ?? '--'}
                suffix={temperatureC !== undefined ? '°C' : ''}
                valueStyle={{ color: '#e6f7ff' }}
              />
            </Col>
          </Row>
          <Row gutter={[12, 12]} style={{ marginTop: 8 }}>
            <Col span={8}>
              <Statistic
                title={<Text style={{ color: 'rgba(255,255,255,0.7)' }}>Wind</Text>}
                value={windKts ?? '--'}
                suffix={windKts !== undefined ? 'kts' : ''}
                valueStyle={{ color: '#e6f7ff' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title={<Text style={{ color: 'rgba(255,255,255,0.7)' }}>Seas</Text>}
                value={waveHeightM ?? '--'}
                suffix={waveHeightM !== undefined ? 'm' : ''}
                valueStyle={{ color: '#e6f7ff' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title={<Text style={{ color: 'rgba(255,255,255,0.7)' }}>Visibility</Text>}
                value={visibilityNm ?? '--'}
                suffix={visibilityNm !== undefined ? 'nm' : ''}
                valueStyle={{ color: '#e6f7ff' }}
              />
            </Col>
          </Row>
          {advisory && (
            <div style={{ marginTop: 12 }}>
              <Text style={{ color: 'rgba(230,247,255,0.8)' }}>{advisory}</Text>
            </div>
          )}
          {updatedAt && (
            <Text type="secondary" style={{ display: 'block', marginTop: 6 }}>
              Updated{' '}
              {new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </>
      )}
    </GlassCard>
  );
}
