import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  BookOpen, ShieldCheck, AlertTriangle, Calendar,
  Plus, Edit2, ChevronRight, CheckCircle, XCircle, Clock,
  Award,
} from 'lucide-react';
import { KPITile } from '../components/shared/KPITile';
import { FrameworkFormModal } from '../components/compliance/FrameworkFormModal';
import type { ComplianceFramework } from '../data/complianceFrameworkData';
import {
  loadFrameworks, saveFrameworks,
  FRAMEWORK_STATUS_LABELS, FRAMEWORK_STATUS_STYLES,
} from '../data/complianceFrameworkData';
import type { FrameworkRequirement } from '../data/frameworkRequirementData';
import { loadRequirements, getRequirementsForFramework } from '../data/frameworkRequirementData';
import type { ControlRequirementMapping } from '../data/controlRequirementData';
import {
  loadControlRequirementMappings,
  IMPLEMENTATION_STATUS_LABELS, IMPLEMENTATION_STATUS_STYLES,
} from '../data/controlRequirementData';
import { formatDate } from '../data/mockData';
import { generateId } from '../data/mockData';

export function ComplianceDashboard() {
  const navigate = useNavigate();
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [requirements, setRequirements] = useState<FrameworkRequirement[]>([]);
  const [mappings, setMappings] = useState<ControlRequirementMapping[]>([]);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    setFrameworks(loadFrameworks());
    setRequirements(loadRequirements());
    setMappings(loadControlRequirementMappings());
  }, []);

  const persistFrameworks = useCallback((updated: ComplianceFramework[]) => {
    setFrameworks(updated);
    saveFrameworks(updated);
  }, []);

  // ─── Computed KPI data ──────────────────────────────────────────────────────

  const activeFrameworks = useMemo(
    () => frameworks.filter(f => f.status === 'active'),
    [frameworks]
  );

  // Total leaf requirements across all frameworks
  const totalLeafRequirements = useMemo(
    () => requirements.filter(r => r.parentRequirementId !== '').length,
    [requirements]
  );

  // Compliance stats
  const stats = useMemo(() => {
    const implemented = mappings.filter(m => m.implementationStatus === 'implemented').length;
    const inProgress = mappings.filter(m => m.implementationStatus === 'in_progress').length;
    const notStarted = mappings.filter(m => m.implementationStatus === 'not_started').length;
    const totalMapped = mappings.length;
    const overallPct = totalLeafRequirements > 0
      ? Math.round((implemented / totalLeafRequirements) * 100)
      : 0;
    // Gap = leaf requirements that have NO mapping at all, or have mapping with not_started
    const mappedReqIds = new Set(mappings.map(m => m.requirementId));
    const unmappedCount = requirements.filter(
      r => r.parentRequirementId !== '' && !mappedReqIds.has(r.id)
    ).length;
    return { implemented, inProgress, notStarted, totalMapped, overallPct, unmappedCount };
  }, [mappings, requirements, totalLeafRequirements]);

  // Per-framework compliance
  const frameworkStats = useMemo(() => {
    return frameworks.map(fw => {
      const reqs = getRequirementsForFramework(requirements, fw.id);
      const leafReqs = reqs.filter(r => r.parentRequirementId !== '');
      const totalLeaf = leafReqs.length;
      const leafIds = new Set(leafReqs.map(r => r.id));
      const fwMappings = mappings.filter(m => leafIds.has(m.requirementId));
      const implemented = fwMappings.filter(m => m.implementationStatus === 'implemented').length;
      const inProgress = fwMappings.filter(m => m.implementationStatus === 'in_progress').length;
      const notStarted = fwMappings.filter(m => m.implementationStatus === 'not_started').length;
      const pct = totalLeaf > 0 ? Math.round((implemented / totalLeaf) * 100) : 0;
      const mappedReqIds = new Set(fwMappings.map(m => m.requirementId));
      const unmapped = totalLeaf - mappedReqIds.size;
      const controlIds = new Set(fwMappings.map(m => m.controlId));
      return {
        framework: fw,
        totalRequirements: totalLeaf,
        implemented,
        inProgress,
        notStarted,
        unmapped,
        pct,
        controlCount: controlIds.size,
      };
    });
  }, [frameworks, requirements, mappings]);

  function handleAddFramework(data: Omit<ComplianceFramework, 'id' | 'createdAt' | 'updatedAt'>) {
    const today = new Date().toISOString().split('T')[0];
    const newFw: ComplianceFramework = {
      id: 'FWK-' + generateId(),
      ...data,
      createdAt: today,
      updatedAt: today,
    };
    persistFrameworks([...frameworks, newFw]);
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '22px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: 0,
              lineHeight: '30px',
            }}
          >
            Framework Dashboard
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--muted-foreground)',
              margin: '4px 0 0',
            }}
          >
            Track framework posture across regulatory and industry standards.
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
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
          Add Framework
        </button>
      </div>

      {/* KPI Tiles — max 5 per Appian guidelines */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
        }}
      >
        <KPITile label="Active Frameworks" value={activeFrameworks.length} icon={BookOpen} accent />
        <KPITile label="Overall Framework Coverage" value={`${stats.overallPct}%`} icon={CheckCircle} iconColor="#1C8A45" />
        <KPITile label="Requirements Mapped" value={stats.totalMapped} icon={ShieldCheck} subLabel={`of ${totalLeafRequirements} total`} />
        <KPITile label="Gaps (Unmapped)" value={stats.unmappedCount} icon={AlertTriangle} iconColor={stats.unmappedCount > 0 ? '#E07B00' : '#1C8A45'} />
        <KPITile
          label="In Progress"
          value={stats.inProgress}
          icon={Clock}
          iconColor="#E07B00"
          subLabel={`${stats.notStarted} not started`}
        />
      </div>

      {/* Framework Summary Cards */}
      <div>
        <h2
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '14px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--foreground)',
            margin: '0 0 12px 0',
            lineHeight: '20px',
          }}
        >
          Frameworks
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {frameworkStats.map(fs => {
            const isOverdue = fs.framework.nextAssessmentDate && fs.framework.nextAssessmentDate < today;
            return (
              <div
                key={fs.framework.id}
                onClick={() => navigate(`/compliance/${fs.framework.id}`)}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-card)',
                  padding: '20px',
                  boxShadow: 'var(--elevation-sm)',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.15s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(35,34,240,0.12)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--elevation-sm)'; }}
              >
                {/* Top row: name + badges */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '16px',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--foreground)',
                          lineHeight: '24px',
                        }}
                      >
                        {fs.framework.name}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '12px',
                          color: 'var(--muted-foreground)',
                        }}
                      >
                        {fs.framework.version}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <Badge
                        bg={FRAMEWORK_STATUS_STYLES[fs.framework.status].background}
                        color={FRAMEWORK_STATUS_STYLES[fs.framework.status].color}
                      >
                        {FRAMEWORK_STATUS_LABELS[fs.framework.status]}
                      </Badge>
                      {fs.framework.certificationRequired && (
                        <Badge bg="rgba(35,34,240,0.08)" color="#2322F0">
                          <Award size={10} style={{ marginRight: '3px' }} />
                          Certification
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0, marginTop: '4px' }} />
                </div>

                {/* Compliance progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '12px',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--foreground)',
                      }}
                    >
                      {fs.pct}% Implemented
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '12px',
                        color: 'var(--muted-foreground)',
                      }}
                    >
                      {fs.implemented}/{fs.totalRequirements} requirements
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      borderRadius: '4px',
                      background: 'var(--muted)',
                      overflow: 'hidden',
                      display: 'flex',
                    }}
                  >
                    {fs.totalRequirements > 0 && (
                      <>
                        <div
                          style={{
                            width: `${(fs.implemented / fs.totalRequirements) * 100}%`,
                            background: '#1C8A45',
                            borderRadius: '4px 0 0 4px',
                            transition: 'width 0.3s',
                          }}
                        />
                        <div
                          style={{
                            width: `${(fs.inProgress / fs.totalRequirements) * 100}%`,
                            background: '#E07B00',
                            transition: 'width 0.3s',
                          }}
                        />
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <MiniStat label="Implemented" value={fs.implemented} color="#1C8A45" />
                    <MiniStat label="In Progress" value={fs.inProgress} color="#E07B00" />
                    <MiniStat label="Gaps" value={fs.unmapped + fs.notStarted} color="#C0392B" />
                    <MiniStat label="Controls" value={fs.controlCount} color="var(--primary)" />
                  </div>
                </div>

                {/* Footer: governing body + next assessment */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border)',
                    paddingTop: '12px',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '12px',
                      color: 'var(--muted-foreground)',
                    }}
                  >
                    {fs.framework.governingBody}
                  </span>
                  {fs.framework.nextAssessmentDate && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '12px',
                        color: isOverdue ? 'var(--destructive)' : 'var(--muted-foreground)',
                        fontWeight: isOverdue ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                      }}
                    >
                      <Calendar size={11} />
                      Next: {formatDate(fs.framework.nextAssessmentDate)}
                      {isOverdue && ' (Overdue)'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {frameworks.length === 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '48px 24px',
                textAlign: 'center',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
              }}
            >
              <BookOpen size={48} style={{ color: 'var(--muted-foreground)', marginBottom: '12px' }} />
              <div
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '14px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--foreground)',
                  marginBottom: '4px',
                }}
              >
                No frameworks registered
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--muted-foreground)',
                  marginBottom: '16px',
                }}
              >
                Add your first framework to start tracking requirements.
              </div>
              <button
                onClick={() => setAddOpen(true)}
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
                Add Framework
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cross-Framework Gap Summary Table */}
      {stats.unmappedCount + stats.notStarted > 0 && (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--border)',
            }}
          >
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
              Requirements Needing Attention
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                color: 'var(--muted-foreground)',
                margin: '4px 0 0',
              }}
            >
              Requirements with no mapped controls or with not-started implementation status.
            </p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {['Framework', 'Requirement', 'Status', 'Gap'].map(h => (
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
                {(() => {
                  const leafReqs = requirements.filter(r => r.parentRequirementId !== '');
                  const mappedReqIds = new Set(mappings.map(m => m.requirementId));
                  const gapRows: { req: FrameworkRequirement; fw: ComplianceFramework; gapType: string; mapping?: ControlRequirementMapping }[] = [];

                  leafReqs.forEach(req => {
                    const fw = frameworks.find(f => f.id === req.frameworkId);
                    if (!fw) return;
                    if (!mappedReqIds.has(req.id)) {
                      gapRows.push({ req, fw, gapType: 'No Controls Mapped' });
                    } else {
                      const reqMappings = mappings.filter(m => m.requirementId === req.id);
                      reqMappings.forEach(m => {
                        if (m.implementationStatus === 'not_started') {
                          gapRows.push({ req, fw, gapType: 'Not Started', mapping: m });
                        }
                      });
                    }
                  });

                  return gapRows.slice(0, 15).map((row, idx) => (
                    <tr
                      key={`${row.req.id}-${idx}`}
                      style={{
                        background: idx % 2 === 0 ? 'var(--card)' : 'var(--muted)',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/compliance/${row.fw.id}`)}
                    >
                      <td
                        style={{
                          padding: '0 16px',
                          height: '40px',
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--text-base)',
                          color: 'var(--primary)',
                          fontWeight: 'var(--font-weight-semibold)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {row.fw.name}
                      </td>
                      <td
                        style={{
                          padding: '0 16px',
                          height: '40px',
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--text-base)',
                          color: 'var(--foreground)',
                        }}
                      >
                        <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                          {row.req.referenceCode}
                        </span>
                        <span style={{ color: 'var(--muted-foreground)', marginLeft: '6px' }}>
                          {row.req.title}
                        </span>
                      </td>
                      <td style={{ padding: '0 16px', height: '40px' }}>
                        {row.mapping ? (
                          <Badge
                            bg={IMPLEMENTATION_STATUS_STYLES[row.mapping.implementationStatus].background}
                            color={IMPLEMENTATION_STATUS_STYLES[row.mapping.implementationStatus].color}
                          >
                            {IMPLEMENTATION_STATUS_LABELS[row.mapping.implementationStatus]}
                          </Badge>
                        ) : (
                          <Badge bg="#F0F0F0" color="#6B7489">Unmapped</Badge>
                        )}
                      </td>
                      <td
                        style={{
                          padding: '0 16px',
                          height: '40px',
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '12px',
                          color: '#C0392B',
                          fontWeight: 'var(--font-weight-semibold)',
                        }}
                      >
                        {row.gapType}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Framework Modal */}
      <FrameworkFormModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleAddFramework}
      />
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

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontFamily: 'var(--font-family-primary)',
        fontSize: '11px',
      }}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
        }}
      />
      <span style={{ fontWeight: 'var(--font-weight-semibold)', color }}>{value}</span>
      <span style={{ color: 'var(--muted-foreground)' }}>{label}</span>
    </span>
  );
}