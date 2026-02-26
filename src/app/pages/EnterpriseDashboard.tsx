import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import { ShieldAlert, User, Clock, Link2, AlertTriangle } from 'lucide-react';
import type { Risk, RiskStatus, RiskType, AppetiteLevel } from '../data/riskData';
import {
  loadRisks,
  RISK_TYPE_LABELS, RISK_STATUS_LABELS, APPETITE_LEVEL_LABELS, APPETITE_LEVELS,
  RISK_TYPES,
} from '../data/riskData';
import type { RiskAssessment } from '../data/riskAssessmentData';
import {
  loadRiskAssessments,
  RISK_RATING_LABELS, RISK_RATING_STYLES,
} from '../data/riskAssessmentData';
import { formatDate } from '../data/mockData';

// ─── Color maps ───────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<RiskType, string> = {
  strategic:    '#2322F0',
  operational:  '#E07B00',
  financial:    '#1C8A45',
  compliance:   '#00A3A3',
  reputational: '#C0392B',
  cyber:        '#6B3FA0',
};

const APPETITE_COLORS: Record<AppetiteLevel, string> = {
  averse:   '#C0392B',
  minimal:  '#E07B00',
  cautious: '#B8860B',
  open:     '#1C8A45',
  hungry:   '#2322F0',
};

const STATUS_STYLES: Record<RiskStatus, { background: string; color: string }> = {
  draft:    { background: '#FFF3E0', color: '#E07B00' },
  active:   { background: '#E8F5EE', color: '#1C8A45' },
  closed:   { background: '#F0F2F7', color: '#6B7489' },
  archived: { background: '#F0F2F7', color: '#6B7489' },
};

// ─── Heatmap helpers ──────────────────────────────────────────────────────────

function getCellStyle(likelihood: number, impact: number): { bg: string; textColor: string } {
  const score = likelihood * impact;
  if (score >= 20) return { bg: 'rgba(192,57,43,0.80)',   textColor: '#fff' };
  if (score >= 12) return { bg: 'rgba(224,123,0,0.78)',   textColor: '#fff' };
  if (score >= 6)  return { bg: 'rgba(184,134,11,0.65)',  textColor: '#fff' };
  if (score >= 3)  return { bg: 'rgba(28,138,69,0.65)',   textColor: '#fff' };
  return             { bg: 'rgba(107,116,137,0.18)',  textColor: 'var(--foreground)' };
}

function getCellRatingLabel(likelihood: number, impact: number): string {
  const score = likelihood * impact;
  if (score >= 20) return 'Critical';
  if (score >= 12) return 'High';
  if (score >= 6)  return 'Medium';
  if (score >= 3)  return 'Low';
  return 'Negligible';
}

// ─── Custom Tooltip for recharts ──────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '8px 12px',
        boxShadow: 'var(--elevation-sm)',
      }}
    >
      <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: '0 0 4px 0' }}>
        {label}
      </p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: entry.color ?? 'var(--foreground)', margin: '2px 0 0 0' }}>
          {entry.value} risk{entry.value !== 1 ? 's' : ''}
        </p>
      ))}
    </div>
  );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--elevation-sm)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px 20px 12px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0, lineHeight: '20px' }}>
          {title}
        </p>
        {subtitle && (
          <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)', margin: '2px 0 0 0', lineHeight: '18px' }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ padding: '20px' }}>
        {children}
      </div>
    </div>
  );
}

// ─── 5×5 Risk Heatmap ────────────────────────────────────────────────────────
// SAIL-compliant: maps to a.gridField with richTextItem cells.
// No CSS transforms, no pixel-exact widths, no overflow scroll.
// Layout: top-left header cell "Likelihood ↓ / Impact →", 5 impact column headers,
// 5 likelihood row headers, and coloured data cells with risk chips.

function RiskHeatmap({
  enterpriseRisks,
  assessmentMap,
}: {
  enterpriseRisks: Risk[];
  assessmentMap: Map<string, RiskAssessment>;
}) {
  // Map each enterprise risk to its likelihood/impact cell
  const risksByCell = useMemo(() => {
    const map = new Map<string, Risk[]>();
    for (const risk of enterpriseRisks) {
      const assessment = assessmentMap.get(risk.id);
      if (assessment) {
        const key = `${assessment.likelihoodScore}-${assessment.impactScore}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(risk);
      }
    }
    return map;
  }, [enterpriseRisks, assessmentMap]);

  const unassessedRisks = useMemo(
    () => enterpriseRisks.filter(r => !assessmentMap.has(r.id)),
    [enterpriseRisks, assessmentMap]
  );

  const IMPACT_SHORT: Record<number, string> = {
    1: 'Negligible', 2: 'Minor', 3: 'Moderate', 4: 'Major', 5: 'Catastrophic',
  };
  const LIKELIHOOD_SHORT: Record<number, string> = {
    1: 'Rare', 2: 'Unlikely', 3: 'Possible', 4: 'Likely', 5: 'A. Certain',
  };

  const colWidth = `${100 / 6}%`; // 6 columns: 1 header + 5 data

  return (
    <div>
      {/* ── Grid maps to a.gridField ── */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}
      >
        <thead>
          {/* Impact axis header row */}
          <tr>
            {/* Top-left corner cell — no rotated text, SAIL-safe plain label */}
            <th
              style={{
                width: colWidth,
                padding: '8px 10px',
                background: 'var(--muted)',
                border: '1px solid var(--border)',
                textAlign: 'left',
                verticalAlign: 'bottom',
              }}
            >
              <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '10px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', display: 'block', lineHeight: '14px' }}>
                Likelihood
              </span>
              <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
              <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '10px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', display: 'block', lineHeight: '14px', textAlign: 'right' }}>
                Impact
              </span>
            </th>

            {/* Impact column headers (1–5) */}
            {[1, 2, 3, 4, 5].map(impact => (
              <th
                key={impact}
                style={{
                  width: colWidth,
                  padding: '8px 6px',
                  background: 'var(--muted)',
                  border: '1px solid var(--border)',
                  textAlign: 'center',
                  verticalAlign: 'bottom',
                }}
              >
                <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', display: 'block', lineHeight: '14px' }}>
                  {impact}
                </span>
                <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '10px', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)', display: 'block', lineHeight: '13px', marginTop: '2px' }}>
                  {IMPACT_SHORT[impact]}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {/* Likelihood rows 5 (top) → 1 (bottom) */}
          {[5, 4, 3, 2, 1].map(likelihood => (
            <tr key={likelihood}>
              {/* Likelihood row header */}
              <td
                style={{
                  padding: '8px 10px',
                  background: 'var(--muted)',
                  border: '1px solid var(--border)',
                  verticalAlign: 'middle',
                }}
              >
                <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', display: 'block', lineHeight: '14px' }}>
                  {likelihood}
                </span>
                <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '10px', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)', display: 'block', lineHeight: '13px', marginTop: '2px' }}>
                  {LIKELIHOOD_SHORT[likelihood]}
                </span>
              </td>

              {/* 5 data cells */}
              {[1, 2, 3, 4, 5].map(impact => {
                const cellKey = `${likelihood}-${impact}`;
                const cellStyle = getCellStyle(likelihood, impact);
                const score = likelihood * impact;
                const risksHere = risksByCell.get(cellKey) ?? [];

                return (
                  <td
                    key={impact}
                    style={{
                      padding: '8px 6px',
                      background: cellStyle.bg,
                      border: '1px solid rgba(255,255,255,0.30)',
                      textAlign: 'center',
                      verticalAlign: 'top',
                      height: '64px',
                    }}
                  >
                    {/* Score — maps to a.richTextItem in Appian */}
                    <span
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '11px',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: cellStyle.textColor,
                        opacity: 0.75,
                        display: 'block',
                        lineHeight: '14px',
                        marginBottom: risksHere.length > 0 ? '5px' : '0',
                      }}
                    >
                      {score}
                    </span>

                    {/* Risk chips — maps to a.tagField in Appian */}
                    {risksHere.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'center',
                          gap: '3px',
                        }}
                      >
                        {risksHere.map(r => (
                          <span
                            key={r.id}
                            title={`${r.id}: ${r.title}`}
                            style={{
                              display: 'inline-block',
                              background: 'rgba(255,255,255,0.92)',
                              borderRadius: '3px',
                              padding: '1px 5px',
                              fontFamily: 'var(--font-family-primary)',
                              fontSize: '10px',
                              fontWeight: 'var(--font-weight-bold)',
                              color: '#1A1F2E',
                              lineHeight: '15px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {r.id}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend — maps to a.columnsLayout with a.tagField items */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginTop: '14px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border)',
        }}
      >
        {[
          { label: 'Critical (≥20)', bg: 'rgba(192,57,43,0.80)' },
          { label: 'High (12–19)',   bg: 'rgba(224,123,0,0.78)' },
          { label: 'Medium (6–11)', bg: 'rgba(184,134,11,0.65)' },
          { label: 'Low (3–5)',      bg: 'rgba(28,138,69,0.65)' },
          { label: 'Negligible (1–2)', bg: 'rgba(107,116,137,0.22)' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '12px', height: '12px',
                borderRadius: '2px',
                background: item.bg,
                border: '1px solid rgba(0,0,0,0.10)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '11px',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--muted-foreground)',
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Unassessed notice */}
      {unassessedRisks.length > 0 && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px 12px',
            background: 'rgba(224,123,0,0.07)',
            border: '1px solid rgba(224,123,0,0.25)',
            borderRadius: 'var(--radius-card)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={14} style={{ color: '#E07B00', flexShrink: 0 }} />
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--foreground)',
            }}
          >
            {unassessedRisks.length} enterprise risk{unassessedRisks.length > 1 ? 's' : ''} not plotted — no current assessment:{' '}
            <strong>{unassessedRisks.map(r => r.id).join(', ')}</strong>
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Enterprise Risk List ────────────────────────────────────────────────────

function EnterpriseRiskList({
  enterpriseRisks,
  allRisks,
  assessmentMap,
  onNavigate,
}: {
  enterpriseRisks: Risk[];
  allRisks: Risk[];
  assessmentMap: Map<string, RiskAssessment>;
  onNavigate: (id: string) => void;
}) {
  if (enterpriseRisks.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '40px 24px',
        }}
      >
        <ShieldAlert size={36} style={{ color: 'var(--muted-foreground)' }} />
        <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0 }}>
          No enterprise risks defined
        </p>
        <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)', margin: 0, textAlign: 'center' }}>
          Mark a risk as "Enterprise Risk" in the Risk Registry to see it here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
        <thead>
          <tr style={{ background: 'var(--muted)' }}>
            {['Risk ID', 'Title', 'Status', 'Type', 'Rating', 'Linked Risks', 'Owner', 'Next Review'].map(col => (
              <th
                key={col}
                style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--muted-foreground)',
                  lineHeight: '16px',
                  whiteSpace: 'nowrap',
                  borderBottom: '1px solid var(--border)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {enterpriseRisks.map((risk, idx) => {
            const assessment = assessmentMap.get(risk.id);
            const linkedCount = allRisks.filter(r => r.enterpriseRiskId === risk.id).length;
            const today = new Date().toISOString().split('T')[0];
            const overdue = risk.status === 'active' && risk.nextReviewDate && risk.nextReviewDate < today;
            const statusStyle = STATUS_STYLES[risk.status] ?? { background: '#F0F2F7', color: '#6B7489' };

            return (
              <tr
                key={risk.id}
                style={{
                  background: idx % 2 === 0 ? 'var(--card)' : 'var(--muted)',
                  transition: 'background 0.1s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(35,34,240,0.04)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? 'var(--card)' : 'var(--muted)'; }}
                onClick={() => onNavigate(risk.id)}
              >
                {/* Risk ID */}
                <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)' }}>
                    {risk.id}
                  </span>
                </td>

                {/* Title */}
                <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', maxWidth: '240px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '13px',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--foreground)',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {risk.title}
                  </span>
                </td>

                {/* Status */}
                <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                  <span
                    style={{
                      display: 'inline-flex', alignItems: 'center',
                      height: '20px', padding: '0 8px',
                      borderRadius: '100px',
                      background: statusStyle.background,
                      color: statusStyle.color,
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '11px', fontWeight: 'var(--font-weight-semibold)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {RISK_STATUS_LABELS[risk.status]}
                  </span>
                </td>

                {/* Type */}
                <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                  <span
                    style={{
                      display: 'inline-flex', alignItems: 'center',
                      height: '20px', padding: '0 8px',
                      borderRadius: '100px',
                      background: `${TYPE_COLORS[risk.riskType]}18`,
                      color: TYPE_COLORS[risk.riskType],
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '11px', fontWeight: 'var(--font-weight-semibold)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {RISK_TYPE_LABELS[risk.riskType]}
                  </span>
                </td>

                {/* Rating */}
                <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                  {assessment ? (
                    <span
                      style={{
                        display: 'inline-flex', alignItems: 'center',
                        height: '20px', padding: '0 8px',
                        borderRadius: '100px',
                        background: RISK_RATING_STYLES[assessment.riskRating].background,
                        color: RISK_RATING_STYLES[assessment.riskRating].color,
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '11px', fontWeight: 'var(--font-weight-semibold)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {RISK_RATING_LABELS[assessment.riskRating]} ({assessment.residualScore})
                    </span>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>—</span>
                  )}
                </td>

                {/* Linked Risks */}
                <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                  {linkedCount > 0 ? (
                    <span
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '12px', fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--primary)',
                      }}
                    >
                      <Link2 size={12} />
                      {linkedCount}
                    </span>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>0</span>
                  )}
                </td>

                {/* Owner */}
                <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                  {risk.owner ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--foreground)' }}>
                      <span
                        style={{
                          width: '20px', height: '20px', borderRadius: '50%',
                          background: 'var(--primary)',
                          color: 'var(--primary-foreground)',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '9px', fontWeight: 'var(--font-weight-bold)',
                          flexShrink: 0,
                        }}
                      >
                        {risk.owner.name.split(' ').map(n => n[0]).join('')}
                      </span>
                      {risk.owner.name}
                    </span>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>—</span>
                  )}
                </td>

                {/* Next Review */}
                <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                  <span
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '12px',
                      color: overdue ? 'var(--destructive)' : 'var(--foreground)',
                      fontWeight: overdue ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                    }}
                  >
                    {overdue && <Clock size={11} />}
                    {risk.nextReviewDate ? formatDate(risk.nextReviewDate) : '—'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Chart: Risks by Type ────────────────────────────────────────────────────

function RisksByTypeChart({ risks }: { risks: Risk[] }) {
  const data = useMemo(() =>
    RISK_TYPES
      .map(type => ({
        name: RISK_TYPE_LABELS[type],
        count: risks.filter(r => r.riskType === type).length,
        fill: TYPE_COLORS[type],
      }))
      .filter(d => d.count > 0)
      .sort((a, b) => b.count - a.count),
    [risks]
  );

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={{ stroke: 'var(--border)' }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={88}
          tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(35,34,240,0.04)' }} />
        <Bar dataKey="count" radius={[0, 3, 3, 0]} maxBarSize={22}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Chart: Risks by Department ───────────────────────────────────────────────

function RisksByDepartmentChart({ risks }: { risks: Risk[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    risks.forEach(r => { counts[r.department] = (counts[r.department] || 0) + 1; });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [risks]);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={{ stroke: 'var(--border)' }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={80}
          tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(35,34,240,0.04)' }} />
        <Bar dataKey="count" fill="var(--primary)" radius={[0, 3, 3, 0]} maxBarSize={22} fillOpacity={0.82} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Chart: Risks by Appetite ────────────────────────────────────────────��───

function RisksByAppetiteChart({ risks }: { risks: Risk[] }) {
  const data = useMemo(() =>
    APPETITE_LEVELS
      .map(level => ({
        name: APPETITE_LEVEL_LABELS[level],
        count: risks.filter(r => r.appetiteLevel === level).length,
        fill: APPETITE_COLORS[level],
      }))
      .filter(d => d.count > 0),
    [risks]
  );

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <Pie
          data={data}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="48%"
          innerRadius={52}
          outerRadius={80}
          paddingAngle={2}
          strokeWidth={1}
          stroke="var(--card)"
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', color: 'var(--foreground)' }}>
              {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── KPI Tiles ───────────────────────────────────────────────────────────────

function KPITile({
  label,
  value,
  subLabel,
  accent,
}: {
  label: string;
  value: number | string;
  subLabel?: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        boxShadow: 'var(--elevation-sm)',
      }}
    >
      <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </p>
      <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: '28px', fontWeight: 'var(--font-weight-bold)', color: accent ?? 'var(--foreground)', margin: 0, lineHeight: '36px' }}>
        {value}
      </p>
      {subLabel && (
        <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)', margin: 0, lineHeight: '18px' }}>
          {subLabel}
        </p>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function EnterpriseDashboard() {
  const navigate = useNavigate();
  const [risks, setRisks] = useState<Risk[]>([]);
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);

  useEffect(() => {
    setRisks(loadRisks());
    setAssessments(loadRiskAssessments());
  }, []);

  const enterpriseRisks = useMemo(() => risks.filter(r => r.isEnterpriseRisk), [risks]);

  // Assessment map: riskId → current assessment
  const assessmentMap = useMemo(() => {
    const map = new Map<string, RiskAssessment>();
    assessments.forEach(a => { if (a.isCurrent) map.set(a.riskId, a); });
    return map;
  }, [assessments]);

  // KPIs
  const kpis = useMemo(() => {
    const total = risks.length;
    const enterpriseCount = enterpriseRisks.length;
    const linkedCount = risks.filter(r => !r.isEnterpriseRisk && r.enterpriseRiskId).length;
    const criticalOrHigh = [...assessmentMap.values()].filter(
      a => a.riskRating === 'critical' || a.riskRating === 'high'
    ).length;
    return { total, enterpriseCount, linkedCount, criticalOrHigh };
  }, [risks, enterpriseRisks, assessmentMap]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '22px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: 0,
              lineHeight: '30px',
            }}
          >
            Risk Dashboard
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--muted-foreground)',
              margin: '4px 0 0 0',
              lineHeight: '22px',
            }}
          >
            Enterprise-level risk aggregation, heatmap, and analytics.
          </p>
        </div>
      </div>

      {/* KPI tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
        <KPITile label="Total Risks" value={kpis.total} subLabel="All registered risks" />
        <KPITile label="Enterprise Risks" value={kpis.enterpriseCount} subLabel="Elevated to enterprise" accent="var(--primary)" />
        <KPITile label="Linked Risks" value={kpis.linkedCount} subLabel="Linked to enterprise" />
        <KPITile label="Critical / High" value={kpis.criticalOrHigh} subLabel="Current assessments" accent={kpis.criticalOrHigh > 0 ? '#C0392B' : undefined} />
      </div>

      {/* Heatmap + Enterprise list in a two-column layout on wide screens */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '20px' }}>

        {/* Heatmap */}
        <SectionCard
          title="Enterprise Risk Heatmap"
          subtitle="Current likelihood × impact for enterprise-level risks"
        >
          <RiskHeatmap enterpriseRisks={enterpriseRisks} assessmentMap={assessmentMap} />
        </SectionCard>

        {/* Enterprise Risk List */}
        <SectionCard
          title="Enterprise Risks"
          subtitle={`${enterpriseRisks.length} risk${enterpriseRisks.length !== 1 ? 's' : ''} elevated to enterprise level`}
        >
          <EnterpriseRiskList
            enterpriseRisks={enterpriseRisks}
            allRisks={risks}
            assessmentMap={assessmentMap}
            onNavigate={id => navigate(`/risks/${id}`)}
          />
        </SectionCard>
      </div>

      {/* Analytics Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>

        <SectionCard title="Risks by Type" subtitle="All risks grouped by risk classification">
          <RisksByTypeChart risks={risks} />
        </SectionCard>

        <SectionCard title="Risks by Department" subtitle="Distribution across business units">
          <RisksByDepartmentChart risks={risks} />
        </SectionCard>

        <SectionCard title="Risks by Appetite" subtitle="Tolerance profile across the portfolio">
          <RisksByAppetiteChart risks={risks} />
        </SectionCard>

      </div>
    </div>
  );
}