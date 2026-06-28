'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TerminalModal, SelectField, termInputCls, termLabelCls } from '@/components/ui/TerminalModal';
import { TerminalTable } from '@/components/ui/TerminalTable';
import { api } from '@/lib/api';
import { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, FileText, RefreshCw, ShieldCheck, Upload } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

/* ── Types ────────────────────────────────────────────────── */
interface DocumentRow {
  id: string;
  title: string;
  type: string;
  vesselId: string;
  expiryDate?: string;
  status: string;
  uploadedAt?: string;
  fileName: string;
}

interface UploadForm {
  name: string;
  vesselId: string;
  documentType: string;
  expiryDate: string;
}

const TYPE_MAP: Record<string, string> = {
  R102: 'Registry Certificate (R102)',
  R106: 'Safe Manning (R106)',
  SHIPS_LIBRARY: "Ship's Library",
  RADIO_LICENSE: 'Radio License',
  CLASS_CERT: 'Classification Certificate',
};

function statusConfig(status: string) {
  if (status === 'VALID') return { color: '#00F2FE', border: 'rgba(0,242,254,0.4)', bg: 'rgba(0,242,254,0.06)' };
  if (status === 'EXPIRING') return { color: '#FFB000', border: 'rgba(255,176,0,0.4)', bg: 'rgba(255,176,0,0.06)' };
  if (status === 'EXPIRED') return { color: '#FF4B2B', border: 'rgba(255,75,43,0.4)', bg: 'rgba(255,75,43,0.06)' };
  return { color: '#00F2FE', border: 'rgba(0,242,254,0.4)', bg: 'rgba(0,242,254,0.06)' };
}

/* ── Columns ──────────────────────────────────────────────── */
const columns: ColumnDef<DocumentRow, any>[] = [
  {
    id: 'document',
    header: 'Document',
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-[12px] text-[rgba(0,242,254,0.8)]">{row.original.title}</span>
        <span className="font-mono text-[10px] text-[rgba(0,242,254,0.4)]">{row.original.fileName}</span>
      </div>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ getValue }) => (
      <span className="font-mono text-[11px] text-[rgba(0,242,254,0.7)]">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: 'expiryDate',
    header: 'Expiry',
    cell: ({ getValue }) => {
      const v = getValue<string | undefined>();
      return (
        <span className="font-mono text-[11px] tabular-nums" style={{ color: v ? 'rgba(0,242,254,0.7)' : 'rgba(0,242,254,0.25)' }}>
          {v ? new Date(v).toLocaleDateString('en-CA') : '—'}
        </span>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const s = getValue<string>();
      const { color, border, bg } = statusConfig(s);
      return (
        <span className="font-mono text-[10px] px-2 py-0.5 border tracking-widest"
          style={{ color, borderColor: border, background: bg }}>
          {s.replace(/_/g, ' ')}
        </span>
      );
    },
  },
];

/* ── Drop zone ───────────────────────────────────────────── */
interface DropZoneProps {
  file: File | null;
  onChange: (f: File | null) => void;
}

function DropZone({ file, onChange }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onChange(f);
  }

  return (
    <div
      className="border border-dashed flex flex-col items-center justify-center gap-2 py-8 cursor-pointer transition-colors"
      style={{
        borderColor: dragging ? '#00F2FE' : 'rgba(0,242,254,0.2)',
        background: dragging ? 'rgba(0,242,254,0.04)' : 'transparent',
      }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <Upload size={24} className="text-[rgba(0,242,254,0.3)]" />
      {file ? (
        <span className="font-mono text-[12px] text-[#00F2FE]">{file.name}</span>
      ) : (
        <>
          <span className="font-mono text-[12px] text-[rgba(0,242,254,0.5)]">Drop PDF or Click to Browse</span>
          <span className="font-mono text-[10px] text-[rgba(0,242,254,0.3)]">AI will extract dates and document numbers for verification</span>
        </>
      )}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
const INITIAL_FORM: UploadForm = { name: '', vesselId: '', documentType: '', expiryDate: '' };

export default function VesselDocumentsPage() {
  const [data, setData] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchQ, setSearchQ] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState<UploadForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof UploadForm | 'file', string>>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadData = useCallback(async (pg = 1, q = searchQ, status = filterStatus) => {
    setLoading(true);
    const res = await api.documents.list({ q: q || undefined, status: status || undefined, page: pg, limit: pageSize });
    if (res.data) {
      setData(res.data.data ?? []);
      setTotal(res.data.total ?? 0);
      setPage(res.data.page ?? pg);
    }
    setLoading(false);
  }, [searchQ, filterStatus, pageSize]);

  useEffect(() => { loadData(); }, [loadData]);

  function fieldChange(key: keyof UploadForm, value: string) {
    const next = { ...form, [key]: value };
    if (key === 'documentType') {
      if (TYPE_MAP[value]) next.name = TYPE_MAP[value];
      else if (value === 'OTHER') next.name = '';
    }
    setForm(next);
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }

  function validate(): boolean {
    const e: Partial<Record<keyof UploadForm | 'file', string>> = {};
    if (!form.name) e.name = 'Document name required';
    if (!form.vesselId) e.vesselId = 'Vessel ID required';
    if (!file) e.file = 'Please select a file';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submitUpload() {
    if (!validate()) return;
    setUploading(true);
    setUploadError(null);
    const fd = new FormData();
    fd.append('file', file!);
    fd.append('name', form.name);
    fd.append('entityType', 'vessel');
    fd.append('entityId', form.vesselId);
    if (form.documentType) fd.append('documentType', form.documentType);
    if (form.expiryDate) fd.append('expiryDate', new Date(form.expiryDate).toISOString());

    const res = await api.documents.upload(fd);
    setUploading(false);
    if (res.error) {
      setUploadError(String(res.error));
    } else {
      setUploadOpen(false);
      setForm(INITIAL_FORM);
      setFile(null);
      setErrors({});
      loadData();
    }
  }

  const isNameLocked = !!form.documentType && form.documentType !== 'OTHER';

  return (
    <DashboardLayout contentClassName="p-4 md:p-6">
      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-mono text-[15px] tracking-[0.06em] uppercase text-[#00F2FE] font-semibold flex items-center gap-2">
            <FileText size={16} />
            Vessel Document Registry
          </h1>
          <p className="font-mono text-[11px] text-[rgba(0,242,254,0.4)]">
            Immutable storage for BMA R102–R106 certificates and ship&apos;s library
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] px-2 py-0.5 border border-[rgba(0,242,254,0.3)] text-[#00F2FE] bg-[rgba(0,242,254,0.04)] tracking-widest flex items-center gap-1">
            <ShieldCheck size={10} />
            AI EXTRACTION ENABLED
          </span>
          <Button icon={<Upload size={11} />} onClick={() => setUploadOpen(true)}>
            Upload Document
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div className="flex-1 relative min-w-48">
          <input
            type="text"
            placeholder="Search title / type / description..."
            className={termInputCls}
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') loadData(1, searchQ, filterStatus); }}
          />
        </div>
        <select
          className={`${termInputCls} w-48`}
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); loadData(1, searchQ, e.target.value); }}
        >
          <option value="" className="bg-[#0B132B]">All Status</option>
          <option value="VALID" className="bg-[#0B132B]">Valid</option>
          <option value="EXPIRING" className="bg-[#0B132B]">Expiring</option>
          <option value="EXPIRED" className="bg-[#0B132B]">Expired</option>
          <option value="PENDING_REVIEW" className="bg-[#0B132B]">Pending Review</option>
        </select>
        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshCw size={11} className={loading ? 'animate-spin' : ''} />}
          onClick={() => loadData(1)}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <span className="flex items-center gap-2">
            <FileText size={13} />
            DOCUMENT REGISTRY
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <TerminalTable
            data={data}
            columns={columns}
            loading={loading}
            rowKey={(r) => r.id}
            emptyMessage="NO DOCUMENTS FOUND"
            pagination={{
              page,
              pageSize,
              total,
              onChange: (pg) => loadData(pg),
            }}
          />
        </CardContent>
      </Card>

      {/* Upload modal */}
      <TerminalModal
        open={uploadOpen}
        title="UPLOAD VESSEL DOCUMENT"
        onClose={() => { setUploadOpen(false); setForm(INITIAL_FORM); setFile(null); setErrors({}); setUploadError(null); }}
        footer={
          <div className="flex items-center gap-3">
            {uploadError && (
              <span className="font-mono text-[11px] text-[#FF4B2B] flex items-center gap-1">
                <AlertTriangle size={11} />
                {uploadError}
              </span>
            )}
            <Button variant="ghost" onClick={() => setUploadOpen(false)} disabled={uploading}>Cancel</Button>
            <Button onClick={submitUpload} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload to Cloud'}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className={`${termLabelCls} ${errors.name ? 'text-[#FF4B2B]' : ''}`}>Document Name *</label>
            <input
              type="text"
              className={`${termInputCls} ${isNameLocked ? 'opacity-50 cursor-not-allowed' : ''} ${errors.name ? 'border-[rgba(255,75,43,0.5)]' : ''}`}
              placeholder="e.g., Safe Manning Certificate"
              value={form.name}
              readOnly={isNameLocked}
              onChange={(e) => fieldChange('name', e.target.value)}
            />
            {errors.name && <span className="font-mono text-[10px] text-[#FF4B2B]">{errors.name}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className={`${termLabelCls} ${errors.vesselId ? 'text-[#FF4B2B]' : ''}`}>Vessel ID *</label>
              <input
                type="text"
                className={`${termInputCls} ${errors.vesselId ? 'border-[rgba(255,75,43,0.5)]' : ''}`}
                placeholder="Vessel UUID"
                value={form.vesselId}
                onChange={(e) => fieldChange('vesselId', e.target.value)}
              />
              {errors.vesselId && <span className="font-mono text-[10px] text-[#FF4B2B]">{errors.vesselId}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className={termLabelCls}>Expiry Date</label>
              <input
                type="date"
                className={termInputCls}
                value={form.expiryDate}
                onChange={(e) => fieldChange('expiryDate', e.target.value)}
              />
            </div>
          </div>

          <SelectField
            label="Document Type"
            value={form.documentType}
            onChange={(e) => fieldChange('documentType', e.target.value)}
          >
            <option value="" className="bg-[#0B132B]">Select category…</option>
            <option value="R102" className="bg-[#0B132B]">Registry Certificate (R102)</option>
            <option value="R106" className="bg-[#0B132B]">Safe Manning (R106)</option>
            <option value="SHIPS_LIBRARY" className="bg-[#0B132B]">Ship&apos;s Library</option>
            <option value="RADIO_LICENSE" className="bg-[#0B132B]">Radio License</option>
            <option value="CLASS_CERT" className="bg-[#0B132B]">Classification Certificate</option>
            <option value="OTHER" className="bg-[#0B132B]">Other Regulatory</option>
          </SelectField>

          <div className="flex flex-col gap-1">
            <label className={`${termLabelCls} ${errors.file ? 'text-[#FF4B2B]' : ''}`}>Document File (PDF) *</label>
            <DropZone file={file} onChange={(f) => { setFile(f); setErrors((e) => { const n = { ...e }; delete n.file; return n; }); }} />
            {errors.file && <span className="font-mono text-[10px] text-[#FF4B2B]">{errors.file}</span>}
          </div>
        </div>
      </TerminalModal>
    </DashboardLayout>
  );
}
