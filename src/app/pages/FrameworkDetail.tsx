import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Edit2, Trash2, BookOpen, ChevronDown, ChevronRight,
  ShieldCheck, Plus, X, Award, Calendar, CheckCircle, AlertTriangle,
  Clock,
} from 'lucide-react';
import { FrameworkFormModal } from '../components/compliance/FrameworkFormModal';
import { LinkRequirementToControlModal } from '../components/compliance/RequirementLinkModal';
import { RequirementFormModal } from '../components/compliance/RequirementFormModal';
import type { RequirementFormData } from '../components/compliance/RequirementFormModal';
import type { ComplianceFramework } from '../data/complianceFrameworkData';
import {
  loadFrameworks, saveFrameworks,
  FRAMEWORK_STATUS_LABELS, FRAMEWORK_STATUS_STYLES,
} from '../data/complianceFrameworkData';
import type { FrameworkRequirement } from '../data/frameworkRequirementData';
import {
  loadRequirements, saveRequirements, getRequirementsForFramework, getDomainRequirements, getChildRequirements,
} from '../data/frameworkRequirementData';
import type { Control } from '../data/controlData';
import { loadControls, CONTROL_STATUS_LABELS, CONTROL_TYPE_LABELS, CONTROL_STATUS_STYLES, CONTROL_TYPE_STYLES } from '../data/controlData';
import type { ControlRequirementMapping } from '../data/controlRequirementData';
import {
  loadControlRequirementMappings, saveControlRequirementMappings,
  getMappingsForRequirement,
  IMPLEMENTATION_STATUS_LABELS, IMPLEMENTATION_STATUS_STYLES,
} from '../data/controlRequirementData';
import { formatDate, MOCK_USERS, generateId } from '../data/mockData';

// ─── Tab Types ───────────────────────────────────────────────────────────────

type TabKey = 'requirements' | 'gap_analysis' | 'controls';

interface TabDef {
  key: TabKey;
  label: string;
  count?: number;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function FrameworkDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [requirements, setRequirements] = useState<FrameworkRequirement[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [mappings, setMappings] = useState<ControlRequirementMapping[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('requirements');
  const [linkReqId, setLinkReqId] = useState<string | null>(null);
  const [unlinkConfirm, setUnlinkConfirm] = useState<{ mappingId: string; controlName: string } | null>(null);
  const [addReqModalOpen, setAddReqModalOpen] = useState(false);
  const [addReqParentDomain, setAddReqParentDomain] = useState<FrameworkRequirement | undefined>(undefined);
  const [editReqTarget, setEditReqTarget] = useState<FrameworkRequirement | undefined>(undefined);
  const [deleteReqConfirm, setDeleteReqConfirm] = useState<{ req: FrameworkRequirement; childCount: number } | null>(null);

  useEffect(() => {
    setFrameworks(loadFrameworks());
    setRequirements(loadRequirements());
    setControls(loadControls());
    setMappings(loadControlRequirementMappings());
  }, []);

  const framework = useMemo(() => frameworks.find(f => f.id === id), [frameworks, id]);

  const persistFrameworks = useCallback((updated: ComplianceFramework[]) => {
    setFrameworks(updated);
    saveFrameworks(updated);
  }, []);

  const persistMappings = useCallback((updated: ControlRequirementMapping[]) => {
    setMappings(updated);
    saveControlRequirementMappings(updated);
  }, []);

  const persistRequirements = useCallback((updated: FrameworkRequirement[]) => {
    setRequirements(updated);
    saveRequirements(updated);
  }, []);

  // Framework-specific data
  const fwRequirements = useMemo(
    () => (id ? getRequirementsForFramework(requirements, id) : []),
    [requirements, id]
  );
  const domains = useMemo(
    () => (id ? getDomainRequirements(requirements, id) : []),
    [requirements, id]
  );
  const leafReqs = useMemo(
    () => fwRequirements.filter(r => r.parentRequirementId !== ''),
    [fwRequirements]
  );

  // Stats
  const stats = useMemo(() => {
    const leafIds = new Set(leafReqs.map(r => r.id));
    const fwMappings = mappings.filter(m => leafIds.has(m.requirementId));
    const implemented = fwMappings.filter(m => m.implementationStatus === 'implemented').length;
    const inProgress = fwMappings.filter(m => m.implementationStatus === 'in_progress').length;
    const notStarted = fwMappings.filter(m => m.implementationStatus === 'not_started').length;
    const mappedReqIds = new Set(fwMappings.map(m => m.requirementId));
    const unmapped = leafReqs.filter(r => !mappedReqIds.has(r.id)).length;
    const controlIds = new Set(fwMappings.map(m => m.controlId));
    const pct = leafReqs.length > 0 ? Math.round((implemented / leafReqs.length) * 100) : 0;
    return { implemented, inProgress, notStarted, unmapped, controlCount: controlIds.size, pct, totalMappings: fwMappings.length };
  }, [leafReqs, mappings]);

  const gapReqs = useMemo(() => {
    const mappedReqIds = new Set(mappings.filter(m => leafReqs.some(r => r.id === m.requirementId)).map(m => m.requirementId));
    return leafReqs.filter(r => {
      if (!mappedReqIds.has(r.id)) return true;
      const reqMappings = mappings.filter(m => m.requirementId === r.id);
      return reqMappings.some(m => m.implementationStatus === 'not_started');
    });
  }, [leafReqs, mappings]);

  const isHitrust = framework?.name?.toLowerCase().includes('hitrust') ?? false;

  // ─── Handlers ────────────────────────────────────────────────────────────

  function handleSaveFramework(data: Omit<ComplianceFramework, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!framework) return;
    const today = new Date().toISOString().split('T')[0];
    persistFrameworks(frameworks.map(f =>
      f.id === framework.id ? { ...f, ...data, updatedAt: today } : f
    ));
  }

  function handleDelete() {
    if (!framework) return;
    persistFrameworks(frameworks.filter(f => f.id !== framework.id));
    // Also remove all mappings for requirements in this framework
    const leafIds = new Set(leafReqs.map(r => r.id));
    persistMappings(mappings.filter(m => !leafIds.has(m.requirementId)));
    navigate('/compliance');
  }

  function handleLinkControl(data: Omit<ControlRequirementMapping, 'id' | 'lastAssessedDate' | 'assessor'>) {
    const today = new Date().toISOString().split('T')[0];
    const newMapping: ControlRequirementMapping = {
      id: 'CRM-' + generateId(),
      ...data,
      lastAssessedDate: today,
      assessor: MOCK_USERS[0],
    };
    persistMappings([...mappings, newMapping]);
  }

  function handleUnlinkMapping(mappingId: string) {
    persistMappings(mappings.filter(m => m.id !== mappingId));
    setUnlinkConfirm(null);
  }

  function handleAddRequirement(data: RequirementFormData) {
    const newRequirement: FrameworkRequirement = {
      id: 'REQ-' + generateId(),
      ...data,
    };
    persistRequirements([...requirements, newRequirement]);
    setAddReqModalOpen(false);
    setAddReqParentDomain(undefined);
  }

  function handleEditRequirement(data: RequirementFormData) {
    if (!editReqTarget) return;
    persistRequirements(requirements.map(r =>
      r.id === editReqTarget.id ? { ...r, ...data } : r
    ));
    setEditReqTarget(undefined);
    setAddReqModalOpen(false);
  }

  function handleDeleteRequirement() {
    if (!deleteReqConfirm) return;
    const { req } = deleteReqConfirm;
    const isDomain = req.parentRequirementId === '';
    // Collect IDs to delete: the requirement itself + all children if it's a domain
    const idsToDelete = new Set<string>([req.id]);
    if (isDomain) {
      getChildRequirements(requirements, req.id).forEach(c => idsToDelete.add(c.id));
    }
    // Remove requirements
    persistRequirements(requirements.filter(r => !idsToDelete.has(r.id)));
    // Cascade-remove control-requirement mappings
    persistMappings(mappings.filter(m => !idsToDelete.has(m.requirementId)));
    setDeleteReqConfirm(null);
  }

  function openAddDomain() {
    setEditReqTarget(undefined);
    setAddReqParentDomain(undefined);
    setAddReqModalOpen(true);
  }

  function openAddChildRequirement(parentDomain: FrameworkRequirement) {
    setEditReqTarget(undefined);
    setAddReqParentDomain(parentDomain);
    setAddReqModalOpen(true);
  }

  function openEditRequirement(req: FrameworkRequirement) {
    setEditReqTarget(req);
    setAddReqParentDomain(req.parentRequirementId !== '' ? domains.find(d => d.id === req.parentRequirementId) : undefined);
    setAddReqModalOpen(true);
  }

  function openDeleteRequirement(req: FrameworkRequirement) {
    const childCount = req.parentRequirementId === '' ? getChildRequirements(requirements, req.id).length : 0;
    setDeleteReqConfirm({ req, childCount });
  }

  // ─── Not Found ───────────────────────────────────────────────────────────

  if (!framework) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', gap: '16px' }}>
        <BookOpen size={48} style={{ color: 'var(--muted-foreground)' }} />
        <h3 style={{ fontFamily: 'var(--font-family-primary)', fontSize: '18px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0 }}>
          Framework not found
        </h3>
        <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', margin: 0 }}>
          The framework you are looking for does not exist or has been deleted.
        </p>
        <button
          onClick={() => navigate('/compliance')}
          style={{ height: '36px', padding: '0 16px', border: 'none', borderRadius: 'var(--radius-button)', background: 'var(--primary)', color: 'var(--primary-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}
        >
          Back to Framework Dashboard
        </button>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const isAssessmentOverdue = framework.nextAssessmentDate && framework.nextAssessmentDate < today;

  const tabDefs: TabDef[] = [
    { key: 'requirements', label: 'Requirements', count: leafReqs.length },
    { key: 'gap_analysis', label: 'Gap Analysis', count: gapReqs.length },
    { key: 'controls', label: 'Mapped Controls', count: stats.controlCount },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back nav */}
      <button
        onClick={() => navigate('/compliance')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)' }}
      >
        <ArrowLeft size={14} />
        Back to Framework Dashboard
      </button>

      {/* Record Summary Header */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '24px', boxShadow: 'var(--elevation-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)' }}>
                {framework.id}
              </span>
              <Badge bg={FRAMEWORK_STATUS_STYLES[framework.status].background} color={FRAMEWORK_STATUS_STYLES[framework.status].color}>
                {FRAMEWORK_STATUS_LABELS[framework.status]}
              </Badge>
              {framework.certificationRequired && (
                <Badge bg="rgba(35,34,240,0.08)" color="#2322F0">
                  <Award size={10} style={{ marginRight: '3px' }} />
                  Certification Required
                </Badge>
              )}
              {isAssessmentOverdue && (
                <Badge bg="rgba(192,57,43,0.08)" color="var(--destructive)">
                  <Clock size={10} style={{ marginRight: '3px' }} />
                  Assessment Overdue
                </Badge>
              )}
            </div>
            <h2 style={{ fontFamily: 'var(--font-family-primary)', fontSize: '22px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0, lineHeight: '30px' }}>
              {framework.name} {framework.version}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <MetaItem icon={<BookOpen size={12} />} text={framework.governingBody} />
              {framework.effectiveDate && <MetaItem icon={<Calendar size={12} />} text={`Effective: ${formatDate(framework.effectiveDate)}`} />}
              {framework.nextAssessmentDate && (
                <MetaItem
                  icon={<Calendar size={12} />}
                  text={`Next Assessment: ${formatDate(framework.nextAssessmentDate)}`}
                  highlight={isAssessmentOverdue}
                />
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <SecondaryBtn onClick={() => setEditOpen(true)} icon={<Edit2 size={14} />}>Edit</SecondaryBtn>
            <DestructiveBtn onClick={() => setDeleteConfirmOpen(true)} icon={<Trash2 size={14} />}>Delete</DestructiveBtn>
          </div>
        </div>

        {/* Description */}
        {framework.description && (
          <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)', lineHeight: '22px', margin: '16px 0 0', maxWidth: '800px' }}>
            {framework.description}
          </p>
        )}

        {/* Progress bar */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
              {stats.pct}% Implemented
            </span>
            <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>
              {stats.implemented} of {leafReqs.length} requirements
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'var(--muted)', overflow: 'hidden', display: 'flex' }}>
            {leafReqs.length > 0 && (
              <>
                <div style={{ width: `${(stats.implemented / leafReqs.length) * 100}%`, background: '#1C8A45', transition: 'width 0.3s' }} />
                <div style={{ width: `${(stats.inProgress / leafReqs.length) * 100}%`, background: '#E07B00', transition: 'width 0.3s' }} />
                <div style={{ width: `${(stats.notStarted / leafReqs.length) * 100}%`, background: '#C0392B', transition: 'width 0.3s' }} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <TabBar tabs={tabDefs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ─── Requirements Tab ──────────────────────────────────────────────── */}
      {activeTab === 'requirements' && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
          {/* Add Domain button header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '12px 24px', borderBottom: '1px solid var(--border)' }}>
            <button
              onClick={openAddDomain}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '28px', padding: '0 12px', border: '1px solid var(--primary)', borderRadius: 'var(--radius-button)', background: 'transparent', color: 'var(--primary)', fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}
            >
              <Plus size={12} />
              Add Domain
            </button>
          </div>
          {domains.length === 0 ? (
            <EmptySection message="No requirements defined" subMessage="Add a domain to start defining requirements for this framework." />
          ) : (
            domains.map(domain => (
              <DomainSection
                key={domain.id}
                domain={domain}
                requirements={requirements}
                mappings={mappings}
                controls={controls}
                isHitrust={isHitrust}
                onLinkControl={reqId => setLinkReqId(reqId)}
                onUnlinkMapping={(mappingId, controlName) => setUnlinkConfirm({ mappingId, controlName })}
                onNavigateControl={ctlId => navigate(`/controls/${ctlId}`)}
                onEditDomain={() => openEditRequirement(domain)}
                onDeleteDomain={() => openDeleteRequirement(domain)}
                onAddChildRequirement={() => openAddChildRequirement(domain)}
                onEditRequirement={openEditRequirement}
                onDeleteRequirement={openDeleteRequirement}
              />
            ))
          )}
        </div>
      )}

      {/* ─── Gap Analysis Tab ──────────────────────────────────────────────── */}
      {activeTab === 'gap_analysis' && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
          {gapReqs.length === 0 ? (
            <EmptySection
              message="No gaps identified"
              subMessage="All requirements have at least one implemented control mapping."
              icon={<CheckCircle size={48} style={{ color: '#1C8A45' }} />}
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                    {['Reference', 'Requirement', 'Status', 'Gap Details', ''].map(h => (
                      <th key={h} style={{ padding: '0 16px', height: '40px', textAlign: 'left', fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gapReqs.map((req, idx) => {
                    const reqMappings = getMappingsForRequirement(mappings, req.id);
                    const hasNotStarted = reqMappings.some(m => m.implementationStatus === 'not_started');
                    const isUnmapped = reqMappings.length === 0;
                    return (
                      <tr key={req.id} style={{ background: idx % 2 === 0 ? 'var(--card)' : 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0 16px', height: '40px', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                          {req.referenceCode}
                        </td>
                        <td style={{ padding: '8px 16px', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)', maxWidth: '300px' }}>
                          {req.title}
                        </td>
                        <td style={{ padding: '0 16px', height: '40px' }}>
                          {isUnmapped ? (
                            <Badge bg="#F0F0F0" color="#6B7489">No Controls</Badge>
                          ) : hasNotStarted ? (
                            <Badge bg={IMPLEMENTATION_STATUS_STYLES.not_started.background} color={IMPLEMENTATION_STATUS_STYLES.not_started.color}>
                              Not Started
                            </Badge>
                          ) : null}
                        </td>
                        <td style={{ padding: '0 16px', height: '40px', fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {isUnmapped
                            ? 'No controls mapped to this requirement'
                            : reqMappings.filter(m => m.implementationStatus === 'not_started').map(m => m.gapNotes).join('; ') || 'Implementation not started'
                          }
                        </td>
                        <td style={{ padding: '0 16px', height: '40px' }}>
                          <button
                            onClick={() => setLinkReqId(req.id)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', height: '24px', padding: '0 8px', border: '1px solid var(--primary)', borderRadius: 'var(--radius-button)', background: 'transparent', color: 'var(--primary)', fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}
                          >
                            <Plus size={10} />
                            Map Control
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Controls Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'controls' && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
          {(() => {
            const leafIds = new Set(leafReqs.map(r => r.id));
            const fwMappings = mappings.filter(m => leafIds.has(m.requirementId));
            const controlIds = [...new Set(fwMappings.map(m => m.controlId))];
            const mappedControls = controlIds.map(cId => {
              const ctrl = controls.find(c => c.id === cId);
              const ctrlMappings = fwMappings.filter(m => m.controlId === cId);
              return { ctrl, mappings: ctrlMappings };
            }).filter(x => x.ctrl);

            if (mappedControls.length === 0) {
              return <EmptySection message="No controls mapped" subMessage="Map controls to framework requirements to see them here." />;
            }

            return (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                      {['Control', 'Type', 'Status', 'Requirements Covered', 'Implementation'].map(h => (
                        <th key={h} style={{ padding: '0 16px', height: '40px', textAlign: 'left', fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mappedControls.map(({ ctrl, mappings: ctrlMappings }, idx) => {
                      if (!ctrl) return null;
                      const ctlStatus = CONTROL_STATUS_STYLES[ctrl.status];
                      const ctlType = CONTROL_TYPE_STYLES[ctrl.controlType];
                      const implementedCount = ctrlMappings.filter(m => m.implementationStatus === 'implemented').length;

                      return (
                        <tr key={ctrl.id} style={{ background: idx % 2 === 0 ? 'var(--card)' : 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '8px 16px' }}>
                            <div
                              onClick={() => navigate(`/controls/${ctrl.id}`)}
                              style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)', cursor: 'pointer', lineHeight: '20px' }}
                            >
                              {ctrl.name}
                            </div>
                            <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                              {ctrl.id} · {ctrl.department}
                            </div>
                          </td>
                          <td style={{ padding: '0 16px', height: '40px' }}>
                            <Badge bg={ctlType.background} color={ctlType.color}>{CONTROL_TYPE_LABELS[ctrl.controlType]}</Badge>
                          </td>
                          <td style={{ padding: '0 16px', height: '40px' }}>
                            <Badge bg={ctlStatus.background} color={ctlStatus.color}>{CONTROL_STATUS_LABELS[ctrl.status]}</Badge>
                          </td>
                          <td style={{ padding: '0 16px', height: '40px', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)' }}>
                            {ctrlMappings.length} requirement{ctrlMappings.length !== 1 ? 's' : ''}
                          </td>
                          <td style={{ padding: '0 16px', height: '40px' }}>
                            <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: implementedCount === ctrlMappings.length ? '#1C8A45' : '#E07B00' }}>
                              {implementedCount}/{ctrlMappings.length} implemented
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* ─── Modals ────────────────────────────────────────────────────────── */}

      <FrameworkFormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleSaveFramework}
        initial={framework}
      />

      {linkReqId && (
        <LinkRequirementToControlModal
          isOpen={!!linkReqId}
          onClose={() => setLinkReqId(null)}
          onSave={handleLinkControl}
          requirementId={linkReqId}
          isHitrust={isHitrust}
          controls={controls}
          existingMappings={mappings}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirmOpen && (
        <ConfirmDialog
          title="Delete Framework"
          message={<>Are you sure you want to delete <strong>{framework.name} {framework.version}</strong>? All control-requirement mappings for this framework will also be removed. This action cannot be undone.</>}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirmOpen(false)}
          confirmLabel="Delete"
        />
      )}

      {/* Unlink Confirmation */}
      {unlinkConfirm && (
        <ConfirmDialog
          title="Remove Mapping"
          message={<>Are you sure you want to remove the mapping to <strong>{unlinkConfirm.controlName}</strong>?</>}
          onConfirm={() => handleUnlinkMapping(unlinkConfirm.mappingId)}
          onCancel={() => setUnlinkConfirm(null)}
          confirmLabel="Remove"
        />
      )}

      {/* Add/Edit Requirement */}
      <RequirementFormModal
        isOpen={addReqModalOpen}
        onClose={() => { setAddReqModalOpen(false); setEditReqTarget(undefined); setAddReqParentDomain(undefined); }}
        onSave={editReqTarget ? handleEditRequirement : handleAddRequirement}
        initial={editReqTarget}
        frameworkId={id!}
        parentDomain={addReqParentDomain}
        isHitrust={isHitrust}
        existingDomains={domains}
      />

      {/* Delete Requirement Confirmation */}
      {deleteReqConfirm && (
        <ConfirmDialog
          title={deleteReqConfirm.req.parentRequirementId === '' ? 'Delete Domain' : 'Delete Requirement'}
          message={
            deleteReqConfirm.req.parentRequirementId === ''
              ? <>Are you sure you want to delete the domain <strong>{deleteReqConfirm.req.referenceCode} — {deleteReqConfirm.req.title}</strong>?{deleteReqConfirm.childCount > 0 && <> This will also remove <strong>{deleteReqConfirm.childCount}</strong> child requirement{deleteReqConfirm.childCount !== 1 ? 's' : ''} and all their control mappings.</>} This action cannot be undone.</>
              : <>Are you sure you want to delete <strong>{deleteReqConfirm.req.referenceCode} — {deleteReqConfirm.req.title}</strong>? All control mappings for this requirement will also be removed. This action cannot be undone.</>
          }
          onConfirm={handleDeleteRequirement}
          onCancel={() => setDeleteReqConfirm(null)}
          confirmLabel="Delete"
        />
      )}
    </div>
  );
}

// ─── Domain Section (Collapsible Hierarchy) ──────────────────────────────────

function DomainSection({
  domain,
  requirements,
  mappings,
  controls,
  isHitrust,
  onLinkControl,
  onUnlinkMapping,
  onNavigateControl,
  onEditDomain,
  onDeleteDomain,
  onAddChildRequirement,
  onEditRequirement,
  onDeleteRequirement,
}: {
  domain: FrameworkRequirement;
  requirements: FrameworkRequirement[];
  mappings: ControlRequirementMapping[];
  controls: Control[];
  isHitrust: boolean;
  onLinkControl: (reqId: string) => void;
  onUnlinkMapping: (mappingId: string, controlName: string) => void;
  onNavigateControl: (ctlId: string) => void;
  onEditDomain?: () => void;
  onDeleteDomain?: () => void;
  onAddChildRequirement?: () => void;
  onEditRequirement?: (req: FrameworkRequirement) => void;
  onDeleteRequirement?: (req: FrameworkRequirement) => void;
}) {
  const [open, setOpen] = useState(true);
  const children = getChildRequirements(requirements, domain.id);

  // Domain-level stats
  const domainStats = useMemo(() => {
    const childIds = new Set(children.map(c => c.id));
    const domainMappings = mappings.filter(m => childIds.has(m.requirementId));
    const implemented = domainMappings.filter(m => m.implementationStatus === 'implemented').length;
    const total = children.length;
    return { implemented, total };
  }, [children, mappings]);

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      {/* Domain header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 24px',
          background: 'var(--muted)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {open
          ? <ChevronDown size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
          : <ChevronRight size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
        }
        <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', minWidth: '40px' }}>
          {domain.referenceCode}
        </span>
        <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', flex: 1 }}>
          {domain.title}
        </span>
        <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: domainStats.implemented === domainStats.total && domainStats.total > 0 ? '#1C8A45' : 'var(--muted-foreground)' }}>
          {domainStats.implemented}/{domainStats.total}
        </span>
        {/* Action buttons — stopPropagation to avoid toggling collapse */}
        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
          {onEditDomain && (
            <button
              onClick={onEditDomain}
              title="Edit domain"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', padding: 0, border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', background: 'var(--card)', color: 'var(--primary)', cursor: 'pointer' }}
            >
              <Edit2 size={11} />
            </button>
          )}
          {onDeleteDomain && (
            <button
              onClick={onDeleteDomain}
              title="Delete domain"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', padding: 0, border: 'none', borderRadius: 'var(--radius-button)', background: 'var(--destructive)', color: 'var(--destructive-foreground)', cursor: 'pointer' }}
            >
              <Trash2 size={11} />
            </button>
          )}
          {onAddChildRequirement && (
            <button
              onClick={onAddChildRequirement}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', height: '24px', padding: '0 8px', border: '1px solid var(--primary)', borderRadius: 'var(--radius-button)', background: 'transparent', color: 'var(--primary)', fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}
            >
              <Plus size={10} />
              Add
            </button>
          )}
        </div>
      </div>

      {/* Children */}
      {open && children.map(req => (
        <RequirementRow
          key={req.id}
          requirement={req}
          mappings={mappings}
          controls={controls}
          isHitrust={isHitrust}
          onLinkControl={onLinkControl}
          onUnlinkMapping={onUnlinkMapping}
          onNavigateControl={onNavigateControl}
          onEditRequirement={onEditRequirement}
          onDeleteRequirement={onDeleteRequirement}
        />
      ))}
    </div>
  );
}

// ─── Requirement Row ─────────────────────────────────────────────────────────

function RequirementRow({
  requirement,
  mappings,
  controls,
  isHitrust,
  onLinkControl,
  onUnlinkMapping,
  onNavigateControl,
  onEditRequirement,
  onDeleteRequirement,
}: {
  requirement: FrameworkRequirement;
  mappings: ControlRequirementMapping[];
  controls: Control[];
  isHitrust: boolean;
  onLinkControl: (reqId: string) => void;
  onUnlinkMapping: (mappingId: string, controlName: string) => void;
  onNavigateControl: (ctlId: string) => void;
  onEditRequirement?: (req: FrameworkRequirement) => void;
  onDeleteRequirement?: (req: FrameworkRequirement) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const reqMappings = getMappingsForRequirement(mappings, requirement.id);
  const allImplemented = reqMappings.length > 0 && reqMappings.every(m => m.implementationStatus === 'implemented');

  // Determine the "best" implementation status for this requirement
  const bestStatus = reqMappings.length === 0
    ? null
    : allImplemented
    ? 'implemented'
    : reqMappings.some(m => m.implementationStatus === 'in_progress')
    ? 'in_progress'
    : 'not_started';

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 24px 10px 48px',
          cursor: 'pointer',
          background: expanded ? 'rgba(35,34,240,0.02)' : 'transparent',
        }}
      >
        {expanded
          ? <ChevronDown size={12} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
          : <ChevronRight size={12} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
        }
        <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)', minWidth: '50px' }}>
          {requirement.referenceCode}
        </span>
        <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {requirement.title}
        </span>
        {isHitrust && requirement.maturityLevel !== null && (
          <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', color: 'var(--muted-foreground)', flexShrink: 0 }}>
            L{requirement.maturityLevel}
          </span>
        )}
        {bestStatus ? (
          <Badge bg={IMPLEMENTATION_STATUS_STYLES[bestStatus].background} color={IMPLEMENTATION_STATUS_STYLES[bestStatus].color}>
            {IMPLEMENTATION_STATUS_LABELS[bestStatus as keyof typeof IMPLEMENTATION_STATUS_LABELS]}
          </Badge>
        ) : (
          <Badge bg="#F0F0F0" color="#6B7489">Unmapped</Badge>
        )}
        <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', color: 'var(--muted-foreground)', flexShrink: 0 }}>
          {reqMappings.length} ctrl{reqMappings.length !== 1 ? 's' : ''}
        </span>
        {/* Action buttons — stopPropagation to avoid toggling expand */}
        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
          {onEditRequirement && (
            <button
              onClick={() => onEditRequirement(requirement)}
              title="Edit requirement"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', padding: 0, border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', background: 'var(--card)', color: 'var(--primary)', cursor: 'pointer' }}
            >
              <Edit2 size={11} />
            </button>
          )}
          {onDeleteRequirement && (
            <button
              onClick={() => onDeleteRequirement(requirement)}
              title="Delete requirement"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', padding: 0, border: 'none', borderRadius: 'var(--radius-button)', background: 'var(--destructive)', color: 'var(--destructive-foreground)', cursor: 'pointer' }}
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded: description + mapped controls */}
      {expanded && (
        <div style={{ padding: '0 24px 16px 72px' }}>
          <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)', margin: '0 0 12px', lineHeight: '18px', maxWidth: '600px' }}>
            {requirement.description}
          </p>

          {/* Mapped controls table */}
          {reqMappings.length > 0 && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-input)', overflow: 'hidden', marginBottom: '8px' }}>
              {reqMappings.map(mapping => {
                const ctrl = controls.find(c => c.id === mapping.controlId);
                if (!ctrl) return null;
                return (
                  <div key={mapping.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
                    <ShieldCheck size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <div
                      onClick={e => { e.stopPropagation(); onNavigateControl(ctrl.id); }}
                      style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)', cursor: 'pointer', flex: 1, minWidth: '120px' }}
                    >
                      {ctrl.name}
                      <span style={{ fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)', marginLeft: '6px', fontSize: '12px' }}>
                        {ctrl.id}
                      </span>
                    </div>
                    <Badge bg={IMPLEMENTATION_STATUS_STYLES[mapping.implementationStatus].background} color={IMPLEMENTATION_STATUS_STYLES[mapping.implementationStatus].color}>
                      {IMPLEMENTATION_STATUS_LABELS[mapping.implementationStatus]}
                    </Badge>
                    {isHitrust && mapping.maturityScore !== null && (
                      <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', color: mapping.maturityScore >= 3 ? '#1C8A45' : '#E07B00' }}>
                        M{mapping.maturityScore}
                      </span>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); onUnlinkMapping(mapping.id, ctrl.name); }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', height: '22px', padding: '0 6px', border: 'none', borderRadius: 'var(--radius-input)', background: 'transparent', color: 'var(--destructive)', fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={e => { e.stopPropagation(); onLinkControl(requirement.id); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', height: '24px', padding: '0 10px', border: '1px solid var(--primary)', borderRadius: 'var(--radius-button)', background: 'transparent', color: 'var(--primary)', fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}
          >
            <Plus size={10} />
            Map Control
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Shared Helpers ──────────────────────────────────────────────────────────

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
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}

function MetaItem({ icon, text, highlight }: { icon: React.ReactNode; text: string; highlight?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: highlight ? 'var(--destructive)' : 'var(--muted-foreground)', fontWeight: highlight ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)' }}>
      {icon}
      {text}
    </span>
  );
}

function SecondaryBtn({ onClick, icon, children }: { onClick: () => void; icon: React.ReactNode; children: string }) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 16px', border: '1px solid var(--primary)', borderRadius: 'var(--radius-button)', background: 'transparent', color: 'var(--primary)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}
    >
      {icon}
      {children}
    </button>
  );
}

function DestructiveBtn({ onClick, icon, children }: { onClick: () => void; icon: React.ReactNode; children: string }) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 16px', border: 'none', borderRadius: 'var(--radius-button)', background: 'var(--destructive)', color: 'var(--destructive-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}
    >
      {icon}
      {children}
    </button>
  );
}

function TabBar({ tabs, activeTab, onTabChange }: { tabs: TabDef[]; activeTab: TabKey; onTabChange: (t: TabKey) => void }) {
  return (
    <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--border)', background: 'var(--card)', borderRadius: 'var(--radius-card) var(--radius-card) 0 0' }}>
      {tabs.map(tab => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '40px',
              padding: '0 20px',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-2px',
              background: 'transparent',
              color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: '18px', height: '18px', padding: '0 5px',
                borderRadius: '100px',
                background: isActive ? 'rgba(35,34,240,0.08)' : 'var(--muted)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '11px', fontWeight: 'var(--font-weight-semibold)',
                color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
              }}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function EmptySection({ message, subMessage, icon }: { message: string; subMessage: string; icon?: React.ReactNode }) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      {icon || <BookOpen size={48} style={{ color: 'var(--muted-foreground)', marginBottom: '8px' }} />}
      <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', marginTop: '8px' }}>
        {message}
      </div>
      <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', marginTop: '4px' }}>
        {subMessage}
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel,
}: {
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel: string;
}) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', padding: '24px' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: '0px 8px 32px rgba(0,0,0,0.18)', padding: '24px', maxWidth: '400px', width: '100%' }}>
        <h3 style={{ fontFamily: 'var(--font-family-primary)', fontSize: '18px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: '0 0 8px 0' }}>
          {title}
        </h3>
        <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', margin: '0 0 24px 0', lineHeight: '22px' }}>
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={onCancel}
            style={{ height: '36px', padding: '0 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', background: 'var(--card)', color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ height: '36px', padding: '0 16px', border: 'none', borderRadius: 'var(--radius-button)', background: 'var(--destructive)', color: 'var(--destructive-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}