'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, StatCard } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Field,
  SelectField,
  TerminalModal,
  termInputCls,
  termSectionCls,
} from '@/components/ui/TerminalModal';
import { TerminalTable } from '@/components/ui/TerminalTable';
import { api } from '@/lib/api';
import { useCanAccess } from '@/lib/auth/roles';
import { ColumnDef } from '@tanstack/react-table';
import {
  Lock,
  Phone,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

/* ── Types ───────────────────────────────────────────────── */
interface CrewMember {
  id: string;
  fullName?: string;
  rank?: string;
  vesselName?: string;
  status?: string;
  certifications?: Array<{ expirationDate?: string }>;
}

interface OnboardForm {
  givenNames: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
  gender: string;
  passportNumber: string;
  passportExpiryDate: string;
  seamanBookNumber: string;
  passportIssuingCountry: string;
  role: string;
  vesselId: string;
}

const INITIAL_FORM: OnboardForm = {
  givenNames: '',
  familyName: '',
  dateOfBirth: '',
  nationality: 'Bahamian',
  gender: 'MALE',
  passportNumber: '',
  passportExpiryDate: '',
  seamanBookNumber: '',
  passportIssuingCountry: 'BHS',
  role: 'DECK_OFFICER',
  vesselId: '',
};

/* ── Compliance progress bar ──────────────────────────────── */
function ComplianceBar({ crew }: { crew: CrewMember }) {
  const expiringCount =
    crew.certifications?.filter((c) => {
      if (!c.expirationDate) return false;
      const d = new Date(c.expirationDate);
      if (isNaN(d.getTime())) return false;
      return d.getTime() < Date.now() + 30 * 24 * 60 * 60 * 1000;
    }).length ?? 0;

  const compliant = expiringCount === 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="h-1 w-full bg-[rgba(51,255,51,0.08)]">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: compliant ? '100%' : '80%',
            background: compliant ? '#33FF33' : '#FF4B2B',
          }}
        />
      </div>
      <span
        className="font-mono text-[10px]"
        style={{ color: compliant ? '#33FF33' : '#FF4B2B' }}
      >
        {compliant ? 'FULLY COMPLIANT' : `${expiringCount} EXPIRING`}
      </span>
    </div>
  );
}

/* ── Table columns ───────────────────────────────────────── */
function buildColumns(onContact: (c: CrewMember) => void): ColumnDef<CrewMember, any>[] {
  return [
    {
      accessorKey: 'fullName',
      header: 'Crew Identity',
      cell: ({ getValue, row }) => {
        const name = getValue<string>() || 'Unknown';
        const initial = name.charAt(0).toUpperCase();
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[rgba(51,255,51,0.1)] flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-[11px] text-[#33FF33] font-semibold">{initial}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[12px] text-[rgba(51,255,51,0.8)]">{name}</span>
              <span className="font-mono text-[10px] text-[rgba(51,255,51,0.3)]">
                ID:{row.original.id.slice(0, 8)}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'rank',
      header: 'Rank / Role',
      cell: ({ getValue }) => (
        <span className="font-mono text-[10px] px-2 py-0.5 border border-[rgba(0,255,255,0.3)] text-[#00FFFF] bg-[rgba(0,255,255,0.05)] tracking-wider uppercase">
          {getValue<string>() ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'vesselName',
      header: 'Assigned Vessel',
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] text-[rgba(51,255,51,0.6)]">
          {getValue<string>() || <span className="text-[rgba(51,255,51,0.25)]">Unassigned</span>}
        </span>
      ),
    },
    {
      id: 'compliance',
      header: 'Compliance',
      enableSorting: false,
      cell: ({ row }) => <ComplianceBar crew={row.original} />,
    },
    {
      accessorKey: 'status',
      header: 'Duty Status',
      cell: ({ getValue }) => {
        const s = getValue<string>();
        const map: Record<string, { status: any; label: string }> = {
          ACTIVE: { status: 'ok', label: 'On Duty' },
          ON_LEAVE: { status: 'warning', label: 'On Leave' },
          OFF_DUTY: { status: 'muted', label: 'Off Duty' },
        };
        const cfg = map[s] ?? { status: 'warning', label: s };
        return <StatusBadge status={cfg.status} label={cfg.label} compact />;
      },
    },
    {
      id: 'action',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            icon={<Phone size={11} />}
            onClick={() => onContact(row.original)}
            aria-label="Contact crew member"
          />
          <Button variant="outline" size="sm">
            Profile
          </Button>
        </div>
      ),
    },
  ];
}

/* ── Page ─────────────────────────────────────────────────── */
export default function CrewPage() {
  const canAccessPage = useCanAccess('crew.view');
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [vessels, setVessels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedCrew, setSelectedCrew] = useState<CrewMember | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dashboard, setDashboard] = useState<any | null>(null);
  const [form, setForm] = useState<OnboardForm>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof OnboardForm, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchCrew = useCallback(async () => {
    setLoading(true);
    const [crewResult, dashResult, vesselResult] = await Promise.all([
      api.crew.list(),
      api.compliance.dashboard(),
      api.vessels.list({ pageSize: 100 }),
    ]);
    if (crewResult.data) setCrew(crewResult.data.items || []);
    if (dashResult.data) setDashboard(dashResult.data);
    if (vesselResult.data) setVessels(vesselResult.data.items || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCrew(); }, [fetchCrew]);

  /* ── Onboard form validation ── */
  const validateForm = (): boolean => {
    const errs: Partial<Record<keyof OnboardForm, string>> = {};
    if (!form.givenNames.trim()) errs.givenNames = 'Required';
    if (!form.familyName.trim()) errs.familyName = 'Required';
    if (!form.dateOfBirth) errs.dateOfBirth = 'Required';
    if (!form.passportNumber.trim()) errs.passportNumber = 'Required';
    if (!form.passportExpiryDate) errs.passportExpiryDate = 'Required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOnboard = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    setSubmitError(null);
    const { error } = await api.crew.create(form);
    if (error) {
      setSubmitError(typeof error === 'string' ? error : 'Failed to onboard crew member');
    } else {
      setSubmitSuccess(true);
      setOnboardOpen(false);
      setForm(INITIAL_FORM);
      setFormErrors({});
      fetchCrew();
    }
    setSubmitting(false);
  };

  const handleContact = (member: CrewMember) => {
    setSelectedCrew(member);
    setContactOpen(true);
  };

  const columns = buildColumns(handleContact);

  const filteredCrew = crew.filter(
    (c) =>
      c.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      c.rank?.toLowerCase().includes(searchText.toLowerCase()) ||
      c.vesselName?.toLowerCase().includes(searchText.toLowerCase())
  );

  const activeCount = crew.filter((c) => c.status === 'ACTIVE').length;
  const expiringTotal = crew.filter((c) =>
    c.certifications?.some((cert) => {
      const d = new Date(cert.expirationDate ?? '');
      return !isNaN(d.getTime()) && d.getTime() < Date.now() + 30 * 24 * 60 * 60 * 1000;
    })
  ).length;

  /* ── RBAC gate ── */
  if (!canAccessPage) {
    return (
      <DashboardLayout contentClassName="p-6 flex items-center justify-center">
        <Card className="max-w-lg w-full">
          <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
            <Lock size={40} className="text-[rgba(51,255,51,0.2)]" />
            <h2 className="font-mono text-[13px] uppercase tracking-[0.1em] text-[#33FF33]">
              Crew Registry Restricted
            </h2>
            <p className="font-mono text-[11px] text-[rgba(51,255,51,0.45)] max-w-xs">
              Access to crew documents and duty rosters is restricted to authorized personnel.
              Contact your department head for access clearance.
            </p>
            <Button variant="ghost" onClick={() => window.history.back()}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout contentClassName="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-mono text-[15px] tracking-[0.06em] uppercase text-[#33FF33] font-semibold flex items-center gap-2">
            <Users size={16} aria-hidden />
            Crew Operations
          </h1>
          <p className="font-mono text-[11px] text-[rgba(51,255,51,0.4)]">
            {crew.length} maritime professionals across Grand Bahama fleet
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={<Plus size={12} />}
          onClick={() => setOnboardOpen(true)}
        >
          Onboard Crew
        </Button>
      </div>

      {submitSuccess && (
        <div className="mb-6 px-4 py-3 border border-[rgba(51,255,51,0.4)] bg-[rgba(51,255,51,0.06)] flex items-center justify-between">
          <span className="font-mono text-[11px] text-[#33FF33]">Crew member onboarded successfully.</span>
          <button className="font-mono text-[10px] text-[rgba(51,255,51,0.4)] hover:text-[#33FF33]" onClick={() => setSubmitSuccess(false)}>DISMISS</button>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="WATCH DISTRIBUTION"
          value={`${activeCount} / ${crew.length}`}
          status="ok"
          sub={
            crew.length > 0 ? (
              <div className="h-1 w-full bg-[rgba(51,255,51,0.08)] mt-1">
                <div
                  className="h-full bg-[#33FF33]"
                  style={{ width: `${(activeCount / crew.length) * 100}%` }}
                />
              </div>
            ) : null
          }
        />
        <StatCard
          label="CERTIFICATION HEALTH"
          value={`${expiringTotal} Expiring`}
          status={expiringTotal > 0 ? 'warning' : 'ok'}
          sub={
            <span className="font-mono text-[10px]" style={{ color: expiringTotal > 0 ? '#FFB000' : 'rgba(51,255,51,0.4)' }}>
              {expiringTotal > 0 ? 'ACTION REQUIRED WITHIN 30 DAYS' : 'ALL CERTIFICATIONS CURRENT'}
            </span>
          }
        />
        <StatCard
          label="SAFE MANNING"
          value={`${(dashboard?.metrics?.safeManningCompliance ?? 100).toFixed(0)}%`}
          status={(dashboard?.metrics?.safeManningCompliance ?? 100) >= 100 ? 'ok' : 'warning'}
          sub={
            <span className="font-mono text-[10px] text-[rgba(51,255,51,0.4)]">
              {dashboard?.summary?.compliantVessels ?? '—'}/{dashboard?.summary?.totalVessels ?? '—'} VESSELS · BMA R106
            </span>
          }
        />
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(51,255,51,0.3)]" aria-hidden />
        <input
          className={`${termInputCls} pl-9 w-full`}
          placeholder="SEARCH BY NAME, RANK OR VESSEL..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* Crew table */}
      <Card>
        <CardHeader
          action={
            <span className="font-mono text-[10px] text-[rgba(51,255,51,0.4)] tracking-widest">
              {filteredCrew.length} RECORDS
            </span>
          }
        >
          <span className="flex items-center gap-2">
            <Shield size={13} />
            CREW REGISTRY
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <TerminalTable
            data={filteredCrew}
            columns={columns}
            loading={loading}
            rowKey={(r) => r.id}
            emptyMessage="NO CREW MEMBERS MATCH YOUR SEARCH"
          />
        </CardContent>
      </Card>

      {/* ── Onboard modal ── */}
      <TerminalModal
        open={onboardOpen}
        onClose={() => { setOnboardOpen(false); setForm(INITIAL_FORM); setFormErrors({}); setSubmitError(null); }}
        title="Onboard New Crew Member"
        width={720}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOnboardOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOnboard}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Onboard Crew Member'}
            </Button>
          </>
        }
      >
        {submitError && (
          <div className="mb-4 px-3 py-2 border border-[rgba(255,75,43,0.4)] bg-[rgba(255,75,43,0.06)]">
            <span className="font-mono text-[11px] text-[#FF4B2B]">{submitError}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Field
            label="Given Names *"
            placeholder="e.g. John Albert"
            value={form.givenNames}
            onChange={(e) => setForm((f) => ({ ...f, givenNames: e.target.value }))}
            error={formErrors.givenNames}
          />
          <Field
            label="Family Name *"
            placeholder="e.g. Smith"
            value={form.familyName}
            onChange={(e) => setForm((f) => ({ ...f, familyName: e.target.value }))}
            error={formErrors.familyName}
          />
          <Field
            label="Date of Birth *"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
            error={formErrors.dateOfBirth}
          />
          <Field
            label="Nationality"
            placeholder="e.g. Bahamian"
            value={form.nationality}
            onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))}
          />
          <SelectField
            label="Gender"
            value={form.gender}
            onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
            options={[
              { label: 'Male', value: 'MALE' },
              { label: 'Female', value: 'FEMALE' },
              { label: 'Other', value: 'OTHER' },
            ]}
          />

          <p className={`${termSectionCls} col-span-2`}>TRAVEL DOCUMENTS</p>

          <Field
            label="Passport Number *"
            placeholder="e.g. P1234567"
            value={form.passportNumber}
            onChange={(e) => setForm((f) => ({ ...f, passportNumber: e.target.value }))}
            error={formErrors.passportNumber}
          />
          <Field
            label="Passport Expiry *"
            type="date"
            value={form.passportExpiryDate}
            onChange={(e) => setForm((f) => ({ ...f, passportExpiryDate: e.target.value }))}
            error={formErrors.passportExpiryDate}
          />
          <Field
            label="Seaman Book No."
            placeholder="e.g. SB998877"
            value={form.seamanBookNumber}
            onChange={(e) => setForm((f) => ({ ...f, seamanBookNumber: e.target.value }))}
          />
          <Field
            label="Issuing Country (ISO)"
            placeholder="BHS"
            maxLength={3}
            value={form.passportIssuingCountry}
            onChange={(e) => setForm((f) => ({ ...f, passportIssuingCountry: e.target.value }))}
          />

          <p className={`${termSectionCls} col-span-2`}>ASSIGNMENT</p>

          <SelectField
            label="Rank / Role *"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            options={[
              { label: 'Master / Captain', value: 'MASTER' },
              { label: 'Chief Officer', value: 'CHIEF_OFFICER' },
              { label: 'Deck Officer', value: 'DECK_OFFICER' },
              { label: 'Chief Engineer', value: 'CHIEF_ENGINEER' },
              { label: 'Engineer Officer', value: 'ENGINEER_OFFICER' },
              { label: 'Rating', value: 'RATING' },
              { label: 'Cook / Steward', value: 'COOK_STEWARD' },
            ]}
          />
          <SelectField
            label="Assign to Vessel"
            value={form.vesselId}
            onChange={(e) => setForm((f) => ({ ...f, vesselId: e.target.value }))}
            options={[
              { label: 'Unassigned', value: '' },
              ...vessels.map((v) => ({ label: v.name, value: v.id })),
            ]}
          />
        </div>
      </TerminalModal>

      {/* ── Contact modal ── */}
      <TerminalModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        title="Establish Secure Link"
        width={400}
        footer={
          <Button variant="danger" size="sm" onClick={() => setContactOpen(false)}>
            End Secure Call
          </Button>
        }
      >
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-16 h-16 bg-[rgba(51,255,51,0.1)] flex items-center justify-center">
            <span className="font-mono text-2xl text-[#33FF33] font-semibold">
              {(selectedCrew?.fullName ?? '?').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="text-center">
            <p className="font-mono text-[14px] text-[#33FF33] font-semibold">
              {selectedCrew?.fullName}
            </p>
            <p className="font-mono text-[11px] text-[rgba(51,255,51,0.4)] mt-0.5">
              {selectedCrew?.rank}
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border border-[rgba(0,255,255,0.3)] bg-[rgba(0,255,255,0.04)]">
            <ShieldCheck size={12} className="text-[#00FFFF]" />
            <span className="font-mono text-[10px] text-[#00FFFF] tracking-widest">
              ENCRYPTED VOICE LINK ACTIVE
            </span>
          </div>
        </div>
      </TerminalModal>
    </DashboardLayout>
  );
}
