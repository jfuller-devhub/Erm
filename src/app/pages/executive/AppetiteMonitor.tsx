import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronRight, Info } from 'lucide-react';
import { loadRisks, RISK_TYPE_LABELS } from '../../data/riskData';
import type { Risk, RiskType, AppetiteLevel } from '../../data/riskData';
import { loadRiskAssessments, RISK_RATING_STYLES } from '../../data/riskAssessmentData';
import type { RiskAssessment } from '../../data/riskAssessmentData';
import { APPETITE_THRESHOLDS } from '../../data/kriData';
import { formatDate } from '../../data/mockData';

// ─── Appetite level config ────────────────────────────────────────────────────

const APPETITE_LABELS: Record<string, string> = {
  averse:   'Averse (≤3)',
  minimal:  'Minimal (≤5)',
  cautious: 'Cautious (≤9)',
  open:     'Open (≤12)',
  hungry:   'Hungry (≤16)',
};

const APPETITE_COLORS: Record<string, string> = {
  averse:   '#C0392B',
  minimal:  '#E07B00',
  cautious: '#B8860B',
  open:     '#1C8A45',
  hungry:   '#2322F0',
};

const RISK_TYPE_COLORS: Record<string, string> = {
  strategic:    '#2322F0',
  operational:  '#E07B00',
  financial:    '#1C8A45',
  compliance:   '#00A3A3',
  reputational: '#C0392B',
  cyber:        '#6B3FA0',
};

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

// ─── Band bar component ───────────────────────────────────────────────────────

function BandBar({
  avgScore, threshold, count, approaching, breaching, label, color,
}: {
  avgScore: number; threshold: number; count: number;
  approaching: number; breaching: number;
  label: string; color: string;
}) {
  const maxScale = 25;
  const avgPct = Math.min(100, (avgScore / maxScale) * 100);
  const threshPct = Math.min(100, (threshold / maxScale) * 100);
  const isBreaching  = avgScore > threshold + 2;
  const isApproaching = avgScore > threshold && avgScore <= threshold + 2;
  const barColor = isBreaching ? '#C0392B' : isApproaching ? '#E07B00' : '#1C8A45';

  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-card)', padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: '10px',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0,
          }} />
          <span style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '14px',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
          }}>
            {label}
          </span>
          <span style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
            color: 'var(--muted-foreground)',
          }}>
            {count} risk{count !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {breaching > 0 && <Pill label={`${breaching} breaching`} bg="rgba(192,57,43,0.10)" color="#C0392B" />}
          {approaching > 0 && <Pill label={`${approaching} approaching`} bg="#FFF3E0" color="#E07B00" />}
          {breaching === 0 && approaching === 0 && <Pill label="All within appetite" bg="#E8F5EE" color="#1C8A45" />}
        </div>
      </div>

      {/* Band visualization */}
      <div style={{ position: 'relative' }}>
        {/* Track */}
        <div style={{
          height: '12px', borderRadius: '6px', background: 'var(--muted)',
          overflow: 'visible', position: 'relative',
        }}>
          {/* Green zone (up to threshold) */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${threshPct}%`, background: 'rgba(28,138,69,0.20)',
            borderRadius: '6px 0 0 6px',
          }} />
          {/* Threshold line */}
          <div style={{
            position: 'absolute', top: '-4px', bottom: '-4px',
            left: `${threshPct}%`,
            width: '2px', background: color, borderRadius: '1px',
            zIndex: 2,
          }} />
          {/* Actual avg marker */}
          <div style={{
            position: 'absolute', top: '-3px', bottom: '-3px',
            left: `${avgPct}%`, transform: 'translateX(-50%)',
            width: '18px', height: '18px', borderRadius: '50%',
            background: barColor, border: '2px solid white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            zIndex: 3,
          }} />
        </div>

        {/* Scale labels */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: '6px',
          fontFamily: 'var(--font-family-primary)', fontSize: '10px', color: 'var(--muted-foreground)',
        }}>
          <span>0</span>
          <span style={{ color }}>Threshold: {threshold}</span>
          <span>25</span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '16px' }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '11px',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            Avg Residual Score
          </div>
          <div style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '18px',
            fontWeight: 'var(--font-weight-bold)', color: barColor,
          }}>
            {avgScore.toFixed(1)}
          </div>
        </div>
        <div style={{ width: '1px', background: 'var(--border)' }} />
        <div>
          <div style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '11px',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            Appetite Threshold
          </div>
          <div style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '18px',
            fontWeight: 'var(--font-weight-bold)', color,
          }}>
            {threshold}
          </div>
        </div>
        <div style={{ width: '1px', background: 'var(--border)' }} />
        <div>
          <div style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '11px',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            Status
          </div>
          <div style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '14px',
            fontWeight: 'var(--font-weight-bold)', color: barColor,
          }}>
            {isBreaching ? 'Breaching' : isApproaching ? 'Approaching' : 'Within Appetite'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AppetiteMonitor() {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<string>('all');

  const allRisks       = useMemo(() => loadRisks(), []);
  const allAssessments = useMemo(() => loadRiskAssessments(), []);

  const currentMap = useMemo(() => {
    const m = new Map<string, RiskAssessment>();
    allAssessments.forEach(a => { if (a.isCurrent) m.set(a.riskId, a); });
    return m;
  }, [allAssessments]);

  const activeRisks = useMemo(() =>
    allRisks.filter(r => r.status === 'active'),
    [allRisks],
  );

  // Per risk-type aggregated band data
  const riskTypes = useMemo(() => {
    const types = [...new Set(activeRisks.map(r => r.riskType))];
    return types.map(type => {
      const risks = activeRisks.filter(r => r.riskType === type);
      const scores = risks.map(r => currentMap.get(r.id)?.residualScore).filter((s): s is number => s !== undefined);
      const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const avgThreshold = risks.length
        ? risks.reduce((s, r) => s + (APPETITE_THRESHOLDS[r.appetiteLevel] ?? 9), 0) / risks.length
        : 9;

      let approaching = 0, breaching = 0;
      risks.forEach(r => {
        const score     = currentMap.get(r.id)?.residualScore;
        const threshold = APPETITE_THRESHOLDS[r.appetiteLevel] ?? 9;
        if (score === undefined) return;
        if (score > threshold + 2) breaching++;
        else if (score > threshold) approaching++;
      });

      return { type, risks, avgScore, avgThreshold, approaching, breaching };
    }).sort((a, b) => b.avgScore - a.avgScore);
  }, [activeRisks, currentMap]);

  // Individual breaching risks
  const breachingRisks = useMemo(() =>
    activeRisks
      .map(r => {
        const score     = currentMap.get(r.id)?.residualScore;
        const threshold = APPETITE_THRESHOLDS[r.appetiteLevel] ?? 9;
        const assessment = currentMap.get(r.id) ?? null;
        return { risk: r, score, threshold, assessment };
      })
      .filter(({ score, threshold }) => score !== undefined && score > threshold)
      .sort((a, b) => ((b.score ?? 0) - (b.threshold)) - ((a.score ?? 0) - (a.threshold))),
    [activeRisks, currentMap],
  );

  const filteredBands = filterType === 'all'
    ? riskTypes
    : riskTypes.filter(t => t.type === filterType);

  // Summary counts
  const totalWithin    = activeRisks.filter(r => { const s = currentMap.get(r.id)?.residualScore; const t = APPETITE_THRESHOLDS[r.appetiteLevel] ?? 9; return s !== undefined && s <= t; }).length;
  const totalApproach  = activeRisks.filter(r => { const s = currentMap.get(r.id)?.residualScore; const t = APPETITE_THRESHOLDS[r.appetiteLevel] ?? 9; return s !== undefined && s > t && s <= t + 2; }).length;
  const totalBreach    = activeRisks.filter(r => { const s = currentMap.get(r.id)?.residualScore; const t = APPETITE_THRESHOLDS[r.appetiteLevel] ?? 9; return s !== undefined && s > t + 2; }).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Summary strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
      }}>
        {[
          { label: 'Within Appetite', count: totalWithin, bg: '#E8F5EE', color: '#1C8A45', desc: 'Residual ≤ threshold' },
          { label: 'Approaching Limit', count: totalApproach, bg: '#FFF3E0', color: '#E07B00', desc: 'Within +2 of threshold' },
          { label: 'Breaching Appetite', count: totalBreach, bg: 'rgba(192,57,43,0.10)', color: '#C0392B', desc: 'Exceeds threshold by >2' },
          { label: 'No Assessment', count: activeRisks.filter(r => !currentMap.has(r.id)).length, bg: '#F0F2F7', color: '#6B7489', desc: 'Cannot determine posture' },
        ].map(item => (
          <div key={item.label} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)',
            padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px',
          }}>
            <div style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {item.label}
            </div>
            <div style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '28px',
              fontWeight: 'var(--font-weight-bold)', color: item.color, lineHeight: '1',
            }}>
              {item.count}
            </div>
            <div style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '11px',
              fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
            }}>
              {item.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Appetite legend */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Info size={13} color="var(--muted-foreground)" />
          <span style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
          }}>
            Appetite levels:
          </span>
        </div>
        {Object.entries(APPETITE_LABELS).map(([level, label]) => (
          <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '2px',
              background: APPETITE_COLORS[level],
            }} />
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              fontWeight: 'var(--font-weight-regular)', color: 'var(--foreground)',
            }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setFilterType('all')}
          style={{
            height: '30px', padding: '0 12px', border: '1px solid var(--border)',
            borderRadius: '100px',
            background: filterType === 'all' ? 'var(--primary)' : 'var(--card)',
            color: filterType === 'all' ? 'var(--primary-foreground)' : 'var(--foreground)',
            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
          }}
        >
          All Types
        </button>
        {riskTypes.map(t => (
          <button
            key={t.type}
            type="button"
            onClick={() => setFilterType(t.type)}
            style={{
              height: '30px', padding: '0 12px', border: '1px solid var(--border)',
              borderRadius: '100px',
              background: filterType === t.type ? 'var(--primary)' : 'var(--card)',
              color: filterType === t.type ? 'var(--primary-foreground)' : 'var(--foreground)',
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
            }}
          >
            {RISK_TYPE_LABELS[t.type as RiskType] ?? t.type}
          </button>
        ))}
      </div>

      {/* Band charts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredBands.map(band => (
          <BandBar
            key={band.type}
            label={RISK_TYPE_LABELS[band.type as RiskType] ?? band.type}
            color={RISK_TYPE_COLORS[band.type] ?? '#6B7489'}
            avgScore={band.avgScore}
            threshold={Math.round(band.avgThreshold)}
            count={band.risks.length}
            approaching={band.approaching}
            breaching={band.breaching}
          />
        ))}
      </div>

      {/* Breaching risks table */}
      {breachingRisks.length > 0 && (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(192,57,43,0.04)',
          }}>
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '14px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
            }}>
              Risks Breaching Stated Appetite
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: '20px', height: '20px', padding: '0 5px', borderRadius: '100px',
              background: 'rgba(192,57,43,0.10)',
              fontFamily: 'var(--font-family-primary)', fontSize: '11px',
              fontWeight: 'var(--font-weight-semibold)', color: '#C0392B',
            }}>
              {breachingRisks.length}
            </span>
          </div>

          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px 100px',
            padding: '6px 16px', background: 'var(--muted)', borderBottom: '1px solid var(--border)',
          }}>
            {['Risk', 'Type', 'Residual', 'Threshold', 'Appetite'].map(h => (
              <div key={h} style={{
                fontFamily: 'var(--font-family-primary)', fontSize: '11px',
                fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {h}
              </div>
            ))}
          </div>

          {breachingRisks.map(({ risk, score, threshold, assessment }, i) => {
            const rating = assessment?.riskRating ?? 'negligible';
            const st = RISK_RATING_STYLES[rating];
            const isLast = i === breachingRisks.length - 1;
            const excess = (score ?? 0) - threshold;
            return (
              <div
                key={risk.id}
                onClick={() => navigate(`/risks/${risk.id}`)}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px 100px',
                  padding: '10px 16px', alignItems: 'center', gap: '8px',
                  borderBottom: isLast ? 'none' : '1px solid var(--border)',
                  cursor: 'pointer', transition: 'background 0.1s',
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
                  }}>
                    {risk.owner?.name ?? '—'} · {risk.department}
                  </div>
                </div>
                <span style={{
                  fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                  fontWeight: 'var(--font-weight-regular)', color: RISK_TYPE_COLORS[risk.riskType] ?? 'var(--muted-foreground)',
                }}>
                  {RISK_TYPE_LABELS[risk.riskType] ?? risk.riskType}
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: '32px', height: '22px', padding: '0 6px', borderRadius: '100px',
                  background: st.background, color: st.color,
                  fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                  fontWeight: 'var(--font-weight-bold)',
                }}>
                  {score ?? '—'}
                </span>
                <span style={{
                  fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                  fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                }}>
                  {threshold}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{
                    fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: APPETITE_COLORS[risk.appetiteLevel] ?? '#6B7489',
                  }}>
                    {APPETITE_LABELS[risk.appetiteLevel]?.split(' ')[0] ?? risk.appetiteLevel}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-family-primary)', fontSize: '11px',
                    fontWeight: 'var(--font-weight-semibold)', color: '#C0392B',
                  }}>
                    (+{excess})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}