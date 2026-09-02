import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import type { VendorClassification, VendorClassificationLevel } from '../../data/vendorClassificationData';
import {
  loadVendorClassifications,
  saveVendorClassifications,
  createClassification,
  updateClassification,
  deleteClassification,
  loadVendorClassificationLevels,
  saveVendorClassificationLevels,
  getLevelsByClassification,
  createLevel,
  updateLevel,
  deleteLevel,
} from '../../data/vendorClassificationData';
import { VendorClassificationFormModal } from './VendorClassificationFormModal';
import { VendorClassificationLevelFormModal } from './VendorClassificationLevelFormModal';

export function VendorClassificationSection() {
  const [classifications, setClassifications] = useState<VendorClassification[]>([]);
  const [levels, setLevels] = useState<VendorClassificationLevel[]>([]);
  const [expandedClassifications, setExpandedClassifications] = useState<Set<string>>(new Set());
  
  const [classificationModalOpen, setClassificationModalOpen] = useState(false);
  const [editingClassification, setEditingClassification] = useState<VendorClassification | null>(null);
  
  const [levelModalOpen, setLevelModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<VendorClassificationLevel | null>(null);
  const [selectedClassificationForLevel, setSelectedClassificationForLevel] = useState<string | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'classification' | 'level';
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    setClassifications(loadVendorClassifications());
    setLevels(loadVendorClassificationLevels());
  }, []);

  function handleCreateClassification(
    data: Omit<VendorClassification, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
  ) {
    const newClassification = createClassification(classifications, data);
    const updated = [...classifications, newClassification];
    setClassifications(updated);
    saveVendorClassifications(updated);
    setClassificationModalOpen(false);
  }

  function handleUpdateClassification(
    data: Omit<VendorClassification, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
  ) {
    if (!editingClassification) return;
    const updated = updateClassification(classifications, editingClassification.id, data);
    setClassifications(updated);
    saveVendorClassifications(updated);
    setEditingClassification(null);
    setClassificationModalOpen(false);
  }

  function handleDeleteClassification(id: string) {
    const updated = deleteClassification(classifications, id);
    setClassifications(updated);
    saveVendorClassifications(updated);
    
    // Also delete all levels for this classification
    const updatedLevels = levels.filter(l => l.classificationId !== id);
    setLevels(updatedLevels);
    saveVendorClassificationLevels(updatedLevels);
    
    setDeleteConfirm(null);
  }

  function handleCreateLevel(
    data: Omit<VendorClassificationLevel, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
  ) {
    const newLevel = createLevel(levels, data);
    const updated = [...levels, newLevel];
    setLevels(updated);
    saveVendorClassificationLevels(updated);
    setLevelModalOpen(false);
    setSelectedClassificationForLevel(null);
  }

  function handleUpdateLevel(
    data: Omit<VendorClassificationLevel, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
  ) {
    if (!editingLevel) return;
    const updated = updateLevel(levels, editingLevel.id, data);
    setLevels(updated);
    saveVendorClassificationLevels(updated);
    setEditingLevel(null);
    setLevelModalOpen(false);
  }

  function handleDeleteLevel(id: string) {
    const updated = deleteLevel(levels, id);
    setLevels(updated);
    saveVendorClassificationLevels(updated);
    setDeleteConfirm(null);
  }

  function toggleExpanded(classificationId: string) {
    const newExpanded = new Set(expandedClassifications);
    if (newExpanded.has(classificationId)) {
      newExpanded.delete(classificationId);
    } else {
      newExpanded.add(classificationId);
    }
    setExpandedClassifications(newExpanded);
  }

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
            Vendor Classifications
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--muted-foreground)',
              margin: 0,
            }}
          >
            Define classification systems with multiple levels to categorize vendors
          </p>
        </div>
        <button
          onClick={() => {
            setEditingClassification(null);
            setClassificationModalOpen(true);
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
          Add Classification
        </button>
      </div>

      {/* Classifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {classifications.length === 0 ? (
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
              No vendor classifications defined. Click "Add Classification" to create one.
            </p>
          </div>
        ) : (
          classifications.map(classification => {
            const classificationLevels = getLevelsByClassification(levels, classification.id);
            const isExpanded = expandedClassifications.has(classification.id);

            return (
              <div
                key={classification.id}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-card)',
                  overflow: 'hidden',
                }}
              >
                {/* Classification Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    background: 'var(--muted)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <button
                      onClick={() => toggleExpanded(classification.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        color: 'var(--foreground)',
                      }}
                    >
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h4
                          style={{
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: 'var(--text-base)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--foreground)',
                            margin: 0,
                          }}
                        >
                          {classification.title}
                        </h4>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '100px',
                            background: 'var(--primary)',
                            color: 'var(--primary-foreground)',
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: '11px',
                            fontWeight: 'var(--font-weight-semibold)',
                          }}
                        >
                          Weight: {classification.weight}
                        </span>
                      </div>
                      <p
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '12px',
                          color: 'var(--muted-foreground)',
                          margin: 0,
                        }}
                      >
                        {classification.description}
                      </p>
                    </div>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '100px',
                        background: 'var(--secondary)',
                        color: 'var(--secondary-foreground)',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '12px',
                        fontWeight: 'var(--font-weight-semibold)',
                      }}
                    >
                      {classificationLevels.length} {classificationLevels.length === 1 ? 'Level' : 'Levels'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                    <button
                      onClick={() => {
                        setSelectedClassificationForLevel(classification.id);
                        setEditingLevel(null);
                        setLevelModalOpen(true);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        background: 'var(--secondary)',
                        color: 'var(--secondary-foreground)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-button)',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '12px',
                        fontWeight: 'var(--font-weight-semibold)',
                        cursor: 'pointer',
                      }}
                    >
                      <Plus size={14} />
                      Add Level
                    </button>
                    <button
                      onClick={() => {
                        setEditingClassification(classification);
                        setClassificationModalOpen(true);
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
                      onClick={() =>
                        setDeleteConfirm({
                          type: 'classification',
                          id: classification.id,
                          name: classification.title,
                        })
                      }
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

                {/* Levels List */}
                {isExpanded && (
                  <div style={{ padding: '16px' }}>
                    {classificationLevels.length === 0 ? (
                      <div
                        style={{
                          padding: '24px',
                          textAlign: 'center',
                          background: 'var(--muted)',
                          borderRadius: 'var(--radius-card)',
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
                          No levels defined. Click "Add Level" to create one.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {classificationLevels.map(level => (
                          <div
                            key={level.id}
                            style={{
                              background: 'var(--muted)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-card)',
                              padding: '12px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                  <div
                                    style={{
                                      fontFamily: 'var(--font-family-primary)',
                                      fontSize: 'var(--text-base)',
                                      fontWeight: 'var(--font-weight-semibold)',
                                      color: 'var(--foreground)',
                                    }}
                                  >
                                    {level.levelLabel}
                                  </div>
                                  <span
                                    style={{
                                      padding: '2px 8px',
                                      borderRadius: '100px',
                                      background: 'var(--chart-2)',
                                      color: 'white',
                                      fontFamily: 'var(--font-family-primary)',
                                      fontSize: '11px',
                                      fontWeight: 'var(--font-weight-semibold)',
                                    }}
                                  >
                                    Score: {level.score}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    fontFamily: 'var(--font-family-primary)',
                                    fontSize: 'var(--text-base)',
                                    color: 'var(--foreground)',
                                    whiteSpace: 'pre-line',
                                    lineHeight: 1.6,
                                  }}
                                >
                                  {level.description}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                <button
                                  onClick={() => {
                                    setEditingLevel(level);
                                    setSelectedClassificationForLevel(classification.id);
                                    setLevelModalOpen(true);
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
                                  onClick={() =>
                                    setDeleteConfirm({
                                      type: 'level',
                                      id: level.id,
                                      name: level.levelLabel,
                                    })
                                  }
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
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Classification Modal */}
      {classificationModalOpen && (
        <VendorClassificationFormModal
          initialData={editingClassification || undefined}
          onClose={() => {
            setClassificationModalOpen(false);
            setEditingClassification(null);
          }}
          onSubmit={editingClassification ? handleUpdateClassification : handleCreateClassification}
        />
      )}

      {/* Level Modal */}
      {levelModalOpen && selectedClassificationForLevel && (
        <VendorClassificationLevelFormModal
          classificationId={selectedClassificationForLevel}
          initialData={editingLevel || undefined}
          existingLevels={getLevelsByClassification(levels, selectedClassificationForLevel)}
          onClose={() => {
            setLevelModalOpen(false);
            setEditingLevel(null);
            setSelectedClassificationForLevel(null);
          }}
          onSubmit={editingLevel ? handleUpdateLevel : handleCreateLevel}
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
              Delete {deleteConfirm.type === 'classification' ? 'Classification' : 'Level'}?
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--muted-foreground)',
                margin: '0 0 24px 0',
              }}
            >
              Are you sure you want to delete "{deleteConfirm.name}"?
              {deleteConfirm.type === 'classification' && ' This will also delete all associated levels.'}
              {' This action cannot be undone.'}
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
                onClick={() =>
                  deleteConfirm.type === 'classification'
                    ? handleDeleteClassification(deleteConfirm.id)
                    : handleDeleteLevel(deleteConfirm.id)
                }
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