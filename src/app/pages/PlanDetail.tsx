import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Edit2, Plus, CalendarDays, User, Tag,
  FileText, Shield, DollarSign, BarChart2, Smile, Target,
  Building2, GitBranch, X, ChevronDown, ChevronRight,
} from 'lucide-react';
import type { Plan, PlanStatus } from '../data/planData';
import { loadPlans, savePlans, updatePlan } from '../data/planData';
import type { Department } from '../data/departmentData';
import { loadDepartments } from '../data/departmentData';
import type { Benefit, QnxtConfigStatus } from '../data/benefitData';
import { loadBenefits } from '../data/benefitData';
import type { Product } from '../data/productData';
import { loadProducts } from '../data/productData';
import type { Employer } from '../data/employerData';
import { loadEmployers } from '../data/employerData';
import type { Persona } from '../data/personaData';
import { loadPersonas } from '../data/personaData';
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

// ─── Department type styles ───────────────────────────────────────────────────

const DEPT_TYPE_STYLES: Record<string, { bg: string; color: string }> = {
  Division:   { bg: '#EEF2FF', color: '#4338CA' },
  Department: { bg: '#E0F2FE', color: '#0369A1' },
  Team:       { bg: '#D1FAE5', color: '#065F46' },
  Unit:       { bg: '#F3F4F6', color: '#374151' },
};

// ─── Plan Departments Tab ─────────────────────────────────────────────────────

function PlanDeptTreePicker({
  deptIds,
  allDepts,
  onLink,
}: {
  deptIds: string[];
  allDepts: Department[];
  onLink: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const active = allDepts.filter(d => d.status === 'Active');
  const roots = active.filter(d => d.parentId === '');

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function getChildren(parentId: string) {
    return active.filter(d => d.parentId === parentId);
  }

  function renderNode(dept: Department, depth: number): React.ReactNode {
    const kids = getChildren(dept.id);
    const isOpen = expanded.has(dept.id);
    const isLinked = deptIds.includes(dept.id);
    const ts = DEPT_TYPE_STYLES[dept.type] ?? { bg: '#F3F4F6', color: '#374151' };
    return (
      <div key={dept.id} style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 12px', paddingLeft: `${12 + depth * 20}px`,
          background: depth > 0 ? 'rgba(0,0,0,0.02)' : undefined,
        }}>
          {kids.length > 0 ? (
            <button type="button" onClick={() => toggleExpand(dept.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--muted-foreground)', flexShrink: 0 }}>
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : <span style={{ width: '14px', flexShrink: 0 }} />}
          <Building2 size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <span style={{ flex: 1, fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
            {dept.name}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', height: '18px', padding: '0 6px', borderRadius: '100px', background: ts.bg, color: ts.color, fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 600, flexShrink: 0 }}>
            {dept.type}
          </span>
          <button type="button" disabled={isLinked} onClick={() => onLink(dept.id)}
            style={{ height: '24px', padding: '0 10px', border: `1px solid ${isLinked ? 'var(--border)' : 'var(--primary)'}`, borderRadius: 'var(--radius-button)', background: isLinked ? 'var(--muted)' : 'transparent', color: isLinked ? 'var(--muted-foreground)' : 'var(--primary)', fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', cursor: isLinked ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            {isLinked ? 'Linked' : <><Plus size={10} /> Add</>}
          </button>
        </div>
        {isOpen && kids.map(kid => renderNode(kid, depth + 1))}
      </div>
    );
  }

  if (roots.length === 0) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>
        No departments available.
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', background: 'var(--card)', maxHeight: '280px', overflowY: 'auto' }}>
      {roots.map(r => renderNode(r, 0))}
    </div>
  );
}

function PlanDepartmentsTab({
  plan, allDepts, onLink, onUnlink, navigate,
}: {
  plan: Plan;
  allDepts: Department[];
  onLink: (deptId: string) => void;
  onUnlink: (deptId: string) => void;
  navigate: (path: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [unlinkConfirm, setUnlinkConfirm] = useState<string | null>(null);

  const deptIds = plan.departmentIds ?? [];
  const linked = allDepts.filter(d => deptIds.includes(d.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>Departments</span>
          <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '100px', padding: '1px 8px', lineHeight: '18px' }}>
            {linked.length}
          </span>
        </div>
        <button
          onClick={() => setShowPicker(o => !o)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '32px', padding: '0 12px', border: 'none', borderRadius: 'var(--radius-button)', background: 'var(--primary)', color: 'var(--primary-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        >
          <Plus size={14} /> Link Department
        </button>
      </div>

      {/* Picker panel */}
      {showPicker && (
        <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            Select a Division, Department, or Team
          </div>
          <PlanDeptTreePicker deptIds={deptIds} allDepts={allDepts} onLink={onLink} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowPicker(false)}
              style={{ height: '28px', padding: '0 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', background: 'var(--card)', color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* Linked list */}
      {linked.length === 0 && !showPicker ? (
        <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <Building2 size={40} style={{ color: 'var(--muted-foreground)' }} />
          <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>No departments linked</div>
          <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>Associate this plan with a division, department, or team.</div>
          <button onClick={() => setShowPicker(true)}
            style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 16px', border: 'none', borderRadius: 'var(--radius-button)', background: 'var(--primary)', color: 'var(--primary-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}>
            <Plus size={14} /> Link Department
          </button>
        </div>
      ) : linked.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 16px 16px' }}>
          {linked.map((dept, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === linked.length - 1;
            const radius = isFirst && isLast ? 'var(--radius-card)' : isFirst ? 'var(--radius-card) var(--radius-card) 0 0' : isLast ? '0 0 var(--radius-card) var(--radius-card)' : '0';
            const ts = DEPT_TYPE_STYLES[dept.type] ?? { bg: '#F3F4F6', color: '#374151' };
            return (
              <div key={dept.id}
                style={{ background: 'var(--card)', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderTop: '1px solid var(--border)', borderBottom: isLast ? '1px solid var(--border)' : 'none', borderRadius: radius, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.1s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--muted)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--card)'; }}
              >
                <Building2 size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <button type="button" onClick={() => navigate(`/departments/${dept.id}`)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)', textAlign: 'left' }}>
                  {dept.name}
                </button>
                <span style={{ display: 'inline-flex', alignItems: 'center', height: '20px', padding: '0 8px', borderRadius: '100px', background: ts.bg, color: ts.color, fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', flexShrink: 0 }}>{dept.type}</span>
                <span style={{ flex: 1 }} />
                {unlinkConfirm === dept.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>Unlink?</span>
                    <button type="button" onClick={() => { onUnlink(dept.id); setUnlinkConfirm(null); }}
                      style={{ height: '24px', padding: '0 8px', border: 'none', borderRadius: 'var(--radius-button)', background: 'var(--destructive)', color: 'var(--destructive-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}>
                      Confirm
                    </button>
                    <button type="button" onClick={() => setUnlinkConfirm(null)}
                      style={{ height: '24px', padding: '0 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', background: 'transparent', color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)', fontSize: '11px', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setUnlinkConfirm(dept.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '24px', padding: '0 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', background: 'transparent', color: 'var(--muted-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer', flexShrink: 0 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--destructive)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--destructive)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'; }}>
                    <X size={10} /> Unlink
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = 'Overview' | 'Benefits' | 'Entities' | 'Vendors' | 'Processes' | 'Roadmap' | 'Personas' | 'Departments';
const TABS: Tab[] = ['Overview', 'Benefits', 'Entities', 'Vendors', 'Processes', 'Roadmap', 'Personas', 'Departments'];

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
  const [allEntities, setAllEntities] = useState<Employer[]>([]);
  const [allPersonas, setAllPersonas] = useState<Persona[]>([]);
  const [allDepts, setAllDepts] = useState<Department[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [benefitModalOpen, setBenefitModalOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);
  const [showEntityPicker, setShowEntityPicker] = useState(false);
  const [entityPickerSearch, setEntityPickerSearch] = useState('');

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
    setAllEntities(loadEmployers());
    setAllPersonas(loadPersonas());
    setAllDepts(loadDepartments());
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
  const linkedEntities = allEntities.filter(e => (plan.entityIds ?? []).includes(e.id));
  const linkedPersonas = allPersonas.filter(per => (per.planIds ?? []).includes(plan.id));

  const linkedDepts = allDepts.filter(d => (plan.departmentIds ?? []).includes(d.id));

  const tabCounts: Partial<Record<Tab, number>> = {
    Benefits: benefits.length,
    Entities: linkedEntities.length,
    Vendors: linkedVendors.length,
    Processes: plan.processAssociations.length,
    Personas: linkedPersonas.length,
    Departments: linkedDepts.length,
  };

  function handleLinkEntity(entityId: string) {
    if (!plan || plan.entityIds.includes(entityId)) return;
    const updated = { ...plan, entityIds: [...plan.entityIds, entityId] };
    const allPlans = loadPlans();
    const saved = allPlans.map(p => p.id === plan.id ? updated : p);
    savePlans(saved);
    setPlan(updated);
    setEntityPickerSearch('');
    setShowEntityPicker(false);
  }

  function handleUnlinkEntity(entityId: string) {
    if (!plan) return;
    const updated = { ...plan, entityIds: plan.entityIds.filter(eid => eid !== entityId) };
    const allPlans = loadPlans();
    savePlans(allPlans.map(p => p.id === plan.id ? updated : p));
    setPlan(updated);
  }

  function handleLinkDept(deptId: string) {
    if (!plan || (plan.departmentIds ?? []).includes(deptId)) return;
    const updated = { ...plan, departmentIds: [...(plan.departmentIds ?? []), deptId] };
    savePlans(loadPlans().map(p => p.id === plan.id ? updated : p));
    setPlan(updated);
  }

  function handleUnlinkDept(deptId: string) {
    if (!plan) return;
    const updated = { ...plan, departmentIds: (plan.departmentIds ?? []).filter(id => id !== deptId) };
    savePlans(loadPlans().map(p => p.id === plan.id ? updated : p));
    setPlan(updated);
  }

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

        {/* ── Entities Tab ── */}
        {activeTab === 'Entities' && (() => {
          const linkedIds = new Set(linkedEntities.map(e => e.id));
          const linkableEntities = allEntities.filter(
            e => !linkedIds.has(e.id) &&
              (!entityPickerSearch || e.name.toLowerCase().includes(entityPickerSearch.toLowerCase())),
          );
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>Entities</div>
                  <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                    Entities whose members are offered this plan.
                  </div>
                </div>
                <button
                  onClick={() => { setShowEntityPicker(p => !p); setEntityPickerSearch(''); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '32px', padding: '0 12px', border: 'none', borderRadius: 'var(--radius-button)', background: 'var(--primary)', color: 'var(--primary-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  <Plus size={14} /> Link Entity
                </button>
              </div>

              {showEntityPicker && (
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
                  <div style={{ padding: '8px 12px', background: 'var(--muted)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Search size={13} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                    <input
                      autoFocus
                      value={entityPickerSearch}
                      onChange={e => setEntityPickerSearch(e.target.value)}
                      placeholder="Search entities to link..."
                      style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)' }}
                    />
                    <button onClick={() => setShowEntityPicker(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--muted-foreground)', borderRadius: '3px' }}>
                      <X size={13} />
                    </button>
                  </div>
                  {linkableEntities.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>
                      {entityPickerSearch ? 'No matching entities.' : 'All entities are already linked.'}
                    </div>
                  ) : (
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {linkableEntities.map(e => (
                        <div
                          key={e.id}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                          onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--muted)')}
                          onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                          onClick={() => handleLinkEntity(e.id)}
                        >
                          <div>
                            <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>{e.name}</div>
                            <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>{e.code} · {e.isActive ? 'Active' : 'Inactive'}</div>
                          </div>
                          <Plus size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {linkedEntities.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center', background: 'var(--muted)', borderRadius: 'var(--radius-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <Building2 size={32} style={{ color: 'var(--muted-foreground)' }} />
                  <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>No entities linked</div>
                  <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>Click "Link Entity" to associate entities with this plan.</div>
                </div>
              ) : (
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 80px 40px', padding: '8px 14px', background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                    {['Entity', 'Code', 'Status', ''].map(h => (
                      <span key={h} style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
                    ))}
                  </div>
                  {linkedEntities.map((e, idx) => (
                    <div
                      key={e.id}
                      style={{ display: 'grid', gridTemplateColumns: '1fr 90px 80px 40px', padding: '10px 14px', alignItems: 'center', borderTop: idx > 0 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--muted)')}
                      onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                    >
                      <span
                        style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        onClick={() => navigate(`/entities/${e.id}`)}
                      >
                        {e.name}
                      </span>
                      <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>{e.code}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', height: '18px', padding: '0 7px', borderRadius: '100px', background: e.isActive ? '#E8F5EE' : '#F0F0F0', color: e.isActive ? '#1C8A45' : '#6B7489', fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap' }}>
                        {e.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handleUnlinkEntity(e.id)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', border: 'none', borderRadius: 'var(--radius-input)', background: 'transparent', color: 'var(--destructive)', cursor: 'pointer' }}
                        onMouseEnter={ev => (ev.currentTarget.style.background = 'rgba(220,38,38,0.08)')}
                        onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

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

        {/* ── PERSONAS TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'Personas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>Associated Personas</div>
                <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                  Participant types linked to this plan. Manage associations in the Persona Register.
                </div>
              </div>
              <button
                onClick={() => navigate('/personas')}
                style={{ height: '32px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', background: 'var(--card)', cursor: 'pointer', fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--muted)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--card)')}
              >
                Persona Register
              </button>
            </div>

            {linkedPersonas.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', background: 'var(--muted)', borderRadius: 'var(--radius-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <User size={32} style={{ color: 'var(--muted-foreground)' }} />
                <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>No personas linked</span>
                <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>Link this plan to personas from the Plans tab on each persona's detail page.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 90px', padding: '8px 14px', background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {['Persona', 'Category', 'Status'].map(h => (
                    <span key={h} style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
                  ))}
                </div>
                {linkedPersonas.map((per, idx) => {
                  const sc = per.status === 'Active' ? { bg: '#E8F5EE', color: '#1C8A45' } : per.status === 'Draft' ? { bg: '#FFF3E0', color: '#E07B00' } : { bg: '#F0F0F0', color: '#6B7489' };
                  return (
                    <div
                      key={per.id}
                      style={{ display: 'grid', gridTemplateColumns: '1fr 160px 90px', padding: '10px 14px', alignItems: 'center', borderTop: idx > 0 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--muted)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => navigate(`/personas/${per.id}`)}
                    >
                      <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {per.name}
                      </span>
                      <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{per.category}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', height: '18px', padding: '0 7px', borderRadius: '100px', background: sc.bg, color: sc.color, fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap' }}>
                        {per.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Departments Tab ── */}
        {activeTab === 'Departments' && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)', overflow: 'hidden' }}>
            <PlanDepartmentsTab
              plan={plan}
              allDepts={allDepts}
              onLink={handleLinkDept}
              onUnlink={handleUnlinkDept}
              navigate={navigate}
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
