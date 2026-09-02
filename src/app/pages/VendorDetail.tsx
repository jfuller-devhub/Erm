import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Edit2, Trash2, Plus, Building2, Mail, Phone, Globe, FileText, Users, Briefcase, Link2, ShieldCheck, Activity, GitBranch, ChevronDown, ChevronRight, X, Package, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/shared/StatusBadge';
import { KPITile } from '../components/shared/KPITile';

import { VendorFormModal } from '../components/shared/VendorFormModal';
import { ContractFormModal } from '../components/shared/ContractFormModal';
import { ContactFormModal } from '../components/shared/ContactFormModal';
import { FormModal } from '../components/shared/FormModal';
import { UserChip } from '../components/shared/UserPicker';
import { VendorRisksTab } from '../components/vendors/VendorRisksTab';
import { formatDate, formatCurrency, Contract, VendorContact } from '../data/mockData';
import { loadProcesses } from '../data/processData';
import { loadProducts } from '../data/productData';
import type { Product } from '../data/productData';
import { syncVendorProductLinks } from '../data/syncUtils';
import { loadRisks } from '../data/riskData';
import type { Risk } from '../data/riskData';
import { loadVendorRisks, saveVendorRisks, getRiskCountForVendor } from '../data/vendorRiskData';
import type { VendorRisk } from '../data/vendorRiskData';

const TABS = ['Details', 'Contacts', 'Contracts', 'Processes', 'Benefits or Services', 'Risks', 'Activity'] as const;
type Tab = typeof TABS[number];

export function VendorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    vendors, contracts, activity, vendorContacts,
    updateVendor, deleteVendor, addContract, updateContract,
    addVendorContact, updateVendorContact, deleteVendorContact,
  } = useApp();

  const vendor = vendors.find(v => v.id === id);
  const [activeTab, setActiveTab] = useState<Tab>('Details');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddContract, setShowAddContract] = useState(false);
  const [linkedProducts, setLinkedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [vendorRisks, setVendorRisks] = useState<VendorRisk[]>([]);

  // Contact modal state
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<VendorContact | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  const [removingContractId, setRemovingContractId] = useState<string | null>(null);

  // Load linked products from localStorage whenever vendor.productIds changes
  useEffect(() => {
    if (!vendor) return;
    const all = loadProducts();
    setAllProducts(all);
    setLinkedProducts(all.filter(p => (vendor.productIds ?? []).includes(p.id)));
  }, [vendor?.productIds?.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load risks and vendor-risk links
  useEffect(() => {
    setRisks(loadRisks());
    setVendorRisks(loadVendorRisks());
  }, []);

  if (!vendor) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: '16px' }}>
        <Building2 size={48} style={{ color: 'var(--muted-foreground)' }} />
        <h2 style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0 }}>
          Vendor not found
        </h2>
        <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', margin: 0 }}>
          This vendor may have been deleted or the URL is invalid.
        </p>
        <button
          onClick={() => navigate('/vendors')}
          style={{
            height: '36px', padding: '0 16px', border: 'none',
            borderRadius: 'var(--radius-button)', background: 'var(--primary)',
            color: 'var(--primary-foreground)', fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
          }}
        >
          Back to Vendors
        </button>
      </div>
    );
  }

  const vendorContracts = contracts.filter(c => c.vendorId === id);
  const vendorActivity = activity.filter(a => a.entityId === id || vendorContracts.some(c => c.id === a.entityId));
  const contacts = vendorContacts.filter(c => c.vendorId === id);
  const activeCount = vendorContracts.filter(c => c.status === 'Active').length;
  const totalValue = vendorContracts.filter(c => c.status === 'Active' || c.status === 'Renewal Due').reduce((s, c) => s + c.value, 0);
  const expiringCount = vendorContracts.filter(c => {
    if (c.status !== 'Active' && c.status !== 'Renewal Due') return false;
    const d = new Date(c.endDate).getTime() - Date.now();
    return d >= 0 && d <= 90 * 86400000;
  }).length;

  const contactToDelete = deletingContactId ? contacts.find(c => c.id === deletingContactId) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back nav */}
      <button
        onClick={() => navigate('/vendors')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--foreground)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'; }}
      >
        <ArrowLeft size={14} />
        Back to Vendors
      </button>

      {/* Record Summary Header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px', height: '48px',
                borderRadius: 'var(--radius-card)',
                background: 'var(--muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Building2 size={24} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h1
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '22px',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--foreground)',
                    margin: 0,
                  }}
                >
                  {vendor.name}
                </h1>
                <StatusBadge status={vendor.status} />
                <span
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    color: 'var(--muted-foreground)',
                    background: 'var(--muted)',
                    padding: '2px 8px',
                    borderRadius: '100px',
                  }}
                >
                  {vendor.category}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '6px', flexWrap: 'wrap' }}>
                <MetaMeta icon={<Mail size={12} />} label={vendor.email} />
                <MetaMeta icon={<Phone size={12} />} label={vendor.phone || '—'} />
                <MetaMeta icon={<Globe size={12} />} label={vendor.website || '—'} />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => setShowEditModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                height: '36px', padding: '0 16px',
                border: '1px solid var(--primary)',
                borderRadius: 'var(--radius-button)',
                background: 'transparent',
                color: 'var(--primary)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(35,34,240,0.06)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <Edit2 size={14} /> Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                height: '36px', padding: '0 16px',
                border: '1px solid var(--destructive)',
                borderRadius: 'var(--radius-button)',
                background: 'transparent',
                color: 'var(--destructive)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(222,0,55,0.06)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        {/* Metadata row */}
        <div style={{ display: 'flex', gap: '24px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <MetaField label="Vendor ID" value={vendor.id} />
          <MetaField label="Tax ID / EIN" value={vendor.taxId || '—'} />
          <MetaField label="Primary Contact" value={vendor.primaryContact} />
          <MetaField label="Added" value={formatDate(vendor.createdDate)} />
          <MetaField label="Last Updated" value={formatDate(vendor.updatedDate)} />
        </div>
      </div>

      {/* KPI Tiles — max 5 */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4"
        style={{ gap: '16px' }}
      >
        <KPITile label="Total Contracts" value={vendorContracts.length} icon={FileText} subLabel="All time" />
        <KPITile label="Active Contracts" value={activeCount} icon={FileText} subLabel="Currently active" accent />
        <KPITile label="Active Value" value={totalValue === 0 ? '—' : formatCurrency(totalValue)} icon={FileText} subLabel="Active & renewal due" />
        <KPITile label="Expiring in 90d" value={expiringCount} icon={FileText} subLabel="Needs attention" />
      </div>

      {/* Tabs */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--elevation-sm)',
          overflow: 'hidden',
        }}
      >
        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                height: '40px',
                padding: '0 20px',
                border: 'none',
                borderBottom: `2px solid ${activeTab === tab ? 'var(--primary)' : 'transparent'}`,
                background: 'transparent',
                color: activeTab === tab ? 'var(--primary)' : 'var(--muted-foreground)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: activeTab === tab ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                cursor: 'pointer',
                transition: 'color 0.1s, border-color 0.1s',
                whiteSpace: 'nowrap',
              }}
            >
              {tab}
              {tab === 'Contracts' && (
                <span
                  style={{
                    marginLeft: '6px',
                    background: activeTab === tab ? 'var(--primary)' : 'var(--muted)',
                    color: activeTab === tab ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                    borderRadius: '100px',
                    padding: '1px 6px',
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-semibold)',
                  }}
                >
                  {vendorContracts.length}
                </span>
              )}
              {tab === 'Contacts' && (
                <span
                  style={{
                    marginLeft: '6px',
                    background: activeTab === tab ? 'var(--primary)' : 'var(--muted)',
                    color: activeTab === tab ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                    borderRadius: '100px',
                    padding: '1px 6px',
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-semibold)',
                  }}
                >
                  {contacts.length}
                </span>
              )}
              {tab === 'Processes' && (vendor.processAssociations ?? []).length > 0 && (
                <span
                  style={{
                    marginLeft: '6px',
                    background: activeTab === tab ? 'var(--primary)' : 'var(--muted)',
                    color: activeTab === tab ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                    borderRadius: '100px',
                    padding: '1px 6px',
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-semibold)',
                  }}
                >
                  {(vendor.processAssociations ?? []).length}
                </span>
              )}
              {tab === 'Benefits or Services' && (vendor.productIds ?? []).length > 0 && (
                <span
                  style={{
                    marginLeft: '6px',
                    background: activeTab === tab ? 'var(--primary)' : 'var(--muted)',
                    color: activeTab === tab ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                    borderRadius: '100px',
                    padding: '1px 6px',
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-semibold)',
                  }}
                >
                  {(vendor.productIds ?? []).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {/* ── Details Tab ─────────────────────────────────────────── */}
          {activeTab === 'Details' && (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ display: 'grid', gap: '24px' }}>
                <InfoCard title="Contact Information">
                  <InfoRow label="Primary Contact" value={vendor.primaryContact} />
                  <InfoRow label="Email Address" value={vendor.email} />
                  <InfoRow label="Phone Number" value={vendor.phone || '—'} />
                  <InfoRow label="Website" value={vendor.website || '—'} />
                </InfoCard>
                <InfoCard title="Business Information">
                  <InfoRow label="Category"   value={vendor.category} />
                  <InfoRow label="Status"     value={<StatusBadge status={vendor.status} />} />
                  <InfoRow label="Department" value={vendor.department || '—'} />
                  <InfoRow label="Tax ID / EIN" value={vendor.taxId || '—'} />
                  <InfoRow label="Address"    value={vendor.address || '—'} />
                </InfoCard>
              </div>

              {/* Governance & Ownership */}
              <InfoCard title="Governance & Ownership">
                <div className="grid grid-cols-1 md:grid-cols-2" style={{ display: 'grid', gap: '12px' }}>
                  <InfoRow
                    label="DMBA Vendor Manager"
                    value={
                      vendor.dmbaVendorManager
                        ? <UserChip user={vendor.dmbaVendorManager} />
                        : '—'
                    }
                  />
                  <InfoRow
                    label="Department Owner"
                    value={vendor.departmentOwner || '—'}
                  />
                  <InfoRow
                    label="Documentation"
                    value={
                      vendor.documentationLink
                        ? (
                          <a
                            href={vendor.documentationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontFamily: 'var(--font-family-primary)',
                              fontSize: 'var(--text-base)',
                              color: 'var(--primary)',
                              textDecoration: 'underline',
                              textUnderlineOffset: '2px',
                            }}
                          >
                            <Link2 size={12} />
                            SharePoint Link
                          </a>
                        )
                        : '—'
                    }
                  />
                  <InfoRow
                    label="BAA Required"
                    value={
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--text-base)',
                          fontWeight: vendor.baaRequired ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                          color: vendor.baaRequired ? 'var(--destructive)' : 'var(--muted-foreground)',
                        }}
                      >
                        <ShieldCheck size={14} style={{ color: vendor.baaRequired ? 'var(--destructive)' : 'var(--muted-foreground)' }} />
                        {vendor.baaRequired ? 'BAA Required' : 'Not Required'}
                      </span>
                    }
                  />
                </div>
                {/* Individuals Involved — full width row */}
                <div style={{ paddingTop: '4px', borderTop: '1px solid var(--border)' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '8px',
                    }}
                  >
                    Individuals Involved
                  </div>
                  {vendor.individualsInvolved && vendor.individualsInvolved.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {vendor.individualsInvolved.map(u => (
                        <UserChip key={u.id} user={u} size="sm" />
                      ))}
                    </div>
                  ) : (
                    <span
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        color: 'var(--muted-foreground)',
                      }}
                    >
                      —
                    </span>
                  )}
                </div>
              </InfoCard>

              <InfoCard title="Internal Notes">
                <p
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-regular)',
                    color: vendor.notes ? 'var(--foreground)' : 'var(--muted-foreground)',
                    margin: 0,
                    lineHeight: '1.6',
                  }}
                >
                  {vendor.notes || 'No notes added.'}
                </p>
              </InfoCard>
            </div>
          )}

          {/* ── Contacts Tab ────────────────────────────────────────── */}
          {activeTab === 'Contacts' && (
            <div>
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
                }}
              >
                {/* Type summary pills (display only) */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <TypeSummaryPill label="All" count={contacts.length} />
                  <TypeSummaryPill label="External" count={contacts.filter(c => c.type === 'External').length} color="var(--primary)" />
                  <TypeSummaryPill label="Internal" count={contacts.filter(c => c.type === 'Internal').length} color="var(--chart-2)" />
                </div>
                <button
                  onClick={() => { setEditingContact(null); setShowContactModal(true); }}
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
                  <Plus size={14} /> Add Contact
                </button>
              </div>

              {/* Empty state */}
              {contacts.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Users size={48} style={{ color: 'var(--muted-foreground)' }} />
                  <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
                    No contacts added
                  </div>
                  <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>
                    Add external vendor contacts or internal relationship owners.
                  </div>
                  <button
                    onClick={() => { setEditingContact(null); setShowContactModal(true); }}
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
                    <Plus size={14} /> Add Contact
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '12px',
                    padding: '16px',
                  }}
                >
                  {contacts.map(contact => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      onEdit={() => { setEditingContact(contact); setShowContactModal(true); }}
                      onDelete={() => setDeletingContactId(contact.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Contracts Tab ────────────────────────────────────────── */}
          {activeTab === 'Contracts' && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} style={{ color: 'var(--primary)' }} />
                  <span
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--foreground)',
                    }}
                  >
                    Linked Contracts
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
                    {vendorContracts.length}
                  </span>
                </div>
                <button
                  onClick={() => setShowAddContract(true)}
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
                  <Plus size={14} /> Add Contract
                </button>
              </div>

              {/* Empty state */}
              {vendorContracts.length === 0 && (
                <div
                  style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <FileText size={48} style={{ color: 'var(--muted-foreground)' }} />
                  <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
                    No contracts for this vendor
                  </div>
                  <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>
                    Add a contract to track this vendor's agreements.
                  </div>
                  <button
                    onClick={() => setShowAddContract(true)}
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
                    <Plus size={14} /> Add Contract
                  </button>
                </div>
              )}

              {/* Flat contract list */}
              {vendorContracts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', padding: '0 16px 16px' }}>
                  {vendorContracts.map((contract, idx) => (
                    <div
                      key={contract.id}
                      style={{
                        background: 'var(--card)',
                        borderLeft: '1px solid var(--border)',
                        borderRight: '1px solid var(--border)',
                        borderTop: '1px solid var(--border)',
                        borderBottom: idx === vendorContracts.length - 1 ? '1px solid var(--border)' : 'none',
                        borderRadius: idx === 0 && vendorContracts.length === 1
                          ? 'var(--radius-card)'
                          : idx === 0
                          ? 'var(--radius-card) var(--radius-card) 0 0'
                          : idx === vendorContracts.length - 1
                          ? '0 0 var(--radius-card) var(--radius-card)'
                          : '0',
                        padding: '10px 16px',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--muted)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--card)'; }}
                    >
                      <FileText size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />

                      {/* ID link */}
                      <button
                        type="button"
                        onClick={() => navigate(`/contracts/${contract.id}`)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--text-base)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--primary)',
                          flex: '0 0 auto',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                      >
                        {contract.id}
                      </button>

                      {/* Status badge */}
                      <StatusBadge status={contract.status} />

                      {/* Title */}
                      <span
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--text-base)',
                          fontWeight: 'var(--font-weight-regular)',
                          color: 'var(--foreground)',
                          flex: 1,
                          minWidth: 0,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                      >
                        {contract.title}
                      </span>

                      {/* Value + Expires metadata */}
                      <span
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '12px',
                          fontWeight: 'var(--font-weight-regular)',
                          color: 'var(--muted-foreground)',
                          flexShrink: 0,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {contract.value > 0 ? formatCurrency(contract.value) : '—'} &middot; Exp. {formatDate(contract.endDate)}
                      </span>

                      {/* Unlink button */}
                      <button
                        type="button"
                        onClick={() => setRemovingContractId(contract.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          height: '24px', padding: '0 8px',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-button)',
                          background: 'transparent',
                          color: 'var(--muted-foreground)',
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '11px',
                          fontWeight: 'var(--font-weight-semibold)',
                          cursor: 'pointer', flexShrink: 0,
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
                        <X size={10} /> Unlink
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Contract unlink confirmation dialog */}
              {removingContractId && (() => {
                const contractToRemove = vendorContracts.find(c => c.id === removingContractId);
                if (!contractToRemove) return null;
                return (
                  <div
                    style={{
                      position: 'fixed', inset: 0, zIndex: 50,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '24px', background: 'rgba(0,0,0,0.4)',
                    }}
                    onClick={e => { if (e.target === e.currentTarget) setRemovingContractId(null); }}
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
                        Unlink Contract
                      </h3>
                      <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)', margin: 0, lineHeight: '22px' }}>
                        Are you sure you want to unlink{' '}
                        <strong style={{ color: 'var(--foreground)' }}>{contractToRemove.title}</strong>
                        {' '}from this vendor?
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
                        The contract will be disassociated from this vendor. The contract record itself will not be deleted.
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => setRemovingContractId(null)}
                          style={{
                            height: '36px', padding: '0 16px',
                            border: '1px solid var(--border)', borderRadius: 'var(--radius-button)',
                            background: 'transparent', color: 'var(--foreground)',
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: 'var(--text-base)',
                            fontWeight: 'var(--font-weight-semibold)',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            updateContract(removingContractId, { vendorId: '', vendorName: '' });
                            setRemovingContractId(null);
                          }}
                          style={{
                            height: '36px', padding: '0 16px',
                            border: 'none', borderRadius: 'var(--radius-button)',
                            background: 'var(--destructive)', color: 'var(--destructive-foreground)',
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: 'var(--text-base)',
                            fontWeight: 'var(--font-weight-semibold)',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                        >
                          Unlink
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── Processes Tab ────────────────────────────────────────── */}
          {activeTab === 'Processes' && (
            <VendorProcessesTab
              vendor={vendor}
              navigate={navigate}
              onUpdateVendor={(changes) => updateVendor(vendor.id, changes)}
            />
          )}

          {/* ── Benefits or Services Tab ──────────────────────────────── */}
          {activeTab === 'Benefits or Services' && (
            <VendorProductsTab
              vendor={vendor}
              allProducts={allProducts}
              linkedProducts={linkedProducts}
              navigate={navigate}
              onUpdateVendor={(changes) => updateVendor(vendor.id, changes)}
            />
          )}

          {/* ── Risks Tab ────────────────────────────────────────────── */}
          {activeTab === 'Risks' && (
            <VendorRisksTab
              vendorId={vendor.id}
              risks={risks}
              vendorRisks={vendorRisks}
              onVendorRisksChange={(updated) => {
                setVendorRisks(updated);
                saveVendorRisks(updated);
              }}
            />
          )}

          {/* ── Activity Tab ─────────────────────────────────────────── */}
          {activeTab === 'Activity' && (
            <div style={{ padding: '8px 0' }}>
              {vendorActivity.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', lineHeight: 1, marginBottom: '8px' }}>📋</div>
                  <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
                    No activity recorded
                  </div>
                  <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', marginTop: '4px' }}>
                    Activity will appear here when changes are made.
                  </div>
                </div>
              ) : vendorActivity.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '12px', padding: '12px 24px', borderBottom: '1px solid var(--border)' }}>
                  <div
                    style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: 'var(--primary)', color: 'var(--primary-foreground)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '11px', fontWeight: 'var(--font-weight-bold)', flexShrink: 0,
                    }}
                  >
                    {item.userInitials}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)', lineHeight: '1.4' }}>
                      {item.action}
                    </div>
                    <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                      {item.user} · {formatDate(item.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Vendor Modal ─────────────────────────────────────────── */}
      <VendorFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={(data) => { updateVendor(vendor.id, data); setShowEditModal(false); }}
        initialData={vendor}
      />

      {/* ── Add Contract Modal ────────────────────────────────────────── */}
      <ContractFormModal
        isOpen={showAddContract}
        onClose={() => setShowAddContract(false)}
        onSave={addContract}
        vendors={vendors.map(v => ({ id: v.id, name: v.name }))}
        defaultVendorId={vendor.id}
      />

      {/* ── Add / Edit Contact Modal ──────────────────────────────────── */}
      <ContactFormModal
        isOpen={showContactModal}
        onClose={() => { setShowContactModal(false); setEditingContact(null); }}
        onSave={(data) => {
          if (editingContact) {
            updateVendorContact(editingContact.id, data);
          } else {
            addVendorContact(data);
          }
        }}
        vendorId={vendor.id}
        initialData={editingContact}
      />

      {/* ── Delete Contact Confirm ────────────────────────────────────── */}
      <FormModal
        title="Remove Contact"
        isOpen={!!deletingContactId}
        onClose={() => setDeletingContactId(null)}
        onSubmit={() => {
          if (deletingContactId) deleteVendorContact(deletingContactId);
          setDeletingContactId(null);
        }}
        submitLabel="Remove Contact"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)', margin: 0 }}>
            Are you sure you want to remove{' '}
            <strong>{contactToDelete?.name ?? 'this contact'}</strong> from{' '}
            <strong>{vendor.name}</strong>?
          </p>
          <div
            style={{
              padding: '12px',
              background: 'rgba(222,0,55,0.06)',
              border: '1px solid rgba(222,0,55,0.2)',
              borderRadius: 'var(--radius-card)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              color: 'var(--destructive)',
            }}
          >
            This action cannot be undone.
          </div>
        </div>
      </FormModal>

      {/* ── Delete Vendor Confirm ─────────────────────────────────────── */}
      <FormModal
        title="Delete Vendor"
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onSubmit={() => { deleteVendor(vendor.id); navigate('/vendors'); }}
        submitLabel="Delete Vendor"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)', margin: 0 }}>
            Are you sure you want to delete <strong>{vendor.name}</strong>? This will also remove all{' '}
            <strong>{vendorContracts.length} contract(s)</strong> associated with this vendor.
          </p>
          <div
            style={{
              padding: '12px',
              background: 'rgba(222,0,55,0.06)',
              border: '1px solid rgba(222,0,55,0.2)',
              borderRadius: 'var(--radius-card)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              color: 'var(--destructive)',
            }}
          >
            This action cannot be undone.
          </div>
        </div>
      </FormModal>
    </div>
  );
}

// ── Helper components ────────────────────────────────────────────────────────

function MetaMeta({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ color: 'var(--muted-foreground)', display: 'flex' }}>{icon}</span>
      <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>
        {label}
      </span>
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)', marginTop: '2px' }}>
        {value}
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '10px 16px',
          background: 'var(--muted)',
          borderBottom: '1px solid var(--border)',
          fontFamily: 'var(--font-family-primary)',
          fontSize: '12px',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--foreground)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {title}
      </div>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
      <div
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--muted-foreground)',
          minWidth: '140px',
          flexShrink: 0,
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
          flex: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function TypeSummaryPill({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color?: string;
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '2px 10px',
        borderRadius: '100px',
        border: '1px solid var(--border)',
        background: 'var(--muted)',
        fontFamily: 'var(--font-family-primary)',
        fontSize: '12px',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--foreground)',
      }}
    >
      {color && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
          }}
        />
      )}
      {label}
      <span
        style={{
          marginLeft: '2px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '100px',
          padding: '0 5px',
          fontSize: '11px',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--muted-foreground)',
        }}
      >
        {count}
      </span>
    </div>
  );
}

function ContactCard({
  contact,
  onEdit,
  onDelete,
}: {
  contact: VendorContact;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const initials = contact.name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isInternal = contact.type === 'Internal';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px solid ${hovered ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-card)',
        background: 'var(--card)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'border-color 0.15s',
      }}
    >
      {/* Top row: avatar + name/title + type badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Avatar */}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: isInternal ? 'rgba(0,167,142,0.12)' : 'rgba(35,34,240,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontFamily: 'var(--font-family-primary)',
            fontSize: '13px',
            fontWeight: 'var(--font-weight-semibold)',
            color: isInternal ? 'var(--chart-2)' : 'var(--primary)',
          }}
        >
          {initials}
        </div>

        {/* Name + title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              lineHeight: '20px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {contact.name}
          </div>
          {contact.title && (
            <div
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--muted-foreground)',
                marginTop: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {contact.title}
            </div>
          )}
        </div>

        {/* Type badge */}
        <span
          style={{
            height: '20px',
            padding: '0 8px',
            borderRadius: '100px',
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '11px',
            fontFamily: 'var(--font-family-primary)',
            fontWeight: 'var(--font-weight-semibold)',
            flexShrink: 0,
            background: isInternal ? 'rgba(0,167,142,0.12)' : 'rgba(35,34,240,0.1)',
            color: isInternal ? 'var(--chart-2)' : 'var(--primary)',
          }}
        >
          {contact.type}
        </span>
      </div>

      {/* Contact detail rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {contact.email && (
          <ContactDetailRow icon={<Mail size={12} />} value={contact.email} href={`mailto:${contact.email}`} />
        )}
        {contact.phone && (
          <ContactDetailRow icon={<Phone size={12} />} value={contact.phone} href={`tel:${contact.phone}`} />
        )}
        {contact.department && (
          <ContactDetailRow icon={<Briefcase size={12} />} value={contact.department} />
        )}
      </div>

      {/* Notes */}
      {contact.notes && (
        <div
          style={{
            padding: '8px 10px',
            background: 'var(--muted)',
            borderRadius: 'var(--radius-card)',
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-regular)',
            color: 'var(--muted-foreground)',
            lineHeight: '1.5',
          }}
        >
          {contact.notes}
        </div>
      )}

      {/* Action row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '4px',
          paddingTop: '4px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <button
          onClick={onEdit}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            height: '28px', padding: '0 10px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-button)',
            background: 'transparent',
            color: 'var(--foreground)',
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--muted)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <Edit2 size={12} /> Edit
        </button>
        <button
          onClick={onDelete}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            height: '28px', padding: '0 10px',
            border: '1px solid transparent',
            borderRadius: 'var(--radius-button)',
            background: 'transparent',
            color: 'var(--destructive)',
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(222,0,55,0.06)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <Trash2 size={12} /> Remove
        </button>
      </div>
    </div>
  );
}

function ContactDetailRow({
  icon,
  value,
  href,
}: {
  icon: React.ReactNode;
  value: string;
  href?: string;
}) {
  const inner = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ color: 'var(--muted-foreground)', display: 'flex', flexShrink: 0 }}>{icon}</span>
      <span
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '12px',
          color: href ? 'var(--primary)' : 'var(--foreground)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </span>
    </div>
  );

  if (href) {
    return (
      <a href={href} style={{ textDecoration: 'none' }}>
        {inner}
      </a>
    );
  }

  return inner;
}

// ── Processes Tab Component ──────────────────────────────────────────

function VendorProcessesTab({ vendor, navigate, onUpdateVendor }: { vendor: import('../data/mockData').Vendor; navigate: (path: string) => void; onUpdateVendor: (changes: Partial<import('../data/mockData').Vendor>) => void }) {
  const allProcesses = loadProcesses();
  const associations = vendor.processAssociations ?? [];
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [expandedProcessId, setExpandedProcessId] = useState<string | null>(null);
  const [deletingAssoc, setDeletingAssoc] = useState<{ processId: string; subProcessId?: string } | null>(null);

  function handleAddAssociation(processId: string, subProcessId?: string) {
    const newAssoc = subProcessId ? { processId, subProcessId } : { processId };
    const exists = associations.some(
      a => a.processId === processId && (a.subProcessId ?? undefined) === (subProcessId ?? undefined)
    );
    if (exists) return;
    onUpdateVendor({
      processAssociations: [...associations, newAssoc],
    });
  }

  function handleRemoveAssociation(processId: string, subProcessId?: string) {
    onUpdateVendor({
      processAssociations: associations.filter(
        a => !(a.processId === processId && (a.subProcessId ?? undefined) === (subProcessId ?? undefined))
      ),
    });
    setDeletingAssoc(null);
  }

  const resolved = associations.map(assoc => {
    const proc = allProcesses.find(p => p.id === assoc.processId);
    const sub = assoc.subProcessId
      ? (proc?.subProcesses ?? []).find(sp => sp.id === assoc.subProcessId)
      : null;
    return { assoc, proc, sub };
  }).filter(a => a.proc);

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
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} style={{ color: 'var(--primary)' }} />
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
            }}
          >
            Linked Processes & Sub-Processes
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
            {resolved.length}
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
          <Plus size={14} /> Add Process
        </button>
      </div>

      {/* ─── Add Process Picker ─────────────────────────────── */}
      {showAddPicker && (
        <div
          style={{
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
            Select a Process or Sub-Process to Associate
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
            {allProcesses.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--muted-foreground)',
                }}
              >
                No processes available. Create processes in the Process Register first.
              </div>
            ) : (
              allProcesses.map(proc => {
                const hasSubs = (proc.subProcesses ?? []).length > 0;
                const isExpanded = expandedProcessId === proc.id;
                const procLevelLinked = associations.some(a => a.processId === proc.id && !a.subProcessId);
                const statusColor = proc.status === 'Active' ? '#1C8A45' : proc.status === 'Draft' ? '#E07B00' : '#6B7489';
                const statusBg = proc.status === 'Active' ? '#E8F5EE' : proc.status === 'Draft' ? '#FFF3E0' : '#F0F0F0';

                return (
                  <div key={proc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                      }}
                    >
                      {hasSubs ? (
                        <button
                          type="button"
                          onClick={() => setExpandedProcessId(isExpanded ? null : proc.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            color: 'var(--muted-foreground)',
                            flexShrink: 0,
                          }}
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      ) : (
                        <span style={{ width: '14px', flexShrink: 0 }} />
                      )}

                      <Activity size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <span
                        style={{
                          flex: 1,
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--text-base)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--foreground)',
                        }}
                      >
                        {proc.name}
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
                        {proc.status}
                      </span>
                      <button
                        type="button"
                        disabled={procLevelLinked}
                        onClick={() => handleAddAssociation(proc.id)}
                        style={{
                          height: '24px',
                          padding: '0 10px',
                          border: `1px solid ${procLevelLinked ? 'var(--border)' : 'var(--primary)'}`,
                          borderRadius: 'var(--radius-button)',
                          background: procLevelLinked ? 'var(--muted)' : 'transparent',
                          color: procLevelLinked ? 'var(--muted-foreground)' : 'var(--primary)',
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '12px',
                          fontWeight: 'var(--font-weight-semibold)',
                          cursor: procLevelLinked ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          flexShrink: 0,
                        }}
                      >
                        {procLevelLinked ? 'Linked' : (<><Plus size={10} /> Add</>)}
                      </button>
                    </div>

                    {/* Sub-process rows */}
                    {isExpanded && hasSubs && (
                      <div style={{ paddingLeft: '36px', borderTop: '1px solid var(--border)', background: 'var(--muted)' }}>
                        {(proc.subProcesses ?? []).map(sp => {
                          const subLinked = associations.some(a => a.processId === proc.id && a.subProcessId === sp.id);
                          return (
                            <div
                              key={sp.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 12px',
                                borderBottom: '1px solid var(--border)',
                              }}
                            >
                              <GitBranch size={12} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                              <span
                                style={{
                                  flex: 1,
                                  fontFamily: 'var(--font-family-primary)',
                                  fontSize: '12px',
                                  fontWeight: 'var(--font-weight-regular)',
                                  color: 'var(--foreground)',
                                }}
                              >
                                {sp.name}
                              </span>
                              <button
                                type="button"
                                disabled={subLinked}
                                onClick={() => handleAddAssociation(proc.id, sp.id)}
                                style={{
                                  height: '22px',
                                  padding: '0 8px',
                                  border: `1px solid ${subLinked ? 'var(--border)' : 'var(--primary)'}`,
                                  borderRadius: 'var(--radius-button)',
                                  background: subLinked ? 'var(--muted)' : 'transparent',
                                  color: subLinked ? 'var(--muted-foreground)' : 'var(--primary)',
                                  fontFamily: 'var(--font-family-primary)',
                                  fontSize: '11px',
                                  fontWeight: 'var(--font-weight-semibold)',
                                  cursor: subLinked ? 'default' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  flexShrink: 0,
                                }}
                              >
                                {subLinked ? 'Linked' : (<><Plus size={9} /> Add</>)}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => { setShowAddPicker(false); setExpandedProcessId(null); }}
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

      {/* ─── Association Cards ────────────────────────────── */}
      {resolved.length === 0 && !showAddPicker ? (
        <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <Activity size={48} style={{ color: 'var(--muted-foreground)' }} />
          <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
            No process associations
          </div>
          <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>
            Associate this vendor with processes or sub-processes.
          </div>
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
            <Plus size={14} /> Add Process
          </button>
        </div>
      ) : resolved.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 16px 16px' }}>
          {resolved.map((item, idx) => {
            const proc = item.proc!;
            const statusColor = proc.status === 'Active' ? '#1C8A45' : proc.status === 'Draft' ? '#E07B00' : '#6B7489';
            const statusBg = proc.status === 'Active' ? '#E8F5EE' : proc.status === 'Draft' ? '#FFF3E0' : '#F0F0F0';
            return (
              <div
                key={`${item.assoc.processId}-${item.assoc.subProcessId ?? 'root'}-${idx}`}
                style={{
                  background: 'var(--card)',
                  borderLeft: '1px solid var(--border)',
                  borderRight: '1px solid var(--border)',
                  borderTop: '1px solid var(--border)',
                  borderBottom: idx === resolved.length - 1 ? '1px solid var(--border)' : 'none',
                  borderRadius: idx === 0 && resolved.length === 1
                    ? 'var(--radius-card)'
                    : idx === 0
                    ? 'var(--radius-card) var(--radius-card) 0 0'
                    : idx === resolved.length - 1
                    ? '0 0 var(--radius-card) var(--radius-card)'
                    : '0',
                  padding: '10px 16px',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--muted)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--card)'; }}
              >
                <Activity size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />

                {/* Process name link */}
                <button
                  type="button"
                  onClick={() => navigate(`/processes/${proc.id}`)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    textAlign: 'left',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--primary)',
                    flex: '0 0 auto',
                    maxWidth: '220px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >
                  {proc.name}
                </button>

                {/* Sub-process label */}
                {item.sub && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <GitBranch size={11} style={{ color: 'var(--muted-foreground)' }} />
                    <span
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '12px',
                        fontWeight: 'var(--font-weight-regular)',
                        color: 'var(--muted-foreground)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        maxWidth: '160px',
                      }}
                    >
                      {item.sub.name}
                    </span>
                  </span>
                )}

                {/* Status badge */}
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
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-semibold)',
                    flexShrink: 0,
                  }}
                >
                  {proc.status}
                </span>

                {/* Spacer */}
                <span style={{ flex: 1 }} />

                {/* Unlink button */}
                <button
                  type="button"
                  onClick={() => setDeletingAssoc({ processId: item.assoc.processId, subProcessId: item.assoc.subProcessId })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    height: '24px', padding: '0 8px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-button)',
                    background: 'transparent',
                    color: 'var(--muted-foreground)',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-semibold)',
                    cursor: 'pointer', flexShrink: 0,
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
                  <X size={10} /> Unlink
                </button>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* ─── Delete Confirmation Dialog ─────────────────── */}
      {deletingAssoc && (
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
          onClick={e => { if (e.target === e.currentTarget) setDeletingAssoc(null); }}
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
              Remove Process Association
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
              <strong style={{ color: 'var(--foreground)' }}>
                {(() => {
                  const proc = allProcesses.find(p => p.id === deletingAssoc.processId);
                  const sub = deletingAssoc.subProcessId
                    ? (proc?.subProcesses ?? []).find(sp => sp.id === deletingAssoc.subProcessId)
                    : null;
                  return sub ? `${proc?.name} / ${sub.name}` : proc?.name ?? deletingAssoc.processId;
                })()}
              </strong>
              ?
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
              This will unlink the process from this vendor. The process itself will not be deleted.
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
                onClick={() => setDeletingAssoc(null)}
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
                onClick={() => handleRemoveAssociation(deletingAssoc.processId, deletingAssoc.subProcessId)}
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

// ── Products Tab Component ────────────────────────────────────────────────────

const PRODUCT_STATUS_STYLE: Record<string, { background: string; color: string }> = {
  Active:  { background: '#E8F5EE', color: '#1C8A45' },
  Draft:   { background: '#FFF3E0', color: '#E07B00' },
  Retired: { background: '#F0F0F0', color: '#6B7489' },
  Sunset:  { background: '#FDE8E8', color: '#C0392B' },
};

function VendorProductsTab({
  vendor,
  allProducts,
  linkedProducts,
  navigate,
  onUpdateVendor,
}: {
  vendor: import('../data/mockData').Vendor;
  allProducts: Product[];
  linkedProducts: Product[];
  navigate: (path: string) => void;
  onUpdateVendor: (changes: Partial<import('../data/mockData').Vendor>) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [removingProductId, setRemovingProductId] = useState<string | null>(null);

  const currentProductIds = vendor.productIds ?? [];

  function handleLink(productId: string) {
    if (currentProductIds.includes(productId)) return;
    const newIds = [...currentProductIds, productId];
    onUpdateVendor({ productIds: newIds });
    syncVendorProductLinks(vendor.id, newIds, currentProductIds);
  }

  function handleUnlink(productId: string) {
    const newIds = currentProductIds.filter(id => id !== productId);
    onUpdateVendor({ productIds: newIds });
    syncVendorProductLinks(vendor.id, newIds, currentProductIds);
    setRemovingProductId(null);
  }

  const filteredProducts = allProducts.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const productToRemove = removingProductId
    ? linkedProducts.find(p => p.id === removingProductId)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
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
        }}
      >
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
            Linked Benefits or Services
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
            {linkedProducts.length}
          </span>
        </div>
        <button
          onClick={() => setShowPicker(o => !o)}
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
          <Plus size={14} /> Add Service
        </button>
      </div>

      {/* ─── Service Picker Panel ─────────────────────────────────── */}
      {showPicker && (
        <div
          style={{
            borderBottom: '1px solid var(--border)',
            background: 'var(--muted)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
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
            }}
          >
            Select a Benefit or Service to Associate
          </div>

          {/* Search box */}
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted-foreground)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search by name, type or category"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '36px',
                paddingLeft: '32px',
                paddingRight: '12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-button)',
                background: 'var(--card)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--foreground)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--primary)'; }}
              onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--border)'; }}
            />
          </div>

          {/* Scrollable product list */}
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              background: 'var(--card)',
              maxHeight: '280px',
              overflowY: 'auto',
            }}
          >
            {filteredProducts.length === 0 ? (
              <div
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--muted-foreground)',
                }}
              >
                {allProducts.length === 0
                  ? 'No benefits or services available. Create them in the Benefits or Services Register first.'
                  : 'No benefits or services match your search.'}
              </div>
            ) : (
              filteredProducts.map((prod, idx) => {
                const isLinked = currentProductIds.includes(prod.id);
                const ss = PRODUCT_STATUS_STYLE[prod.status] ?? PRODUCT_STATUS_STYLE.Retired;
                return (
                  <div
                    key={prod.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '9px 12px',
                      borderBottom: idx < filteredProducts.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <Package size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--text-base)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--foreground)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {prod.name}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '12px',
                          fontWeight: 'var(--font-weight-regular)',
                          color: 'var(--muted-foreground)',
                        }}
                      >
                        {prod.type} &middot; {prod.category}
                      </div>
                    </div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: '18px',
                        padding: '0 6px',
                        borderRadius: '100px',
                        background: ss.background,
                        color: ss.color,
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '11px',
                        fontWeight: 'var(--font-weight-semibold)',
                        flexShrink: 0,
                      }}
                    >
                      {prod.status}
                    </span>
                    <button
                      type="button"
                      disabled={isLinked}
                      onClick={() => handleLink(prod.id)}
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
                        whiteSpace: 'nowrap',
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
              onClick={() => { setShowPicker(false); setSearchQuery(''); }}
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

      {/* ─── Empty State ─────────────────────────────────────────── */}
      {linkedProducts.length === 0 && !showPicker && (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Package size={48} style={{ color: 'var(--muted-foreground)' }} />
          <div
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '14px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
            }}
          >
            No benefits or services linked
          </div>
          <div
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--muted-foreground)',
            }}
          >
            Associate this vendor with one or more benefits or services from the register.
          </div>
          <button
            onClick={() => setShowPicker(true)}
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
            <Plus size={14} /> Add Benefit or Service
          </button>
        </div>
      )}

      {/* ─── Linked Service List ─────────────────────────────────── */}
      {linkedProducts.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '0 16px 16px',
          }}
        >
          {linkedProducts.map((prod, idx) => {
            const ss = PRODUCT_STATUS_STYLE[prod.status] ?? PRODUCT_STATUS_STYLE.Retired;
            return (
              <div
                key={prod.id}
                style={{
                  background: 'var(--card)',
                  borderLeft: '1px solid var(--border)',
                  borderRight: '1px solid var(--border)',
                  borderTop: '1px solid var(--border)',
                  borderBottom: idx === linkedProducts.length - 1 ? '1px solid var(--border)' : 'none',
                  borderRadius: idx === 0 && linkedProducts.length === 1
                    ? 'var(--radius-card)'
                    : idx === 0
                    ? 'var(--radius-card) var(--radius-card) 0 0'
                    : idx === linkedProducts.length - 1
                    ? '0 0 var(--radius-card) var(--radius-card)'
                    : '0',
                  padding: '10px 16px',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.background = 'var(--color-neutral-100, #F0F2F7)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.background = 'var(--card)';
                }}
              >
                {/* Name */}
                <button
                  type="button"
                  onClick={() => navigate(`/products/${prod.id}`)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    textAlign: 'left',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--primary)',
                    flex: '0 0 auto',
                    maxWidth: '220px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {prod.name}
                </button>

                {/* Status badge */}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    height: '20px',
                    padding: '0 8px',
                    borderRadius: '100px',
                    background: ss.background,
                    color: ss.color,
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-semibold)',
                    flexShrink: 0,
                  }}
                >
                  {prod.status}
                </span>

                {/* Metadata */}
                <span
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-regular)',
                    color: 'var(--muted-foreground)',
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {prod.type} &middot; {prod.category}
                </span>

                {/* Unlink action */}
                <button
                  type="button"
                  onClick={() => setRemovingProductId(prod.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    height: '24px',
                    padding: '0 8px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-button)',
                    background: 'transparent',
                    color: 'var(--muted-foreground)',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-semibold)',
                    cursor: 'pointer',
                    flexShrink: 0,
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
                    <X size={10} /> Unlink
                  </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Unlink Confirm Dialog ──────────────────────────────── */}
      {removingProductId && productToRemove && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => setRemovingProductId(null)}
        >
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              padding: '24px',
              maxWidth: '440px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '18px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
              }}
            >
              Remove Benefit or Service Association
            </div>
            <p
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--foreground)',
                margin: 0,
              }}
            >
              Are you sure you want to unlink{' '}
              <strong>{productToRemove.name}</strong> from this vendor?
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
              This will remove the association only. The benefit or service itself will not be deleted.
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
                onClick={() => setRemovingProductId(null)}
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
                onClick={() => handleUnlink(removingProductId)}
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