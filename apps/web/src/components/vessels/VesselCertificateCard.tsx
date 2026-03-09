import { ExclamationCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Alert, Badge, Card, Space, Table, Tag, Tooltip, Typography } from 'antd';

const { Text } = Typography;

const CERT_LABELS: Record<string, string> = {
  SMC: 'Safety Management Certificate',
  DOC: 'Document of Compliance',
  PASSENGER_SHIP_SAFETY: 'Passenger Ship Safety Certificate',
  LOAD_LINE: 'Load Line Certificate',
  RADIO_LICENSE: 'Radio License / Ship Station',
  TONNAGE: 'Tonnage Certificate',
  ISSC: 'International Ship Security Certificate',
  MSMD: 'Minimum Safe Manning Document',
};

interface Certificate {
  type: string;
  referenceNumber: string;
  expiryDate?: string;
  status: string;
  daysUntilExpiry?: number;
  daysUntilVerification?: number;
}

export interface VesselCertificateReport {
  overallStatus?: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';
  mmsiNumber?: string;
  missingCertificates: string[];
  expiredCertificates: Certificate[];
  expiringCertificates: Certificate[];
  validCertificates: Certificate[];
}

export function VesselCertificateCard({ report }: { report: VesselCertificateReport }) {
  const statusColor =
    {
      COMPLIANT: '#52c41a',
      WARNING: '#faad14',
      NON_COMPLIANT: '#ff4d4f',
    }[report?.overallStatus as 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT'] || '#d9d9d9';

  const missingCerts = report?.missingCertificates || [];
  const expiredCerts = report?.expiredCertificates || [];
  const expiringCerts = report?.expiringCertificates || [];
  const validCerts = report?.validCertificates || [];

  return (
    <Card
      title={
        <Space>
          <SafetyCertificateOutlined style={{ color: statusColor }} />
          <Text style={{ color: '#e6f7ff' }}>Vessel Certificates</Text>
          {report?.mmsiNumber && <Tag color="blue">MMSI: {report.mmsiNumber}</Tag>}
        </Space>
      }
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${statusColor}40`,
      }}
    >
      {missingCerts.length > 0 && (
        <Alert
          type="error"
          icon={<ExclamationCircleOutlined />}
          message={`${missingCerts.length} mandatory certificate(s) not on file`}
          description={missingCerts.map((t: string) => CERT_LABELS[t] || t).join(', ')}
          style={{ marginBottom: 16 }}
          showIcon
        />
      )}

      <Table
        size="small"
        dataSource={[...expiredCerts, ...expiringCerts, ...validCerts]}
        pagination={false}
        rowKey={(record) => `${record.type}-${record.referenceNumber}`}
        columns={[
          {
            title: 'Certificate',
            dataIndex: 'type',
            render: (t: string) => CERT_LABELS[t] || t,
          },
          {
            title: 'Reference',
            dataIndex: 'referenceNumber',
          },
          {
            title: 'Expiry',
            dataIndex: 'expiryDate',
            render: (d: string) => (d ? new Date(d).toLocaleDateString() : 'Permanent'),
          },
          {
            title: 'Status',
            dataIndex: 'status',
            render: (s: string, row: any) => {
              const colorMap: Record<string, string> = {
                VALID: 'success',
                EXPIRING_SOON: 'warning',
                CRITICAL: 'error',
                EXPIRED: 'error',
                VERIFICATION_OVERDUE: 'error',
              };

              // FIX-06: Robust tooltip for days until expiry/verification
              let tooltipTitle = undefined;
              if (row.daysUntilExpiry != null) {
                tooltipTitle = `${row.daysUntilExpiry} days until expiry`;
              } else if (row.daysUntilVerification != null) {
                tooltipTitle = `${row.daysUntilVerification} days until annual verification`;
              }

              return (
                <Tooltip title={tooltipTitle}>
                  <Badge status={(colorMap[s] as any) || 'default'} text={s.replace(/_/g, ' ')} />
                </Tooltip>
              );
            },
          },
          {
            title: 'Next Verification',
            dataIndex: 'nextVerificationDue',
            render: (d: string) => (d ? new Date(d).toLocaleDateString() : '—'),
          },
        ]}
      />
    </Card>
  );
}
