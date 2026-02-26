import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, ResponsiveContainer, ReferenceLine, Tooltip,
} from 'recharts';
import { Plus, RefreshCw, Edit2, Zap, PenLine } from 'lucide-react';
import {
  loadKRIs, saveKRIs, calculateKRIValue, deriveKRIStatus,
  SEED_KRIS, KRI_CALC_SOURCE_LABELS, KRI_STATUS_STYLES,
} from '../../data/kriData';
import type { KRI, KRICalculationSource, KRIThresholdDirection } from '../../data/kriData';
import { loadRisks } from '../../data/riskData';
import { loadRiskAssessments } from '../../data/riskAssessmentData';
import { loadControls } from '../../data/controlData';
import { loadRiskControls } from '../../data/riskControlData';
import { loadRiskMitigations } from '../../data/riskMitigationData';
import { MOCK_USERS, formatDate } from '../../data/mockData';

// ─── Sparkline tooltip ────────────────────────────────────────────────────────

function SparkTip({ active, payload, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-card)', padding: '6px 8px',
      boxShadow: 'var(--elevation-sm)',
    }}>
      <div style={{
        fontFamily: 'var(--font-family-primary)', fontSize: '12px',
        fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)',
      }}>
        {payload[0]?.value}{unit}
      </div>
      <div style={{
        fontFamily: 'var(--font-family-primary)', fontSize: '11px',
        color: 'var(--muted-foreground)',
      }}>
        {payload[0]?.payload?.date}
      </div>
    </div>
  );
}

// ─── KRI Card ─────────────────────────────────────────────────────────────────

function KRICard({
  kri, liveValue, onRecordReading, onEdit,
}: {
  kri: KRI;
  liveValue: number | null;
  onRecordReading: (kri: KRI) => void;
  onEdit: (kri: KRI) => void;
}) {
  const status = deriveKRIStatus(kri, liveValue);
  const st = KRI_STATUS_STYLES[status];
  const isAuto = kri.calculationSource !== 'manual';

  // Build sparkline data: historical + live value as last point
  const chartData = useMemo(() => {
    const pts = kri.dataPoints.map(dp => ({ date: dp.date, value: dp.value }));
    if (liveValue !== null) {
      const today = new Date().toISOString().split('T')[0];
      pts.push({ date: today, value: liveValue });
    }
    return pts.slice(-7);
  }, [kri.dataPoints, liveValue]);

  const lineColor = status === 'green' ? '#1C8A45' : status === 'amber' ? '#E07B00' : status === 'red' ? '#C0392B' : '#6B7489';

  const prevValue = chartData.length >= 2 ? chartData[chartData.length - 2]?.value : null;
  const delta = (liveValue !== null && prevValue !== null) ? liveValue - prevValue : null;
  const isImproving = delta !== null && (
    (kri.thresholdDirection === 'lower_is_better' && delta < 0) ||
    (kri.thresholdDirection === 'higher_is_better' && delta > 0)
  );
  const isDeteriorating = delta !== null && !isImproving && delta !== 0;

  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Status accent band */}
      <div style={{ height: '4px', background: lineColor, flexShrink: 0 }} />

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
              lineHeight: '20px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {kri.name}
            </div>
            <div style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '11px',
              color: 'var(--muted-foreground)', marginTop: '2px',
            }}>
              {kri.category}
            </div>
          </div>
          {/* Status pill */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', height: '20px', padding: '0 8px',
            borderRadius: '100px', background: st.background, color: st.color,
            fontFamily: 'var(--font-family-primary)', fontSize: '11px',
            fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {st.label}
          </span>
        </div>

        {/* Value + delta */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '28px',
            fontWeight: 'var(--font-weight-bold)', color: lineColor, lineHeight: '1',
          }}>
            {liveValue !== null ? liveValue : '—'}
          </span>
          <span style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '14px',
            fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
          }}>
            {kri.unit}
          </span>
          {delta !== null && delta !== 0 && (
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)',
              color: isImproving ? '#1C8A45' : '#C0392B',
            }}>
              {delta > 0 ? '+' : ''}{typeof delta === 'number' ? delta.toFixed(delta % 1 !== 0 ? 1 : 0) : delta}{kri.unit}
            </span>
          )}
        </div>

        {/* Sparkline */}
        {chartData.length > 1 && (
          <div style={{ height: '52px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                <ReferenceLine
                  y={kri.greenThreshold}
                  stroke="#1C8A45"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  strokeOpacity={0.6}
                />
                <ReferenceLine
                  y={kri.amberThreshold}
                  stroke="#E07B00"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  strokeOpacity={0.6}
                />
                <Tooltip content={<SparkTip unit={kri.unit} />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={lineColor}
                  strokeWidth={2}
                  dot={{ r: 2, fill: lineColor, strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Threshold indicators */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '8px', height: '2px', background: '#1C8A45', borderRadius: '1px' }} />
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '11px',
              fontWeight: 'var(--font-weight-semibold)', color: '#1C8A45',
            }}>
              Green ≤{kri.thresholdDirection === 'higher_is_better' ? '≥' : '≤'}{kri.greenThreshold}{kri.unit}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '8px', height: '2px', background: '#E07B00', borderRadius: '1px' }} />
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '11px',
              fontWeight: 'var(--font-weight-semibold)', color: '#E07B00',
            }}>
              Amber ≤{kri.thresholdDirection === 'higher_is_better' ? '≥' : '≤'}{kri.amberThreshold}{kri.unit}
            </span>
          </div>
        </div>

        {/* Footer: source + actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '4px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isAuto ? <Zap size={11} color="#00A3A3" /> : <PenLine size={11} color="var(--muted-foreground)" />}
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '11px',
              fontWeight: 'var(--font-weight-regular)',
              color: isAuto ? '#00A3A3' : 'var(--muted-foreground)',
            }}>
              {isAuto ? 'Auto-calculated' : 'Manual'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {!isAuto && (
              <button
                type="button"
                onClick={() => onRecordReading(kri)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '3px',
                  height: '26px', padding: '0 8px', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-button)', background: 'var(--card)',
                  fontFamily: 'var(--font-family-primary)', fontSize: '11px',
                  fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={10} /> Record
              </button>
            )}
            <button
              type="button"
              onClick={() => onEdit(kri)}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '26px', height: '26px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-button)', background: 'var(--card)',
                color: 'var(--muted-foreground)', cursor: 'pointer',
              }}
            >
              <Edit2 size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Record Reading Modal ─────────────────────────────────────────────────────

function RecordReadingModal({ kri, onClose, onSave }: { kri: KRI; onClose: () => void; onSave: (value: number) => void }) {
  const [value, setValue] = useState('');
  const parsed = parseFloat(value);
  const isValid = !isNaN(parsed);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        width: '100%', maxWidth: '400px', overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          fontFamily: 'var(--font-family-primary)', fontSize: '16px',
          fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
        }}>
          Record Reading
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
            color: 'var(--muted-foreground)',
          }}>
            {kri.name}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
            }}>
              New Value ({kri.unit}) *
            </label>
            <input
              type="number"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={`Enter value in ${kri.unit}`}
              style={{
                height: '36px', padding: '0 10px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-input)',
                background: 'var(--input-background)', color: 'var(--foreground)',
                fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                outline: 'none', width: '100%', boxSizing: 'border-box',
              }}
            />
            <div style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              color: 'var(--muted-foreground)',
            }}>
              Green: ≤{kri.greenThreshold}{kri.unit} · Amber: ≤{kri.amberThreshold}{kri.unit} · Red: {'>'}{kri.amberThreshold}{kri.unit}
            </div>
          </div>
        </div>
        <div style={{
          padding: '12px 20px', borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'flex-end', gap: '8px',
        }}>
          <button
            type="button" onClick={onClose}
            style={{
              height: '36px', padding: '0 16px', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-button)', background: 'var(--card)',
              fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { if (isValid) onSave(parsed); }}
            disabled={!isValid}
            style={{
              height: '36px', padding: '0 16px', border: 'none',
              borderRadius: 'var(--radius-button)',
              background: isValid ? 'var(--primary)' : 'var(--muted)',
              color: isValid ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)', cursor: isValid ? 'pointer' : 'not-allowed',
            }}
          >
            Save Reading
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add / Edit KRI Modal ────────────────────────────────────────────────────

const BLANK_KRI: Omit<KRI, 'id' | 'createdAt' | 'updatedAt' | 'status'> = {
  name: '', description: '', unit: '', category: '',
  calculationSource: 'manual', thresholdDirection: 'lower_is_better',
  greenThreshold: 0, amberThreshold: 0,
  dataPoints: [], currentValue: null, isActive: true, owner: MOCK_USERS[0],
};

function KRIFormModal({
  initial, onClose, onSave,
}: {
  initial?: KRI;
  onClose: () => void;
  onSave: (kri: Partial<KRI>) => void;
}) {
  const [form, setForm] = useState<typeof BLANK_KRI>(initial ?? BLANK_KRI);
  const set = (field: string, val: unknown) => setForm(f => ({ ...f, [field]: val }));

  const isValid = form.name.trim() && form.unit.trim() && form.greenThreshold >= 0 && form.amberThreshold >= 0;

  const calSources: KRICalculationSource[] = [
    'manual','auto_overdue_control_tests','auto_ineffective_controls',
    'auto_open_high_critical_risks','auto_overdue_risk_reviews',
    'auto_unmitigated_risks','auto_control_coverage',
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      overflowY: 'auto',
    }}>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        width: '100%', maxWidth: '560px',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          fontFamily: 'var(--font-family-primary)', fontSize: '16px',
          fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
        }}>
          {initial ? 'Edit KRI' : 'Add Key Risk Indicator'}
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} style={{ height: '36px', padding: '0 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-input)', background: 'var(--input-background)', color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', outline: 'none', width: '100%', boxSizing: 'border-box' as const }} />
          </div>

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-input)', background: 'var(--input-background)', color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', outline: 'none', width: '100%', boxSizing: 'border-box' as const, resize: 'vertical' }} />
          </div>

          {/* Unit + Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>Unit *</label>
              <input value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="%, count, days…" style={{ height: '36px', padding: '0 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-input)', background: 'var(--input-background)', color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', outline: 'none', width: '100%', boxSizing: 'border-box' as const }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>Category</label>
              <input value={form.category} onChange={e => set('category', e.target.value)} placeholder="Cyber, Risk, Compliance…" style={{ height: '36px', padding: '0 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-input)', background: 'var(--input-background)', color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', outline: 'none', width: '100%', boxSizing: 'border-box' as const }} />
            </div>
          </div>

          {/* Calculation source */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>Data Source *</label>
            <select value={form.calculationSource} onChange={e => set('calculationSource', e.target.value as KRICalculationSource)} style={{ height: '36px', padding: '0 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-input)', background: 'var(--input-background)', color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', cursor: 'pointer', width: '100%' }}>
              {calSources.map(s => <option key={s} value={s}>{KRI_CALC_SOURCE_LABELS[s]}</option>)}
            </select>
            <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>
              {form.calculationSource === 'manual' ? 'You will record values manually.' : 'Value will be auto-computed from live ERM data.'}
            </div>
          </div>

          {/* Threshold direction */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>Threshold Direction</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['lower_is_better', 'higher_is_better'] as KRIThresholdDirection[]).map(dir => (
                <label key={dir} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)' }}>
                  <input type="radio" name="direction" value={dir} checked={form.thresholdDirection === dir} onChange={() => set('thresholdDirection', dir)} style={{ accentColor: 'var(--primary)' }} />
                  {dir === 'lower_is_better' ? 'Lower is better' : 'Higher is better'}
                </label>
              ))}
            </div>
          </div>

          {/* Thresholds */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: '#1C8A45' }}>Green Threshold *</label>
              <input type="number" value={form.greenThreshold} onChange={e => set('greenThreshold', parseFloat(e.target.value) || 0)} style={{ height: '36px', padding: '0 10px', border: '1px solid #1C8A45', borderRadius: 'var(--radius-input)', background: 'var(--input-background)', color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', outline: 'none', width: '100%', boxSizing: 'border-box' as const }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: '#E07B00' }}>Amber Threshold *</label>
              <input type="number" value={form.amberThreshold} onChange={e => set('amberThreshold', parseFloat(e.target.value) || 0)} style={{ height: '36px', padding: '0 10px', border: '1px solid #E07B00', borderRadius: 'var(--radius-input)', background: 'var(--input-background)', color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', outline: 'none', width: '100%', boxSizing: 'border-box' as const }} />
              <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', color: 'var(--muted-foreground)' }}>Beyond this = Red</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" onClick={onClose} style={{ height: '36px', padding: '0 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', background: 'var(--card)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', cursor: 'pointer' }}>Cancel</button>
          <button type="button" onClick={() => isValid && onSave(form)} disabled={!isValid} style={{ height: '36px', padding: '0 16px', border: 'none', borderRadius: 'var(--radius-button)', background: isValid ? 'var(--primary)' : 'var(--muted)', color: isValid ? 'var(--primary-foreground)' : 'var(--muted-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: isValid ? 'pointer' : 'not-allowed' }}>
            {initial ? 'Save Changes' : 'Add KRI'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function KRIDashboard() {
  const [kris, setKris] = useState<KRI[]>(() => loadKRIs());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [recordTarget, setRecordTarget] = useState<KRI | null>(null);
  const [editTarget, setEditTarget]     = useState<KRI | null>(null);
  const [addOpen, setAddOpen]           = useState(false);

  // Calc context
  const calcCtx = useMemo(() => ({
    controls:     loadControls(),
    risks:        loadRisks(),
    assessments:  loadRiskAssessments(),
    riskControls: loadRiskControls(),
    mitigations:  loadRiskMitigations(),
  }), []);

  // Live values
  const liveValues = useMemo(() => {
    const m = new Map<string, number | null>();
    kris.forEach(k => { m.set(k.id, calculateKRIValue(k, calcCtx)); });
    return m;
  }, [kris, calcCtx]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { green: 0, amber: 0, red: 0, no_data: 0 };
    kris.filter(k => k.isActive).forEach(k => {
      const s = deriveKRIStatus(k, liveValues.get(k.id) ?? null);
      counts[s]++;
    });
    return counts;
  }, [kris, liveValues]);

  const displayed = kris.filter(k => k.isActive && (filterStatus === 'all' || deriveKRIStatus(k, liveValues.get(k.id) ?? null) === filterStatus));

  function persistKris(updated: KRI[]) {
    setKris(updated);
    saveKRIs(updated);
  }

  function handleRecordReading(kri: KRI, value: number) {
    const today = new Date().toISOString().split('T')[0];
    const pts = [...kri.dataPoints, { date: today, value, enteredBy: 'You' }].slice(-12);
    const status = deriveKRIStatus({ ...kri, currentValue: value }, value);
    persistKris(kris.map(k => k.id === kri.id ? { ...k, currentValue: value, dataPoints: pts, status, updatedAt: today } : k));
    setRecordTarget(null);
  }

  function handleSaveKRI(data: Partial<KRI>, existingId?: string) {
    const today = new Date().toISOString().split('T')[0];
    if (existingId) {
      persistKris(kris.map(k => k.id === existingId ? { ...k, ...data, updatedAt: today } : k));
    } else {
      const newKri: KRI = {
        id: 'KRI-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        name: data.name ?? '',
        description: data.description ?? '',
        unit: data.unit ?? '',
        category: data.category ?? '',
        calculationSource: data.calculationSource ?? 'manual',
        thresholdDirection: data.thresholdDirection ?? 'lower_is_better',
        greenThreshold: data.greenThreshold ?? 0,
        amberThreshold: data.amberThreshold ?? 0,
        dataPoints: [],
        currentValue: null,
        status: 'no_data',
        owner: data.owner ?? MOCK_USERS[0],
        isActive: true,
        createdAt: today,
        updatedAt: today,
      };
      persistKris([...kris, newKri]);
    }
    setEditTarget(null);
    setAddOpen(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header + status filter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'All KRIs', count: kris.filter(k => k.isActive).length, bg: 'var(--muted)', color: 'var(--foreground)' },
            { key: 'green', label: 'On Track', count: statusCounts.green, bg: '#E8F5EE', color: '#1C8A45' },
            { key: 'amber', label: 'Caution', count: statusCounts.amber, bg: '#FFF3E0', color: '#E07B00' },
            { key: 'red', label: 'Breached', count: statusCounts.red, bg: 'rgba(192,57,43,0.10)', color: '#C0392B' },
          ].map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilterStatus(f.key)}
              style={{
                height: '32px', padding: '0 12px', borderRadius: '100px',
                border: filterStatus === f.key ? `2px solid ${f.color}` : '1px solid var(--border)',
                background: filterStatus === f.key ? f.bg : 'var(--card)',
                fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)', color: f.color,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
              }}
            >
              {f.label}
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: '18px', height: '18px', borderRadius: '100px',
                background: filterStatus === f.key ? f.color : 'var(--muted)',
                color: filterStatus === f.key ? '#fff' : 'var(--muted-foreground)',
                fontSize: '10px', fontWeight: 'var(--font-weight-bold)',
              }}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            height: '36px', padding: '0 16px', border: 'none',
            borderRadius: 'var(--radius-button)', background: 'var(--primary)',
            fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary-foreground)',
            cursor: 'pointer',
          }}
        >
          <Plus size={14} /> Add KRI
        </button>
      </div>

      {/* KRI grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '14px',
      }}>
        {displayed.map(kri => (
          <KRICard
            key={kri.id}
            kri={kri}
            liveValue={liveValues.get(kri.id) ?? null}
            onRecordReading={setRecordTarget}
            onEdit={setEditTarget}
          />
        ))}
      </div>

      {displayed.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '40px',
          fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
          color: 'var(--muted-foreground)',
        }}>
          No KRIs match the selected filter.
        </div>
      )}

      {/* Modals */}
      {recordTarget && (
        <RecordReadingModal
          kri={recordTarget}
          onClose={() => setRecordTarget(null)}
          onSave={val => handleRecordReading(recordTarget, val)}
        />
      )}
      {(editTarget || addOpen) && (
        <KRIFormModal
          initial={editTarget ?? undefined}
          onClose={() => { setEditTarget(null); setAddOpen(false); }}
          onSave={data => handleSaveKRI(data, editTarget?.id)}
        />
      )}
    </div>
  );
}