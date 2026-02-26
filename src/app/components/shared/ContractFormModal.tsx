import React, { useState, useEffect } from 'react';
import { ExternalLink, ChevronRight } from 'lucide-react';
import { FormModal, Field, TextInput, TextareaInput, SelectInput } from './FormModal';
import { MultiUserPickerInput, UserPickerInput } from './UserPicker';
import { useApp } from '../../context/AppContext';
import type { Contract, AppUser } from '../../data/mockData';

// ─── Section header (matches design system card/section style) ────────────────

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        paddingBottom: '10px', borderBottom: '1px solid var(--border)',
      }}>
        <ChevronRight size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        <span style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '14px',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--foreground)',
        }}>
          {title}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Governance flag toggle (checkbox card) ──────────────────────────────────

function FlagToggle({
  id, checked, onChange, label, description,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <label
      htmlFor={id}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 14px',
        border: `1px solid ${checked ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-input)',
        background: checked ? 'rgba(35,34,240,0.04)' : 'var(--input-background)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        userSelect: 'none',
      }}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{
          marginTop: '2px',
          accentColor: 'var(--primary)',
          width: '15px',
          height: '15px',
          flexShrink: 0,
          cursor: 'pointer',
        }}
      />
      <div>
        <div style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-semibold)',
          color: checked ? 'var(--primary)' : 'var(--foreground)',
        }}>
          {label}
        </div>
        <div style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '12px',
          color: 'var(--muted-foreground)',
          marginTop: '2px',
        }}>
          {description}
        </div>
      </div>
    </label>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ContractFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Contract, 'id' | 'createdDate' | 'updatedDate'>) => void;
  initialData?: Contract | null;
  vendors: { id: string; name: string }[];
  defaultVendorId?: string;
}

type FormErrors = Partial<Record<string, string>>;

function empty(defaultVendorId?: string, vendors?: { id: string; name: string }[]): Partial<Contract> {
  const v = vendors?.find(v => v.id === defaultVendorId);
  return {
    vendorId: defaultVendorId ?? '',
    vendorName: v?.name ?? '',
    title: '',
    type: 'Master Service Agreement',
    status: 'Pending',
    value: 0,
    startDate: '',
    endDate: '',
    owner: '',
    department: 'Operations',
    description: '',
    autoRenew: false,
    noticePeriodDays: 30,
    // Extended
    sharepointLink: '',
    vendorCommunicationsDirect: false,
    hasAIFeatures: false,
    evergreen: false,
    budgetManager: '',
    vendorSignatory: '',
    companySignatory: '',
    businessOwners: [],
    individualsInvolved: [],
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ContractFormModal({
  isOpen, onClose, onSave, initialData, vendors, defaultVendorId,
}: ContractFormModalProps) {
  const { getActiveOptions } = useApp();
  const contractTypes    = getActiveOptions('Contract', 'Type');
  const contractStatuses = getActiveOptions('Contract', 'Status');
  const departments      = getActiveOptions('Contract', 'Department');

  const [form, setForm]     = useState<Partial<Contract>>(empty(defaultVendorId, vendors));
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? { ...initialData } : empty(defaultVendorId, vendors));
      setErrors({});
    }
  }, [isOpen, initialData, defaultVendorId]);

  function set(field: string, value: string | number | boolean) {
    setForm(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'vendorId' ? { vendorName: vendors.find(v => v.id === value)?.name ?? '' } : {}),
    }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  function setUsers(field: 'businessOwners' | 'individualsInvolved', users: AppUser[]) {
    setForm(prev => ({ ...prev, [field]: users }));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.vendorId) errs.vendorId = 'Vendor is required.';
    if (!form.title?.trim()) errs.title = 'Contract title is required.';
    if (!form.startDate) errs.startDate = 'Start date is required.';
    if (!form.endDate) errs.endDate = 'End date is required.';
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      errs.endDate = 'End date must be after start date.';
    if (!form.owner?.trim()) errs.owner = 'Contract owner is required.';
    if (form.sharepointLink && !/^https?:\/\//i.test(form.sharepointLink))
      errs.sharepointLink = 'Must be a valid URL starting with http:// or https://';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSave(form as Omit<Contract, 'id' | 'createdDate' | 'updatedDate'>);
    onClose();
  }

  return (
    <FormModal
      title={initialData ? 'Edit Contract' : 'Add Contract'}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={initialData ? 'Save Changes' : 'Add Contract'}
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* ── Section 1: Contract Details ─────────────────────────────────── */}
        <FormSection title="Contract Details">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Vendor" required error={errors.vendorId}>
              <SelectInput
                value={form.vendorId}
                onChange={e => set('vendorId', e.target.value)}
                hasError={!!errors.vendorId}
                disabled={!!defaultVendorId && !initialData}
              >
                <option value="">— Select a Vendor —</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </SelectInput>
            </Field>
            <Field label="Contract Title" required error={errors.title}>
              <TextInput
                value={form.title}
                onChange={e => set('title', e.target.value)}
                hasError={!!errors.title}
                placeholder="e.g. Annual SaaS License"
              />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Contract Type" required>
              <SelectInput value={form.type} onChange={e => set('type', e.target.value)}>
                {contractTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </SelectInput>
            </Field>
            <Field label="Status" required>
              <SelectInput value={form.status} onChange={e => set('status', e.target.value)}>
                {contractStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </SelectInput>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <Field label="Start Date" required error={errors.startDate}>
              <TextInput
                type="date"
                value={form.startDate}
                onChange={e => set('startDate', e.target.value)}
                hasError={!!errors.startDate}
              />
            </Field>
            <Field label="End Date" required error={errors.endDate}>
              <TextInput
                type="date"
                value={form.endDate}
                onChange={e => set('endDate', e.target.value)}
                hasError={!!errors.endDate}
              />
            </Field>
            <Field label="Contract Value (USD)" helpText="Enter 0 for NDA/no-cost agreements.">
              <TextInput
                type="number"
                min="0"
                value={String(form.value ?? 0)}
                onChange={e => set('value', Number(e.target.value))}
                placeholder="0"
              />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Notice Period (Days)" helpText="Days required to notify before cancellation.">
              <TextInput
                type="number"
                min="0"
                value={String(form.noticePeriodDays ?? 30)}
                onChange={e => set('noticePeriodDays', Number(e.target.value))}
              />
            </Field>
            <Field label="Department">
              <SelectInput value={form.department} onChange={e => set('department', e.target.value)}>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </SelectInput>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Auto-Renew">
              <div style={{ display: 'flex', alignItems: 'center', height: '36px', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="autoRenew"
                  checked={!!form.autoRenew}
                  onChange={e => set('autoRenew', e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
                <label
                  htmlFor="autoRenew"
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-regular)',
                    color: 'var(--foreground)',
                    cursor: 'pointer',
                  }}
                >
                  Contract auto-renews at expiration
                </label>
              </div>
            </Field>
          </div>

          <Field label="Description" helpText="Brief summary of the contract scope and purpose.">
            <TextareaInput
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe the contract scope..."
            />
          </Field>
        </FormSection>

        {/* ── Section 2: Document Link ─────────────────────────────────────── */}
        <FormSection title="Document Link">
          <Field
            label="SharePoint Document URL"
            error={errors.sharepointLink}
            helpText="Link to the executed contract document stored in SharePoint."
          >
            <div style={{ position: 'relative' }}>
              <ExternalLink
                size={14}
                style={{
                  position: 'absolute', left: '10px', top: '50%',
                  transform: 'translateY(-50%)',
                  color: form.sharepointLink ? 'var(--primary)' : 'var(--muted-foreground)',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              />
              <TextInput
                value={form.sharepointLink ?? ''}
                onChange={e => set('sharepointLink', e.target.value)}
                hasError={!!errors.sharepointLink}
                placeholder="https://company.sharepoint.com/sites/contracts/..."
                style={{ paddingLeft: '32px' }}
              />
            </div>
          </Field>
        </FormSection>

        {/* ── Section 3: Governance Flags ─────────────────────────────────── */}
        <FormSection title="Governance Flags">
          <FlagToggle
            id="vendorComms"
            checked={!!form.vendorCommunicationsDirect}
            onChange={v => set('vendorCommunicationsDirect', v)}
            label="Vendor Provides Communications Directly to Members"
            description="The vendor sends communications, notices, or materials directly to members or end-users on behalf of your organization."
          />
          <FlagToggle
            id="aiFeatures"
            checked={!!form.hasAIFeatures}
            onChange={v => set('hasAIFeatures', v)}
            label="Contract Has AI Features"
            description="The vendor's product or service includes artificial intelligence or machine learning capabilities."
          />
          <FlagToggle
            id="evergreen"
            checked={!!form.evergreen}
            onChange={v => set('evergreen', v)}
            label="Evergreen Contract"
            description="This contract auto-renews indefinitely without a fixed expiry and requires active cancellation to terminate."
          />
        </FormSection>

        {/* ── Section 4: Ownership & Budget ───────────────────────────────── */}
        <FormSection title="Ownership & Budget">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Contract Owner" required error={errors.owner} helpText="Person responsible for managing this contract.">
              <TextInput
                value={form.owner}
                onChange={e => set('owner', e.target.value)}
                hasError={!!errors.owner}
                placeholder="Full name"
              />
            </Field>
            <Field label="Budget Manager" helpText="Person who controls budget approval for this contract.">
              <TextInput
                value={form.budgetManager ?? ''}
                onChange={e => set('budgetManager', e.target.value)}
                placeholder="Full name"
              />
            </Field>
          </div>

          <Field label="Business Owner(s)" helpText="Internal stakeholders who own the business relationship for this contract.">
            <MultiUserPickerInput
              value={(form.businessOwners as AppUser[]) ?? []}
              onChange={users => setUsers('businessOwners', users)}
              placeholder="Add business owners..."
            />
          </Field>

          <Field label="Individuals Involved" helpText="Other internal people involved in or aware of this contract.">
            <MultiUserPickerInput
              value={(form.individualsInvolved as AppUser[]) ?? []}
              onChange={users => setUsers('individualsInvolved', users)}
              placeholder="Add individuals..."
            />
          </Field>
        </FormSection>

        {/* ── Section 5: Signatories ──────────────────────────────────────── */}
        <FormSection title="Signatories">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Vendor Signatory" helpText="Name of the person who signed on behalf of the vendor.">
              <TextInput
                value={form.vendorSignatory ?? ''}
                onChange={e => set('vendorSignatory', e.target.value)}
                placeholder="e.g. Jane Smith"
              />
            </Field>
            <Field label="Company Signatory" helpText="Name of the person who signed on behalf of your organization.">
              <TextInput
                value={form.companySignatory ?? ''}
                onChange={e => set('companySignatory', e.target.value)}
                placeholder="e.g. John Doe"
              />
            </Field>
          </div>
        </FormSection>

      </div>
    </FormModal>
  );
}
