'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TerminalTable } from '@/components/ui/TerminalTable';
import { termInputCls, termLabelCls } from '@/components/ui/TerminalModal';
import { api } from '@/lib/api';
import { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, CheckCircle, Eye, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

/* ── Columns ─────────────────────────────────────────────── */
const columns: ColumnDef<any, any>[] = [
  {
    id: 'crew',
    header: 'Crew Member',
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-[12px] text-[rgba(51,255,51,0.8)]">{row.original.crewName}</span>
        <span className="font-mono text-[10px] text-[rgba(51,255,51,0.4)]">
          {row.original.crewRole} · {row.original.vesselName}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'certType',
    header: 'Type',
    cell: ({ getValue }) => (
      <span className="font-mono text-[10px] px-2 py-0.5 border border-[rgba(0,255,255,0.3)] text-[#00FFFF] bg-[rgba(0,255,255,0.04)] tracking-widest">
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: 'aiConfidenceScore',
    header: 'AI Confidence',
    cell: ({ getValue }) => {
      const score = getValue<number>() ?? 0;
      const color = score > 0.8 ? '#33FF33' : score > 0.5 ? '#FFB000' : '#FF4B2B';
      return (
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 flex-shrink-0" style={{ background: color }} />
          <span className="font-mono text-[11px] tabular-nums" style={{ color }}>
            {(score * 100).toFixed(0)}%
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'uploadedAt',
    header: 'Uploaded',
    cell: ({ getValue }) => {
      const d = getValue<string>();
      return (
        <span className="font-mono text-[11px] text-[rgba(51,255,51,0.5)] tabular-nums">
          {d ? new Date(d).toLocaleString() : 'N/A'}
        </span>
      );
    },
  },
  {
    accessorKey: 'isRenewal',
    header: 'Renewal',
    cell: ({ getValue }) =>
      getValue<boolean>() ? (
        <span className="font-mono text-[10px] px-2 py-0.5 border border-[rgba(0,255,255,0.3)] text-[#00FFFF] bg-[rgba(0,255,255,0.04)] tracking-widest">
          RENEWAL
        </span>
      ) : null,
  },
];

/* ── Verification modal ──────────────────────────────────── */
interface VerifyForm { certificateNumber: string; expiryDate: string; issuingAuthority: string; }
interface VerifyModalProps {
  cert: any;
  docUrl: string;
  onClose: () => void;
  onApprove: (values: VerifyForm) => Promise<void>;
  onReject: () => void;
  verifying: boolean;
}

function VerifyModal({ cert, docUrl, onClose, onApprove, onReject, verifying }: VerifyModalProps) {
  const [form, setForm] = useState<VerifyForm>({
    certificateNumber: cert?.aiExtractedCertNumber ?? '',
    expiryDate: cert?.aiExtractedExpiry ? cert.aiExtractedExpiry.split('T')[0] : '',
    issuingAuthority: cert?.aiExtractedAuthority ?? '',
  });
  const [errors, setErrors] = useState<Partial<VerifyForm>>({});

  function validate(): boolean {
    const e: Partial<VerifyForm> = {};
    if (!form.certificateNumber) e.certificateNumber = 'Required';
    if (!form.expiryDate) e.expiryDate = 'Required';
    if (!form.issuingAuthority) e.issuingAuthority = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleApprove() {
    if (validate()) await onApprove(form);
  }

  const score = cert?.aiConfidenceScore ?? 0;
  const confidenceColor = score > 0.8 ? '#33FF33' : score > 0.5 ? '#FFB000' : '#FF4B2B';

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(5,5,5,0.92)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-[#050505] border border-[rgba(51,255,51,0.2)] flex flex-col"
        style={{ width: '90vw', maxWidth: '1200px', height: '85vh' }}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(51,255,51,0.1)]">
          <span className="font-mono text-[12px] tracking-[0.12em] uppercase text-[#33FF33] flex items-center gap-2">
            <Eye size={13} />
            VERIFYING CERTIFICATION
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onReject}>
              <XCircle size={11} className="mr-1 text-[#FF4B2B]" />
              Reject
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={verifying}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleApprove} disabled={verifying}>
              <CheckCircle size={11} className="mr-1" />
              {verifying ? 'Approving...' : 'Approve & Validate'}
            </Button>
          </div>
        </div>

        {/* Split body */}
        <div className="flex flex-1 min-h-0">
          {/* Document viewer */}
          <div className="flex-1 bg-black border-r border-[rgba(51,255,51,0.08)] flex items-center justify-center">
            {docUrl ? (
              docUrl.toLowerCase().includes('.pdf') || docUrl.includes('pdf') ? (
                <iframe src={docUrl} className="w-full h-full" style={{ border: 'none' }} />
              ) : (
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <div className="flex items-center justify-center w-full h-full p-4">
                  <img
                    src={docUrl}
                    alt="Certificate document"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Eye size={48} className="text-[rgba(51,255,51,0.1)]" />
                <span className="font-mono text-[11px] text-[rgba(51,255,51,0.25)]">
                  Requesting secure preview...
                </span>
              </div>
            )}
          </div>

          {/* Form panel */}
          <div className="w-[420px] flex-shrink-0 overflow-y-auto p-5 flex flex-col gap-4">
            <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[rgba(51,255,51,0.4)]">
              Extraction Review
            </p>

            {cert?.aiWarnings?.length > 0 && (
              <div className="border border-[rgba(255,176,0,0.2)] bg-[rgba(255,176,0,0.03)] px-3 py-2">
                <p className="font-mono text-[10px] tracking-widest uppercase text-[#FFB000] mb-1 flex items-center gap-1">
                  <AlertTriangle size={10} />
                  Extraction Warnings
                </p>
                <ul className="flex flex-col gap-1">
                  {cert.aiWarnings.map((w: string, i: number) => (
                    <li key={i} className="font-mono text-[11px] text-[rgba(255,176,0,0.7)]">{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Editable fields */}
            {[
              { key: 'certificateNumber', label: 'Certificate Number' },
              { key: 'expiryDate', label: 'Expiry Date', type: 'date' },
              { key: 'issuingAuthority', label: 'Issuing Authority' },
            ].map(({ key, label, type }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className={`${termLabelCls} ${errors[key as keyof VerifyForm] ? 'text-[#FF4B2B]' : ''}`}>
                  {label} *
                </label>
                <input
                  type={type ?? 'text'}
                  className={`${termInputCls} ${errors[key as keyof VerifyForm] ? 'border-[rgba(255,75,43,0.5)]' : ''}`}
                  value={form[key as keyof VerifyForm]}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, [key]: e.target.value }));
                    setErrors((e) => { const n = { ...e }; delete n[key as keyof VerifyForm]; return n; });
                  }}
                />
                {errors[key as keyof VerifyForm] && (
                  <span className="font-mono text-[10px] text-[#FF4B2B]">{errors[key as keyof VerifyForm]}</span>
                )}
              </div>
            ))}

            {/* Metadata */}
            <div className="border border-[rgba(51,255,51,0.08)] bg-[rgba(51,255,51,0.02)] mt-2">
              <dl className="font-mono text-[11px]">
                {[
                  ['CREW MEMBER', cert?.crewName],
                  ['ROLE', cert?.crewRole],
                  ['TYPE', cert?.certType],
                  ['AI CONFIDENCE', `${(score * 100).toFixed(1)}%`],
                  cert?.isRenewal ? ['RENEWAL', 'REPLACES PREVIOUS'] : null,
                ].filter(Boolean).map(([lbl, val]: any) => (
                  <div key={lbl} className="flex justify-between px-3 py-1.5 border-b border-[rgba(51,255,51,0.05)] last:border-b-0">
                    <dt className="text-[rgba(51,255,51,0.4)] tracking-wider">{lbl}</dt>
                    <dd className="text-[rgba(51,255,51,0.8)]" style={lbl === 'AI CONFIDENCE' ? { color: confidenceColor } : {}}>
                      {val}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Reject reason modal ─────────────────────────────────── */
interface RejectModalProps { onConfirm: (reason: string) => void; onClose: () => void; }

function RejectModal({ onConfirm, onClose }: RejectModalProps) {
  const [reason, setReason] = useState('');
  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'rgba(5,5,5,0.85)' }}
    >
      <div className="bg-[#050505] border border-[rgba(255,75,43,0.3)] p-6 flex flex-col gap-4 w-[480px]">
        <p className="font-mono text-[12px] tracking-[0.12em] uppercase text-[#FF4B2B]">Reject Certification</p>
        <p className="font-mono text-[11px] text-[rgba(51,255,51,0.45)] leading-relaxed">
          Provide a reason for rejection. The document will be marked as REVOKED and a re-upload will be requested.
        </p>
        <textarea
          rows={4}
          className={`${termInputCls} resize-none`}
          placeholder="Reason for rejection (e.g. Blurry document, Incorrect type)..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => { if (reason.trim()) onConfirm(reason); }}
            disabled={!reason.trim()}
            className="!text-[#FF4B2B] !border-[rgba(255,75,43,0.4)]"
          >
            Confirm Rejection
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function VerificationQueuePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<any>(null);
  const [docUrl, setDocUrl] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const res = await api.certifications.getQueue();
    if (res.data) setData(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenVerify = async (record: any) => {
    setSelectedCert(record);
    setDocUrl('');
    const res = await api.documents.getViewUrl(record.certificationId);
    if (res.data?.url) setDocUrl(res.data.url);
  };

  const handleApprove = async (values: VerifyForm) => {
    setVerifying(true);
    const res = await api.certifications.verify(selectedCert.certificationId, values);
    setVerifying(false);
    if (!res.error) {
      setSelectedCert(null);
      fetchData();
    }
  };

  const handleReject = async (reason: string) => {
    const res = await api.certifications.reject(selectedCert.certificationId, reason);
    if (!res.error) {
      setRejectOpen(false);
      setSelectedCert(null);
      fetchData();
    }
  };

  const tableColumns: ColumnDef<any, any>[] = [
    ...columns,
    {
      id: 'action',
      header: '',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          icon={<Eye size={11} />}
          onClick={() => handleOpenVerify(row.original)}
        >
          Review
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout contentClassName="p-4 md:p-6">
      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-mono text-[15px] tracking-[0.06em] uppercase text-[#33FF33] font-semibold flex items-center gap-2">
            <ShieldCheck size={16} />
            Document Verification Queue
          </h1>
          <p className="font-mono text-[11px] text-[rgba(51,255,51,0.4)]">
            Human assessment required for AI-extracted maritime certifications
          </p>
        </div>
        <Button
          variant="ghost"
          icon={<RefreshCw size={11} className={loading ? 'animate-spin' : ''} />}
          onClick={fetchData}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <span className="flex items-center gap-2">
            <ShieldCheck size={13} />
            PENDING VERIFICATION ({data.length})
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <TerminalTable
            data={data}
            columns={tableColumns}
            loading={loading}
            rowKey={(r) => r.certificationId}
            emptyMessage="VERIFICATION QUEUE EMPTY"
          />
        </CardContent>
      </Card>

      {selectedCert && (
        <VerifyModal
          cert={selectedCert}
          docUrl={docUrl}
          onClose={() => setSelectedCert(null)}
          onApprove={handleApprove}
          onReject={() => setRejectOpen(true)}
          verifying={verifying}
        />
      )}

      {rejectOpen && (
        <RejectModal
          onConfirm={handleReject}
          onClose={() => setRejectOpen(false)}
        />
      )}
    </DashboardLayout>
  );
}
