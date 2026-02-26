import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface KPITileProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  subLabel?: string;
  accent?: boolean;
}

export function KPITile({ label, value, icon: Icon, iconColor, subLabel, accent }: KPITileProps) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--elevation-sm)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--muted-foreground)',
            lineHeight: '16px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </span>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-card)',
            background: accent ? 'var(--primary)' : 'var(--muted)',
            color: iconColor ?? (accent ? 'var(--primary-foreground)' : 'var(--muted-foreground)'),
            flexShrink: 0,
          }}
        >
          <Icon size={16} />
        </span>
      </div>

      <div>
        <div
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '24px',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--foreground)',
            lineHeight: '1.2',
          }}
        >
          {value}
        </div>
        {subLabel && (
          <div
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--muted-foreground)',
              marginTop: '2px',
            }}
          >
            {subLabel}
          </div>
        )}
      </div>
    </div>
  );
}
