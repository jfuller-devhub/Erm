import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus, GitBranch, Search, X, Check, Link2, Link2Off,
  User, Building2,
} from 'lucide-react';
import { UserAvatar } from '../shared/UserPicker';
import { Field, TextareaInput, SelectInput } from '../shared/FormModal';
import type { Process, ProcessStatus, SubProcess } from '../../data/processData';
import type { ProcessRiskLink } from '../../data/processRiskData';
import { generateId } from '../../data/mockData';

// ─── Process status badge ─────────────────────────────────────────────────────

const PROCESS_STATUS_STYLES: Record<ProcessStatus, { bg: string; fg: string }> = {
  Active:  { bg: '#E8F5EE', fg: '#1C8A45' },
  Draft:   { bg: '#FFF3E0', fg: '#E07B00' },
  Retired: { bg: '#F0F0F0', fg: '#6B7489' },
};

function ProcessStatusBadge({ status }: { status: ProcessStatus }) {
  const s = PROCESS_STATUS_STYLES[status] ?? { bg: '#F0F2F7', fg: '#6B7489' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      height: '20px', padding: '0 8px', borderRadius: '100px',
      background: s.bg, color: s.fg,
      fontFamily: 'var(--font-family-primary)', fontSize: '12px',
      fontWeight: 'var(--font-weight-semibold)', lineHeight: '16px',
      whiteSpace: 'nowrap',
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
  fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
  transition: 'opacity 0.1s', flexShrink: 0,
};

const secondaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  height: '36px', padding: '0 16px',
  border: '1px solid var(--primary)', borderRadius: 'var(--radius-button)',
  background: 'transparent', color: 'var(--primary)',
  fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
  transition: 'background 0.1s', flexShrink: 0,
};

const dangerBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  height: '36px', padding: '0 16px', border: 'none',
  borderRadius: 'var(--radius-button)',
  background: 'var(--destructive)', color: '#fff',
  fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
  transition: 'opacity 0.1s', flexShrink: 0,
};

const smallSecondaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  height: '28px', padding: '0 12px',
  border: '1px solid var(--primary)', borderRadius: 'var(--radius-button)',
  background: 'transparent', color: 'var(--primary)',
  fontFamily: 'var(--font-family-primary)', fontSize: '12px',
  fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
  transition: 'background 0.1s', flexShrink: 0,
};

// ─── Column header helper ─────────────────────────────────────────────────────

const colHdr: React.CSSProperties = {
  padding: '0 16px', height: '40px', textAlign: 'left',
  fontFamily: 'var(--font-family-primary)', fontSize: '12px',
  fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
  whiteSpace: 'nowrap', background: 'var(--muted)',
};

const cell: React.CSSProperties = {
  padding: '10px 16px', verticalAlign: 'middle',
};

// ─── Link Process Modal ───────────────────────────────────────────────────────

interface LinkProcessModalProps {
  linkedProcessIds: Set<string>;
  processes: Process[];
  onLink: (link: Omit<ProcessRiskLink, 'id' | 'linkedAt' | 'linkedBy'>) => void;
  onClose: () => void;
  riskId: string;
}

function LinkProcessModal({ linkedProcessIds, processes, onLink, onClose, riskId }: LinkProcessModalProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProcessStatus | ''>('');
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [selectedSubProcessId, setSelectedSubProcessId] = useState('');
  const [notes, setNotes] = useState('');

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

  // Reset sub-process selection when process changes
  function handleSelectProcess(processId: string) {
    setSelectedProcessId(prev => {
      if (prev === processId) return null;
      return processId;
    });
    setSelectedSubProcessId('');
  }

  function handleSubmit() {
    if (!selectedProcessId) return;
    onLink({
      processId: selectedProcessId,
      subProcessId: selectedSubProcessId || null,
      riskId,
      notes,
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
        borderRadius: 'var(--radius-card)',
        boxShadow: '0px 8px 32px rgba(0,0,0,0.18)',
        width: '100%', maxWidth: '680px',
        maxHeight: 'calc(100vh - 48px)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '18px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0,
            }}>
              Link to Process
            </h2>
            <p style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
              margin: '2px 0 0 0',
            }}>
              Associate this risk with a business process or specific sub-process.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', border: 'none',
              borderRadius: 'var(--radius-input)', background: 'transparent',
              color: 'var(--muted-foreground)', cursor: 'pointer',
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
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={14} style={{
                position: 'absolute', left: '10px', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--muted-foreground)',
                pointerEvents: 'none',
              }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, ID, or domain…"
                style={{
                  width: '100%', height: '36px',
                  paddingLeft: '32px', paddingRight: '12px',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-input)',
                  background: 'var(--input-background)', color: 'var(--foreground)',
                  fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-regular)',
                  outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--primary)'; }}
                onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }}
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as ProcessStatus | '')}
              style={{
                height: '36px', padding: '0 12px',
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
                  : 'All processes are already linked to this risk.'}
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
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') handleSelectProcess(proc.id);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 14px', cursor: 'pointer',
                      background: isSelected ? 'rgba(35,34,240,0.06)' : isEven ? 'var(--card)' : 'var(--muted)',
                      borderBottom: idx < available.length - 1 ? '1px solid var(--border)' : 'none',
                      borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                      outline: 'none', transition: 'background 0.1s',
                    }}
                  >
                    {/* Radio indicator */}
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                      background: isSelected ? 'var(--primary)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'border-color 0.1s, background 0.1s',
                    }}>
                      {isSelected && <Check size={10} style={{ color: 'var(--primary-foreground)' }} />}
                    </div>

                    {/* Process info */}
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
                        display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px',
                        flexWrap: 'wrap',
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
                            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                            fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
                            display: 'inline-flex', alignItems: 'center', gap: '3px',
                          }}>
                            <User size={10} />
                            {proc.owner.name}
                          </span>
                        )}
                        {proc.subProcesses.length > 0 && (
                          <span style={{
                            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                            fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
                            display: 'inline-flex', alignItems: 'center', gap: '3px',
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

          {/* Linkage details — only when a process is selected */}
          {selectedProcessId && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Divider */}
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

              {/* Sub-Process selector — only if the process has sub-processes */}
              {subProcesses.length > 0 && (
                <Field
                  label="Sub-Process Association"
                  helpText="Optionally narrow this link to a specific sub-process where the risk manifests."
                >
                  <SelectInput
                    value={selectedSubProcessId}
                    onChange={e => setSelectedSubProcessId(e.target.value)}
                  >
                    <option value="">Process-level (not sub-process specific)</option>
                    {subProcesses.map(sp => (
                      <option key={sp.id} value={sp.id}>{sp.name}</option>
                    ))}
                  </SelectInput>
                </Field>
              )}

              {/* Notes */}
              <Field
                label="Linkage Notes"
                helpText="Describe how this risk relates to this process (optional)."
              >
                <TextareaInput
                  value={notes}
                  rows={2}
                  placeholder="e.g. This risk is introduced during the data ingestion step of this process…"
                  onChange={e => setNotes(e.target.value)}
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
            onMouseEnter={e => {
              if (selectedProcessId) (e.currentTarget as HTMLButtonElement).style.opacity = '0.85';
            }}
            onMouseLeave={e => {
              if (selectedProcessId) (e.currentTarget as HTMLButtonElement).style.opacity = '1';
            }}
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
  onConfirm,
  onCancel,
}: { processName: string; onConfirm: () => void; onCancel: () => void }) {
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
        borderRadius: 'var(--radius-card)',
        boxShadow: '0px 8px 32px rgba(0,0,0,0.18)',
        width: '100%', maxWidth: '440px', padding: '24px',
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
          Remove the association between this risk and{' '}
          <strong style={{ color: 'var(--foreground)' }}>{processName}</strong>?
          The process will remain unchanged — only this risk link will be removed.
        </p>
        <div style={{
          padding: '12px', background: 'rgba(192,57,43,0.06)',
          borderRadius: 'var(--radius-card)', border: '1px solid rgba(192,57,43,0.2)',
        }}>
          <p style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
            fontWeight: 'var(--font-weight-regular)', color: 'var(--destructive)',
            margin: 0, lineHeight: '18px',
          }}>
            This action cannot be undone. You can re-link the process at any time via "Link to Process".
          </p>
        </div>
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

// ─── Main section component ───────────────────────────────────────────────────

interface RiskProcessesSectionProps {
  riskId: string;
  processLinks: ProcessRiskLink[];
  processes: Process[];
  onLinksChange: (updated: ProcessRiskLink[]) => void;
}

export function RiskProcessesSection({
  riskId,
  processLinks,
  processes,
  onLinksChange,
}: RiskProcessesSectionProps) {
  const navigate = useNavigate();
  const [linkOpen, setLinkOpen] = useState(false);
  const [unlinkId, setUnlinkId] = useState<string | null>(null);

  // Links specifically for this risk
  const riskLinks = useMemo(
    () => processLinks.filter(l => l.riskId === riskId),
    [processLinks, riskId],
  );

  // Set of already-linked process IDs (one link per process)
  const linkedProcessIds = useMemo(
    () => new Set(riskLinks.map(l => l.processId)),
    [riskLinks],
  );

  // Map process id → Process for fast lookup
  const processMap = useMemo(() => {
    const m = new Map<string, Process>();
    processes.forEach(p => m.set(p.id, p));
    return m;
  }, [processes]);

  // The link currently being unlinked
  const unlinkLink = unlinkId ? riskLinks.find(l => l.id === unlinkId) : null;
  const unlinkProcess = unlinkLink ? processMap.get(unlinkLink.processId) : null;

  function handleLink(partial: Omit<ProcessRiskLink, 'id' | 'linkedAt' | 'linkedBy'>) {
    const now = new Date().toISOString().split('T')[0];
    const newLink: ProcessRiskLink = {
      ...partial,
      id: 'PRL-' + generateId(),
      linkedAt: now,
      linkedBy: 'Current User',
    };
    onLinksChange([...processLinks, newLink]);
    setLinkOpen(false);
  }

  function handleUnlink() {
    if (!unlinkId) return;
    onLinksChange(processLinks.filter(l => l.id !== unlinkId));
    setUnlinkId(null);
  }

  return (
    <>
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
              Associated Processes
            </h3>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: '20px', height: '20px', padding: '0 6px', borderRadius: '100px',
              background: 'rgba(35,34,240,0.08)',
              fontFamily: 'var(--font-family-primary)', fontSize: '11px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)',
            }}>
              {riskLinks.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setLinkOpen(true)}
            style={smallSecondaryBtn}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(35,34,240,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <Plus size={12} /> Link to Process
          </button>
        </div>

        {/* Summary strip */}
        {riskLinks.length > 0 && (
          <div style={{
            display: 'flex', gap: '12px', padding: '10px 24px',
            borderBottom: '1px solid var(--border)', flexWrap: 'wrap',
          }}>
            {(() => {
              const activeCount = riskLinks.filter(l => {
                const p = processMap.get(l.processId);
                return p?.status === 'Active';
              }).length;
              const subCount = riskLinks.filter(l => !!l.subProcessId).length;
              return (
                <>
                  <SummaryChip label="Total" value={riskLinks.length} color="var(--primary)" />
                  {activeCount > 0 && (
                    <SummaryChip label="Active Processes" value={activeCount} color="#1C8A45" />
                  )}
                  {subCount > 0 && (
                    <SummaryChip label="Sub-Process Level" value={subCount} color="#E07B00" />
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Empty state */}
        {riskLinks.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ marginBottom: '8px' }}>
              <GitBranch size={32} style={{ color: 'var(--muted-foreground)' }} />
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
              marginBottom: '16px', lineHeight: '22px', maxWidth: '340px', margin: '0 auto 16px',
            }}>
              Associate this risk with the business processes where it can materialise to build process-level risk coverage.
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
          /* Table */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '680px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Process', 'Domain', 'Sub-Process', 'Status', 'Owner', 'Linked', ''].map(h => (
                    <th key={h} style={colHdr}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {riskLinks.map((link, idx) => {
                  const proc = processMap.get(link.processId);
                  if (!proc) return null;
                  const subProcess = link.subProcessId
                    ? proc.subProcesses.find(sp => sp.id === link.subProcessId)
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
                      {/* Process name + ID */}
                      <td style={cell}>
                        <button
                          type="button"
                          onClick={() => navigate(`/processes/${proc.id}`)}
                          style={{
                            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                            fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                            fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                            textAlign: 'left', lineHeight: '20px',
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
                          {link.notes && (
                            <span style={{ marginLeft: '8px', fontStyle: 'italic' }}>
                              · {link.notes.length > 60 ? link.notes.slice(0, 60) + '…' : link.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Domain */}
                      <td style={cell}>
                        {proc.businessDomain ? (
                          <span style={{
                            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                            fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                          }}>
                            <Building2 size={12} style={{ flexShrink: 0 }} />
                            {proc.businessDomain}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: '12px' }}>—</span>
                        )}
                      </td>

                      {/* Sub-Process */}
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
                          <span style={{ color: 'var(--muted-foreground)', fontSize: '12px', fontFamily: 'var(--font-family-primary)' }}>—</span>
                        )}
                      </td>

                      {/* Linked date */}
                      <td style={cell}>
                        <span style={{
                          fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                          fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
                          whiteSpace: 'nowrap',
                        }}>
                          {link.linkedAt
                            ? new Date(link.linkedAt + 'T00:00:00').toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric',
                              })
                            : '—'}
                        </span>
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
          riskId={riskId}
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
          onConfirm={handleUnlink}
          onCancel={() => setUnlinkId(null)}
        />
      )}
    </>
  );
}

// ─── Summary chip ─────────────────────────────────────────────────────────────

function SummaryChip({
  label, value, color,
}: { label: string; value: number; color: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
    }}>
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
