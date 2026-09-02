import React, { useState, useEffect } from 'react';
import { FileText, AlertCircle, CheckCircle, Clock, ScrollText } from 'lucide-react';
import { loadRegulations } from '../../data/regulationData';
import { loadRegulationRequirements, calculateRequirementCoverage } from '../../data/regulationRequirementData';
import { loadBills } from '../../data/billData';
import { useNavigate } from 'react-router';

export function RegulatoryMetricsWidget() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    totalRegulations: 0,
    activeRegulations: 0,
    totalRequirements: 0,
    averageCoverage: 0,
    gapCount: 0,
    criticalBills: 0,
  });

  useEffect(() => {
    calculateMetrics();
  }, []);

  function calculateMetrics() {
    const regulations = loadRegulations();
    const requirements = loadRegulationRequirements();
    const bills = loadBills();

    const totalRegulations = regulations.length;
    const activeRegulations = regulations.filter(r => r.status === 'active').length;
    const totalRequirements = requirements.length;

    // Calculate average coverage across all regulations
    let totalCoveragePercent = 0;
    let regulationsWithRequirements = 0;
    let totalGaps = 0;

    regulations.forEach(reg => {
      const coverage = calculateRequirementCoverage(requirements, reg.id);
      if (coverage.total > 0) {
        totalCoveragePercent += coverage.percentage;
        regulationsWithRequirements++;
        totalGaps += coverage.total - coverage.mapped;
      }
    });

    const averageCoverage =
      regulationsWithRequirements > 0
        ? Math.round(totalCoveragePercent / regulationsWithRequirements)
        : 0;

    // Count critical/high priority bills in active tracking
    const criticalBills = bills.filter(
      b =>
        (b.priority === 'critical' || b.priority === 'high') &&
        !['signed', 'vetoed', 'failed'].includes(b.status)
    ).length;

    setMetrics({
      totalRegulations,
      activeRegulations,
      totalRequirements,
      averageCoverage,
      gapCount: totalGaps,
      criticalBills,
    });
  }

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '24px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <FileText size={20} style={{ color: 'var(--primary)' }} />
        <h3
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '18px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--foreground)',
            margin: 0,
          }}
        >
          Regulatory Compliance Metrics
        </h3>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
        <MetricCard
          icon={FileText}
          label="Regulations"
          value={metrics.activeRegulations}
          subtitle={`${metrics.totalRegulations} total`}
          color="#1565C0"
          onClick={() => navigate('/regulations')}
        />

        <MetricCard
          icon={CheckCircle}
          label="Avg Coverage"
          value={`${metrics.averageCoverage}%`}
          subtitle="Control mapping"
          color="#1C8A45"
          onClick={() => navigate('/regulations')}
        />

        <MetricCard
          icon={Clock}
          label="Requirements"
          value={metrics.totalRequirements}
          subtitle="Tracked"
          color="#6A1B9A"
          onClick={() => navigate('/regulations')}
        />

        <MetricCard
          icon={AlertCircle}
          label="Gaps"
          value={metrics.gapCount}
          subtitle="Unmapped reqs"
          color={metrics.gapCount > 0 ? '#C62828' : '#1C8A45'}
          onClick={() => navigate('/regulations')}
        />

        <MetricCard
          icon={ScrollText}
          label="Bills Tracking"
          value={metrics.criticalBills}
          subtitle="High priority"
          color="#E65100"
          onClick={() => navigate('/bills')}
        />
      </div>

      {/* Quick Actions */}
      <div
        style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => navigate('/regulations')}
          style={{
            padding: '6px 12px',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-button)',
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            color: 'var(--foreground)',
            cursor: 'pointer',
            fontWeight: 'var(--font-weight-semibold)',
          }}
        >
          View All Regulations
        </button>
        <button
          onClick={() => navigate('/bills')}
          style={{
            padding: '6px 12px',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-button)',
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            color: 'var(--foreground)',
            cursor: 'pointer',
            fontWeight: 'var(--font-weight-semibold)',
          }}
        >
          View Bills & Legislation
        </button>
      </div>
    </div>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  subtitle: string;
  color: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        if (onClick) e.currentTarget.style.boxShadow = 'var(--elevation-sm)';
      }}
      onMouseLeave={e => {
        if (onClick) e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-card)',
            background: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={16} style={{ color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '20px',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--foreground)',
              lineHeight: 1,
            }}
          >
            {value}
          </div>
        </div>
      </div>
      <div>
        <div
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--foreground)',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '11px',
            color: 'var(--muted-foreground)',
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}
