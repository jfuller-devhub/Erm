import React from 'react';
import { NavLink, Outlet } from 'react-router';
import { TrendingUp, Target, Activity, FileBarChart } from 'lucide-react';

const EXEC_TABS = [
  { path: '/executive/posture',  label: 'Risk Posture',     icon: TrendingUp   },
  { path: '/executive/appetite', label: 'Appetite Monitor', icon: Target       },
  { path: '/executive/kris',     label: 'KRI Dashboard',    icon: Activity     },
  { path: '/executive/report',   label: 'Board Report',     icon: FileBarChart },
];

export function ExecLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', maxWidth: '1400px' }}>

      {/* Tab bar — Appian a.tabButtonBar pattern */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--elevation-sm)',
        marginBottom: '20px',
        overflow: 'hidden',
      }}>
        {/* Executive header band */}
        <div style={{
          background: 'var(--sidebar)',
          padding: '14px 24px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: 'var(--radius-card)',
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <TrendingUp size={16} color="rgba(255,255,255,0.9)" />
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '16px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--sidebar-primary)',
              lineHeight: '24px',
            }}>
              Executive Governance
            </div>
            <div style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              fontWeight: 'var(--font-weight-regular)', color: 'var(--sidebar-foreground)',
              lineHeight: '18px',
            }}>
              Enterprise-wide risk oversight · Board-ready intelligence
            </div>
          </div>
        </div>

        {/* Tab strip */}
        <div style={{
          display: 'flex', alignItems: 'flex-end',
          padding: '0 8px',
          borderTop: '1px solid var(--border)',
          gap: '2px',
        }}>
          {EXEC_TABS.map(tab => (
            <NavLink
              key={tab.path}
              to={tab.path}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '6px',
                height: '40px', padding: '0 16px',
                textDecoration: 'none',
                fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: '-1px',
                transition: 'color 0.12s, border-color 0.12s',
                whiteSpace: 'nowrap',
              })}
            >
              <tab.icon size={14} />
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Page content */}
      <Outlet />
    </div>
  );
}
