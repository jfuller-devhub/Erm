import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Edit2, Trash2, ShieldAlert, User,
  Building2, AlertTriangle, BarChart2,
} from 'lucide-react';
import { UserChip } from '../components/shared/UserPicker';
import { RiskFormModal } from '../components/risks/RiskFormModal';
import { RiskAssessmentSection } from '../components/risks/RiskAssessmentSection';
import { RiskMitigationSection } from '../components/risks/RiskMitigationSection';
import { RiskControlSection } from '../components/risks/RiskControlSection';
import { RiskProcessesSection } from '../components/risks/RiskProcessesSection';
import type { Risk, RiskStatus, RiskType, RiskCategory } from '../data/riskData';
import {
  loadRisks, saveRisks, loadRiskCategories,
  RISK_STATUS_LABELS, RISK_TYPE_LABELS, APPETITE_LEVEL_LABELS, REVIEW_FREQUENCY_LABELS,
} from '../data/riskData';
import type { RiskAssessment } from '../data/riskAssessmentData';
import {
  loadRiskAssessments, saveRiskAssessments, getCurrentAssessment,
  getAssessmentsForRisk,
  RISK_RATING_LABELS, RISK_RATING_STYLES,
} from '../data/riskAssessmentData';
import type { RiskMitigationAction } from '../data/riskMitigationData';
import {
  loadRiskMitigations, saveRiskMitigations, getMitigationsForRisk,
} from '../data/riskMitigationData';
import type { Control } from '../data/controlData';
import {
  loadControls,
} from '../data/controlData';
import type { RiskControl } from '../data/riskControlData';
import {
  loadRiskControls, saveRiskControls, getControlsForRisk,
} from '../data/riskControlData';
import { formatDate } from '../data/mockData';
import type { Process } from '../data/processData';
import { loadProcesses } from '../data/processData';
import type { ProcessRiskLink } from '../data/processRiskData';
import {
  loadProcessRiskLinks, saveProcessRiskLinks,
} from '../data/processRiskData';

// ─── Tab type ────────────────────────────────────────────────────────────────

type TabKey = 'overview' | 'assessments' | 'mitigations' | 'controls' | 'processes';

// ─── Status badge ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<RiskStatus, { background: string; color: string }> = {
  draft:    { background: '#FFF3E0', color: '#E07B00' },
  active:   { background: '#E8F5EE', color: '#1C8A45' },
  closed:   { background: '#F0F0F0', color: '#6B7489' },
  archived: { background: '#F0F0F0', color: '#6B7489' },
};

function RiskStatusBadge({ status }: { status: RiskStatus }) {
  const style = STATUS_STYLES[status] ?? { background: '#F0F0F0', color: '#6B7489' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '22px',
        padding: '0 10px',
        borderRadius: '100px',
        background: style.background,
        color: style.color,
        fontFamily: 'var(--font-family-primary)',
        fontSize: '12px',
        fontWeight: 'var(--font-weight-semibold)',
        lineHeight: '16px',
        whiteSpace: 'nowrap',
      }}
    >
      {RISK_STATUS_LABELS[status]}
    </span>
  );
}

// ─── Risk Type badge ─────────────────────────────────────────────────────────

const TYPE_STYLES: Record<RiskType, { background: string; color: string }> = {
  strategic:    { background: 'rgba(35,34,240,0.08)', color: '#2322F0' },
  operational:  { background: '#FFF3E0', color: '#E07B00' },
  financial:    { background: '#E8F5EE', color: '#1C8A45' },
  compliance:   { background: '#E0F5F5', color: '#00A3A3' },
  reputational: { background: '#FDE8E8', color: '#C0392B' },
  cyber:        { background: '#F0E8FF', color: '#6B3FA0' },
};

function RiskTypeBadge({ type }: { type: RiskType }) {
  const style = TYPE_STYLES[type] ?? { background: '#F0F0F0', color: '#6B7489' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '22px',
        padding: '0 10px',
        borderRadius: '100px',
        background: style.background,
        color: style.color,
        fontFamily: 'var(--font-family-primary)',
        fontSize: '12px',
        fontWeight: 'var(--font-weight-semibold)',
        lineHeight: '16px',
        whiteSpace: 'nowrap',
      }}
    >
      {RISK_TYPE_LABELS[type]}
    </span>
  );
}

// ─── Departments ─────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  'Technology', 'Operations', 'Finance', 'Compliance', 'Legal',
  'HR', 'Sales', 'Marketing', 'Strategy', 'Facilities',
];

// ─── Detail field component ──────────────────────────────────────────────────

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '12px',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--muted-foreground)',
          lineHeight: '16px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </span>
      <div
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-regular)',
          color: 'var(--foreground)',
          lineHeight: '22px',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Tab Button Bar (Appian a.tabButtonBar) ──────────────────────────────────

interface TabDef {
  key: TabKey;
  label: string;
  count?: number;
}

function TabButtonBar({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: TabDef[];
  activeTab: TabKey;
  onTabChange: (key: TabKey) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        borderBottom: '1px solid var(--border)',
        gap: '0',
        overflowX: 'auto',
      }}
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '40px',
              padding: '0 16px',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
              color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
              whiteSpace: 'nowrap',
              transition: 'color 0.15s ease, border-color 0.15s ease',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
            {tab.count != null && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '18px',
                  height: '18px',
                  padding: '0 5px',
                  borderRadius: '100px',
                  background: isActive ? 'rgba(35,34,240,0.08)' : 'var(--muted)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                  lineHeight: '14px',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RiskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [risks, setRisks] = useState<Risk[]>([]);
  const [categories, setCategories] = useState<RiskCategory[]>([]);
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [mitigations, setMitigations] = useState<RiskMitigationAction[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [riskControls, setRiskControls] = useState<RiskControl[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [processRiskLinks, setProcessRiskLinks] = useState<ProcessRiskLink[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  useEffect(() => {
    setRisks(loadRisks());
    setCategories(loadRiskCategories());
    setAssessments(loadRiskAssessments());
    setMitigations(loadRiskMitigations());
    setControls(loadControls());
    setRiskControls(loadRiskControls());
    setProcesses(loadProcesses());
    setProcessRiskLinks(loadProcessRiskLinks());
  }, []);

  const risk = useMemo(() => risks.find(r => r.id === id), [risks, id]);
  const category = useMemo(
    () => (risk ? categories.find(c => c.id === risk.categoryId) : undefined),
    [risk, categories]
  );
  const parentCategory = useMemo(
    () => (category?.parentCategoryId ? categories.find(c => c.id === category.parentCategoryId) : undefined),
    [category, categories]
  );

  const persistRisks = useCallback((updated: Risk[]) => {
    setRisks(updated);
    saveRisks(updated);
  }, []);

  const persistAssessments = useCallback((updated: RiskAssessment[]) => {
    setAssessments(updated);
    saveRiskAssessments(updated);
  }, []);

  const persistMitigations = useCallback((updated: RiskMitigationAction[]) => {
    setMitigations(updated);
    saveRiskMitigations(updated);
  }, []);

  const persistRiskControls = useCallback((updated: RiskControl[]) => {
    setRiskControls(updated);
    saveRiskControls(updated);
  }, []);

  const persistProcessRiskLinks = useCallback((updated: ProcessRiskLink[]) => {
    setProcessRiskLinks(updated);
    saveProcessRiskLinks(updated);
  }, []);

  // Current assessment for header display
  const currentAssessment = useMemo(
    () => (id ? getCurrentAssessment(assessments, id) : undefined),
    [assessments, id]
  );

  // Assessments count for tab badge
  const assessmentCount = useMemo(
    () => (id ? getAssessmentsForRisk(assessments, id).length : 0),
    [assessments, id]
  );

  // Mitigations count for tab badge
  const mitigationCount = useMemo(
    () => (id ? getMitigationsForRisk(mitigations, id).length : 0),
    [mitigations, id]
  );

  // Controls count for tab badge
  const controlCount = useMemo(
    () => (id ? getControlsForRisk(riskControls, id).length : 0),
    [riskControls, id]
  );

  function handleSaveRisk(data: Omit<Risk, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) {
    if (!risk) return;
    const today = new Date().toISOString().split('T')[0];
    const updated = risks.map(r =>
      r.id === risk.id
        ? { ...r, ...data, updatedAt: today, updatedBy: 'Emily Carter' }
        : r
    );
    persistRisks(updated);
  }

  function handleDelete() {
    if (!risk) return;
    persistRisks(risks.filter(r => r.id !== risk.id));
    navigate('/risk-dashboard');
  }

  if (!risk) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 24px',
          gap: '16px',
        }}
      >
        <ShieldAlert size={48} style={{ color: 'var(--muted-foreground)' }} />
        <h3
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '18px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--foreground)',
            margin: 0,
          }}
        >
          Risk not found
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            color: 'var(--muted-foreground)',
            margin: 0,
          }}
        >
          The risk record you are looking for does not exist or has been deleted.
        </p>
        <button
          onClick={() => navigate('/risk-dashboard')}
          style={{
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
          Back to Risk Dashboard
        </button>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = risk.status === 'active' && risk.nextReviewDate && risk.nextReviewDate < today;

  // Tab definitions with counts
  const tabDefs: TabDef[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'assessments', label: 'Assessments', count: assessmentCount },
    { key: 'mitigations', label: 'Mitigations', count: mitigationCount },
    { key: 'controls', label: 'Controls', count: controlCount },
    { key: 'processes', label: 'Processes', count: processRiskLinks.filter(l => l.riskId === id).length || undefined },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back nav */}
      <button
        onClick={() => navigate('/risk-dashboard')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          fontFamily: 'var(--font-family-primary)',
          fontSize: '12px',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--primary)',
        }}
      >
        <ArrowLeft size={14} />
        Back to Risk Dashboard
      </button>

      {/* Record Summary Header */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '24px',
          boxShadow: 'var(--elevation-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--muted-foreground)',
                }}
              >
                {risk.id}
              </span>
              <RiskStatusBadge status={risk.status} />
              <RiskTypeBadge type={risk.riskType} />
              {risk.isEnterpriseRisk && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    height: '22px',
                    padding: '0 10px',
                    borderRadius: '100px',
                    background: 'rgba(35,34,240,0.1)',
                    color: 'var(--primary)',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-semibold)',
                    border: '1px solid rgba(35,34,240,0.2)',
                  }}
                >
                  <BarChart2 size={10} />
                  Enterprise Risk
                </span>
              )}
              {currentAssessment && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    height: '22px',
                    padding: '0 10px',
                    borderRadius: '100px',
                    background: RISK_RATING_STYLES[currentAssessment.riskRating].background,
                    color: RISK_RATING_STYLES[currentAssessment.riskRating].color,
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-semibold)',
                    lineHeight: '16px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {RISK_RATING_LABELS[currentAssessment.riskRating]} ({currentAssessment.residualScore})
                </span>
              )}
              {isOverdue && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    height: '22px',
                    padding: '0 8px',
                    borderRadius: '100px',
                    background: 'rgba(192,57,43,0.08)',
                    color: 'var(--destructive)',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-semibold)',
                  }}
                >
                  <AlertTriangle size={10} />
                  Review Overdue
                </span>
              )}
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '22px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                margin: 0,
                lineHeight: '30px',
              }}
            >
              {risk.title}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  color: 'var(--muted-foreground)',
                }}
              >
                <Building2 size={12} />
                {risk.department}
              </span>
              {risk.owner && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  <User size={12} />
                  {risk.owner.name}
                </span>
              )}
              {category && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: category.colorHex }} />
                  {category.name}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => setEditOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '36px',
                padding: '0 16px',
                border: '1px solid var(--primary)',
                borderRadius: 'var(--radius-button)',
                background: 'transparent',
                color: 'var(--primary)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
              }}
            >
              <Edit2 size={14} />
              Edit
            </button>
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
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
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* ─── Tab Bar (Appian a.tabButtonBar) ──────────────────────────────── */}
      <TabButtonBar tabs={tabDefs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ─── Tab Content ──────────────────────────────────────────────────── */}

      {activeTab === 'overview' && (
        <OverviewTab
          risk={risk}
          category={category}
          parentCategory={parentCategory}
          isOverdue={isOverdue}
        />
      )}

      {activeTab === 'assessments' && (
        <RiskAssessmentSection
          riskId={risk.id}
          assessments={assessments}
          onAssessmentsChange={persistAssessments}
        />
      )}

      {activeTab === 'mitigations' && (
        <RiskMitigationSection
          riskId={risk.id}
          mitigations={mitigations}
          onMitigationsChange={persistMitigations}
        />
      )}

      {activeTab === 'controls' && (
        <RiskControlSection
          riskId={risk.id}
          controls={controls}
          riskControls={riskControls}
          onRiskControlsChange={persistRiskControls}
        />
      )}

      {activeTab === 'processes' && (
        <RiskProcessesSection
          riskId={risk.id}
          processes={processes}
          processLinks={processRiskLinks}
          onLinksChange={persistProcessRiskLinks}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmOpen && (
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
          onClick={e => { if (e.target === e.currentTarget) setDeleteConfirmOpen(false); }}
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
              Delete Risk
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
              Are you sure you want to delete <strong>{risk.title}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setDeleteConfirmOpen(false)}
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
                onClick={handleDelete}
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <RiskFormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleSaveRisk}
        initialData={risk}
        categories={categories}
        departments={DEPARTMENTS}
        allRisks={risks}
      />
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab({
  risk,
  category,
  parentCategory,
  isOverdue,
}: {
  risk: Risk;
  category?: RiskCategory;
  parentCategory?: RiskCategory;
  isOverdue: boolean;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
      {/* Description Card */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '24px',
          gridColumn: '1 / -1',
        }}
      >
        <SectionTitle>Description</SectionTitle>
        <p
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)',
            color: 'var(--foreground)',
            lineHeight: '24px',
            margin: '12px 0 0 0',
            whiteSpace: 'pre-wrap',
          }}
        >
          {risk.description || '—'}
        </p>
      </div>

      {/* Risk Classification Card */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '24px',
        }}
      >
        <SectionTitle>Risk Classification</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <DetailField label="Risk Category">
            {category ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: category.colorHex, flexShrink: 0 }} />
                {category.name} ({category.code})
              </span>
            ) : '—'}
          </DetailField>

          {parentCategory && (
            <DetailField label="Parent Category">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: parentCategory.colorHex, flexShrink: 0 }} />
                {parentCategory.name} ({parentCategory.code})
              </span>
            </DetailField>
          )}

          <DetailField label="Risk Type">
            <RiskTypeBadge type={risk.riskType} />
          </DetailField>

          <DetailField label="Appetite Level">
            <span style={{ textTransform: 'capitalize' }}>
              {APPETITE_LEVEL_LABELS[risk.appetiteLevel]}
            </span>
          </DetailField>

          <DetailField label="Department">
            {risk.department}
          </DetailField>
        </div>
      </div>

      {/* Ownership & Review Card */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '24px',
        }}
      >
        <SectionTitle>Ownership & Review</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <DetailField label="Owner">
            {risk.owner ? <UserChip user={risk.owner} /> : '—'}
          </DetailField>

          <DetailField label="Review Frequency">
            {REVIEW_FREQUENCY_LABELS[risk.reviewFrequency]}
          </DetailField>

          <DetailField label="Next Review Date">
            <span
              style={{
                color: isOverdue ? 'var(--destructive)' : 'var(--foreground)',
                fontWeight: isOverdue ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
              }}
            >
              {risk.nextReviewDate ? formatDate(risk.nextReviewDate) : '—'}
              {isOverdue && ' (Overdue)'}
            </span>
          </DetailField>

          <DetailField label="Status">
            <RiskStatusBadge status={risk.status} />
          </DetailField>
        </div>
      </div>

      {/* Audit Trail Card */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '24px',
          gridColumn: '1 / -1',
        }}
      >
        <SectionTitle>Audit Trail</SectionTitle>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginTop: '16px',
          }}
        >
          <DetailField label="Created At">
            {risk.createdAt ? formatDate(risk.createdAt) : '—'}
          </DetailField>
          <DetailField label="Created By">
            {risk.createdBy || '—'}
          </DetailField>
          <DetailField label="Updated At">
            {risk.updatedAt ? formatDate(risk.updatedAt) : '—'}
          </DetailField>
          <DetailField label="Updated By">
            {risk.updatedBy || '—'}
          </DetailField>
        </div>
      </div>
    </div>
  );
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontFamily: 'var(--font-family-primary)',
        fontSize: '14px',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--foreground)',
        margin: 0,
        lineHeight: '20px',
        paddingBottom: '8px',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {children}
    </h3>
  );
}