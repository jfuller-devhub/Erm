import React, { useState, useEffect } from 'react';
import { FormModal, Field, TextInput, TextareaInput, SelectInput } from '../shared/FormModal';
import type { Persona, PersonaStatus } from '../../data/personaData';
import {
  PERSONA_CATEGORIES,
  loadPersonas, savePersonas, createPersona, updatePersona,
} from '../../data/personaData';

interface PersonaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (persona: Persona) => void;
  editingPersona?: Persona | null;
}

export function PersonaFormModal({ isOpen, onClose, onSave, editingPersona }: PersonaFormModalProps) {
  const isEditing = !!editingPersona;

  const [name, setName]               = useState('');
  const [category, setCategory]       = useState<string>(PERSONA_CATEGORIES[0]);
  const [status, setStatus]           = useState<PersonaStatus>('Draft');
  const [description, setDescription] = useState('');
  const [tags, setTags]               = useState('');
  const [errors, setErrors]           = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    if (editingPersona) {
      setName(editingPersona.name);
      setCategory(editingPersona.category || PERSONA_CATEGORIES[0]);
      setStatus(editingPersona.status);
      setDescription(editingPersona.description);
      setTags(editingPersona.tags.join(', '));
    } else {
      setName('');
      setCategory(PERSONA_CATEGORIES[0]);
      setStatus('Draft');
      setDescription('');
      setTags('');
    }
    setErrors({});
  }, [isOpen, editingPersona]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Persona name is required.';
    if (!category)    errs.category = 'Category is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const parsedTags = tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const data = {
      name: name.trim(),
      category,
      status,
      description: description.trim(),
      entityIds:  editingPersona?.entityIds  ?? [],
      productIds: editingPersona?.productIds ?? [],
      planIds:    editingPersona?.planIds    ?? [],
      attributes: editingPersona?.attributes ?? [],
      tags: parsedTags,
    };

    const all = loadPersonas();
    let saved: Persona;

    if (isEditing && editingPersona) {
      saved = updatePersona(editingPersona, data);
      savePersonas(all.map(p => (p.id === saved.id ? saved : p)));
    } else {
      saved = createPersona(data);
      savePersonas([...all, saved]);
    }

    onSave(saved);
    onClose();
  }

  return (
    <FormModal
      title={isEditing ? 'Edit Persona' : 'New Persona'}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? 'Save Changes' : 'Create Persona'}
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Field label="Persona Name" required error={errors.name}>
          <TextInput
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Active Participant"
            hasError={!!errors.name}
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '16px' }}>
          <Field label="Category" required error={errors.category}>
            <SelectInput
              value={category}
              onChange={e => setCategory(e.target.value)}
              hasError={!!errors.category}
            >
              {PERSONA_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Status">
            <SelectInput value={status} onChange={e => setStatus(e.target.value as PersonaStatus)}>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Inactive">Inactive</option>
            </SelectInput>
          </Field>
        </div>

        <Field label="Description">
          <TextareaInput
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe this persona — who they are and how they interact with benefits..."
            rows={3}
          />
        </Field>

        <Field label="Tags" helpText="Comma-separated, e.g. Core, Active, Enrollment">
          <TextInput
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="Core, Active, Enrollment"
          />
        </Field>
      </div>
    </FormModal>
  );
}
