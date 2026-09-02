import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Regulation, RegulationStatus, RegulationStage, ComplianceStatus, ImpactLevel } from '../../data/regulationData';
import {
  REGULATION_STATUS_LABELS, REGULATION_STAGE_LABELS,
  COMPLIANCE_STATUS_LABELS, IMPACT_LEVEL_LABELS,
} from '../../data/regulationData';
import { UserPicker } from '../shared/UserPicker';
import type { AppUser } from '../../data/mockData';
import { MOCK_USERS } from '../../data/mockData';
import { useApp } from '../../context/AppContext';

interface RegulationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Regulation, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => void;
  initialData?: Regulation;
}

export function RegulationFormModal({ isOpen, onClose, onSave, initialData }: RegulationFormModalProps) {
  const { getActiveOptions } = useApp();

  const [regulationNumber, setRegulationNumber] = useState(initialData?.regulationNumber || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [regulatoryBody, setRegulatoryBody] = useState(initialData?.regulatoryBody || '');
  const [jurisdiction, setJurisdiction] = useState(initialData?.jurisdiction || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [impactLevel, setImpactLevel] = useState<ImpactLevel>(initialData?.impactLevel || 'medium');
  const [status, setStatus] = useState<RegulationStatus>(initialData?.status || 'monitoring');
  const [stage, setStage] = useState<RegulationStage>(initialData?.stage || 'proposed');
  const [proposedDate, setProposedDate] = useState(initialData?.proposedDate || '');
  const [publicationDate, setPublicationDate] = useState(initialData?.publicationDate || '');
  const [effectiveDate, setEffectiveDate] = useState(initialData?.effectiveDate || '');
  const [complianceDeadline, setComplianceDeadline] = useState(initialData?.complianceDeadline || '');
  const [reviewDate, setReviewDate] = useState(initialData?.reviewDate || '');
  const [primaryOwner, setPrimaryOwner] = useState<AppUser | null>(initialData?.primaryOwner || null);
  const [stakeholders, setStakeholders] = useState<AppUser[]>(initialData?.stakeholders || []);
  const [department, setDepartment] = useState(initialData?.department || '');
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus>(
    initialData?.complianceStatus || 'not-started'
  );
  const [gapAnalysisCompleted, setGapAnalysisCompleted] = useState(initialData?.gapAnalysisCompleted || false);
  const [readinessScore, setReadinessScore] = useState(initialData?.readinessScore || 0);
  const [estimatedCost, setEstimatedCost] = useState(initialData?.estimatedCost?.toString() || '');
  const [officialUrl, setOfficialUrl] = useState(initialData?.officialUrl || '');
  const [tags, setTags] = useState(initialData?.tags?.join(', ') || '');

  const regulatoryBodies = getActiveOptions('Regulation', 'Regulatory Body');
  const jurisdictions = getActiveOptions('Regulation', 'Jurisdiction');
  const categories = getActiveOptions('Regulation', 'Category');
  const departments = getActiveOptions('Risk', 'Department'); // Reuse department options

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validation
    if (!regulationNumber.trim()) {
      alert('Regulation Number is required');
      return;
    }
    if (!title.trim()) {
      alert('Title is required');
      return;
    }
    if (!regulatoryBody) {
      alert('Regulatory Body is required');
      return;
    }
    if (!jurisdiction) {
      alert('Jurisdiction is required');
      return;
    }
    if (!category) {
      alert('Category is required');
      return;
    }

    const data: Omit<Regulation, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'> = {
      regulationNumber: regulationNumber.trim(),
      title: title.trim(),
      description: description.trim(),
      regulatoryBody,
      jurisdiction,
      category,
      impactLevel,
      status,
      stage,
      proposedDate: proposedDate || null,
      publicationDate: publicationDate || null,
      effectiveDate: effectiveDate || null,
      complianceDeadline: complianceDeadline || null,
      reviewDate: reviewDate || null,
      primaryOwner,
      stakeholders,
      department,
      relatedBillIds: initialData?.relatedBillIds || [],
      linkedControlIds: initialData?.linkedControlIds || [],
      supersedes: initialData?.supersedes || null,
      supersededBy: initialData?.supersededBy || null,
      complianceStatus,
      gapAnalysisCompleted,
      readinessScore,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
      officialUrl: officialUrl.trim() || null,
      attachmentIds: initialData?.attachmentIds || [],
      tags: tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t),
    };

    onSave(data);
  }

  if (!isOpen) return null;

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
          maxWidth: '800px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
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
            {initialData ? 'Edit Regulation' : 'Add Regulation'}
          </h2>
          <button
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              border: 'none',
              borderRadius: 'var(--radius-button)',
              background: 'transparent',
              color: 'var(--muted-foreground)',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Core Identity */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '14px',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--foreground)',
                    margin: 0,
                    paddingBottom: '8px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  Core Identity
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '14px',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--foreground)',
                      }}
                    >
                      Regulation Number <span style={{ color: 'var(--destructive)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={regulationNumber}
                      onChange={e => setRegulationNumber(e.target.value)}
                      placeholder="e.g., SOX-404, GDPR-2016/679"
                      required
                      style={{
                        height: '36px',
                        padding: '0 12px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-input)',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        color: 'var(--foreground)',
                        background: 'var(--background)',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '14px',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--foreground)',
                      }}
                    >
                      Department
                    </label>
                    <select
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      style={{
                        height: '36px',
                        padding: '0 12px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-input)',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        color: 'var(--foreground)',
                        background: 'var(--background)',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">Select Department</option>
                      {departments.map(d => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '14px',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--foreground)',
                    }}
                  >
                    Title <span style={{ color: 'var(--destructive)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Enter regulation title"
                    required
                    style={{
                      height: '36px',
                      padding: '0 12px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-input)',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      color: 'var(--foreground)',
                      background: 'var(--background)',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '14px',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--foreground)',
                    }}
                  >
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Enter detailed description"
                    rows={4}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-input)',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      color: 'var(--foreground)',
                      background: 'var(--background)',
                      resize: 'vertical',
                    }}
                  />
                </div>
              </div>

              {/* Classification */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '14px',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--foreground)',
                    margin: 0,
                    paddingBottom: '8px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  Classification
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '14px',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--foreground)',
                      }}
                    >
                      Regulatory Body <span style={{ color: 'var(--destructive)' }}>*</span>
                    </label>
                    <select
                      value={regulatoryBody}
                      onChange={e => setRegulatoryBody(e.target.value)}
                      required
                      style={{
                        height: '36px',
                        padding: '0 12px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-input)',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        color: 'var(--foreground)',
                        background: 'var(--background)',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">Select Body</option>
                      {regulatoryBodies.map(body => (
                        <option key={body} value={body}>
                          {body}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '14px',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--foreground)',
                      }}
                    >
                      Jurisdiction <span style={{ color: 'var(--destructive)' }}>*</span>
                    </label>
                    <select
                      value={jurisdiction}
                      onChange={e => setJurisdiction(e.target.value)}
                      required
                      style={{
                        height: '36px',
                        padding: '0 12px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-input)',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        color: 'var(--foreground)',
                        background: 'var(--background)',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">Select Jurisdiction</option>
                      {jurisdictions.map(j => (
                        <option key={j} value={j}>
                          {j}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '14px',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--foreground)',
                      }}
                    >
                      Category <span style={{ color: 'var(--destructive)' }}>*</span>
                    </label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      required
                      style={{
                        height: '36px',
                        padding: '0 12px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-input)',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        color: 'var(--foreground)',
                        background: 'var(--background)',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '14px',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--foreground)',
                      }}
                    >
                      Impact Level
                    </label>
                    <select
                      value={impactLevel}
                      onChange={e => setImpactLevel(e.target.value as ImpactLevel)}
                      style={{
                        height: '36px',
                        padding: '0 12px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-input)',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        color: 'var(--foreground)',
                        background: 'var(--background)',
                        cursor: 'pointer',
                      }}
                    >
                      {(['critical', 'high', 'medium', 'low'] as ImpactLevel[]).map(level => (
                        <option key={level} value={level}>
                          {IMPACT_LEVEL_LABELS[level]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Status & Lifecycle */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '14px',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--foreground)',
                    margin: 0,
                    paddingBottom: '8px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  Status & Lifecycle
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '14px',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--foreground)',
                      }}
                    >
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value as RegulationStatus)}
                      style={{
                        height: '36px',
                        padding: '0 12px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-input)',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        color: 'var(--foreground)',
                        background: 'var(--background)',
                        cursor: 'pointer',
                      }}
                    >
                      {(
                        ['monitoring', 'in-review', 'in-progress', 'compliant', 'non-compliant', 'not-applicable', 'archived'] as RegulationStatus[]
                      ).map(s => (
                        <option key={s} value={s}>
                          {REGULATION_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '14px',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--foreground)',
                      }}
                    >
                      Stage
                    </label>
                    <select
                      value={stage}
                      onChange={e => setStage(e.target.value as RegulationStage)}
                      style={{
                        height: '36px',
                        padding: '0 12px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-input)',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        color: 'var(--foreground)',
                        background: 'var(--background)',
                        cursor: 'pointer',
                      }}
                    >
                      {(['proposed', 'committee', 'passed', 'effective', 'amended', 'repealed'] as RegulationStage[]).map(
                        s => (
                          <option key={s} value={s}>
                            {REGULATION_STAGE_LABELS[s]}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '14px',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--foreground)',
                      }}
                    >
                      Compliance Status
                    </label>
                    <select
                      value={complianceStatus}
                      onChange={e => setComplianceStatus(e.target.value as ComplianceStatus)}
                      style={{
                        height: '36px',
                        padding: '0 12px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-input)',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        color: 'var(--foreground)',
                        background: 'var(--background)',
                        cursor: 'pointer',
                      }}
                    >
                      {(
                        ['not-started', 'assessment', 'planning', 'implementing', 'testing', 'compliant', 'partial', 'non-compliant'] as ComplianceStatus[]
                      ).map(s => (
                        <option key={s} value={s}>
                          {COMPLIANCE_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '14px',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--foreground)',
                      }}
                    >
                      Readiness Score (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={readinessScore}
                      onChange={e => setReadinessScore(parseInt(e.target.value) || 0)}
                      style={{
                        height: '36px',
                        padding: '0 12px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-input)',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        color: 'var(--foreground)',
                        background: 'var(--background)',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="gapAnalysis"
                    checked={gapAnalysisCompleted}
                    onChange={e => setGapAnalysisCompleted(e.target.checked)}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer',
                    }}
                  />
                  <label
                    htmlFor="gapAnalysis"
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      color: 'var(--foreground)',
                      cursor: 'pointer',
                    }}
                  >
                    Gap Analysis Completed
                  </label>
                </div>
              </div>

              {/* Dates */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '14px',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--foreground)',
                    margin: 0,
                    paddingBottom: '8px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  Dates
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '14px',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--foreground)',
                      }}
                    >
                      Proposed Date
                    </label>
                    <input
                      type="date"
                      value={proposedDate}
                      onChange={e => setProposedDate(e.target.value)}
                      style={{
                        height: '36px',
                        padding: '0 12px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-input)',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        color: 'var(--foreground)',
                        background: 'var(--background)',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '14px',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--foreground)',
                      }}
                    >
                      Publication Date
                    </label>
                    <input
                      type="date"
                      value={publicationDate}
                      onChange={e => setPublicationDate(e.target.value)}
                      style={{
                        height: '36px',
                        padding: '0 12px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-input)',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        color: 'var(--foreground)',
                        background: 'var(--background)',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '14px',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--foreground)',
                      }}
                    >
                      Effective Date
                    </label>
                    <input
                      type="date"
                      value={effectiveDate}
                      onChange={e => setEffectiveDate(e.target.value)}
                      style={{
                        height: '36px',
                        padding: '0 12px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-input)',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        color: 'var(--foreground)',
                        background: 'var(--background)',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '14px',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--foreground)',
                      }}
                    >
                      Compliance Deadline
                    </label>
                    <input
                      type="date"
                      value={complianceDeadline}
                      onChange={e => setComplianceDeadline(e.target.value)}
                      style={{
                        height: '36px',
                        padding: '0 12px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-input)',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        color: 'var(--foreground)',
                        background: 'var(--background)',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '14px',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--foreground)',
                      }}
                    >
                      Review Date
                    </label>
                    <input
                      type="date"
                      value={reviewDate}
                      onChange={e => setReviewDate(e.target.value)}
                      style={{
                        height: '36px',
                        padding: '0 12px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-input)',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        color: 'var(--foreground)',
                        background: 'var(--background)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Ownership */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '14px',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--foreground)',
                    margin: 0,
                    paddingBottom: '8px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  Ownership
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '14px',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--foreground)',
                    }}
                  >
                    Primary Owner
                  </label>
                  <UserPicker
                    value={primaryOwner}
                    onChange={(val) => setPrimaryOwner(val as AppUser | null)}
                    users={MOCK_USERS}
                    placeholder="Select owner..."
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '14px',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--foreground)',
                    }}
                  >
                    Stakeholders
                  </label>
                  <UserPicker
                    value={stakeholders}
                    onChange={(val) => setStakeholders(val as AppUser[])}
                    users={MOCK_USERS}
                    placeholder="Select stakeholders..."
                    multiple
                  />
                </div>
              </div>

              {/* Additional Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '14px',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--foreground)',
                    margin: 0,
                    paddingBottom: '8px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  Additional Information
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '14px',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--foreground)',
                      }}
                    >
                      Estimated Cost ($)
                    </label>
                    <input
                      type="number"
                      value={estimatedCost}
                      onChange={e => setEstimatedCost(e.target.value)}
                      placeholder="0.00"
                      style={{
                        height: '36px',
                        padding: '0 12px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-input)',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        color: 'var(--foreground)',
                        background: 'var(--background)',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '14px',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--foreground)',
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
                        height: '36px',
                        padding: '0 12px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-input)',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        color: 'var(--foreground)',
                        background: 'var(--background)',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '14px',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--foreground)',
                    }}
                  >
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    placeholder="e.g., financial, audit, compliance"
                    style={{
                      height: '36px',
                      padding: '0 12px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-input)',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      color: 'var(--foreground)',
                      background: 'var(--background)',
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
              type="submit"
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
              {initialData ? 'Save Changes' : 'Create Regulation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}