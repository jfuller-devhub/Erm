import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Edit2, Trash2, ShieldCheck, User,
  Building2, Clock, Zap, AlertTriangle,
} from 'lucide-react';
import { UserChip } from '../components/shared/UserPicker';
import { ControlFormModal } from '../components/controls/ControlFormModal';
import { ControlRisksSection } from '../components/controls/ControlRisksSection';
import { ControlFrameworkSection } from '../components/compliance/ControlFrameworkSection';
import { ControlProcessesSection } from '../components/controls/ControlProcessesSection';
import type { Control, ControlStatus, ControlType, ControlEffectiveness } from '../data/controlData';
import {
  loadControls, saveControls,
  CONTROL_STATUS_LABELS, CONTROL_TYPE_LABELS, CONTROL_EFFECTIVENESS_LABELS,
  CONTROL_FREQUENCY_LABELS, CONTROL_STATUS_STYLES, CONTROL_TYPE_STYLES,
  CONTROL_EFFECTIVENESS_STYLES,
} from '../data/controlData';
import type { Risk } from '../data/riskData';
import { loadRisks } from '../data/riskData';
import type { RiskControl } from '../data/riskControlData';
import {
  loadRiskControls, saveRiskControls, getRisksForControl,
} from '../data/riskControlData';
import type { ComplianceFramework } from '../data/complianceFrameworkData';
import { loadFrameworks } from '../data/complianceFrameworkData';
import type { FrameworkRequirement } from '../data/frameworkRequirementData';
import { loadRequirements } from '../data/frameworkRequirementData';
import type { ControlRequirementMapping } from '../data/controlRequirementData';
import { loadControlRequirementMappings, saveControlRequirementMappings, getMappingsForControl } from '../data/controlRequirementData';
import { formatDate } from '../data/mockData';
import type { Process } from '../data/processData';
import { loadProcesses } from '../data/processData';
import type { ProcessControlLink } from '../data/processControlData';
import { loadProcessControlLinks, saveProcessControlLinks } from '../data/processControlData';

// ─── Tab type ────────────────────────────────────────────────────────────────

type TabKey = 'overview' | 'risks' | 'processes' | 'frameworks';

// ─── Badge helpers ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ControlStatus }) {
  const style = CONTROL_STATUS_STYLES[status] ?? { background: '#F0F0F0', color: '#6B7489' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '22px',
        padding: '0 10px',
        borderRadius: '100px',
        background: style.background,
        color: style.color,
        fontFamily: 'var(--font-family-primary)',
        fontSize: '12px',
        fontWeight: 'var(--font-weight-semibold)',
        lineHeight: '16px',
        whiteSpace: 'nowrap',
      }}
    >
      {CONTROL_STATUS_LABELS[status]}
    </span>
  );
}

function TypeBadge({ type }: { type: ControlType }) {
  const style = CONTROL_TYPE_STYLES[type] ?? { background: '#F0F0F0', color: '#6B7489' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '22px',
        padding: '0 10px',
        borderRadius: '100px',
        background: style.background,
        color: style.color,
        fontFamily: 'var(--font-family-primary)',
        fontSize: '12px',
        fontWeight: 'var(--font-weight-semibold)',
        lineHeight: '16px',
        whiteSpace: 'nowrap',
      }}
    >
      {CONTROL_TYPE_LABELS[type]}
    </span>
  );
}

function EffBadge({ effectiveness }: { effectiveness: ControlEffectiveness }) {
  const style = CONTROL_EFFECTIVENESS_STYLES[effectiveness] ?? { background: '#F0F0F0', color: '#6B7489' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '22px',
        padding: '0 10px',
        borderRadius: '100px',
        background: style.background,
        color: style.color,
        fontFamily: 'var(--font-family-primary)',
        fontSize: '12px',
        fontWeight: 'var(--font-weight-semibold)',
        lineHeight: '16px',
        whiteSpace: 'nowrap',
      }}
    >
      {CONTROL_EFFECTIVENESS_LABELS[effectiveness]}
    </span>
  );
}

// ─── Detail field ────────────────────────────────────────────────────────────

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '12px',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--muted-foreground)',
          lineHeight: '16px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </span>
      <div
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-regular)',
          color: 'var(--foreground)',
          lineHeight: '22px',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontFamily: 'var(--font-family-primary)',
        fontSize: '14px',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--foreground)',
        margin: 0,
        lineHeight: '20px',
        paddingBottom: '8px',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {children}
    </h3>
  );
}

// ─── Tab Button Bar ──────────────────────────────────────────────────────────

interface TabDef {
  key: TabKey;
  label: string;
  count?: number;
}

function TabButtonBar({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: TabDef[];
  activeTab: TabKey;
  onTabChange: (key: TabKey) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        borderBottom: '1px solid var(--border)',
        gap: '0',
        overflowX: 'auto',
      }}
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '40px',
              padding: '0 16px',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
              color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
              whiteSpace: 'nowrap',
              transition: 'color 0.15s ease, border-color 0.15s ease',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
            {tab.count != null && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '18px',
                  height: '18px',
                  padding: '0 5px',
                  borderRadius: '100px',
                  background: isActive ? 'rgba(35,34,240,0.08)' : 'var(--muted)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                  lineHeight: '14px',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ControlDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [controls, setControls] = useState<Control[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [riskControls, setRiskControls] = useState<RiskControl[]>([]);
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [fwRequirements, setFwRequirements] = useState<FrameworkRequirement[]>([]);
  const [crMappings, setCrMappings] = useState<ControlRequirementMapping[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [processControlLinks, setProcessControlLinks] = useState<ProcessControlLink[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  useEffect(() => {
    setControls(loadControls());
    setRisks(loadRisks());
    setRiskControls(loadRiskControls());
    setFrameworks(loadFrameworks());
    setFwRequirements(loadRequirements());
    setCrMappings(loadControlRequirementMappings());
    setProcesses(loadProcesses());
    setProcessControlLinks(loadProcessControlLinks());
  }, []);

  const control = useMemo(() => controls.find(c => c.id === id), [controls, id]);

  const persistControls = useCallback((updated: Control[]) => {
    setControls(updated);
    saveControls(updated);
  }, []);

  const persistRiskControls = useCallback((updated: RiskControl[]) => {
    setRiskControls(updated);
    saveRiskControls(updated);
  }, []);

  const persistCrMappings = useCallback((updated: ControlRequirementMapping[]) => {
    setCrMappings(updated);
    saveControlRequirementMappings(updated);
  }, []);

  const persistProcessControlLinks = useCallback((updated: ProcessControlLink[]) => {
    setProcessControlLinks(updated);
    saveProcessControlLinks(updated);
  }, []);

  // Linked risks count for tab badge
  const linkedRisksCount = useMemo(
    () => (id ? getRisksForControl(riskControls, id).length : 0),
    [riskControls, id]
  );

  // Framework mappings count for tab badge
  const frameworkMappingsCount = useMemo(
    () => (id ? getMappingsForControl(crMappings, id).length : 0),
    [crMappings, id]
  );

  // Process links count for tab badge
  const processLinksCount = useMemo(
    () => processControlLinks.filter(l => l.controlId === id).length,
    [processControlLinks, id]
  );

  function handleSaveControl(data: Omit<Control, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) {
    if (!control) return;
    const today = new Date().toISOString().split('T')[0];
    const updated = controls.map(c =>
      c.id === control.id
        ? { ...c, ...data, updatedAt: today, updatedBy: 'Emily Carter' }
        : c
    );
    persistControls(updated);
  }

  function handleDelete() {
    if (!control) return;
    persistControls(controls.filter(c => c.id !== control.id));
    navigate('/controls');
  }

  if (!control) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 24px',
          gap: '16px',
        }}
      >
        <ShieldCheck size={48} style={{ color: 'var(--muted-foreground)' }} />
        <h3
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '18px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--foreground)',
            margin: 0,
          }}
        >
          Control not found
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            color: 'var(--muted-foreground)',
            margin: 0,
          }}
        >
          The control record you are looking for does not exist or has been deleted.
        </p>
        <button
          onClick={() => navigate('/controls')}
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
          Back to Control Register
        </button>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const isTestOverdue = control.status === 'active' && control.nextTestDate && control.nextTestDate < today;

  // Tab definitions with counts
  const tabDefs: TabDef[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'risks', label: 'Risks', count: linkedRisksCount || undefined },
    { key: 'processes', label: 'Processes', count: processLinksCount || undefined },
    { key: 'frameworks', label: 'Frameworks', count: frameworkMappingsCount || undefined },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back nav */}
      <button
        onClick={() => navigate('/controls')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          fontFamily: 'var(--font-family-primary)',
          fontSize: '12px',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--primary)',
        }}
      >
        <ArrowLeft size={14} />
        Back to Control Register
      </button>

      {/* Record Summary Header */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '24px',
          boxShadow: 'var(--elevation-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--muted-foreground)',
                }}
              >
                {control.id}
              </span>
              <StatusBadge status={control.status} />
              <TypeBadge type={control.controlType} />
              <EffBadge effectiveness={control.effectiveness} />
              {control.isAutomated && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    height: '22px',
                    padding: '0 8px',
                    borderRadius: '100px',
                    background: '#E0F5F5',
                    color: '#00A3A3',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-semibold)',
                  }}
                >
                  <Zap size={10} />
                  Automated
                </span>
              )}
              {isTestOverdue && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    height: '22px',
                    padding: '0 8px',
                    borderRadius: '100px',
                    background: 'rgba(192,57,43,0.08)',
                    color: 'var(--destructive)',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-semibold)',
                  }}
                >
                  <AlertTriangle size={10} />
                  Test Overdue
                </span>
              )}
            </div>
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
              {control.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  color: 'var(--muted-foreground)',
                }}
              >
                <Building2 size={12} />
                {control.department}
              </span>
              {control.owner && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  <User size={12} />
                  {control.owner.name}
                </span>
              )}
              {control.nextTestDate && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    color: isTestOverdue ? 'var(--destructive)' : 'var(--muted-foreground)',
                  }}
                >
                  <Clock size={12} />
                  Next Test: {formatDate(control.nextTestDate)}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => setEditOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '36px',
                padding: '0 16px',
                border: '1px solid var(--primary)',
                borderRadius: 'var(--radius-button)',
                background: 'transparent',
                color: 'var(--primary)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
              }}
            >
              <Edit2 size={14} />
              Edit
            </button>
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
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
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* ─── Tab Bar ──────────────────────────────────────────────────────── */}
      <TabButtonBar tabs={tabDefs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ─── Tab Content ──────────────────────────────────────────────────── */}

      {activeTab === 'overview' && (
        <OverviewTab control={control} isTestOverdue={isTestOverdue} />
      )}

      {activeTab === 'risks' && (
        <ControlRisksSection
          controlId={control.id}
          risks={risks}
          riskControls={riskControls}
          onRiskControlsChange={persistRiskControls}
        />
      )}

      {activeTab === 'processes' && (
        <ControlProcessesSection
          controlId={control.id}
          processLinks={processControlLinks}
          processes={processes}
          onLinksChange={persistProcessControlLinks}
        />
      )}

      {activeTab === 'frameworks' && (
        <ControlFrameworkSection
          controlId={control.id}
          frameworks={frameworks}
          requirements={fwRequirements}
          mappings={crMappings}
          onMappingsChange={persistCrMappings}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmOpen && (
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
          onClick={e => { if (e.target === e.currentTarget) setDeleteConfirmOpen(false); }}
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
              Delete Control
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
              Are you sure you want to delete <strong>{control.name}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setDeleteConfirmOpen(false)}
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
                onClick={handleDelete}
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <ControlFormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleSaveControl}
        initialData={control}
        allControls={controls}
      />
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab({
  control,
  isTestOverdue,
}: {
  control: Control;
  isTestOverdue: boolean;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
      {/* Description Card */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '24px',
          gridColumn: '1 / -1',
        }}
      >
        <SectionTitle>Description</SectionTitle>
        <p
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)',
            color: 'var(--foreground)',
            lineHeight: '24px',
            margin: '12px 0 0 0',
            whiteSpace: 'pre-wrap',
          }}
        >
          {control.description || '—'}
        </p>
      </div>

      {/* Control Properties Card */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '24px',
        }}
      >
        <SectionTitle>Control Properties</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <DetailField label="Control Type">
            <TypeBadge type={control.controlType} />
          </DetailField>
          <DetailField label="Frequency">
            {CONTROL_FREQUENCY_LABELS[control.frequency]}
          </DetailField>
          <DetailField label="Effectiveness">
            <EffBadge effectiveness={control.effectiveness} />
          </DetailField>
          <DetailField label="Automated">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {control.isAutomated ? <Zap size={14} style={{ color: '#00A3A3' }} /> : null}
              {control.isAutomated ? 'Yes — Automated' : 'No — Manual'}
            </span>
          </DetailField>
          {control.frameworkRef && (
            <DetailField label="Framework Reference">
              {control.frameworkRef}
            </DetailField>
          )}
        </div>
      </div>

      {/* Ownership & Testing Card */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '24px',
        }}
      >
        <SectionTitle>Ownership & Testing</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <DetailField label="Owner">
            {control.owner ? <UserChip user={control.owner} /> : '—'}
          </DetailField>
          <DetailField label="Department">
            {control.department}
          </DetailField>
          <DetailField label="Last Tested">
            {control.lastTestedDate ? formatDate(control.lastTestedDate) : 'Never tested'}
          </DetailField>
          <DetailField label="Next Test Date">
            <span
              style={{
                color: isTestOverdue ? 'var(--destructive)' : 'var(--foreground)',
                fontWeight: isTestOverdue ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
              }}
            >
              {control.nextTestDate ? formatDate(control.nextTestDate) : '—'}
              {isTestOverdue && ' (Overdue)'}
            </span>
          </DetailField>
          <DetailField label="Status">
            <StatusBadge status={control.status} />
          </DetailField>
        </div>
      </div>

      {/* Audit Trail Card */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '24px',
          gridColumn: '1 / -1',
        }}
      >
        <SectionTitle>Audit Trail</SectionTitle>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginTop: '16px',
          }}
        >
          <DetailField label="Created At">
            {control.createdAt ? formatDate(control.createdAt) : '—'}
          </DetailField>
          <DetailField label="Created By">
            {control.createdBy || '—'}
          </DetailField>
          <DetailField label="Updated At">
            {control.updatedAt ? formatDate(control.updatedAt) : '—'}
          </DetailField>
          <DetailField label="Updated By">
            {control.updatedBy || '—'}
          </DetailField>
        </div>
      </div>
    </div>
  );
}
