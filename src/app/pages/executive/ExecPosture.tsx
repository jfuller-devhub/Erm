import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  TrendingUp, TrendingDown, Minus, ShieldAlert, ShieldCheck,
  AlertTriangle, Clock, ArrowRight, CheckCircle, ChevronRight,
} from 'lucide-react';
import { loadRisks, RISK_TYPE_LABELS } from '../../data/riskData';
import type { Risk } from '../../data/riskData';
import { loadRiskAssessments, RISK_RATING_STYLES, RISK_RATING_LABELS } from '../../data/riskAssessmentData';
import type { RiskAssessment } from '../../data/riskAssessmentData';
import { loadControls } from '../../data/controlData';
import { loadRiskControls } from '../../data/riskControlData';
import { APPETITE_THRESHOLDS } from '../../data/kriData';
import { daysUntil, formatDate } from '../../data/mockData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCellStyle(score: number): { bg: string; color: string } {
  if (score >= 20) return { bg: 'rgba(192,57,43,0.82)', color: '#fff' };
  if (score >= 12) return { bg: 'rgba(224,123,0,0.80)', color: '#fff' };
  if (score >= 6)  return { bg: 'rgba(184,134,11,0.68)', color: '#fff' };
  if (score >= 3)  return { bg: 'rgba(28,138,69,0.65)', color: '#fff' };
  return { bg: 'rgba(107,116,137,0.18)', color: 'var(--foreground)' };
}

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

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{
        fontFamily: 'var(--font-family-primary)', fontSize: '14px',
        fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', lineHeight: '20px',
      }}>
        {title}
      </div>
      {subtitle && (
        <div style={{
          fontFamily: 'var(--font-family-primary)', fontSize: '12px',
          fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)', lineHeight: '18px',
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ExecPosture() {
  const navigate = useNavigate();
  const [enterpriseOnly, setEnterpriseOnly] = useState(false);

  const allRisks       = useMemo(() => loadRisks(), []);
  const allAssessments = useMemo(() => loadRiskAssessments(), []);
  const allControls    = useMemo(() => loadControls(), []);
  const allRiskControls = useMemo(() => loadRiskControls(), []);

  // Current assessment map
  const currentMap = useMemo(() => {
    const m = new Map<string, RiskAssessment>();
    allAssessments.forEach(a => { if (a.isCurrent) m.set(a.riskId, a); });
    return m;
  }, [allAssessments]);

  // Previous (most-recent non-current) assessment map per risk
  const prevMap = useMemo(() => {
    const m = new Map<string, RiskAssessment>();
    const grouped = new Map<string, RiskAssessment[]>();
    allAssessments.filter(a => !a.isCurrent).forEach(a => {
      if (!grouped.has(a.riskId)) grouped.set(a.riskId, []);
      grouped.get(a.riskId)!.push(a);
    });
    grouped.forEach((list, riskId) => {
      const sorted = [...list].sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate));
      if (sorted[0]) m.set(riskId, sorted[0]);
    });
    return m;
  }, [allAssessments]);

  const activeRisks = useMemo(() =>
    allRisks.filter(r => r.status === 'active' || r.status === 'draft'),
    [allRisks],
  );

  const displayRisks = useMemo(() =>
    enterpriseOnly ? activeRisks.filter(r => r.isEnterpriseRisk) : activeRisks,
    [activeRisks, enterpriseOnly],
  );

  // Portfolio trend
  const { currentAvg, previousAvg, trendDelta } = useMemo(() => {
    const curScores  = displayRisks.map(r => currentMap.get(r.id)?.residualScore).filter((s): s is number => s !== undefined);
    const prevScores = displayRisks.map(r => prevMap.get(r.id)?.residualScore).filter((s): s is number => s !== undefined);
    const cAvg = curScores.length  ? curScores.reduce((a, b) => a + b, 0)  / curScores.length  : 0;
    const pAvg = prevScores.length ? prevScores.reduce((a, b) => a + b, 0) / prevScores.length : 0;
    return { currentAvg: cAvg, previousAvg: pAvg, trendDelta: pAvg - cAvg };
  }, [displayRisks, currentMap, prevMap]);

  // Appetite compliance
  const { withinAppetite, approaching, breaching } = useMemo(() => {
    let within = 0, approach = 0, breach = 0;
    displayRisks.forEach(r => {
      const score     = currentMap.get(r.id)?.residualScore;
      const threshold = APPETITE_THRESHOLDS[r.appetiteLevel] ?? 9;
      if (score === undefined) return;
      if (score <= threshold) within++;
      else if (score <= threshold + 4) approach++;
      else breach++;
    });
    return { withinAppetite: within, approaching: approach, breaching: breach };
  }, [displayRisks, currentMap]);

  // Heat map: count of risks at each (likelihood, impact) cell
  const heatMap = useMemo(() => {
    const grid: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));
    displayRisks.forEach(r => {
      const a = currentMap.get(r.id);
      if (!a) return;
      const l = Math.min(5, Math.max(1, a.likelihoodScore)) - 1;
      const i = Math.min(5, Math.max(1, a.impactScore)) - 1;
      grid[l][i]++;
    });
    return grid;
  }, [displayRisks, currentMap]);

  // Top enterprise risks
  const topRisks = useMemo(() =>
    [...activeRisks.filter(r => r.isEnterpriseRisk)]
      .map(r => ({
        risk: r,
        current: currentMap.get(r.id) ?? null,
        previous: prevMap.get(r.id) ?? null,
      }))
      .sort((a, b) => (b.current?.residualScore ?? 0) - (a.current?.residualScore ?? 0))
      .slice(0, 8),
    [activeRisks, currentMap, prevMap],
  );

  // Escalation items
  const escalations = useMemo(() => {
    const items: { type: string; label: string; sublabel: string; severity: 'high' | 'medium'; riskId?: string }[] = [];

    // Appetite breaches
    activeRisks.forEach(r => {
      const score     = currentMap.get(r.id)?.residualScore ?? 0;
      const threshold = APPETITE_THRESHOLDS[r.appetiteLevel] ?? 9;
      if (score > threshold + 4) {
        items.push({
          type: 'Appetite Breach',
          label: r.title,
          sublabel: `Residual ${score} vs appetite threshold ${threshold} — ${r.owner?.name ?? 'Unowned'}`,
          severity: 'high',
          riskId: r.id,
        });
      }
    });

    // Unassessed active risks
    activeRisks.forEach(r => {
      if (!currentMap.has(r.id)) {
        items.push({
          type: 'No Assessment',
          label: r.title,
          sublabel: `Active risk with no current assessment — ${r.owner?.name ?? 'Unowned'}`,
          severity: 'medium',
          riskId: r.id,
        });
      }
    });

    // Overdue reviews (>14 days)
    activeRisks.forEach(r => {
      if (r.nextReviewDate && daysUntil(r.nextReviewDate) < -14) {
        items.push({
          type: 'Review Overdue',
          label: r.title,
          sublabel: `${Math.abs(daysUntil(r.nextReviewDate))} days overdue — ${formatDate(r.nextReviewDate)}`,
          severity: 'medium',
          riskId: r.id,
        });
      }
    });

    // Ineffective controls on high/critical risks
    const activeControlIds = new Set(allControls.filter(c => c.status === 'active' && c.effectiveness === 'ineffective').map(c => c.id));
    allRiskControls.forEach(rc => {
      if (activeControlIds.has(rc.controlId)) {
        const risk  = activeRisks.find(r => r.id === rc.riskId);
        const score = risk ? (currentMap.get(risk.id)?.residualScore ?? 0) : 0;
        const ctrl  = allControls.find(c => c.id === rc.controlId);
        if (risk && score >= 12 && ctrl) {
          items.push({
            type: 'Ineffective Control',
            label: ctrl.name,
            sublabel: `Mapped to high-risk "${risk.title}" — score ${score}`,
            severity: 'high',
          });
        }
      }
    });

    // Deduplicate and limit to 8
    const seen = new Set<string>();
    return items.filter(i => {
      const k = `${i.type}-${i.label}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, 8);
  }, [activeRisks, currentMap, allControls, allRiskControls]);

  const trendIcon  = trendDelta > 0.5 ? TrendingUp : trendDelta < -0.5 ? TrendingDown : Minus;
  const trendColor = trendDelta > 0.5 ? '#1C8A45'  : trendDelta < -0.5 ? '#C0392B'    : '#E07B00';
  const trendLabel = trendDelta > 0.5 ? 'Improving' : trendDelta < -0.5 ? 'Deteriorating' : 'Stable';

  const LIKELIHOOD_LABELS = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];
  const IMPACT_LABELS     = ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Toggle: Enterprise Only */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
        <span style={{
          fontFamily: 'var(--font-family-primary)', fontSize: '12px',
          fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
        }}>
          Show enterprise risks only
        </span>
        <button
          type="button"
          onClick={() => setEnterpriseOnly(v => !v)}
          style={{
            width: '36px', height: '20px', borderRadius: '100px', border: 'none',
            background: enterpriseOnly ? 'var(--primary)' : 'var(--border)',
            cursor: 'pointer', position: 'relative', transition: 'background 0.15s', flexShrink: 0,
          }}
        >
          <span style={{
            position: 'absolute', top: '2px',
            left: enterpriseOnly ? '18px' : '2px',
            width: '16px', height: '16px', borderRadius: '50%',
            background: '#fff', transition: 'left 0.15s',
          }} />
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>

        {/* Portfolio Trend */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)',
          padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          <div style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            Portfolio Trend
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <trendIcon size={32} color={trendColor} />
            <div>
              <div style={{
                fontFamily: 'var(--font-family-primary)', fontSize: '24px',
                fontWeight: 'var(--font-weight-bold)', color: trendColor, lineHeight: '1.1',
              }}>
                {trendLabel}
              </div>
              <div style={{
                fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
              }}>
                Avg score: {currentAvg.toFixed(1)} {trendDelta !== 0 && (
                  <span style={{ color: trendColor }}>
                    ({trendDelta > 0 ? '↓' : '↑'} {Math.abs(trendDelta).toFixed(1)} vs prior)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Appetite Compliance */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)',
          padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          <div style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            Appetite Compliance
          </div>
          <div style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '24px',
            fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', lineHeight: '1.1',
          }}>
            {withinAppetite} <span style={{ fontSize: '14px', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)' }}>within appetite</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <Pill label={`${approaching} approaching`} bg="#FFF3E0" color="#E07B00" />
            <Pill label={`${breaching} breaching`} bg="rgba(192,57,43,0.10)" color="#C0392B" />
          </div>
        </div>

        {/* Active Risk Count */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)',
          padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          <div style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {enterpriseOnly ? 'Enterprise' : 'Active'} Risks
          </div>
          <div style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '24px',
            fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', lineHeight: '1.1',
          }}>
            {displayRisks.length}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {(['critical','high','medium','low'] as const).map(rating => {
              const count = displayRisks.filter(r => {
                const s = currentMap.get(r.id)?.riskRating;
                return s === rating;
              }).length;
              if (!count) return null;
              const st = RISK_RATING_STYLES[rating];
              return <Pill key={rating} label={`${count} ${RISK_RATING_LABELS[rating]}`} bg={st.background} color={st.color} />;
            })}
          </div>
        </div>

        {/* Controls Coverage */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)',
          padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          <div style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            Control Coverage
          </div>
          {(() => {
            const activeCtlIds = new Set(allControls.filter(c => c.status === 'active').map(c => c.id));
            const covered = new Set(allRiskControls.filter(rc => activeCtlIds.has(rc.controlId)).map(rc => rc.riskId));
            const pct = displayRisks.length ? Math.round((displayRisks.filter(r => covered.has(r.id)).length / displayRisks.length) * 100) : 0;
            const color = pct >= 80 ? '#1C8A45' : pct >= 60 ? '#E07B00' : '#C0392B';
            return (
              <>
                <div style={{
                  fontFamily: 'var(--font-family-primary)', fontSize: '24px',
                  fontWeight: 'var(--font-weight-bold)', color, lineHeight: '1.1',
                }}>
                  {pct}%
                </div>
                <div style={{
                  height: '6px', borderRadius: '3px', background: 'var(--muted)', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', width: `${pct}%`, background: color,
                    borderRadius: '3px', transition: 'width 0.4s',
                  }} />
                </div>
                <div style={{
                  fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                  fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
                }}>
                  of risks have active controls
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Heat map + Top enterprise risks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '16px', alignItems: 'start' }}>

        {/* Heat Map */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)',
          padding: '16px', flexShrink: 0,
        }}>
          <SectionHeader title="Risk Heat Map" subtitle={`${displayRisks.length} active risks`} />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            {/* Y label */}
            <div style={{
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              height: '250px', gap: '0',
              fontFamily: 'var(--font-family-primary)', fontSize: '10px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
              writingMode: 'vertical-rl', textOrientation: 'mixed',
              transform: 'rotate(180deg)', letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              Likelihood →
            </div>
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {/* Rows: likelihood 5→1 */}
                {[4,3,2,1,0].map(lIdx => (
                  <div key={lIdx} style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                    <div style={{
                      width: '60px', textAlign: 'right', paddingRight: '6px',
                      fontFamily: 'var(--font-family-primary)', fontSize: '10px',
                      color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-semibold)',
                      whiteSpace: 'nowrap',
                    }}>
                      {LIKELIHOOD_LABELS[lIdx]}
                    </div>
                    {[0,1,2,3,4].map(iIdx => {
                      const count = heatMap[lIdx]?.[iIdx] ?? 0;
                      const score = (lIdx + 1) * (iIdx + 1);
                      const { bg, color } = getCellStyle(score);
                      return (
                        <div key={iIdx} style={{
                          width: '46px', height: '46px', borderRadius: '2px',
                          background: bg, color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-family-primary)', fontSize: count > 0 ? '16px' : '11px',
                          fontWeight: 'var(--font-weight-bold)',
                          opacity: count === 0 ? 0.35 : 1,
                        }}>
                          {count > 0 ? count : '·'}
                        </div>
                      );
                    })}
                  </div>
                ))}
                {/* X axis labels */}
                <div style={{ display: 'flex', gap: '2px', marginTop: '4px', paddingLeft: '66px' }}>
                  {IMPACT_LABELS.map((lbl, i) => (
                    <div key={i} style={{
                      width: '46px', textAlign: 'center',
                      fontFamily: 'var(--font-family-primary)', fontSize: '9px',
                      color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-semibold)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {lbl}
                    </div>
                  ))}
                </div>
                <div style={{
                  textAlign: 'center', paddingLeft: '66px', marginTop: '2px',
                  fontFamily: 'var(--font-family-primary)', fontSize: '10px',
                  fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  Impact →
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Enterprise Risks */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderBottom: '1px solid var(--border)',
          }}>
            <SectionHeader title="Top Enterprise Risks" subtitle="Ranked by residual score" />
            <button
              type="button" onClick={() => navigate('/risk-dashboard')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)',
              }}
            >
              View All <ChevronRight size={12} />
            </button>
          </div>

          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px',
            padding: '6px 16px', background: 'var(--muted)',
            borderBottom: '1px solid var(--border)',
          }}>
            {['Risk', 'Type', 'Current', 'vs Prior'].map(h => (
              <div key={h} style={{
                fontFamily: 'var(--font-family-primary)', fontSize: '11px',
                fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {h}
              </div>
            ))}
          </div>

          {topRisks.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                color: 'var(--muted-foreground)',
              }}>
                No enterprise risks found
              </div>
            </div>
          ) : topRisks.map(({ risk, current, previous }, i) => {
            const rating = current?.riskRating ?? 'negligible';
            const st = RISK_RATING_STYLES[rating];
            const delta = current && previous
              ? previous.residualScore - current.residualScore
              : null;
            const isLast = i === topRisks.length - 1;
            return (
              <div
                key={risk.id}
                onClick={() => navigate(`/risks/${risk.id}`)}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px',
                  padding: '10px 16px',
                  borderBottom: isLast ? 'none' : '1px solid var(--border)',
                  cursor: 'pointer', gap: '8px', alignItems: 'center',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--muted)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                <div>
                  <div style={{
                    fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {risk.title}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                    color: 'var(--muted-foreground)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {risk.owner?.name ?? '—'} · {risk.department}
                  </div>
                </div>
                <Pill
                  label={RISK_TYPE_LABELS[risk.riskType] ?? risk.riskType}
                  bg="rgba(35,34,240,0.06)"
                  color="var(--primary)"
                />
                {current ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    minWidth: '32px', height: '22px', padding: '0 6px', borderRadius: '100px',
                    background: st.background, color: st.color,
                    fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                    fontWeight: 'var(--font-weight-bold)',
                  }}>
                    {current.residualScore}
                  </span>
                ) : (
                  <Pill label="N/A" bg="#F0F2F7" color="#6B7489" />
                )}
                <div style={{
                  fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: delta === null ? '#6B7489' : delta > 0 ? '#1C8A45' : delta < 0 ? '#C0392B' : '#6B7489',
                }}>
                  {delta === null ? '—' : delta > 0 ? `↓ ${delta}` : delta < 0 ? `↑ ${Math.abs(delta)}` : '→ 0'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Escalation Panel */}
      {escalations.length > 0 && (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 16px', borderBottom: '1px solid var(--border)',
            background: 'rgba(192,57,43,0.04)',
          }}>
            <AlertTriangle size={14} color="#C0392B" />
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '14px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
            }}>
              Items Requiring Executive Attention
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: '20px', height: '20px', padding: '0 5px', borderRadius: '100px',
              background: 'rgba(192,57,43,0.10)',
              fontFamily: 'var(--font-family-primary)', fontSize: '11px',
              fontWeight: 'var(--font-weight-semibold)', color: '#C0392B',
            }}>
              {escalations.length}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '0' }}>
            {escalations.map((item, i) => {
              const isHigh = item.severity === 'high';
              return (
                <div
                  key={i}
                  onClick={() => item.riskId && navigate(`/risks/${item.riskId}`)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    borderRight: '1px solid var(--border)',
                    cursor: item.riskId ? 'pointer' : 'default',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={item.riskId ? e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--muted)'; } : undefined}
                  onMouseLeave={item.riskId ? e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; } : undefined}
                >
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, marginTop: '6px',
                    background: isHigh ? '#C0392B' : '#E07B00',
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <Pill
                        label={item.type}
                        bg={isHigh ? 'rgba(192,57,43,0.10)' : '#FFF3E0'}
                        color={isHigh ? '#C0392B' : '#E07B00'}
                      />
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {item.label}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                      color: 'var(--muted-foreground)', lineHeight: '18px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {item.sublabel}
                    </div>
                  </div>
                  {item.riskId && <ChevronRight size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0, marginTop: '2px' }} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}