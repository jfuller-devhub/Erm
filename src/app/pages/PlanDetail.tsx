import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Edit2, Plus, CalendarDays, User, Tag,
  FileText, Shield, DollarSign, BarChart2, Smile, Target,
  Building2, GitBranch,
} from 'lucide-react';
import type { Plan, PlanStatus } from '../data/planData';
import { loadPlans, savePlans, updatePlan } from '../data/planData';
import type { Benefit, QnxtConfigStatus } from '../data/benefitData';
import { loadBenefits } from '../data/benefitData';
import type { Product } from '../data/productData';
import { loadProducts } from '../data/productData';
import { useApp } from '../context/AppContext';
import { BenefitFormModal } from '../components/plans/BenefitFormModal';
import { PlanFormModal } from '../components/plans/PlanFormModal';
import { formatDate } from '../data/mockData';
import { UserChip } from '../components/shared/UserPicker';

// ─── Status badge ────────────────────────────────────────────────────────────

const PLAN_STATUS_STYLES: Record<PlanStatus, { background: string; color: string }> = {
  Active:   { background: '#E8F5EE', color: '#1C8A45' },
  Draft:    { background: '#FFF3E0', color: '#E07B00' },
  Inactive: { background: '#F0F0F0', color: '#6B7489' },
  Archived: { background: '#FDE8E8', color: '#C0392B' },
};

function PlanStatusBadge({ status }: { status: PlanStatus }) {
  const style = PLAN_STATUS_STYLES[status] ?? PLAN_STATUS_STYLES.Inactive;
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center',
        height: '22px', padding: '0 10px', borderRadius: '100px',
        background: style.background, color: style.color,
        fontFamily: 'var(--font-family-primary)', fontSize: '12px',
        fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
}

// ─── Benefit status badge ─────────────────────────────────────────────────────

const BENEFIT_STATUS_STYLES: Record<string, { background: string; color: string }> = {
  Active:   { background: '#E8F5EE', color: '#1C8A45' },
  Draft:    { background: '#FFF3E0', color: '#E07B00' },
  Inactive: { background: '#F0F0F0', color: '#6B7489' },
  Archived: { background: '#FDE8E8', color: '#C0392B' },
};

function BenefitStatusBadge({ status }: { status: string }) {
  const style = BENEFIT_STATUS_STYLES[status] ?? BENEFIT_STATUS_STYLES.Inactive;
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center',
        height: '20px', padding: '0 8px', borderRadius: '100px',
        background: style.background, color: style.color,
        fontFamily: 'var(--font-family-primary)', fontSize: '11px',
        fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
}

// ─── QNXT config status badge ─────────────────────────────────────────────────

const QNXT_STATUS_STYLES: Record<QnxtConfigStatus, { background: string; color: string }> = {
  'Not Started': { background: '#F0F0F0', color: '#6B7489' },
  'In Progress': { background: '#FFF3E0', color: '#E07B00' },
  'Complete':    { background: '#dbeafe', color: '#1d4ed8' },
  'Verified':    { background: '#E8F5EE', color: '#1C8A45' },
};

function QnxtConfigBadge({ status }: { status: QnxtConfigStatus }) {
  const style = QNXT_STATUS_STYLES[status] ?? QNXT_STATUS_STYLES['Not Started'];
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center',
        height: '20px', padding: '0 8px', borderRadius: '100px',
        background: style.background, color: style.color,
        fontFamily: 'var(--font-family-primary)', fontSize: '11px',
        fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
}

// ─── Info row helper ──────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
      <Icon size={15} style={{ color: 'var(--muted-foreground)', flexShrink: 0, marginTop: '2px' }} />
      <div>
        <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '2px' }}>
          {label}
        </div>
        <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)' }}>
          {value || <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Roadmap card ─────────────────────────────────────────────────────────────

function RoadmapCard({ icon: Icon, title, content }: { icon: React.ElementType; title: string; content: string }) {
  return (
    <div
      style={{
        border: '1px solid var(--border)', borderRadius: 'var(--radius-card)',
        padding: '16px', background: 'var(--card)',
        display: 'flex', flexDirection: 'column', gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        <span style={{
          fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
        }}>
          {title}
        </span>
      </div>
      <p style={{
        fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
        color: content ? 'var(--foreground)' : 'var(--muted-foreground)',
        margin: 0, lineHeight: '1.5',
      }}>
        {content || 'No information provided.'}
      </p>
    </div>
  );
}

// ─── Button helpers ───────────────────────────────────────────────────────────

function PrimaryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        height: '36px', padding: '0 14px', border: 'none',
        borderRadius: 'var(--radius-button)', background: 'var(--primary)',
        color: 'var(--primary-foreground)', fontFamily: 'var(--font-family-primary)',
        fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)',
        cursor: 'pointer', transition: 'opacity 0.1s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
    >
      {children}
    </button>
  );
}

function OutlineButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        height: '36px', padding: '0 14px', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-button)', background: 'var(--card)',
        color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)',
        fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)',
        cursor: 'pointer', transition: 'background 0.1s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--muted)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--card)'; }}
    >
      {children}
    </button>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

type Tab = 'Overview' | 'Benefits' | 'Vendors' | 'Processes' | 'Roadmap';
const TABS: Tab[] = ['Overview', 'Benefits', 'Vendors', 'Processes', 'Roadmap'];

function TabBar({ active, onChange, counts }: { active: Tab; onChange: (t: Tab) => void; counts?: Partial<Record<Tab, number>> }) {
  return (
    <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border)' }}>
      {TABS.map(tab => {
        const isActive = tab === active;
        const count = counts?.[tab];
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            style={{
              height: '40px', padding: '0 16px',
              border: 'none', borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'transparent', cursor: 'pointer',
              fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
              fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
              color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              transition: 'color 0.1s',
              marginBottom: '-1px',
            }}
          >
            {tab}
            {count !== undefined && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: '18px', height: '18px', padding: '0 5px',
                borderRadius: '100px', background: isActive ? 'var(--primary)' : 'var(--muted)',
                color: isActive ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                fontSize: '11px', fontWeight: 'var(--font-weight-semibold)',
              }}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function PlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vendors } = useApp();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [benefitModalOpen, setBenefitModalOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);

  const reload = useCallback(() => {
    const plans = loadPlans();
    const found = plans.find(p => p.id === id) ?? null;
    setPlan(found);

    if (found) {
      const products = loadProducts();
      setProduct(products.find(p => p.id === found.productId) ?? null);
      const allBenefits = loadBenefits();
      setBenefits(allBenefits.filter(b => b.planId === found.id));
    }
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  if (!plan) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--font-family-primary)', color: 'var(--muted-foreground)' }}>
        Plan not found.
      </div>
    );
  }

  const linkedVendors = vendors.filter(v => plan.vendorIds.includes(v.id));

  const tabCounts: Partial<Record<Tab, number>> = {
    Benefits: benefits.length,
    Vendors: linkedVendors.length,
    Processes: plan.processAssociations.length,
  };

  function handlePlanSaved(saved: Plan) {
    setPlan(saved);
    const products = loadProducts();
    setProduct(products.find(p => p.id === saved.productId) ?? null);
  }

  function handleBenefitSaved(saved: Benefit) {
    reload();
    setBenefitModalOpen(false);
    setEditingBenefit(null);
  }

  function openAddBenefit() {
    setEditingBenefit(null);
    setBenefitModalOpen(true);
  }

  function openEditBenefit(b: Benefit) {
    setEditingBenefit(b);
    setBenefitModalOpen(true);
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Back button */}
      <button
        onClick={() => navigate(`/products/${plan.productId}`)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '0', border: 'none', background: 'transparent',
          cursor: 'pointer', color: 'var(--muted-foreground)',
          fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
          marginBottom: '20px',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--foreground)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'; }}
      >
        <ArrowLeft size={16} />
        Back to {product?.name ?? 'Product'}
      </button>

      {/* Header card */}
      <div
        style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)', padding: '24px',
          marginBottom: '24px',
        }}
      >
        {/* Top row: title + actions */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <h1
                style={{
                  fontFamily: 'var(--font-family-primary)', fontSize: '22px',
                  fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                  margin: 0,
                }}
              >
                {plan.name}
              </h1>
              <PlanStatusBadge status={plan.status} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                {plan.id}
              </span>
              {product && (
                <>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-family-primary)', fontSize: '13px',
                      color: 'var(--primary)', cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    {product.name}
                  </span>
                </>
              )}
            </div>
          </div>
          <OutlineButton onClick={() => setEditModalOpen(true)}>
            <Edit2 size={14} /> Edit Plan
          </OutlineButton>
        </div>

        {/* Meta grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          <InfoRow
            icon={CalendarDays}
            label="Effective Dates"
            value={
              plan.effectiveStartDate
                ? `${formatDate(plan.effectiveStartDate)}${plan.effectiveEndDate ? ` – ${formatDate(plan.effectiveEndDate)}` : ' – Ongoing'}`
                : '—'
            }
          />
          <InfoRow
            icon={User}
            label="Plan Owner"
            value={plan.owner ? <UserChip user={plan.owner} size="sm" /> : null}
          />
          {plan.tags.length > 0 && (
            <InfoRow
              icon={Tag}
              label="Tags"
              value={
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {plan.tags.map(tag => (
                    <span
                      key={tag}
                      style={{
                        display: 'inline-flex', alignItems: 'center',
                        height: '20px', padding: '0 8px', borderRadius: '100px',
                        border: '1px solid var(--border)', background: 'var(--muted)',
                        fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                        color: 'var(--foreground)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              }
            />
          )}
          <InfoRow
            icon={FileText}
            label="Last Updated"
            value={formatDate(plan.updatedDate)}
          />
        </div>

        {/* Description */}
        {plan.description && (
          <p style={{
            marginTop: '16px', marginBottom: 0,
            fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
            color: 'var(--foreground)', lineHeight: '1.6',
          }}>
            {plan.description}
          </p>
        )}
      </div>

      {/* Tabs */}
      <TabBar active={activeTab} onChange={setActiveTab} counts={tabCounts} />

      <div style={{ paddingTop: '24px' }}>
        {/* ── Overview Tab ── */}
        {activeTab === 'Overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            <div
              style={{
                border: '1px solid var(--border)', borderRadius: 'var(--radius-card)',
                padding: '20px', background: 'var(--card)',
                display: 'flex', flexDirection: 'column', gap: '12px',
              }}
            >
              <h3 style={{ margin: 0, fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
                Plan Details
              </h3>
              <InfoRow icon={FileText} label="Plan ID" value={plan.id} />
              <InfoRow icon={CalendarDays} label="Created" value={formatDate(plan.createdDate)} />
              <InfoRow icon={CalendarDays} label="Updated" value={formatDate(plan.updatedDate)} />
              <InfoRow icon={User} label="Owner" value={plan.owner?.name ?? '—'} />
            </div>
            <div
              style={{
                border: '1px solid var(--border)', borderRadius: 'var(--radius-card)',
                padding: '20px', background: 'var(--card)',
                display: 'flex', flexDirection: 'column', gap: '12px',
              }}
            >
              <h3 style={{ margin: 0, fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
                Summary
              </h3>
              <InfoRow icon={Shield} label="Benefits" value={`${benefits.length} benefit${benefits.length !== 1 ? 's' : ''}`} />
              <InfoRow icon={Building2} label="Vendors" value={`${linkedVendors.length} linked`} />
              <InfoRow icon={GitBranch} label="Processes" value={`${plan.processAssociations.length} linked`} />
            </div>
          </div>
        )}

        {/* ── Benefits Tab ── */}
        {activeTab === 'Benefits' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>
                {benefits.length} benefit{benefits.length !== 1 ? 's' : ''} in this plan
              </span>
              <PrimaryButton onClick={openAddBenefit}>
                <Plus size={14} /> Add Benefit
              </PrimaryButton>
            </div>

            {benefits.length === 0 ? (
              <div
                style={{
                  border: '1px dashed var(--border)', borderRadius: 'var(--radius-card)',
                  padding: '48px', textAlign: 'center',
                }}
              >
                <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', margin: 0 }}>
                  No benefits yet. Click "Add Benefit" to get started.
                </p>
              </div>
            ) : (
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--muted)' }}>
                      {['Name', 'Category', 'Status', 'QNXT Config', 'Effective Dates', ''].map(h => (
                        <th
                          key={h}
                          style={{
                            padding: '10px 16px', textAlign: 'left',
                            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                            fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
                            borderBottom: '1px solid var(--border)',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {benefits.map((b, i) => (
                      <tr
                        key={b.id}
                        style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
                            {b.name}
                          </div>
                          {b.description && (
                            <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                              {b.description.length > 80 ? b.description.slice(0, 80) + '…' : b.description}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)' }}>
                          {b.category}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <BenefitStatusBadge status={b.status} />
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <QnxtConfigBadge status={b.qnxtConfigStatus ?? 'Not Started'} />
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-family-primary)', fontSize: '13px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                          {b.effectiveStartDate ? formatDate(b.effectiveStartDate) : '—'}
                          {b.effectiveEndDate ? ` – ${formatDate(b.effectiveEndDate)}` : b.effectiveStartDate ? ' – Ongoing' : ''}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => openEditBenefit(b)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              height: '28px', padding: '0 10px',
                              border: '1px solid var(--border)', borderRadius: 'var(--radius-button)',
                              background: 'transparent', cursor: 'pointer',
                              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                              color: 'var(--foreground)',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--muted)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                          >
                            <Edit2 size={11} /> Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Vendors Tab ── */}
        {activeTab === 'Vendors' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>
                {linkedVendors.length} vendor{linkedVendors.length !== 1 ? 's' : ''} linked to this plan
              </span>
            </div>

            {linkedVendors.length === 0 ? (
              <div
                style={{
                  border: '1px dashed var(--border)', borderRadius: 'var(--radius-card)',
                  padding: '48px', textAlign: 'center',
                }}
              >
                <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', margin: 0 }}>
                  No vendors linked. Edit the plan to add vendor associations.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {linkedVendors.map(v => (
                  <div
                    key={v.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 16px', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-card)', background: 'var(--card)',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/vendors/${v.id}`)}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--muted)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--card)'; }}
                  >
                    <div>
                      <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
                        {v.name}
                      </div>
                      <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                        {v.category}
                      </div>
                    </div>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
                      height: '20px', padding: '0 8px', borderRadius: '100px',
                      background: v.status === 'Active' ? '#E8F5EE' : '#F0F0F0',
                      color: v.status === 'Active' ? '#1C8A45' : '#6B7489',
                      fontFamily: 'var(--font-family-primary)', fontSize: '11px',
                      fontWeight: 'var(--font-weight-semibold)',
                    }}>
                      {v.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Processes Tab ── */}
        {activeTab === 'Processes' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>
                {plan.processAssociations.length} process association{plan.processAssociations.length !== 1 ? 's' : ''}
              </span>
            </div>

            {plan.processAssociations.length === 0 ? (
              <div
                style={{
                  border: '1px dashed var(--border)', borderRadius: 'var(--radius-card)',
                  padding: '48px', textAlign: 'center',
                }}
              >
                <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', margin: 0 }}>
                  No processes linked. Edit the plan to add process associations.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {plan.processAssociations.map((assoc, i) => (
                  <div
                    key={`${assoc.processId}-${assoc.subProcessId ?? 'root'}-${i}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 16px', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-card)', background: 'var(--card)',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/processes/${assoc.processId}`)}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--muted)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--card)'; }}
                  >
                    <GitBranch size={15} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
                        {assoc.processId}
                      </div>
                      {assoc.subProcessId && (
                        <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                          Sub-process: {assoc.subProcessId}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Roadmap Tab ── */}
        {activeTab === 'Roadmap' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            <RoadmapCard
              icon={Target}
              title="Purpose Alignment"
              content={plan.roadmapPurposeAlignment}
            />
            <RoadmapCard
              icon={FileText}
              title="Planning"
              content={plan.roadmapPlanning}
            />
            <RoadmapCard
              icon={Shield}
              title="Protection"
              content={plan.roadmapProtection}
            />
            <RoadmapCard
              icon={DollarSign}
              title="Price Competitiveness"
              content={plan.roadmapPriceCompetitiveness}
            />
            <RoadmapCard
              icon={BarChart2}
              title="Performance Measurement"
              content={plan.roadmapPerformanceMeasurement}
            />
            <RoadmapCard
              icon={Smile}
              title="Participant Experience"
              content={plan.roadmapParticipantExperience}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <PlanFormModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handlePlanSaved}
        editingPlan={plan}
      />

      <BenefitFormModal
        isOpen={benefitModalOpen}
        onClose={() => { setBenefitModalOpen(false); setEditingBenefit(null); }}
        onSave={handleBenefitSaved}
        planId={plan.id}
        editingBenefit={editingBenefit}
      />
    </div>
  );
}
