import React, { useState, useMemo } from 'react';
import { Plus, Building2, X, Search, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { VendorRisk } from '../../data/vendorRiskData';
import { getVendorsForRisk, mappingExists } from '../../data/vendorRiskData';
import { formatDate, generateId, MOCK_USERS } from '../../data/mockData';
import type { Vendor } from '../../data/mockData';
import { StatusBadge } from '../shared/StatusBadge';

interface RiskVendorsSectionProps {
  riskId: string;
  vendors: Vendor[];
  vendorRisks: VendorRisk[];
  onVendorRisksChange: (updated: VendorRisk[]) => void;
}

export function RiskVendorsSection({
  riskId,
  vendors,
  vendorRisks,
  onVendorRisksChange,
}: RiskVendorsSectionProps) {
  const navigate = useNavigate();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const linkedVendorRisks = useMemo(
    () => getVendorsForRisk(vendorRisks, riskId),
    [vendorRisks, riskId]
  );

  const linkedVendors = useMemo(() => {
    return linkedVendorRisks
      .map(vr => vendors.find(v => v.id === vr.vendorId))
      .filter((v): v is Vendor => v !== undefined);
  }, [linkedVendorRisks, vendors]);

  function handleAddLink(vendorId: string, notes: string) {
    if (mappingExists(vendorRisks, vendorId, riskId)) {
      alert('This vendor is already linked to this risk.');
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

  function handleRemoveLink(vendorId: string) {
    onVendorRisksChange(vendorRisks.filter(vr => !(vr.vendorId === vendorId && vr.riskId === riskId)));
    setRemovingId(null);
  }

  const removingVendor = removingId ? vendors.find(v => v.id === removingId) : null;

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
            Associated Vendors
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
            {linkedVendors.length} vendor{linkedVendors.length !== 1 ? 's' : ''} linked
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
          Add Vendor
        </button>
      </div>

      {/* Vendor List */}
      {linkedVendors.length === 0 ? (
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
          <Building2 size={48} style={{ color: 'var(--muted-foreground)' }} />
          <h4
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '14px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: 0,
            }}
          >
            No Vendors Linked
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
            Link vendors to track third-party risks and vendor dependencies.
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
          {linkedVendors.map((vendor, idx) => {
            const link = linkedVendorRisks.find(vr => vr.vendorId === vendor.id);
            return (
              <div
                key={vendor.id}
                style={{
                  padding: '16px 24px',
                  borderBottom: idx < linkedVendors.length - 1 ? '1px solid var(--border)' : 'none',
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
                      onClick={() => navigate(`/vendors/${vendor.id}`)}
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
                      <Building2 size={14} />
                      {vendor.name}
                      <ExternalLink size={12} />
                    </button>
                    <StatusBadge status={vendor.status} type="vendor" />
                    <span
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '12px',
                        color: 'var(--muted-foreground)',
                      }}
                    >
                      {vendor.category}
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
                  onClick={() => setRemovingId(vendor.id)}
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
                  title="Remove vendor link"
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
        <AddVendorModal
          vendors={vendors}
          linkedVendorIds={linkedVendors.map(v => v.id)}
          onAdd={handleAddLink}
          onClose={() => setAddModalOpen(false)}
        />
      )}

      {/* Remove Confirmation */}
      {removingId && removingVendor && (
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
              Remove Vendor Link
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
              Are you sure you want to remove <strong>{removingVendor.name}</strong> from this risk?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
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

// ─── Add Vendor Modal ────────────────────────────────────────────────────────

interface AddVendorModalProps {
  vendors: Vendor[];
  linkedVendorIds: string[];
  onAdd: (vendorId: string, notes: string) => void;
  onClose: () => void;
}

function AddVendorModal({ vendors, linkedVendorIds, onAdd, onClose }: AddVendorModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [notes, setNotes] = useState('');

  const availableVendors = useMemo(() => {
    const filtered = vendors.filter(v => !linkedVendorIds.includes(v.id));
    if (!searchTerm.trim()) return filtered;
    const lower = searchTerm.toLowerCase();
    return filtered.filter(
      v =>
        v.name.toLowerCase().includes(lower) ||
        v.category.toLowerCase().includes(lower) ||
        v.department.toLowerCase().includes(lower)
    );
  }, [vendors, linkedVendorIds, searchTerm]);

  const selectedVendor = selectedVendorId ? vendors.find(v => v.id === selectedVendorId) : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVendorId) {
      alert('Please select a vendor.');
      return;
    }
    onAdd(selectedVendorId, notes);
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
            Add Vendor to Risk
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
              Search Vendors
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
                placeholder="Search by name, category, or department..."
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

          {/* Vendor List */}
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
              Select Vendor <span style={{ color: 'var(--destructive)' }}>*</span>
            </label>
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-input)',
                maxHeight: '240px',
                overflow: 'auto',
              }}
            >
              {availableVendors.length === 0 ? (
                <div
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  {searchTerm.trim() ? 'No vendors found matching your search.' : 'All vendors are already linked.'}
                </div>
              ) : (
                availableVendors.map((vendor, idx) => (
                  <label
                    key={vendor.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderBottom: idx < availableVendors.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                      background: selectedVendorId === vendor.id ? 'var(--accent)' : 'transparent',
                    }}
                  >
                    <input
                      type="radio"
                      name="vendor"
                      value={vendor.id}
                      checked={selectedVendorId === vendor.id}
                      onChange={e => setSelectedVendorId(e.target.value)}
                      style={{ flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--text-base)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--foreground)',
                          marginBottom: '2px',
                        }}
                      >
                        {vendor.name}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '12px',
                          color: 'var(--muted-foreground)',
                        }}
                      >
                        {vendor.category} • {vendor.department}
                      </div>
                    </div>
                    <StatusBadge status={vendor.status} type="vendor" />
                  </label>
                ))
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
              placeholder="Describe how this vendor relates to the risk..."
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
              Optional: Explain the relationship between this vendor and the risk.
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
            disabled={!selectedVendorId}
            style={{
              height: '36px',
              padding: '0 16px',
              border: 'none',
              borderRadius: 'var(--radius-button)',
              background: selectedVendorId ? 'var(--primary)' : 'var(--muted)',
              color: selectedVendorId ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: selectedVendorId ? 'pointer' : 'not-allowed',
            }}
          >
            Add Vendor
          </button>
        </div>
      </div>
    </div>
  );
}
