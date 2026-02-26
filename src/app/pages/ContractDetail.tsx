import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Edit2, Trash2, FileText, Calendar, DollarSign, User,
  RefreshCw, ExternalLink, Bot, Infinity, Users, PenLine, Megaphone,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/shared/StatusBadge';
import { ContractFormModal } from '../components/shared/ContractFormModal';
import { FormModal } from '../components/shared/FormModal';
import { UserChip } from '../components/shared/UserPicker';
import { formatDate, formatCurrency, daysUntil } from '../data/mockData';

const TABS = ['Details', 'Lifecycle', 'Activity'] as const;
type Tab = typeof TABS[number];

// Lifecycle stage order
const LIFECYCLE_STAGES = [
  { key: 'Pending', label: 'Pending', description: 'Contract is being drafted or negotiated.' },
  { key: 'Active', label: 'Active', description: 'Contract is currently in effect.' },
  { key: 'Renewal Due', label: 'Renewal Due', description: 'Contract is approaching expiration and requires renewal decision.' },
  { key: 'Expired', label: 'Expired', description: 'Contract has passed its end date without renewal.' },
  { key: 'Terminated', label: 'Terminated', description: 'Contract was ended before its expiration date.' },
];

export function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vendors, contracts, activity, updateContract, deleteContract } = useApp();

  const contract = contracts.find(c => c.id === id);
  const [activeTab, setActiveTab] = useState<Tab>('Details');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!contract) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: '16px' }}>
        <FileText size={48} style={{ color: 'var(--muted-foreground)' }} />
        <h2 style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0 }}>
          Contract not found
        </h2>
        <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', margin: 0 }}>
          This contract may have been deleted or the URL is invalid.
        </p>
        <button
          onClick={() => navigate('/contracts')}
          style={{
            height: '36px', padding: '0 16px', border: 'none',
            borderRadius: 'var(--radius-button)', background: 'var(--primary)',
            color: 'var(--primary-foreground)', fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
          }}
        >
          Back to Contracts
        </button>
      </div>
    );
  }

  const vendor = vendors.find(v => v.id === contract.vendorId);
  const contractActivity = activity.filter(a => a.entityId === contract.id);
  const daysLeft = daysUntil(contract.endDate);
  const isActive = contract.status === 'Active' || contract.status === 'Renewal Due';

  // Calculate contract duration in months
  const start = new Date(contract.startDate);
  const end = new Date(contract.endDate);
  const durationMonths = Math.round(
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  );

  const currentStageIdx = LIFECYCLE_STAGES.findIndex(s => s.key === contract.status);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back nav */}
      <button
        onClick={() => navigate('/contracts')}
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
        Back to Contracts
      </button>

      {/* Record Summary Header */}
      <div
        style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)', padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1 }}>
            <div
              style={{
                width: '48px', height: '48px',
                borderRadius: 'var(--radius-card)',
                background: 'var(--muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <FileText size={24} style={{ color: 'var(--primary)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h1
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '22px', fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--foreground)', margin: 0,
                  }}
                >
                  {contract.title}
                </h1>
                <StatusBadge status={contract.status} />
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  onClick={() => navigate(`/vendors/${contract.vendorId}`)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--primary)',
                  }}
                >
                  {contract.vendorName}
                </button>
                <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)', background: 'var(--muted)', padding: '2px 8px', borderRadius: '100px' }}>
                  {contract.type}
                </span>
                <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                  {contract.department}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => setShowEditModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                height: '36px', padding: '0 16px',
                border: '1px solid var(--primary)', borderRadius: 'var(--radius-button)',
                background: 'transparent', color: 'var(--primary)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
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
                border: '1px solid var(--destructive)', borderRadius: 'var(--radius-button)',
                background: 'transparent', color: 'var(--destructive)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(222,0,55,0.06)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        {/* Key metadata */}
        <div style={{ display: 'flex', gap: '24px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <MetaField label="Contract ID" value={contract.id} />
          <MetaField label="Owner" value={contract.owner} />
          <MetaField label="Start Date" value={formatDate(contract.startDate)} />
          <MetaField label="End Date" value={
            <span style={{ color: isActive && daysLeft >= 0 && daysLeft <= 30 ? 'var(--destructive)' : 'inherit' }}>
              {formatDate(contract.endDate)}
              {isActive && daysLeft >= 0 && <span style={{ marginLeft: '6px', fontSize: '11px', color: daysLeft <= 30 ? 'var(--destructive)' : '#E07B00' }}>({daysLeft}d left)</span>}
            </span>
          } />
          <MetaField label="Duration" value={`${durationMonths} months`} />
          <MetaField label="Contract Value" value={contract.value === 0 ? '—' : formatCurrency(contract.value)} />
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)', overflow: 'hidden',
        }}
      >
        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                height: '40px', padding: '0 20px', border: 'none',
                borderBottom: `2px solid ${activeTab === tab ? 'var(--primary)' : 'transparent'}`,
                background: 'transparent',
                color: activeTab === tab ? 'var(--primary)' : 'var(--muted-foreground)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: activeTab === tab ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                cursor: 'pointer', transition: 'color 0.1s, border-color 0.1s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Details Tab */}
        {activeTab === 'Details' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Row 1: Contract Terms + Financials */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="grid-cols-1 md:grid-cols-2">
              <InfoCard title="Contract Terms">
                <InfoRow label="Contract Type" value={contract.type} />
                <InfoRow label="Status" value={<StatusBadge status={contract.status} />} />
                <InfoRow label="Auto-Renew" value={contract.autoRenew ? 'Yes' : 'No'} />
                <InfoRow label="Notice Period" value={`${contract.noticePeriodDays} days`} />
                <InfoRow label="Department" value={contract.department} />
              </InfoCard>

              <InfoCard title="Financials & Timeline">
                <InfoRow label="Contract Value" value={contract.value === 0 ? '—' : formatCurrency(contract.value)} />
                <InfoRow label="Start Date" value={formatDate(contract.startDate)} />
                <InfoRow label="End Date" value={formatDate(contract.endDate)} />
                <InfoRow label="Duration" value={`${durationMonths} months`} />
                <InfoRow
                  label="Days Remaining"
                  value={
                    daysLeft < 0
                      ? 'Expired'
                      : <span style={{ color: daysLeft <= 30 ? 'var(--destructive)' : daysLeft <= 90 ? '#E07B00' : '#1C8A45', fontWeight: 'var(--font-weight-semibold)' }}>
                          {daysLeft} days
                        </span>
                  }
                />
              </InfoCard>
            </div>

            {/* Row 2: Governance Flags + People & Ownership */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="grid-cols-1 md:grid-cols-2">
              <InfoCard title="Governance Flags">
                <InfoRow
                  label="Vendor Comms Direct"
                  value={<FlagBadge value={contract.vendorCommunicationsDirect} yesLabel="Yes" noLabel="No" />}
                />
                <InfoRow
                  label="Has AI Features"
                  value={<FlagBadge value={contract.hasAIFeatures} yesLabel="Yes — AI Enabled" noLabel="No" warnIfTrue />}
                />
                <InfoRow
                  label="Evergreen"
                  value={<FlagBadge value={contract.evergreen} yesLabel="Yes — Evergreen" noLabel="No" warnIfTrue />}
                />
              </InfoCard>

              <InfoCard title="People & Ownership">
                <InfoRow label="Contract Owner" value={contract.owner || '—'} />
                <InfoRow label="Budget Manager" value={contract.budgetManager || '—'} />
                {contract.businessOwners && contract.businessOwners.length > 0 && (
                  <InfoRow
                    label="Business Owner(s)"
                    value={
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {contract.businessOwners.map(u => <UserChip key={u.id} user={u} size="sm" />)}
                      </div>
                    }
                  />
                )}
                {contract.individualsInvolved && contract.individualsInvolved.length > 0 && (
                  <InfoRow
                    label="Individuals Involved"
                    value={
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {contract.individualsInvolved.map(u => <UserChip key={u.id} user={u} size="sm" />)}
                      </div>
                    }
                  />
                )}
              </InfoCard>
            </div>

            {/* Row 3: Signatories */}
            <InfoCard title="Signatories">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--muted-foreground)',
                    marginBottom: '6px',
                  }}>
                    Company Signatory
                  </div>
                  {contract.companySignatory ? (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      padding: '8px 12px',
                      background: 'var(--muted)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-input)',
                    }}>
                      <PenLine size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <span style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--foreground)',
                      }}>
                        {contract.companySignatory}
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>—</span>
                  )}
                </div>

                <div>
                  <div style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--muted-foreground)',
                    marginBottom: '6px',
                  }}>
                    Vendor Signatory
                  </div>
                  {contract.vendorSignatory ? (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      padding: '8px 12px',
                      background: 'var(--muted)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-input)',
                    }}>
                      <PenLine size={13} style={{ color: 'var(--chart-2)', flexShrink: 0 }} />
                      <span style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--foreground)',
                      }}>
                        {contract.vendorSignatory}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '11px',
                        color: 'var(--muted-foreground)',
                      }}>
                        · {contract.vendorName}
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>—</span>
                  )}
                </div>
              </div>
            </InfoCard>

            {/* Row 4: Vendor Information */}
            <InfoCard title="Vendor Information">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <InfoRow label="Vendor Name" value={
                    <button
                      onClick={() => navigate(`/vendors/${contract.vendorId}`)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--primary)', textDecoration: 'underline' }}
                    >
                      {contract.vendorName}
                    </button>
                  } />
                  {vendor && <InfoRow label="Category" value={vendor.category} />}
                  {vendor && <InfoRow label="Status" value={<StatusBadge status={vendor.status} />} />}
                </div>
              </div>
            </InfoCard>

            {/* Row 5: SharePoint Document Link */}
            {contract.sharepointLink && (
              <InfoCard title="Document Link">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: 'var(--radius-input)',
                    background: 'rgba(35,34,240,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <ExternalLink size={16} style={{ color: 'var(--primary)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--foreground)',
                    }}>
                      SharePoint Document
                    </div>
                    <a
                      href={contract.sharepointLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '12px',
                        color: 'var(--primary)',
                        textDecoration: 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block',
                        maxWidth: '480px',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'; }}
                    >
                      {contract.sharepointLink}
                    </a>
                  </div>
                  <a
                    href={contract.sharepointLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      height: '32px', padding: '0 12px',
                      border: '1px solid var(--primary)',
                      borderRadius: 'var(--radius-button)',
                      background: 'transparent',
                      color: 'var(--primary)',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-semibold)',
                      textDecoration: 'none',
                      flexShrink: 0,
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(35,34,240,0.06)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
                  >
                    <ExternalLink size={13} /> Open
                  </a>
                </div>
              </InfoCard>
            )}

            {/* Row 6: Description */}
            <InfoCard title="Description">
              <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-regular)', color: contract.description ? 'var(--foreground)' : 'var(--muted-foreground)', margin: 0, lineHeight: '1.6' }}>
                {contract.description || 'No description provided.'}
              </p>
            </InfoCard>
          </div>
        )}

        {/* Lifecycle Tab */}
        {activeTab === 'Lifecycle' && (
          <div style={{ padding: '32px 24px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '14px', fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)', margin: '0 0 24px',
              }}
            >
              Contract Lifecycle Timeline
            </h3>

            {/* Timeline */}
            <div style={{ position: 'relative', paddingLeft: '24px' }}>
              {/* Vertical line */}
              <div
                style={{
                  position: 'absolute', left: '7px', top: '12px',
                  bottom: '12px', width: '2px',
                  background: 'var(--border)',
                }}
              />

              {LIFECYCLE_STAGES.map((stage, idx) => {
                const isPast = idx < currentStageIdx;
                const isCurrent = idx === currentStageIdx;
                const isFuture = idx > currentStageIdx;

                // Skip 'Terminated' if contract is 'Expired' and vice versa
                const isAlternate =
                  (stage.key === 'Terminated' && contract.status !== 'Terminated' && contract.status === 'Expired') ||
                  (stage.key === 'Expired' && contract.status === 'Terminated');

                let dotColor = 'var(--border)';
                let dotBg = 'var(--card)';
                let labelColor = 'var(--muted-foreground)';

                if (isCurrent) {
                  dotColor = 'var(--primary)';
                  dotBg = 'var(--primary)';
                  labelColor = 'var(--foreground)';
                } else if (isPast) {
                  dotColor = '#1C8A45';
                  dotBg = '#1C8A45';
                  labelColor = 'var(--muted-foreground)';
                }

                return (
                  <div
                    key={stage.key}
                    style={{
                      position: 'relative',
                      paddingBottom: idx < LIFECYCLE_STAGES.length - 1 ? '28px' : '0',
                      opacity: isAlternate ? 0.35 : 1,
                    }}
                  >
                    {/* Dot */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '-24px',
                        top: '2px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: `2px solid ${dotColor}`,
                        background: isCurrent || isPast ? dotBg : 'var(--card)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1,
                      }}
                    >
                      {(isCurrent || isPast) && (
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} />
                      )}
                    </div>

                    {/* Content */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: 'var(--text-base)',
                            fontWeight: isCurrent ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                            color: labelColor,
                          }}
                        >
                          {stage.label}
                        </span>
                        {isCurrent && <StatusBadge status={contract.status} />}
                        {isPast && (
                          <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: '#1C8A45' }}>
                            ✓ Completed
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '12px',
                          color: 'var(--muted-foreground)',
                          margin: '2px 0 0',
                        }}
                      >
                        {stage.description}
                      </p>

                      {/* Current stage details */}
                      {isCurrent && contract.status !== 'Expired' && contract.status !== 'Terminated' && (
                        <div
                          style={{
                            marginTop: '8px',
                            padding: '12px',
                            background: 'var(--muted)',
                            borderRadius: 'var(--radius-card)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                            <div>
                              <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Start Date
                              </div>
                              <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)', marginTop: '2px' }}>
                                {formatDate(contract.startDate)}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                End Date
                              </div>
                              <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: daysLeft <= 30 ? 'var(--destructive)' : 'var(--foreground)', marginTop: '2px' }}>
                                {formatDate(contract.endDate)}
                                {daysLeft >= 0 && <span style={{ marginLeft: '6px', fontSize: '11px' }}>({daysLeft} days)</span>}
                              </div>
                            </div>
                            {contract.autoRenew && (
                              <div>
                                <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Auto-Renew
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                  <RefreshCw size={12} style={{ color: '#1C8A45' }} />
                                  <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: '#1C8A45' }}>Enabled</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Contract value card */}
            <div
              className="grid grid-cols-1 sm:grid-cols-3"
              style={{ marginTop: '32px', gap: '16px' }}
            >
              <StatBox icon={<DollarSign size={16} />} label="Contract Value" value={contract.value === 0 ? 'No Cost' : formatCurrency(contract.value)} />
              <StatBox icon={<Calendar size={16} />} label="Duration" value={`${durationMonths} months`} />
              <StatBox icon={<User size={16} />} label="Owner" value={contract.owner} />
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'Activity' && (
          <div style={{ padding: '8px 0' }}>
            {contractActivity.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', lineHeight: 1, marginBottom: '8px' }}>📋</div>
                <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
                  No activity recorded
                </div>
                <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', marginTop: '4px' }}>
                  Activity will appear here when changes are made.
                </div>
              </div>
            ) : contractActivity.map(item => (
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

      {/* Edit Modal */}
      <ContractFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={(data) => { updateContract(contract.id, data); setShowEditModal(false); }}
        initialData={contract}
        vendors={vendors.map(v => ({ id: v.id, name: v.name }))}
      />

      {/* Delete Confirm */}
      <FormModal
        title="Delete Contract"
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onSubmit={() => { deleteContract(contract.id); navigate('/contracts'); }}
        submitLabel="Delete Contract"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)', margin: 0 }}>
            Are you sure you want to permanently delete{' '}
            <strong>{contract.title}</strong>?
          </p>
          <div
            style={{
              padding: '12px',
              background: 'rgba(222,0,55,0.06)',
              border: '1px solid rgba(222,0,55,0.2)',
              borderRadius: 'var(--radius-card)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px', color: 'var(--destructive)',
            }}
          >
            This action cannot be undone.
          </div>
        </div>
      </FormModal>
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function MetaField({ label, value }: { label: string; value: React.ReactNode }) {
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
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
      <div
        style={{
          padding: '10px 16px', background: 'var(--muted)',
          borderBottom: '1px solid var(--border)',
          fontFamily: 'var(--font-family-primary)',
          fontSize: '12px', fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em',
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
      <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-bold)', color: 'var(--muted-foreground)', minWidth: '140px', flexShrink: 0 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-regular)', color: 'var(--foreground)', flex: 1 }}>
        {value}
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      style={{
        border: '1px solid var(--border)', borderRadius: 'var(--radius-card)',
        padding: '16px', display: 'flex', alignItems: 'center', gap: '12px',
      }}
    >
      <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-card)', background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </div>
        <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', marginTop: '2px' }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function FlagBadge({ value, yesLabel, noLabel, warnIfTrue }: {
  value: boolean;
  yesLabel: string;
  noLabel: string;
  warnIfTrue?: boolean;
}) {
  const bg = value
    ? (warnIfTrue ? 'rgba(224,123,0,0.12)' : 'rgba(28,138,69,0.12)')
    : 'var(--muted)';
  const color = value
    ? (warnIfTrue ? '#E07B00' : '#1C8A45')
    : 'var(--muted-foreground)';
  const border = value
    ? (warnIfTrue ? 'rgba(224,123,0,0.35)' : 'rgba(28,138,69,0.35)')
    : 'var(--border)';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      height: '22px',
      padding: '0 10px',
      borderRadius: '100px',
      background: bg,
      border: `1px solid ${border}`,
      fontFamily: 'var(--font-family-primary)',
      fontSize: '11px',
      fontWeight: 'var(--font-weight-semibold)',
      color,
    }}>
      {value ? yesLabel : noLabel}
    </span>
  );
}