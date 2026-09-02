import React, { useState, useMemo } from 'react';
import { Plus, ShieldAlert, X, Search, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { VendorRisk } from '../../data/vendorRiskData';
import { getRisksForVendor, mappingExists } from '../../data/vendorRiskData';
import { formatDate, generateId, MOCK_USERS } from '../../data/mockData';
import type { Risk } from '../../data/riskData';
import { RISK_STATUS_LABELS, RISK_TYPE_LABELS } from '../../data/riskData';

interface VendorRisksTabProps {
  vendorId: string;
  risks: Risk[];
  vendorRisks: VendorRisk[];
  onVendorRisksChange: (updated: VendorRisk[]) => void;
}

const STATUS_STYLES: Record<string, { background: string; color: string }> = {
  draft:    { background: '#FFF3E0', color: '#E07B00' },
  active:   { background: '#E8F5EE', color: '#1C8A45' },
  closed:   { background: '#F0F0F0', color: '#6B7489' },
  archived: { background: '#F0F0F0', color: '#6B7489' },
};

const TYPE_STYLES: Record<string, { background: string; color: string }> = {
  strategic:    { background: 'rgba(35,34,240,0.08)', color: '#2322F0' },
  operational:  { background: '#FFF3E0', color: '#E07B00' },
  financial:    { background: '#E8F5EE', color: '#1C8A45' },
  compliance:   { background: '#E0F5F5', color: '#00A3A3' },
  reputational: { background: '#FDE8E8', color: '#C0392B' },
  cyber:        { background: '#F0E8FF', color: '#6B3FA0' },
};

export function VendorRisksTab({
  vendorId,
  risks,
  vendorRisks,
  onVendorRisksChange,
}: VendorRisksTabProps) {
  const navigate = useNavigate();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const linkedVendorRisks = useMemo(
    () => getRisksForVendor(vendorRisks, vendorId),
    [vendorRisks, vendorId]
  );

  const linkedRisks = useMemo(() => {
    return linkedVendorRisks
      .map(vr => risks.find(r => r.id === vr.riskId))
      .filter((r): r is Risk => r !== undefined);
  }, [linkedVendorRisks, risks]);

  function handleAddLink(riskId: string, notes: string) {
    if (mappingExists(vendorRisks, vendorId, riskId)) {
      alert('This risk is already linked to this vendor.');
      return;
    }
    const newLink: VendorRisk = {
      vendorId,
      riskId,
      relationshipNotes: notes,
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: MOCK_USERS[0],
    };
    onVendorRisksChange([...vendorRisks, newLink]);
    setAddModalOpen(false);
  }

  function handleRemoveLink(riskId: string) {
    onVendorRisksChange(vendorRisks.filter(vr => !(vr.vendorId === vendorId && vr.riskId === riskId)));
    setRemovingId(null);
  }

  const removingRisk = removingId ? risks.find(r => r.id === removingId) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
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
            Associated Risks
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--muted-foreground)',
              margin: '4px 0 0 0',
            }}
          >
            {linkedRisks.length} risk{linkedRisks.length !== 1 ? 's' : ''} linked
          </p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
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
          Add Risk
        </button>
      </div>

      {/* Risk List */}
      {linkedRisks.length === 0 ? (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            padding: '48px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <ShieldAlert size={48} style={{ color: 'var(--muted-foreground)' }} />
          <h4
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '14px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: 0,
            }}
          >
            No Risks Linked
          </h4>
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--muted-foreground)',
              margin: 0,
              textAlign: 'center',
            }}
          >
            Link risks to track third-party vulnerabilities and vendor dependencies.
          </p>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            overflow: 'hidden',
          }}
        >
          {linkedRisks.map((risk, idx) => {
            const link = linkedVendorRisks.find(vr => vr.riskId === risk.id);
            const statusStyle = STATUS_STYLES[risk.status] ?? { background: '#F0F0F0', color: '#6B7489' };
            const typeStyle = TYPE_STYLES[risk.riskType] ?? { background: '#F0F0F0', color: '#6B7489' };
            
            return (
              <div
                key={risk.id}
                style={{
                  padding: '16px 24px',
                  borderBottom: idx < linkedRisks.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => navigate(`/risks/${risk.id}`)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--primary)',
                      }}
                    >
                      <ShieldAlert size={14} />
                      {risk.title}
                      <ExternalLink size={12} />
                    </button>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: '22px',
                        padding: '0 10px',
                        borderRadius: '100px',
                        background: statusStyle.background,
                        color: statusStyle.color,
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '12px',
                        fontWeight: 'var(--font-weight-semibold)',
                      }}
                    >
                      {RISK_STATUS_LABELS[risk.status]}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: '22px',
                        padding: '0 10px',
                        borderRadius: '100px',
                        background: typeStyle.background,
                        color: typeStyle.color,
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '12px',
                        fontWeight: 'var(--font-weight-semibold)',
                      }}
                    >
                      {RISK_TYPE_LABELS[risk.riskType]}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '12px',
                        color: 'var(--muted-foreground)',
                      }}
                    >
                      {risk.id}
                    </span>
                  </div>
                  {link?.relationshipNotes && (
                    <p
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        color: 'var(--muted-foreground)',
                        margin: 0,
                        lineHeight: '22px',
                      }}
                    >
                      {link.relationshipNotes}
                    </p>
                  )}
                  {link?.createdAt && (
                    <p
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '12px',
                        color: 'var(--muted-foreground)',
                        margin: '8px 0 0 0',
                      }}
                    >
                      Linked {formatDate(link.createdAt)} by {link.createdBy?.name ?? 'Unknown'}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setRemovingId(risk.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    border: 'none',
                    borderRadius: 'var(--radius-button)',
                    background: 'transparent',
                    color: 'var(--destructive)',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  title="Remove risk link"
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {addModalOpen && (
        <AddRiskModal
          risks={risks}
          linkedRiskIds={linkedRisks.map(r => r.id)}
          onAdd={handleAddLink}
          onClose={() => setAddModalOpen(false)}
        />
      )}

      {/* Remove Confirmation */}
      {removingId && removingRisk && (
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
            if (e.target === e.currentTarget) setRemovingId(null);
          }}
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
              Remove Risk Link
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
              Are you sure you want to remove <strong>{removingRisk.title}</strong> from this vendor?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>\n              <button
                onClick={() => setRemovingId(null)}
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
                onClick={() => handleRemoveLink(removingId)}
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
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add Risk Modal ──────────────────────────────────────────────────────────

interface AddRiskModalProps {
  risks: Risk[];
  linkedRiskIds: string[];
  onAdd: (riskId: string, notes: string) => void;
  onClose: () => void;
}

function AddRiskModal({ risks, linkedRiskIds, onAdd, onClose }: AddRiskModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRiskId, setSelectedRiskId] = useState('');
  const [notes, setNotes] = useState('');

  const availableRisks = useMemo(() => {
    const filtered = risks.filter(r => !linkedRiskIds.includes(r.id));
    if (!searchTerm.trim()) return filtered;
    const lower = searchTerm.toLowerCase();
    return filtered.filter(
      r =>
        r.title.toLowerCase().includes(lower) ||
        r.id.toLowerCase().includes(lower) ||
        r.department.toLowerCase().includes(lower) ||
        RISK_TYPE_LABELS[r.riskType].toLowerCase().includes(lower)
    );
  }, [risks, linkedRiskIds, searchTerm]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRiskId) {
      alert('Please select a risk.');
      return;
    }
    onAdd(selectedRiskId, notes);
  }

  return (
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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: '0px 8px 32px rgba(0,0,0,0.18)',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
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
            Add Risk to Vendor
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'var(--muted-foreground)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflow: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Search */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                lineHeight: '20px',
              }}
            >
              Search Risks
            </label>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted-foreground)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by title, ID, type, or department..."
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 12px 0 36px',
                  border: '1px solid var(--input-border)',
                  borderRadius: 'var(--radius-input)',
                  background: 'var(--input)',
                  color: 'var(--foreground)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-regular)',
                }}
              />
            </div>
          </div>

          {/* Risk List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                lineHeight: '20px',
              }}
            >
              Select Risk <span style={{ color: 'var(--destructive)' }}>*</span>
            </label>
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-input)',
                maxHeight: '240px',
                overflow: 'auto',
              }}
            >
              {availableRisks.length === 0 ? (
                <div
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  {searchTerm.trim() ? 'No risks found matching your search.' : 'All risks are already linked.'}
                </div>
              ) : (
                availableRisks.map((risk, idx) => {
                  const typeStyle = TYPE_STYLES[risk.riskType] ?? { background: '#F0F0F0', color: '#6B7489' };
                  
                  return (
                    <label
                      key={risk.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        borderBottom: idx < availableRisks.length - 1 ? '1px solid var(--border)' : 'none',
                        cursor: 'pointer',
                        background: selectedRiskId === risk.id ? 'var(--accent)' : 'transparent',
                      }}
                    >
                      <input
                        type="radio"
                        name="risk"
                        value={risk.id}
                        checked={selectedRiskId === risk.id}
                        onChange={e => setSelectedRiskId(e.target.value)}
                        style={{ flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: 'var(--text-base)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--foreground)',
                            marginBottom: '4px',
                          }}
                        >
                          {risk.title}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--font-family-primary)',
                              fontSize: '12px',
                              color: 'var(--muted-foreground)',
                            }}
                          >
                            {risk.id}
                          </span>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              height: '18px',
                              padding: '0 6px',
                              borderRadius: '100px',
                              background: typeStyle.background,
                              color: typeStyle.color,
                              fontFamily: 'var(--font-family-primary)',
                              fontSize: '11px',
                              fontWeight: 'var(--font-weight-semibold)',
                            }}
                          >
                            {RISK_TYPE_LABELS[risk.riskType]}
                          </span>
                          <span
                            style={{
                              fontFamily: 'var(--font-family-primary)',
                              fontSize: '12px',
                              color: 'var(--muted-foreground)',
                            }}
                          >
                            {risk.department}
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Relationship Notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              htmlFor="notes"
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                lineHeight: '20px',
              }}
            >
              Relationship Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Describe how this risk relates to the vendor..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--input-border)',
                borderRadius: 'var(--radius-input)',
                background: 'var(--input)',
                color: 'var(--foreground)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-regular)',
                resize: 'vertical',
              }}
            />
            <p
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                color: 'var(--muted-foreground)',
                margin: 0,
              }}
            >
              Optional: Explain the relationship between this risk and the vendor.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
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
            type="submit"
            onClick={handleSubmit}
            disabled={!selectedRiskId}
            style={{
              height: '36px',
              padding: '0 16px',
              border: 'none',
              borderRadius: 'var(--radius-button)',
              background: selectedRiskId ? 'var(--primary)' : 'var(--muted)',
              color: selectedRiskId ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: selectedRiskId ? 'pointer' : 'not-allowed',
            }}
          >
            Add Risk
          </button>
        </div>
      </div>
    </div>
  );
}
