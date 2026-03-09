# FIX-06: Dashboard Visual Hierarchy & Compliance UX

## Problem

The Compliance Command Center currently renders all statistics at identical visual weight. A critical STCW expiry, an expired vessel certificate, and the total crew count look the same on screen. For maritime operations staff and compliance officers, this creates **information paralysis** — the most urgent issues are buried in noise.

The fix is not to add more data. It is to enforce a strict **visual priority hierarchy** so that the most safety-critical and regulatory-critical items are immediately scannable at a glance, without reading text.

---

## Priority Hierarchy (Top → Bottom)

1. 🔴 **Blocking** — Vessel cannot depart. Expired cert, missing MSMD, manning deficiency.
2. 🟠 **Critical** — Action required within 7 days (cert expiring, unverified crew).
3. 🟡 **Warning** — Action required within 30 days.
4. 🟢 **Operational** — Fleet status, crew coverage, standard metrics.

---

## Dashboard Layout Changes

### Replace: Uniform Statistic Grid
### With: Tiered Alert + Status Architecture

```tsx
// apps/web/src/app/page.tsx — replace the dashboard body

'use client';

import {
  AlertOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Grid,
  Progress,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

/**
 * Compliance status card with visual priority banding.
 * Color and icon are determined by the status tier, not the data type.
 */
function PriorityStatCard({
  title,
  value,
  status,
  suffix,
  actionLabel,
  onAction,
  subtext,
}: {
  title: string;
  value: number | string;
  status: 'blocking' | 'critical' | 'warning' | 'ok' | 'info';
  suffix?: string;
  actionLabel?: string;
  onAction?: () => void;
  subtext?: string;
}) {
  const config = {
    blocking: {
      border: '#ff4d4f',
      background: 'rgba(255, 77, 79, 0.08)',
      icon: <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />,
      valueColor: '#ff4d4f',
    },
    critical: {
      border: '#ff7a45',
      background: 'rgba(255, 122, 69, 0.08)',
      icon: <ExclamationCircleOutlined style={{ color: '#ff7a45', fontSize: 20 }} />,
      valueColor: '#ff7a45',
    },
    warning: {
      border: '#faad14',
      background: 'rgba(250, 173, 20, 0.08)',
      icon: <WarningOutlined style={{ color: '#faad14', fontSize: 20 }} />,
      valueColor: '#faad14',
    },
    ok: {
      border: '#52c41a',
      background: 'rgba(82, 196, 26, 0.06)',
      icon: <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />,
      valueColor: '#52c41a',
    },
    info: {
      border: 'rgba(255,255,255,0.12)',
      background: 'rgba(255,255,255,0.04)',
      icon: <SafetyCertificateOutlined style={{ color: '#1890ff', fontSize: 20 }} />,
      valueColor: '#e6f7ff',
    },
  }[status];

  return (
    <Card
      style={{
        background: config.background,
        border: `1px solid ${config.border}`,
        height: '100%',
      }}
      bodyStyle={{ padding: '16px 20px' }}
    >
      <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
        <div>
          <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            {title}
          </Text>
          <div style={{ marginTop: 4 }}>
            <Text style={{ color: config.valueColor, fontSize: 32, fontWeight: 700, lineHeight: 1 }}>
              {value}
            </Text>
            {suffix && (
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginLeft: 6 }}>
                {suffix}
              </Text>
            )}
          </div>
          {subtext && (
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4, display: 'block' }}>
              {subtext}
            </Text>
          )}
        </div>
        {config.icon}
      </Space>
      {actionLabel && onAction && (
        <Button
          size="small"
          type="link"
          style={{ color: config.valueColor, padding: 0, marginTop: 8, height: 'auto' }}
          onClick={onAction}
        >
          {actionLabel} →
        </Button>
      )}
    </Card>
  );
}

/**
 * Compact departure readiness block.
 * Shows per-vessel blocking/warning/clear status — not a number, a status.
 */
function VesselReadinessList({ vessels }: { vessels: VesselReadiness[] }) {
  return (
    <Card
      title={
        <Space>
          <SafetyCertificateOutlined style={{ color: '#1890ff' }} />
          <Text style={{ color: '#e6f7ff' }}>Vessel Departure Readiness</Text>
        </Space>
      }
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {vessels.map((v) => {
        const statusConfig = {
          BLOCKED: { color: '#ff4d4f', label: 'BLOCKED', icon: <CloseCircleOutlined /> },
          WARNING: { color: '#faad14', label: 'WARNING', icon: <WarningOutlined /> },
          READY: { color: '#52c41a', label: 'READY', icon: <CheckCircleOutlined /> },
        }[v.readinessStatus];

        return (
          <div
            key={v.vesselId}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Space>
              <span style={{ color: statusConfig.color }}>{statusConfig.icon}</span>
              <div>
                <Text style={{ color: '#e6f7ff', fontWeight: 500 }}>{v.vesselName}</Text>
                <br />
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                  {v.route} · Manning: {v.assignedCrew}/{v.requiredCrew}
                </Text>
              </div>
            </Space>
            <Space direction="vertical" align="end" size={2}>
              <Tag color={statusConfig.color} style={{ margin: 0 }}>
                {statusConfig.label}
              </Tag>
              {v.blockers.length > 0 && (
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
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

/**
 * Main dashboard layout.
 * Tier 1 (blocking) renders first and largest.
 * Tier 2-3 (critical/warning) in a secondary row.
 * Tier 4 (operational metrics) at the bottom.
 */
export function ComplianceDashboardBody({ dashboard }: { dashboard: DashboardData }) {
  const router = useRouter();
  const screens = Grid.useBreakpoint();

  // Derive tiers from dashboard data
  const blockingCount = (dashboard.summary.nonCompliantAlertsCount ?? 0);
  const criticalCertExpiry = dashboard.alerts.filter(
    (a) => a.severity === 'critical',
  ).length;
  const warningCertExpiry = dashboard.summary.expiringCertifications ?? 0;
  const safeManningPct = dashboard.metrics.safeManningCompliance ?? 0;
  const certValidityPct = dashboard.metrics.certificateValidityRate ?? 0;

  return (
    <div>
      {/* ── TIER 1: Blocking alerts (full width, most prominent) ── */}
      {blockingCount > 0 && (
        <Alert
          type="error"
          showIcon
          icon={<CloseCircleOutlined />}
          message={`${blockingCount} vessel(s) have blocking compliance issues and cannot depart`}
          description="Expired certificates or manning deficiencies detected. Resolve before authorising departure."
          action={
            <Button size="small" danger onClick={() => router.push('/compliance/reports')}>
              View Blockers
            </Button>
          }
          style={{ marginBottom: 16, border: '1px solid #ff4d4f' }}
        />
      )}

      {/* ── TIER 2: Priority stat cards ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <PriorityStatCard
            title="Blocking Issues"
            value={blockingCount}
            status={blockingCount > 0 ? 'blocking' : 'ok'}
            subtext={blockingCount > 0 ? 'Vessels cannot depart' : 'All vessels clear'}
            actionLabel={blockingCount > 0 ? 'Resolve now' : undefined}
            onAction={() => router.push('/compliance/reports')}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <PriorityStatCard
            title="Critical Cert Expiries"
            value={criticalCertExpiry}
            status={criticalCertExpiry > 0 ? 'critical' : 'ok'}
            subtext="Expiring within 7 days"
            actionLabel={criticalCertExpiry > 0 ? 'View certs' : undefined}
            onAction={() => router.push('/crew/certifications')}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <PriorityStatCard
            title="Certs Expiring Soon"
            value={warningCertExpiry}
            status={warningCertExpiry > 0 ? 'warning' : 'ok'}
            subtext="Within 30 days"
            actionLabel={warningCertExpiry > 0 ? 'Schedule renewal' : undefined}
            onAction={() => router.push('/crew/certifications')}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <PriorityStatCard
            title="Active Crew"
            value={dashboard.summary.totalCrew}
            status="info"
            subtext={`${dashboard.summary.compliantVessels}/${dashboard.summary.totalVessels} vessels ready`}
          />
        </Col>
      </Row>

      {/* ── TIER 3: Compliance rate meters ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${safeManningPct >= 100 ? 'rgba(82,196,26,0.3)' : safeManningPct >= 80 ? 'rgba(250,173,20,0.3)' : 'rgba(255,77,79,0.3)'}`,
            }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              Safe Manning Compliance
            </Text>
            <Text style={{ color: '#e6f7ff', fontSize: 11, display: 'block', marginBottom: 8 }}>
              BMA R106 / MN-018
            </Text>
            <Progress
              percent={Math.round(safeManningPct)}
              strokeColor={safeManningPct >= 100 ? '#52c41a' : safeManningPct >= 80 ? '#faad14' : '#ff4d4f'}
              trailColor="rgba(255,255,255,0.08)"
              format={(p) => (
                <span style={{ color: safeManningPct >= 100 ? '#52c41a' : safeManningPct >= 80 ? '#faad14' : '#ff4d4f' }}>
                  {p}%
                </span>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${certValidityPct >= 95 ? 'rgba(82,196,26,0.3)' : certValidityPct >= 80 ? 'rgba(250,173,20,0.3)' : 'rgba(255,77,79,0.3)'}`,
            }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              Certificate Validity Rate
            </Text>
            <Text style={{ color: '#e6f7ff', fontSize: 11, display: 'block', marginBottom: 8 }}>
              STCW / BMA Endorsements
            </Text>
            <Progress
              percent={Math.round(certValidityPct)}
              strokeColor={certValidityPct >= 95 ? '#52c41a' : certValidityPct >= 80 ? '#faad14' : '#ff4d4f'}
              trailColor="rgba(255,255,255,0.08)"
              format={(p) => (
                <span style={{ color: certValidityPct >= 95 ? '#52c41a' : certValidityPct >= 80 ? '#faad14' : '#ff4d4f' }}>
                  {p}%
                </span>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* ── TIER 4: Per-vessel readiness ── */}
      {dashboard.vessels && <VesselReadinessList vessels={dashboard.vessels} />}
    </div>
  );
}

interface VesselReadiness {
  vesselId: string;
  vesselName: string;
  route: string;
  assignedCrew: number;
  requiredCrew: number;
  readinessStatus: 'BLOCKED' | 'WARNING' | 'READY';
  blockers: string[];
}

interface DashboardData {
  summary: {
    totalVessels: number;
    compliantVessels: number;
    expiringCertifications: number;
    totalCrew: number;
    nonCompliantAlertsCount: number;
  };
  metrics: {
    safeManningCompliance: number;
    certificateValidityRate: number;
    auditTrailCoverage: number;
  };
  alerts: Array<{ id: string; severity: 'critical' | 'warning' | 'info'; message: string }>;
  vessels?: VesselReadiness[];
}
```

---

## API — Add Vessel Readiness to Dashboard Response

```typescript
// apps/api/src/modules/compliance/compliance.service.ts

// Add to getDashboard() response:

const vesselReadiness = await Promise.all(
  vessels.map(async (vessel) => {
    const manningResult = await this.safeManningEngine.validateVesselManning(vessel.id);
    const certResult = await this.vesselCertService.isVesselCertificateCompliant(vessel.id);

    const blockers: string[] = [
      ...manningResult.deficiencies.map((d) => `Manning: ${d.role} shortfall`),
      ...certResult.blockers,
    ];

    return {
      vesselId: vessel.id,
      vesselName: vessel.name,
      route: vessel.defaultRoute ?? 'Nassau ↔ Freeport',
      assignedCrew: await this.getAssignedCrewCount(vessel.id),
      requiredCrew: await this.getRequiredCrewCount(vessel.id),
      readinessStatus:
        blockers.length > 0 ? 'BLOCKED' :
        manningResult.warnings.length > 0 ? 'WARNING' :
        'READY',
      blockers,
    };
  }),
);
```

---

## Notes

- The `PriorityStatCard` component renders zero items at `status: 'ok'` with green styling and no action button — the user gets positive confirmation without clutter.
- Do not add more statistics to this page. The value is in removing noise, not adding signal.
- The vessel readiness list is the single most important thing for operations staff — it should be the first scrollable item below the priority cards on mobile.
