import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CheckSquare, Tag } from 'lucide-react';
import type { ChecklistItem, VendorLevelChecklistAssociation } from '../../data/checklistData';
import type { VendorLevel } from '../../data/vendorLevelData';
import {
  loadChecklistItems,
  saveChecklistItems,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  loadAssociations,
  saveAssociations,
  createAssociation,
  deleteAssociationsByChecklistItem,
  getAssociationsByChecklistItem,
} from '../../data/checklistData';
import { loadVendorLevels } from '../../data/vendorLevelData';
import { ChecklistFormModal } from './ChecklistFormModal';
import { useApp } from '../../context/AppContext';

export function VendorChecklistSection() {
  const { configOptions } = useApp();
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [associations, setAssociations] = useState<VendorLevelChecklistAssociation[]>([]);
  const [vendorLevels, setVendorLevels] = useState<VendorLevel[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    setChecklistItems(loadChecklistItems());
    setAssociations(loadAssociations());
    setVendorLevels(loadVendorLevels());
  }, []);

  type AssocInput = {
    vendorLevelId: string;
    vendorStatusAssignments: Record<string, 'required' | 'optional'>;
    rrule?: string;
    advanceNoticeDays?: number;
    gracePeriodDays?: number;
    evidenceRequired?: boolean;
    evidenceType?: string;
    assignees?: string[];
  };

  function handleCreate(
    data: Omit<ChecklistItem, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>,
    associationData: AssocInput[]
  ) {
    const newItem = createChecklistItem(checklistItems, data);
    const updatedItems = [...checklistItems, newItem];
    setChecklistItems(updatedItems);
    saveChecklistItems(updatedItems);

    const newAssociations = associationData.map(assoc =>
      createAssociation(associations, {
        checklistItemId: newItem.id,
        vendorLevelId: assoc.vendorLevelId,
        vendorStatuses: [],  // Legacy field
        status: 'required', // Legacy field
        vendorStatusAssignments: assoc.vendorStatusAssignments,
        rrule: assoc.rrule,
        advanceNoticeDays: assoc.advanceNoticeDays,
        gracePeriodDays: assoc.gracePeriodDays,
        evidenceRequired: assoc.evidenceRequired,
        evidenceType: assoc.evidenceType,
        assignees: assoc.assignees,
      })
    );

    const updatedAssociations = [...associations, ...newAssociations];
    setAssociations(updatedAssociations);
    saveAssociations(updatedAssociations);

    setModalOpen(false);
  }

  function handleUpdate(
    data: Omit<ChecklistItem, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>,
    associationData: AssocInput[]
  ) {
    if (!editingItem) return;

    const updatedItems = updateChecklistItem(checklistItems, editingItem.id, data);
    setChecklistItems(updatedItems);
    saveChecklistItems(updatedItems);

    let updatedAssociations = deleteAssociationsByChecklistItem(associations, editingItem.id);

    const newAssociations = associationData.map(assoc =>
      createAssociation(updatedAssociations, {
        checklistItemId: editingItem.id,
        vendorLevelId: assoc.vendorLevelId,
        vendorStatuses: [],  // Legacy field
        status: 'required', // Legacy field
        vendorStatusAssignments: assoc.vendorStatusAssignments,
        rrule: assoc.rrule,
        advanceNoticeDays: assoc.advanceNoticeDays,
        gracePeriodDays: assoc.gracePeriodDays,
        evidenceRequired: assoc.evidenceRequired,
        evidenceType: assoc.evidenceType,
        assignees: assoc.assignees,
      })
    );

    updatedAssociations = [...updatedAssociations, ...newAssociations];
    setAssociations(updatedAssociations);
    saveAssociations(updatedAssociations);

    setEditingItem(null);
    setModalOpen(false);
  }

  function handleDelete(id: string) {
    const updatedItems = deleteChecklistItem(checklistItems, id);
    setChecklistItems(updatedItems);
    saveChecklistItems(updatedItems);

    const updatedAssociations = deleteAssociationsByChecklistItem(associations, id);
    setAssociations(updatedAssociations);
    saveAssociations(updatedAssociations);

    setDeleteConfirm(null);
  }

  // Get unique categories
  const categories = ['All', ...Array.from(new Set(checklistItems.map(item => item.category)))];

  // Filter items by category
  const filteredItems =
    selectedCategory === 'All'
      ? checklistItems
      : checklistItems.filter(item => item.category === selectedCategory);

  // Group items by category for display
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  function getVendorLevelById(id: string): VendorLevel | undefined {
    return vendorLevels.find(level => level.id === id);
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
            Vendor Compliance Checklist
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--muted-foreground)',
              margin: 0,
            }}
          >
            Define checklist items and assign them to vendor levels with required or optional status
          </p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
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
          Add Checklist Item
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
        <CheckSquare size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        <p
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            color: 'var(--foreground)',
            margin: 0,
          }}
        >
          Checklist items can be assigned to multiple vendor levels. For each vendor level, you can configure which vendor statuses apply and whether the checklist is required or optional for each status.
        </p>
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: '100px',
              background: selectedCategory === cat ? 'var(--primary)' : 'var(--secondary)',
              color: selectedCategory === cat ? 'var(--primary-foreground)' : 'var(--secondary-foreground)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Checklist Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredItems.length === 0 ? (
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
              No checklist items found. Click "Add Checklist Item" to create one.
            </p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedCategory === 'All' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tag size={16} style={{ color: 'var(--muted-foreground)' }} />
                  <h4
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--foreground)',
                      margin: 0,
                    }}
                  >
                    {category}
                  </h4>
                </div>
              )}

              {items.map(item => {
                const itemAssociations = getAssociationsByChecklistItem(associations, item.id);
                const associatedLevels = itemAssociations
                  .map(assoc => {
                    // Handle both new and legacy formats
                    let vendorStatusAssignments: Record<string, 'required' | 'optional'> = {};
                    if (assoc.vendorStatusAssignments) {
                      vendorStatusAssignments = assoc.vendorStatusAssignments;
                    } else if (assoc.vendorStatuses && assoc.vendorStatuses.length > 0) {
                      // Legacy format
                      assoc.vendorStatuses.forEach(status => {
                        vendorStatusAssignments[status] = assoc.status;
                      });
                    }

                    return {
                      level: getVendorLevelById(assoc.vendorLevelId),
                      vendorStatusAssignments,
                      assignees: assoc.assignees || [],
                    };
                  })
                  .filter(item => item.level !== undefined)
                  .sort((a, b) => (b.level?.levelNumber || 0) - (a.level?.levelNumber || 0));

                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-card)',
                      padding: '16px',
                      display: 'flex',
                      gap: '16px',
                    }}
                  >
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
                          {item.name}
                        </h4>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '100px',
                            background: 'var(--muted)',
                            color: 'var(--muted-foreground)',
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: '11px',
                            fontWeight: 'var(--font-weight-semibold)',
                          }}
                        >
                          {item.category}
                        </span>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '100px',
                            background: 'var(--primary)',
                            color: 'white',
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: '11px',
                            fontWeight: 'var(--font-weight-semibold)',
                          }}
                        >
                          {item.activityType}
                        </span>
                      </div>

                      <p
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--text-base)',
                          color: 'var(--muted-foreground)',
                          margin: '0 0 8px 0',
                        }}
                      >
                        {item.description}
                      </p>

                      <div
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '12px',
                          color: 'var(--muted-foreground)',
                          margin: '0 0 12px 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Starts:</span>
                        <span>{item.executionStartDate}</span>
                      </div>

                      {/* Vendor Level Assignments */}
                      {associatedLevels.length > 0 ? (
                        <div>
                          <div
                            style={{
                              fontFamily: 'var(--font-family-primary)',
                              fontSize: '12px',
                              fontWeight: 'var(--font-weight-semibold)',
                              color: 'var(--foreground)',
                              marginBottom: '8px',
                            }}
                          >
                            Assigned Vendor Levels:
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {associatedLevels.map(({ level, vendorStatusAssignments, assignees }) => {
                              if (!level) return null;
                              return (
                                <div
                                  key={level.id}
                                  style={{
                                    display: 'inline-flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    padding: '8px 10px',
                                    borderRadius: 'var(--radius-card)',
                                    border: `1px solid ${level.color}`,
                                    background: `${level.color}10`,
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div
                                      style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '4px',
                                        background: level.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontFamily: 'var(--font-family-primary)',
                                          fontSize: '11px',
                                          fontWeight: 'var(--font-weight-semibold)',
                                          color: 'white',
                                        }}
                                      >
                                        {level.levelNumber}
                                      </span>
                                    </div>
                                    <span
                                      style={{
                                        fontFamily: 'var(--font-family-primary)',
                                        fontSize: '12px',
                                        fontWeight: 'var(--font-weight-semibold)',
                                        color: 'var(--foreground)',
                                      }}
                                    >
                                      {level.levelName}
                                    </span>
                                  </div>
                                  {Object.keys(vendorStatusAssignments).length > 0 && (
                                    <div
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '3px',
                                        paddingLeft: '26px',
                                        marginTop: '4px',
                                      }}
                                    >
                                      {Object.entries(vendorStatusAssignments).map(([vendorStatus, assignmentStatus]) => (
                                        <div
                                          key={vendorStatus}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                          }}
                                        >
                                          <span
                                            style={{
                                              fontFamily: 'var(--font-family-primary)',
                                              fontSize: '10px',
                                              color: 'var(--foreground)',
                                              flex: 1,
                                            }}
                                          >
                                            {vendorStatus}
                                          </span>
                                          <span
                                            style={{
                                              padding: '1px 5px',
                                              borderRadius: '100px',
                                              background: assignmentStatus === 'required' ? 'var(--destructive)' : 'var(--chart-2)',
                                              color: 'white',
                                              fontFamily: 'var(--font-family-primary)',
                                              fontSize: '9px',
                                              fontWeight: 'var(--font-weight-semibold)',
                                              textTransform: 'capitalize',
                                            }}
                                          >
                                            {assignmentStatus}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {assignees.length > 0 && (
                                    <div
                                      style={{
                                        fontFamily: 'var(--font-family-primary)',
                                        fontSize: '10px',
                                        color: 'var(--muted-foreground)',
                                        paddingLeft: '26px',
                                      }}
                                    >
                                      Assigned to: {assignees.join(', ')}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-card)',
                            background: 'var(--muted)',
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: '12px',
                            color: 'var(--muted-foreground)',
                          }}
                        >
                          Not assigned to any vendor levels
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignSelf: 'flex-start' }}>
                      <button
                        onClick={() => {
                          setEditingItem(item);
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
                        onClick={() => setDeleteConfirm({ id: item.id, name: item.name })}
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
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      {modalOpen && (
        <ChecklistFormModal
          initialData={editingItem || undefined}
          vendorLevels={vendorLevels}
          existingAssociations={associations}
          configOptions={configOptions}
          onClose={() => {
            setModalOpen(false);
            setEditingItem(null);
          }}
          onSubmit={editingItem ? handleUpdate : handleCreate}
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
              Delete Checklist Item?
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--muted-foreground)',
                margin: '0 0 24px 0',
              }}
            >
              Are you sure you want to delete "{deleteConfirm.name}"? This will also remove all vendor level
              assignments. This action cannot be undone.
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
