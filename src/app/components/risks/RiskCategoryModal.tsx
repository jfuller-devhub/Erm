import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2 } from 'lucide-react';
import { Field, TextInput, TextareaInput, SelectInput } from '../shared/FormModal';
import type { RiskCategory } from '../../data/riskData';
import { generateId } from '../../data/mockData';

interface RiskCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: RiskCategory[];
  onSave: (categories: RiskCategory[]) => void;
}

interface CategoryFormState {
  name: string;
  code: string;
  description: string;
  colorHex: string;
  parentCategoryId: string;
  sortOrder: string;
}

const EMPTY_FORM: CategoryFormState = {
  name: '',
  code: '',
  description: '',
  colorHex: '#6B7489',
  parentCategoryId: '',
  sortOrder: '',
};

const PRESET_COLORS = [
  '#C0392B', '#E07B00', '#E6740A', '#1C8A45',
  '#00A3A3', '#2322F0', '#6B3FA0', '#6B7489',
];

export function RiskCategoryModal({ isOpen, onClose, categories, onSave }: RiskCategoryModalProps) {
  const [localCategories, setLocalCategories] = useState<RiskCategory[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormState>({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalCategories([...categories]);
      setShowForm(false);
      setEditingId(null);
      setForm({ ...EMPTY_FORM });
      setErrors({});
      setDeleteConfirmId(null);
    }
  }, [isOpen, categories]);

  if (!isOpen) return null;

  const parents = localCategories.filter(c => !c.parentCategoryId).sort((a, b) => a.sortOrder - b.sortOrder);

  function getChildren(parentId: string) {
    return localCategories.filter(c => c.parentCategoryId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  function startAdd() {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      sortOrder: String(localCategories.length + 1),
    });
    setErrors({});
    setShowForm(true);
  }

  function startEdit(cat: RiskCategory) {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      code: cat.code,
      description: cat.description,
      colorHex: cat.colorHex,
      parentCategoryId: cat.parentCategoryId ?? '',
      sortOrder: String(cat.sortOrder),
    });
    setErrors({});
    setShowForm(true);
  }

  function validate(): boolean {
    const errs: Partial<Record<string, string>> = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.code.trim()) errs.code = 'Code is required.';
    if (!form.colorHex.trim()) errs.colorHex = 'Color is required.';
    // Check for unique code
    const existing = localCategories.find(
      c => c.code.toLowerCase() === form.code.trim().toLowerCase() && c.id !== editingId
    );
    if (existing) errs.code = 'Code must be unique.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSaveCategory() {
    if (!validate()) return;
    const sortNum = parseInt(form.sortOrder, 10) || localCategories.length + 1;

    if (editingId) {
      setLocalCategories(prev =>
        prev.map(c =>
          c.id === editingId
            ? {
                ...c,
                name: form.name.trim(),
                code: form.code.trim().toUpperCase(),
                description: form.description.trim(),
                colorHex: form.colorHex,
                parentCategoryId: form.parentCategoryId || null,
                sortOrder: sortNum,
              }
            : c
        )
      );
    } else {
      const newCat: RiskCategory = {
        id: 'RCAT-' + generateId(),
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        colorHex: form.colorHex,
        parentCategoryId: form.parentCategoryId || null,
        sortOrder: sortNum,
      };
      setLocalCategories(prev => [...prev, newCat]);
    }

    setShowForm(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  }

  function handleDelete(id: string) {
    // Also remove any children
    setLocalCategories(prev => prev.filter(c => c.id !== id && c.parentCategoryId !== id));
    setDeleteConfirmId(null);
  }

  function handleSaveAll() {
    onSave(localCategories);
    onClose();
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'rgba(0,0,0,0.4)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: '0px 8px 32px 0px rgba(0,0,0,0.18)',
          width: '100%',
          maxWidth: '760px',
          maxHeight: 'calc(100vh - 48px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
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
            Manage Risk Categories
          </h2>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              border: 'none',
              borderRadius: 'var(--radius-input)',
              background: 'transparent',
              color: 'var(--muted-foreground)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* Add button */}
          {!showForm && (
            <div style={{ marginBottom: '16px' }}>
              <button
                onClick={startAdd}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
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
                <Plus size={14} />
                Add Category
              </button>
            </div>
          )}

          {/* Category form (inline) */}
          {showForm && (
            <div
              style={{
                background: 'var(--muted)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
                padding: '16px',
                marginBottom: '16px',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '14px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--foreground)',
                  margin: '0 0 12px 0',
                }}
              >
                {editingId ? 'Edit Category' : 'New Category'}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <Field label="Name" required error={errors.name}>
                    <TextInput
                      value={form.name}
                      onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: undefined })); }}
                      placeholder="e.g. Information Security"
                      hasError={!!errors.name}
                    />
                  </Field>
                  <Field label="Code" required error={errors.code}>
                    <TextInput
                      value={form.code}
                      onChange={e => { setForm(p => ({ ...p, code: e.target.value })); setErrors(p => ({ ...p, code: undefined })); }}
                      placeholder="e.g. IS"
                      hasError={!!errors.code}
                      style={{ textTransform: 'uppercase' }}
                    />
                  </Field>
                </div>

                <Field label="Description">
                  <TextareaInput
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Describe this category..."
                    style={{ minHeight: '60px' }}
                  />
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <Field label="Color" required error={errors.colorHex}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {PRESET_COLORS.map(hex => (
                          <button
                            key={hex}
                            onClick={() => setForm(p => ({ ...p, colorHex: hex }))}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: hex,
                              border: form.colorHex === hex ? '2px solid var(--foreground)' : '2px solid transparent',
                              cursor: 'pointer',
                              padding: 0,
                              outline: form.colorHex === hex ? '2px solid var(--card)' : 'none',
                            }}
                          />
                        ))}
                      </div>
                      <TextInput
                        value={form.colorHex}
                        onChange={e => setForm(p => ({ ...p, colorHex: e.target.value }))}
                        style={{ width: '90px', flexShrink: 0 }}
                      />
                    </div>
                  </Field>

                  <Field label="Parent Category" helpText="Optional parent for hierarchy.">
                    <SelectInput
                      value={form.parentCategoryId}
                      onChange={e => setForm(p => ({ ...p, parentCategoryId: e.target.value }))}
                    >
                      <option value="">None (top-level)</option>
                      {localCategories
                        .filter(c => !c.parentCategoryId && c.id !== editingId)
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </SelectInput>
                  </Field>

                  <Field label="Sort Order">
                    <TextInput
                      type="number"
                      min="1"
                      value={form.sortOrder}
                      onChange={e => setForm(p => ({ ...p, sortOrder: e.target.value }))}
                      placeholder="1"
                    />
                  </Field>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                  <button
                    onClick={() => { setShowForm(false); setEditingId(null); }}
                    style={{
                      height: '28px',
                      padding: '0 12px',
                      border: '1px solid var(--primary)',
                      borderRadius: 'var(--radius-button)',
                      background: 'transparent',
                      color: 'var(--primary)',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-semibold)',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCategory}
                    style={{
                      height: '28px',
                      padding: '0 12px',
                      border: 'none',
                      borderRadius: 'var(--radius-button)',
                      background: 'var(--primary)',
                      color: 'var(--primary-foreground)',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-semibold)',
                      cursor: 'pointer',
                    }}
                  >
                    {editingId ? 'Update' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Category list */}
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr 80px 100px 80px',
                alignItems: 'center',
                padding: '0 12px',
                height: '36px',
                background: 'var(--muted)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span style={colHeaderStyle}>Color</span>
              <span style={colHeaderStyle}>Name / Code</span>
              <span style={colHeaderStyle}>Order</span>
              <span style={colHeaderStyle}>Parent</span>
              <span style={{ ...colHeaderStyle, textAlign: 'right' }}>Actions</span>
            </div>

            {localCategories.length === 0 ? (
              <div
                style={{
                  padding: '32px 24px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--muted-foreground)',
                }}
              >
                No categories defined. Click "Add Category" to create one.
              </div>
            ) : (
              parents.map(parent => (
                <React.Fragment key={parent.id}>
                  <CategoryRow
                    category={parent}
                    parentName={null}
                    onEdit={() => startEdit(parent)}
                    onDelete={() => setDeleteConfirmId(parent.id)}
                    isDeleteConfirm={deleteConfirmId === parent.id}
                    onConfirmDelete={() => handleDelete(parent.id)}
                    onCancelDelete={() => setDeleteConfirmId(null)}
                  />
                  {getChildren(parent.id).map(child => (
                    <CategoryRow
                      key={child.id}
                      category={child}
                      parentName={parent.name}
                      isChild
                      onEdit={() => startEdit(child)}
                      onDelete={() => setDeleteConfirmId(child.id)}
                      isDeleteConfirm={deleteConfirmId === child.id}
                      onConfirmDelete={() => handleDelete(child.id)}
                      onCancelDelete={() => setDeleteConfirmId(null)}
                    />
                  ))}
                </React.Fragment>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
            padding: '16px 24px',
            borderTop: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
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
            Cancel
          </button>
          <button
            onClick={handleSaveAll}
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
            Save Categories
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Category Row ─────────────────────────────────────────────────────────────

function CategoryRow({
  category,
  parentName,
  isChild,
  onEdit,
  onDelete,
  isDeleteConfirm,
  onConfirmDelete,
  onCancelDelete,
}: {
  category: RiskCategory;
  parentName: string | null;
  isChild?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  isDeleteConfirm: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  if (isDeleteConfirm) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'rgba(192,57,43,0.05)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--destructive)',
          }}
        >
          Delete "{category.name}"?
          {!category.parentCategoryId && (
            <span style={{ fontWeight: 'var(--font-weight-regular)', fontSize: '12px', marginLeft: '4px' }}>
              (includes child categories)
            </span>
          )}
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={onCancelDelete}
            style={{
              height: '24px',
              padding: '0 8px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-button)',
              background: 'var(--card)',
              color: 'var(--foreground)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '11px',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirmDelete}
            style={{
              height: '24px',
              padding: '0 8px',
              border: 'none',
              borderRadius: 'var(--radius-button)',
              background: 'var(--destructive)',
              color: 'var(--destructive-foreground)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '11px',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr 80px 100px 80px',
        alignItems: 'center',
        padding: '0 12px',
        height: '40px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--card)',
        paddingLeft: isChild ? '28px' : '12px',
      }}
    >
      {/* Color swatch */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: category.colorHex,
            flexShrink: 0,
          }}
        />
      </div>

      {/* Name / Code */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
        {isChild && (
          <span style={{ color: 'var(--muted-foreground)', fontSize: '10px' }}>└</span>
        )}
        <span
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--foreground)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {category.name}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '11px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--muted-foreground)',
            background: 'var(--muted)',
            padding: '1px 6px',
            borderRadius: '100px',
            flexShrink: 0,
          }}
        >
          {category.code}
        </span>
      </div>

      {/* Sort Order */}
      <span
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '12px',
          color: 'var(--muted-foreground)',
        }}
      >
        {category.sortOrder}
      </span>

      {/* Parent */}
      <span
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '12px',
          color: 'var(--muted-foreground)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {parentName ?? '—'}
      </span>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
        <button
          onClick={onEdit}
          style={{
            width: '24px',
            height: '24px',
            border: 'none',
            borderRadius: 'var(--radius-input)',
            background: 'transparent',
            color: 'var(--muted-foreground)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          <Edit2 size={12} />
        </button>
        <button
          onClick={onDelete}
          style={{
            width: '24px',
            height: '24px',
            border: 'none',
            borderRadius: 'var(--radius-input)',
            background: 'transparent',
            color: 'var(--muted-foreground)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

const colHeaderStyle: React.CSSProperties = {
  fontFamily: 'var(--font-family-primary)',
  fontSize: '11px',
  fontWeight: 'var(--font-weight-semibold)' as any,
  color: 'var(--muted-foreground)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};