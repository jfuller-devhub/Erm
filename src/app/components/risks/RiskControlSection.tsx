import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus, X, Star, ShieldCheck, Zap, ExternalLink,
} from 'lucide-react';
import { LinkControlToRiskModal } from '../controls/RiskControlLinkModal';
import type { Control } from '../../data/controlData';
import {
  CONTROL_STATUS_LABELS, CONTROL_TYPE_LABELS, CONTROL_EFFECTIVENESS_LABELS,
  CONTROL_STATUS_STYLES, CONTROL_TYPE_STYLES, CONTROL_EFFECTIVENESS_STYLES,
} from '../../data/controlData';
import type { RiskControl } from '../../data/riskControlData';
import {
  getControlsForRisk,
  COVERAGE_LEVEL_LABELS, COVERAGE_LEVEL_STYLES,
} from '../../data/riskControlData';
import { MOCK_USERS } from '../../data/mockData';

interface RiskControlSectionProps {
  riskId: string;
  controls: Control[];
  riskControls: RiskControl[];
  onRiskControlsChange: (updated: RiskControl[]) => void;
}

export function RiskControlSection({
  riskId,
  controls,
  riskControls,
  onRiskControlsChange,
}: RiskControlSectionProps) {
  const navigate = useNavigate();
  const [linkOpen, setLinkOpen] = useState(false);
  const [unlinkConfirm, setUnlinkConfirm] = useState<{ controlId: string; controlName: string } | null>(null);

  const linkedMappings = useMemo(
    () => getControlsForRisk(riskControls, riskId),
    [riskControls, riskId]
  );

  function handleLinkControl(mapping: Omit<RiskControl, 'createdAt' | 'createdBy'>) {
    const now = new Date().toISOString().split('T')[0];
    const newMapping: RiskControl = {
      ...mapping,
      createdAt: now,
      createdBy: MOCK_USERS[0],
    };
    onRiskControlsChange([...riskControls, newMapping]);
  }

  function handleUnlinkControl(controlId: string) {
    onRiskControlsChange(
      riskControls.filter(rc => !(rc.riskId === riskId && rc.controlId === controlId))
    );
    setUnlinkConfirm(null);
  }

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '14px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: 0,
              lineHeight: '20px',
            }}
          >
            Linked Controls
          </h3>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '20px',
              height: '20px',
              padding: '0 6px',
              borderRadius: '100px',
              background: 'rgba(35,34,240,0.08)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '11px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--primary)',
            }}
          >
            {linkedMappings.length}
          </span>
        </div>
        <button
          onClick={() => setLinkOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            height: '28px',
            padding: '0 12px',
            border: '1px solid var(--primary)',
            borderRadius: 'var(--radius-button)',
            background: 'transparent',
            color: 'var(--primary)',
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer',
          }}
        >
          <Plus size={12} />
          Link Control
        </button>
      </div>

      {/* Summary chips */}
      {linkedMappings.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '12px',
            padding: '12px 24px',
            borderBottom: '1px solid var(--border)',
            flexWrap: 'wrap',
          }}
        >
          {(() => {
            const primaryCount = linkedMappings.filter(m => m.isPrimary).length;
            const fullCount = linkedMappings.filter(m => m.coverageLevel === 'full' || m.coverageLevel === 'substantial').length;
            return (
              <>
                <SummaryChip label="Total Controls" value={linkedMappings.length} color="var(--primary)" />
                {primaryCount > 0 && <SummaryChip label="Primary" value={primaryCount} color="#E07B00" />}
                <SummaryChip label="Full/Substantial Coverage" value={fullCount} color="#1C8A45" />
              </>
            );
          })()}
        </div>
      )}

      {/* Controls table or empty state */}
      {linkedMappings.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ marginBottom: '8px' }}>
            <ShieldCheck size={32} style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '14px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              marginBottom: '4px',
            }}
          >
            No controls linked
          </div>
          <div
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--muted-foreground)',
              marginBottom: '16px',
            }}
          >
            Link controls to show how this risk is being addressed.
          </div>
          <button
            onClick={() => setLinkOpen(true)}
            style={{
              height: '36px',
              padding: '0 16px',
              border: 'none',
              borderRadius: 'var(--radius-button)',
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
            }}
          >
            Link Control
          </button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                {['Control', 'Type', 'Status', 'Effectiveness', 'Coverage', 'Primary', ''].map(h => (
                  <th
                    key={h}
                    style={{
                      padding: '0 16px',
                      height: '40px',
                      textAlign: 'left',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--muted-foreground)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linkedMappings.map((mapping, idx) => {
                const ctrl = controls.find(c => c.id === mapping.controlId);
                if (!ctrl) return null;
                const ctlStatus = CONTROL_STATUS_STYLES[ctrl.status];
                const ctlType = CONTROL_TYPE_STYLES[ctrl.controlType];
                const ctlEff = CONTROL_EFFECTIVENESS_STYLES[ctrl.effectiveness];
                const covStyle = COVERAGE_LEVEL_STYLES[mapping.coverageLevel];

                return (
                  <tr
                    key={mapping.controlId}
                    style={{
                      background: idx % 2 === 0 ? 'var(--card)' : 'var(--muted)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <td style={{ padding: '8px 16px' }}>
                      <div
                        onClick={() => navigate(`/controls/${ctrl.id}`)}
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--text-base)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--primary)',
                          cursor: 'pointer',
                          lineHeight: '20px',
                        }}
                      >
                        {ctrl.name}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '12px',
                          color: 'var(--muted-foreground)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginTop: '2px',
                        }}
                      >
                        <span>{ctrl.id}</span>
                        {ctrl.isAutomated && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#00A3A3' }}>
                            <Zap size={10} /> Auto
                          </span>
                        )}
                        {ctrl.frameworkRef && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            <ExternalLink size={10} /> {ctrl.frameworkRef}
                          </span>
                        )}
                      </div>
                      {mapping.mappingNotes && (
                        <div
                          style={{
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: '12px',
                            color: 'var(--muted-foreground)',
                            fontStyle: 'italic',
                            marginTop: '4px',
                            lineHeight: '16px',
                            maxWidth: '300px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={mapping.mappingNotes}
                        >
                          {mapping.mappingNotes}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0 16px', height: '40px' }}>
                      <Badge bg={ctlType.background} color={ctlType.color}>
                        {CONTROL_TYPE_LABELS[ctrl.controlType]}
                      </Badge>
                    </td>
                    <td style={{ padding: '0 16px', height: '40px' }}>
                      <Badge bg={ctlStatus.background} color={ctlStatus.color}>
                        {CONTROL_STATUS_LABELS[ctrl.status]}
                      </Badge>
                    </td>
                    <td style={{ padding: '0 16px', height: '40px' }}>
                      <Badge bg={ctlEff.background} color={ctlEff.color}>
                        {CONTROL_EFFECTIVENESS_LABELS[ctrl.effectiveness]}
                      </Badge>
                    </td>
                    <td style={{ padding: '0 16px', height: '40px' }}>
                      <Badge bg={covStyle.background} color={covStyle.color}>
                        {COVERAGE_LEVEL_LABELS[mapping.coverageLevel]}
                      </Badge>
                    </td>
                    <td style={{ padding: '0 16px', height: '40px', textAlign: 'center' }}>
                      {mapping.isPrimary && (
                        <Star size={14} style={{ color: '#E07B00', fill: '#E07B00' }} />
                      )}
                    </td>
                    <td style={{ padding: '0 16px', height: '40px' }}>
                      <button
                        onClick={() => setUnlinkConfirm({ controlId: ctrl.id, controlName: ctrl.name })}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          height: '24px',
                          padding: '0 8px',
                          border: 'none',
                          borderRadius: 'var(--radius-input)',
                          background: 'transparent',
                          color: 'var(--destructive)',
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '11px',
                          fontWeight: 'var(--font-weight-semibold)',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(192,57,43,0.06)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        <X size={10} />
                        Unlink
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Link Control Modal */}
      <LinkControlToRiskModal
        isOpen={linkOpen}
        onClose={() => setLinkOpen(false)}
        onSave={handleLinkControl}
        riskId={riskId}
        controls={controls}
        existingMappings={riskControls}
      />

      {/* Unlink Confirmation Dialog */}
      {unlinkConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
            padding: '24px',
          }}
          onClick={e => { if (e.target === e.currentTarget) setUnlinkConfirm(null); }}
        >
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              boxShadow: '0px 8px 32px rgba(0,0,0,0.18)',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '18px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                margin: '0 0 8px 0',
              }}
            >
              Unlink Control
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--muted-foreground)',
                margin: '0 0 24px 0',
                lineHeight: '22px',
              }}
            >
              Are you sure you want to remove the mapping to <strong>{unlinkConfirm.controlName}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setUnlinkConfirm(null)}
                style={{
                  height: '36px',
                  padding: '0 16px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-button)',
                  background: 'var(--card)',
                  color: 'var(--foreground)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleUnlinkControl(unlinkConfirm.controlId)}
                style={{
                  height: '36px',
                  padding: '0 16px',
                  border: 'none',
                  borderRadius: 'var(--radius-button)',
                  background: 'var(--destructive)',
                  color: 'var(--destructive-foreground)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  cursor: 'pointer',
                }}
              >
                Unlink
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small helpers ───────────────────────────────────────────────────────────

function Badge({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '20px',
        padding: '0 8px',
        borderRadius: '100px',
        background: bg,
        color,
        fontFamily: 'var(--font-family-primary)',
        fontSize: '12px',
        fontWeight: 'var(--font-weight-semibold)',
        lineHeight: '16px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

function SummaryChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '100px',
        background: 'var(--muted)',
        fontFamily: 'var(--font-family-primary)',
        fontSize: '12px',
      }}
    >
      <span style={{ fontWeight: 'var(--font-weight-semibold)', color }}>{value}</span>
      <span style={{ color: 'var(--muted-foreground)' }}>{label}</span>
    </div>
  );
}