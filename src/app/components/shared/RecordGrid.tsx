import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface GridColumn<T> {
  key: string;
  header: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface RecordGridProps<T extends Record<string, unknown>> {
  columns: GridColumn<T>[];
  data: T[];
  pageSize?: number;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  emptySubMessage?: string;
}

const PAGE_SIZE_DEFAULT = 10;

export function RecordGrid<T extends Record<string, unknown>>({
  columns,
  data,
  pageSize = PAGE_SIZE_DEFAULT,
  onRowClick,
  emptyMessage = 'No records found',
  emptySubMessage = 'Try adjusting your search or filter criteria.',
}: RecordGridProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  // Sort
  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const av = a[sortKey];
    const bv = b[sortKey];
    const cmp = String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true });
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageData = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  }

  function SortIcon({ colKey }: { colKey: string }) {
    if (sortKey !== colKey) return <ChevronsUpDown size={12} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
      : <ChevronDown size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />;
  }

  const showPagination = data.length > pageSize;
  const from = sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, sorted.length);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead>
            <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  style={{
                    padding: '0 16px',
                    height: '40px',
                    textAlign: 'left',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--muted-foreground)',
                    lineHeight: '16px',
                    cursor: col.sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    width: col.width,
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {col.header}
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '48px', lineHeight: 1 }}>📭</div>
                    <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', fontSize: '14px' }}>
                      {emptyMessage}
                    </div>
                    <div style={{ fontSize: '12px' }}>{emptySubMessage}</div>
                  </div>
                </td>
              </tr>
            ) : (
              pageData.map((row, idx) => (
                <tr
                  key={String(row.id ?? idx)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  style={{
                    background: idx % 2 === 0 ? 'var(--card)' : 'var(--muted)',
                    borderBottom: '1px solid var(--border)',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => {
                    if (onRowClick) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(35,34,240,0.04)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? 'var(--card)' : 'var(--muted)';
                  }}
                >
                  {columns.map(col => (
                    <td
                      key={col.key}
                      style={{
                        padding: '0 16px',
                        height: '40px',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        fontWeight: 'var(--font-weight-regular)',
                        color: 'var(--foreground)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: col.width ?? '200px',
                      }}
                    >
                      {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination — always shown when data > pageSize */}
      {showPagination && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            background: 'var(--card)',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              color: 'var(--muted-foreground)',
            }}
          >
            Showing {from}–{to} of {sorted.length} records
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <PaginationBtn onClick={() => setPage(1)} disabled={safePage === 1}>«</PaginationBtn>
            <PaginationBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>‹</PaginationBtn>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (safePage <= 3) {
                pageNum = i + 1;
              } else if (safePage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = safePage - 2 + i;
              }
              return (
                <PaginationBtn
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  active={pageNum === safePage}
                >
                  {pageNum}
                </PaginationBtn>
              );
            })}
            <PaginationBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>›</PaginationBtn>
            <PaginationBtn onClick={() => setPage(totalPages)} disabled={safePage === totalPages}>»</PaginationBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function PaginationBtn({
  children,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: '28px',
        height: '28px',
        padding: '0 6px',
        border: '1px solid',
        borderColor: active ? 'var(--primary)' : 'var(--border)',
        borderRadius: 'var(--radius-input)',
        background: active ? 'var(--primary)' : 'var(--card)',
        color: active ? 'var(--primary-foreground)' : disabled ? 'var(--muted-foreground)' : 'var(--foreground)',
        fontFamily: 'var(--font-family-primary)',
        fontSize: '12px',
        fontWeight: 'var(--font-weight-semibold)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.1s',
      }}
    >
      {children}
    </button>
  );
}
