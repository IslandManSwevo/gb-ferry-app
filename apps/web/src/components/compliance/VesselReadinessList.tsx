import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  RocketOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Card, Empty, Space, Tag, Typography } from 'antd';

const { Text } = Typography;

export interface VesselReadiness {
  id: string;
  name: string;
  imoNumber?: string;
  isCompliant: boolean;
  safeManningCompliant: boolean;
  certificatesCompliant: boolean;
  readinessStatus?: 'READY' | 'WARNING' | 'BLOCKED';
  assignedCrew?: number;
  requiredCrew?: number;
  blockers?: string[];
}

export function VesselReadinessList({ vessels }: { vessels: VesselReadiness[] }) {
  if (!vessels || vessels.length === 0) {
    return (
      <Card
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginTop: '24px',
          textAlign: 'center',
        }}
      >
        <Empty
          description={
            <Text style={{ color: 'rgba(255,255,255,0.45)' }}>No vessels found in fleet</Text>
          }
        />
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <RocketOutlined style={{ color: '#1890ff' }} />
          <Text style={{ color: '#e6f7ff' }}>Vessel Departure Readiness</Text>
        </Space>
      }
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        marginTop: '24px',
      }}
      bodyStyle={{ padding: '0 20px' }}
    >
      {vessels.map((v, index) => {
        const isLast = index === vessels.length - 1;
        const readiness = v.readinessStatus || (v.isCompliant ? 'READY' : 'BLOCKED');

        const statusConfig = {
          BLOCKED: { color: '#ff4d4f', label: 'BLOCKED', icon: <CloseCircleOutlined /> },
          WARNING: { color: '#faad14', label: 'WARNING', icon: <WarningOutlined /> },
          READY: { color: '#52c41a', label: 'READY', icon: <CheckCircleOutlined /> },
        }[readiness];

        return (
          <div
            key={v.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 0',
              borderBottom: isLast ? 'none' : '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <Space size="middle">
              <span style={{ color: statusConfig.color, fontSize: '20px' }}>
                {statusConfig.icon}
              </span>
              <div>
                <Text style={{ color: '#e6f7ff', fontWeight: 500, fontSize: '15px' }}>
                  {v.name}
                </Text>
                <br />
                <Text style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '12px' }}>
                  IMO: {v.imoNumber || 'N/A'}{' '}
                  {v.assignedCrew !== undefined &&
                    ` · Manning: ${v.assignedCrew}/${v.requiredCrew}`}
                </Text>
              </div>
            </Space>
            <Space direction="vertical" align="end" size={2}>
              <Tag color={statusConfig.color} style={{ margin: 0, borderRadius: '4px' }}>
                {statusConfig.label}
              </Tag>
              {v.blockers && v.blockers.length > 0 && (
                <Text style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '11px' }}>
                  {v.blockers[0]}
                  {v.blockers.length > 1 && ` +${v.blockers.length - 1} more`}
                </Text>
              )}
            </Space>
          </div>
        );
      })}
    </Card>
  );
}
