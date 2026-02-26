import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  GitBranch, Activity, Plus, X, Check, Search,
  Link2Off, Link2, Star, User, Building2,
} from 'lucide-react';
import { UserAvatar } from '../shared/UserPicker';
import { Field, TextareaInput, SelectInput } from '../shared/FormModal';
import type { Process, ProcessStatus, SubProcess } from '../../data/processData';
import type { ProcessControlLink, PCTestingFrequency } from '../../data/processControlData';
import { PC_TESTING_FREQUENCIES } from '../../data/processControlData';
import { generateId, MOCK_USERS } from '../../data/mockData';

// ─── Process status badge ─────────────────────────────────────────────────────

const PROC_STATUS_STYLES: Record<ProcessStatus, { bg: string; fg: string }> = {
  Active:  { bg: '#E8F5EE', fg: '#1C8A45' },
  Draft:   { bg: '#FFF3E0', fg: '#E07B00' },
  Retired: { bg: '#F0F0F0', fg: '#6B7489' },
};

function ProcessStatusBadge({ status }: { status: ProcessStatus }) {
  const s = PROC_STATUS_STYLES[status] ?? { bg: '#F0F2F7', fg: '#6B7489' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      height: '20px', padding: '0 8px', borderRadius: '100px',
      background: s.bg, color: s.fg,
      fontFamily: 'var(--font-family-primary)', fontSize: '12px',
      fontWeight: 'var(--font-weight-semibold)', lineHeight: '16px', whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}

// ─── Shared button styles ─────────────────────────────────────────────────────

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

const cell: React.CSSProperties = {
  padding: '10px 16px', verticalAlign: 'middle',
};

// ─── Link-to-Process modal ────────────────────────────────────────────────────

interface LinkProcessModalProps {
  controlId: string;
  linkedProcessIds: Set<string>;
  processes: Process[];
  onLink: (link: Omit<ProcessControlLink, 'id' | 'linkedAt' | 'linkedBy'>) => void;
  onClose: () => void;
}

function LinkProcessModal({
  controlId, linkedProcessIds, processes, onLink, onClose,
}: LinkProcessModalProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProcessStatus | ''>('');
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [subProcessId, setSubProcessId] = useState('');
  const [controlObjective, setControlObjective] = useState('');
  const [isKeyControl, setIsKeyControl] = useState(false);
  const [testingFrequency, setTestingFrequency] = useState<PCTestingFrequency>('Quarterly');

  const available = useMemo(() => {
    const q = search.toLowerCase().trim();
    return processes.filter(p => {
      if (linkedProcessIds.has(p.id)) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q)
        && !p.businessDomain.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [processes, linkedProcessIds, search, statusFilter]);

  const selectedProcess = processes.find(p => p.id === selectedProcessId);
  const subProcesses: SubProcess[] = selectedProcess?.subProcesses ?? [];

  function handleSelectProcess(pid: string) {
    setSelectedProcessId(prev => prev === pid ? null : pid);
    setSubProcessId('');
  }

  function handleSubmit() {
    if (!selectedProcessId) return;
    onLink({
      processId: selectedProcessId,
      subProcessId: subProcessId || null,
      controlId,
      controlObjective,
      isKeyControl,
      testingFrequency,
    });
  }

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
        width: '100%', maxWidth: '720px',
        maxHeight: 'calc(100vh - 48px)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '16px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '18px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0,
            }}>
              Link Control to Process
            </h2>
            <p style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
              margin: '2px 0 0 0',
            }}>
              Add a direct process-level association for this control.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', border: 'none',
              borderRadius: 'var(--radius-input)', background: 'transparent',
              color: 'var(--muted-foreground)', cursor: 'pointer', flexShrink: 0,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--muted)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: '16px',
          padding: '20px 24px',
        }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
              <Search size={14} style={{
                position: 'absolute', left: '10px', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--muted-foreground)', pointerEvents: 'none',
              }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, ID, or domain…"
                style={{
                  width: '100%', height: '36px', paddingLeft: '32px', paddingRight: '12px',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-input)',
                  background: 'var(--input-background)', color: 'var(--foreground)',
                  fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-regular)', outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--primary)'; }}
                onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as ProcessStatus | '')}
              style={{
                height: '36px', padding: '0 10px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-input)',
                background: 'var(--input-background)', color: 'var(--foreground)',
                fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-regular)', cursor: 'pointer', minWidth: '140px',
              }}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Retired">Retired</option>
            </select>
          </div>

          {/* Process list */}
          <div style={{
            border: '1px solid var(--border)', borderRadius: 'var(--radius-card)',
            overflow: 'hidden', maxHeight: '260px', overflowY: 'auto',
          }}>
            {available.length === 0 ? (
              <div style={{
                padding: '32px 16px', textAlign: 'center',
                fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
              }}>
                {search || statusFilter
                  ? 'No processes match your filters.'
                  : 'This control is already linked to all available processes.'}
              </div>
            ) : (
              available.map((proc, idx) => {
                const isSelected = selectedProcessId === proc.id;
                const isEven = idx % 2 === 0;
                return (
                  <div
                    key={proc.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectProcess(proc.id)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleSelectProcess(proc.id); }}
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
                          {proc.id}
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                          fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {proc.name}
                        </span>
                      </div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap',
                      }}>
                        <ProcessStatusBadge status={proc.status} />
                        {proc.businessDomain && (
                          <span style={{
                            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                            fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
                          }}>
                            {proc.businessDomain}
                          </span>
                        )}
                        {proc.owner && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '3px',
                            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                            fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
                          }}>
                            <User size={10} />
                            {proc.owner.name}
                          </span>
                        )}
                        {proc.subProcesses.length > 0 && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '3px',
                            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                            fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
                          }}>
                            <GitBranch size={10} />
                            {proc.subProcesses.length} sub-process{proc.subProcesses.length !== 1 ? 'es' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Linkage details — appear when process is selected */}
          {selectedProcessId && selectedProcess && (
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
                {/* Key control toggle */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{
                    fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                    fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', lineHeight: '16px',
                  }}>
                    Key Control
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsKeyControl(prev => !prev)}
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
                    <Star
                      size={14}
                      style={{ fill: isKeyControl ? '#E07B00' : 'none', color: isKeyControl ? '#E07B00' : 'var(--muted-foreground)' }}
                    />
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
                helpText="Why does this control exist in this process? What activity or risk does it address?"
              >
                <TextareaInput
                  value={controlObjective}
                  rows={2}
                  placeholder="e.g. Ensure all vendor contracts are reviewed by Legal before system provisioning…"
                  onChange={e => setControlObjective(e.target.value)}
                />
              </Field>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px',
          padding: '16px 24px', borderTop: '1px solid var(--border)', flexShrink: 0,
        }}>
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
            disabled={!selectedProcessId}
            onClick={handleSubmit}
            style={{
              ...primaryBtn,
              opacity: selectedProcessId ? 1 : 0.45,
              cursor: selectedProcessId ? 'pointer' : 'default',
            }}
            onMouseEnter={e => { if (selectedProcessId) (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { if (selectedProcessId) (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            <Link2 size={14} /> Link Process
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Unlink confirmation ──────────────────────────────────────────────────────

function UnlinkConfirmDialog({
  processName,
  isKeyControl,
  onConfirm,
  onCancel,
}: { processName: string; isKeyControl: boolean; onConfirm: () => void; onCancel: () => void }) {
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
          Unlink Process
        </h3>
        <p style={{
          fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
          margin: 0, lineHeight: '22px',
        }}>
          Remove the association between this control and{' '}
          <strong style={{ color: 'var(--foreground)' }}>{processName}</strong>?
          Only this direct link will be removed — the process and control records remain unchanged.
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
                This is flagged as a Key Control
              </span>
            </div>
            <p style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              fontWeight: 'var(--font-weight-regular)', color: '#E07B00',
              margin: '4px 0 0 0', lineHeight: '18px',
            }}>
              Removing a key control link may affect SOX / SOC 2 coverage. Confirm with your compliance team.
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
            <Link2Off size={14} /> Unlink Process
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Summary chip ─────────────────────────────────────────────────────────────

function SummaryChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{
        fontFamily: 'var(--font-family-primary)', fontSize: '12px',
        fontWeight: 'var(--font-weight-semibold)', color,
      }}>
        {value}
      </span>
      <span style={{
        fontFamily: 'var(--font-family-primary)', fontSize: '12px',
        fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
      }}>
        {label}
      </span>
    </div>
  );
}

// ─── Main section component ───────────────────────────────────────────────────

interface ControlProcessesSectionProps {
  controlId: string;
  processLinks: ProcessControlLink[];
  processes: Process[];
  onLinksChange: (updated: ProcessControlLink[]) => void;
}

export function ControlProcessesSection({
  controlId, processLinks, processes, onLinksChange,
}: ControlProcessesSectionProps) {
  const navigate = useNavigate();
  const [linkOpen, setLinkOpen] = useState(false);
  const [unlinkId, setUnlinkId] = useState<string | null>(null);

  // Links for this control only
  const ctrlLinks = useMemo(
    () => processLinks.filter(l => l.controlId === controlId),
    [processLinks, controlId],
  );

  const linkedProcessIds = useMemo(
    () => new Set(ctrlLinks.map(l => l.processId)),
    [ctrlLinks],
  );

  const processMap = useMemo(() => {
    const m = new Map<string, Process>();
    processes.forEach(p => m.set(p.id, p));
    return m;
  }, [processes]);

  const unlinkLink = unlinkId ? ctrlLinks.find(l => l.id === unlinkId) : null;
  const unlinkProcess = unlinkLink ? processMap.get(unlinkLink.processId) : null;

  function handleLink(partial: Omit<ProcessControlLink, 'id' | 'linkedAt' | 'linkedBy'>) {
    const now = new Date().toISOString().split('T')[0];
    const newLink: ProcessControlLink = {
      ...partial,
      id: 'PCL-' + generateId(),
      linkedAt: now,
      linkedBy: MOCK_USERS[0].name,
    };
    onLinksChange([...processLinks, newLink]);
    setLinkOpen(false);
  }

  function handleUnlink() {
    if (!unlinkId) return;
    onLinksChange(processLinks.filter(l => l.id !== unlinkId));
    setUnlinkId(null);
  }

  const keyCount    = ctrlLinks.filter(l => l.isKeyControl).length;
  const activeCount = ctrlLinks.filter(l => processMap.get(l.processId)?.status === 'Active').length;
  const subCount    = ctrlLinks.filter(l => !!l.subProcessId).length;

  return (
    <>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', overflow: 'hidden',
      }}>
        {/* Header */}
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
              Associated Processes
            </h3>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: '20px', height: '20px', padding: '0 6px', borderRadius: '100px',
              background: 'rgba(35,34,240,0.08)',
              fontFamily: 'var(--font-family-primary)', fontSize: '11px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)',
            }}>
              {ctrlLinks.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLinkOpen(true)}
            style={smallSecBtn}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(35,34,240,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <Plus size={12} /> Link to Process
          </button>
        </div>

        {/* Summary strip */}
        {ctrlLinks.length > 0 && (
          <div style={{
            display: 'flex', gap: '12px', padding: '10px 24px',
            borderBottom: '1px solid var(--border)', flexWrap: 'wrap',
          }}>
            <SummaryChip label="Total" value={ctrlLinks.length} color="var(--primary)" />
            {activeCount > 0 && <SummaryChip label="Active Processes" value={activeCount} color="#1C8A45" />}
            {keyCount > 0 && <SummaryChip label="Key Control Links" value={keyCount} color="#E07B00" />}
            {subCount > 0 && <SummaryChip label="Sub-Process Level" value={subCount} color="#00A3A3" />}
          </div>
        )}

        {/* Empty state */}
        {ctrlLinks.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ marginBottom: '8px' }}>
              <Activity size={32} style={{ color: 'var(--muted-foreground)' }} />
            </div>
            <div style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '14px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
              marginBottom: '4px', lineHeight: '20px',
            }}>
              No processes linked
            </div>
            <div style={{
              fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
              margin: '0 auto 16px', maxWidth: '360px', lineHeight: '22px',
            }}>
              Link this control directly to the processes where it operates to build a Process Control Matrix, independent of risk mappings.
            </div>
            <button
              type="button"
              onClick={() => setLinkOpen(true)}
              style={primaryBtn}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
            >
              Link to Process
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Process', 'Domain', 'Sub-Process Scope', 'Status', 'Owner', 'Testing', 'Key', ''].map(h => (
                    <th key={h} style={colHdr}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ctrlLinks.map((link, idx) => {
                  const proc = processMap.get(link.processId);
                  if (!proc) return null;
                  const subProcess = link.subProcessId
                    ? proc.subProcesses?.find(sp => sp.id === link.subProcessId)
                    : null;
                  const isEven = idx % 2 === 0;

                  return (
                    <tr
                      key={link.id}
                      style={{
                        background: isEven ? 'var(--card)' : 'var(--muted)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {/* Process name */}
                      <td style={cell}>
                        <button
                          type="button"
                          onClick={() => navigate(`/processes/${proc.id}`)}
                          style={{
                            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                            fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                            fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                            textAlign: 'left', lineHeight: '20px', display: 'block',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--foreground)'; }}
                        >
                          {proc.name}
                        </button>
                        <div style={{
                          fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                          fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
                          marginTop: '2px',
                        }}>
                          {proc.id}
                          {link.controlObjective && (
                            <span style={{ marginLeft: '6px', fontStyle: 'italic' }}>
                              · {link.controlObjective.length > 55
                                  ? link.controlObjective.slice(0, 55) + '…'
                                  : link.controlObjective}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Domain */}
                      <td style={cell}>
                        {proc.businessDomain ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                            fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
                          }}>
                            <Building2 size={12} style={{ flexShrink: 0 }} />
                            {proc.businessDomain}
                          </span>
                        ) : (
                          <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>—</span>
                        )}
                      </td>

                      {/* Sub-process scope */}
                      <td style={cell}>
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

                      {/* Status */}
                      <td style={cell}>
                        <ProcessStatusBadge status={proc.status} />
                      </td>

                      {/* Owner */}
                      <td style={cell}>
                        {proc.owner ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <UserAvatar user={proc.owner} size={22} />
                            <span style={{
                              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                              fontWeight: 'var(--font-weight-regular)', color: 'var(--foreground)',
                              whiteSpace: 'nowrap',
                            }}>
                              {proc.owner.name}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>—</span>
                        )}
                      </td>

                      {/* Testing frequency */}
                      <td style={cell}>
                        <span style={{
                          fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                          fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
                          whiteSpace: 'nowrap',
                        }}>
                          {link.testingFrequency}
                        </span>
                      </td>

                      {/* Key control */}
                      <td style={{ ...cell, textAlign: 'center' }}>
                        {link.isKeyControl && (
                          <Star size={14} style={{ color: '#E07B00', fill: '#E07B00' }} />
                        )}
                      </td>

                      {/* Unlink */}
                      <td style={{ ...cell, textAlign: 'right', paddingRight: '12px' }}>
                        <button
                          type="button"
                          title="Unlink process"
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

      {/* Link modal */}
      {linkOpen && (
        <LinkProcessModal
          controlId={controlId}
          linkedProcessIds={linkedProcessIds}
          processes={processes}
          onLink={handleLink}
          onClose={() => setLinkOpen(false)}
        />
      )}

      {/* Unlink confirmation */}
      {unlinkId && unlinkProcess && (
        <UnlinkConfirmDialog
          processName={unlinkProcess.name}
          isKeyControl={unlinkLink?.isKeyControl ?? false}
          onConfirm={handleUnlink}
          onCancel={() => setUnlinkId(null)}
        />
      )}
    </>
  );
}
