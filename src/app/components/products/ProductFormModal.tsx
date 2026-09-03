import React, { useState, useEffect } from 'react';
import { X, Tag } from 'lucide-react';
import { FormModal, Field, TextInput, TextareaInput, SelectInput } from '../shared/FormModal';
import { UserPickerInput } from '../shared/UserPicker';
import { useApp } from '../../context/AppContext';
import type { AppUser } from '../../data/mockData';
import { generateId } from '../../data/mockData';
import type { Product, ProductType, ProductStatus } from '../../data/productData';
import { BENEFIT_CATEGORIES, SERVICE_CATEGORIES } from '../../data/productData';

// ─── Props ───────────────────────────────────────────────────────────────────

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  editingProduct?: Product | null;
}

// ─── Tag Input ───────────────────────────────────────────────────────────────

function TagInput({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [inputValue, setInputValue] = useState('');

  function add(raw: string) {
    const tag = raw.trim();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setInputValue('');
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: value.length > 0 ? '6px' : 0 }}>
        {value.map(tag => (
          <span
            key={tag}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              height: '22px', padding: '0 8px',
              border: '1px solid var(--border)', borderRadius: '100px',
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              color: 'var(--foreground)', background: 'var(--muted)',
            }}
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter(t => t !== tag))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 2px', display: 'flex', alignItems: 'center', color: 'var(--muted-foreground)' }}
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(inputValue); }
            if (e.key === 'Backspace' && !inputValue && value.length > 0) {
              onChange(value.slice(0, -1));
            }
          }}
          placeholder="Add tag and press Enter"
          style={{
            flex: 1, height: '36px', padding: '0 12px',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-input)',
            background: 'var(--input-background)', fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)', color: 'var(--foreground)', outline: 'none',
          }}
          onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--primary)'; }}
          onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--border)'; add(inputValue); }}
        />
        <button
          type="button"
          onClick={() => add(inputValue)}
          style={{
            height: '36px', padding: '0 12px', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-button)', background: 'var(--muted)',
            color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
          }}
        >
          <Tag size={12} /> Add
        </button>
      </div>
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export function ProductFormModal({
  isOpen,
  onClose,
  onSave,
  editingProduct,
}: ProductFormModalProps) {
  const isEditing = !!editingProduct;
  const today = new Date().toISOString().split('T')[0];
  const { getActiveOptions } = useApp();

  const productStatuses = getActiveOptions('Product', 'Status');

  // ─── Form state ────────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [type, setType] = useState<ProductType>('Benefit');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProductStatus>('Draft');
  const [tags, setTags] = useState<string[]>([]);
  const [owner, setOwner] = useState<AppUser | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Reset on open ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (editingProduct) {
      setName(editingProduct.name);
      setType(editingProduct.type);
      setCategory(editingProduct.category);
      setDescription(editingProduct.description);
      setStatus(editingProduct.status);
      setTags([...editingProduct.tags]);
      setOwner(editingProduct.owner);
    } else {
      setName('');
      setType('Benefit');
      setCategory('');
      setDescription('');
      setStatus('Draft');
      setTags([]);
      setOwner(null);
    }
    setErrors({});
  }, [isOpen, editingProduct]);

  // Clear category when type changes and it no longer applies
  useEffect(() => {
    const cats: readonly string[] = type === 'Benefit' ? BENEFIT_CATEGORIES : SERVICE_CATEGORIES;
    if (category && !(cats as string[]).includes(category)) {
      setCategory('');
    }
  }, [type]);

  const categories: readonly string[] = type === 'Benefit' ? BENEFIT_CATEGORIES : SERVICE_CATEGORIES;

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Product name is required.';
    if (!category) errs.category = 'Category is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const product: Product = {
      id: editingProduct?.id ?? 'PRD-' + generateId(),
      name: name.trim(),
      type,
      category,
      description: description.trim(),
      status,
      tags,
      owner,
      departmentIds: editingProduct?.departmentIds ?? [],
      processIds: editingProduct?.processIds ?? [],
      subProcessIds: editingProduct?.subProcessIds ?? [],
      createdDate: editingProduct?.createdDate ?? today,
      updatedDate: today,
    };
    onSave(product);
    onClose();
  }

  return (
    <FormModal
      title={isEditing ? 'Edit Product' : 'New Product'}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? 'Save Changes' : 'Create Product'}
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Name + Type row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '16px' }}>
          <Field label="Product Name" required error={errors.name}>
            <TextInput
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Active Employee Medical"
              hasError={!!errors.name}
            />
          </Field>
          <Field label="Type" required>
            <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
              {(['Benefit', 'Service'] as ProductType[]).map(t => (
                <label
                  key={t}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                    fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                    fontWeight: type === t ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                    color: type === t ? 'var(--primary)' : 'var(--foreground)',
                  }}
                >
                  <input
                    type="radio"
                    name="productType"
                    value={t}
                    checked={type === t}
                    onChange={() => setType(t)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  {t}
                </label>
              ))}
            </div>
          </Field>
        </div>

        {/* Category + Status row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Category" required error={errors.category}>
            <SelectInput
              value={category}
              onChange={e => setCategory(e.target.value)}
              hasError={!!errors.category}
            >
              <option value="">Select category…</option>
              {(categories as string[]).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Status">
            <SelectInput value={status} onChange={e => setStatus(e.target.value as ProductStatus)}>
              {(productStatuses.length > 0
                ? productStatuses
                : ['Active', 'Draft', 'Retired', 'Sunset']
              ).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </SelectInput>
          </Field>
        </div>

        {/* Description */}
        <Field label="Description" helpText="Brief description of this product grouping.">
          <TextareaInput
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe what this product covers…"
            rows={3}
          />
        </Field>

        {/* Owner */}
        <Field label="Product Owner" helpText="The individual accountable for this product.">
          <UserPickerInput value={owner} onChange={setOwner} />
        </Field>

        {/* Tags */}
        <Field label="Tags" helpText="Add keywords to help with search and filtering.">
          <TagInput value={tags} onChange={setTags} />
        </Field>

      </div>
    </FormModal>
  );
}
