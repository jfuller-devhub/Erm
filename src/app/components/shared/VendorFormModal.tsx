import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Package, Search, X } from 'lucide-react';
import { FormModal, Field, TextInput, TextareaInput, SelectInput } from './FormModal';
import { UserPickerInput, MultiUserPickerInput } from './UserPicker';
import { useApp } from '../../context/AppContext';
import type { Vendor, VendorStatus, VendorCategory, AppUser, VendorProcessAssociation } from '../../data/mockData';
import type { Process } from '../../data/processData';
import { loadProcesses } from '../../data/processData';
import type { Product } from '../../data/productData';
import { loadProducts } from '../../data/productData';

interface VendorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Vendor, 'id' | 'createdDate' | 'updatedDate'>) => void;
  initialData?: Vendor | null;
}

type FormErrors = Partial<Record<keyof Vendor, string>>;

function empty(): Omit<Vendor, 'id' | 'createdDate' | 'updatedDate'> {
  return {
    name: '',
    category: 'Business Services',
    status: 'Active',
    department: '',
    primaryContact: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    website: '',
    notes: '',
    dmbaVendorManager: null,
    departmentOwner: '',
    documentationLink: '',
    baaRequired: false,
    individualsInvolved: [],
    processAssociations: [],
    productIds: [],
  };
}

export function VendorFormModal({ isOpen, onClose, onSave, initialData }: VendorFormModalProps) {
  const { getActiveOptions } = useApp();
  const categories  = getActiveOptions('Vendor', 'Category');
  const statuses    = getActiveOptions('Vendor', 'Status');
  const departments = getActiveOptions('Vendor', 'Department');

  const [form, setForm] = useState(empty());
  const [errors, setErrors] = useState<FormErrors>({});
  const [assocOpen, setAssocOpen] = useState(false);
  const [productAssocOpen, setProductAssocOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          name: initialData.name,
          category: initialData.category,
          status: initialData.status,
          department: initialData.department ?? '',
          primaryContact: initialData.primaryContact,
          email: initialData.email,
          phone: initialData.phone,
          address: initialData.address,
          taxId: initialData.taxId,
          website: initialData.website,
          notes: initialData.notes,
          dmbaVendorManager: initialData.dmbaVendorManager ?? null,
          departmentOwner: initialData.departmentOwner ?? '',
          documentationLink: initialData.documentationLink ?? '',
          baaRequired: initialData.baaRequired ?? false,
          individualsInvolved: initialData.individualsInvolved ?? [],
          processAssociations: initialData.processAssociations ?? [],
          productIds: initialData.productIds ?? [],
        });
        setAssocOpen((initialData.processAssociations ?? []).length > 0);
        setProductAssocOpen((initialData.productIds ?? []).length > 0);
      } else {
        setForm(empty());
        setAssocOpen(false);
        setProductAssocOpen(false);
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  function set(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = 'Vendor name is required.';
    if (!form.primaryContact.trim()) errs.primaryContact = 'Primary contact is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address.';
    if (form.documentationLink && !/^https?:\/\/.+/.test(form.documentationLink)) {
      errs.documentationLink = 'Enter a valid URL beginning with https://';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSave(form as Omit<Vendor, 'id' | 'createdDate' | 'updatedDate'>);
    onClose();
  }

  return (
    <FormModal
      title={initialData ? 'Edit Vendor' : 'Add Vendor'}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={initialData ? 'Save Changes' : 'Add Vendor'}
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ── Section: Contact Information ──────────────────────────── */}
        <FormSection title="Contact Information">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Primary Contact" required error={errors.primaryContact}>
              <TextInput
                value={form.primaryContact}
                onChange={e => set('primaryContact', e.target.value)}
                hasError={!!errors.primaryContact}
                placeholder="Full name"
              />
            </Field>
            <Field label="Email Address" required error={errors.email}>
              <TextInput
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                hasError={!!errors.email}
                placeholder="contact@company.com"
              />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Phone Number" helpText="Include country code for international numbers.">
              <TextInput
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </Field>
            <Field label="Website">
              <TextInput
                value={form.website}
                onChange={e => set('website', e.target.value)}
                placeholder="www.example.com"
              />
            </Field>
          </div>
        </FormSection>

        {/* ── Section: Business Information ─────────────────────────── */}
        <FormSection title="Business Information">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Vendor Name" required error={errors.name}>
              <TextInput
                value={form.name}
                onChange={e => set('name', e.target.value)}
                hasError={!!errors.name}
                placeholder="e.g. Accenture"
              />
            </Field>
            <Field label="Category" required>
              <SelectInput value={form.category} onChange={e => set('category', e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </SelectInput>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Status" required>
              <SelectInput value={form.status} onChange={e => set('status', e.target.value)}>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </SelectInput>
            </Field>
            <Field
              label="Managing Department"
              required
              helpText="Department responsible for managing this vendor."
            >
              <SelectInput value={form.department} onChange={e => set('department', e.target.value)}>
                <option value="">— Select a department —</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </SelectInput>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Tax ID / EIN" helpText="Federal Employer Identification Number.">
              <TextInput
                value={form.taxId}
                onChange={e => set('taxId', e.target.value)}
                placeholder="XX-XXXXXXX"
              />
            </Field>
          </div>
          <Field label="Address">
            <TextInput
              value={form.address}
              onChange={e => set('address', e.target.value)}
              placeholder="Street, City, State, ZIP"
            />
          </Field>
        </FormSection>

        {/* ── Section: Governance & Ownership ──────────────────────── */}
        <FormSection title="Governance & Ownership">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field
              label="DMBA Vendor Manager"
              helpText="Appian user responsible for managing this vendor relationship."
            >
              <UserPickerInput
                value={form.dmbaVendorManager}
                onChange={u => set('dmbaVendorManager', u)}
                placeholder="Select a user..."
              />
            </Field>
            <Field
              label="Department Owner"
              helpText="Business department that owns this vendor relationship."
            >
              <TextInput
                value={form.departmentOwner}
                onChange={e => set('departmentOwner', e.target.value)}
                placeholder="e.g. Finance, Technology"
              />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field
              label="Documentation Link"
              helpText="SharePoint URL for vendor documents and agreements."
              error={errors.documentationLink}
            >
              <TextInput
                value={form.documentationLink}
                onChange={e => set('documentationLink', e.target.value)}
                hasError={!!errors.documentationLink}
                placeholder="https://company.sharepoint.com/..."
              />
            </Field>
            <Field
              label="Business Associate Agreement"
              helpText="Indicates whether a BAA is required for this vendor."
            >
              <BAAToggle
                value={form.baaRequired}
                onChange={val => set('baaRequired', val)}
              />
            </Field>
          </div>

          <Field
            label="Individuals Involved"
            helpText="Internal team members involved with this vendor relationship."
          >
            <MultiUserPickerInput
              value={form.individualsInvolved as AppUser[]}
              onChange={users => set('individualsInvolved', users)}
              placeholder="Add individuals..."
            />
          </Field>
        </FormSection>

        {/* ── Section: Process Associations (collapsible) ──────────── */}
        <div>
          <button
            type="button"
            onClick={() => setAssocOpen(o => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
            }}
          >
            {assocOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Process Associations
            {form.processAssociations.length > 0 && (
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--primary)',
                  background: 'rgba(35,34,240,0.08)',
                  borderRadius: '100px',
                  padding: '1px 8px',
                }}
              >
                {form.processAssociations.length}
              </span>
            )}
          </button>
          {assocOpen && (
            <div style={{ marginTop: '8px' }}>
              <p
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--muted-foreground)',
                  margin: '0 0 8px 0',
                }}
              >
                Select the processes and sub-processes this vendor is associated with.
              </p>
              <ProcessAssociationPicker
                associations={form.processAssociations}
                onChange={assocs => set('processAssociations', assocs)}
              />
            </div>
          )}
        </div>

        {/* ── Section: Product Associations (collapsible) ──────────── */}
        <div>
          <button
            type="button"
            onClick={() => setProductAssocOpen(o => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
            }}
          >
            {productAssocOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Package size={14} style={{ color: 'var(--muted-foreground)' }} />
            Benefits or Services Associations
            {form.productIds.length > 0 && (
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--primary)',
                  background: 'rgba(35,34,240,0.08)',
                  borderRadius: '100px',
                  padding: '1px 8px',
                }}
              >
                {form.productIds.length}
              </span>
            )}
          </button>
          {productAssocOpen && (
            <div style={{ marginTop: '8px' }}>
              <p
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--muted-foreground)',
                  margin: '0 0 8px 0',
                }}
              >
                Link this vendor to the benefits or services they support.
              </p>
              <ProductPicker
                selectedIds={form.productIds}
                onChange={ids => set('productIds', ids)}
              />
            </div>
          )}
        </div>

        {/* ── Section: Internal Notes ───────────────────────────────── */}
        <FormSection title="Internal Notes">
          <Field label="Notes" helpText="Internal notes about this vendor. Not visible to the vendor.">
            <TextareaInput
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Add any relevant notes..."
              style={{ minHeight: '96px' }}
            />
          </Field>
        </FormSection>

      </div>
    </FormModal>
  );
}

// ─── Process Association Picker ──────────────────────────────────────────────

function ProcessAssociationPicker({
  associations,
  onChange,
}: {
  associations: VendorProcessAssociation[];
  onChange: (assocs: VendorProcessAssociation[]) => void;
}) {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setProcesses(loadProcesses());
  }, []);

  const associatedProcessIds = new Set(associations.map(a => a.processId));
  const associatedSubIds = new Set(
    associations.filter(a => a.subProcessId).map(a => `${a.processId}::${a.subProcessId}`)
  );

  function toggleProcess(processId: string) {
    if (associatedProcessIds.has(processId)) {
      onChange(associations.filter(a => a.processId !== processId));
    } else {
      onChange([...associations, { processId }]);
    }
  }

  function toggleSubProcess(processId: string, subProcessId: string) {
    const key = `${processId}::${subProcessId}`;
    if (associatedSubIds.has(key)) {
      onChange(associations.filter(a => !(a.processId === processId && a.subProcessId === subProcessId)));
    } else {
      onChange([...associations, { processId, subProcessId }]);
    }
  }

  if (processes.length === 0) {
    return (
      <div
        style={{
          padding: '16px',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-input)',
          background: 'var(--muted)',
          fontFamily: 'var(--font-family-primary)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-regular)',
          color: 'var(--muted-foreground)',
          textAlign: 'center',
        }}
      >
        No processes available. Create processes first in the Process Registry.
      </div>
    );
  }

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-input)',
        maxHeight: '260px',
        overflowY: 'auto',
      }}
    >
      {processes.map(proc => {
        const isProcessChecked = associatedProcessIds.has(proc.id);
        const subs = proc.subProcesses ?? [];
        const isExpanded = expanded[proc.id] ?? false;

        return (
          <div key={proc.id}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                borderBottom: '1px solid var(--border)',
                background: isProcessChecked ? 'rgba(35,34,240,0.04)' : 'var(--card)',
              }}
            >
              {subs.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setExpanded(prev => ({ ...prev, [proc.id]: !prev[proc.id] }))}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--muted-foreground)',
                    flexShrink: 0,
                  }}
                >
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
              ) : (
                <span style={{ width: '16px' }} />
              )}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flex: 1,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--foreground)',
                }}
              >
                <input
                  type="checkbox"
                  checked={isProcessChecked}
                  onChange={() => toggleProcess(proc.id)}
                  style={{ accentColor: 'var(--primary)', width: '14px', height: '14px' }}
                />
                {proc.name}
              </label>
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--muted-foreground)',
                }}
              >
                {proc.status}
              </span>
            </div>

            {isExpanded && subs.map(sp => {
              const subKey = `${proc.id}::${sp.id}`;
              const isSubChecked = associatedSubIds.has(subKey);
              return (
                <div
                  key={sp.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 10px 6px 42px',
                    borderBottom: '1px solid var(--border)',
                    background: isSubChecked ? 'rgba(35,34,240,0.04)' : 'var(--muted)',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flex: 1,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-regular)',
                      color: 'var(--foreground)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSubChecked}
                      onChange={() => toggleSubProcess(proc.id, sp.id)}
                      style={{ accentColor: 'var(--primary)', width: '13px', height: '13px' }}
                    />
                    {sp.name}
                  </label>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── Product Picker ──────────────────────────────────────────────────────

function ProductPicker({
  selectedIds,
  onChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setProducts(loadProducts());
  }, []);

  const selectedSet = new Set(selectedIds);

  function toggleProduct(productId: string) {
    if (selectedSet.has(productId)) {
      onChange(selectedIds.filter(id => id !== productId));
    } else {
      onChange([...selectedIds, productId]);
    }
  }

  if (products.length === 0) {
    return (
      <div
        style={{
          padding: '16px',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-input)',
          background: 'var(--muted)',
          fontFamily: 'var(--font-family-primary)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-regular)',
          color: 'var(--muted-foreground)',
          textAlign: 'center',
        }}
      >
        No benefits or services available. Create them first in the Benefits or Services Registry.
      </div>
    );
  }

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-input)',
        maxHeight: '260px',
        overflowY: 'auto',
      }}
    >
      {products.map(product => {
        const isChecked = selectedSet.has(product.id);
        return (
          <div key={product.id}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                borderBottom: '1px solid var(--border)',
                background: isChecked ? 'rgba(35,34,240,0.04)' : 'var(--card)',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flex: 1,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--foreground)',
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleProduct(product.id)}
                  style={{ accentColor: 'var(--primary)', width: '14px', height: '14px' }}
                />
                {product.name}
              </label>
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--muted-foreground)',
                }}
              >
                {product.status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── BAA Required toggle ──────────────────────────────────────────────────────

function BAAToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      style={{
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        style={{
          width: '44px',
          height: '24px',
          borderRadius: '100px',
          border: 'none',
          background: value ? 'var(--primary)' : 'var(--border)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
          padding: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '3px',
            left: value ? '23px' : '3px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transition: 'left 0.2s',
          }}
        />
      </button>
      <span
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: 'var(--text-base)',
          fontWeight: value ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
          color: value ? 'var(--foreground)' : 'var(--muted-foreground)',
          transition: 'color 0.15s',
        }}
      >
        {value ? 'BAA Required' : 'Not Required'}
      </span>
      {value && (
        <span
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '11px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--destructive)',
            background: 'rgba(222,0,55,0.08)',
            border: '1px solid rgba(222,0,55,0.2)',
            borderRadius: '100px',
            padding: '1px 6px',
          }}
        >
          Required
        </span>
      )}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        overflow: 'visible',
      }}
    >
      <div
        style={{
          padding: '8px 16px',
          background: 'var(--muted)',
          borderBottom: '1px solid var(--border)',
          borderRadius: 'var(--radius-card) var(--radius-card) 0 0',
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
      <div
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflow: 'visible',
        }}
      >
        {children}
      </div>
    </div>
  );
}