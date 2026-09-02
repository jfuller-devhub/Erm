import React, { useState, useMemo } from 'react';
import { Plus, ShieldAlert, X, ExternalLink, Star } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { RiskControl } from '../../data/riskControlData';
import { getRisksForControl, mappingExists } from '../../data/riskControlData';
import { COVERAGE_LEVEL_LABELS, COVERAGE_LEVEL_STYLES } from '../../data/riskControlData';
import { formatDate, MOCK_USERS } from '../../data/mockData';
import type { Risk } from '../../data/riskData';
import { RISK_STATUS_LABELS } from '../../data/riskData';
import { LinkRiskToControlModal } from './RiskControlLinkModal';

interface ControlRisksSectionProps {
  controlId: string;
  risks: Risk[];
  riskControls: RiskControl[];
  onRiskControlsChange: (updated: RiskControl[]) => void;
}

export function ControlRisksSection({
  controlId,
  risks,
  riskControls,
  onRiskControlsChange,
}: ControlRisksSectionProps) {
  const navigate = useNavigate();
  const [linkRiskOpen, setLinkRiskOpen] = useState(false);
  const [unlinkConfirm, setUnlinkConfirm] = useState<{ riskId: string; riskTitle: string } | null>(null);

  const linkedMappings = useMemo(
    () => getRisksForControl(riskControls, controlId),
    [riskControls, controlId]
  );

  function handleAddMapping(
    riskId: string,
    coverageLevel: 'full' | 'substantial' | 'partial' | 'minimal',
    isPrimary: boolean,
    mappingNotes: string
  ) {
    if (mappingExists(riskControls, riskId, controlId)) {
      alert('This risk is already linked to this control.');
      return;
    }
    const newMapping: RiskControl = {
      riskId,
      controlId,
      coverageLevel,
      isPrimary,
      mappingNotes,
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: MOCK_USERS[0],
    };
    onRiskControlsChange([...riskControls, newMapping]);
    setLinkRiskOpen(false);
  }

  function handleUnlinkRisk(riskId: string) {
    onRiskControlsChange(riskControls.filter(rc => !(rc.controlId === controlId && rc.riskId === riskId)));
    setUnlinkConfirm(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
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
            Linked Risks
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--muted-foreground)',
              margin: '4px 0 0 0',
            }}
          >
            {linkedMappings.length} risk{linkedMappings.length !== 1 ? 's' : ''} linked
          </p>
        </div>
        <button
          onClick={() => setLinkRiskOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
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
          <Plus size={14} />
          Link Risk
        </button>
      </div>

      {/* Risk List */}
      {linkedMappings.length === 0 ? (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            padding: '48px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <ShieldAlert size={48} style={{ color: 'var(--muted-foreground)' }} />
          <h4
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '14px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: 0,
            }}
          >
            No Risks Linked
          </h4>
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--muted-foreground)',
              margin: 0,
              textAlign: 'center',
            }}
          >
            Link risks to track which controls mitigate specific risks.
          </p>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {['Risk', 'Status', 'Coverage', 'Primary', 'Notes', ''].map(h => (
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
                  const risk = risks.find(r => r.id === mapping.riskId);
                  if (!risk) return null;
                  const covStyle = COVERAGE_LEVEL_STYLES[mapping.coverageLevel];
                  return (
                    <tr
                      key={mapping.riskId}
                      style={{
                        background: idx % 2 === 0 ? 'var(--card)' : 'var(--muted)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <td style={{ padding: '0 16px', height: '48px' }}>
                        <button
                          type="button"
                          onClick={() => navigate(`/risks/${risk.id}`)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            textAlign: 'left',
                            display: 'block',
                          }}
                        >
                          <div
                            style={{
                              fontFamily: 'var(--font-family-primary)',
                              fontSize: 'var(--text-base)',
                              fontWeight: 'var(--font-weight-semibold)',
                              color: 'var(--primary)',
                              marginBottom: '2px',
                            }}
                          >
                            {risk.title}
                          </div>
                          <div
                            style={{
                              fontFamily: 'var(--font-family-primary)',
                              fontSize: '12px',
                              color: 'var(--muted-foreground)',
                            }}
                          >
                            {risk.id} · {risk.department}
                          </div>
                        </button>
                      </td>
                      <td style={{ padding: '0 16px', height: '48px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            height: '20px',
                            padding: '0 8px',
                            borderRadius: '100px',
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: '12px',
                            fontWeight: 'var(--font-weight-semibold)',
                            textTransform: 'capitalize',
                            background: risk.status === 'active' ? '#E8F5EE' : '#F0F0F0',
                            color: risk.status === 'active' ? '#1C8A45' : '#6B7489',
                          }}
                        >
                          {RISK_STATUS_LABELS[risk.status]}
                        </span>
                      </td>
                      <td style={{ padding: '0 16px', height: '48px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            height: '20px',
                            padding: '0 8px',
                            borderRadius: '100px',
                            background: covStyle.background,
                            color: covStyle.color,
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: '12px',
                            fontWeight: 'var(--font-weight-semibold)',
                            textTransform: 'capitalize',
                          }}
                        >
                          {COVERAGE_LEVEL_LABELS[mapping.coverageLevel]}
                        </span>
                      </td>
                      <td style={{ padding: '0 16px', height: '48px', textAlign: 'center' }}>
                        {mapping.isPrimary && (
                          <Star size={16} style={{ color: '#E07B00', fill: '#E07B00' }} />
                        )}
                      </td>
                      <td
                        style={{
                          padding: '0 16px',
                          height: '48px',
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '12px',
                          color: 'var(--muted-foreground)',
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {mapping.mappingNotes || '—'}
                      </td>
                      <td style={{ padding: '0 16px', height: '48px', textAlign: 'right' }}>
                        <button
                          onClick={() => setUnlinkConfirm({ riskId: risk.id, riskTitle: risk.title })}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            border: 'none',
                            borderRadius: 'var(--radius-button)',
                            background: 'transparent',
                            color: 'var(--destructive)',
                            cursor: 'pointer',
                          }}
                          title="Unlink risk"
                        >
                          <X size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Link Risk Modal */}
      {linkRiskOpen && (
        <LinkRiskToControlModal
          isOpen={linkRiskOpen}
          onClose={() => setLinkRiskOpen(false)}
          onSave={handleAddMapping}
          controlId={controlId}
          risks={risks}
          existingMappings={riskControls}
        />
      )}

      {/* Unlink Confirmation */}
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
          onClick={e => {
            if (e.target === e.currentTarget) setUnlinkConfirm(null);
          }}
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
              Unlink Risk
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
              Are you sure you want to unlink <strong>{unlinkConfirm.riskTitle}</strong> from this control?
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
                onClick={() => handleUnlinkRisk(unlinkConfirm.riskId)}
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
