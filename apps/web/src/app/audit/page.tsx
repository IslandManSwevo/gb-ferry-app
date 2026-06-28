'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TerminalTable } from '@/components/ui/TerminalTable';
import { api } from '@/lib/api';
import { ColumnDef } from '@tanstack/react-table';
import { ClipboardList, Filter, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface AuditLog {
  id: string;
  timestamp: string;
  userName?: string;
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  details?: unknown;
  metadata?: unknown;
}

/* ── Column defs ────────────────────────────────────────── */
const columns: ColumnDef<AuditLog, any>[] = [
  {
    accessorKey: 'timestamp',
    header: 'Timestamp',
    size: 180,
    cell: ({ getValue }) => (
      <span className="font-mono text-[11px] text-[rgba(0,242,254,0.5)] tabular-nums">
        {new Date(getValue<string>()).toLocaleString()}
      </span>
    ),
  },
  {
    accessorKey: 'userName',
    header: 'User',
    cell: ({ getValue, row }) => (
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[12px] text-[rgba(0,242,254,0.8)]">
          {getValue<string>() ?? '—'}
        </span>
        <span className="font-mono text-[10px] text-[rgba(0,242,254,0.3)] tracking-wider">
          {row.original.userId ?? ''}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'action',
    header: 'Action',
    cell: ({ getValue }) => (
      <span className="font-mono text-[10px] px-2 py-0.5 border border-[rgba(0,242,254,0.3)] text-[#00F2FE] bg-[rgba(0,242,254,0.05)] tracking-widest uppercase">
        {getValue<string>() ?? '—'}
      </span>
    ),
  },
  {
    accessorKey: 'entityType',
    header: 'Entity',
    cell: ({ getValue }) => (
      <span className="font-mono text-[11px] text-[rgba(0,242,254,0.6)]">
        {getValue<string>() ?? '—'}
      </span>
    ),
  },
  {
    accessorKey: 'entityId',
    header: 'Entity ID',
    cell: ({ getValue }) => (
      <code className="font-mono text-[10px] text-[rgba(0,242,254,0.35)] tracking-wider">
        {getValue<string>() ?? '—'}
      </code>
    ),
  },
  {
    accessorKey: 'ipAddress',
    header: 'IP Address',
    size: 130,
    cell: ({ getValue }) => (
      <span className="font-mono text-[11px] text-[rgba(0,242,254,0.4)] tabular-nums">
        {getValue<string>() || '—'}
      </span>
    ),
  },
];

/* ── Filter toolbar ─────────────────────────────────────── */
const ENTITY_OPTIONS = [
  { value: '', label: 'All Entities' },
  { value: 'crew', label: 'Crew Member' },
  { value: 'certification', label: 'Certification' },
  { value: 'vessel', label: 'Vessel' },
  { value: 'cbpSubmission', label: 'CBP Submission' },
  { value: 'compliance', label: 'Compliance' },
];

const inputCls =
  'bg-[#0B132B] border border-[rgba(0,242,254,0.2)] text-[rgba(0,242,254,0.7)] font-mono text-[11px] px-3 py-2 placeholder:text-[rgba(0,242,254,0.2)] focus:outline-none focus:border-[rgba(0,242,254,0.5)] transition-colors';

interface FilterState {
  search: string;
  entityType: string;
  startDate: string;
  endDate: string;
}

interface FilterToolbarProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onApply: () => void;
  loading: boolean;
}

function FilterToolbar({ filters, onChange, onApply, loading }: FilterToolbarProps) {
  return (
    <div className="flex flex-wrap items-end gap-2 px-4 py-3 border-b border-[rgba(0,242,254,0.1)] bg-[rgba(0,242,254,0.02)]">
      <input
        className={inputCls}
        style={{ width: 200 }}
        placeholder="SEARCH LOGS..."
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        onKeyDown={(e) => e.key === 'Enter' && onApply()}
      />

      <select
        className={`${inputCls} appearance-none`}
        style={{ width: 160 }}
        value={filters.entityType}
        onChange={(e) => onChange({ ...filters, entityType: e.target.value })}
      >
        {ENTITY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#0B132B]">
            {o.label}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1">
        <input
          type="date"
          className={inputCls}
          style={{ width: 140 }}
          value={filters.startDate}
          onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
        />
        <span className="font-mono text-[10px] text-[rgba(0,242,254,0.3)]">–</span>
        <input
          type="date"
          className={inputCls}
          style={{ width: 140 }}
          value={filters.endDate}
          onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
        />
      </div>

      <Button
        variant="ghost"
        size="sm"
        icon={loading ? <RefreshCw size={11} className="animate-spin" /> : <Filter size={11} />}
        onClick={onApply}
        disabled={loading}
      >
        Apply
      </Button>

      {(filters.search || filters.entityType || filters.startDate || filters.endDate) && (
        <button
          className="font-mono text-[10px] text-[rgba(0,242,254,0.35)] hover:text-[rgba(0,242,254,0.6)] transition-colors"
          onClick={() => onChange({ search: '', entityType: '', startDate: '', endDate: '' })}
        >
          CLEAR
        </button>
      )}
    </div>
  );
}

/* ── Expanded row ─────────────────────────────────────────── */
function ExpandedDetails({ row }: { row: AuditLog }) {
  const payload = row.details ?? row.metadata;
  return (
    <div className="border border-[rgba(0,242,254,0.1)] bg-[#0B132B]">
      <div className="px-3 py-2 border-b border-[rgba(0,242,254,0.08)]">
        <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-[rgba(0,242,254,0.4)]">
          CHANGE DETAILS
        </span>
      </div>
      <pre className="px-4 py-3 font-mono text-[11px] text-[rgba(0,242,254,0.6)] overflow-auto">
        {payload ? JSON.stringify(payload, null, 2) : '— no details —'}
      </pre>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function AuditLogPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    entityType: '',
    startDate: '',
    endDate: '',
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(filters);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params: Record<string, any> = { page, pageSize };
    if (appliedFilters.search) params.search = appliedFilters.search;
    if (appliedFilters.entityType) params.entityType = appliedFilters.entityType;
    if (appliedFilters.startDate) params.startDate = new Date(appliedFilters.startDate).toISOString();
    if (appliedFilters.endDate) params.endDate = new Date(appliedFilters.endDate).toISOString();

    const { data } = await api.audit.list(params);
    if (data) {
      setLogs(data.items ?? []);
      setTotal(data.total ?? 0);
    }
    setLoading(false);
  }, [page, pageSize, appliedFilters]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleApply = () => {
    setPage(1);
    setAppliedFilters(filters);
  };

  return (
    <DashboardLayout contentClassName="p-6">
      {/* Compliance tags */}
      <div className="flex items-center gap-2 mb-8">
        <span className="font-mono text-[10px] px-2 py-1 border border-[rgba(255,176,0,0.4)] text-[#FFB000] bg-[rgba(255,176,0,0.05)] tracking-widest">
          ISO 27001 A.8.15 COMPLIANT
        </span>
        <span className="font-mono text-[10px] px-2 py-1 border border-[rgba(0,242,254,0.3)] text-[#00F2FE] bg-[rgba(0,242,254,0.04)] tracking-widest">
          AES-256 ENCRYPTED STORAGE
        </span>
      </div>

      <Card>
        <CardHeader
          action={
            <span className="font-mono text-[10px] text-[rgba(0,242,254,0.4)] tracking-widest">
              {total.toLocaleString()} ENTRIES
            </span>
          }
        >
          <span className="flex items-center gap-2">
            <ClipboardList size={13} />
            IMMUTABLE AUDIT LOG
          </span>
        </CardHeader>

        {/* Filter toolbar */}
        <FilterToolbar
          filters={filters}
          onChange={setFilters}
          onApply={handleApply}
          loading={loading}
        />

        <CardContent className="p-0">
          <TerminalTable
            data={logs}
            columns={columns}
            loading={loading}
            rowKey={(r) => r.id}
            pagination={{ page, pageSize, total, onChange: (p, ps) => { setPage(p); setPageSize(ps); } }}
            expandedRowRender={(row) => <ExpandedDetails row={row} />}
            emptyMessage="NO AUDIT ENTRIES MATCH YOUR FILTERS"
          />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
