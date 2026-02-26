import React, { useState, useEffect, useMemo } from 'react';
import { FormModal, Field, TextInput, TextareaInput, SelectInput } from '../shared/FormModal';
import { UserPickerInput } from '../shared/UserPicker';
import { useApp } from '../../context/AppContext';
import type { RiskAssessment, AssessmentType, RiskRating } from '../../data/riskAssessmentData';
import {
  ASSESSMENT_TYPE_LABELS,
  LIKELIHOOD_LABELS, IMPACT_LABELS, VELOCITY_LABELS,
  computeInherentScore, deriveRiskRating,
  RISK_RATING_LABELS, RISK_RATING_STYLES,
} from '../../data/riskAssessmentData';
import type { AppUser } from '../../data/mockData';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RiskAssessmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<RiskAssessment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: RiskAssessment | null;
  riskId: string;
}

type FormErrors = Partial<Record<string, string>>;

interface FormState {
  reviewer: AppUser | null;
  assessmentDate: string;
  assessmentType: AssessmentType;
  likelihoodScore: number;
  impactScore: number;
  velocityScore: string; // string because empty = null
  residualScore: string;
  targetScore: string;
  notes: string;
  isCurrent: boolean;
}

const EMPTY: FormState = {
  reviewer: null,
  assessmentDate: new Date().toISOString().split('T')[0],
  assessmentType: 'periodic',
  likelihoodScore: 3,
  impactScore: 3,
  velocityScore: '',
  residualScore: '',
  targetScore: '',
  notes: '',
  isCurrent: true,
};

// ─── Score scale buttons ─────────────────────────────────────────────────────

function ScoreSelector({
  value,
  onChange,
  labels,
  hasError,
}: {
  value: number;
  onChange: (v: number) => void;
  labels: Record<number, string>;
  hasError?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map(n => {
          const isActive = n === value;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              style={{
                width: '40px',
                height: '36px',
                border: `1px solid ${hasError ? 'var(--destructive)' : isActive ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-input)',
                background: isActive ? 'var(--primary)' : 'var(--input-background)',
                color: isActive ? 'var(--primary-foreground)' : 'var(--foreground)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
                transition: 'all 0.1s',
                padding: 0,
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
      <span
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '11px',
          color: 'var(--muted-foreground)',
          lineHeight: '14px',
        }}
      >
        {labels[value] ?? ''}
      </span>
    </div>
  );
}

// ─── Rating badge (inline) ──────────────────────────────────────────────────

function RatingBadge({ rating }: { rating: RiskRating }) {
  const style = RISK_RATING_STYLES[rating];
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
      {RISK_RATING_LABELS[rating]}
    </span>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RiskAssessmentFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  riskId,
}: RiskAssessmentFormModalProps) {
  const { getActiveOptions } = useApp();
  const assessmentTypes = getActiveOptions('Assessment', 'Type');

  const [form, setForm] = useState<FormState>({ ...EMPTY });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          reviewer: initialData.reviewer,
          assessmentDate: initialData.assessmentDate,
          assessmentType: initialData.assessmentType,
          likelihoodScore: initialData.likelihoodScore,
          impactScore: initialData.impactScore,
          velocityScore: initialData.velocityScore != null ? String(initialData.velocityScore) : '',
          residualScore: String(initialData.residualScore),
          targetScore: initialData.targetScore != null ? String(initialData.targetScore) : '',
          notes: initialData.notes,
          isCurrent: initialData.isCurrent,
        });
      } else {
        setForm({ ...EMPTY, assessmentDate: new Date().toISOString().split('T')[0] });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  // Computed values
  const inherentScore = useMemo(
    () => computeInherentScore(form.likelihoodScore, form.impactScore),
    [form.likelihoodScore, form.impactScore]
  );

  const residualNum = parseFloat(form.residualScore) || 0;
  const computedRating = useMemo(() => deriveRiskRating(residualNum), [residualNum]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.reviewer) errs.reviewer = 'Reviewer is required.';
    if (!form.assessmentDate) errs.assessmentDate = 'Assessment date is required.';
    if (!form.residualScore.trim()) errs.residualScore = 'Residual score is required.';
    else {
      const r = parseFloat(form.residualScore);
      if (isNaN(r) || r < 1 || r > 25) errs.residualScore = 'Must be between 1 and 25.';
    }
    if (form.targetScore.trim()) {
      const t = parseFloat(form.targetScore);
      if (isNaN(t) || t < 1 || t > 25) errs.targetScore = 'Must be between 1 and 25.';
    }
    if (form.velocityScore.trim()) {
      const v = parseInt(form.velocityScore, 10);
      if (isNaN(v) || v < 1 || v > 5) errs.velocityScore = 'Must be between 1 and 5.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const residual = parseFloat(form.residualScore);
    const target = form.targetScore.trim() ? parseFloat(form.targetScore) : null;
    const velocity = form.velocityScore.trim() ? parseInt(form.velocityScore, 10) : null;

    onSave({
      riskId,
      reviewer: form.reviewer,
      assessmentDate: form.assessmentDate,
      assessmentType: form.assessmentType,
      likelihoodScore: form.likelihoodScore,
      impactScore: form.impactScore,
      velocityScore: velocity,
      inherentScore,
      residualScore: residual,
      targetScore: target,
      riskRating: deriveRiskRating(residual),
      notes: form.notes,
      isCurrent: form.isCurrent,
    });
    onClose();
  }

  return (
    <FormModal
      title={initialData ? 'Edit Assessment' : 'New Risk Assessment'}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={initialData ? 'Save Changes' : 'Submit Assessment'}
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Row: Assessment Date + Type */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Assessment Date" required error={errors.assessmentDate}>
            <TextInput
              type="date"
              value={form.assessmentDate}
              onChange={e => set('assessmentDate', e.target.value)}
              hasError={!!errors.assessmentDate}
            />
          </Field>
          <Field label="Assessment Type" required>
            <SelectInput
              value={form.assessmentType}
              onChange={e => set('assessmentType', e.target.value as AssessmentType)}
            >
              {assessmentTypes.map(t => (
                <option key={t} value={t}>{ASSESSMENT_TYPE_LABELS[t as AssessmentType] ?? t}</option>
              ))}
            </SelectInput>
          </Field>
        </div>

        {/* Reviewer */}
        <Field label="Reviewer" required error={errors.reviewer} helpText="Person who performed this assessment.">
          <UserPickerInput
            value={form.reviewer}
            onChange={u => set('reviewer', u)}
            placeholder="Select reviewer..."
            hasError={!!errors.reviewer}
          />
        </Field>

        {/* Separator */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            margin: '4px 0',
            position: 'relative',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '-10px',
              left: '0',
              background: 'var(--card)',
              paddingRight: '8px',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--muted-foreground)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Risk Scoring
          </span>
        </div>

        {/* Likelihood + Impact */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Likelihood Score" required helpText="Probability of occurrence (1–5).">
            <ScoreSelector
              value={form.likelihoodScore}
              onChange={v => set('likelihoodScore', v)}
              labels={LIKELIHOOD_LABELS}
            />
          </Field>
          <Field label="Impact Score" required helpText="Magnitude of impact (1–5).">
            <ScoreSelector
              value={form.impactScore}
              onChange={v => set('impactScore', v)}
              labels={IMPACT_LABELS}
            />
          </Field>
        </div>

        {/* Computed Inherent Score */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '12px 16px',
            background: 'var(--muted)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ flex: 1 }}>
            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--muted-foreground)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Inherent Score
            </span>
            <div
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '24px',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--foreground)',
                lineHeight: '1.2',
                marginTop: '2px',
              }}
            >
              {inherentScore}
            </div>
            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '11px',
                color: 'var(--muted-foreground)',
              }}
            >
              {form.likelihoodScore} × {form.impactScore} = {inherentScore} (before controls)
            </span>
          </div>
          <RatingBadge rating={deriveRiskRating(inherentScore)} />
        </div>

        {/* Residual + Target + Velocity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <Field label="Residual Score" required error={errors.residualScore} helpText="After existing controls (1–25).">
            <TextInput
              type="number"
              min="1"
              max="25"
              step="0.01"
              value={form.residualScore}
              onChange={e => set('residualScore', e.target.value)}
              hasError={!!errors.residualScore}
              placeholder="e.g. 12"
            />
          </Field>
          <Field label="Target Score" error={errors.targetScore} helpText="Desired end-state (1–25).">
            <TextInput
              type="number"
              min="1"
              max="25"
              step="0.01"
              value={form.targetScore}
              onChange={e => set('targetScore', e.target.value)}
              hasError={!!errors.targetScore}
              placeholder="Optional"
            />
          </Field>
          <Field label="Velocity Score" error={errors.velocityScore} helpText="Speed of impact (1–5).">
            <TextInput
              type="number"
              min="1"
              max="5"
              value={form.velocityScore}
              onChange={e => set('velocityScore', e.target.value)}
              hasError={!!errors.velocityScore}
              placeholder="Optional"
            />
          </Field>
        </div>

        {/* Derived Rating display */}
        {form.residualScore.trim() && !errors.residualScore && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: RISK_RATING_STYLES[computedRating].background,
              borderRadius: 'var(--radius-card)',
              border: `1px solid ${RISK_RATING_STYLES[computedRating].color}20`,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--muted-foreground)',
              }}
            >
              Derived Risk Rating:
            </span>
            <RatingBadge rating={computedRating} />
          </div>
        )}

        {/* Notes */}
        <Field label="Notes" helpText="Narrative justification for the scores assigned.">
          <TextareaInput
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Explain the rationale behind the scoring, key findings, and any changes from the previous assessment..."
          />
        </Field>

        {/* Is Current radio */}
        <Field label="Mark as Current Assessment" helpText="Only one assessment per risk can be marked as current.">
          <div style={{ display: 'flex', gap: '16px' }}>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--foreground)',
              }}
            >
              <input
                type="radio"
                name="isCurrent"
                checked={form.isCurrent === true}
                onChange={() => set('isCurrent', true)}
                style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
              />
              Yes
            </label>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--foreground)',
              }}
            >
              <input
                type="radio"
                name="isCurrent"
                checked={form.isCurrent === false}
                onChange={() => set('isCurrent', false)}
                style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
              />
              No
            </label>
          </div>
        </Field>
      </div>
    </FormModal>
  );
}