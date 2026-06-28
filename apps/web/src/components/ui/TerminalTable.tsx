'use client';

import { cn } from '@/lib/utils';
import {
  ColumnDef,
  ExpandedState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, ChevronRight, ChevronUp, ChevronsUpDown } from 'lucide-react';
import React, { useState } from 'react';

/* ── Pagination ──────────────────────────────────────────── */

interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
}

function TerminalPagination({ page, pageSize, total, onChange }: PaginationConfig) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = Math.min((page - 1) * pageSize + 1, total);
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-[rgba(51,255,51,0.1)]">
      <span className="font-mono text-[10px] text-[rgba(51,255,51,0.4)] tracking-wider">
        {total === 0 ? 'NO ENTRIES' : `ENTRIES ${start}–${end} OF ${total}`}
      </span>

      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1, pageSize)}
          className="px-2 py-1 font-mono text-[10px] border border-[rgba(51,255,51,0.2)] text-[rgba(51,255,51,0.5)] hover:text-[#33FF33] hover:border-[rgba(51,255,51,0.5)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          PREV
        </button>

        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let p: number;
          if (totalPages <= 5) {
            p = i + 1;
          } else if (page <= 3) {
            p = i + 1;
          } else if (page >= totalPages - 2) {
            p = totalPages - 4 + i;
          } else {
            p = page - 2 + i;
          }
          return (
            <button
              key={p}
              onClick={() => onChange(p, pageSize)}
              className={cn(
                'w-7 h-7 font-mono text-[10px] border transition-colors',
                p === page
                  ? 'bg-[rgba(51,255,51,0.12)] border-[#33FF33] text-[#33FF33]'
                  : 'border-[rgba(51,255,51,0.15)] text-[rgba(51,255,51,0.4)] hover:text-[#33FF33] hover:border-[rgba(51,255,51,0.4)]'
              )}
            >
              {p}
            </button>
          );
        })}

        <button
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1, pageSize)}
          className="px-2 py-1 font-mono text-[10px] border border-[rgba(51,255,51,0.2)] text-[rgba(51,255,51,0.5)] hover:text-[#33FF33] hover:border-[rgba(51,255,51,0.5)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          NEXT
        </button>

        <select
          value={pageSize}
          onChange={(e) => onChange(1, Number(e.target.value))}
          className="ml-2 bg-[#050505] border border-[rgba(51,255,51,0.2)] text-[rgba(51,255,51,0.5)] font-mono text-[10px] px-2 py-1 focus:outline-none focus:border-[rgba(51,255,51,0.5)]"
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>{n} / PAGE</option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* ── Loading skeleton ─────────────────────────────────────── */

function SkeletonRows({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, ri) => (
        <tr key={ri} className="border-b border-[rgba(51,255,51,0.06)]">
          {Array.from({ length: cols }, (_, ci) => (
            <td key={ci} className="px-4 py-3">
              <div
                className="h-3 bg-[rgba(51,255,51,0.07)] animate-pulse"
                style={{ width: `${50 + ((ri * 3 + ci * 7) % 35)}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ── TerminalTable ────────────────────────────────────────── */

export interface TerminalTableProps<T extends object> {
  data: T[];
  columns: ColumnDef<T, any>[];
  loading?: boolean;
  rowKey?: (row: T) => string;
  /** Server-side pagination — omit for client-side (no pagination) */
  pagination?: PaginationConfig;
  /** Render additional content below an expanded row */
  expandedRowRender?: (row: T) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
}

export function TerminalTable<T extends object>({
  data,
  columns: columnDefs,
  loading = false,
  rowKey,
  pagination,
  expandedRowRender,
  emptyMessage = 'NO DATA',
  className,
}: TerminalTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const expandCol: ColumnDef<T, any> | null = expandedRowRender
    ? {
        id: '__expand',
        size: 32,
        header: () => null,
        cell: ({ row }) => (
          <button
            onClick={row.getToggleExpandedHandler()}
            className="p-1 text-[rgba(51,255,51,0.4)] hover:text-[#33FF33] transition-colors"
            aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
          >
            {row.getIsExpanded() ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        ),
      }
    : null;

  const allColumns: ColumnDef<T, any>[] = expandCol
    ? [expandCol, ...columnDefs]
    : columnDefs;

  const table = useReactTable({
    data,
    columns: allColumns,
    state: { sorting, expanded },
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowId: rowKey ? (row) => rowKey(row) : undefined,
    manualPagination: !!pagination,
  });

  const visibleCols = table.getVisibleLeafColumns().length;

  return (
    <div className={cn('bg-[#050505] border border-[rgba(51,255,51,0.2)]', className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Header */}
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr
                key={hg.id}
                className="border-b border-[rgba(51,255,51,0.15)] bg-[rgba(51,255,51,0.04)]"
              >
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        'px-4 py-2 text-left font-mono text-[10px] tracking-[0.1em] uppercase',
                        'text-[rgba(51,255,51,0.55)] select-none',
                        canSort && 'cursor-pointer hover:text-[#33FF33] transition-colors'
                      )}
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="text-[rgba(51,255,51,0.3)]">
                            {sorted === 'asc' ? (
                              <ChevronUp size={11} />
                            ) : sorted === 'desc' ? (
                              <ChevronDown size={11} />
                            ) : (
                              <ChevronsUpDown size={11} />
                            )}
                          </span>
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              <SkeletonRows cols={visibleCols} />
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleCols}
                  className="px-4 py-12 text-center font-mono text-[11px] tracking-[0.15em] text-[rgba(51,255,51,0.25)]"
                >
                  — {emptyMessage} —
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <tr className="border-b border-[rgba(51,255,51,0.07)] hover:bg-[rgba(51,255,51,0.025)] transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  {expandedRowRender && row.getIsExpanded() && (
                    <tr className="border-b border-[rgba(51,255,51,0.07)] bg-[rgba(51,255,51,0.02)]">
                      <td colSpan={visibleCols} className="px-6 py-4">
                        {expandedRowRender(row.original)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <TerminalPagination {...pagination} />
      )}
    </div>
  );
}
