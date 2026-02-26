import React, { useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import {
  Building2, FileText, ShieldAlert, Clock, AlertTriangle,
  ChevronRight, AlertCircle, CheckCircle2, Globe, ExternalLink,
  TrendingUp, Activity,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { KPITile } from '../components/shared/KPITile';
import { formatDate, daysUntil, formatCurrency } from '../data/mockData';
import type { Vendor, Contract } from '../data/mockData';

// ─── Risk Tier ────────────────────────────────────────────────────────────────

type RiskTier = 'critical' | 'high' | 'medium' | 'low';

const TIER_STYLES: Record<RiskTier, { bg: string; color: string; label: string }> = {
  critical: { bg: 'rgba(192,57,43,0.10)', color: '#C0392B', label: 'Critical' },
  high:     { bg: '#FFF3E0',              color: '#E07B00', label: 'High'     },
  medium:   { bg: '#FFF8E1',              color: '#B8860B', label: 'Medium'   },
  low:      { bg: '#E8F5EE',              color: '#1C8A45', label: 'Low'      },
};

const TIER_COLORS: Record<RiskTier, string> = {
  critical: '#C0392B',
  high:     '#E07B00',
  medium:   '#B8860B',
  low:      '#1C8A45',
};

const TIER_ORDER: Record<RiskTier, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function deriveVendorRiskTier(vendor: Vendor, contracts: Contract[]): RiskTier {
  const isTech = vendor.category === 'Software/Hardware/Technology';
  const relevant = contracts.filter(
    c => c.vendorId === vendor.id && (c.status === 'Active' || c.status === 'Renewal Due'),
  );
  const totalValue = relevant.reduce((sum, c) => sum + c.value, 0);
  if (totalValue > 1_500_000) return 'critical';
  if (isTech && totalValue > 800_000) return 'critical';
  if (totalValue > 600_000) return 'high';
  if (isTech && totalValue > 300_000) return 'high';
  if (totalValue > 0 || isTech) return 'medium';
  return 'low';
}

/** Proxy: treat vendors not updated in >180d (Critical/High) or >365d (others) as overdue */
function assessmentStatus(vendor: Vendor, tier: RiskTier): 'current' | 'overdue' | 'never' {
  if (!vendor.updatedDate) return 'never';
  const daysSince = -daysUntil(vendor.updatedDate);
  const threshold = tier === 'critical' || tier === 'high' ? 180 : 365;
  return daysSince > threshold ? 'overdue' : 'current';
}

// ─── Shared UI pieces ─────────────────────────────────────────────────────────

function SectionCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--elevation-sm)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '14px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--foreground)',
            lineHeight: '20px',
          }}>
            {title}
          </div>
          {subtitle && (
            <div style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--muted-foreground)',
              lineHeight: '18px',
              marginTop: '1px',
            }}>
              {subtitle}
            </div>
          )}
        </div>
        {action}
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  );
}

function TierPill({ tier }: { tier: RiskTier }) {
  const s = TIER_STYLES[tier];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', height: '20px', padding: '0 8px',
      borderRadius: '100px', background: s.bg, color: s.color,
      fontFamily: 'var(--font-family-primary)',
      fontSize: '11px', fontWeight: 'var(--font-weight-semibold)',
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {s.label}
    </span>
  );
}

function StatusPill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', height: '20px', padding: '0 8px',
      borderRadius: '100px', background: bg, color,
      fontFamily: 'var(--font-family-primary)',
      fontSize: '11px', fontWeight: 'var(--font-weight-semibold)',
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

function UrgencyChip({ days }: { days: number }) {
  let bg: string, color: string, label: string;
  if (days < 0) {
    bg = 'rgba(192,57,43,0.10)'; color = '#C0392B';
    label = `${Math.abs(days)}d overdue`;
  } else if (days <= 30) {
    bg = 'rgba(192,57,43,0.10)'; color = '#C0392B';
    label = `${days}d left`;
  } else if (days <= 60) {
    bg = '#FFF3E0'; color = '#E07B00';
    label = `${days}d left`;
  } else if (days <= 90) {
    bg = '#FFF8E1'; color = '#B8860B';
    label = `${days}d left`;
  } else {
    bg = '#E8F5EE'; color = '#1C8A45';
    label = `${days}d left`;
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', height: '20px', padding: '0 8px',
      borderRadius: '100px', background: bg, color,
      fontFamily: 'var(--font-family-primary)',
      fontSize: '11px', fontWeight: 'var(--font-weight-semibold)',
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

function LinkButton({
  label, onClick,
}: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        fontFamily: 'var(--font-family-primary)',
        fontSize: 'var(--text-base)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--primary)',
        textDecoration: 'none',
      }}
    >
      {label}
      <ChevronRight size={12} />
    </button>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function TierTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  const tier = name.toLowerCase() as RiskTier;
  const s = TIER_STYLES[tier] ?? { color: 'var(--foreground)' };
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-card)', padding: '8px 12px',
      boxShadow: 'var(--elevation-sm)',
      fontFamily: 'var(--font-family-primary)', fontSize: '12px',
    }}>
      <span style={{ fontWeight: 'var(--font-weight-semibold)', color: s.color }}>{name}</span>
      <span style={{ color: 'var(--muted-foreground)', marginLeft: '8px' }}>{value} vendor{value !== 1 ? 's' : ''}</span>
    </div>
  );
}

// ─── Column header helper ─────────────────────────────────────────────────────

function ColHeader({ children }: { children: React.ReactNode }) {
  return (
    <th style={{
      padding: '8px 12px',
      background: 'var(--muted)',
      fontFamily: 'var(--font-family-primary)',
      fontSize: '12px', fontWeight: 'var(--font-weight-semibold)',
      color: 'var(--muted-foreground)',
      textAlign: 'left', whiteSpace: 'nowrap',
      borderBottom: '1px solid var(--border)',
    }}>
      {children}
    </th>
  );
}

function Cell_({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <td style={{
      padding: '10px 12px',
      fontFamily: 'var(--font-family-primary)',
      fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-regular)',
      color: 'var(--foreground)',
      borderBottom: '1px solid var(--border)',
      textAlign: center ? 'center' : 'left',
      verticalAlign: 'middle',
    }}>
      {children}
    </td>
  );
}

// ─── Category name shortener ──────────────────────────────────────────────────

function shortCat(cat: string) {
  const map: Record<string, string> = {
    'Software/Hardware/Technology': 'Technology',
    'Business Services':  'Business Svcs',
    'Facility Services':  'Facility Svcs',
    'Events':             'Events',
    'Other':              'Other',
  };
  return map[cat] ?? cat;
}

const VENDOR_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  'Active':          { bg: '#E8F5EE', color: '#1C8A45' },
  'Inactive':        { bg: '#F0F2F7', color: '#6B7489' },
  'Pending Review':  { bg: '#FFF3E0', color: '#E07B00' },
  'Terminating':     { bg: 'rgba(192,57,43,0.10)', color: '#C0392B' },
  'Selected Vendor': { bg: '#E8F0FE', color: '#2322F0' },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function TPRMDashboard() {
  const { vendors, contracts } = useApp();
  const navigate = useNavigate();

  // ── Enriched vendor list ──────────────────────────────────────────────────
  const enriched = useMemo(() => {
    return vendors.map(v => {
      const vContracts = contracts.filter(c => c.vendorId === v.id);
      const activeContracts = vContracts.filter(
        c => c.status === 'Active' || c.status === 'Renewal Due',
      );
      const totalActiveValue = activeContracts.reduce((sum, c) => sum + c.value, 0);
      const tier = deriveVendorRiskTier(v, contracts);
      const assessed = assessmentStatus(v, tier);
      return {
        ...v,
        tier,
        assessed,
        vContracts,
        activeContracts,
        totalActiveValue,
      };
    });
  }, [vendors, contracts]);

  // ── KPI computations ──────────────────────────────────────────────────────
  const activeVendors   = enriched.filter(v => v.status === 'Active');
  const critHighCount   = enriched.filter(v => v.tier === 'critical' || v.tier === 'high').length;
  const expiring90      = contracts.filter(c => {
    const d = daysUntil(c.endDate);
    return (c.status === 'Active' || c.status === 'Renewal Due') && d <= 90;
  });
  const overdueCount    = enriched.filter(
    v => v.assessed === 'overdue' && (v.tier === 'critical' || v.tier === 'high'),
  ).length;
  const totalExposureValue = enriched
    .filter(v => v.tier === 'critical' || v.tier === 'high')
    .reduce((sum, v) => sum + v.totalActiveValue, 0);

  // ── Donut: vendor count by tier ───────────────────────────────────────────
  const tierDonutData = (['critical', 'high', 'medium', 'low'] as RiskTier[])
    .map(t => ({ name: TIER_STYLES[t].label, value: enriched.filter(v => v.tier === t).length, color: TIER_COLORS[t] }))
    .filter(d => d.value > 0);

  // ── Stacked bar: vendor count by category × tier ─────────────────────────
  const categories = [...new Set(vendors.map(v => v.category))];
  const categoryBarData = categories.map(cat => ({
    name: shortCat(cat),
    Critical: enriched.filter(v => v.category === cat && v.tier === 'critical').length,
    High:     enriched.filter(v => v.category === cat && v.tier === 'high').length,
    Medium:   enriched.filter(v => v.category === cat && v.tier === 'medium').length,
    Low:      enriched.filter(v => v.category === cat && v.tier === 'low').length,
  }));

  // ── Contract exposure (sorted by days remaining, most urgent first) ───────
  const exposureContracts = contracts
    .filter(c => c.status === 'Active' || c.status === 'Renewal Due')
    .map(c => ({ ...c, daysLeft: daysUntil(c.endDate) }))
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 10);

  // ── Vendor risk ranking ───────────────────────────────────────────────────
  const vendorRanking = [...enriched]
    .filter(v => v.status !== 'Inactive')
    .sort((a, b) => {
      const t = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
      return t !== 0 ? t : b.totalActiveValue - a.totalActiveValue;
    })
    .slice(0, 8);

  // ── Action required ───────────────────────────────────────────────────────
  type ActionItem =
    | { kind: 'vendor'; vendor: typeof enriched[0]; message: string; icon: React.ElementType; color: string }
    | { kind: 'contract'; contract: typeof contracts[0] & { daysLeft: number }; vendorName: string; message: string; icon: React.ElementType; color: string };

  const actionItems: ActionItem[] = [
    ...enriched
      .filter(v => v.status === 'Pending Review')
      .map(v => ({
        kind: 'vendor' as const,
        vendor: v,
        message: 'Pending onboarding review — assessment not started',
        icon: AlertCircle,
        color: '#E07B00',
      })),
    ...enriched
      .filter(v => v.assessed === 'overdue' && (v.tier === 'critical' || v.tier === 'high'))
      .map(v => ({
        kind: 'vendor' as const,
        vendor: v,
        message: `${TIER_STYLES[v.tier].label} tier — risk assessment overdue`,
        icon: Clock,
        color: '#C0392B',
      })),
    ...contracts
      .filter(c => {
        const d = daysUntil(c.endDate);
        return (c.status === 'Active' || c.status === 'Renewal Due') && d <= 30 && !c.autoRenew;
      })
      .map(c => ({
        kind: 'contract' as const,
        contract: { ...c, daysLeft: daysUntil(c.endDate) },
        vendorName: c.vendorName,
        message: `Contract expiring in ${Math.max(0, daysUntil(c.endDate))} days — no auto-renew`,
        icon: FileText,
        color: '#C0392B',
      })),
  ];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '24px',
      maxWidth: '1400px',
      fontFamily: 'var(--font-family-primary)',
    }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '22px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--foreground)',
            lineHeight: '30px',
            margin: 0,
          }}>
            Third-Party Risk Management
          </h1>
          <p style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-regular)',
            color: 'var(--muted-foreground)',
            lineHeight: '18px',
            marginTop: '2px',
          }}>
            Enterprise vendor risk posture · {vendors.length} vendors in portfolio · {activeVendors.length} active
          </p>
        </div>

        {/* Legend pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {(['critical', 'high', 'medium', 'low'] as RiskTier[]).map(t => (
            <span key={t} style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px', fontWeight: 'var(--font-weight-regular)',
              color: 'var(--muted-foreground)',
            }}>
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: TIER_COLORS[t], flexShrink: 0,
              }} />
              {TIER_STYLES[t].label}: {enriched.filter(v => v.tier === t).length}
            </span>
          ))}
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }} className="tprm-kpi-grid">
        <KPITile
          label="Total Vendors"
          value={vendors.length}
          icon={Building2}
          subLabel={`${activeVendors.length} active`}
        />
        <KPITile
          label="Critical / High Tier"
          value={critHighCount}
          icon={ShieldAlert}
          iconColor="#C0392B"
          subLabel="Highest exposure"
        />
        <KPITile
          label="Expiring in 90 Days"
          value={expiring90.length}
          icon={Clock}
          iconColor={expiring90.length > 0 ? '#E07B00' : undefined}
          subLabel={expiring90.length > 0 ? formatCurrency(expiring90.reduce((s, c) => s + c.value, 0)) + ' at risk' : 'No urgent renewals'}
        />
        <KPITile
          label="Assessments Overdue"
          value={overdueCount}
          icon={AlertTriangle}
          iconColor={overdueCount > 0 ? '#C0392B' : undefined}
          subLabel="High/Critical tier"
        />
        <KPITile
          label="Crit/High Exposure"
          value={formatCurrency(totalExposureValue)}
          icon={TrendingUp}
          iconColor="#2322F0"
          subLabel="Active contract value"
        />
      </div>

      {/* ── Row 2: Donut + Stacked bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '24px' }} className="tprm-chart-row">

        {/* Tier Donut */}
        <SectionCard title="Vendor Portfolio by Risk Tier" subtitle={`${enriched.length} total vendors`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ width: 160, height: 160, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tierDonutData}
                    cx="50%" cy="50%"
                    innerRadius={44} outerRadius={72}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {tierDonutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<TierTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minWidth: 0 }}>
              {tierDonutData.map(d => {
                const tier = d.name.toLowerCase() as RiskTier;
                return (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: d.color, flexShrink: 0,
                    }} />
                    <span style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '12px', fontWeight: 'var(--font-weight-regular)',
                      color: 'var(--foreground)', flex: 1,
                    }}>
                      {d.name}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '12px', fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--foreground)',
                    }}>
                      {d.value}
                    </span>
                    <div style={{
                      flex: 1, height: '4px', background: 'var(--muted)',
                      borderRadius: '2px', overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', borderRadius: '2px',
                        background: d.color,
                        width: `${Math.round((d.value / enriched.length) * 100)}%`,
                      }} />
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '11px', color: 'var(--muted-foreground)', minWidth: '28px',
                      textAlign: 'right',
                    }}>
                      {Math.round((d.value / enriched.length) * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </SectionCard>

        {/* Category stacked bar */}
        <SectionCard title="Risk Tier by Vendor Category" subtitle="Stacked by tier severity">
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBarData} barSize={28} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 11, fill: 'var(--muted-foreground)' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 11, fill: 'var(--muted-foreground)' }}
                  axisLine={false} tickLine={false} allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-card)',
                    background: 'var(--card)', boxShadow: 'var(--elevation-sm)',
                  }}
                />
                <Bar dataKey="Critical" stackId="a" fill={TIER_COLORS.critical} radius={[0, 0, 0, 0]} />
                <Bar dataKey="High"     stackId="a" fill={TIER_COLORS.high}     radius={[0, 0, 0, 0]} />
                <Bar dataKey="Medium"   stackId="a" fill={TIER_COLORS.medium}   radius={[0, 0, 0, 0]} />
                <Bar dataKey="Low"      stackId="a" fill={TIER_COLORS.low}      radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* ── Contract Exposure Timeline ── */}
      <SectionCard
        title="Contract Exposure Monitor"
        subtitle="Active and renewal-due contracts sorted by urgency"
        action={
          <button
            onClick={() => navigate('/contracts')}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-button)', cursor: 'pointer',
              padding: '5px 12px', color: 'var(--primary)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px', fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            View All <ExternalLink size={11} />
          </button>
        }
      >
        {exposureContracts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--muted-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)' }}>
            No active contracts requiring attention.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <ColHeader>Contract</ColHeader>
                  <ColHeader>Vendor</ColHeader>
                  <ColHeader>Type</ColHeader>
                  <ColHeader>Value</ColHeader>
                  <ColHeader>End Date</ColHeader>
                  <ColHeader>Status</ColHeader>
                  <ColHeader>Urgency</ColHeader>
                  <ColHeader>Auto-Renew</ColHeader>
                </tr>
              </thead>
              <tbody>
                {exposureContracts.map((c, idx) => {
                  const vendor = enriched.find(v => v.id === c.vendorId);
                  const isEven = idx % 2 === 1;
                  return (
                    <tr
                      key={c.id}
                      style={{ background: isEven ? 'var(--muted)' : 'var(--card)' }}
                    >
                      <Cell_>
                        <button
                          onClick={() => navigate(`/contracts/${c.id}`)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: 'var(--text-base)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--primary)',
                          }}
                        >
                          {c.id}
                        </button>
                        <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '1px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.title}
                        </div>
                      </Cell_>
                      <Cell_>
                        <button
                          onClick={() => navigate(`/vendors/${c.vendorId}`)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: 'var(--text-base)',
                            fontWeight: 'var(--font-weight-regular)',
                            color: 'var(--primary)',
                            display: 'flex', alignItems: 'center', gap: '4px',
                          }}
                        >
                          {c.vendorName}
                          {vendor && <TierPill tier={vendor.tier} />}
                        </button>
                      </Cell_>
                      <Cell_>
                        <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                          {c.type}
                        </span>
                      </Cell_>
                      <Cell_>
                        <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
                          {c.value > 0 ? formatCurrency(c.value) : '—'}
                        </span>
                      </Cell_>
                      <Cell_>
                        <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)' }}>
                          {formatDate(c.endDate)}
                        </span>
                      </Cell_>
                      <Cell_>
                        {c.status === 'Renewal Due'
                          ? <StatusPill label="Renewal Due" bg="rgba(192,57,43,0.10)" color="#C0392B" />
                          : <StatusPill label="Active" bg="#E8F5EE" color="#1C8A45" />
                        }
                      </Cell_>
                      <Cell_><UrgencyChip days={c.daysLeft} /></Cell_>
                      <Cell_ center>
                        {c.autoRenew
                          ? <CheckCircle2 size={16} color="#1C8A45" />
                          : <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>No</span>
                        }
                      </Cell_>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ── Row 4: Vendor Ranking + Action Items ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px' }} className="tprm-bottom-row">

        {/* Vendor Risk Ranking */}
        <SectionCard
          title="Vendor Risk Ranking"
          subtitle="Sorted by tier severity then active contract value"
          action={
            <button
              onClick={() => navigate('/vendors')}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'none', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-button)', cursor: 'pointer',
                padding: '5px 12px', color: 'var(--primary)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px', fontWeight: 'var(--font-weight-semibold)',
              }}
            >
              All Vendors <ExternalLink size={11} />
            </button>
          }
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <ColHeader>#</ColHeader>
                  <ColHeader>Vendor</ColHeader>
                  <ColHeader>Category</ColHeader>
                  <ColHeader>Tier</ColHeader>
                  <ColHeader>Active Contracts</ColHeader>
                  <ColHeader>Contract Value</ColHeader>
                  <ColHeader>Last Reviewed</ColHeader>
                  <ColHeader>Status</ColHeader>
                </tr>
              </thead>
              <tbody>
                {vendorRanking.map((v, idx) => {
                  const vstyle = VENDOR_STATUS_STYLE[v.status] ?? { bg: '#F0F2F7', color: '#6B7489' };
                  const isEven = idx % 2 === 1;
                  return (
                    <tr key={v.id} style={{ background: isEven ? 'var(--muted)' : 'var(--card)' }}>
                      <Cell_>
                        <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-semibold)' }}>
                          {idx + 1}
                        </span>
                      </Cell_>
                      <Cell_>
                        <button
                          onClick={() => navigate(`/vendors/${v.id}`)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: 'var(--text-base)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--primary)',
                          }}
                        >
                          {v.name}
                        </button>
                      </Cell_>
                      <Cell_>
                        <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                          {shortCat(v.category)}
                        </span>
                      </Cell_>
                      <Cell_><TierPill tier={v.tier} /></Cell_>
                      <Cell_ center>
                        <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)' }}>
                          {v.activeContracts.length}
                        </span>
                      </Cell_>
                      <Cell_>
                        <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: v.totalActiveValue > 0 ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                          {v.totalActiveValue > 0 ? formatCurrency(v.totalActiveValue) : '—'}
                        </span>
                      </Cell_>
                      <Cell_>
                        <span style={{
                          fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                          color: v.assessed === 'overdue' ? '#C0392B' : 'var(--muted-foreground)',
                          fontWeight: v.assessed === 'overdue' ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                        }}>
                          {formatDate(v.updatedDate)}
                          {v.assessed === 'overdue' && ' ⚠'}
                        </span>
                      </Cell_>
                      <Cell_>
                        <StatusPill label={v.status} bg={vstyle.bg} color={vstyle.color} />
                      </Cell_>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Action Required */}
        <SectionCard
          title="Action Required"
          subtitle={`${actionItems.length} item${actionItems.length !== 1 ? 's' : ''} need attention`}
        >
          {actionItems.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '32px 16px', gap: '12px',
            }}>
              <CheckCircle2 size={48} color="#1C8A45" />
              <div style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '14px', fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)', textAlign: 'center',
              }}>
                No actions required
              </div>
              <div style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px', fontWeight: 'var(--font-weight-regular)',
                color: 'var(--muted-foreground)', textAlign: 'center',
              }}>
                All critical and high-tier vendor assessments are current.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {actionItems.map((item, idx) => {
                const Icon = item.icon;
                if (item.kind === 'vendor') {
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '12px',
                        padding: '12px', borderRadius: 'var(--radius-card)',
                        border: '1px solid var(--border)',
                        background: 'var(--muted)',
                      }}
                    >
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: `${item.color}18`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Icon size={14} color={item.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--foreground)',
                          }}>
                            {item.vendor.name}
                          </span>
                          <TierPill tier={item.vendor.tier} />
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '12px', fontWeight: 'var(--font-weight-regular)',
                          color: 'var(--muted-foreground)', marginTop: '2px',
                        }}>
                          {item.message}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/vendors/${item.vendor.id}`)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: '4px', color: 'var(--primary)', flexShrink: 0,
                        }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '12px',
                        padding: '12px', borderRadius: 'var(--radius-card)',
                        border: '1px solid var(--border)',
                        background: 'var(--muted)',
                      }}
                    >
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: `${item.color}18`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Icon size={14} color={item.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--foreground)',
                        }}>
                          {item.vendorName}
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '12px', fontWeight: 'var(--font-weight-regular)',
                          color: 'var(--muted-foreground)', marginTop: '2px',
                        }}>
                          {item.message}
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '2px',
                        }}>
                          {item.contract.id} · Expires {formatDate(item.contract.endDate)}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/contracts/${item.contract.id}`)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: '4px', color: 'var(--primary)', flexShrink: 0,
                        }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Assessment Coverage Summary ── */}
      <SectionCard
        title="Assessment Coverage"
        subtitle="Risk assessment status across the vendor portfolio"
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
        }}>
          {(['critical', 'high', 'medium', 'low'] as RiskTier[]).map(tier => {
            const inTier = enriched.filter(v => v.tier === tier);
            const current = inTier.filter(v => v.assessed === 'current').length;
            const overdue = inTier.filter(v => v.assessed === 'overdue').length;
            const pct = inTier.length > 0 ? Math.round((current / inTier.length) * 100) : 100;
            return (
              <div key={tier} style={{
                background: 'var(--muted)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
                padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <TierPill tier={tier} />
                  <span style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px', color: 'var(--muted-foreground)',
                  }}>
                    {inTier.length} vendor{inTier.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {/* Progress bar */}
                <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{
                    height: '100%', borderRadius: '3px',
                    background: pct === 100 ? '#1C8A45' : pct >= 75 ? '#B8860B' : '#C0392B',
                    width: `${pct}%`,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px', color: 'var(--muted-foreground)',
                  }}>
                    {current} current · {overdue} overdue
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '14px', fontWeight: 'var(--font-weight-semibold)',
                    color: pct === 100 ? '#1C8A45' : pct >= 75 ? '#B8860B' : '#C0392B',
                  }}>
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

    </div>
  );
}
