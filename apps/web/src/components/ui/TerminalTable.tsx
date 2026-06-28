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
    <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)]">
      <span className="font-mono text-[10px] text-[var(--muted-foreground)] tracking-wide">
        {total === 0 ? 'No entries' : `${start}–${end} of ${total}`}
      </span>

      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1, pageSize)}
          className="px-2.5 py-1 text-sm rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] disabled:opacity-30 disabled:pointer-events-none transition-all"
        >
          ‹ Prev
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
                'w-8 h-8 text-sm rounded-lg border transition-all',
                p === page
                  ? 'bg-[rgba(0,242,254,0.12)] border-[#00F2FE] text-[#00F2FE] font-medium'
                  : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'
              )}
            >
              {p}
            </button>
          );
        })}

        <button
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1, pageSize)}
          className="px-2.5 py-1 text-sm rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] disabled:opacity-30 disabled:pointer-events-none transition-all"
        >
          Next ›
        </button>

        <select
          value={pageSize}
          onChange={(e) => onChange(1, Number(e.target.value))}
          className="ml-2 bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] text-sm px-2 py-1 rounded-lg focus:outline-none focus:border-[var(--ring)]"
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>{n} / page</option>
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
        <tr key={ri} className="border-b border-[var(--border)]">
          {Array.from({ length: cols }, (_, ci) => (
            <td key={ci} className="px-5 py-3.5">
              <div
                className="h-3 bg-[var(--muted)] rounded animate-pulse"
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
  pagination?: PaginationConfig;
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
  emptyMessage = 'No data',
  className,
}: TerminalTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const expandCol: ColumnDef<T, any> | null = expandedRowRender
    ? {
        id: '__expand',
        size: 40,
        header: () => null,
        cell: ({ row }) => (
          <button
            onClick={row.getToggleExpandedHandler()}
            className="p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
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
    <div className={cn('bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-[var(--border)] bg-[var(--muted)]">
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        'px-5 py-3 text-left font-mono text-[10px] tracking-[0.08em] uppercase',
                        'text-[var(--muted-foreground)] select-none',
                        canSort && 'cursor-pointer hover:text-[var(--foreground)] transition-colors'
                      )}
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="text-[var(--muted-foreground)] opacity-50">
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

          <tbody>
            {loading ? (
              <SkeletonRows cols={visibleCols} />
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleCols}
                  className="px-5 py-12 text-center text-sm text-[var(--muted-foreground)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <tr className="border-b border-[var(--border)] hover:bg-[var(--accent)] transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-5 py-3.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  {expandedRowRender && row.getIsExpanded() && (
                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
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

      {pagination && <TerminalPagination {...pagination} />}
    </div>
  );
}
