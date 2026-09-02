import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Bill, BillStatus, BillPriority } from '../../data/billData';
import { BILL_STATUS_LABELS, BILL_PRIORITY_LABELS } from '../../data/billData';
import { loadRegulations } from '../../data/regulationData';
import type { AppUser } from '../../data/mockData';

interface BillFormModalProps {
  onClose: () => void;
  onSubmit: (data: Omit<Bill, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => void;
  initialData?: Bill;
}

export function BillFormModal({ onClose, onSubmit, initialData }: BillFormModalProps) {
  const [billNumber, setBillNumber] = useState(initialData?.billNumber || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [summary, setSummary] = useState(initialData?.summary || '');
  const [legislature, setLegislature] = useState(initialData?.legislature || '');
  const [sponsor, setSponsor] = useState(initialData?.sponsor || '');
  const [introducedDate, setIntroducedDate] = useState(initialData?.introducedDate || '');
  const [status, setStatus] = useState<BillStatus>(initialData?.status || 'introduced');
  const [currentCommittee, setCurrentCommittee] = useState(initialData?.currentCommittee || '');
  const [regulationId, setRegulationId] = useState<string>(initialData?.regulationId || '');
  const [priority, setPriority] = useState<BillPriority>(initialData?.priority || 'medium');
  const [internalNotes, setInternalNotes] = useState(initialData?.internalNotes || '');
  const [officialUrl, setOfficialUrl] = useState(initialData?.officialUrl || '');

  const regulations = loadRegulations();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    onSubmit({
      billNumber: billNumber.trim(),
      title: title.trim(),
      summary: summary.trim(),
      legislature: legislature.trim(),
      sponsor: sponsor.trim(),
      introducedDate,
      status,
      currentCommittee: currentCommittee.trim() || null,
      regulationId: regulationId || null,
      relatedRegulationIds: initialData?.relatedRegulationIds || [],
      amendments: initialData?.amendments || [],
      votes: initialData?.votes || [],
      officialUrl: officialUrl.trim() || null,
      attachmentIds: initialData?.attachmentIds || [],
      assignedTo: initialData?.assignedTo || null,
      priority,
      internalNotes: internalNotes.trim(),
    });
  }

  const isValid = billNumber.trim() && title.trim() && legislature.trim() && sponsor.trim() && introducedDate;

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
          maxWidth: '700px',
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
            {initialData ? 'Edit Bill' : 'Add Bill'}
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
              {/* Bill Number */}
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
                  Bill Number <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={billNumber}
                  onChange={e => setBillNumber(e.target.value)}
                  placeholder="e.g., H.R. 1234, S.B. 567"
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
                  placeholder="Short title of the bill"
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

              {/* Summary */}
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
                  Summary
                </label>
                <textarea
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  placeholder="Brief description of the bill's purpose and key provisions"
                  rows={4}
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

              {/* Legislature & Sponsor */}
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
                    Legislature <span style={{ color: 'var(--destructive)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={legislature}
                    onChange={e => setLegislature(e.target.value)}
                    placeholder="e.g., 118th Congress"
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
                    Sponsor <span style={{ color: 'var(--destructive)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={sponsor}
                    onChange={e => setSponsor(e.target.value)}
                    placeholder="Primary sponsor name"
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
              </div>

              {/* Introduced Date */}
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
                  Introduced Date <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                <input
                  type="date"
                  value={introducedDate}
                  onChange={e => setIntroducedDate(e.target.value)}
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

              {/* Status & Priority */}
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
                    Status <span style={{ color: 'var(--destructive)' }}>*</span>
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as BillStatus)}
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
                    {Object.entries(BILL_STATUS_LABELS).map(([value, label]) => (
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
                    Priority <span style={{ color: 'var(--destructive)' }}>*</span>
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as BillPriority)}
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
                    {Object.entries(BILL_PRIORITY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Current Committee */}
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
                  Current Committee
                </label>
                <input
                  type="text"
                  value={currentCommittee}
                  onChange={e => setCurrentCommittee(e.target.value)}
                  placeholder="e.g., Senate Judiciary Committee"
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

              {/* Related Regulation */}
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
                  Related Regulation
                </label>
                <select
                  value={regulationId}
                  onChange={e => setRegulationId(e.target.value)}
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
                  <option value="">None</option>
                  {regulations.map(reg => (
                    <option key={reg.id} value={reg.id}>
                      {reg.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Official URL */}
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
                  Official URL
                </label>
                <input
                  type="url"
                  value={officialUrl}
                  onChange={e => setOfficialUrl(e.target.value)}
                  placeholder="https://..."
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

              {/* Internal Notes */}
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
                  Internal Notes
                </label>
                <textarea
                  value={internalNotes}
                  onChange={e => setInternalNotes(e.target.value)}
                  placeholder="Internal tracking notes, impact analysis, action items..."
                  rows={4}
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
              {initialData ? 'Save Changes' : 'Add Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
