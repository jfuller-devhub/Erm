import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { FormModal, Field, TextInput, TextareaInput, SelectInput } from '../shared/FormModal';
import type { Benefit, BenefitStatus, QnxtConfigStatus } from '../../data/benefitData';
import {
  BENEFIT_CATEGORIES,
  loadBenefits,
  saveBenefits,
  createBenefit,
  updateBenefit,
} from '../../data/benefitData';

const QNXT_CONFIG_STATUSES: QnxtConfigStatus[] = ['Not Started', 'In Progress', 'Complete', 'Verified'];

// ─── Props ───────────────────────────────────────────────────────────────────

interface BenefitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (benefit: Benefit) => void;
  planId: string;
  editingBenefit?: Benefit | null;
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export function BenefitFormModal({
  isOpen,
  onClose,
  onSave,
  planId,
  editingBenefit,
}: BenefitFormModalProps) {
  const isEditing = !!editingBenefit;

  // ─── Core benefit state ────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(BENEFIT_CATEGORIES[0]);
  const [status, setStatus] = useState<BenefitStatus>('Draft');
  const [description, setDescription] = useState('');
  const [coverageDetails, setCoverageDetails] = useState('');
  const [limits, setLimits] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [effectiveStartDate, setEffectiveStartDate] = useState('');
  const [effectiveEndDate, setEffectiveEndDate] = useState('');

  // ─── QNXT configuration state ──────────────────────────────────────────
  const [qnxtConfigStatus, setQnxtConfigStatus] = useState<QnxtConfigStatus>('Not Started');
  const [qnxtBenefitCode, setQnxtBenefitCode] = useState('');
  const [qnxtConfiguredBy, setQnxtConfiguredBy] = useState('');
  const [qnxtConfiguredDate, setQnxtConfiguredDate] = useState('');
  const [qnxtNotes, setQnxtNotes] = useState('');
  const [qnxtExpanded, setQnxtExpanded] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Reset on open ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (editingBenefit) {
      setName(editingBenefit.name);
      setCategory(editingBenefit.category || BENEFIT_CATEGORIES[0]);
      setStatus(editingBenefit.status);
      setDescription(editingBenefit.description);
      setCoverageDetails(editingBenefit.coverageDetails);
      setLimits(editingBenefit.limits);
      setEligibility(editingBenefit.eligibility);
      setEffectiveStartDate(editingBenefit.effectiveStartDate);
      setEffectiveEndDate(editingBenefit.effectiveEndDate);
      setQnxtConfigStatus(editingBenefit.qnxtConfigStatus ?? 'Not Started');
      setQnxtBenefitCode(editingBenefit.qnxtBenefitCode ?? '');
      setQnxtConfiguredBy(editingBenefit.qnxtConfiguredBy ?? '');
      setQnxtConfiguredDate(editingBenefit.qnxtConfiguredDate ?? '');
      setQnxtNotes(editingBenefit.qnxtNotes ?? '');
      setQnxtExpanded(editingBenefit.qnxtConfigStatus !== 'Not Started');
    } else {
      setName('');
      setCategory(BENEFIT_CATEGORIES[0]);
      setStatus('Draft');
      setDescription('');
      setCoverageDetails('');
      setLimits('');
      setEligibility('');
      setEffectiveStartDate('');
      setEffectiveEndDate('');
      setQnxtConfigStatus('Not Started');
      setQnxtBenefitCode('');
      setQnxtConfiguredBy('');
      setQnxtConfiguredDate('');
      setQnxtNotes('');
      setQnxtExpanded(false);
    }
    setErrors({});
  }, [isOpen, editingBenefit]);

  // ─── Validation ────────────────────────────────────────────────────────
  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Benefit name is required.';
    if (!category) errs.category = 'Category is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ─── Submit ────────────────────────────────────────────────────────────
  function handleSubmit() {
    if (!validate()) return;

    const data = {
      planId,
      name: name.trim(),
      category,
      status,
      description,
      coverageDetails,
      limits,
      eligibility,
      effectiveStartDate,
      effectiveEndDate,
      qnxtConfigStatus,
      qnxtBenefitCode: qnxtBenefitCode.trim(),
      qnxtConfiguredBy: qnxtConfiguredBy.trim(),
      qnxtConfiguredDate,
      qnxtNotes: qnxtNotes.trim(),
    };

    const benefits = loadBenefits();
    let saved: Benefit;

    if (isEditing && editingBenefit) {
      saved = updateBenefit(editingBenefit, data);
      const updated = benefits.map(b => (b.id === saved.id ? saved : b));
      saveBenefits(updated);
    } else {
      saved = createBenefit(data);
      saveBenefits([...benefits, saved]);
    }

    onSave(saved);
    onClose();
  }

  return (
    <FormModal
      title={isEditing ? 'Edit Benefit' : 'New Benefit'}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? 'Save Changes' : 'Create Benefit'}
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Name */}
        <Field label="Benefit Name" required error={errors.name}>
          <TextInput
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. In-Network Coverage"
            hasError={!!errors.name}
          />
        </Field>

        {/* Category + Status row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '16px' }}>
          <Field label="Category" required error={errors.category}>
            <SelectInput
              value={category}
              onChange={e => setCategory(e.target.value)}
              hasError={!!errors.category}
            >
              {BENEFIT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Status">
            <SelectInput value={status} onChange={e => setStatus(e.target.value as BenefitStatus)}>
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Archived">Archived</option>
            </SelectInput>
          </Field>
        </div>

        {/* Description */}
        <Field label="Description">
          <TextareaInput
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe this benefit..."
            rows={2}
          />
        </Field>

        {/* Coverage Details */}
        <Field label="Coverage Details">
          <TextareaInput
            value={coverageDetails}
            onChange={e => setCoverageDetails(e.target.value)}
            placeholder="Describe what the plan covers and at what level..."
            rows={2}
          />
        </Field>

        {/* Limits */}
        <Field label="Limits">
          <TextareaInput
            value={limits}
            onChange={e => setLimits(e.target.value)}
            placeholder="Describe deductibles, maximums, or other limits..."
            rows={2}
          />
        </Field>

        {/* Eligibility */}
        <Field label="Eligibility">
          <TextareaInput
            value={eligibility}
            onChange={e => setEligibility(e.target.value)}
            placeholder="Who is eligible for this benefit?"
            rows={2}
          />
        </Field>

        {/* Effective dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Effective Start Date">
            <TextInput
              type="date"
              value={effectiveStartDate}
              onChange={e => setEffectiveStartDate(e.target.value)}
            />
          </Field>
          <Field label="Effective End Date">
            <TextInput
              type="date"
              value={effectiveEndDate}
              onChange={e => setEffectiveEndDate(e.target.value)}
            />
          </Field>
        </div>

        {/* ── QNXT Configuration ─────────────────────────────────────────────── */}
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          <button
            type="button"
            onClick={() => setQnxtExpanded(p => !p)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: '#f9fafb',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {qnxtExpanded
                ? <ChevronDown size={15} color="#6b7280" />
                : <ChevronRight size={15} color="#6b7280" />
              }
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                QNXT Configuration
              </span>
              {qnxtConfigStatus !== 'Not Started' && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  padding: '2px 7px',
                  borderRadius: '99px',
                  background: qnxtConfigStatus === 'Verified' ? '#dcfce7' : qnxtConfigStatus === 'Complete' ? '#dbeafe' : '#fef3c7',
                  color: qnxtConfigStatus === 'Verified' ? '#15803d' : qnxtConfigStatus === 'Complete' ? '#1d4ed8' : '#92400e',
                }}>
                  {qnxtConfigStatus}
                </span>
              )}
            </div>
          </button>

          {qnxtExpanded && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid #e5e7eb' }}>
              {/* Config Status */}
              <Field label="Configuration Status">
                <SelectInput
                  value={qnxtConfigStatus}
                  onChange={e => setQnxtConfigStatus(e.target.value as QnxtConfigStatus)}
                >
                  {QNXT_CONFIG_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </SelectInput>
              </Field>

              {/* Benefit Code + Configured By */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Field label="QNXT Benefit Code">
                  <TextInput
                    value={qnxtBenefitCode}
                    onChange={e => setQnxtBenefitCode(e.target.value)}
                    placeholder="e.g. MED-IN-001"
                  />
                </Field>
                <Field label="Configured By">
                  <TextInput
                    value={qnxtConfiguredBy}
                    onChange={e => setQnxtConfiguredBy(e.target.value)}
                    placeholder="Name of configuration analyst"
                  />
                </Field>
              </div>

              {/* Configured Date */}
              <Field label="Configuration Date">
                <TextInput
                  type="date"
                  value={qnxtConfiguredDate}
                  onChange={e => setQnxtConfiguredDate(e.target.value)}
                />
              </Field>

              {/* Notes */}
              <Field label="Configuration Notes">
                <TextareaInput
                  value={qnxtNotes}
                  onChange={e => setQnxtNotes(e.target.value)}
                  placeholder="Notes about how this benefit was set up in QNXT..."
                  rows={3}
                />
              </Field>
            </div>
          )}
        </div>
      </div>
    </FormModal>
  );
}
