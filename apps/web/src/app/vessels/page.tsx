'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TerminalModal, Field, SelectField, termInputCls } from '@/components/ui/TerminalModal';
import { TerminalTable } from '@/components/ui/TerminalTable';
import { api } from '@/lib/api';
import { useCanAccess } from '@/lib/auth/roles';
import { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, Anchor, FileText, Globe, LayoutGrid, List, Lock, Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

/* ── Status helpers ──────────────────────────────────────── */
function statusConfig(status: string) {
  if (status === 'ACTIVE')
    return { label: 'IN SERVICE', color: '#33FF33', border: 'rgba(51,255,51,0.4)', bg: 'rgba(51,255,51,0.06)' };
  if (status === 'UNDER_MAINTENANCE')
    return { label: 'MAINTENANCE', color: '#FFB000', border: 'rgba(255,176,0,0.4)', bg: 'rgba(255,176,0,0.06)' };
  return { label: 'OUT OF SERVICE', color: '#FF4B2B', border: 'rgba(255,75,43,0.4)', bg: 'rgba(255,75,43,0.06)' };
}

/* ── List columns ─────────────────────────────────────────── */
const listColumns: ColumnDef<any, any>[] = [
  {
    id: 'identity',
    header: 'Vessel Identity',
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-[12px] text-[#33FF33] font-semibold">{row.original.name}</span>
        <span className="font-mono text-[10px] text-[rgba(51,255,51,0.4)]">IMO: {row.original.imoNumber}</span>
      </div>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Class/Type',
    cell: ({ getValue }) => (
      <span className="font-mono text-[10px] px-2 py-0.5 border border-[rgba(0,255,255,0.3)] text-[#00FFFF] bg-[rgba(0,255,255,0.04)]">
        {String(getValue<string>()).replace(/_/g, ' ')}
      </span>
    ),
  },
  {
    accessorKey: 'flagState',
    header: 'Flag State',
    cell: ({ getValue }) => (
      <span className="font-mono text-[11px] text-[rgba(51,255,51,0.7)]">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: 'grossTonnage',
    header: 'GT',
    cell: ({ getValue }) => (
      <span className="font-mono text-[12px] tabular-nums text-[rgba(51,255,51,0.7)]">
        {(getValue<number>() ?? 0).toLocaleString()}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const { label, color, border, bg } = statusConfig(getValue<string>());
      return (
        <span className="font-mono text-[10px] px-2 py-0.5 border tracking-widest"
          style={{ color, borderColor: border, background: bg }}>
          {label}
        </span>
      );
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className="flex gap-2">
        <a href={`/vessels/${row.original.id}`}
          className="font-mono text-[10px] text-[#00FFFF] hover:text-[rgba(0,255,255,0.7)] tracking-widest transition-colors">
          DASHBOARD
        </a>
        <a href={`/vessels/${row.original.id}/documents`}
          className="font-mono text-[10px] text-[rgba(51,255,51,0.5)] hover:text-[#33FF33] tracking-widest transition-colors">
          DOCS
        </a>
      </div>
    ),
  },
];

/* ── Grid card ───────────────────────────────────────────── */
function VesselCard({ vessel }: { vessel: any }) {
  const { label, color, border } = statusConfig(vessel.status);
  return (
    <div className="border border-[rgba(51,255,51,0.15)] bg-[#050505] p-4 flex flex-col gap-3"
      style={{ borderLeftColor: color, borderLeftWidth: '3px' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[13px] text-[#33FF33] font-semibold">{vessel.name}</span>
          <span className="font-mono text-[10px] text-[rgba(51,255,51,0.4)]">IMO: {vessel.imoNumber}</span>
        </div>
        <span className="font-mono text-[9px] px-1.5 py-0.5 border tracking-widest flex-shrink-0"
          style={{ color, borderColor: border, background: `${color}0d` }}>
          {label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-[rgba(51,255,51,0.06)] pt-3">
        {[
          ['TYPE', String(vessel.type ?? '').replace(/_/g, ' ')],
          ['FLAG', vessel.flagState],
          ['GT', (vessel.grossTonnage ?? 0).toLocaleString()],
          ['BUILT', vessel.yearBuilt ?? '—'],
        ].map(([lbl, val]) => (
          <div key={lbl} className="flex flex-col gap-0.5">
            <span className="font-mono text-[9px] tracking-[0.15em] text-[rgba(51,255,51,0.3)]">{lbl}</span>
            <span className="font-mono text-[11px] text-[rgba(51,255,51,0.8)]">{val}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-t border-[rgba(51,255,51,0.06)] pt-3">
        <a href={`/vessels/${vessel.id}/documents`}
          className="flex items-center gap-1 font-mono text-[10px] text-[rgba(51,255,51,0.5)] hover:text-[#33FF33] transition-colors tracking-widest">
          <FileText size={11} />DOCS
        </a>
        <a href={`/vessels/${vessel.id}`}
          className="ml-auto flex items-center gap-1 font-mono text-[10px] text-[#00FFFF] hover:text-[rgba(0,255,255,0.7)] transition-colors tracking-widest">
          <Globe size={11} />FLEET OPS
        </a>
      </div>
    </div>
  );
}

/* ── Register form ───────────────────────────────────────── */
interface RegisterForm {
  name: string;
  imoNumber: string;
  type: string;
  flagState: string;
  portOfRegistry: string;
  grossTonnage: string;
  netTonnage: string;
  lengthOverall: string;
  yearBuilt: string;
}

const INITIAL_FORM: RegisterForm = {
  name: '',
  imoNumber: '',
  type: 'PASSENGER_FERRY',
  flagState: 'BHS',
  portOfRegistry: 'Nassau',
  grossTonnage: '',
  netTonnage: '',
  lengthOverall: '',
  yearBuilt: '',
};

/* ── RBAC gate ───────────────────────────────────────────── */
function AccessDenied() {
  return (
    <DashboardLayout contentClassName="p-4 md:p-6 flex items-center justify-center">
      <div className="max-w-md w-full border border-[rgba(51,255,51,0.15)] bg-[#050505] px-8 py-12 flex flex-col items-center gap-6 text-center">
        <div className="w-16 h-16 border-2 border-[rgba(51,255,51,0.2)] flex items-center justify-center">
          <Lock size={28} className="text-[rgba(51,255,51,0.5)]" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="font-mono text-[13px] tracking-[0.12em] uppercase text-[#33FF33]">
            Registry Access Restricted
          </h2>
          <p className="font-mono text-[11px] text-[rgba(51,255,51,0.45)] leading-relaxed">
            Fleet registry and vessel status data is reserved for authorized operational staff.
            Authenticate with a higher clearance role to view the registry.
          </p>
        </div>
        <Button variant="ghost" onClick={() => window.history.back()}>Return to Dashboard</Button>
      </div>
    </DashboardLayout>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function VesselsPage() {
  const canAccess = useCanAccess('vessels.view');
  const [vessels, setVessels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<RegisterForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterForm, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchVessels = useCallback(async () => {
    setLoading(true);
    const { data } = await api.vessels.list();
    setVessels(data?.items ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchVessels(); }, [fetchVessels]);

  if (!canAccess) return <AccessDenied />;

  const filtered = vessels.filter(
    (v) =>
      v.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      v.imoNumber?.toLowerCase().includes(searchText.toLowerCase())
  );

  function field(key: keyof RegisterForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }

  function validate(): boolean {
    const e: Partial<Record<keyof RegisterForm, string>> = {};
    if (!form.name) e.name = 'Vessel name required';
    if (!form.imoNumber) e.imoNumber = 'IMO number required';
    if (!form.type) e.type = 'Select vessel type';
    if (!form.grossTonnage || isNaN(Number(form.grossTonnage))) e.grossTonnage = 'Enter gross tonnage';
    if (!form.netTonnage || isNaN(Number(form.netTonnage))) e.netTonnage = 'Enter net tonnage';
    if (!form.lengthOverall || isNaN(Number(form.lengthOverall))) e.lengthOverall = 'Enter LOA';
    if (!form.yearBuilt || isNaN(Number(form.yearBuilt))) e.yearBuilt = 'Enter year built';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    const { error } = await api.vessels.create({
      ...form,
      grossTonnage: Number(form.grossTonnage),
      netTonnage: Number(form.netTonnage),
      lengthOverall: Number(form.lengthOverall),
      yearBuilt: Number(form.yearBuilt),
      status: 'ACTIVE',
    });
    setSubmitting(false);
    if (error) {
      setSubmitError(String(error));
    } else {
      setModalOpen(false);
      setForm(INITIAL_FORM);
      setErrors({});
      fetchVessels();
    }
  }

  return (
    <DashboardLayout contentClassName="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-mono text-[15px] tracking-[0.06em] uppercase text-[#33FF33] font-semibold flex items-center gap-2">
            <Anchor size={16} aria-hidden />
            Fleet Registry
          </h1>
          <p className="font-mono text-[11px] text-[rgba(51,255,51,0.4)]">
            {vessels.length} vessel{vessels.length !== 1 ? 's' : ''} · Grand Bahama routes
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex border border-[rgba(51,255,51,0.2)]">
            <button
              className={`px-3 py-2 font-mono text-[10px] tracking-widest transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[rgba(51,255,51,0.1)] text-[#33FF33]'
                  : 'text-[rgba(51,255,51,0.4)] hover:text-[#33FF33]'
              }`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={13} aria-label="Grid view" />
            </button>
            <button
              className={`px-3 py-2 font-mono text-[10px] tracking-widest transition-colors border-l border-[rgba(51,255,51,0.2)] ${
                viewMode === 'list'
                  ? 'bg-[rgba(51,255,51,0.1)] text-[#33FF33]'
                  : 'text-[rgba(51,255,51,0.4)] hover:text-[#33FF33]'
              }`}
              onClick={() => setViewMode('list')}
            >
              <List size={13} aria-label="List view" />
            </button>
          </div>
          <Button icon={<Plus size={13} />} onClick={() => setModalOpen(true)}>
            Register Vessel
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(51,255,51,0.3)]" />
        <input
          type="text"
          placeholder="Search by vessel name or IMO number..."
          className={`${termInputCls} pl-8`}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* Grid / List */}
      {viewMode === 'grid' ? (
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-[rgba(51,255,51,0.06)] bg-[#050505] p-4 h-40 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Anchor size={40} className="text-[rgba(51,255,51,0.1)]" />
            <p className="font-mono text-[11px] text-[rgba(51,255,51,0.25)] tracking-widest">
              {searchText ? '— NO VESSELS MATCHING SEARCH —' : '— NO VESSELS REGISTERED —'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((v) => <VesselCard key={v.id} vessel={v} />)}
          </div>
        )
      ) : (
        <Card>
          <CardHeader>
            <span className="flex items-center gap-2">
              <List size={13} />
              VESSEL REGISTRY
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <TerminalTable
              data={filtered}
              columns={listColumns}
              loading={loading}
              rowKey={(r) => r.id}
              emptyMessage="NO VESSELS REGISTERED"
            />
          </CardContent>
        </Card>
      )}

      {/* Register modal */}
      <TerminalModal
        open={modalOpen}
        title="REGISTER NEW VESSEL"
        onClose={() => { setModalOpen(false); setForm(INITIAL_FORM); setErrors({}); setSubmitError(null); }}
        footer={
          <div className="flex items-center gap-3">
            {submitError && (
              <span className="font-mono text-[11px] text-[#FF4B2B] flex items-center gap-1">
                <AlertTriangle size={11} />
                {submitError}
              </span>
            )}
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleRegister} disabled={submitting}>
              {submitting ? 'Registering...' : 'Register Vessel'}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Vessel Name"
              required
              error={errors.name}
              placeholder="e.g. Grand Bahama Express"
              value={form.name}
              onChange={(e) => field('name', e.target.value)}
            />
            <Field
              label="IMO Number"
              required
              error={errors.imoNumber}
              placeholder="e.g. IMO9876543"
              value={form.imoNumber}
              onChange={(e) => field('imoNumber', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <SelectField
              label="Vessel Type"
              required
              error={errors.type}
              value={form.type}
              onChange={(e) => field('type', e.target.value)}
            >
              {[
                ['PASSENGER_FERRY', 'Passenger Ferry'],
                ['RO_RO_PASSENGER', 'Ro-Ro Passenger'],
                ['HIGH_SPEED_CRAFT', 'High Speed Craft'],
                ['CARGO', 'Cargo'],
                ['TANKER', 'Tanker'],
                ['OTHER', 'Other'],
              ].map(([v, l]) => (
                <option key={v} value={v} className="bg-[#050505]">{l}</option>
              ))}
            </SelectField>
            <Field
              label="Flag State"
              placeholder="BHS"
              value={form.flagState}
              onChange={(e) => field('flagState', e.target.value)}
            />
            <Field
              label="Port of Registry"
              placeholder="Nassau"
              value={form.portOfRegistry}
              onChange={(e) => field('portOfRegistry', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <Field
              label="Gross Tonnage"
              type="number"
              required
              error={errors.grossTonnage}
              placeholder="0"
              value={form.grossTonnage}
              onChange={(e) => field('grossTonnage', e.target.value)}
            />
            <Field
              label="Net Tonnage"
              type="number"
              required
              error={errors.netTonnage}
              placeholder="0"
              value={form.netTonnage}
              onChange={(e) => field('netTonnage', e.target.value)}
            />
            <Field
              label="Length (LOA m)"
              type="number"
              required
              error={errors.lengthOverall}
              placeholder="0.0"
              value={form.lengthOverall}
              onChange={(e) => field('lengthOverall', e.target.value)}
            />
            <Field
              label="Year Built"
              type="number"
              required
              error={errors.yearBuilt}
              placeholder={String(new Date().getFullYear())}
              value={form.yearBuilt}
              onChange={(e) => field('yearBuilt', e.target.value)}
            />
          </div>
        </div>
      </TerminalModal>
    </DashboardLayout>
  );
}
