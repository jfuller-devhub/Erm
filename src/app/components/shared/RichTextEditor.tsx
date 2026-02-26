import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  Bold, Italic, Underline, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Type, Minus,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RichTextEditorProps {
  label: string;
  required?: boolean;
  helpText?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  readOnly?: boolean;
}

// ─── Toolbar button ────────────────────────────────────────────────────────────

function ToolbarBtn({
  icon: Icon,
  title,
  active,
  onClick,
  disabled,
}: {
  icon: React.ElementType;
  title: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={e => {
        e.preventDefault(); // keep focus in editor
        onClick();
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '26px',
        border: active
          ? '1px solid var(--primary)'
          : '1px solid transparent',
        borderRadius: '4px',
        background: active ? 'rgba(0,102,204,0.08)' : 'transparent',
        color: active ? 'var(--primary)' : 'var(--foreground)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'background 0.1s, border-color 0.1s',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        if (!disabled && !active) {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--muted)';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = active ? 'rgba(0,102,204,0.08)' : 'transparent';
        }
      }}
    >
      <Icon size={13} />
    </button>
  );
}

function ToolbarDivider() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: '1px',
        height: '18px',
        background: 'var(--border)',
        margin: '0 2px',
        flexShrink: 0,
      }}
    />
  );
}

// ─── Heading select ───────────────────────────────────────────────────────────

function HeadingSelect({ onFormat, disabled }: { onFormat: (tag: string) => void; disabled?: boolean }) {
  return (
    <select
      disabled={disabled}
      onMouseDown={e => e.stopPropagation()}
      onChange={e => {
        onFormat(e.target.value);
        e.target.value = '';
      }}
      defaultValue=""
      style={{
        height: '26px',
        padding: '0 6px',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        background: 'var(--card)',
        fontFamily: 'var(--font-family-primary)',
        fontSize: '11px',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--foreground)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        outline: 'none',
      }}
    >
      <option value="" disabled>Format</option>
      <option value="p">Paragraph</option>
      <option value="h2">Heading 1</option>
      <option value="h3">Heading 2</option>
      <option value="h4">Heading 3</option>
    </select>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RichTextEditor({
  label,
  required,
  helpText,
  value,
  onChange,
  placeholder = 'Enter content here…',
  minHeight = 140,
  readOnly = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);
  const [isFocused, setIsFocused] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  // ── Sync value into editor (only when not from user input) ──
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (el.innerHTML !== value) {
      el.innerHTML = value || '';
    }
  }, [value]);

  // ── Detect active formats ──
  const updateActiveFormats = useCallback(() => {
    const formats = new Set<string>();
    if (document.queryCommandState('bold'))      formats.add('bold');
    if (document.queryCommandState('italic'))    formats.add('italic');
    if (document.queryCommandState('underline')) formats.add('underline');
    if (document.queryCommandState('insertUnorderedList')) formats.add('ul');
    if (document.queryCommandState('insertOrderedList'))   formats.add('ol');
    const justifyLeft   = document.queryCommandState('justifyLeft');
    const justifyCenter = document.queryCommandState('justifyCenter');
    const justifyRight  = document.queryCommandState('justifyRight');
    if (justifyCenter) formats.add('center');
    else if (justifyRight) formats.add('right');
    else if (justifyLeft) formats.add('left');
    setActiveFormats(formats);
  }, []);

  // ── Exec command helper ──
  const exec = useCallback((cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    const el = editorRef.current;
    if (el) {
      isInternalChange.current = true;
      onChange(el.innerHTML);
    }
    updateActiveFormats();
  }, [onChange, updateActiveFormats]);

  // ── Format block (headings) ──
  const formatBlock = useCallback((tag: string) => {
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, `<${tag}>`);
    const el = editorRef.current;
    if (el) {
      isInternalChange.current = true;
      onChange(el.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    isInternalChange.current = true;
    onChange(el.innerHTML);
    updateActiveFormats();
  }, [onChange, updateActiveFormats]);

  // ── Placeholder logic ──
  const isEmpty = !value || value === '<br>' || value === '<div><br></div>';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>

      {/* Label */}
      <label
        style={{
          display: 'block',
          fontFamily: 'var(--font-family-primary)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--foreground)',
          lineHeight: '20px',
        }}
      >
        {label}
        {required && (
          <span
            style={{
              color: 'var(--destructive)',
              marginLeft: '3px',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            *
          </span>
        )}
      </label>

      {/* Editor wrapper */}
      <div
        style={{
          border: isFocused
            ? '1px solid var(--primary)'
            : '1px solid var(--border)',
          borderRadius: 'var(--radius-input)',
          background: readOnly ? 'var(--muted)' : 'var(--input-background, var(--card))',
          overflow: 'hidden',
          transition: 'border-color 0.15s',
          boxShadow: isFocused ? '0 0 0 2px rgba(0,102,204,0.10)' : 'none',
        }}
      >
        {/* ── Toolbar ── */}
        {!readOnly && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              padding: '4px 8px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--muted)',
              flexWrap: 'wrap',
              minHeight: '36px',
            }}
          >
            {/* Heading select */}
            <HeadingSelect onFormat={formatBlock} disabled={readOnly} />
            <ToolbarDivider />

            {/* Inline formatting */}
            <ToolbarBtn
              icon={Bold}
              title="Bold (Ctrl+B)"
              active={activeFormats.has('bold')}
              onClick={() => exec('bold')}
            />
            <ToolbarBtn
              icon={Italic}
              title="Italic (Ctrl+I)"
              active={activeFormats.has('italic')}
              onClick={() => exec('italic')}
            />
            <ToolbarBtn
              icon={Underline}
              title="Underline (Ctrl+U)"
              active={activeFormats.has('underline')}
              onClick={() => exec('underline')}
            />
            <ToolbarDivider />

            {/* Lists */}
            <ToolbarBtn
              icon={List}
              title="Bullet List"
              active={activeFormats.has('ul')}
              onClick={() => exec('insertUnorderedList')}
            />
            <ToolbarBtn
              icon={ListOrdered}
              title="Numbered List"
              active={activeFormats.has('ol')}
              onClick={() => exec('insertOrderedList')}
            />
            <ToolbarDivider />

            {/* Alignment */}
            <ToolbarBtn
              icon={AlignLeft}
              title="Align Left"
              active={activeFormats.has('left')}
              onClick={() => exec('justifyLeft')}
            />
            <ToolbarBtn
              icon={AlignCenter}
              title="Align Center"
              active={activeFormats.has('center')}
              onClick={() => exec('justifyCenter')}
            />
            <ToolbarBtn
              icon={AlignRight}
              title="Align Right"
              active={activeFormats.has('right')}
              onClick={() => exec('justifyRight')}
            />
            <ToolbarDivider />

            {/* Horizontal rule */}
            <ToolbarBtn
              icon={Minus}
              title="Insert Horizontal Rule"
              onClick={() => exec('insertHorizontalRule')}
            />

            {/* Clear formatting */}
            <ToolbarBtn
              icon={Type}
              title="Clear Formatting"
              onClick={() => exec('removeFormat')}
            />
          </div>
        )}

        {/* ── Editable area ── */}
        <div style={{ position: 'relative' }}>
          {isEmpty && !isFocused && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                padding: '10px 12px',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--muted-foreground)',
                pointerEvents: 'none',
                userSelect: 'none',
                lineHeight: '22px',
              }}
            >
              {placeholder}
            </div>
          )}
          <div
            ref={editorRef}
            contentEditable={!readOnly}
            suppressContentEditableWarning
            onInput={handleInput}
            onFocus={() => { setIsFocused(true); updateActiveFormats(); }}
            onBlur={() => setIsFocused(false)}
            onKeyUp={updateActiveFormats}
            onMouseUp={updateActiveFormats}
            style={{
              minHeight: `${minHeight}px`,
              padding: '10px 12px',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--foreground)',
              lineHeight: '22px',
              outline: 'none',
              cursor: readOnly ? 'default' : 'text',
              overflowY: 'auto',
              // Prose styles for rich content
            } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Help text */}
      {helpText && (
        <span
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-regular)',
            color: 'var(--muted-foreground)',
            lineHeight: '18px',
          }}
        >
          {helpText}
        </span>
      )}
    </div>
  );
}

// ─── Read-only rich text display ──────────────────────────────────────────────

export function RichTextDisplay({
  label,
  html,
  emptyText = 'No content provided.',
}: {
  label: string;
  html: string;
  emptyText?: string;
}) {
  const isEmpty = !html || html === '<br>' || html === '<div><br></div>';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '12px',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--muted-foreground)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          lineHeight: '16px',
        }}
      >
        {label}
      </div>
      {isEmpty ? (
        <span
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)',
            color: 'var(--muted-foreground)',
            fontStyle: 'italic',
          }}
        >
          {emptyText}
        </span>
      ) : (
        <div
          dangerouslySetInnerHTML={{ __html: html }}
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)',
            color: 'var(--foreground)',
            lineHeight: '22px',
          }}
        />
      )}
    </div>
  );
}
