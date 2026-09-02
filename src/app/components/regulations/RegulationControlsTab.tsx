import React, { useState, useEffect } from 'react';
import { Plus, ShieldCheck, Unlink, CheckCircle, AlertCircle, FileCheck } from 'lucide-react';
import {
  loadRegulationControlMappings,
  saveRegulationControlMappings,
  getMappingsForRegulation,
  deleteMapping,
  calculateCoverageStats,
  COVERAGE_LEVEL_LABELS,
  COVERAGE_LEVEL_STYLES,
  IMPLEMENTATION_STATUS_LABELS,
  IMPLEMENTATION_STATUS_STYLES,
  type RegulationControlMapping,
} from '../../data/regulationControlData';
import { loadControls, type Control } from '../../data/controlData';
import { LinkControlModal } from './LinkControlModal';

interface RegulationControlsTabProps {
  regulationId: string;
  onUpdate?: () => void;
}

export function RegulationControlsTab({ regulationId, onUpdate }: RegulationControlsTabProps) {
  const [mappings, setMappings] = useState<RegulationControlMapping[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [unlinkConfirm, setUnlinkConfirm] = useState<{ regulationId: string; controlId: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [regulationId]);

  function loadData() {
    const allMappings = loadRegulationControlMappings();
    const regMappings = getMappingsForRegulation(allMappings, regulationId);
    setMappings(regMappings);

    const allControls = loadControls();
    setControls(allControls);
  }

  function handleUnlink(controlId: string) {
    const allMappings = loadRegulationControlMappings();
    const updated = deleteMapping(allMappings, regulationId, controlId);
    saveRegulationControlMappings(updated);
    loadData();
    setUnlinkConfirm(null);
    if (onUpdate) onUpdate();
  }

  function handleLinkSuccess() {
    loadData();
    setLinkModalOpen(false);
    if (onUpdate) onUpdate();
  }

  const stats = calculateCoverageStats(loadRegulationControlMappings(), regulationId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <StatCard label="Total Controls" value={stats.total} icon={ShieldCheck} />
        <StatCard
          label="Full Coverage"
          value={stats.full}
          icon={CheckCircle}
          color="#1C8A45"
        />
        <StatCard
          label="Partial Coverage"
          value={stats.partial}
          icon={AlertCircle}
          color="#F57F17"
        />
        <StatCard
          label="Verified"
          value={stats.verified}
          icon={FileCheck}
          color="#1565C0"
        />
      </div>

      {/* Coverage Summary */}
      <div
        style={{
          background: 'var(--background)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '14px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
            }}
          >
            Coverage Summary
          </div>
          <div
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '18px',
              fontWeight: 'var(--font-weight-semibold)',
              color: stats.coverageRate >= 80 ? '#1C8A45' : stats.coverageRate >= 50 ? '#F57F17' : '#C62828',
            }}
          >
            {stats.coverageRate}%
          </div>
        </div>
        <div
          style={{
            width: '100%',
            height: '8px',
            background: 'var(--muted)',
            borderRadius: '100px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${stats.coverageRate}%`,
              height: '100%',
              background: stats.coverageRate >= 80 ? '#1C8A45' : stats.coverageRate >= 50 ? '#F57F17' : '#C62828',
              borderRadius: '100px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <h3
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '18px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--foreground)',
            margin: 0,
          }}
        >
          Linked Controls ({mappings.length})
        </h3>
        <button
          onClick={() => setLinkModalOpen(true)}
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
          <Plus size={16} />
          Link Control
        </button>
      </div>

      {/* Controls Table */}
      {mappings.length === 0 ? (
        <div
          style={{
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <ShieldCheck size={48} style={{ color: 'var(--muted-foreground)' }} />
          <div
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--foreground)',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            No controls linked yet
          </div>
          <div
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--muted-foreground)',
            }}
          >
            Link controls to track compliance implementation
          </div>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
              <thead>
                <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {['Control', 'Requirement', 'Coverage', 'Status', 'Evidence', 'Actions'].map(h => (
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
                {mappings.map((mapping, idx) => {
                  const control = controls.find(c => c.id === mapping.controlId);
                  const coverageStyle = COVERAGE_LEVEL_STYLES[mapping.coverageLevel];
                  const statusStyle = IMPLEMENTATION_STATUS_STYLES[mapping.implementationStatus];

                  return (
                    <tr
                      key={`${mapping.regulationId}-${mapping.controlId}`}
                      style={{
                        background: idx % 2 === 0 ? 'var(--card)' : 'var(--muted)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {/* Control */}
                      <td style={{ padding: '0 16px', height: '56px' }}>
                        {control ? (
                          <div>
                            <div
                              style={{
                                fontFamily: 'var(--font-family-primary)',
                                fontSize: 'var(--text-base)',
                                fontWeight: 'var(--font-weight-semibold)',
                                color: 'var(--primary)',
                                marginBottom: '2px',
                              }}
                            >
                              {control.title}
                            </div>
                            <div
                              style={{
                                fontFamily: 'var(--font-family-primary)',
                                fontSize: '12px',
                                color: 'var(--muted-foreground)',
                              }}
                            >
                              {control.id}
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              fontFamily: 'var(--font-family-primary)',
                              fontSize: 'var(--text-base)',
                              color: 'var(--muted-foreground)',
                            }}
                          >
                            {mapping.controlId}
                          </div>
                        )}
                      </td>

                      {/* Requirement */}
                      <td
                        style={{
                          padding: '0 16px',
                          height: '56px',
                          maxWidth: '300px',
                        }}
                      >
                        <div
                          style={{
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: '12px',
                            color: 'var(--foreground)',
                            lineHeight: '1.4',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {mapping.requirementText}
                        </div>
                      </td>

                      {/* Coverage */}
                      <td style={{ padding: '0 16px', height: '56px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            height: '20px',
                            padding: '0 8px',
                            borderRadius: '100px',
                            background: coverageStyle.background,
                            color: coverageStyle.color,
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: '12px',
                            fontWeight: 'var(--font-weight-semibold)',
                          }}
                        >
                          {COVERAGE_LEVEL_LABELS[mapping.coverageLevel]}
                        </span>
                        {mapping.isPrimary && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              height: '16px',
                              padding: '0 6px',
                              marginLeft: '4px',
                              borderRadius: '100px',
                              background: 'var(--muted)',
                              color: 'var(--muted-foreground)',
                              fontFamily: 'var(--font-family-primary)',
                              fontSize: '10px',
                              fontWeight: 'var(--font-weight-semibold)',
                            }}
                          >
                            PRIMARY
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0 16px', height: '56px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            height: '20px',
                            padding: '0 8px',
                            borderRadius: '100px',
                            background: statusStyle.background,
                            color: statusStyle.color,
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: '12px',
                            fontWeight: 'var(--font-weight-semibold)',
                          }}
                        >
                          {IMPLEMENTATION_STATUS_LABELS[mapping.implementationStatus]}
                        </span>
                      </td>

                      {/* Evidence */}
                      <td
                        style={{
                          padding: '0 16px',
                          height: '56px',
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '12px',
                          color: 'var(--foreground)',
                        }}
                      >
                        {mapping.evidenceProvided ? (
                          <span style={{ color: '#1C8A45', fontWeight: 'var(--font-weight-semibold)' }}>
                            ✓ Provided
                          </span>
                        ) : (
                          <span style={{ color: 'var(--muted-foreground)' }}>—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0 16px', height: '56px' }}>
                        <button
                          onClick={() => setUnlinkConfirm({ regulationId: mapping.regulationId, controlId: mapping.controlId })}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            height: '28px',
                            padding: '0 10px',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-button)',
                            background: 'var(--background)',
                            color: 'var(--foreground)',
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: '12px',
                            fontWeight: 'var(--font-weight-semibold)',
                            cursor: 'pointer',
                          }}
                        >
                          <Unlink size={14} />
                          Unlink
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

      {/* Link Modal */}
      {linkModalOpen && (
        <LinkControlModal
          isOpen={linkModalOpen}
          onClose={() => setLinkModalOpen(false)}
          regulationId={regulationId}
          onSuccess={handleLinkSuccess}
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
              width: '100%',
              maxWidth: '400px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '18px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                margin: 0,
              }}
            >
              Unlink Control
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--foreground)',
                margin: 0,
              }}
            >
              Are you sure you want to unlink this control? This will remove the mapping and any associated requirement
              details.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setUnlinkConfirm(null)}
                style={{
                  height: '36px',
                  padding: '0 16px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-button)',
                  background: 'var(--background)',
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
                onClick={() => handleUnlink(unlinkConfirm.controlId)}
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

// ─── Helper Components ───────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <div
      style={{
        background: 'var(--background)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--muted-foreground)',
          }}
        >
          {label}
        </span>
        <Icon size={16} style={{ color: color || 'var(--muted-foreground)' }} />
      </div>
      <div
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '24px',
          fontWeight: 'var(--font-weight-semibold)',
          color: color || 'var(--foreground)',
          lineHeight: '32px',
        }}
      >
        {value}
      </div>
    </div>
  );
}
