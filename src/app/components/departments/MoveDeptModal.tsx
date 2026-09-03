import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { FormModal, Field, TextInput, SelectInput } from '../shared/FormModal';
import type { Department } from '../../data/departmentData';
import { getDeptDescendants } from '../../data/departmentData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: { parentId: string; reportingStartDate: string; reportingEndDate: string }) => void;
  dept: Department;
  allDepartments: Department[];
}

export function MoveDeptModal({ isOpen, onClose, onSave, dept, allDepartments }: Props) {
  const [parentId, setParentId] = useState(dept.parentId);
  const [startDate, setStartDate] = useState(dept.reportingStartDate);
  const [endDate, setEndDate] = useState(dept.reportingEndDate);

  useEffect(() => {
    if (isOpen) {
      setParentId(dept.parentId);
      setStartDate(dept.reportingStartDate);
      setEndDate(dept.reportingEndDate);
    }
  }, [isOpen, dept]);

  const excludedIds = new Set([dept.id, ...getDeptDescendants(allDepartments, dept.id)]);
  const parentOptions = allDepartments.filter(d => !excludedIds.has(d.id));

  const currentParent = allDepartments.find(d => d.id === dept.parentId);
  const newParent = allDepartments.find(d => d.id === parentId);
  const isChanged = parentId !== dept.parentId;

  function handleSubmit() {
    // Default effective date to today if user left it blank
    const effectiveDate = startDate || new Date().toISOString().split('T')[0];
    onSave({ parentId, reportingStartDate: parentId ? effectiveDate : '', reportingEndDate: parentId ? endDate : '' });
  }

  return (
    <FormModal
      title={`Move: ${dept.name}`}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Move Department"
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Current → New parent indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 14px', borderRadius: '8px',
          background: 'var(--muted)', border: '1px solid var(--border)',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: '1 1 auto', minWidth: '80px' }}>
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '11px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>Current</span>
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '14px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
            }}>
              {currentParent?.name ?? 'Top Level'}
            </span>
          </div>

          <ArrowRight size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: '1 1 auto', minWidth: '80px' }}>
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '11px',
              fontWeight: 'var(--font-weight-semibold)', color: isChanged ? 'var(--primary)' : 'var(--muted-foreground)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>New</span>
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '14px',
              fontWeight: 'var(--font-weight-semibold)',
              color: isChanged ? 'var(--primary)' : 'var(--muted-foreground)',
              fontStyle: isChanged ? 'normal' : 'italic',
            }}>
              {newParent?.name ?? 'Top Level'}
              {!isChanged && ' (unchanged)'}
            </span>
          </div>
        </div>

        {/* New parent selector */}
        <Field label="Reports To" helpText="Select the new parent unit, or 'None' for top-level">
          <SelectInput value={parentId} onChange={e => setParentId(e.target.value)}>
            <option value="">— None (Top Level) —</option>
            {parentOptions.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.type})</option>
            ))}
          </SelectInput>
        </Field>

        {/* Span dates — only when a parent is chosen */}
        {parentId && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '14px',
            padding: '14px', borderRadius: '8px',
            background: 'var(--muted)', border: '1px solid var(--border)',
          }}>
            <p style={{
              margin: 0, fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              color: 'var(--muted-foreground)', lineHeight: '1.5',
            }}>
              The previous reporting span will be closed on the effective date below. A new span will open from that same date under the selected parent.
            </p>
            <Field label="Effective Date" required helpText="When the old span ends and the new one begins">
              <TextInput
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </Field>
            <Field label="Anticipated End Date" helpText="Leave blank if the new relationship is ongoing">
              <TextInput
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </Field>
          </div>
        )}
      </div>
    </FormModal>
  );
}
