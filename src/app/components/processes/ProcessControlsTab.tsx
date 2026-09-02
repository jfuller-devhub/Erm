import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  ShieldCheck, ShieldAlert, Star, Search, X, Check,
  Link2Off, Plus, GitBranch, Zap, Eye, RefreshCw,
  ArrowLeft, PlusCircle,
} from 'lucide-react';
import { KPITile } from '../shared/KPITile';
import { Field, TextInput, TextareaInput, SelectInput } from '../shared/FormModal';
import { UserPickerInput } from '../shared/UserPicker';
import { useApp } from '../../context/AppContext';
import type { Process, SubProcess } from '../../data/processData';
import type {
  Control, ControlType, ControlFrequency,
  ControlEffectiveness, ControlStatus,
} from '../../data/controlData';
import {
  loadControls, saveControls,
  CONTROL_STATUS_LABELS, CONTROL_TYPE_LABELS, CONTROL_EFFECTIVENESS_LABELS,
  CONTROL_FREQUENCY_LABELS, CONTROL_STATUS_STYLES, CONTROL_TYPE_STYLES,
  CONTROL_EFFECTIVENESS_STYLES,
} from '../../data/controlData';
import type { ProcessControlLink, PCTestingFrequency } from '../../data/processControlData';
import {
  loadProcessControlLinks, saveProcessControlLinks,
  getControlLinksForProcess, PC_TESTING_FREQUENCIES,
} from '../../data/processControlData';
import { generateId, MOCK_USERS } from '../../data/mockData';

// ─── Shared style constants ───────────────────────────────────────────────────

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  height: '36px', padding: '0 16px', border: 'none',
  borderRadius: 'var(--radius-button)',
  background: 'var(--primary)', color: 'var(--primary-foreground)',
  fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer', flexShrink: 0,
};

const secondaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  height: '36px', padding: '0 16px',
  border: '1px solid var(--primary)', borderRadius: 'var(--radius-button)',
  background: 'transparent', color: 'var(--primary)',
  fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer', flexShrink: 0,
};

const dangerBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  height: '36px', padding: '0 16px', border: 'none',
  borderRadius: 'var(--radius-button)',
  background: 'var(--destructive)', color: '#fff',
  fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer', flexShrink: 0,
};

const ghostBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  height: '28px', padding: '0 10px', border: 'none',
  borderRadius: 'var(--radius-button)',
  background: 'transparent', color: 'var(--muted-foreground)',
  fontFamily: 'var(--font-family-primary)', fontSize: '12px',
  fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer', flexShrink: 0,
};

const smallSecBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  height: '28px', padding: '0 12px',
  border: '1px solid var(--primary)', borderRadius: 'var(--radius-button)',
  background: 'transparent', color: 'var(--primary)',
  fontFamily: 'var(--font-family-primary)', fontSize: '12px',
  fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer', flexShrink: 0,
};

const colHdr: React.CSSProperties = {
  padding: '0 16px', height: '40px', textAlign: 'left',
  fontFamily: 'var(--font-family-primary)', fontSize: '12px',
  fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
  whiteSpace: 'nowrap', background: 'var(--muted)',
};

// ─── Badge helpers ────────────────────────────────────────────────────────────

function CtrlStatusBadge({ status }: { status: ControlStatus }) {
  const s = CONTROL_STATUS_STYLES[status] ?? { background: '#F0F0F0', color: '#6B7489' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', height: '20px',
      padding: '0 8px', borderRadius: '100px',
      background: s.background, color: s.color,
      fontFamily: 'var(--font-family-primary)', fontSize: '12px',
      fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap',
    }}>
      {CONTROL_STATUS_LABELS[status]}
    </span>
  );
}

function CtrlTypeBadge({ type }: { type: ControlType }) {
  const s = CONTROL_TYPE_STYLES[type] ?? { background: '#F0F0F0', color: '#6B7489' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', height: '20px',
      padding: '0 8px', borderRadius: '100px',
      background: s.background, color: s.color,
      fontFamily: 'var(--font-family-primary)', fontSize: '12px',
      fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap',
    }}>
      {CONTROL_TYPE_LABELS[type]}
    </span>
  );
}

// ─── New Control form (inline, used inside the modal) ────────────────────────

type NewControlForm = Omit<Control, 'id' | 'createdAt' | 'updatedAt'>;
type FormErrors = Partial<Record<string, string>>;

const EMPTY_CTRL: NewControlForm = {
  owner: null,
  department: '',
  name: '',
  description: '',
  controlType: 'preventive',
  frequency: 'quarterly',
  effectiveness: 'not_tested',
  isAutomated: false,
  lastTestedDate: '',
  nextTestDate: '',
  status: 'in_design',
  frameworkRef: '',
};

interface NewControlFormViewProps {
  /** Called with the persisted Control when the form is submitted */
  onCreated: (ctrl: Control) => void;
  onBack: () => void;
}

function NewControlFormView({ onCreated, onBack }: NewControlFormViewProps) {
  const [form, setForm] = useState<NewControlForm>({ ...EMPTY_CTRL });
  const [errors, setErrors] = useState<FormErrors>({});

  const set = <K extends keyof NewControlForm>(k: K, v: NewControlForm[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.name.trim())    e.name       = 'Control name is required.';
    if (!form.department)     e.department = 'Department is required.';
    if (!form.controlType)    e.controlType = 'Control type is required.';
    if (!form.frequency)      e.frequency  = 'Frequency is required.';
    if (!form.status)         e.status     = 'Status is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const today = new Date().toISOString().split('T')[0];
    const newCtrl: Control = {
      ...form,
      id: 'CTL-' + generateId(),
      createdAt: today,
      updatedAt: today,
    };
    // Persist to shared control register
    const all = loadControls();
    saveControls([...all, newCtrl]);
    onCreated(newCtrl);
  }

  // shared input style
  const inp: React.CSSProperties = {
    width: '100%', height: '36px', padding: '0 10px',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-input)',
    background: 'var(--input-background)', color: 'var(--foreground)',
    fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-weight-regular)', outline: 'none', boxSizing: 'border-box',
  };

  const errInp: React.CSSProperties = { ...inp, borderColor: 'var(--destructive)' };

  const errMsg = (msg?: string) => msg ? (
    <span style={{
      fontFamily: 'var(--font-family-primary)', fontSize: '12px',
      fontWeight: 'var(--font-weight-regular)', color: 'var(--destructive)',
      lineHeight: '18px',
    }}>{msg}</span>
  ) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* ── Contextual breadcrumb / back bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 24px', borderBottom: '1px solid var(--border)',
        background: 'var(--muted)', flexShrink: 0,
      }}>
        <button
          type="button"
          onClick={onBack}
          style={ghostBtn}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'; }}
        >
          <ArrowLeft size={12} />
          Back to search
        </button>
        <span style={{
          fontFamily: 'var(--font-family-primary)', fontSize: '12px',
          fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
        }}>
          /
        </span>
        <span style={{
          fontFamily: 'var(--font-family-primary)', fontSize: '12px',
          fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
        }}>
          Create New Control
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          marginLeft: '4px', padding: '2px 8px', borderRadius: '100px',
          background: 'rgba(35,34,240,0.08)',
          fontFamily: 'var(--font-family-primary)', fontSize: '11px',
          fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)',
        }}>
          <PlusCircle size={10} />
          New
        </span>
      </div>

      {/* ── Form body ── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px 24px',
        display: 'flex', flexDirection: 'column', gap: '14px',
      }}>

        {/* Name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', lineHeight: '16px',
          }}>
            Control Name <span style={{ color: 'var(--destructive)' }}>*</span>
          </span>
          <input
            type="text"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Mandatory Security Awareness Training"
            style={errors.name ? errInp : inp}
            onFocus={e => { if (!errors.name) (e.target as HTMLInputElement).style.borderColor = 'var(--primary)'; }}
            onBlur={e => { if (!errors.name) (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }}
          />
          {errMsg(errors.name)}
        </div>

        {/* Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', lineHeight: '16px',
          }}>
            Description
          </span>
          <textarea
            value={form.description}
            rows={2}
            onChange={e => set('description', e.target.value)}
            placeholder="Describe the control activity and how it operates…"
            style={{
              ...inp, height: 'auto', padding: '8px 10px',
              resize: 'vertical', lineHeight: '22px',
            }}
            onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--primary)'; }}
            onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)'; }}
          />
          <span style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
            fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
          }}>
            Detailed description of the control activity and how it operates.
          </span>
        </div>

        {/* Type & Frequency */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', lineHeight: '16px',
            }}>
              Control Type <span style={{ color: 'var(--destructive)' }}>*</span>
            </span>
            <select
              value={form.controlType}
              onChange={e => set('controlType', e.target.value as ControlType)}
              style={errors.controlType ? { ...errInp, cursor: 'pointer' } : { ...inp, cursor: 'pointer' }}
            >
              {controlTypes.map(t => (
                <option key={t} value={t}>{CONTROL_TYPE_LABELS[t as ControlType] ?? t}</option>
              ))}
            </select>
            {errMsg(errors.controlType)}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', lineHeight: '16px',
            }}>
              Frequency <span style={{ color: 'var(--destructive)' }}>*</span>
            </span>
            <select
              value={form.frequency}
              onChange={e => set('frequency', e.target.value as ControlFrequency)}
              style={errors.frequency ? { ...errInp, cursor: 'pointer' } : { ...inp, cursor: 'pointer' }}
            >
              {controlFreqs.map(f => (
                <option key={f} value={f}>{CONTROL_FREQUENCY_LABELS[f as ControlFrequency] ?? f}</option>
              ))}
            </select>
            {errMsg(errors.frequency)}
          </div>
        </div>

        {/* Status & Effectiveness */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', lineHeight: '16px',
            }}>
              Status <span style={{ color: 'var(--destructive)' }}>*</span>
            </span>
            <select
              value={form.status}
              onChange={e => set('status', e.target.value as ControlStatus)}
              style={errors.status ? { ...errInp, cursor: 'pointer' } : { ...inp, cursor: 'pointer' }}
            >
              {controlStatuses.map(s => (
                <option key={s} value={s}>{CONTROL_STATUS_LABELS[s as ControlStatus] ?? s}</option>
              ))}
            </select>
            {errMsg(errors.status)}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', lineHeight: '16px',
            }}>
              Effectiveness
            </span>
            <select
              value={form.effectiveness}
              onChange={e => set('effectiveness', e.target.value as ControlEffectiveness)}
              style={{ ...inp, cursor: 'pointer' }}
            >
              {controlEffects.map(ef => (
                <option key={ef} value={ef}>{CONTROL_EFFECTIVENESS_LABELS[ef as ControlEffectiveness] ?? ef}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Department & Owner */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', lineHeight: '16px',
            }}>
              Department <span style={{ color: 'var(--destructive)' }}>*</span>
            </span>
            <select
              value={form.department}
              onChange={e => set('department', e.target.value)}
              style={errors.department ? { ...errInp, cursor: 'pointer' } : { ...inp, cursor: 'pointer' }}
            >
              <option value="">Select department…</option>
              {deptOptions.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {errMsg(errors.department)}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', lineHeight: '16px',
            }}>
              Owner
            </span>
            <UserPickerInput
              value={form.owner}
              onChange={u => set('owner', u)}
            />
          </div>
        </div>

        {/* Automated — radio (2-option per Appian guidelines) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', lineHeight: '16px',
          }}>
            Automated?
          </span>
          <div style={{ display: 'flex', gap: '16px', paddingTop: '2px', flexWrap: 'wrap' }}>
            {[
              { value: true,  label: 'Yes — Runs without manual intervention' },
              { value: false, label: 'No — Manual execution required' },
            ].map(opt => (
              <label
                key={String(opt.value)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-regular)', color: 'var(--foreground)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="new-ctrl-automated"
                  checked={form.isAutomated === opt.value}
                  onChange={() => set('isAutomated', opt.value)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* Framework Reference */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', lineHeight: '16px',
          }}>
            Framework Reference
          </span>
          <input
            type="text"
            value={form.frameworkRef}
            onChange={e => set('frameworkRef', e.target.value)}
            placeholder="e.g. ISO27001-A.9.2.1, SOC2-CC6.1, NIST-DE.CM-4"
            style={inp}
            onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--primary)'; }}
            onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }}
          />
          <span style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
            fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
          }}>
            e.g. ISO27001-A.9.2.1, SOC2-CC6.1, NIST-DE.CM-4
          </span>
        </div>

        {/* Last Tested & Next Test */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', lineHeight: '16px',
            }}>
              Last Tested Date
            </span>
            <input
              type="date"
              value={form.lastTestedDate}
              onChange={e => set('lastTestedDate', e.target.value)}
              style={inp}
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--primary)'; }}
              onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', lineHeight: '16px',
            }}>
              Next Test Date
            </span>
            <input
              type="date"
              value={form.nextTestDate}
              onChange={e => set('nextTestDate', e.target.value)}
              style={inp}
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--primary)'; }}
              onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }}
            />
          </div>
        </div>
      </div>

      {/* ── Form footer ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px', borderTop: '1px solid var(--border)', flexShrink: 0,
        background: 'var(--card)',
      }}>
        <span style={{
          fontFamily: 'var(--font-family-primary)', fontSize: '12px',
          fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
        }}>
          The new control will be saved to the Control Register and linked to this process.
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={onBack}
            style={secondaryBtn}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(35,34,240,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={primaryBtn}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            <ShieldCheck size={14} />
            Create & Link Control
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Link Control Modal ───────────────────────────────────────────────────────

type ModalView = 'browse' | 'create';

interface LinkControlModalProps {
  process: Process;
  linkedControlIds: Set<string>;
  controls: Control[];
  onLink: (link: Omit<ProcessControlLink, 'id' | 'linkedAt' | 'linkedBy'>) => void;
  onControlCreated: (ctrl: Control) => void;
  onClose: () => void;
}

function LinkControlModal({
  process, linkedControlIds, controls, onLink, onControlCreated, onClose,
}: LinkControlModalProps) {
  const [view, setView] = useState<ModalView>('browse');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ControlType | ''>('');
  const [statusFilter, setStatusFilter] = useState<ControlStatus | ''>('');
  const [selectedControlId, setSelectedControlId] = useState<string | null>(null);
  const [subProcessId, setSubProcessId] = useState('');
  const [controlObjective, setControlObjective] = useState('');
  const [isKeyControl, setIsKeyControl] = useState(false);
  const [testingFrequency, setTestingFrequency] = useState<PCTestingFrequency>('Quarterly');

  const subProcesses: SubProcess[] = process.subProcesses ?? [];

  const available = useMemo(() => {
    const q = search.toLowerCase().trim();
    return controls.filter(c => {
      if (linkedControlIds.has(c.id)) return false;
      if (typeFilter && c.controlType !== typeFilter) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      if (q && !c.name.toLowerCase().includes(q) && !c.id.toLowerCase().includes(q)
        && !c.department.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [controls, linkedControlIds, search, typeFilter, statusFilter]);

  function handleSelectControl(cid: string) {
    setSelectedControlId(prev => prev === cid ? null : cid);
  }

  function handleSubmit() {
    if (!selectedControlId) return;
    onLink({
      processId: process.id,
      subProcessId: subProcessId || null,
      controlId: selectedControlId,
      controlObjective,
      isKeyControl,
      testingFrequency,
    });
  }

  function handleControlCreated(ctrl: Control) {
    onControlCreated(ctrl);
    // Auto-select and switch back to browse with linkage details visible
    setSelectedControlId(ctrl.id);
    setView('browse');
  }

  const selectedControl = controls.find(c => c.id === selectedControlId);
  const noResults = available.length === 0;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', background: 'rgba(0,0,0,0.4)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', boxShadow: '0px 8px 32px rgba(0,0,0,0.18)',
        width: '100%', maxWidth: '760px',
        maxHeight: 'calc(100vh - 48px)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* ── Persistent modal header ── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '16px 24px', borderBottom: view === 'create' ? 'none' : '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '18px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0,
            }}>
              {view === 'create' ? 'Create New Control' : 'Link Control to Process'}
            </h2>
            <p style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
              margin: '2px 0 0 0',
            }}>
              {view === 'create'
                ? `New control will be added to the Control Register and linked to "${process.name}".`
                : `Add a direct process-level control for "${process.name}".`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', border: 'none',
              borderRadius: 'var(--radius-input)', background: 'transparent',
              color: 'var(--muted-foreground)', cursor: 'pointer', flexShrink: 0, marginLeft: '12px',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--muted)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── View: Create ── */}
        {view === 'create' && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <NewControlFormView
              onCreated={handleControlCreated}
              onBack={() => setView('browse')}
            />
          </div>
        )}

        {/* ── View: Browse ── */}
        {view === 'browse' && (
          <>
            <div style={{
              flex: 1, overflowY: 'auto',
              display: 'flex', flexDirection: 'column', gap: '16px',
              padding: '20px 24px',
            }}>
              {/* Filter bar + Create button */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
                  <Search size={14} style={{
                    position: 'absolute', left: '10px', top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--muted-foreground)', pointerEvents: 'none',
                  }} />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, ID, or department…"
                    style={{
                      width: '100%', height: '36px',
                      paddingLeft: '32px', paddingRight: search ? '32px' : '12px',
                      border: '1px solid var(--border)', borderRadius: 'var(--radius-input)',
                      background: 'var(--input-background)', color: 'var(--foreground)',
                      fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-regular)', outline: 'none', boxSizing: 'border-box',
                    }}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--primary)'; }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }}
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      style={{
                        position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                        color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center',
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Type filter */}
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value as ControlType | '')}
                  style={{
                    height: '36px', padding: '0 10px',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-input)',
                    background: 'var(--input-background)', color: 'var(--foreground)',
                    fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-regular)', cursor: 'pointer', minWidth: '140px',
                  }}
                >
                  <option value="">All Types</option>
                  {controlTypes.map(t => (
                    <option key={t} value={t}>{CONTROL_TYPE_LABELS[t as ControlType] ?? t}</option>
                  ))}
                </select>

                {/* Status filter */}
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as ControlStatus | '')}
                  style={{
                    height: '36px', padding: '0 10px',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-input)',
                    background: 'var(--input-background)', color: 'var(--foreground)',
                    fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-regular)', cursor: 'pointer', minWidth: '130px',
                  }}
                >
                  <option value="">All Statuses</option>
                  {controlStatuses.map(s => (
                    <option key={s} value={s}>{CONTROL_STATUS_LABELS[s as ControlStatus] ?? s}</option>
                  ))}
                </select>

                {/* Create new */}
                <button
                  type="button"
                  onClick={() => setView('create')}
                  style={{
                    ...primaryBtn,
                    height: '36px', gap: '6px', whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                >
                  <PlusCircle size={14} />
                  Create New
                </button>
              </div>

              {/* Controls list */}
              <div style={{
                border: '1px solid var(--border)', borderRadius: 'var(--radius-card)',
                overflow: 'hidden',
              }}>
                {noResults ? (
                  /* Empty state — suggests creating a new control */
                  <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <ShieldCheck size={32} style={{ color: 'var(--muted-foreground)' }} />
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-family-primary)', fontSize: '14px',
                      fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                      marginBottom: '4px',
                    }}>
                      {search || typeFilter || statusFilter
                        ? 'No controls match your filters'
                        : 'All available controls are already linked'}
                    </div>
                    <p style={{
                      fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
                      margin: '0 auto 16px', maxWidth: '340px', lineHeight: '22px',
                    }}>
                      {search
                        ? `No results for "${search}". Create a new control and link it directly to this process.`
                        : 'Create a new control and it will be added to the Control Register and linked here.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setView('create')}
                      style={primaryBtn}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                    >
                      <PlusCircle size={14} /> Create New Control
                    </button>
                  </div>
                ) : (
                  <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                    {available.map((ctrl, idx) => {
                      const isSelected = selectedControlId === ctrl.id;
                      const isEven = idx % 2 === 0;
                      const typeStyle = CONTROL_TYPE_STYLES[ctrl.controlType];
                      const statusStyle = CONTROL_STATUS_STYLES[ctrl.status];

                      return (
                        <div
                          key={ctrl.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleSelectControl(ctrl.id)}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleSelectControl(ctrl.id); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '10px 14px', cursor: 'pointer',
                            background: isSelected ? 'rgba(35,34,240,0.06)' : isEven ? 'var(--card)' : 'var(--muted)',
                            borderBottom: idx < available.length - 1 ? '1px solid var(--border)' : 'none',
                            borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                            outline: 'none', transition: 'background 0.1s',
                          }}
                        >
                          <div style={{
                            width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                            border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                            background: isSelected ? 'var(--primary)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.1s',
                          }}>
                            {isSelected && <Check size={10} style={{ color: 'var(--primary-foreground)' }} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{
                                fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                                fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
                              }}>
                                {ctrl.id}
                              </span>
                              <span style={{
                                fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                                fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>
                                {ctrl.name}
                              </span>
                            </div>
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              marginTop: '3px', flexWrap: 'wrap',
                            }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', height: '18px',
                                padding: '0 6px', borderRadius: '100px',
                                background: typeStyle.background, color: typeStyle.color,
                                fontFamily: 'var(--font-family-primary)', fontSize: '11px',
                                fontWeight: 'var(--font-weight-semibold)',
                              }}>
                                {CONTROL_TYPE_LABELS[ctrl.controlType]}
                              </span>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', height: '18px',
                                padding: '0 6px', borderRadius: '100px',
                                background: statusStyle.background, color: statusStyle.color,
                                fontFamily: 'var(--font-family-primary)', fontSize: '11px',
                                fontWeight: 'var(--font-weight-semibold)',
                              }}>
                                {CONTROL_STATUS_LABELS[ctrl.status]}
                              </span>
                              {ctrl.isAutomated && (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '3px',
                                  fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                                  fontWeight: 'var(--font-weight-regular)', color: '#00A3A3',
                                }}>
                                  <Zap size={10} /> Automated
                                </span>
                              )}
                              <span style={{
                                fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                                fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
                              }}>
                                {ctrl.department}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Linkage details — only visible when a control is selected */}
              {selectedControlId && selectedControl && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                      fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
                      textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                    }}>
                      Linkage Details
                    </span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                    <span style={{
                      fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                      fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                      whiteSpace: 'nowrap',
                    }}>
                      {selectedControl.name}
                    </span>
                  </div>

                  {subProcesses.length > 0 && (
                    <Field
                      label="Sub-Process Scope"
                      helpText="Narrow to a specific sub-process, or leave blank for process-level coverage."
                    >
                      <SelectInput
                        value={subProcessId}
                        onChange={e => setSubProcessId(e.target.value)}
                      >
                        <option value="">Process-level (all sub-processes)</option>
                        {subProcesses.map(sp => (
                          <option key={sp.id} value={sp.id}>{sp.name}</option>
                        ))}
                      </SelectInput>
                    </Field>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{
                        fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                        fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', lineHeight: '16px',
                      }}>
                        Key Control
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsKeyControl(p => !p)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '8px',
                          height: '36px', padding: '0 12px',
                          border: `1px solid ${isKeyControl ? '#E07B00' : 'var(--border)'}`,
                          borderRadius: 'var(--radius-input)',
                          background: isKeyControl ? 'rgba(224,123,0,0.08)' : 'var(--input-background)',
                          color: isKeyControl ? '#E07B00' : 'var(--muted-foreground)',
                          fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                          fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        <Star size={14} style={{ fill: isKeyControl ? '#E07B00' : 'none', color: isKeyControl ? '#E07B00' : 'var(--muted-foreground)' }} />
                        {isKeyControl ? 'Key Control' : 'Mark as Key Control'}
                      </button>
                      <span style={{
                        fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                        fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
                      }}>
                        Flag for SOX / SOC 2 audit scope
                      </span>
                    </div>

                    <Field
                      label="Testing Frequency"
                      helpText="How often this control is tested in this process."
                    >
                      <SelectInput
                        value={testingFrequency}
                        onChange={e => setTestingFrequency(e.target.value as PCTestingFrequency)}
                      >
                        {PC_TESTING_FREQUENCIES.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </SelectInput>
                    </Field>
                  </div>

                  <Field
                    label="Control Objective"
                    helpText="Describe what this control addresses within this process."
                  >
                    <TextareaInput
                      value={controlObjective}
                      rows={2}
                      placeholder="e.g. Prevent unauthorised access to vendor data during the onboarding intake step…"
                      onChange={e => setControlObjective(e.target.value)}
                    />
                  </Field>
                </div>
              )}
            </div>

            {/* Browse footer */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 24px', borderTop: '1px solid var(--border)', flexShrink: 0,
            }}>
              {/* Hint */}
              <span style={{
                fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
              }}>
                {!noResults && (
                  <>Can't find what you need?{' '}
                    <button
                      type="button"
                      onClick={() => setView('create')}
                      style={{
                        background: 'none', border: 'none', padding: 0,
                        fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                        fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)',
                        cursor: 'pointer', textDecoration: 'underline',
                      }}
                    >
                      Create a new control
                    </button>
                  </>
                )}
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={secondaryBtn}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(35,34,240,0.06)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedControlId}
                  onClick={handleSubmit}
                  style={{
                    ...primaryBtn,
                    opacity: selectedControlId ? 1 : 0.45,
                    cursor: selectedControlId ? 'pointer' : 'default',
                  }}
                  onMouseEnter={e => { if (selectedControlId) (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
                  onMouseLeave={e => { if (selectedControlId) (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                >
                  <ShieldCheck size={14} /> Link Control
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Unlink confirmation ──────────────────────────────────────────────────────

function UnlinkConfirmDialog({
  controlName, isKeyControl, onConfirm, onCancel,
}: { controlName: string; isKeyControl: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', background: 'rgba(0,0,0,0.4)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', boxShadow: '0px 8px 32px rgba(0,0,0,0.18)',
        width: '100%', maxWidth: '460px', padding: '24px',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}>
        <h3 style={{
          fontFamily: 'var(--font-family-primary)', fontSize: '18px',
          fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0,
        }}>
          Unlink Control
        </h3>
        <p style={{
          fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
          margin: 0, lineHeight: '22px',
        }}>
          Remove <strong style={{ color: 'var(--foreground)' }}>{controlName}</strong> from this
          process? The control record will remain unchanged — only this process-level link will be removed.
        </p>
        {isKeyControl && (
          <div style={{
            padding: '12px', borderRadius: 'var(--radius-card)',
            background: 'rgba(224,123,0,0.08)', border: '1px solid rgba(224,123,0,0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Star size={14} style={{ color: '#E07B00', fill: '#E07B00', flexShrink: 0 }} />
              <span style={{
                fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)', color: '#E07B00',
              }}>
                This is a Key Control
              </span>
            </div>
            <p style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              fontWeight: 'var(--font-weight-regular)', color: '#E07B00',
              margin: '4px 0 0 0', lineHeight: '18px',
            }}>
              Unlinking a key control may affect SOX / SOC 2 audit coverage. Confirm with your compliance team.
            </p>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={secondaryBtn}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(35,34,240,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={dangerBtn}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            <Link2Off size={14} /> Unlink Control
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main tab component ───────────────────────────────────────────────────────

interface ProcessControlsTabProps {
  process: Process;
  navigate: (path: string) => void;
  onCountChange: (n: number) => void;
}

export function ProcessControlsTab({ process, navigate, onCountChange }: ProcessControlsTabProps) {
  const { getActiveOptions } = useApp();
  const controlTypes    = getActiveOptions('Control', 'Type');
  const controlFreqs    = getActiveOptions('Control', 'Frequency');
  const controlStatuses = getActiveOptions('Control', 'Status');
  const controlEffects  = getActiveOptions('Control', 'Effectiveness');
  const deptOptions     = getActiveOptions('Control', 'Department');

  const [controls, setControls] = useState<Control[]>(() => loadControls());
  const [links, setLinks] = useState<ProcessControlLink[]>(() =>
    getControlLinksForProcess(loadProcessControlLinks(), process.id)
  );
  const [linkOpen, setLinkOpen] = useState(false);
  const [unlinkId, setUnlinkId] = useState<string | null>(null);

  const persist = useCallback((updatedLinks: ProcessControlLink[]) => {
    const all = loadProcessControlLinks();
    const others = all.filter(l => l.processId !== process.id);
    saveProcessControlLinks([...others, ...updatedLinks]);
    setLinks(updatedLinks);
    onCountChange(updatedLinks.length);
  }, [process.id, onCountChange]);

  const linkedControlIds = useMemo(() => new Set(links.map(l => l.controlId)), [links]);
  const controlMap = useMemo(() => {
    const m = new Map<string, Control>();
    controls.forEach(c => m.set(c.id, c));
    return m;
  }, [controls]);

  const unlinkLink = unlinkId ? links.find(l => l.id === unlinkId) : null;
  const unlinkControl = unlinkLink ? controlMap.get(unlinkLink.controlId) : null;

  function handleLink(partial: Omit<ProcessControlLink, 'id' | 'linkedAt' | 'linkedBy'>) {
    const now = new Date().toISOString().split('T')[0];
    const newLink: ProcessControlLink = {
      ...partial,
      id: 'PCL-' + generateId(),
      linkedAt: now,
      linkedBy: MOCK_USERS[0].name,
    };
    persist([...links, newLink]);
    setLinkOpen(false);
  }

  function handleControlCreated(ctrl: Control) {
    // Refresh the full controls list so the new control appears immediately
    setControls(loadControls());
  }

  function handleUnlink() {
    if (!unlinkId) return;
    persist(links.filter(l => l.id !== unlinkId));
    setUnlinkId(null);
  }

  // KPI derivations
  const keyControlCount = links.filter(l => l.isKeyControl).length;
  const preventiveCount = links.filter(l => controlMap.get(l.controlId)?.controlType === 'preventive').length;
  const detectiveCount  = links.filter(l => controlMap.get(l.controlId)?.controlType === 'detective').length;
  const activeCount     = links.filter(l => controlMap.get(l.controlId)?.status === 'active').length;

  return (
    <>
      {/* KPI tiles */}
      {links.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px', marginBottom: '4px',
        }}>
          <KPITile label="Total Controls"  value={links.length}   icon={ShieldCheck} />
          <KPITile label="Key Controls"    value={keyControlCount} icon={Star}        iconColor="#E07B00" />
          <KPITile label="Preventive"      value={preventiveCount} icon={ShieldAlert}  iconColor="var(--primary)" />
          <KPITile label="Detective"       value={detectiveCount}  icon={Eye}          iconColor="#00A3A3" />
          <KPITile label="Active"          value={activeCount}     icon={RefreshCw}    iconColor="#1C8A45" />
        </div>
      )}

      {/* Main card */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', overflow: 'hidden',
      }}>
        {/* Section header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '14px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
              margin: 0, lineHeight: '20px',
            }}>
              Process Controls
            </h3>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: '20px', height: '20px', padding: '0 6px', borderRadius: '100px',
              background: 'rgba(35,34,240,0.08)',
              fontFamily: 'var(--font-family-primary)', fontSize: '11px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)',
            }}>
              {links.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLinkOpen(true)}
            style={smallSecBtn}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(35,34,240,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <Plus size={12} /> Link Control
          </button>
        </div>

        {/* Empty state */}
        {links.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ marginBottom: '8px' }}>
              <ShieldCheck size={32} style={{ color: 'var(--muted-foreground)' }} />
            </div>
            <div style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '14px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
              marginBottom: '4px', lineHeight: '20px',
            }}>
              No controls linked to this process
            </div>
            <div style={{
              fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
              margin: '0 auto 16px', maxWidth: '380px', lineHeight: '22px',
            }}>
              Link existing controls or create new ones directly from here to build a Process Control Matrix and track audit coverage.
            </div>
            <button
              type="button"
              onClick={() => setLinkOpen(true)}
              style={primaryBtn}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
            >
              Link Control
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '780px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Control', 'Type', 'Status', 'Effectiveness', 'Scope', 'Testing', 'Key', ''].map(h => (
                    <th key={h} style={colHdr}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {links.map((link, idx) => {
                  const ctrl = controlMap.get(link.controlId);
                  if (!ctrl) return null;
                  const subProcess = link.subProcessId
                    ? process.subProcesses?.find(sp => sp.id === link.subProcessId)
                    : null;
                  const effStyle = CONTROL_EFFECTIVENESS_STYLES[ctrl.effectiveness];
                  const isEven = idx % 2 === 0;

                  return (
                    <tr
                      key={link.id}
                      style={{
                        background: isEven ? 'var(--card)' : 'var(--muted)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <td style={{ padding: '10px 16px', verticalAlign: 'middle' }}>
                        <button
                          type="button"
                          onClick={() => navigate(`/controls/${ctrl.id}`)}
                          style={{
                            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                            fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                            fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                            textAlign: 'left', lineHeight: '20px', display: 'block',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--foreground)'; }}
                        >
                          {ctrl.name}
                        </button>
                        <div style={{
                          fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                          fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
                          marginTop: '2px', lineHeight: '18px',
                        }}>
                          {ctrl.id}
                          {ctrl.isAutomated && (
                            <span style={{ marginLeft: '6px', display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#00A3A3' }}>
                              <Zap size={10} /> Auto
                            </span>
                          )}
                          {link.controlObjective && (
                            <span style={{ marginLeft: '6px', fontStyle: 'italic' }}>
                              · {link.controlObjective.length > 55 ? link.controlObjective.slice(0, 55) + '…' : link.controlObjective}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px', verticalAlign: 'middle' }}>
                        <CtrlTypeBadge type={ctrl.controlType} />
                      </td>
                      <td style={{ padding: '10px 16px', verticalAlign: 'middle' }}>
                        <CtrlStatusBadge status={ctrl.status} />
                      </td>
                      <td style={{ padding: '10px 16px', verticalAlign: 'middle' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', height: '20px',
                          padding: '0 8px', borderRadius: '100px',
                          background: effStyle.background, color: effStyle.color,
                          fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                          fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap',
                        }}>
                          {CONTROL_EFFECTIVENESS_LABELS[ctrl.effectiveness]}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', verticalAlign: 'middle' }}>
                        {subProcess ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                            fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                          }}>
                            <GitBranch size={11} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                            {subProcess.name}
                          </span>
                        ) : (
                          <span style={{
                            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                            fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
                            fontStyle: 'italic',
                          }}>
                            Process-level
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 16px', verticalAlign: 'middle' }}>
                        <span style={{
                          fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                          fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
                          whiteSpace: 'nowrap',
                        }}>
                          {link.testingFrequency}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                        {link.isKeyControl && (
                          <Star size={14} style={{ color: '#E07B00', fill: '#E07B00' }} />
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <button
                          type="button"
                          title="Unlink control"
                          onClick={() => setUnlinkId(link.id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '28px', height: '28px',
                            border: '1px solid var(--border)', borderRadius: 'var(--radius-input)',
                            background: 'transparent', cursor: 'pointer',
                            color: 'var(--muted-foreground)', transition: 'border-color 0.1s, color 0.1s',
                          }}
                          onMouseEnter={e => {
                            const b = e.currentTarget as HTMLButtonElement;
                            b.style.borderColor = 'var(--destructive)';
                            b.style.color = 'var(--destructive)';
                          }}
                          onMouseLeave={e => {
                            const b = e.currentTarget as HTMLButtonElement;
                            b.style.borderColor = 'var(--border)';
                            b.style.color = 'var(--muted-foreground)';
                          }}
                        >
                          <Link2Off size={12} />
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

      {/* Link / Create modal */}
      {linkOpen && (
        <LinkControlModal
          process={process}
          linkedControlIds={linkedControlIds}
          controls={controls}
          onLink={handleLink}
          onControlCreated={handleControlCreated}
          onClose={() => setLinkOpen(false)}
        />
      )}

      {/* Unlink confirmation */}
      {unlinkId && unlinkControl && (
        <UnlinkConfirmDialog
          controlName={unlinkControl.name}
          isKeyControl={unlinkLink?.isKeyControl ?? false}
          onConfirm={handleUnlink}
          onCancel={() => setUnlinkId(null)}
        />
      )}
    </>
  );
}
