import React from 'react';
import { X } from 'lucide-react';

interface FormModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
}

export function FormModal({
  title,
  isOpen,
  onClose,
  onSubmit,
  submitLabel = 'Save',
  children,
  size = 'md',
}: FormModalProps) {
  if (!isOpen) return null;

  const maxWidth = size === 'xl' ? '960px' : size === 'lg' ? '760px' : '560px';

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
          maxWidth,
          maxHeight: 'calc(100vh - 48px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
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
            {title}
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
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--muted)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {children}
        </div>

        {/* Modal Footer */}
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
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(35,34,240,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
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
              transition: 'opacity 0.1s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reusable form field primitives ──────────────────────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  helpText?: string;
  error?: string;
  children: React.ReactNode;
}

export function Field({ label, required, helpText, error, children }: FieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--foreground)',
          lineHeight: '20px',
        }}
      >
        {label}
        {required && (
          <span style={{ color: 'var(--destructive)', marginLeft: '2px' }}>*</span>
        )}
      </label>
      {children}
      {helpText && !error && (
        <span
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            color: 'var(--muted-foreground)',
          }}
        >
          {helpText}
        </span>
      )}
      {error && (
        <span
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            color: 'var(--destructive)',
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export function TextInput({ hasError, style: extStyle, ...props }: TextInputProps) {
  const [focused, setFocused] = React.useState(false);
  return (
    <input
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
      style={{
        height: '36px',
        padding: '0 12px',
        border: `1px solid ${hasError ? 'var(--destructive)' : focused ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-input)',
        background: 'var(--input-background)',
        color: 'var(--foreground)',
        fontFamily: 'var(--font-family-primary)',
        fontSize: 'var(--text-base)',
        fontWeight: 'var(--font-weight-regular)',
        outline: focused ? `2px solid rgba(35,34,240,0.2)` : 'none',
        outlineOffset: '1px',
        width: '100%',
        boxSizing: 'border-box',
        transition: 'border-color 0.1s',
        ...extStyle,
      }}
    />
  );
}

interface TextareaInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export function TextareaInput({ hasError, style: extStyle, ...props }: TextareaInputProps) {
  const [focused, setFocused] = React.useState(false);
  return (
    <textarea
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
      style={{
        minHeight: '80px',
        padding: '8px 12px',
        border: `1px solid ${hasError ? 'var(--destructive)' : focused ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-input)',
        background: 'var(--input-background)',
        color: 'var(--foreground)',
        fontFamily: 'var(--font-family-primary)',
        fontSize: 'var(--text-base)',
        fontWeight: 'var(--font-weight-regular)',
        outline: focused ? `2px solid rgba(35,34,240,0.2)` : 'none',
        outlineOffset: '1px',
        width: '100%',
        boxSizing: 'border-box',
        resize: 'vertical',
        transition: 'border-color 0.1s',
        ...extStyle,
      }}
    />
  );
}

interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
  children: React.ReactNode;
}

export function SelectInput({ hasError, style: extStyle, children, ...props }: SelectInputProps) {
  const [focused, setFocused] = React.useState(false);
  return (
    <select
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
      style={{
        height: '36px',
        padding: '0 12px',
        border: `1px solid ${hasError ? 'var(--destructive)' : focused ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-input)',
        background: 'var(--input-background)',
        color: 'var(--foreground)',
        fontFamily: 'var(--font-family-primary)',
        fontSize: 'var(--text-base)',
        fontWeight: 'var(--font-weight-regular)',
        outline: focused ? `2px solid rgba(35,34,240,0.2)` : 'none',
        outlineOffset: '1px',
        width: '100%',
        boxSizing: 'border-box',
        cursor: 'pointer',
        transition: 'border-color 0.1s',
        ...extStyle,
      }}
    >
      {children}
    </select>
  );
}