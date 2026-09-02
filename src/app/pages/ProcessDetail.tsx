import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Edit2, Trash2, Activity, GitBranch, Tag, ArrowRight, Clock,
  ChevronDown, ChevronRight, ChevronUp, ListOrdered, Package, Heart, Briefcase, Building2, Plus, X, Check,
} from 'lucide-react';
import { ProcessFormModal } from '../components/processes/ProcessFormModal';
import { ProcessRisksTab } from '../components/processes/ProcessRisksTab';
import { ProcessControlsTab } from '../components/processes/ProcessControlsTab';
import { loadProcessRiskLinks } from '../data/processRiskData';
import { loadProcessControlLinks } from '../data/processControlData';
import type { Process, ProcessStatus, SubProcess, Step, StepType } from '../data/processData';
import { loadProcesses, saveProcesses } from '../data/processData';
import type { Product } from '../data/productData';
import { loadProducts } from '../data/productData';
import { formatDate, generateId } from '../data/mockData';
import { useApp } from '../context/AppContext';

// ─── Status badge ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<ProcessStatus, { background: string; color: string }> = {
  Active:  { background: '#E8F5EE', color: '#1C8A45' },
  Draft:   { background: '#FFF3E0', color: '#E07B00' },
  Retired: { background: '#F0F0F0', color: '#6B7489' },
};

function ProcessStatusBadge({ status }: { status: ProcessStatus }) {
  const style = STATUS_STYLES[status] ?? { background: '#F0F0F0', color: '#6B7489' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '20px',
        padding: '0 8px',
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
      {status}
    </span>
  );
}

// ─── Step type badge ─────────────────────────────────────────────────────────

const STEP_TYPE_STYLES: Record<string, { bg: string; fg: string }> = {
  Task: { bg: '#E8F5EE', fg: '#1C8A45' },
  Decision: { bg: '#FFF3E0', fg: '#E07B00' },
  'Hand-off': { bg: '#E0F5F5', fg: '#00A3A3' },
};

function StepTypeBadge({ type }: { type: string }) {
  const colors = STEP_TYPE_STYLES[type] ?? { bg: '#F0F0F0', fg: '#6B7489' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '18px',
        padding: '0 6px',
        borderRadius: '100px',
        background: colors.bg,
        color: colors.fg,
        fontFamily: 'var(--font-family-primary)',
        fontSize: '11px',
        fontWeight: 'var(--font-weight-semibold)',
        whiteSpace: 'nowrap',
      }}
    >
      {type}
    </span>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = ['Overview', 'Sub-Processes', 'Risks', 'Controls', 'Dependencies', 'Benefits or Services', 'Vendors'] as const;
type TabKey = typeof TABS[number];

// ─── Main Page ───────────────────────────────────────────────────────────────

export function ProcessDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vendors, updateVendor } = useApp();

  const [processes, setProcesses] = useState<Process[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('Overview');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [riskLinkCount, setRiskLinkCount] = useState(0);
  const [controlLinkCount, setControlLinkCount] = useState(0);

  useEffect(() => {
    setProcesses(loadProcesses());
    if (id) {
      setRiskLinkCount(loadProcessRiskLinks().filter(l => l.processId === id).length);
      setControlLinkCount(loadProcessControlLinks().filter(l => l.processId === id).length);
    }
  }, [id]);

  const process = processes.find(p => p.id === id) ?? null;

  const persist = useCallback((updated: Process[]) => {
    setProcesses(updated);
    saveProcesses(updated);
  }, []);

  function handleSave(updated: Process) {
    persist(processes.map(p => (p.id === updated.id ? updated : p)));
  }

  function handleVendorAssociationsChange(newVendorIds: string[]) {
    if (!process) return;
    const oldVendorIds = vendors
      .filter(v => (v.processAssociations ?? []).some(a => a.processId === process.id))
      .map(v => v.id);
    const oldSet = new Set(oldVendorIds);
    const newSet = new Set(newVendorIds);

    // Remove association from vendors that were unchecked
    oldVendorIds.forEach(vid => {
      if (!newSet.has(vid)) {
        const vendor = vendors.find(v => v.id === vid);
        if (vendor) {
          updateVendor(vid, {
            processAssociations: (vendor.processAssociations ?? []).filter(
              a => a.processId !== process.id
            ),
          });
        }
      }
    });

    // Add association to vendors that were checked
    newVendorIds.forEach(vid => {
      if (!oldSet.has(vid)) {
        const vendor = vendors.find(v => v.id === vid);
        if (vendor) {
          updateVendor(vid, {
            processAssociations: [
              ...(vendor.processAssociations ?? []),
              { processId: process.id },
            ],
          });
        }
      }
    });
  }

  function handleDelete() {
    persist(processes.filter(p => p.id !== id));
    navigate('/processes');
  }

  // ─── Not Found ─────────────────────────────────────────────────────────
  if (!process) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: '16px' }}>
        <Activity size={48} style={{ color: 'var(--muted-foreground)' }} />
        <h2 style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0 }}>
          Process not found
        </h2>
        <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)', margin: 0 }}>
          This process may have been deleted or the URL is invalid.
        </p>
        <button
          onClick={() => navigate('/processes')}
          style={{
            height: '36px', padding: '0 16px', border: 'none',
            borderRadius: 'var(--radius-button)', background: 'var(--primary)',
            color: 'var(--primary-foreground)', fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
          }}
        >
          Back to Process Register
        </button>
      </div>
    );
  }

  const subs = process.subProcesses ?? [];
  const totalSteps = subs.reduce((n, sp) => n + (sp.steps ?? []).length, 0);
  const deps = (process.dependsOnProcessIds ?? [])
    .map(depId => processes.find(p => p.id === depId))
    .filter(Boolean) as Process[];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ─── Back link ──────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate('/processes')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          fontFamily: 'var(--font-family-primary)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--primary)',
        }}
      >
        <ArrowLeft size={14} />
        Back to Process Register
      </button>

      {/* ─── Record Summary Header (Appian guideline) ───────────────────── */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--elevation-sm)',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          {/* Left: Name + badge + description */}
          <div style={{ flex: '1 1 300px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
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
                {process.name}
              </h2>
              <ProcessStatusBadge status={process.status} />
            </div>
            {process.shortDescription && (
              <p
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--muted-foreground)',
                  margin: '0 0 8px 0',
                  lineHeight: '22px',
                }}
              >
                {process.shortDescription}
              </p>
            )}
            {/* Tags */}
            {process.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {process.tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      background: 'rgba(35,34,240,0.08)',
                      color: 'var(--primary)',
                      borderRadius: '100px',
                      padding: '2px 8px',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '11px',
                      fontWeight: 'var(--font-weight-semibold)',
                    }}
                  >
                    <Tag size={9} />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right: Action buttons (primary right-aligned per Appian guideline) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              style={{
                height: '36px',
                padding: '0 16px',
                border: '1px solid var(--destructive)',
                borderRadius: 'var(--radius-button)',
                background: 'transparent',
                color: 'var(--destructive)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(192,57,43,0.06)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              <Trash2 size={14} />
              Delete
            </button>
            <button
              onClick={() => setModalOpen(true)}
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
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'opacity 0.1s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.opacity = '0.85';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.opacity = '1';
              }}
            >
              <Edit2 size={14} />
              Edit Process
            </button>
          </div>
        </div>

        {/* Key metadata row */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '16px' }}>
          {process.businessDomain && (
            <MetadataChip label="Domain" value={process.businessDomain} />
          )}
          {process.owner && (
            <MetadataChip label="Owner" value={process.owner.name} />
          )}
          {process.effectiveStartDate && (
            <MetadataChip
              label="Effective"
              value={`${formatDate(process.effectiveStartDate)}${process.effectiveEndDate ? ' – ' + formatDate(process.effectiveEndDate) : ''}`}
            />
          )}
          <MetadataChip label="Sub-Processes" value={String(subs.length)} />
          <MetadataChip label="Steps" value={String(totalSteps)} />
          <MetadataChip label="Last Updated" value={formatDate(process.updatedDate)} />
        </div>
      </div>

      {/* ─── Tabs (Appian tabButtonBar) ─────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          borderBottom: '1px solid var(--border)',
        }}
      >
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              height: '40px',
              padding: '0 16px',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'transparent',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: activeTab === tab ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
              color: activeTab === tab ? 'var(--primary)' : 'var(--muted-foreground)',
              cursor: 'pointer',
              transition: 'color 0.1s, border-color 0.1s',
            }}
          >
            {tab}
            {tab === 'Sub-Processes' && subs.length > 0 && (
              <span
                style={{
                  marginLeft: '6px',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: activeTab === tab ? 'var(--primary)' : 'var(--muted-foreground)',
                  background: activeTab === tab ? 'rgba(35,34,240,0.08)' : 'var(--muted)',
                  borderRadius: '100px',
                  padding: '1px 7px',
                }}
              >
                {subs.length}
              </span>
            )}
            {tab === 'Risks' && riskLinkCount > 0 && (
              <span
                style={{
                  marginLeft: '6px',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: activeTab === tab ? 'var(--primary)' : 'var(--muted-foreground)',
                  background: activeTab === tab ? 'rgba(35,34,240,0.08)' : 'var(--muted)',
                  borderRadius: '100px',
                  padding: '1px 7px',
                }}
              >
                {riskLinkCount}
              </span>
            )}
            {tab === 'Controls' && controlLinkCount > 0 && (
              <span
                style={{
                  marginLeft: '6px',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: activeTab === tab ? 'var(--primary)' : 'var(--muted-foreground)',
                  background: activeTab === tab ? 'rgba(35,34,240,0.08)' : 'var(--muted)',
                  borderRadius: '100px',
                  padding: '1px 7px',
                }}
              >
                {controlLinkCount}
              </span>
            )}
            {tab === 'Dependencies' && deps.length > 0 && (
              <span
                style={{
                  marginLeft: '6px',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: activeTab === tab ? 'var(--primary)' : 'var(--muted-foreground)',
                  background: activeTab === tab ? 'rgba(35,34,240,0.08)' : 'var(--muted)',
                  borderRadius: '100px',
                  padding: '1px 7px',
                }}
              >
                {deps.length}
              </span>
            )}
            {tab === 'Benefits or Services' && (() => {
              const count = loadProducts().filter(p =>
                p.processAssociations.some(a => a.processId === process.id)
              ).length;
              return count > 0 ? (
                <span
                  style={{
                    marginLeft: '6px',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: activeTab === tab ? 'var(--primary)' : 'var(--muted-foreground)',
                    background: activeTab === tab ? 'rgba(35,34,240,0.08)' : 'var(--muted)',
                    borderRadius: '100px',
                    padding: '1px 7px',
                  }}
                >
                  {count}
                </span>
              ) : null;
            })()}
            {tab === 'Vendors' && (() => {
              const count = vendors.filter(v =>
                (v.processAssociations ?? []).some(a => a.processId === process.id)
              ).length;
              return count > 0 ? (
                <span
                  style={{
                    marginLeft: '6px',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: activeTab === tab ? 'var(--primary)' : 'var(--muted-foreground)',
                    background: activeTab === tab ? 'rgba(35,34,240,0.08)' : 'var(--muted)',
                    borderRadius: '100px',
                    padding: '1px 7px',
                  }}
                >
                  {count}
                </span>
              ) : null;
            })()}
          </button>
        ))}
      </div>

      {/* ─── Tab Content ───────────────────────────────────────────────── */}
      {activeTab === 'Overview' && (
        <OverviewTab process={process} />
      )}

      {activeTab === 'Sub-Processes' && (
        <SubProcessesTab process={process} onUpdateProcess={handleSave} />
      )}

      {activeTab === 'Risks' && (
        <ProcessRisksTab
          process={process}
          navigate={navigate}
          onCountChange={setRiskLinkCount}
        />
      )}

      {activeTab === 'Controls' && (
        <ProcessControlsTab
          process={process}
          navigate={navigate}
          onCountChange={setControlLinkCount}
        />
      )}

      {activeTab === 'Dependencies' && (
        <DependenciesTab deps={deps} navigate={navigate} />
      )}

      {activeTab === 'Benefits or Services' && (
        <ProductsTab process={process} />
      )}

      {activeTab === 'Vendors' && (
        <VendorsTab process={process} />
      )}

      {/* ─── Edit Modal ─────────────────────────────────────────────────── */}
      <ProcessFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editingProcess={process}
        existingProcesses={processes}
        vendors={vendors}
        associatedVendorIds={
          vendors
            .filter(v => (v.processAssociations ?? []).some(a => a.processId === process.id))
            .map(v => v.id)
        }
        onVendorAssociationsChange={handleVendorAssociationsChange}
      />

      {/* ─── Delete Confirmation ─────────────────────────────────────────── */}
      {deleteConfirmOpen && (
        <DeleteConfirmDialog
          processName={process.name}
          subProcessCount={subs.length}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirmOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab({ process }: { process: Process }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Purpose & Scope */}
      {(process.purpose || process.scope) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: process.purpose && process.scope ? '1fr 1fr' : '1fr',
            gap: '16px',
          }}
        >
          {process.purpose && (
            <ReadOnlyCard label="Purpose" value={process.purpose} />
          )}
          {process.scope && (
            <ReadOnlyCard label="Scope" value={process.scope} />
          )}
        </div>
      )}

      {/* Process ID and dates */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        <ReadOnlyCard label="Process ID" value={process.id} />
        <ReadOnlyCard label="Created" value={formatDate(process.createdDate)} />
        <ReadOnlyCard label="Last Updated" value={formatDate(process.updatedDate)} />
      </div>

      {/* Business Domain & Owner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        <ReadOnlyCard label="Business Domain" value={process.businessDomain || '—'} />
        <ReadOnlyCard
          label="Process Owner"
          value={process.owner ? process.owner.name : '—'}
        />
        <ReadOnlyCard label="Status" value={process.status} />
      </div>

      {/* Effective dates */}
      {(process.effectiveStartDate || process.effectiveEndDate) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
          }}
        >
          <ReadOnlyCard label="Effective Start Date" value={process.effectiveStartDate ? formatDate(process.effectiveStartDate) : '—'} />
          <ReadOnlyCard label="Effective End Date" value={process.effectiveEndDate ? formatDate(process.effectiveEndDate) : '—'} />
        </div>
      )}
    </div>
  );
}

// ─── Sub-Process form data type ──────────────────────────────────────────────

interface SubProcessFormData {
  name: string;
  description: string;
  objective: string;
  boundaryStart: string;
  boundaryEnd: string;
  tagsRaw: string; // comma-separated
}

const EMPTY_FORM: SubProcessFormData = {
  name: '', description: '', objective: '',
  boundaryStart: '', boundaryEnd: '', tagsRaw: '',
};

function subToForm(sp: SubProcess): SubProcessFormData {
  return {
    name: sp.name,
    description: sp.description,
    objective: sp.objective,
    boundaryStart: sp.boundaryStart,
    boundaryEnd: sp.boundaryEnd,
    tagsRaw: sp.tags.join(', '),
  };
}

// ─── Step form data type ─────────────────────────────────────────────────────

interface StepFormData {
  type: StepType;
  description: string;
  responsibleRole: string;
  systemTool: string;
  input: string;
  output: string;
  entryCriteria: string;
  exitCriteria: string;
}

const EMPTY_STEP_FORM: StepFormData = {
  type: 'Task',
  description: '',
  responsibleRole: '',
  systemTool: '',
  input: '',
  output: '',
  entryCriteria: '',
  exitCriteria: '',
};

function stepToForm(step: Step): StepFormData {
  return {
    type: step.type,
    description: step.description,
    responsibleRole: step.responsibleRole,
    systemTool: step.systemTool,
    input: step.input,
    output: step.output,
    entryCriteria: step.entryCriteria,
    exitCriteria: step.exitCriteria,
  };
}

// ─── Step inline form panel ───────────────────────────────────────────────────

const STEP_TYPES: StepType[] = ['Task', 'Decision', 'Hand-off'];

function StepFormPanel({
  initial,
  title,
  onSave,
  onCancel,
}: {
  initial: StepFormData;
  title: string;
  onSave: (data: StepFormData) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<StepFormData>(initial);
  const [descError, setDescError] = useState('');

  function set<K extends keyof StepFormData>(field: K, value: StepFormData[K]) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'description' && (value as string).trim()) setDescError('');
  }

  function handleSubmit() {
    if (!form.description.trim()) { setDescError('Description is required'); return; }
    onSave(form);
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '12px',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--foreground)',
    marginBottom: '4px',
    display: 'block',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '36px',
    padding: '0 12px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-input)',
    background: 'var(--card)',
    fontFamily: 'var(--font-family-primary)',
    fontSize: 'var(--text-base)',
    color: 'var(--foreground)',
    outline: 'none',
    boxSizing: 'border-box',
  };
  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    height: 'auto',
    padding: '8px 12px',
    resize: 'vertical' as const,
    lineHeight: '20px',
  };
  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7489' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    paddingRight: '30px',
  };

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Form header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ListOrdered size={14} style={{ color: 'var(--primary)' }} />
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
            }}
          >
            {title}
          </span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
            display: 'flex', alignItems: 'center', color: 'var(--muted-foreground)',
            borderRadius: 'var(--radius-input)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--foreground)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'; }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Row 1: Type + Description */}
      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>Type</label>
          <select
            value={form.type}
            onChange={e => set('type', e.target.value as StepType)}
            style={selectStyle}
          >
            {STEP_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>
            Description <span style={{ color: 'var(--destructive)' }}>*</span>
          </label>
          <input
            type="text"
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="What happens in this step?"
            style={{ ...inputStyle, borderColor: descError ? 'var(--destructive)' : 'var(--border)' }}
            onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = descError ? 'var(--destructive)' : 'var(--primary)'; }}
            onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = descError ? 'var(--destructive)' : 'var(--border)'; }}
          />
          {descError && (
            <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--destructive)', marginTop: '3px', display: 'block' }}>
              {descError}
            </span>
          )}
        </div>
      </div>

      {/* Row 2: Responsible Role + System/Tool */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>Responsible Role</label>
          <input
            type="text"
            value={form.responsibleRole}
            onChange={e => set('responsibleRole', e.target.value)}
            placeholder="e.g. Operations Manager"
            style={inputStyle}
            onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--primary)'; }}
            onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--border)'; }}
          />
        </div>
        <div>
          <label style={labelStyle}>System / Tool</label>
          <input
            type="text"
            value={form.systemTool}
            onChange={e => set('systemTool', e.target.value)}
            placeholder="e.g. Salesforce, Jira"
            style={inputStyle}
            onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--primary)'; }}
            onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--border)'; }}
          />
        </div>
      </div>

      {/* Row 3: Input + Output */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>Input</label>
          <textarea
            rows={2}
            value={form.input}
            onChange={e => set('input', e.target.value)}
            placeholder="What does this step receive?"
            style={textareaStyle}
            onFocus={e => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = 'var(--primary)'; }}
            onBlur={e => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = 'var(--border)'; }}
          />
        </div>
        <div>
          <label style={labelStyle}>Output</label>
          <textarea
            rows={2}
            value={form.output}
            onChange={e => set('output', e.target.value)}
            placeholder="What does this step produce?"
            style={textareaStyle}
            onFocus={e => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = 'var(--primary)'; }}
            onBlur={e => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = 'var(--border)'; }}
          />
        </div>
      </div>

      {/* Row 4: Entry Criteria + Exit Criteria */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>Entry Criteria</label>
          <input
            type="text"
            value={form.entryCriteria}
            onChange={e => set('entryCriteria', e.target.value)}
            placeholder="Conditions to start this step"
            style={inputStyle}
            onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--primary)'; }}
            onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--border)'; }}
          />
        </div>
        <div>
          <label style={labelStyle}>Exit Criteria</label>
          <input
            type="text"
            value={form.exitCriteria}
            onChange={e => set('exitCriteria', e.target.value)}
            placeholder="Conditions to complete this step"
            style={inputStyle}
            onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--primary)'; }}
            onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--border)'; }}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px', borderTop: '1px solid var(--border)' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            height: '32px', padding: '0 14px',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-button)',
            background: 'transparent', color: 'var(--foreground)',
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          style={{
            height: '32px', padding: '0 14px',
            border: 'none', borderRadius: 'var(--radius-button)',
            background: 'var(--primary)', color: 'var(--primary-foreground)',
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        >
          <Check size={13} /> Save Step
        </button>
      </div>
    </div>
  );
}

// ─── Sub-Process inline form panel ───────────────────────────────────────────

function SubProcessFormPanel({
  initial,
  onSave,
  onCancel,
  title,
}: {
  initial: SubProcessFormData;
  onSave: (data: SubProcessFormData) => void;
  onCancel: () => void;
  title: string;
}) {
  const [form, setForm] = useState<SubProcessFormData>(initial);
  const [nameError, setNameError] = useState('');

  function set(field: keyof SubProcessFormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'name' && value.trim()) setNameError('');
  }

  function handleSubmit() {
    if (!form.name.trim()) { setNameError('Name is required'); return; }
    onSave(form);
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '12px',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--foreground)',
    marginBottom: '4px',
    display: 'block',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '36px',
    padding: '0 12px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-input)',
    background: 'var(--card)',
    fontFamily: 'var(--font-family-primary)',
    fontSize: 'var(--text-base)',
    color: 'var(--foreground)',
    outline: 'none',
    boxSizing: 'border-box',
  };
  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    height: 'auto',
    padding: '8px 12px',
    resize: 'vertical',
    lineHeight: '20px',
  };

  return (
    <div
      style={{
        background: 'var(--muted)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Form header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitBranch size={15} style={{ color: 'var(--primary)' }} />
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
            }}
          >
            {title}
          </span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
            display: 'flex', alignItems: 'center', color: 'var(--muted-foreground)',
            borderRadius: 'var(--radius-input)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--foreground)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'; }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Fields — 2-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Name (full width) */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>
            Name <span style={{ color: 'var(--destructive)' }}>*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Sub-process name"
            style={{ ...inputStyle, borderColor: nameError ? 'var(--destructive)' : 'var(--border)' }}
            onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = nameError ? 'var(--destructive)' : 'var(--primary)'; }}
            onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = nameError ? 'var(--destructive)' : 'var(--border)'; }}
          />
          {nameError && (
            <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--destructive)', marginTop: '4px', display: 'block' }}>
              {nameError}
            </span>
          )}
        </div>

        {/* Description (full width) */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Description</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Brief description of this sub-process"
            style={textareaStyle}
            onFocus={e => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = 'var(--primary)'; }}
            onBlur={e => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = 'var(--border)'; }}
          />
        </div>

        {/* Objective (full width) */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Objective</label>
          <input
            type="text"
            value={form.objective}
            onChange={e => set('objective', e.target.value)}
            placeholder="What does this sub-process aim to achieve?"
            style={inputStyle}
            onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--primary)'; }}
            onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--border)'; }}
          />
        </div>

        {/* Boundary Start */}
        <div>
          <label style={labelStyle}>Boundary Start</label>
          <input
            type="text"
            value={form.boundaryStart}
            onChange={e => set('boundaryStart', e.target.value)}
            placeholder="Trigger / start event"
            style={inputStyle}
            onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--primary)'; }}
            onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--border)'; }}
          />
        </div>

        {/* Boundary End */}
        <div>
          <label style={labelStyle}>Boundary End</label>
          <input
            type="text"
            value={form.boundaryEnd}
            onChange={e => set('boundaryEnd', e.target.value)}
            placeholder="End state / output"
            style={inputStyle}
            onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--primary)'; }}
            onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--border)'; }}
          />
        </div>

        {/* Tags (full width) */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Tags</label>
          <input
            type="text"
            value={form.tagsRaw}
            onChange={e => set('tagsRaw', e.target.value)}
            placeholder="Comma-separated tags (e.g. onboarding, compliance)"
            style={inputStyle}
            onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--primary)'; }}
            onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--border)'; }}
          />
          <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '4px', display: 'block' }}>
            Separate tags with commas
          </span>
        </div>
      </div>

      {/* Actions — right-aligned per Appian guidelines */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px', borderTop: '1px solid var(--border)' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            height: '36px', padding: '0 16px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-button)',
            background: 'transparent',
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
          type="button"
          onClick={handleSubmit}
          style={{
            height: '36px', padding: '0 16px',
            border: 'none',
            borderRadius: 'var(--radius-button)',
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        >
          <Check size={14} /> Save Sub-Process
        </button>
      </div>
    </div>
  );
}

// ─── Reorder helper ───────────────────────────────────────────────────────────

function reorder<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// ─── Reorder button pair ──────────────────────────────────────────────────────
// Horizontal ▲ ▼ pair rendered inline next to item names.

function ReorderButtons({
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const btn = (disabled: boolean): React.CSSProperties => ({
    width: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-input)',
    background: 'transparent',
    cursor: disabled ? 'default' : 'pointer',
    padding: 0,
    flexShrink: 0,
    color: 'var(--muted-foreground)',
    fontFamily: 'var(--font-family-primary)',
    opacity: disabled ? 0.28 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
    transition: 'border-color 0.1s, color 0.1s',
  });

  const hover = (el: HTMLButtonElement) => {
    el.style.borderColor = 'var(--primary)';
    el.style.color = 'var(--primary)';
  };
  const unhover = (el: HTMLButtonElement) => {
    el.style.borderColor = 'var(--border)';
    el.style.color = 'var(--muted-foreground)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '2px', flexShrink: 0 }}>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onMoveUp(); }}
        title="Move up"
        disabled={isFirst}
        style={btn(isFirst)}
        onMouseEnter={e => { if (!isFirst) hover(e.currentTarget as HTMLButtonElement); }}
        onMouseLeave={e => unhover(e.currentTarget as HTMLButtonElement)}
      >
        <ChevronUp size={10} />
      </button>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onMoveDown(); }}
        title="Move down"
        disabled={isLast}
        style={btn(isLast)}
        onMouseEnter={e => { if (!isLast) hover(e.currentTarget as HTMLButtonElement); }}
        onMouseLeave={e => unhover(e.currentTarget as HTMLButtonElement)}
      >
        <ChevronDown size={10} />
      </button>
    </div>
  );
}

// ─── Sub-Processes Tab ───────────────────────────────────────────────────────

function SubProcessesTab({
  process,
  onUpdateProcess,
}: {
  process: Process;
  onUpdateProcess: (updated: Process) => void;
}) {
  const subs = process.subProcesses ?? [];
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null);

  function handleAddSub(data: SubProcessFormData) {
    const newSub: SubProcess = {
      id: `SUB-${generateId()}`,
      name: data.name.trim(),
      description: data.description.trim(),
      objective: data.objective.trim(),
      boundaryStart: data.boundaryStart.trim(),
      boundaryEnd: data.boundaryEnd.trim(),
      owner: null,
      tags: data.tagsRaw.split(',').map(t => t.trim()).filter(Boolean),
      steps: [],
    };
    onUpdateProcess({
      ...process,
      subProcesses: [...subs, newSub],
      updatedDate: new Date().toISOString(),
    });
    setShowAddForm(false);
  }

  function handleEditSub(subId: string, data: SubProcessFormData) {
    onUpdateProcess({
      ...process,
      subProcesses: subs.map(sp =>
        sp.id === subId
          ? {
              ...sp,
              name: data.name.trim(),
              description: data.description.trim(),
              objective: data.objective.trim(),
              boundaryStart: data.boundaryStart.trim(),
              boundaryEnd: data.boundaryEnd.trim(),
              tags: data.tagsRaw.split(',').map(t => t.trim()).filter(Boolean),
            }
          : sp
      ),
      updatedDate: new Date().toISOString(),
    });
    setEditingSubId(null);
  }

  function handleDeleteSub(subId: string) {
    onUpdateProcess({
      ...process,
      subProcesses: subs.filter(sp => sp.id !== subId),
      updatedDate: new Date().toISOString(),
    });
    setDeletingSubId(null);
  }

  const deletingSub = deletingSubId ? subs.find(sp => sp.id === deletingSubId) : null;

  function moveSubProcess(from: number, to: number) {
    onUpdateProcess({
      ...process,
      subProcesses: reorder(subs, from, to),
      updatedDate: new Date().toISOString(),
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
      {/* Toolbar */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          background: 'var(--card)',
          borderRadius: 'var(--radius-card) var(--radius-card) 0 0',
          border: '1px solid var(--border)',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitBranch size={16} style={{ color: 'var(--primary)' }} />
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
            }}
          >
            Sub-Processes
          </span>
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--muted-foreground)',
              background: 'var(--muted)',
              border: '1px solid var(--border)',
              borderRadius: '100px',
              padding: '1px 8px',
              lineHeight: '18px',
            }}
          >
            {subs.length}
          </span>
        </div>
        <button
          onClick={() => { setShowAddForm(o => !o); setEditingSubId(null); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            height: '32px', padding: '0 12px',
            border: 'none', borderRadius: 'var(--radius-button)',
            background: 'var(--primary)', color: 'var(--primary-foreground)',
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        >
          <Plus size={14} /> Add Sub-Process
        </button>
      </div>

      {/* Add form panel */}
      {showAddForm && (
        <div
          style={{
            borderLeft: '1px solid var(--border)',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            background: 'var(--muted)',
            padding: '16px',
          }}
        >
          <SubProcessFormPanel
            initial={EMPTY_FORM}
            title="Add Sub-Process"
            onSave={handleAddSub}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Empty state */}
      {subs.length === 0 && !showAddForm && (
        <div
          style={{
            background: 'var(--card)',
            borderLeft: '1px solid var(--border)',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            borderRadius: '0 0 var(--radius-card) var(--radius-card)',
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <GitBranch size={48} style={{ color: 'var(--muted-foreground)' }} />
          <h3
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '14px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: '0 0 4px 0',
            }}
          >
            No sub-processes defined
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--muted-foreground)',
              margin: 0,
            }}
          >
            Add sub-processes to break this process into manageable stages.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              marginTop: '8px',
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              height: '36px', padding: '0 16px',
              border: 'none', borderRadius: 'var(--radius-button)',
              background: 'var(--primary)', color: 'var(--primary-foreground)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            <Plus size={14} /> Add Sub-Process
          </button>
        </div>
      )}

      {/* Sub-process list */}
      {subs.length > 0 && (
        <div
          style={{
            background: 'var(--card)',
            borderLeft: '1px solid var(--border)',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            borderRadius: '0 0 var(--radius-card) var(--radius-card)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {subs.map((sp, idx) => (
            editingSubId === sp.id ? (
              <div key={sp.id}>
                <SubProcessFormPanel
                  initial={subToForm(sp)}
                  title={`Edit: ${sp.name}`}
                  onSave={(data) => handleEditSub(sp.id, data)}
                  onCancel={() => setEditingSubId(null)}
                />
              </div>
            ) : (
              <SubProcessDetailCard
                key={sp.id}
                sub={sp}
                index={idx}
                isFirst={idx === 0}
                isLast={idx === subs.length - 1}
                onMoveUp={() => moveSubProcess(idx, idx - 1)}
                onMoveDown={() => moveSubProcess(idx, idx + 1)}
                onEdit={() => { setEditingSubId(sp.id); setShowAddForm(false); }}
                onDelete={() => setDeletingSubId(sp.id)}
                onUpdateSub={(updated) => {
                  onUpdateProcess({
                    ...process,
                    subProcesses: subs.map(s => s.id === updated.id ? updated : s),
                    updatedDate: new Date().toISOString(),
                  });
                }}
              />
            )
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deletingSubId && deletingSub && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px', background: 'rgba(0,0,0,0.4)',
          }}
          onClick={e => { if (e.target === e.currentTarget) setDeletingSubId(null); }}
        >
          <div
            style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              boxShadow: '0px 8px 32px 0px rgba(0,0,0,0.18)',
              width: '100%', maxWidth: '420px',
              padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px',
            }}
          >
            <h3 style={{ fontFamily: 'var(--font-family-primary)', fontSize: '18px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0 }}>
              Delete Sub-Process
            </h3>
            <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)', margin: 0, lineHeight: '22px' }}>
              Are you sure you want to delete{' '}
              <strong style={{ color: 'var(--foreground)' }}>{deletingSub.name}</strong>?
              {deletingSub.steps.length > 0 && (
                <> This will also delete its {deletingSub.steps.length} step{deletingSub.steps.length !== 1 ? 's' : ''}.</>
              )}
            </p>
            <div
              style={{
                padding: '12px',
                background: 'rgba(192,57,43,0.06)',
                border: '1px solid rgba(192,57,43,0.2)',
                borderRadius: 'var(--radius-card)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px', fontWeight: 'var(--font-weight-regular)',
                color: 'var(--destructive)', lineHeight: '18px',
              }}
            >
              This action cannot be undone.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setDeletingSubId(null)}
                style={{
                  height: '36px', padding: '0 16px',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-button)',
                  background: 'transparent', color: 'var(--foreground)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSub(deletingSubId)}
                style={{
                  height: '36px', padding: '0 16px',
                  border: 'none', borderRadius: 'var(--radius-button)',
                  background: 'var(--destructive)', color: 'var(--destructive-foreground)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)',
                  cursor: 'pointer', transition: 'opacity 0.1s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dependencies Tab ────────────────────────────────────────────────────────

function DependenciesTab({ deps, navigate }: { deps: Process[]; navigate: (path: string) => void }) {
  if (deps.length === 0) {
    return (
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '48px 24px',
          textAlign: 'center',
        }}
      >
        <ArrowRight size={48} style={{ color: 'var(--muted-foreground)', marginBottom: '12px' }} />
        <h3
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '14px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--foreground)',
            margin: '0 0 4px 0',
          }}
        >
          No dependencies
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)',
            color: 'var(--muted-foreground)',
            margin: 0,
          }}
        >
          This process does not depend on any other processes.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ArrowRight size={16} style={{ color: 'var(--primary)' }} />
        <span
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--foreground)',
          }}
        >
          Depends On
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {deps.map(dep => (
          <div
            key={dep.id}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              cursor: 'pointer',
              transition: 'box-shadow 0.1s',
            }}
            onClick={() => navigate(`/processes/${dep.id}`)}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--elevation-sm)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <ArrowRight size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--primary)',
                }}
              >
                {dep.name}
              </span>
              <ProcessStatusBadge status={dep.status} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              {dep.businessDomain && (
                <span
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-regular)',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  {dep.businessDomain}
                </span>
              )}
              {dep.owner && (
                <span
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-regular)',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  {dep.owner.name}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Products Tab ────────────────────────────────────────────────────────────

function ProductsTab({ process }: { process: Process }) {
  const navigate = useNavigate();
  const allProducts = loadProducts();
  // Find products that reference this process (at process or sub-process level)
  const products = allProducts.filter(p =>
    p.processAssociations.some(a => a.processId === process.id)
  );

  if (products.length === 0) {
    return (
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '48px 24px',
          textAlign: 'center',
        }}
      >
        <Package size={48} style={{ color: 'var(--muted-foreground)', marginBottom: '12px' }} />
        <h3
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '14px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--foreground)',
            margin: '0 0 4px 0',
          }}
        >
          No benefits or services associated
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)',
            color: 'var(--muted-foreground)',
            margin: 0,
          }}
        >
          Benefits or services can be linked to this process from the Benefits or Services Register.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Package size={16} style={{ color: 'var(--primary)' }} />
        <span
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--foreground)',
          }}
        >
          Associated Benefits or Services
        </span>
        <span
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--muted-foreground)',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '100px',
            padding: '1px 8px',
            lineHeight: '18px',
          }}
        >
          {products.length}
        </span>
      </div>

      {products.map(product => {
        const TypeIcon = product.type === 'Benefit' ? Heart : Briefcase;
        const typeColor = product.type === 'Benefit' ? '#1C8A45' : '#00A3A3';
        const typeBg = product.type === 'Benefit' ? '#E8F5EE' : '#E0F5F5';
        return (
          <div
            key={product.id}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              cursor: 'pointer',
              transition: 'box-shadow 0.1s',
            }}
            onClick={() => navigate(`/products/${product.id}`)}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--elevation-sm)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <Package size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--primary)',
                }}
              >
                {product.name}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  height: '20px',
                  padding: '0 8px',
                  borderRadius: '100px',
                  background: typeBg,
                  color: typeColor,
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-semibold)',
                }}
              >
                <TypeIcon size={10} />
                {product.type}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--muted-foreground)',
                }}
              >
                {product.category}
              </span>
              <ArrowRight size={14} style={{ color: 'var(--muted-foreground)' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Vendors Tab ─────────────────────────────────────────────────────────────

function VendorsTab({ process }: { process: Process }) {
  const navigate = useNavigate();
  const { vendors, updateVendor } = useApp();
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [deletingVendorId, setDeletingVendorId] = useState<string | null>(null);

  const associatedVendors = vendors.filter(v =>
    (v.processAssociations ?? []).some(a => a.processId === process.id)
  );

  function handleAddVendor(vendorId: string) {
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return;
    const already = (vendor.processAssociations ?? []).some(a => a.processId === process.id);
    if (already) return;
    updateVendor(vendorId, {
      processAssociations: [...(vendor.processAssociations ?? []), { processId: process.id }],
    });
  }

  function handleRemoveVendor(vendorId: string) {
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return;
    updateVendor(vendorId, {
      processAssociations: (vendor.processAssociations ?? []).filter(a => a.processId !== process.id),
    });
    setDeletingVendorId(null);
  }

  const deletingVendor = deletingVendorId ? vendors.find(v => v.id === deletingVendorId) : null;
  const associatedIds = new Set(associatedVendors.map(v => v.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
      {/* Toolbar */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          background: 'var(--card)',
          borderRadius: 'var(--radius-card) var(--radius-card) 0 0',
          border: '1px solid var(--border)',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={16} style={{ color: 'var(--primary)' }} />
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
            }}
          >
            Associated Vendors
          </span>
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--muted-foreground)',
              background: 'var(--muted)',
              border: '1px solid var(--border)',
              borderRadius: '100px',
              padding: '1px 8px',
              lineHeight: '18px',
            }}
          >
            {associatedVendors.length}
          </span>
        </div>
        <button
          onClick={() => setShowAddPicker(o => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            height: '32px',
            padding: '0 12px',
            border: 'none',
            borderRadius: 'var(--radius-button)',
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        >
          <Plus size={14} /> Add Vendor
        </button>
      </div>

      {/* ─── Add Vendor Picker ─────────────────────────────── */}
      {showAddPicker && (
        <div
          style={{
            borderLeft: '1px solid var(--border)',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            background: 'var(--muted)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--muted-foreground)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '4px',
            }}
          >
            Select a Vendor to Associate
          </div>
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              background: 'var(--card)',
              maxHeight: '260px',
              overflowY: 'auto',
            }}
          >
            {vendors.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--muted-foreground)',
                }}
              >
                No vendors available. Create vendors in the Vendor Register first.
              </div>
            ) : (
              vendors.map(vendor => {
                const isLinked = associatedIds.has(vendor.id);
                const statusColor = vendor.status === 'Active' ? '#1C8A45' : vendor.status === 'Pending Review' ? '#E07B00' : '#6B7489';
                const statusBg = vendor.status === 'Active' ? '#E8F5EE' : vendor.status === 'Pending Review' ? '#FFF3E0' : '#F0F0F0';

                return (
                  <div
                    key={vendor.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <Building2 size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <span
                      style={{
                        flex: 1,
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--foreground)',
                      }}
                    >
                      {vendor.name}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '11px',
                        fontWeight: 'var(--font-weight-regular)',
                        color: 'var(--muted-foreground)',
                        flexShrink: 0,
                      }}
                    >
                      {vendor.category}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: '18px',
                        padding: '0 6px',
                        borderRadius: '100px',
                        background: statusBg,
                        color: statusColor,
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '11px',
                        fontWeight: 'var(--font-weight-semibold)',
                        flexShrink: 0,
                      }}
                    >
                      {vendor.status}
                    </span>
                    <button
                      type="button"
                      disabled={isLinked}
                      onClick={() => handleAddVendor(vendor.id)}
                      style={{
                        height: '24px',
                        padding: '0 10px',
                        border: `1px solid ${isLinked ? 'var(--border)' : 'var(--primary)'}`,
                        borderRadius: 'var(--radius-button)',
                        background: isLinked ? 'var(--muted)' : 'transparent',
                        color: isLinked ? 'var(--muted-foreground)' : 'var(--primary)',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '12px',
                        fontWeight: 'var(--font-weight-semibold)',
                        cursor: isLinked ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0,
                      }}
                    >
                      {isLinked ? 'Linked' : (<><Plus size={10} /> Add</>)}
                    </button>
                  </div>
                );
              })
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowAddPicker(false)}
              style={{
                height: '28px',
                padding: '0 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-button)',
                background: 'var(--card)',
                color: 'var(--foreground)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ─── Vendor Cards ─────────────────────────────── */}
      {associatedVendors.length === 0 && !showAddPicker ? (
        <div
          style={{
            background: 'var(--card)',
            borderLeft: '1px solid var(--border)',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            borderRadius: '0 0 var(--radius-card) var(--radius-card)',
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Building2 size={48} style={{ color: 'var(--muted-foreground)' }} />
          <h3
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '14px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: '0 0 4px 0',
            }}
          >
            No vendors associated
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--muted-foreground)',
              margin: 0,
            }}
          >
            Associate vendors with this process to track relationships.
          </p>
          <button
            onClick={() => setShowAddPicker(true)}
            style={{
              marginTop: '8px',
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
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            <Plus size={14} /> Add Vendor
          </button>
        </div>
      ) : associatedVendors.length > 0 ? (
        <div
          style={{
            background: 'var(--card)',
            borderLeft: '1px solid var(--border)',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            borderRadius: '0 0 var(--radius-card) var(--radius-card)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {associatedVendors.map(vendor => {
            const statusColor = vendor.status === 'Active' ? '#1C8A45' : vendor.status === 'Pending Review' ? '#E07B00' : '#6B7489';
            const statusBg = vendor.status === 'Active' ? '#E8F5EE' : vendor.status === 'Pending Review' ? '#FFF3E0' : '#F0F0F0';
            return (
              <div
                key={vendor.id}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-card)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  transition: 'box-shadow 0.1s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--elevation-sm)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1, cursor: 'pointer' }}
                  onClick={() => navigate(`/vendors/${vendor.id}`)}
                >
                  <Building2 size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <span
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--primary)',
                    }}
                  >
                    {vendor.name}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      height: '20px',
                      padding: '0 8px',
                      borderRadius: '100px',
                      background: statusBg,
                      color: statusColor,
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-semibold)',
                    }}
                  >
                    {vendor.status}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-regular)',
                      color: 'var(--muted-foreground)',
                    }}
                  >
                    {vendor.category}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingVendorId(vendor.id);
                    }}
                    title="Remove vendor association"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--muted-foreground)',
                      borderRadius: 'var(--radius-input)',
                      transition: 'color 0.1s, background 0.1s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--destructive)';
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(192,57,43,0.06)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)';
                      (e.currentTarget as HTMLButtonElement).style.background = 'none';
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                  <ArrowRight
                    size={14}
                    style={{ color: 'var(--muted-foreground)', cursor: 'pointer' }}
                    onClick={() => navigate(`/vendors/${vendor.id}`)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* ─── Delete Confirmation Dialog ─────────────────── */}
      {deletingVendorId && deletingVendor && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: 'rgba(0,0,0,0.4)',
          }}
          onClick={e => { if (e.target === e.currentTarget) setDeletingVendorId(null); }}
        >
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              boxShadow: '0px 8px 32px 0px rgba(0,0,0,0.18)',
              width: '100%',
              maxWidth: '420px',
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
              Remove Vendor Association
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--muted-foreground)',
                margin: 0,
                lineHeight: '22px',
              }}
            >
              Are you sure you want to remove the association with{' '}
              <strong style={{ color: 'var(--foreground)' }}>{deletingVendor.name}</strong>?
            </p>
            <div
              style={{
                padding: '12px',
                background: 'rgba(192,57,43,0.06)',
                border: '1px solid rgba(192,57,43,0.2)',
                borderRadius: 'var(--radius-card)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--destructive)',
                lineHeight: '18px',
              }}
            >
              This will unlink the vendor from this process. The vendor record itself will not be deleted.
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px',
              }}
            >
              <button
                onClick={() => setDeletingVendorId(null)}
                style={{
                  height: '36px',
                  padding: '0 16px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-button)',
                  background: 'transparent',
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
                onClick={() => handleRemoveVendor(deletingVendorId)}
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
                  transition: 'opacity 0.1s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-Process Detail Card ─────────────────────────────────────────────────

function SubProcessDetailCard({
  sub,
  index,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  onUpdateSub,
}: {
  sub: SubProcess;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateSub: (updated: SubProcess) => void;
}) {
  const [stepsOpen, setStepsOpen] = useState(false);
  const [showAddStepForm, setShowAddStepForm] = useState(false);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [deletingStepId, setDeletingStepId] = useState<string | null>(null);
  const steps = sub.steps ?? [];

  function handleAddStep(data: StepFormData) {
    const newStep: Step = {
      id: `STEP-${generateId()}`,
      type: data.type,
      description: data.description.trim(),
      responsibleRole: data.responsibleRole.trim(),
      systemTool: data.systemTool.trim(),
      input: data.input.trim(),
      output: data.output.trim(),
      entryCriteria: data.entryCriteria.trim(),
      exitCriteria: data.exitCriteria.trim(),
      sortOrder: steps.length + 1,
      linkedStepIds: [],
    };
    onUpdateSub({ ...sub, steps: [...steps, newStep] });
    setShowAddStepForm(false);
  }

  function handleEditStep(stepId: string, data: StepFormData) {
    onUpdateSub({
      ...sub,
      steps: steps.map(s =>
        s.id === stepId
          ? {
              ...s,
              type: data.type,
              description: data.description.trim(),
              responsibleRole: data.responsibleRole.trim(),
              systemTool: data.systemTool.trim(),
              input: data.input.trim(),
              output: data.output.trim(),
              entryCriteria: data.entryCriteria.trim(),
              exitCriteria: data.exitCriteria.trim(),
            }
          : s
      ),
    });
    setEditingStepId(null);
  }

  function handleDeleteStep(stepId: string) {
    onUpdateSub({
      ...sub,
      steps: steps
        .filter(s => s.id !== stepId)
        .map((s, i) => ({ ...s, sortOrder: i + 1 })),
    });
    setDeletingStepId(null);
  }

  const deletingStep = deletingStepId ? steps.find(s => s.id === deletingStepId) : null;

  function moveStep(from: number, to: number) {
    onUpdateSub({
      ...sub,
      steps: reorder(steps, from, to).map((s, i) => ({ ...s, sortOrder: i + 1 })),
    });
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
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '16px',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-card)',
            background: 'var(--muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--muted-foreground)',
            flexShrink: 0,
            marginTop: '1px',
          }}
        >
          {index + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '2px',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
              }}
            >
              {sub.name}
            </span>
            <ReorderButtons
              isFirst={isFirst}
              isLast={isLast}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
            />
            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '11px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--muted-foreground)',
              }}
            >
              {sub.id}
            </span>
          </div>

          {sub.description && (
            <p
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--muted-foreground)',
                margin: '2px 0 0 0',
                lineHeight: '18px',
              }}
            >
              {sub.description}
            </p>
          )}

          {/* Sub-process metadata row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '8px',
              flexWrap: 'wrap',
            }}
          >
            {sub.owner && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '8px',
                    fontWeight: 'var(--font-weight-semibold)',
                    flexShrink: 0,
                  }}
                >
                  {sub.owner.initials}
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-regular)',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  {sub.owner.name}
                </span>
              </div>
            )}

            {sub.objective && (
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--muted-foreground)',
                  fontStyle: 'italic',
                  maxWidth: '300px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={sub.objective}
              >
                Obj: {sub.objective}
              </span>
            )}

            {(sub.boundaryStart || sub.boundaryEnd) && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--muted-foreground)',
                }}
              >
                <Clock size={10} />
                {sub.boundaryStart || '?'} → {sub.boundaryEnd || '?'}
              </span>
            )}

            {sub.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                {sub.tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                      background: 'rgba(35,34,240,0.06)',
                      color: 'var(--primary)',
                      borderRadius: '100px',
                      padding: '1px 6px',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '10px',
                      fontWeight: 'var(--font-weight-semibold)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Steps toggle — always shown */}
          <button
            onClick={() => {
              setStepsOpen(o => !o);
              if (!stepsOpen) setShowAddStepForm(false);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0 0 0',
              marginTop: '6px',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--primary)',
            }}
          >
            {stepsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <ListOrdered size={12} />
            {steps.length > 0
              ? `${steps.length} Step${steps.length !== 1 ? 's' : ''}`
              : 'Steps'}
          </button>
        </div>

        {/* Action buttons — top-right of card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={onEdit}
            title="Edit sub-process"
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              height: '28px', padding: '0 10px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-button)',
              background: 'transparent',
              color: 'var(--muted-foreground)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px', fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)';
            }}
          >
            <Edit2 size={11} /> Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Delete sub-process"
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              height: '28px', padding: '0 10px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-button)',
              background: 'transparent',
              color: 'var(--muted-foreground)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px', fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--destructive)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--destructive)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)';
            }}
          >
            <Trash2 size={11} /> Delete
          </button>
        </div>
      </div>

      {/* Steps panel */}
      {stepsOpen && (
        <div
          style={{
            borderTop: '1px solid var(--border)',
            background: 'var(--muted)',
          }}
        >
          {/* Steps sub-toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 16px',
              borderBottom: steps.length > 0 || showAddStepForm ? '1px solid var(--border)' : 'none',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--muted-foreground)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Steps
              {steps.length > 0 && (
                <span
                  style={{
                    marginLeft: '6px',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '100px',
                    padding: '0 6px',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  {steps.length}
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => { setShowAddStepForm(o => !o); setEditingStepId(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                height: '26px', padding: '0 10px',
                border: 'none', borderRadius: 'var(--radius-button)',
                background: 'var(--primary)', color: 'var(--primary-foreground)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px', fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
            >
              <Plus size={11} /> Add Step
            </button>
          </div>

          {/* Add step form */}
          {showAddStepForm && (
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <StepFormPanel
                initial={EMPTY_STEP_FORM}
                title="Add Step"
                onSave={handleAddStep}
                onCancel={() => setShowAddStepForm(false)}
              />
            </div>
          )}

          {/* Steps list */}
          {steps.length === 0 && !showAddStepForm && (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ListOrdered size={32} style={{ color: 'var(--muted-foreground)' }} />
              <p
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--muted-foreground)',
                  margin: 0,
                }}
              >
                No steps yet. Add the first step above.
              </p>
            </div>
          )}

          {steps.length > 0 && (
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {steps.map((step, sIdx) => (
                editingStepId === step.id ? (
                  <div key={step.id}>
                    <StepFormPanel
                      initial={stepToForm(step)}
                      title={`Edit Step ${sIdx + 1}`}
                      onSave={(data) => handleEditStep(step.id, data)}
                      onCancel={() => setEditingStepId(null)}
                    />
                  </div>
                ) : (
                  <StepDetailRow
                    key={step.id}
                    step={step}
                    index={sIdx}
                    isFirst={sIdx === 0}
                    isLast={sIdx === steps.length - 1}
                    onMoveUp={() => moveStep(sIdx, sIdx - 1)}
                    onMoveDown={() => moveStep(sIdx, sIdx + 1)}
                    onEdit={() => { setEditingStepId(step.id); setShowAddStepForm(false); }}
                    onDelete={() => setDeletingStepId(step.id)}
                  />
                )
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step delete confirmation */}
      {deletingStepId && deletingStep && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px', background: 'rgba(0,0,0,0.4)',
          }}
          onClick={e => { if (e.target === e.currentTarget) setDeletingStepId(null); }}
        >
          <div
            style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              boxShadow: '0px 8px 32px 0px rgba(0,0,0,0.18)',
              width: '100%', maxWidth: '420px',
              padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px',
            }}
          >
            <h3 style={{ fontFamily: 'var(--font-family-primary)', fontSize: '18px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0 }}>
              Delete Step
            </h3>
            <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)', margin: 0, lineHeight: '22px' }}>
              Are you sure you want to delete step:{' '}
              <strong style={{ color: 'var(--foreground)' }}>&ldquo;{deletingStep.description}&rdquo;</strong>?
            </p>
            <div
              style={{
                padding: '12px',
                background: 'rgba(192,57,43,0.06)',
                border: '1px solid rgba(192,57,43,0.2)',
                borderRadius: 'var(--radius-card)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px', fontWeight: 'var(--font-weight-regular)',
                color: 'var(--destructive)', lineHeight: '18px',
              }}
            >
              This action cannot be undone. Remaining steps will be renumbered.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setDeletingStepId(null)}
                style={{
                  height: '36px', padding: '0 16px',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-button)',
                  background: 'transparent', color: 'var(--foreground)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteStep(deletingStepId)}
                style={{
                  height: '36px', padding: '0 16px',
                  border: 'none', borderRadius: 'var(--radius-button)',
                  background: 'var(--destructive)', color: 'var(--destructive-foreground)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)',
                  cursor: 'pointer', transition: 'opacity 0.1s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
              >
                Delete Step
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step Detail Row ─────────────────────────────────────────────────────────

function StepDetailRow({
  step,
  index,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: {
  step: Step;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = !!(step.input || step.output || step.entryCriteria || step.exitCriteria || step.systemTool || step.responsibleRole);

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
      }}
    >
      {/* Summary row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 10px',
        }}
      >
        {/* Expand toggle — only clickable area for expanding */}
        <button
          type="button"
          onClick={() => setExpanded(o => !o)}
          disabled={!hasDetails}
          style={{
            background: 'none', border: 'none', cursor: hasDetails ? 'pointer' : 'default',
            padding: 0, display: 'flex', alignItems: 'center',
            color: 'var(--muted-foreground)', flexShrink: 0,
          }}
        >
          {expanded
            ? <ChevronDown size={10} style={{ color: 'var(--muted-foreground)' }} />
            : <ChevronRight size={10} style={{ color: hasDetails ? 'var(--muted-foreground)' : 'transparent' }} />
          }
        </button>

        {/* Step number */}
        <span
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '11px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--muted-foreground)',
            flexShrink: 0,
          }}
        >
          {index + 1}.
        </span>

        {/* Reorder arrows */}
        <ReorderButtons
          isFirst={isFirst}
          isLast={isLast}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />

        {/* Type badge */}
        <StepTypeBadge type={step.type} />

        {/* Description */}
        <span
          style={{
            flex: 1,
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-regular)',
            color: 'var(--foreground)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            cursor: hasDetails ? 'pointer' : 'default',
          }}
          onClick={() => hasDetails && setExpanded(o => !o)}
        >
          {step.description}
        </span>

        {/* Metadata pills */}
        {step.responsibleRole && (
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '10px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--muted-foreground)',
              background: 'var(--muted)',
              borderRadius: '100px',
              padding: '1px 6px',
              flexShrink: 0,
            }}
          >
            {step.responsibleRole}
          </span>
        )}
        {step.systemTool && (
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '10px',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--muted-foreground)',
              flexShrink: 0,
            }}
          >
            {step.systemTool}
          </span>
        )}

        {/* Edit / Delete action buttons */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0, marginLeft: '4px' }}
          onClick={e => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onEdit}
            title="Edit step"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '3px 5px', display: 'flex', alignItems: 'center',
              color: 'var(--muted-foreground)', borderRadius: 'var(--radius-input)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)';
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(35,34,240,0.06)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)';
              (e.currentTarget as HTMLButtonElement).style.background = 'none';
            }}
          >
            <Edit2 size={11} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Delete step"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '3px 5px', display: 'flex', alignItems: 'center',
              color: 'var(--muted-foreground)', borderRadius: 'var(--radius-input)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--destructive)';
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(192,57,43,0.06)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)';
              (e.currentTarget as HTMLButtonElement).style.background = 'none';
            }}
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Expanded detail grid */}
      {expanded && hasDetails && (
        <div
          style={{
            borderTop: '1px solid var(--border)',
            padding: '8px 10px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            background: 'var(--muted)',
          }}
        >
          {step.input && <StepMeta label="Input" value={step.input} />}
          {step.output && <StepMeta label="Output" value={step.output} />}
          {step.entryCriteria && <StepMeta label="Entry Criteria" value={step.entryCriteria} />}
          {step.exitCriteria && <StepMeta label="Exit Criteria" value={step.exitCriteria} />}
          {step.systemTool && <StepMeta label="System / Tool" value={step.systemTool} />}
          {step.responsibleRole && <StepMeta label="Responsible Role" value={step.responsibleRole} />}
        </div>
      )}
    </div>
  );
}

// ─── Helper components ───────────────────────────────────────────────────────

function StepMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '10px',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--muted-foreground)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: '2px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '12px',
          fontWeight: 'var(--font-weight-regular)',
          color: 'var(--foreground)',
          lineHeight: '16px',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MetadataChip({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: 'var(--muted)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '10px',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--muted-foreground)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '12px',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--foreground)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ReadOnlyCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '12px 16px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '11px',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--muted-foreground)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: '4px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-regular)',
          color: 'var(--foreground)',
          lineHeight: '20px',
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ─── Delete Confirmation Dialog ──────────────────────────────────────────────

function DeleteConfirmDialog({
  processName,
  subProcessCount,
  onConfirm,
  onCancel,
}: {
  processName: string;
  subProcessCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'rgba(0,0,0,0.4)',
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: '0px 8px 32px 0px rgba(0,0,0,0.18)',
          width: '100%',
          maxWidth: '420px',
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
          Delete Process
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)',
            color: 'var(--muted-foreground)',
            margin: 0,
            lineHeight: '22px',
          }}
        >
          Are you sure you want to delete &quot;<strong style={{ color: 'var(--foreground)' }}>{processName}</strong>&quot;
          {subProcessCount > 0 && (
            <> and its {subProcessCount} sub-process{subProcessCount !== 1 ? 'es' : ''} (including all steps)</>
          )}
          ? This action cannot be undone.
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          <button
            onClick={onCancel}
            style={{
              height: '36px',
              padding: '0 16px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-button)',
              background: 'transparent',
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
            onClick={onConfirm}
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
              transition: 'opacity 0.1s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '0.85';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '1';
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}