import React, { useMemo, useState, useRef } from 'react';
import { Printer, Download, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Minus, Shield } from 'lucide-react';
import { loadRisks, RISK_TYPE_LABELS } from '../../data/riskData';
import { loadRiskAssessments, RISK_RATING_STYLES, RISK_RATING_LABELS } from '../../data/riskAssessmentData';
import type { RiskAssessment } from '../../data/riskAssessmentData';
import { loadControls } from '../../data/controlData';
import { loadRiskControls } from '../../data/riskControlData';
import { loadRiskMitigations } from '../../data/riskMitigationData';
import { loadKRIs, calculateKRIValue, deriveKRIStatus, KRI_STATUS_STYLES } from '../../data/kriData';
import type { KRI } from '../../data/kriData';
import { APPETITE_THRESHOLDS } from '../../data/kriData';
import { formatDate } from '../../data/mockData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PERIODS = [
  'Q1 2026', 'Q4 2025', 'Q3 2025', 'Q2 2025', 'Q1 2025',
];

function Pill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', height: '18px', padding: '0 6px',
      borderRadius: '100px', background: bg, color,
      fontFamily: 'var(--font-family-primary)', fontSize: '11px',
      fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      borderTop: '2px solid var(--border)',
      paddingTop: '20px', marginTop: '4px',
    }}>
      <div style={{
        fontFamily: 'var(--font-family-primary)', fontSize: '16px',
        fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
        marginBottom: '12px',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BoardReport() {
  const [period, setPeriod]     = useState(PERIODS[0]);
  const [summary, setSummary]   = useState(
    'The enterprise risk portfolio shows overall improvement this quarter, with average residual scores declining by 1.8 points versus the prior period. Three risks remain in breach of their stated appetite thresholds and require board-level acknowledgement. Control coverage has expanded to 76% of active risks, up from 65% in Q3. Key concerns this quarter include the ongoing High rating on Ransomware and Vendor Single-Point-of-Failure risks. The KRI portfolio shows 6 of 10 indicators in amber, with improving trends across phishing simulation and MTTR metrics.',
  );
  const printRef = useRef<HTMLDivElement>(null);

  // Load all data
  const allRisks        = useMemo(() => loadRisks(), []);
  const allAssessments  = useMemo(() => loadRiskAssessments(), []);
  const allControls     = useMemo(() => loadControls(), []);
  const allRiskControls = useMemo(() => loadRiskControls(), []);
  const allMitigations  = useMemo(() => loadRiskMitigations(), []);
  const allKris         = useMemo(() => loadKRIs(), []);

  const currentMap = useMemo(() => {
    const m = new Map<string, RiskAssessment>();
    allAssessments.forEach(a => { if (a.isCurrent) m.set(a.riskId, a); });
    return m;
  }, [allAssessments]);

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

  const activeRisks = useMemo(() => allRisks.filter(r => r.status === 'active'), [allRisks]);

  // Portfolio metrics
  const metrics = useMemo(() => {
    const withScores = activeRisks.filter(r => currentMap.has(r.id));
    const curAvg = withScores.length
      ? withScores.reduce((s, r) => s + (currentMap.get(r.id)?.residualScore ?? 0), 0) / withScores.length
      : 0;
    const prevScores = withScores.map(r => prevMap.get(r.id)?.residualScore).filter((s): s is number => s !== undefined);
    const prevAvg = prevScores.length ? prevScores.reduce((a, b) => a + b, 0) / prevScores.length : 0;
    const delta = prevAvg - curAvg;

    const activeCtlIds = new Set(allControls.filter(c => c.status === 'active').map(c => c.id));
    const coveredRiskIds = new Set(allRiskControls.filter(rc => activeCtlIds.has(rc.controlId)).map(rc => rc.riskId));
    const coveragePct = activeRisks.length ? Math.round((activeRisks.filter(r => coveredRiskIds.has(r.id)).length / activeRisks.length) * 100) : 0;

    const highCritical = activeRisks.filter(r => (currentMap.get(r.id)?.residualScore ?? 0) >= 12).length;
    const breaching = activeRisks.filter(r => {
      const s = currentMap.get(r.id)?.residualScore;
      const t = APPETITE_THRESHOLDS[r.appetiteLevel] ?? 9;
      return s !== undefined && s > t + 2;
    }).length;

    return { curAvg, prevAvg, delta, coveragePct, highCritical, breaching, total: activeRisks.length };
  }, [activeRisks, currentMap, prevMap, allControls, allRiskControls]);

  // Top 5 risks for the report
  const top5Risks = useMemo(() =>
    [...activeRisks]
      .map(r => {
        const cur  = currentMap.get(r.id) ?? null;
        const prev = prevMap.get(r.id) ?? null;
        const delta = cur && prev ? prev.residualScore - cur.residualScore : null;
        return { risk: r, cur, prev, delta };
      })
      .sort((a, b) => (b.cur?.residualScore ?? 0) - (a.cur?.residualScore ?? 0))
      .slice(0, 5),
    [activeRisks, currentMap, prevMap],
  );

  // Appetite compliance by type
  const appetiteByType = useMemo(() => {
    const types = [...new Set(activeRisks.map(r => r.riskType))];
    return types.map(type => {
      const risks = activeRisks.filter(r => r.riskType === type);
      let within = 0, breach = 0;
      risks.forEach(r => {
        const s = currentMap.get(r.id)?.residualScore;
        const t = APPETITE_THRESHOLDS[r.appetiteLevel] ?? 9;
        if (s === undefined) return;
        if (s <= t) within++;
        else breach++;
      });
      return { type, within, breach, total: risks.length };
    });
  }, [activeRisks, currentMap]);

  // KRI snapshot
  const calcCtx = useMemo(() => ({
    controls:     allControls,
    risks:        allRisks,
    assessments:  allAssessments,
    riskControls: allRiskControls,
    mitigations:  allMitigations,
  }), [allControls, allRisks, allAssessments, allRiskControls, allMitigations]);

  const kriSnapshot = useMemo(() =>
    allKris.filter(k => k.isActive).map(k => {
      const val = calculateKRIValue(k, calcCtx);
      return { kri: k, value: val, status: deriveKRIStatus(k, val) };
    }),
    [allKris, calcCtx],
  );

  const kriCounts = { green: kriSnapshot.filter(k => k.status === 'green').length, amber: kriSnapshot.filter(k => k.status === 'amber').length, red: kriSnapshot.filter(k => k.status === 'red').length };

  // Actions taken: risks with assessments in last 90 days
  const recentActions = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    return allAssessments
      .filter(a => a.isCurrent && new Date(a.assessmentDate) >= cutoff)
      .map(a => {
        const risk = allRisks.find(r => r.id === a.riskId);
        return risk ? { risk, assessment: a } : null;
      })
      .filter(Boolean)
      .slice(0, 6) as { risk: typeof allRisks[0]; assessment: RiskAssessment }[];
  }, [allAssessments, allRisks]);

  function handlePrint() {
    window.print();
  }

  const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Controls bar — hidden on print */}
      <div className="no-print" style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)',
        padding: '16px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
            }}>
              Report Period
            </label>
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              style={{
                height: '36px', padding: '0 10px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-input)', background: 'var(--input-background)',
                color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)', cursor: 'pointer', minWidth: '140px',
              }}
            >
              {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button" onClick={handlePrint}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              height: '36px', padding: '0 16px', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-button)', background: 'var(--card)',
              fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', cursor: 'pointer',
            }}
          >
            <Printer size={14} /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* ── Report Body ── */}
      <div
        ref={printRef}
        style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)',
          padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '24px',
        }}
      >
        {/* Report header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          paddingBottom: '20px', borderBottom: '3px solid var(--primary)',
          flexWrap: 'wrap', gap: '12px',
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '22px',
              fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', lineHeight: '30px',
            }}>
              Enterprise Risk Management
            </div>
            <div style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '18px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)', lineHeight: '26px',
            }}>
              Board Risk Report — {period}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
            }}>
              Generated {todayStr}
            </div>
            <div style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', marginTop: '2px',
            }}>
              CONFIDENTIAL · Board Distribution Only
            </div>
          </div>
        </div>

        {/* Section 1: Risk Posture at a Glance */}
        <ReportSection title="1. Risk Posture at a Glance">
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
          }}>
            {[
              { label: 'Total Active Risks', value: metrics.total, color: 'var(--foreground)' },
              { label: 'High / Critical Risks', value: metrics.highCritical, color: '#C0392B' },
              { label: 'Breaching Appetite', value: metrics.breaching, color: '#C0392B' },
              { label: 'Avg Residual Score', value: metrics.curAvg.toFixed(1), color: metrics.curAvg >= 12 ? '#C0392B' : metrics.curAvg >= 6 ? '#E07B00' : '#1C8A45' },
              { label: 'Control Coverage', value: `${metrics.coveragePct}%`, color: metrics.coveragePct >= 80 ? '#1C8A45' : metrics.coveragePct >= 60 ? '#E07B00' : '#C0392B' },
            ].map(m => (
              <div key={m.label} style={{
                border: '1px solid var(--border)', borderRadius: 'var(--radius-card)',
                padding: '12px', textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: 'var(--font-family-primary)', fontSize: '24px',
                  fontWeight: 'var(--font-weight-bold)', color: m.color, lineHeight: '1.2',
                }}>
                  {m.value}
                </div>
                <div style={{
                  fontFamily: 'var(--font-family-primary)', fontSize: '11px',
                  fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
                  textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px',
                }}>
                  {m.label}
                </div>
              </div>
            ))}
          </div>

          {/* Trend indicator */}
          <div style={{
            marginTop: '12px', padding: '10px 14px',
            background: metrics.delta > 0.5 ? '#E8F5EE' : metrics.delta < -0.5 ? 'rgba(192,57,43,0.06)' : '#FFF8E1',
            borderRadius: 'var(--radius-card)', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            {metrics.delta > 0.5
              ? <TrendingDown size={16} color="#1C8A45" />
              : metrics.delta < -0.5
                ? <TrendingUp size={16} color="#C0392B" />
                : <Minus size={16} color="#B8860B" />
            }
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: metrics.delta > 0.5 ? '#1C8A45' : metrics.delta < -0.5 ? '#C0392B' : '#B8860B',
            }}>
              Portfolio trend: {metrics.delta > 0.5 ? 'Improving' : metrics.delta < -0.5 ? 'Deteriorating' : 'Stable'}
              {metrics.delta !== 0 && ` (avg score ${metrics.delta > 0 ? '↓' : '↑'} ${Math.abs(metrics.delta).toFixed(1)} vs prior period)`}
            </span>
          </div>
        </ReportSection>

        {/* Section 2: Executive Summary */}
        <ReportSection title="2. Executive Summary">
          <textarea
            value={summary}
            onChange={e => setSummary(e.target.value)}
            rows={5}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 12px', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-input)', background: 'var(--muted)',
              fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)', color: 'var(--foreground)',
              lineHeight: '22px', resize: 'vertical', outline: 'none',
            }}
          />
          <div style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '11px',
            color: 'var(--muted-foreground)', marginTop: '4px',
          }}>
            Edit this field before printing. Content is not saved across sessions.
          </div>
        </ReportSection>

        {/* Section 3: Top 5 Risks */}
        <ReportSection title="3. Top 5 Active Risks">
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px 70px',
              padding: '6px 14px', background: 'var(--muted)', borderBottom: '1px solid var(--border)',
            }}>
              {['Risk', 'Type', 'Rating', 'Score', 'Trend'].map(h => (
                <div key={h} style={{
                  fontFamily: 'var(--font-family-primary)', fontSize: '11px',
                  fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {h}
                </div>
              ))}
            </div>
            {top5Risks.map(({ risk, cur, delta }, i) => {
              const rating  = cur?.riskRating ?? 'negligible';
              const st      = RISK_RATING_STYLES[rating];
              const isLast  = i === top5Risks.length - 1;
              const TrendIc = delta === null ? Minus : delta > 0 ? TrendingDown : delta < 0 ? TrendingUp : Minus;
              const tColor  = delta === null ? '#6B7489' : delta > 0 ? '#1C8A45' : delta < 0 ? '#C0392B' : '#6B7489';
              return (
                <div
                  key={risk.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px 70px',
                    padding: '10px 14px', alignItems: 'center', gap: '8px',
                    borderBottom: isLast ? 'none' : '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                    }}>
                      {risk.title}
                    </div>
                    <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                      {risk.owner?.name ?? '—'} · {risk.department}
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                    {RISK_TYPE_LABELS[risk.riskType] ?? risk.riskType}
                  </span>
                  <Pill label={RISK_RATING_LABELS[rating]} bg={st.background} color={st.color} />
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '32px', height: '22px', borderRadius: '100px',
                    background: st.background, color: st.color,
                    fontFamily: 'var(--font-family-primary)', fontSize: '13px',
                    fontWeight: 'var(--font-weight-bold)',
                  }}>
                    {cur?.residualScore ?? '—'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: tColor }}>
                    <TrendIc size={13} color={tColor} />
                    <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', color: tColor }}>
                      {delta !== null && delta !== 0 ? `${delta > 0 ? '-' : '+'}${Math.abs(delta)}` : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </ReportSection>

        {/* Section 4: Appetite Compliance */}
        <ReportSection title="4. Risk Appetite Compliance">
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '120px 1fr 70px 70px',
              padding: '6px 14px', background: 'var(--muted)', borderBottom: '1px solid var(--border)',
            }}>
              {['Risk Type', 'Compliance Bar', 'Within', 'Breaching'].map(h => (
                <div key={h} style={{
                  fontFamily: 'var(--font-family-primary)', fontSize: '11px',
                  fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {h}
                </div>
              ))}
            </div>
            {appetiteByType.map((row, i) => {
              const pct = row.total ? Math.round((row.within / row.total) * 100) : 0;
              const isLast = i === appetiteByType.length - 1;
              return (
                <div
                  key={row.type}
                  style={{
                    display: 'grid', gridTemplateColumns: '120px 1fr 70px 70px',
                    padding: '10px 14px', alignItems: 'center', gap: '12px',
                    borderBottom: isLast ? 'none' : '1px solid var(--border)',
                  }}
                >
                  <div style={{
                    fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                  }}>
                    {RISK_TYPE_LABELS[row.type] ?? row.type}
                  </div>
                  <div>
                    <div style={{
                      height: '8px', background: 'var(--muted)', borderRadius: '4px', overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: pct === 100 ? '#1C8A45' : pct >= 70 ? '#E07B00' : '#C0392B',
                        borderRadius: '4px',
                      }} />
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-family-primary)', fontSize: '11px',
                      color: 'var(--muted-foreground)', marginTop: '2px',
                    }}>
                      {pct}% within appetite
                    </div>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-family-primary)', fontSize: '14px',
                    fontWeight: 'var(--font-weight-bold)', color: '#1C8A45',
                  }}>
                    {row.within}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-family-primary)', fontSize: '14px',
                    fontWeight: 'var(--font-weight-bold)', color: row.breach > 0 ? '#C0392B' : '#6B7489',
                  }}>
                    {row.breach}
                  </span>
                </div>
              );
            })}
          </div>
        </ReportSection>

        {/* Section 5: KRI Snapshot */}
        <ReportSection title="5. Key Risk Indicators (KRI) Snapshot">
          {/* Summary row */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {[
              { label: 'On Track', count: kriCounts.green, bg: '#E8F5EE', color: '#1C8A45' },
              { label: 'Caution', count: kriCounts.amber, bg: '#FFF3E0', color: '#E07B00' },
              { label: 'Breached', count: kriCounts.red, bg: 'rgba(192,57,43,0.10)', color: '#C0392B' },
            ].map(k => (
              <div key={k.label} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: 'var(--radius-card)', background: k.bg,
              }}>
                <span style={{
                  fontFamily: 'var(--font-family-primary)', fontSize: '18px',
                  fontWeight: 'var(--font-weight-bold)', color: k.color, lineHeight: '1',
                }}>
                  {k.count}
                </span>
                <span style={{
                  fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                  fontWeight: 'var(--font-weight-semibold)', color: k.color,
                }}>
                  {k.label}
                </span>
              </div>
            ))}
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px',
              padding: '6px 14px', background: 'var(--muted)', borderBottom: '1px solid var(--border)',
            }}>
              {['Indicator', 'Category', 'Value', 'Status'].map(h => (
                <div key={h} style={{
                  fontFamily: 'var(--font-family-primary)', fontSize: '11px',
                  fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {h}
                </div>
              ))}
            </div>
            {kriSnapshot.map(({ kri, value, status }, i) => {
              const st = KRI_STATUS_STYLES[status];
              const isLast = i === kriSnapshot.length - 1;
              return (
                <div
                  key={kri.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px',
                    padding: '8px 14px', alignItems: 'center', gap: '8px',
                    borderBottom: isLast ? 'none' : '1px solid var(--border)',
                  }}
                >
                  <div style={{
                    fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {kri.name}
                  </div>
                  <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                    {kri.category}
                  </span>
                  <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-bold)', color: st.color }}>
                    {value !== null ? `${value}${kri.unit}` : '—'}
                  </span>
                  <Pill label={st.label.split(' ')[0]} bg={st.background} color={st.color} />
                </div>
              );
            })}
          </div>
        </ReportSection>

        {/* Section 6: Actions Taken */}
        <ReportSection title="6. Actions Taken This Quarter">
          {recentActions.length === 0 ? (
            <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>
              No risk assessments completed in the last 90 days.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
              {recentActions.map(({ risk, assessment }, i) => {
                const isLast = i === recentActions.length - 1;
                return (
                  <div key={risk.id} style={{
                    padding: '10px 14px',
                    borderBottom: isLast ? 'none' : '1px solid var(--border)',
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                  }}>
                    <CheckCircle size={14} color="#1C8A45" style={{ marginTop: '3px', flexShrink: 0 }} />
                    <div>
                      <div style={{
                        fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                        fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                      }}>
                        {risk.title}
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                        color: 'var(--muted-foreground)', marginTop: '2px',
                      }}>
                        Assessment completed {formatDate(assessment.assessmentDate)} by {assessment.reviewer?.name ?? '—'} ·
                        Residual score: {assessment.residualScore} ({RISK_RATING_LABELS[assessment.riskRating]})
                        {assessment.notes ? ` · "${assessment.notes.slice(0, 80)}${assessment.notes.length > 80 ? '…' : ''}"` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ReportSection>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid var(--border)', paddingTop: '16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '8px',
        }}>
          <div style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '11px',
            color: 'var(--muted-foreground)',
          }}>
            Enterprise Risk Management · {period} · Generated {todayStr}
          </div>
          <div style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '11px',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
          }}>
            CONFIDENTIAL — For Board Distribution Only
          </div>
        </div>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
