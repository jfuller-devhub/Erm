import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Edit, Trash2, ExternalLink, FileText } from 'lucide-react';
import type { Regulation } from '../data/regulationData';
import {
  loadRegulations, saveRegulations, getRegulationById, deleteRegulation,
  REGULATION_STATUS_LABELS, REGULATION_STATUS_STYLES,
  COMPLIANCE_STATUS_LABELS, COMPLIANCE_STATUS_STYLES,
  IMPACT_LEVEL_LABELS, IMPACT_LEVEL_STYLES,
  REGULATION_STAGE_LABELS,
} from '../data/regulationData';
import { RegulationFormModal } from '../components/regulations/RegulationFormModal';
import { RegulationOverviewTab } from '../components/regulations/RegulationOverviewTab';
import { RegulationControlsTab } from '../components/regulations/RegulationControlsTab';
import { RegulationRelatedTab } from '../components/regulations/RegulationRelatedTab';
import { RegulationDocumentsTab } from '../components/regulations/RegulationDocumentsTab';
import { RegulationActivityTab } from '../components/regulations/RegulationActivityTab';
import { RegulationRequirementsTab } from '../components/regulations/RegulationRequirementsTab';

type TabKey = 'overview' | 'controls' | 'requirements' | 'documents' | 'activity' | 'related';

export function RegulationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [regulation, setRegulation] = useState<Regulation | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (id) {
      const regulations = loadRegulations();
      const found = getRegulationById(regulations, id);
      if (found) {
        setRegulation(found);
      } else {
        navigate('/regulations');
      }
    }
  }, [id, navigate]);

  function handleUpdate(data: Omit<Regulation, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) {
    if (!regulation) return;

    const regulations = loadRegulations();
    const today = new Date().toISOString().split('T')[0];
    const updated = regulations.map(r =>
      r.id === regulation.id
        ? { ...r, ...data, updatedAt: today, updatedBy: 'Emily Carter' }
        : r
    );

    saveRegulations(updated);
    const updatedReg = updated.find(r => r.id === regulation.id);
    if (updatedReg) setRegulation(updatedReg);
    setEditModalOpen(false);
  }

  function handleDelete() {
    if (!regulation) return;

    const regulations = loadRegulations();
    const updated = deleteRegulation(regulations, regulation.id);
    saveRegulations(updated);
    navigate('/regulations');
  }

  if (!regulation) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
          fontFamily: 'var(--font-family-primary)',
          fontSize: 'var(--text-base)',
          color: 'var(--muted-foreground)',
        }}
      >
        Loading...
      </div>
    );
  }

  const statusStyle = REGULATION_STATUS_STYLES[regulation.status];
  const complianceStyle = COMPLIANCE_STATUS_STYLES[regulation.complianceStatus];
  const impactStyle = IMPACT_LEVEL_STYLES[regulation.impactLevel];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back Button */}
      <button
        onClick={() => navigate('/regulations')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'transparent',
          border: 'none',
          color: 'var(--muted-foreground)',
          fontFamily: 'var(--font-family-primary)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-semibold)',
          cursor: 'pointer',
          padding: 0,
          width: 'fit-content',
        }}
      >
        <ArrowLeft size={16} />
        Back to Regulations
      </button>

      {/* Header Card */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Title Row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <FileText size={24} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <h1
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '28px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--foreground)',
                  margin: 0,
                  lineHeight: '36px',
                }}
              >
                {regulation.title}
              </h1>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                color: 'var(--muted-foreground)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <span>{regulation.id}</span>
              <span>·</span>
              <span>{regulation.regulationNumber}</span>
              <span>·</span>
              <span>{regulation.regulatoryBody}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {regulation.officialUrl && (
              <a
                href={regulation.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  height: '36px',
                  padding: '0 16px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-button)',
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
              >
                <ExternalLink size={16} />
                Official Source
              </a>
            )}
            <button
              onClick={() => setEditModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '36px',
                padding: '0 16px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-button)',
                background: 'var(--background)',
                color: 'var(--foreground)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
              }}
            >
              <Edit size={16} />
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
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
            {REGULATION_STATUS_LABELS[regulation.status]}
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: '22px',
              padding: '0 10px',
              borderRadius: '100px',
              background: complianceStyle.background,
              color: complianceStyle.color,
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            {COMPLIANCE_STATUS_LABELS[regulation.complianceStatus]}
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: '22px',
              padding: '0 10px',
              borderRadius: '100px',
              background: impactStyle.background,
              color: impactStyle.color,
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            {IMPACT_LEVEL_LABELS[regulation.impactLevel]} Impact
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: '22px',
              padding: '0 10px',
              borderRadius: '100px',
              background: 'var(--muted)',
              color: 'var(--muted-foreground)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            {REGULATION_STAGE_LABELS[regulation.stage]}
          </span>
        </div>

        {/* Metadata Row */}
        <div
          style={{
            display: 'flex',
            gap: '24px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                color: 'var(--muted-foreground)',
              }}
            >
              Category
            </div>
            <div
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--foreground)',
                fontWeight: 'var(--font-weight-semibold)',
              }}
            >
              {regulation.category}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                color: 'var(--muted-foreground)',
              }}
            >
              Jurisdiction
            </div>
            <div
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--foreground)',
                fontWeight: 'var(--font-weight-semibold)',
              }}
            >
              {regulation.jurisdiction}
            </div>
          </div>
          {regulation.primaryOwner && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  color: 'var(--muted-foreground)',
                }}
              >
                Primary Owner
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--foreground)',
                  fontWeight: 'var(--font-weight-semibold)',
                }}
              >
                {regulation.primaryOwner.name}
              </div>
            </div>
          )}
          {regulation.effectiveDate && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  color: 'var(--muted-foreground)',
                }}
              >
                Effective Date
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--foreground)',
                  fontWeight: 'var(--font-weight-semibold)',
                }}
              >
                {new Date(regulation.effectiveDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>
          )}
          {regulation.readinessScore > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  color: 'var(--muted-foreground)',
                }}
              >
                Readiness Score
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--foreground)',
                  fontWeight: 'var(--font-weight-semibold)',
                }}
              >
                {regulation.readinessScore}%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          overflow: 'hidden',
        }}
      >
        {/* Tab Bar */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            overflowX: 'auto',
          }}
        >
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'requirements', label: 'Requirements' },
            { key: 'controls', label: 'Controls' },
            { key: 'documents', label: 'Documents' },
            { key: 'activity', label: 'Activity' },
            { key: 'related', label: 'Related Items' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              style={{
                flex: '0 0 auto',
                height: '40px',
                padding: '0 24px',
                border: 'none',
                background: 'transparent',
                color: activeTab === tab.key ? 'var(--primary)' : 'var(--muted-foreground)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight:
                  activeTab === tab.key ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                cursor: 'pointer',
                borderBottom: activeTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
                transition: 'color 0.2s, border-color 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '24px' }}>
          {activeTab === 'overview' && <RegulationOverviewTab regulation={regulation} />}
          {activeTab === 'requirements' && <RegulationRequirementsTab regulation={regulation} />}
          {activeTab === 'controls' && (
            <RegulationControlsTab regulationId={regulation.id} onUpdate={() => {
              // Refresh regulation data after control linking
              const regulations = loadRegulations();
              const updated = getRegulationById(regulations, regulation.id);
              if (updated) setRegulation(updated);
            }} />
          )}
          {activeTab === 'documents' && <RegulationDocumentsTab regulation={regulation} />}
          {activeTab === 'activity' && <RegulationActivityTab regulation={regulation} />}
          {activeTab === 'related' && <RegulationRelatedTab regulation={regulation} />}
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <RegulationFormModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleUpdate}
          initialData={regulation}
        />
      )}

      {/* Delete Confirmation */}
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
          onClick={e => {
            if (e.target === e.currentTarget) setDeleteConfirmOpen(false);
          }}
        >
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              boxShadow: '0px 8px 32px rgba(0,0,0,0.18)',
              width: '100%',
              maxWidth: '400px',
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
              Delete Regulation
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--foreground)',
                margin: 0,
              }}
            >
              Are you sure you want to delete <strong>{regulation.regulationNumber}</strong>? This action cannot be
              undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                style={{
                  height: '36px',
                  padding: '0 16px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-button)',
                  background: 'var(--background)',
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
    </div>
  );
}