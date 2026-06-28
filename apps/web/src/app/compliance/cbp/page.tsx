'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TerminalModal, SelectField } from '@/components/ui/TerminalModal';
import { TerminalTable } from '@/components/ui/TerminalTable';
import { api } from '@/lib/api';
import { useCanAccess } from '@/lib/auth/roles';
import { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, CheckCircle, FileText, Info, Lock, ShieldCheck, Upload, XCircle } from 'lucide-react';
import { useState } from 'react';
import useSWR from 'swr';

/* ── Column defs ─────────────────────────────────────────── */
const submissionColumns: ColumnDef<any, any>[] = [
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
    accessorKey: 'formType',
    header: 'Form Type',
    cell: ({ getValue }) => (
      <span className="font-mono text-[10px] px-2 py-0.5 border border-[rgba(0,255,255,0.3)] text-[#00FFFF] bg-[rgba(0,255,255,0.04)] tracking-widest">
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const s = getValue<string>();
      const ok = s === 'SUBMITTED';
      return (
        <span
          className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 border tracking-widest"
          style={ok
            ? { color: '#33FF33', borderColor: 'rgba(51,255,51,0.4)', background: 'rgba(51,255,51,0.06)' }
            : { color: '#FF4B2B', borderColor: 'rgba(255,75,43,0.4)', background: 'rgba(255,75,43,0.06)' }}
        >
          {ok ? <CheckCircle size={10} /> : <XCircle size={10} />}
          {s}
        </span>
      );
    },
  },
  {
    accessorKey: 'transmissionId',
    header: 'Transmission ID',
    cell: ({ getValue }) => (
      <code className="font-mono text-[11px] text-[#00FFFF]">{getValue<string>()}</code>
    ),
  },
  {
    accessorKey: 'submittedAt',
    header: 'Submitted At',
    cell: ({ getValue }) => {
      const d = getValue<string>();
      return (
        <span className="font-mono text-[11px] text-[rgba(51,255,51,0.5)] tabular-nums">
          {d ? new Date(d).toLocaleString() : 'N/A'}
        </span>
      );
    },
  },
];

/* ── Page ─────────────────────────────────────────────────── */
export default function CBPCompliancePage() {
  const canSubmit = useCanAccess('cbp.submit');
  const [selectedVessel, setSelectedVessel] = useState('');
  const [formType, setFormType] = useState<'I_418' | 'eNOAD'>('I_418');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: vesselData } = useSWR('vessels', () =>
    api.vessels.list({ pageSize: 100 }).then((r) => r.data?.items ?? [])
  );
  const vessels = vesselData ?? [];

  const { data: submissions = [], mutate: mutateSubmissions } = useSWR(
    'cbp/submissions',
    () => api.cbp.submissions().then((r) => r.data ?? [])
  );

  async function handleSubmit() {
    if (!selectedVessel) {
      setSubmitError('Select a vessel');
      return;
    }
    setLoading(true);
    setSubmitError(null);
    const { data, error } = await api.cbp.submitCrewList(selectedVessel, formType);
    setLoading(false);
    if (error) {
      setSubmitError(String(error));
    } else {
      setModalOpen(false);
      setSelectedVessel('');
      void mutateSubmissions();
    }
  }

  return (
    <DashboardLayout contentClassName="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-mono text-[15px] tracking-[0.06em] uppercase text-[#33FF33] font-semibold flex items-center gap-2">
            <FileText size={16} aria-hidden />
            US CBP Regulatory Reporting
          </h1>
          <p className="font-mono text-[11px] text-[rgba(51,255,51,0.4)]">
            Electronic Notice of Arrival/Departure (eNOAD) · Form I-418 Crew Manifest submissions
          </p>
        </div>
        <Button
          icon={<Upload size={11} />}
          disabled={!canSubmit}
          onClick={() => setModalOpen(true)}
        >
          New Submission
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Submissions table */}
        <Card>
          <CardHeader>
            <span className="flex items-center gap-2">
              <ShieldCheck size={13} />
              RECENT SUBMISSIONS
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <TerminalTable
              data={submissions}
              columns={submissionColumns}
              rowKey={(r) => r.id}
              emptyMessage="NO CBP SUBMISSIONS"
              pagination={{ page: 1, pageSize: 5, total: submissions.length, onChange: () => {} }}
            />
          </CardContent>
        </Card>

        {/* Requirements panel */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <span className="flex items-center gap-2">
                <Info size={13} />
                CBP FILING REQUIREMENTS
              </span>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-2">
              <div className="border border-[rgba(255,176,0,0.2)] bg-[rgba(255,176,0,0.03)] px-3 py-3 flex items-start gap-2">
                <AlertTriangle size={12} className="text-[#FFB000] mt-0.5 flex-shrink-0" />
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] tracking-widest uppercase text-[#FFB000]">Submission Deadlines</span>
                  <p className="font-mono text-[11px] text-[rgba(255,176,0,0.7)] leading-relaxed">
                    eNOAD must be submitted at least 96 hours before arrival in US ports (or before departure if voyage is &lt; 96 hours).
                  </p>
                </div>
              </div>

              <p className="font-mono text-[11px] text-[rgba(51,255,51,0.45)] leading-relaxed">
                All crew must have valid Travel Documents (Passport/Seafarer ID) and Visa information in their profile for successful transmission.
              </p>

              <div className="flex items-center gap-2 pt-1 border-t border-[rgba(51,255,51,0.06)]">
                <ShieldCheck size={12} className="text-[#33FF33]" />
                <span className="font-mono text-[11px] text-[rgba(51,255,51,0.7)]">AES-256 PII Encryption Active</span>
              </div>
            </CardContent>
          </Card>

          {!canSubmit && (
            <div className="border border-[rgba(255,75,43,0.2)] bg-[rgba(255,75,43,0.03)] px-3 py-3 flex items-start gap-2">
              <Lock size={12} className="text-[#FF4B2B] mt-0.5 flex-shrink-0" />
              <p className="font-mono text-[11px] text-[rgba(255,75,43,0.6)] leading-relaxed">
                CBP submission requires Compliance Officer or Admin role.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Submission modal */}
      <TerminalModal
        open={modalOpen}
        title="SUBMIT REGULATORY CREW LIST"
        onClose={() => { setModalOpen(false); setSelectedVessel(''); setSubmitError(null); }}
        footer={
          <div className="flex items-center gap-3">
            {submitError && (
              <span className="font-mono text-[11px] text-[#FF4B2B] flex items-center gap-1">
                <AlertTriangle size={11} />
                {submitError}
              </span>
            )}
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit to CBP ACE'}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-6">
          <SelectField
            label="Select Vessel"
            required
            value={selectedVessel}
            onChange={(e) => { setSelectedVessel(e.target.value); setSubmitError(null); }}
          >
            <option value="" className="bg-[#050505]">Choose vessel…</option>
            {vessels.map((v) => (
              <option key={v.id} value={v.id} className="bg-[#050505]">{v.name}</option>
            ))}
          </SelectField>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-[rgba(51,255,51,0.5)]">
              Filing Type
            </label>
            <div className="flex border border-[rgba(51,255,51,0.2)]">
              {(['I_418', 'eNOAD'] as const).map((t) => (
                <button
                  key={t}
                  className={`flex-1 px-4 py-2 font-mono text-[11px] tracking-wider transition-colors ${
                    formType === t
                      ? 'bg-[rgba(51,255,51,0.1)] text-[#33FF33]'
                      : 'text-[rgba(51,255,51,0.4)] hover:text-[#33FF33]'
                  } ${t === 'eNOAD' ? 'border-l border-[rgba(51,255,51,0.2)]' : ''}`}
                  onClick={() => setFormType(t)}
                >
                  {t === 'I_418' ? 'Form I-418 (Crew List)' : 'eNOA/D (Notice of Arrival)'}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-[rgba(0,255,255,0.2)] bg-[rgba(0,255,255,0.03)] px-3 py-3 flex items-start gap-2">
            <Info size={12} className="text-[#00FFFF] mt-0.5 flex-shrink-0" />
            <p className="font-mono text-[11px] text-[rgba(0,255,255,0.6)] leading-relaxed">
              The system will automatically validate STCW certificates and safe manning compliance before transmission.
            </p>
          </div>
        </div>
      </TerminalModal>
    </DashboardLayout>
  );
}
