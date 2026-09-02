import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { RegulationRequirement, RequirementType, RequirementStatus } from '../../data/regulationRequirementData';
import { REQUIREMENT_TYPE_LABELS, REQUIREMENT_STATUS_LABELS } from '../../data/regulationRequirementData';
import { loadControls } from '../../data/controlData';

interface RequirementFormModalProps {
  regulationId: string;
  initialData?: RegulationRequirement;
  onClose: () => void;
  onSubmit: (data: Omit<RegulationRequirement, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => void;
}

export function RequirementFormModal({ regulationId, initialData, onClose, onSubmit }: RequirementFormModalProps) {
  const [requirementNumber, setRequirementNumber] = useState(initialData?.requirementNumber || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [requirementType, setRequirementType] = useState<RequirementType>(initialData?.requirementType || 'must');
  const [citation, setCitation] = useState(initialData?.citation || '');
  const [section, setSection] = useState(initialData?.section || '');
  const [applicability, setApplicability] = useState(initialData?.applicability || '');
  const [interpretationNotes, setInterpretationNotes] = useState(initialData?.interpretationNotes || '');
  const [status, setStatus] = useState<RequirementStatus>(initialData?.status || 'identified');
  const [linkedControlIds, setLinkedControlIds] = useState<string[]>(initialData?.linkedControlIds || []);
  const [gapAnalysis, setGapAnalysis] = useState(initialData?.gapAnalysis || '');
  const [remediationPlan, setRemediationPlan] = useState(initialData?.remediationPlan || '');
  const [assignedTo, setAssignedTo] = useState(initialData?.assignedTo || '');
  const [dueDate, setDueDate] = useState(initialData?.dueDate || '');
  const [priority, setPriority] = useState<'critical' | 'high' | 'medium' | 'low'>(initialData?.priority || 'medium');

  const controls = loadControls();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    onSubmit({
      regulationId,
      requirementNumber: requirementNumber.trim(),
      title: title.trim(),
      description: description.trim(),
      requirementType,
      citation: citation.trim(),
      section: section.trim(),
      applicability: applicability.trim(),
      interpretationNotes: interpretationNotes.trim(),
      status,
      linkedControlIds,
      gapAnalysis: gapAnalysis.trim(),
      remediationPlan: remediationPlan.trim(),
      assignedTo: assignedTo.trim() || null,
      dueDate: dueDate || null,
      priority,
    });
  }

  function toggleControl(controlId: string) {
    if (linkedControlIds.includes(controlId)) {
      setLinkedControlIds(linkedControlIds.filter(id => id !== controlId));
    } else {
      setLinkedControlIds([...linkedControlIds, controlId]);
    }
  }

  const isValid = requirementNumber.trim() && title.trim() && description.trim();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--radius-card)',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--elevation-sm)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '18px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: 0,
            }}
          >
            {initialData ? 'Edit Requirement' : 'Add Requirement'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted-foreground)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Requirement Number & Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--foreground)',
                      marginBottom: '6px',
                    }}
                  >
                    Requirement Number <span style={{ color: 'var(--destructive)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={requirementNumber}
                    onChange={e => setRequirementNumber(e.target.value)}
                    placeholder="e.g., Art. 5.1.a, § 123.45"
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-input)',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      background: 'var(--input-background)',
                      color: 'var(--foreground)',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--foreground)',
                      marginBottom: '6px',
                    }}
                  >
                    Section/Article
                  </label>
                  <input
                    type="text"
                    value={section}
                    onChange={e => setSection(e.target.value)}
                    placeholder="e.g., Article 5"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-input)',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      background: 'var(--input-background)',
                      color: 'var(--foreground)',
                    }}
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--foreground)',
                    marginBottom: '6px',
                  }}
                >
                  Title <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Short descriptive title"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-input)',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    background: 'var(--input-background)',
                    color: 'var(--foreground)',
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--foreground)',
                    marginBottom: '6px',
                  }}
                >
                  Description <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Full text of the regulatory requirement"
                  rows={3}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-input)',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    background: 'var(--input-background)',
                    color: 'var(--foreground)',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Type & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--foreground)',
                      marginBottom: '6px',
                    }}
                  >
                    Requirement Type <span style={{ color: 'var(--destructive)' }}>*</span>
                  </label>
                  <select
                    value={requirementType}
                    onChange={e => setRequirementType(e.target.value as RequirementType)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-input)',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      background: 'var(--input-background)',
                      color: 'var(--foreground)',
                    }}
                  >
                    {Object.entries(REQUIREMENT_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--foreground)',
                      marginBottom: '6px',
                    }}
                  >
                    Status <span style={{ color: 'var(--destructive)' }}>*</span>
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as RequirementStatus)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-input)',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      background: 'var(--input-background)',
                      color: 'var(--foreground)',
                    }}
                  >
                    {Object.entries(REQUIREMENT_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Citation */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--foreground)',
                    marginBottom: '6px',
                  }}
                >
                  Citation
                </label>
                <input
                  type="text"
                  value={citation}
                  onChange={e => setCitation(e.target.value)}
                  placeholder="Full legal citation"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-input)',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    background: 'var(--input-background)',
                    color: 'var(--foreground)',
                  }}
                />
              </div>

              {/* Applicability */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--foreground)',
                    marginBottom: '6px',
                  }}
                >
                  Applicability
                </label>
                <textarea
                  value={applicability}
                  onChange={e => setApplicability(e.target.value)}
                  placeholder="How this requirement applies to the organization"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-input)',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    background: 'var(--input-background)',
                    color: 'var(--foreground)',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Linked Controls */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--foreground)',
                    marginBottom: '6px',
                  }}
                >
                  Linked Controls
                </label>
                <div
                  style={{
                    maxHeight: '150px',
                    overflowY: 'auto',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-input)',
                    padding: '8px',
                    background: 'var(--input-background)',
                  }}
                >
                  {controls.length === 0 ? (
                    <p
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        color: 'var(--muted-foreground)',
                        margin: 0,
                        padding: '8px',
                      }}
                    >
                      No controls available
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {controls.map(control => (
                        <label
                          key={control.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px',
                            cursor: 'pointer',
                            borderRadius: 'var(--radius-input)',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'var(--muted)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={linkedControlIds.includes(control.id)}
                            onChange={() => toggleControl(control.id)}
                            style={{
                              width: '16px',
                              height: '16px',
                              cursor: 'pointer',
                            }}
                          />
                          <span
                            style={{
                              fontFamily: 'var(--font-family-primary)',
                              fontSize: 'var(--text-base)',
                              color: 'var(--foreground)',
                            }}
                          >
                            {control.id} - {control.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    color: 'var(--muted-foreground)',
                    margin: '4px 0 0 0',
                  }}
                >
                  {linkedControlIds.length} control{linkedControlIds.length === 1 ? '' : 's'} selected
                </p>
              </div>

              {/* Gap Analysis */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--foreground)',
                    marginBottom: '6px',
                  }}
                >
                  Gap Analysis
                </label>
                <textarea
                  value={gapAnalysis}
                  onChange={e => setGapAnalysis(e.target.value)}
                  placeholder="Current gaps or compliance status"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-input)',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    background: 'var(--input-background)',
                    color: 'var(--foreground)',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Remediation Plan */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--foreground)',
                    marginBottom: '6px',
                  }}
                >
                  Remediation Plan
                </label>
                <textarea
                  value={remediationPlan}
                  onChange={e => setRemediationPlan(e.target.value)}
                  placeholder="Plan to address gaps"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-input)',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    background: 'var(--input-background)',
                    color: 'var(--foreground)',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Priority, Assigned To, Due Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--foreground)',
                      marginBottom: '6px',
                    }}
                  >
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as 'critical' | 'high' | 'medium' | 'low')}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-input)',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      background: 'var(--input-background)',
                      color: 'var(--foreground)',
                    }}
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--foreground)',
                      marginBottom: '6px',
                    }}
                  >
                    Assigned To
                  </label>
                  <input
                    type="text"
                    value={assignedTo}
                    onChange={e => setAssignedTo(e.target.value)}
                    placeholder="Owner name"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-input)',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      background: 'var(--input-background)',
                      color: 'var(--foreground)',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--foreground)',
                      marginBottom: '6px',
                    }}
                  >
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-input)',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      background: 'var(--input-background)',
                      color: 'var(--foreground)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: 'var(--secondary)',
                color: 'var(--secondary-foreground)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-button)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              style={{
                padding: '8px 16px',
                background: isValid ? 'var(--primary)' : 'var(--muted)',
                color: isValid ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                border: 'none',
                borderRadius: 'var(--radius-button)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: isValid ? 'pointer' : 'not-allowed',
              }}
            >
              {initialData ? 'Save Changes' : 'Add Requirement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
