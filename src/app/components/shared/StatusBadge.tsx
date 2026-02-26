import React from 'react';
import type { VendorStatus, ContractStatus } from '../../data/mockData';

type Status = VendorStatus | ContractStatus;

interface StatusBadgeProps {
  status: Status;
}

// Semantic color map — references design system tokens where available,
// falls back to guideline hex values for tokens not in theme.css
const STATUS_STYLES: Record<string, { background: string; color: string }> = {
  // Contract statuses
  Active:        { background: '#E8F5EE', color: '#1C8A45' },
  Expired:       { background: '#F0F0F0', color: '#6B7489' },
  Pending:       { background: '#FFF3E0', color: '#E07B00' },
  'Renewal Due': { background: '#E0F5F5', color: '#00A3A3' },
  Terminated:    { background: 'rgba(222,0,55,0.08)', color: 'var(--destructive)' },
  // Vendor statuses
  Inactive:         { background: '#F0F0F0', color: '#6B7489' },
  'Pending Review': { background: '#FFF3E0', color: '#E07B00' },
  Terminating:      { background: 'rgba(222,0,55,0.08)', color: 'var(--destructive)' },
  'Selected Vendor':{ background: 'rgba(35,34,240,0.08)', color: 'var(--primary)' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? { background: '#F0F0F0', color: '#6B7489' };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '20px',
        padding: '0 8px',
        borderRadius: '100px',
        background: style.background,
        color: style.color,
        fontFamily: 'var(--font-family-primary)',
        fontSize: '12px',
        fontWeight: 'var(--font-weight-semibold)',
        lineHeight: '16px',
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
}