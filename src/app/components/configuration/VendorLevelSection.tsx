import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, BarChart3 } from 'lucide-react';
import type { VendorLevel } from '../../data/vendorLevelData';
import {
  loadVendorLevels,
  saveVendorLevels,
  createVendorLevel,
  updateVendorLevel,
  deleteVendorLevel,
} from '../../data/vendorLevelData';
import { VendorLevelFormModal } from './VendorLevelFormModal';

export function VendorLevelSection() {
  const [levels, setLevels] = useState<VendorLevel[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<VendorLevel | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    setLevels(loadVendorLevels());
  }, []);

  function handleCreate(data: Omit<VendorLevel, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) {
    const newLevel = createVendorLevel(levels, data);
    const updated = [...levels, newLevel].sort((a, b) => b.minScore - a.minScore);
    setLevels(updated);
    saveVendorLevels(updated);
    setModalOpen(false);
  }

  function handleUpdate(data: Omit<VendorLevel, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) {
    if (!editingLevel) return;
    const updated = updateVendorLevel(levels, editingLevel.id, data).sort((a, b) => b.minScore - a.minScore);
    setLevels(updated);
    saveVendorLevels(updated);
    setEditingLevel(null);
    setModalOpen(false);
  }

  function handleDelete(id: string) {
    const updated = deleteVendorLevel(levels, id);
    setLevels(updated);
    saveVendorLevels(updated);
    setDeleteConfirm(null);
  }

  // Sort by score descending for display
  const sortedLevels = [...levels].sort((a, b) => b.minScore - a.minScore);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '18px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: '0 0 4px 0',
            }}
          >
            Vendor Levels
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--muted-foreground)',
              margin: 0,
            }}
          >
            Configure vendor tiers based on calculated classification scores
          </p>
        </div>
        <button
          onClick={() => {
            setEditingLevel(null);
            setModalOpen(true);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            border: 'none',
            borderRadius: 'var(--radius-button)',
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          Add Level
        </button>
      </div>

      {/* Info Banner */}
      <div
        style={{
          background: 'var(--muted)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <BarChart3 size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        <p
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            color: 'var(--foreground)',
            margin: 0,
          }}
        >
          Vendor levels are automatically assigned based on the calculated score from weighted vendor classifications.
          Ensure score ranges do not overlap.
        </p>
      </div>

      {/* Levels List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sortedLevels.length === 0 ? (
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              padding: '32px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--muted-foreground)',
                margin: 0,
              }}
            >
              No vendor levels defined. Click "Add Level" to create one.
            </p>
          </div>
        ) : (
          sortedLevels.map((level, index) => (
            <div
              key={level.id}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
                padding: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
              }}
            >
              {/* Level Number Badge */}
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-card)',
                  background: level.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '20px',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'white',
                  }}
                >
                  {level.levelNumber}
                </span>
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h4
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--text-base)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--foreground)',
                          margin: 0,
                        }}
                      >
                        {level.levelName}
                      </h4>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '100px',
                          background: level.color,
                          color: 'white',
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '12px',
                          fontWeight: 'var(--font-weight-semibold)',
                        }}
                      >
                        Score: {level.minScore}–{level.maxScore}
                      </span>
                    </div>

                    <p
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        color: 'var(--muted-foreground)',
                        margin: 0,
                      }}
                    >
                      {level.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={() => {
                        setEditingLevel(level);
                        setModalOpen(true);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '6px',
                        background: 'transparent',
                        color: 'var(--muted-foreground)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-button)',
                        cursor: 'pointer',
                      }}
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ id: level.id, name: level.levelName })}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '6px',
                        background: 'transparent',
                        color: 'var(--destructive)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-button)',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      {modalOpen && (
        <VendorLevelFormModal
          initialData={editingLevel || undefined}
          existingLevels={levels}
          onClose={() => {
            setModalOpen(false);
            setEditingLevel(null);
          }}
          onSubmit={editingLevel ? handleUpdate : handleCreate}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px',
          }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            style={{
              background: 'var(--card)',
              borderRadius: 'var(--radius-card)',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '18px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                margin: '0 0 12px 0',
              }}
            >
              Delete Vendor Level?
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--muted-foreground)',
                margin: '0 0 24px 0',
              }}
            >
              Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--secondary)',
                  color: 'var(--secondary-foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-button)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--destructive)',
                  color: 'var(--destructive-foreground)',
                  border: 'none',
                  borderRadius: 'var(--radius-button)',
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