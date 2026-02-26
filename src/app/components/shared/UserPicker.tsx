import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { User, X, ChevronDown, Search, Check } from 'lucide-react';
import type { AppUser } from '../../data/mockData';
import { MOCK_USERS } from '../../data/mockData';

// ─── Shared helpers ──────────────────────────────────────────────────────────

export function UserAvatar({ user, size = 28 }: { user: AppUser; size?: number }) {
  const fontSize = Math.max(10, Math.floor(size * 0.38));
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--primary)',
        color: 'var(--primary-foreground)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-family-primary)',
        fontSize: `${fontSize}px`,
        fontWeight: 'var(--font-weight-semibold)',
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      {user.initials}
    </div>
  );
}

// Inline display (read-only) of a single user — used in VendorDetail
export function UserChip({ user, size = 'md' }: { user: AppUser; size?: 'sm' | 'md' }) {
  const avatarSize = size === 'sm' ? 20 : 24;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: 'var(--muted)',
        borderRadius: '100px',
        padding: size === 'sm' ? '2px 8px 2px 4px' : '3px 10px 3px 4px',
      }}
    >
      <UserAvatar user={user} size={avatarSize} />
      <span
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: size === 'sm' ? '12px' : 'var(--text-base)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--foreground)',
          lineHeight: 1,
        }}
      >
        {user.name}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '11px',
          color: 'var(--muted-foreground)',
          lineHeight: 1,
        }}
      >
        · {user.department}
      </span>
    </div>
  );
}

// ─── Portal dropdown ──────────────────────────────────────────────────────────

interface DropdownPortalProps {
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  children: React.ReactNode;
}

function DropdownPortal({ anchorRef, open, children }: DropdownPortalProps) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (open && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, [open, anchorRef]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: pos.width,
        zIndex: 99999,
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.14)',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>,
    document.body
  );
}

// ─── UserPickerInput (single select) ─────────────────────────────────────────

interface UserPickerInputProps {
  value: AppUser | null;
  onChange: (user: AppUser | null) => void;
  placeholder?: string;
  hasError?: boolean;
}

export function UserPickerInput({
  value,
  onChange,
  placeholder = 'Search for a user...',
  hasError = false,
}: UserPickerInputProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setFocused(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        // Check if click is inside the portal dropdown
        const portals = document.querySelectorAll('[data-picker-portal]');
        for (const p of portals) {
          if (p.contains(target)) return;
        }
        close();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, close]);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 40);
    }
  }, [open]);

  const filtered = MOCK_USERS.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.department.toLowerCase().includes(query.toLowerCase())
  );

  const borderColor = hasError
    ? 'var(--destructive)'
    : focused || open
    ? 'var(--primary)'
    : 'var(--border)';

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Trigger */}
      <div
        onClick={() => { setOpen(o => !o); setFocused(true); }}
        style={{
          height: '36px',
          border: `1px solid ${borderColor}`,
          borderRadius: 'var(--radius-input)',
          background: 'var(--input-background)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px',
          gap: '8px',
          cursor: 'pointer',
          userSelect: 'none',
          outline: focused || open ? '2px solid rgba(35,34,240,0.18)' : 'none',
          outlineOffset: '1px',
          transition: 'border-color 0.1s',
          boxSizing: 'border-box',
        }}
      >
        {value ? (
          <>
            <UserAvatar user={value} size={22} />
            <span
              style={{
                flex: 1,
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--foreground)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {value.name}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                color: 'var(--muted-foreground)',
                flexShrink: 0,
              }}
            >
              {value.department}
            </span>
            <button
              onClick={e => { e.stopPropagation(); onChange(null); }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--muted-foreground)',
                borderRadius: '50%',
                flexShrink: 0,
              }}
            >
              <X size={12} />
            </button>
          </>
        ) : (
          <>
            <User size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
            <span
              style={{
                flex: 1,
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--muted-foreground)',
              }}
            >
              {placeholder}
            </span>
            <ChevronDown
              size={14}
              style={{
                color: 'var(--muted-foreground)',
                flexShrink: 0,
                transform: open ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.15s',
              }}
            />
          </>
        )}
      </div>

      {/* Portal dropdown */}
      <DropdownPortal anchorRef={containerRef as React.RefObject<HTMLElement>} open={open}>
        <div data-picker-portal="true">
          {/* Search */}
          <div
            style={{
              padding: '8px 10px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Search size={13} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
            <input
              ref={searchRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or department..."
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--foreground)',
                width: '100%',
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  color: 'var(--muted-foreground)',
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* User list */}
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: '14px 12px',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--muted-foreground)',
                  textAlign: 'center',
                }}
              >
                No users match "{query}"
              </div>
            ) : (
              filtered.map(u => {
                const isSelected = value?.id === u.id;
                return (
                  <UserListRow
                    key={u.id}
                    user={u}
                    isSelected={isSelected}
                    onClick={() => { onChange(u); close(); }}
                  />
                );
              })
            )}
          </div>
        </div>
      </DropdownPortal>
    </div>
  );
}

// ─── MultiUserPickerInput (multi-select chips) ────────────────────────────────

interface MultiUserPickerInputProps {
  value: AppUser[];
  onChange: (users: AppUser[]) => void;
  placeholder?: string;
}

export function MultiUserPickerInput({
  value,
  onChange,
  placeholder = 'Add individuals...',
}: MultiUserPickerInputProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        const portals = document.querySelectorAll('[data-multipicker-portal]');
        for (const p of portals) {
          if (p.contains(target)) return;
        }
        close();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, close]);

  const selectedIds = new Set(value.map(u => u.id));
  const filtered = MOCK_USERS.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.department.toLowerCase().includes(query.toLowerCase())
  );

  const addUser = (u: AppUser) => {
    if (!selectedIds.has(u.id)) {
      onChange([...value, u]);
    } else {
      onChange(value.filter(x => x.id !== u.id));
    }
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 20);
  };

  const removeUser = (id: string) => {
    onChange(value.filter(u => u.id !== id));
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Input container */}
      <div
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 20); }}
        style={{
          minHeight: '36px',
          border: `1px solid ${open ? 'var(--primary)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-input)',
          background: 'var(--input-background)',
          display: 'flex',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          padding: '4px 8px',
          gap: '4px',
          cursor: 'text',
          outline: open ? '2px solid rgba(35,34,240,0.18)' : 'none',
          outlineOffset: '1px',
          transition: 'border-color 0.1s',
          boxSizing: 'border-box',
        }}
      >
        {/* Selected chips */}
        {value.map(u => (
          <div
            key={u.id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: 'var(--muted)',
              borderRadius: '100px',
              padding: '2px 6px 2px 4px',
              flexShrink: 0,
            }}
          >
            <UserAvatar user={u} size={18} />
            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                lineHeight: 1,
              }}
            >
              {u.name}
            </span>
            <button
              onClick={e => { e.stopPropagation(); removeUser(u.id); }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '1px',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--muted-foreground)',
                flexShrink: 0,
              }}
            >
              <X size={10} />
            </button>
          </div>
        ))}

        {/* Search input */}
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={value.length === 0 ? placeholder : ''}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            color: 'var(--foreground)',
            flex: '1',
            minWidth: '100px',
            height: '26px',
            padding: '0 2px',
          }}
        />
      </div>

      {/* Portal dropdown */}
      <DropdownPortal anchorRef={containerRef as React.RefObject<HTMLElement>} open={open}>
        <div data-multipicker-portal="true">
          {/* Search header */}
          <div
            style={{
              padding: '8px 10px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Search size={13} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                color: 'var(--muted-foreground)',
              }}
            >
              {value.length > 0 ? `${value.length} selected` : 'Select users'}
            </span>
          </div>

          {/* User list */}
          <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: '14px 12px',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--muted-foreground)',
                  textAlign: 'center',
                }}
              >
                No users match "{query}"
              </div>
            ) : (
              filtered.map(u => (
                <UserListRow
                  key={u.id}
                  user={u}
                  isSelected={selectedIds.has(u.id)}
                  onClick={() => addUser(u)}
                  showCheck
                />
              ))
            )}
          </div>
        </div>
      </DropdownPortal>
    </div>
  );
}

// ─── Shared row sub-component ─────────────────────────────────────────────────

function UserListRow({
  user,
  isSelected,
  onClick,
  showCheck = false,
}: {
  user: AppUser;
  isSelected: boolean;
  onClick: () => void;
  showCheck?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 12px',
        cursor: 'pointer',
        background: hovered || isSelected ? 'var(--muted)' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      <UserAvatar user={user} size={28} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: isSelected ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
            color: 'var(--foreground)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {user.name}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            color: 'var(--muted-foreground)',
          }}
        >
          {user.department}
        </div>
      </div>
      {showCheck && isSelected && (
        <Check size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
      )}
    </div>
  );
}
