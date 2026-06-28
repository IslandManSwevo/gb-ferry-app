'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TerminalModal, Field, SelectField, termInputCls } from '@/components/ui/TerminalModal';
import { TerminalTable } from '@/components/ui/TerminalTable';
import { api } from '@/lib/api/client';
import { useCanAccess } from '@/lib/auth/roles';
import { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, CheckCircle, Lock, Plus, ShieldCheck, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

/* ── Result config ───────────────────────────────────────── */
function resultConfig(result: string) {
  if (result === 'PASSED')
    return { label: 'PASSED', color: '#33FF33', border: 'rgba(51,255,51,0.4)', bg: 'rgba(51,255,51,0.06)', Icon: CheckCircle };
  if (result === 'PASSED_WITH_OBSERVATIONS')
    return { label: 'PASSED W/OBS', color: '#FFB000', border: 'rgba(255,176,0,0.4)', bg: 'rgba(255,176,0,0.06)', Icon: CheckCircle };
  return { label: 'FAILED', color: '#FF4B2B', border: 'rgba(255,75,43,0.4)', bg: 'rgba(255,75,43,0.06)', Icon: XCircle };
}

/* ── Columns ─────────────────────────────────────────────── */
const columns: ColumnDef<any, any>[] = [
  {
    accessorKey: 'id',
    header: 'Inspection ID',
    cell: ({ getValue }) => (
      <span className="font-mono text-[11px] text-[#00FFFF] tabular-nums">{String(getValue<string>()).slice(0, 8).toUpperCase()}</span>
    ),
  },
  {
    id: 'vessel',
    header: 'Vessel',
    cell: ({ row }) => (
      <span className="font-mono text-[12px] text-[rgba(51,255,51,0.8)]">
        {row.original.vessel?.name ?? row.original.vesselId ?? 'N/A'}
      </span>
    ),
  },
  {
    accessorKey: 'authority',
    header: 'Authority',
    cell: ({ getValue }) => (
      <span className="font-mono text-[11px] text-[rgba(51,255,51,0.7)]">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: 'inspectionDate',
    header: 'Date',
    cell: ({ getValue }) => {
      const v = getValue<string>();
      return (
        <span className="font-mono text-[11px] text-[rgba(51,255,51,0.6)] tabular-nums">
          {v ? new Date(v).toLocaleDateString() : 'N/A'}
        </span>
      );
    },
  },
  {
    accessorKey: 'result',
    header: 'Result',
    cell: ({ getValue }) => {
      const r = getValue<string>();
      const { label, color, border, bg, Icon } = resultConfig(r);
      return (
        <span
          className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 border tracking-widest"
          style={{ color, borderColor: border, background: bg }}
        >
          <Icon size={10} />
          {label}
        </span>
      );
    },
  },
  {
    accessorKey: 'deficienciesCount',
    header: 'Deficiencies',
    cell: ({ getValue }) => {
      const n = getValue<number>() ?? 0;
      return (
        <span className="font-mono text-[12px] tabular-nums" style={{ color: n > 0 ? '#FF4B2B' : 'rgba(51,255,51,0.4)' }}>
          {n}
        </span>
      );
    },
  },
];

/* ── Form state ──────────────────────────────────────────── */
interface InspectionForm {
  vesselId: string;
  authority: string;
  inspectionDate: string;
  result: string;
  deficienciesCount: number;
  notes: string;
}

const INITIAL: InspectionForm = {
  vesselId: '',
  authority: '',
  inspectionDate: new Date().toISOString().slice(0, 10),
  result: '',
  deficienciesCount: 0,
  notes: '',
};

/* ── RBAC gate ───────────────────────────────────────────── */
function AccessDenied() {
  return (
    <DashboardLayout contentClassName="p-4 md:p-6 flex items-center justify-center">
      <div className="max-w-md w-full border border-[rgba(255,75,43,0.3)] bg-[rgba(255,75,43,0.04)] px-8 py-12 flex flex-col items-center gap-6 text-center">
        <div className="w-16 h-16 border-2 border-[rgba(255,75,43,0.4)] flex items-center justify-center">
          <Lock size={28} className="text-[#FF4B2B]" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="font-mono text-[13px] tracking-[0.12em] uppercase text-[#FF4B2B]">
            Compliance Access Restricted
          </h2>
          <p className="font-mono text-[11px] text-[rgba(51,255,51,0.45)] leading-relaxed">
            Recording and managing vessel inspections requires regulatory-level clearance.
            Authenticate with a Compliance Officer or Admin role to proceed.
          </p>
        </div>
        <Button variant="ghost" onClick={() => window.history.back()}>Return to Dashboard</Button>
      </div>
    </DashboardLayout>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function InspectionsPage() {
  const canAccess = useCanAccess('inspections.manage');
  const [inspections, setInspections] = useState<any[]>([]);
  const [vessels, setVessels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<InspectionForm>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof InspectionForm, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchInspections = useCallback(async () => {
    setLoading(true);
    const { data } = await api.inspections.list();
    setInspections(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInspections();
    api.vessels.list({ pageSize: 100 }).then(({ data }) => setVessels(data?.items ?? []));
  }, [fetchInspections]);

  if (!canAccess) return <AccessDenied />;

  function validate(): boolean {
    const e: Partial<Record<keyof InspectionForm, string>> = {};
    if (!form.vesselId) e.vesselId = 'Select a vessel';
    if (!form.authority) e.authority = 'Select an authority';
    if (!form.inspectionDate) e.inspectionDate = 'Select a date';
    if (!form.result) e.result = 'Select a result';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    const { error } = await api.inspections.create({
      vesselId: form.vesselId,
      authority: form.authority,
      inspectionDate: form.inspectionDate,
      result: form.result,
      deficienciesCount: form.deficienciesCount,
      notes: form.notes,
    });
    setSubmitting(false);
    if (error) {
      setSubmitError(String(error));
    } else {
      setModalOpen(false);
      setForm(INITIAL);
      setErrors({});
      await fetchInspections();
    }
  }

  function field(key: keyof InspectionForm, value: string | number) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }

  return (
    <DashboardLayout contentClassName="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-mono text-[15px] tracking-[0.06em] uppercase text-[#33FF33] font-semibold flex items-center gap-2">
            <ShieldCheck size={16} aria-hidden />
            Port State Control Inspections
          </h1>
          <p className="font-mono text-[11px] text-[rgba(51,255,51,0.4)]">
            PSC inspection record · BMA / USCG / MOU authority reporting
          </p>
        </div>
        <Button icon={<Plus size={13} />} onClick={() => setModalOpen(true)}>
          Record Inspection
        </Button>
      </div>

      <Card>
        <CardHeader>
          <span className="flex items-center gap-2">
            <ShieldCheck size={13} />
            INSPECTION LOG
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <TerminalTable
            data={inspections}
            columns={columns}
            loading={loading}
            rowKey={(r) => r.id}
            emptyMessage="NO INSPECTION RECORDS"
          />
        </CardContent>
      </Card>

      {/* Record modal */}
      <TerminalModal
        open={modalOpen}
        title="RECORD PSC INSPECTION"
        onClose={() => { setModalOpen(false); setForm(INITIAL); setErrors({}); setSubmitError(null); }}
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
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Recording...' : 'Record Inspection'}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <SelectField
            label="Vessel"
            required
            error={errors.vesselId}
            value={form.vesselId}
            onChange={(e) => field('vesselId', e.target.value)}
          >
            <option value="" className="bg-[#050505]">Select vessel…</option>
            {vessels.map((v) => (
              <option key={v.id} value={v.id} className="bg-[#050505]">
                {v.name} ({v.imoNumber ?? 'No IMO'})
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Inspection Authority"
            required
            error={errors.authority}
            value={form.authority}
            onChange={(e) => field('authority', e.target.value)}
          >
            <option value="" className="bg-[#050505]">Select authority…</option>
            {[
              'Bahamas Maritime Authority',
              'US Coast Guard',
              'Transport Canada',
              'UK Maritime & Coastguard Agency',
              'Paris MOU',
              'Tokyo MOU',
            ].map((a) => (
              <option key={a} value={a} className="bg-[#050505]">{a}</option>
            ))}
          </SelectField>

          <Field
            label="Inspection Date"
            type="date"
            required
            error={errors.inspectionDate}
            value={form.inspectionDate}
            onChange={(e) => field('inspectionDate', e.target.value)}
          />

          <SelectField
            label="Inspection Result"
            required
            error={errors.result}
            value={form.result}
            onChange={(e) => field('result', e.target.value)}
          >
            <option value="" className="bg-[#050505]">Select result…</option>
            <option value="PASSED" className="bg-[#050505]">Passed</option>
            <option value="PASSED_WITH_OBSERVATIONS" className="bg-[#050505]">Passed with Observations</option>
            <option value="FAILED" className="bg-[#050505]">Failed</option>
          </SelectField>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-[rgba(51,255,51,0.5)]">
              Number of Deficiencies
            </label>
            <input
              type="number"
              min={0}
              className={termInputCls}
              value={form.deficienciesCount}
              onChange={(e) => field('deficienciesCount', Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-[rgba(51,255,51,0.5)]">
              Notes / Observations
            </label>
            <textarea
              rows={4}
              className={`${termInputCls} resize-none`}
              placeholder="Enter any observations, deficiencies, or corrective actions required..."
              value={form.notes}
              onChange={(e) => field('notes', e.target.value)}
            />
          </div>
        </div>
      </TerminalModal>
    </DashboardLayout>
  );
}
