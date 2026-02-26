import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Building2, FileText, Activity, ShieldAlert, ShieldCheck,
  AlertTriangle, ChevronRight, ClipboardCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { KPITile } from '../components/shared/KPITile';
import { MOCK_USERS, formatDate, daysUntil } from '../data/mockData';
import type { AppUser } from '../data/mockData';
import { loadProcesses } from '../data/processData';
import { loadRisks, RISK_TYPE_LABELS } from '../data/riskData';
import type { RiskAssessment } from '../data/riskAssessmentData';
import {
  loadRiskAssessments,
  RISK_RATING_STYLES, deriveRiskRating,
} from '../data/riskAssessmentData';
import {
  loadControls,
  CONTROL_STATUS_LABELS, CONTROL_STATUS_STYLES, CONTROL_TYPE_LABELS,
} from '../data/controlData';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_ROWS = 5;

const RISK_TYPE_COLORS: Record<string, string> = {
  strategic:    '#2322F0',
  operational:  '#E07B00',
  financial:    '#1C8A45',
  compliance:   '#00A3A3',
  reputational: '#C0392B',
  cyber:        '#6B3FA0',
};

const VENDOR_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  'Active':         { bg: '#E8F5EE', color: '#1C8A45' },
  'Inactive':       { bg: '#F0F2F7', color: '#6B7489' },
  'Pending Review': { bg: '#FFF3E0', color: '#E07B00' },
};

const PROCESS_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  'Active':  { bg: '#E8F5EE', color: '#1C8A45' },
  'Draft':   { bg: '#FFF3E0', color: '#E07B00' },
  'Retired': { bg: '#F0F2F7', color: '#6B7489' },
};

// ─── Shared small UI pieces ───────────────────────────────────────────────────

function Pill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', height: '18px', padding: '0 6px',
      borderRadius: '100px', background: bg, color,
      fontFamily: 'var(--font-family-primary)', fontSize: '11px',
      fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

function DaysChip({ days }: { days: number }) {
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
  } else {
    bg = '#FFF8E1'; color = '#B8860B';
    label = `${days}d left`;
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', height: '18px', padding: '0 6px',
      borderRadius: '100px', background: bg, color,
      fontFamily: 'var(--font-family-primary)', fontSize: '11px',
      fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

function ScoreChip({ score, rating }: { score: number; rating: string }) {
  const s = RISK_RATING_STYLES[rating as keyof typeof RISK_RATING_STYLES]
    ?? { background: '#F0F2F7', color: '#6B7489' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: '28px', height: '20px', padding: '0 6px', borderRadius: '100px',
      background: s.background, color: s.color,
      fontFamily: 'var(--font-family-primary)', fontSize: '11px',
      fontWeight: 'var(--font-weight-semibold)', flexShrink: 0,
    }}>
      {score}
    </span>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

interface SectionCardProps {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  totalCount: number;
  onViewAll: () => void;
  emptyIcon: React.ElementType;
  emptyText: string;
  children: React.ReactNode;
}

function SectionCard({
  icon: Icon, iconBg, iconColor,
  title, totalCount, onViewAll,
  emptyIcon: EmptyIcon, emptyText,
  children,
}: SectionCardProps) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Card header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '26px', height: '26px', borderRadius: 'var(--radius-card)',
            background: iconBg, color: iconColor, flexShrink: 0,
          }}>
            <Icon size={13} />
          </span>
          <span style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '14px',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
            lineHeight: '20px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {title}
          </span>
          {totalCount > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: '20px', height: '20px', padding: '0 5px', borderRadius: '100px',
              background: 'rgba(35,34,240,0.08)',
              fontFamily: 'var(--font-family-primary)', fontSize: '11px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)', flexShrink: 0,
            }}>
              {totalCount}
            </span>
          )}
        </div>
        {totalCount > 0 && (
          <button
            type="button" onClick={onViewAll}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '2px',
              background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0',
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)',
              flexShrink: 0,
            }}
          >
            View All <ChevronRight size={12} />
          </button>
        )}
      </div>

      {/* Card body */}
      {totalCount === 0 ? (
        <div style={{
          padding: '24px 16px', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
        }}>
          <EmptyIcon size={24} style={{ color: 'var(--muted-foreground)' }} />
          <span style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
            fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
          }}>
            {emptyText}
          </span>
        </div>
      ) : children}
    </div>
  );
}

// ─── Dashboard row ────────────────────────────────────────────────────────────

function DashRow({
  label, sublabel, badge, right, onClick, isLast,
}: {
  label: string;
  sublabel?: string;
  badge?: React.ReactNode;
  right?: React.ReactNode;
  onClick?: () => void;
  isLast?: boolean;
}) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? e => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 16px',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        cursor: onClick ? 'pointer' : 'default',
        gap: '8px', minWidth: 0, transition: 'background 0.1s',
      }}
      onMouseEnter={onClick ? e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--muted)'; } : undefined}
      onMouseLeave={onClick ? e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; } : undefined}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {label}
          </span>
          {badge}
        </div>
        {sublabel && (
          <div style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
            fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
            marginTop: '1px', lineHeight: '18px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {sublabel}
          </div>
        )}
      </div>
      {right && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
          {right}
        </div>
      )}
    </div>
  );
}

function MoreRow({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <div
      role="button" tabIndex={0} onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      style={{
        padding: '8px 16px', textAlign: 'center',
        fontFamily: 'var(--font-family-primary)', fontSize: '12px',
        fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)',
        cursor: 'pointer', borderTop: '1px solid var(--border)',
        background: 'var(--muted)',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(35,34,240,0.04)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--muted)'; }}
    >
      + {count} more
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function MyDashboard() {
  const navigate = useNavigate();
  const { vendors, contracts } = useApp();

  const [currentUser, setCurrentUser] = useState<AppUser>(MOCK_USERS[0]);

  // Load all localStorage-backed stores once
  const allProcesses  = useMemo(() => loadProcesses(), []);
  const allRisks      = useMemo(() => loadRisks(), []);
  const allAssessments = useMemo(() => loadRiskAssessments(), []);
  const allControls   = useMemo(() => loadControls(), []);

  const today = new Date().toISOString().split('T')[0];

  // Map riskId → current assessment
  const currentAssessmentMap = useMemo(() => {
    const m = new Map<string, RiskAssessment>();
    allAssessments.forEach(a => { if (a.isCurrent) m.set(a.riskId, a); });
    return m;
  }, [allAssessments]);

  // ── Person-filtered collections ──────────────────────────────────────────

  const myVendors = useMemo(
    () => vendors.filter(v => v.dmbaVendorManager?.id === currentUser.id),
    [vendors, currentUser],
  );

  const myVendorIds = useMemo(() => new Set(myVendors.map(v => v.id)), [myVendors]);

  const myContracts = useMemo(() =>
    contracts.filter(c => {
      if (c.status === 'Terminated') return false;
      const nameMatch = c.owner === currentUser.name;
      const bizOwner  = c.businessOwners?.some(u => u.id === currentUser.id);
      const involved  = c.individualsInvolved?.some(u => u.id === currentUser.id);
      const vendorMgr = myVendorIds.has(c.vendorId);
      return nameMatch || bizOwner || involved || vendorMgr;
    }),
    [contracts, currentUser, myVendorIds],
  );

  // Contracts expiring within 90 days (including recently overdue)
  const expiringContracts = useMemo(() =>
    myContracts
      .filter(c => {
        const d = daysUntil(c.endDate);
        return d <= 90;
      })
      .sort((a, b) => daysUntil(a.endDate) - daysUntil(b.endDate)),
    [myContracts],
  );

  const myProcesses = useMemo(
    () => allProcesses.filter(p => p.owner?.id === currentUser.id),
    [allProcesses, currentUser],
  );

  const myActiveRisks = useMemo(
    () => allRisks.filter(r => r.owner?.id === currentUser.id && r.status === 'active'),
    [allRisks, currentUser],
  );

  // Top risks with scores, sorted descending
  const topRisks = useMemo(() =>
    [...myActiveRisks]
      .map(r => {
        const a = currentAssessmentMap.get(r.id) ?? null;
        return { risk: r, assessment: a, score: a?.residualScore ?? 0 };
      })
      .sort((a, b) => b.score - a.score),
    [myActiveRisks, currentAssessmentMap],
  );

  // Risk reviews due: nextReviewDate ≤ today + 30d
  const reviewsDue = useMemo(() =>
    allRisks
      .filter(r =>
        r.owner?.id === currentUser.id &&
        r.status === 'active' &&
        r.nextReviewDate &&
        daysUntil(r.nextReviewDate) <= 30,
      )
      .sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate)),
    [allRisks, currentUser],
  );

  const myControls = useMemo(() =>
    allControls
      .filter(c => c.owner?.id === currentUser.id)
      .sort((a, b) => {
        if (!a.nextTestDate && !b.nextTestDate) return 0;
        if (!a.nextTestDate) return 1;
        if (!b.nextTestDate) return -1;
        return a.nextTestDate.localeCompare(b.nextTestDate);
      }),
    [allControls, currentUser],
  );

  // ── KPI derivations ──────────────────────────────────────────────────────

  const highCriticalCount = myActiveRisks.filter(r =>
    (currentAssessmentMap.get(r.id)?.residualScore ?? 0) >= 12,
  ).length;

  const controlsDueSoon = myControls.filter(c =>
    c.nextTestDate && daysUntil(c.nextTestDate) <= 30,
  ).length;

  const contractsExpiring30 = expiringContracts.filter(c => daysUntil(c.endDate) <= 30).length;
  const overdueReviews = reviewsDue.filter(r => daysUntil(r.nextReviewDate) < 0).length;
  const openActionItems = contractsExpiring30 + overdueReviews + controlsDueSoon;

  // Risk posture summary for the identity header
  const riskPosture = useMemo(() => {
    let critical = 0, high = 0, medium = 0, low = 0;
    myActiveRisks.forEach(r => {
      const s = currentAssessmentMap.get(r.id)?.residualScore ?? 0;
      if (s >= 20) critical++;
      else if (s >= 12) high++;
      else if (s >= 6) medium++;
      else low++;
    });
    return { critical, high, medium, low };
  }, [myActiveRisks, currentAssessmentMap]);

  // Sliced display lists
  const shownVendors    = myVendors.slice(0, MAX_ROWS);
  const shownContracts  = expiringContracts.slice(0, MAX_ROWS);
  const shownProcesses  = myProcesses.slice(0, MAX_ROWS);
  const shownRisks      = topRisks.slice(0, MAX_ROWS);
  const shownReviews    = reviewsDue.slice(0, MAX_ROWS);
  const shownControls   = myControls.slice(0, MAX_ROWS);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1400px' }}>

      {/* ── Identity Header ── */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)',
        padding: '20px 24px',
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
      }}>
        {/* Left: avatar + name block */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          {/* Large avatar */}
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0,
            background: 'var(--primary)', color: 'var(--primary-foreground)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-family-primary)', fontSize: '20px',
            fontWeight: 'var(--font-weight-bold)', lineHeight: 1,
          }}>
            {currentUser.initials}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h1 style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '22px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
              margin: 0, lineHeight: '30px',
            }}>
              {currentUser.name}
            </h1>
            <div style={{
              fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
              lineHeight: '22px',
            }}>
              {currentUser.department} · ERM snapshot as of {formatDate(today)}
            </div>

            {/* Risk posture strip */}
            {myActiveRisks.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                marginTop: '4px', flexWrap: 'wrap',
              }}>
                <span style={{
                  fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                  fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
                }}>
                  My risk posture:
                </span>
                {riskPosture.critical > 0 && (
                  <Pill label={`${riskPosture.critical} Critical`} bg="rgba(192,57,43,0.10)" color="#C0392B" />
                )}
                {riskPosture.high > 0 && (
                  <Pill label={`${riskPosture.high} High`} bg="#FFF3E0" color="#E07B00" />
                )}
                {riskPosture.medium > 0 && (
                  <Pill label={`${riskPosture.medium} Medium`} bg="#FFF8E1" color="#B8860B" />
                )}
                {riskPosture.low > 0 && (
                  <Pill label={`${riskPosture.low} Low`} bg="#E8F5EE" color="#1C8A45" />
                )}
                {myActiveRisks.length === 0 && (
                  <Pill label="No active risks" bg="#F0F2F7" color="#6B7489" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: user switcher */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
            lineHeight: '16px',
          }}>
            Viewing as
          </span>
          <select
            value={currentUser.id}
            onChange={e => {
              const found = MOCK_USERS.find(u => u.id === e.target.value);
              if (found) setCurrentUser(found);
            }}
            style={{
              height: '36px', padding: '0 10px',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-input)',
              background: 'var(--input-background)', color: 'var(--foreground)',
              fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)', cursor: 'pointer', minWidth: '200px',
            }}
          >
            {MOCK_USERS.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── KPI Strip (max 5) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px',
      }}>
        <KPITile
          label="Open Action Items"
          value={openActionItems}
          icon={AlertTriangle}
          iconColor="#C0392B"
          accent={openActionItems > 0}
          subLabel="Needs attention"
        />
        <KPITile
          label="My Vendors"
          value={myVendors.length}
          icon={Building2}
          iconColor="var(--primary)"
          subLabel="Managed by you"
        />
        <KPITile
          label="Active Risks"
          value={myActiveRisks.length}
          icon={ShieldAlert}
          iconColor="#E07B00"
          subLabel="Owned by you"
        />
        <KPITile
          label="High / Critical"
          value={highCriticalCount}
          icon={AlertTriangle}
          iconColor="#C0392B"
          subLabel="Score ≥ 12"
        />
        <KPITile
          label="Controls Due"
          value={controlsDueSoon}
          icon={ShieldCheck}
          iconColor="#00A3A3"
          subLabel="Next 30 days"
        />
      </div>

      {/* ── 2-column section grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '16px',
        alignItems: 'start',
      }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* My Vendors */}
          <SectionCard
            icon={Building2} iconBg="rgba(35,34,240,0.08)" iconColor="var(--primary)"
            title="My Vendors"
            totalCount={myVendors.length}
            onViewAll={() => navigate('/vendors')}
            emptyIcon={Building2}
            emptyText="You are not assigned as vendor manager for any vendors."
          >
            {shownVendors.map((v, i) => {
              const s = VENDOR_STATUS_STYLE[v.status] ?? { bg: '#F0F2F7', color: '#6B7489' };
              const contractCount = contracts.filter(c => c.vendorId === v.id).length;
              return (
                <DashRow
                  key={v.id}
                  label={v.name}
                  sublabel={`${v.category} · ${contractCount} contract${contractCount !== 1 ? 's' : ''}`}
                  badge={<Pill label={v.status} bg={s.bg} color={s.color} />}
                  right={<ChevronRight size={14} style={{ color: 'var(--muted-foreground)' }} />}
                  onClick={() => navigate(`/vendors/${v.id}`)}
                  isLast={i === shownVendors.length - 1 && myVendors.length <= MAX_ROWS}
                />
              );
            })}
            {myVendors.length > MAX_ROWS && (
              <MoreRow count={myVendors.length - MAX_ROWS} onClick={() => navigate('/vendors')} />
            )}
          </SectionCard>

          {/* My Assigned Processes */}
          <SectionCard
            icon={Activity} iconBg="rgba(0,163,163,0.10)" iconColor="#00A3A3"
            title="My Assigned Processes"
            totalCount={myProcesses.length}
            onViewAll={() => navigate('/processes')}
            emptyIcon={Activity}
            emptyText="No processes are assigned to you."
          >
            {shownProcesses.map((p, i) => {
              const s = PROCESS_STATUS_STYLE[p.status] ?? { bg: '#F0F2F7', color: '#6B7489' };
              const spCount = p.subProcesses?.length ?? 0;
              return (
                <DashRow
                  key={p.id}
                  label={p.name}
                  sublabel={p.businessDomain
                    ? `${p.businessDomain} · ${spCount} sub-process${spCount !== 1 ? 'es' : ''}`
                    : p.shortDescription.slice(0, 60)}
                  badge={<Pill label={p.status} bg={s.bg} color={s.color} />}
                  right={<ChevronRight size={14} style={{ color: 'var(--muted-foreground)' }} />}
                  onClick={() => navigate(`/processes/${p.id}`)}
                  isLast={i === shownProcesses.length - 1 && myProcesses.length <= MAX_ROWS}
                />
              );
            })}
            {myProcesses.length > MAX_ROWS && (
              <MoreRow count={myProcesses.length - MAX_ROWS} onClick={() => navigate('/processes')} />
            )}
          </SectionCard>

          {/* Risk Reviews Due */}
          <SectionCard
            icon={ClipboardCheck} iconBg="rgba(192,57,43,0.08)" iconColor="#C0392B"
            title="Risk Reviews Due"
            totalCount={reviewsDue.length}
            onViewAll={() => navigate('/risk-dashboard')}
            emptyIcon={ClipboardCheck}
            emptyText="No risk reviews are due within the next 30 days."
          >
            {shownReviews.map((r, i) => {
              const d = daysUntil(r.nextReviewDate);
              const isOverdue = d < 0;
              const chipColor = isOverdue ? '#C0392B' : d <= 7 ? '#E07B00' : '#B8860B';
              const chipBg = isOverdue ? 'rgba(192,57,43,0.10)' : d <= 7 ? '#FFF3E0' : '#FFF8E1';
              const a = currentAssessmentMap.get(r.id);
              return (
                <DashRow
                  key={r.id}
                  label={r.title}
                  sublabel={`Next review: ${formatDate(r.nextReviewDate)} · ${RISK_TYPE_LABELS[r.riskType]}`}
                  badge={
                    <Pill
                      label={isOverdue ? `${Math.abs(d)}d overdue` : `Due in ${d}d`}
                      bg={chipBg} color={chipColor}
                    />
                  }
                  right={
                    a ? (
                      <ScoreChip score={a.residualScore} rating={a.riskRating} />
                    ) : (
                      <Pill label="No rating" bg="#F0F2F7" color="#6B7489" />
                    )
                  }
                  onClick={() => navigate(`/risks/${r.id}`)}
                  isLast={i === shownReviews.length - 1 && reviewsDue.length <= MAX_ROWS}
                />
              );
            })}
            {reviewsDue.length > MAX_ROWS && (
              <MoreRow count={reviewsDue.length - MAX_ROWS} onClick={() => navigate('/risk-dashboard')} />
            )}
          </SectionCard>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Contracts Expiring */}
          <SectionCard
            icon={FileText} iconBg="rgba(224,123,0,0.10)" iconColor="#E07B00"
            title="Contracts Expiring / Renewal Due"
            totalCount={expiringContracts.length}
            onViewAll={() => navigate('/contracts')}
            emptyIcon={FileText}
            emptyText="No contracts expiring within the next 90 days."
          >
            {shownContracts.map((c, i) => {
              const days = daysUntil(c.endDate);
              const isRenewal = c.status === 'Renewal Due';
              return (
                <DashRow
                  key={c.id}
                  label={c.title}
                  sublabel={`${c.vendorName} · ${c.type}`}
                  badge={
                    isRenewal
                      ? <Pill label="Renewal Due" bg="#FFF3E0" color="#E07B00" />
                      : undefined
                  }
                  right={<DaysChip days={days} />}
                  onClick={() => navigate(`/contracts/${c.id}`)}
                  isLast={i === shownContracts.length - 1 && expiringContracts.length <= MAX_ROWS}
                />
              );
            })}
            {expiringContracts.length > MAX_ROWS && (
              <MoreRow count={expiringContracts.length - MAX_ROWS} onClick={() => navigate('/contracts')} />
            )}
          </SectionCard>

          {/* Top Risks */}
          <SectionCard
            icon={ShieldAlert} iconBg="rgba(224,123,0,0.10)" iconColor="#E07B00"
            title="My Top Risks"
            totalCount={myActiveRisks.length}
            onViewAll={() => navigate('/risk-dashboard')}
            emptyIcon={ShieldAlert}
            emptyText="No active risks are assigned to you."
          >
            {shownRisks.map(({ risk, assessment, score }, i) => {
              const typeColor = RISK_TYPE_COLORS[risk.riskType] ?? 'var(--muted-foreground)';
              const rating = assessment?.riskRating
                ?? (score > 0 ? deriveRiskRating(score) : null);
              return (
                <DashRow
                  key={risk.id}
                  label={risk.title}
                  sublabel={`${RISK_TYPE_LABELS[risk.riskType]} · ${risk.department}`}
                  badge={
                    <Pill
                      label={RISK_TYPE_LABELS[risk.riskType]}
                      bg={`${RISK_TYPE_COLORS[risk.riskType]}18`}
                      color={typeColor}
                    />
                  }
                  right={
                    rating && score > 0 ? (
                      <ScoreChip score={score} rating={rating} />
                    ) : (
                      <Pill label="No assessment" bg="#F0F2F7" color="#6B7489" />
                    )
                  }
                  onClick={() => navigate(`/risks/${risk.id}`)}
                  isLast={i === shownRisks.length - 1 && topRisks.length <= MAX_ROWS}
                />
              );
            })}
            {topRisks.length > MAX_ROWS && (
              <MoreRow count={topRisks.length - MAX_ROWS} onClick={() => navigate('/risk-dashboard')} />
            )}
          </SectionCard>

          {/* My Controls */}
          <SectionCard
            icon={ShieldCheck} iconBg="rgba(28,138,69,0.10)" iconColor="#1C8A45"
            title="My Controls"
            totalCount={myControls.length}
            onViewAll={() => navigate('/controls')}
            emptyIcon={ShieldCheck}
            emptyText="No controls are assigned to you."
          >
            {shownControls.map((c, i) => {
              const statusStyle = CONTROL_STATUS_STYLES[c.status]
                ?? { background: '#F0F2F7', color: '#6B7489' };
              const testDays = c.nextTestDate ? daysUntil(c.nextTestDate) : null;
              return (
                <DashRow
                  key={c.id}
                  label={c.name}
                  sublabel={`${CONTROL_TYPE_LABELS[c.controlType]} · ${c.department}${c.isAutomated ? ' · Automated' : ''}`}
                  badge={
                    <Pill
                      label={CONTROL_STATUS_LABELS[c.status]}
                      bg={statusStyle.background}
                      color={statusStyle.color}
                    />
                  }
                  right={
                    testDays !== null ? (
                      <DaysChip days={testDays} />
                    ) : (
                      <span style={{
                        fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                        fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
                      }}>
                        No test date
                      </span>
                    )
                  }
                  onClick={() => navigate(`/controls/${c.id}`)}
                  isLast={i === shownControls.length - 1 && myControls.length <= MAX_ROWS}
                />
              );
            })}
            {myControls.length > MAX_ROWS && (
              <MoreRow count={myControls.length - MAX_ROWS} onClick={() => navigate('/controls')} />
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}