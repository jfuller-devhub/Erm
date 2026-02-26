import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, SlidersHorizontal, ToggleLeft, ToggleRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FormModal, Field, TextInput, SelectInput } from '../components/shared/FormModal';
import type { ConfigOption, ConfigTable, ConfigOptionStatus } from '../data/mockData';

// ─── Field map: which fields are configurable per table ──────────────────────

const CONFIG_FIELD_MAP: Record<ConfigTable, string[]> = {
  Vendor:     ['Category', 'Status', 'Department'],
  Contract:   ['Type', 'Status', 'Department'],
  Process:    ['Business Domain', 'Status'],
  Control:    ['Type', 'Frequency', 'Status', 'Effectiveness', 'Department'],
  Risk:       ['Status', 'Type', 'Appetite Level', 'Review Frequency', 'Department'],
  Mitigation: ['Action Type', 'Priority', 'Status'],
  Product:    ['Status', 'Benefit Category', 'Service Category'],
  Assessment: ['Type'],
  Contact:    ['Type'],
  Framework:  ['Status'],
  Compliance: ['Implementation Status'],
};

const ALL_TABLES: ConfigTable[] = ['Vendor', 'Contract', 'Process', 'Control', 'Risk', 'Mitigation', 'Product', 'Assessment', 'Contact', 'Framework', 'Compliance'];

// Display labels for coded enum values (so config page shows "Preventive" not "preventive")
const VALUE_DISPLAY_LABELS: Record<string, string> = {
  // Control Type
  preventive: 'Preventive', detective: 'Detective', corrective: 'Corrective',
  directive: 'Directive', compensating: 'Compensating',
  // Control Frequency
  continuous: 'Continuous', daily: 'Daily', weekly: 'Weekly',
  monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual',
  // Control Status
  active: 'Active', inactive: 'Inactive', in_design: 'In Design', deprecated: 'Deprecated',
  // Control Effectiveness
  effective: 'Effective', partially_effective: 'Partially Effective',
  ineffective: 'Ineffective', not_tested: 'Not Tested',
  // Risk Status
  draft: 'Draft', closed: 'Closed', archived: 'Archived',
  // Risk Type
  strategic: 'Strategic', operational: 'Operational', financial: 'Financial',
  compliance: 'Compliance', reputational: 'Reputational', cyber: 'Cyber',
  // Appetite Level
  averse: 'Averse', minimal: 'Minimal', cautious: 'Cautious', open: 'Open', hungry: 'Hungry',
  // Review Frequency
  semi_annual: 'Semi-Annual',
  // Mitigation Action Type
  mitigate: 'Mitigate', accept: 'Accept', transfer: 'Transfer', avoid: 'Avoid',
  // Mitigation Priority
  critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low',
  // Mitigation Status  (open is already declared above under Appetite Level)
  in_progress: 'In Progress', complete: 'Complete', deferred: 'Deferred', cancelled: 'Cancelled',
  // Assessment Type
  periodic: 'Periodic', triggered: 'Triggered', ad_hoc: 'Ad Hoc',
  // Framework Status (active + draft already declared above)
  sunset: 'Sunset',
  // Compliance Implementation Status (in_progress already declared above)
  not_started: 'Not Started', implemented: 'Implemented', not_applicable: 'Not Applicable',
};

// ─── Configuration Page ───────────────────────────────────────────────────────

export function Configuration() {
  const {
    configOptions,
    addConfigOption,
    updateConfigOption,
    deleteConfigOption,
    toggleConfigOptionStatus,
  } = useApp();

  // Filters
  const [search, setSearch]               = useState('');
  const [filterTable, setFilterTable]     = useState<string>('');
  const [filterField, setFilterField]     = useState<string>('');
  const [filterStatus, setFilterStatus]   = useState<string>('');
  const [searchFocused, setSearchFocused] = useState(false);

  // Modal state
  const [showModal, setShowModal]         = useState(false);
  const [editingOption, setEditingOption] = useState<ConfigOption | null>(null);
  const [deletingId, setDeletingId]       = useState<string | null>(null);

  // Available fields for table filter
  const filterFieldOptions = filterTable
    ? CONFIG_FIELD_MAP[filterTable as ConfigTable] ?? []
    : [...new Set(configOptions.map(o => o.field))].sort();

  // Derived filtered list
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return configOptions
      .filter(o => {
        if (filterTable  && o.table  !== filterTable)  return false;
        if (filterField  && o.field  !== filterField)  return false;
        if (filterStatus && o.status !== filterStatus) return false;
        if (q && !o.value.toLowerCase().includes(q) &&
                 !o.table.toLowerCase().includes(q) &&
                 !o.field.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        const t = a.table.localeCompare(b.table);
        if (t !== 0) return t;
        const f = a.field.localeCompare(b.field);
        if (f !== 0) return f;
        return a.sortOrder - b.sortOrder;
      });
  }, [configOptions, filterTable, filterField, filterStatus, search]);

  // Group headers for the table
  const groupedRows = useMemo(() => {
    type Row = { type: 'header'; key: string; table: string; field: string; count: number }
             | { type: 'row';    key: string; option: ConfigOption };
    const rows: Row[] = [];
    let lastGroup = '';
    filtered.forEach(o => {
      const group = `${o.table}__${o.field}`;
      if (group !== lastGroup) {
        const groupCount = filtered.filter(x => x.table === o.table && x.field === o.field).length;
        rows.push({ type: 'header', key: `h-${group}`, table: o.table, field: o.field, count: groupCount });
        lastGroup = group;
      }
      rows.push({ type: 'row', key: o.id, option: o });
    });
    return rows;
  }, [filtered]);

  const deletingOption = deletingId ? configOptions.find(o => o.id === deletingId) : null;

  const totalActive   = configOptions.filter(o => o.status === 'Active').length;
  const totalInactive = configOptions.filter(o => o.status === 'Inactive').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--elevation-sm)',
          padding: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '48px', height: '48px',
              borderRadius: 'var(--radius-card)',
              background: 'var(--muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <SlidersHorizontal size={22} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '22px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                margin: 0,
              }}
            >
              Configuration
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--muted-foreground)',
                margin: '4px 0 0',
              }}
            >
              Manage dropdown values and application settings.
            </p>
          </div>
        </div>

        <button
          onClick={() => { setEditingOption(null); setShowModal(true); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            height: '36px', padding: '0 16px',
            border: 'none', borderRadius: 'var(--radius-button)',
            background: 'var(--primary)', color: 'var(--primary-foreground)',
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer', flexShrink: 0,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        >
          <Plus size={14} /> Add Value
        </button>
      </div>

      {/* ── Summary KPI strip ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <SummaryTile label="Total Values"    value={configOptions.length} />
        <SummaryTile label="Active Values"   value={totalActive}   accent />
        <SummaryTile label="Inactive Values" value={totalInactive} muted />
        <SummaryTile label="Configured Fields"
          value={new Set(configOptions.map(o => `${o.table}.${o.field}`)).size}
        />
      </div>

      {/* ── Main Content Card ───────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--elevation-sm)',
          overflow: 'hidden',
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          {/* Search */}
          <div
            style={{
              position: 'relative',
              flex: '1',
              minWidth: '180px',
            }}
          >
            <Search
              size={14}
              style={{
                position: 'absolute', left: '10px', top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted-foreground)', pointerEvents: 'none',
              }}
            />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search values..."
              style={{
                width: '100%', height: '32px',
                paddingLeft: '32px', paddingRight: '10px',
                border: `1px solid ${searchFocused ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-input)',
                background: 'var(--input-background)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--foreground)',
                outline: searchFocused ? '2px solid rgba(35,34,240,0.15)' : 'none',
                outlineOffset: '1px',
                boxSizing: 'border-box',
                transition: 'border-color 0.1s',
              }}
            />
          </div>

          {/* Table filter */}
          <FilterSelect
            value={filterTable}
            onChange={v => { setFilterTable(v); setFilterField(''); }}
            placeholder="All Tables"
            options={ALL_TABLES.map(t => ({ label: t, value: t }))}
          />

          {/* Field filter (cascades from table) */}
          <FilterSelect
            value={filterField}
            onChange={setFilterField}
            placeholder="All Fields"
            options={filterFieldOptions.map(f => ({ label: f, value: f }))}
          />

          {/* Status filter */}
          <FilterSelect
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="All Statuses"
            options={[
              { label: 'Active',   value: 'Active'   },
              { label: 'Inactive', value: 'Inactive' },
            ]}
          />

          {/* Result count */}
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              color: 'var(--muted-foreground)',
              whiteSpace: 'nowrap',
            }}
          >
            {filtered.length} of {configOptions.length} values
          </span>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <EmptyState onAdd={() => { setEditingOption(null); setShowModal(true); }} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {['Table', 'Field', 'Value', 'Status', ''].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: '8px 16px',
                        textAlign: 'left',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '12px',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--muted-foreground)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                        width: i === 4 ? '100px' : undefined,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupedRows.map((row, idx) => {
                  if (row.type === 'header') {
                    return (
                      <GroupHeaderRow
                        key={row.key}
                        table={row.table as ConfigTable}
                        field={row.field}
                        count={row.count}
                      />
                    );
                  }
                  const o = row.option;
                  const isEvenInGroup = idx % 2 === 0;
                  return (
                    <ConfigRow
                      key={o.id}
                      option={o}
                      isEven={isEvenInGroup}
                      onEdit={() => { setEditingOption(o); setShowModal(true); }}
                      onDelete={() => setDeletingId(o.id)}
                      onToggle={() => toggleConfigOptionStatus(o.id)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      <ConfigOptionModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingOption(null); }}
        onSave={data => {
          if (editingOption) {
            updateConfigOption(editingOption.id, data);
          } else {
            addConfigOption(data);
          }
        }}
        initialData={editingOption}
        existingOptions={configOptions}
      />

      {/* ── Delete Confirm ───────────────────────────────────────────────── */}
      <FormModal
        title="Remove Dropdown Value"
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onSubmit={() => { if (deletingId) deleteConfigOption(deletingId); setDeletingId(null); }}
        submitLabel="Remove Value"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)', margin: 0 }}>
            Remove the value{' '}
            <strong>"{deletingOption?.value}"</strong> from{' '}
            <strong>{deletingOption?.table} → {deletingOption?.field}</strong>?
          </p>
          <div
            style={{
              padding: '10px 12px',
              background: 'rgba(222,0,55,0.06)',
              border: '1px solid rgba(222,0,55,0.2)',
              borderRadius: 'var(--radius-card)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              color: 'var(--destructive)',
            }}
          >
            This will remove the option from the dropdown in all forms. Existing records using this value will not be affected.
          </div>
        </div>
      </FormModal>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryTile({
  label, value, accent, muted,
}: {
  label: string;
  value: number;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      style={{
        flex: '1',
        minWidth: '120px',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--elevation-sm)',
        padding: '16px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '22px',
          fontWeight: 'var(--font-weight-semibold)',
          color: accent ? 'var(--primary)' : muted ? 'var(--muted-foreground)' : 'var(--foreground)',
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '12px',
          color: 'var(--muted-foreground)',
          marginTop: '4px',
        }}
      >
        {label}
      </div>
    </div>
  );
}

function GroupHeaderRow({
  table, field, count,
}: {
  table: ConfigTable;
  field: string;
  count: number;
}) {
  const style = TABLE_BADGE_STYLES[table] ?? { bg: 'var(--muted)', color: 'var(--foreground)' };
  return (
    <tr
      style={{
        background: style.bg.replace('0.10)', '0.04)').replace('0.12)', '0.04)'),
        borderTop: '2px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <td colSpan={5} style={{ padding: '6px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TableBadge table={table} />
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
            }}
          >
            {field}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '11px',
              color: 'var(--muted-foreground)',
              background: 'var(--muted)',
              border: '1px solid var(--border)',
              borderRadius: '100px',
              padding: '0 6px',
            }}
          >
            {count}
          </span>
        </div>
      </td>
    </tr>
  );
}

function ConfigRow({
  option, isEven, onEdit, onDelete, onToggle,
}: {
  option: ConfigOption;
  isEven: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isActive = option.status === 'Active';

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(35,34,240,0.03)' : isEven ? 'var(--muted)' : 'transparent',
        borderBottom: '1px solid var(--border)',
        transition: 'background 0.1s',
      }}
    >
      {/* Table */}
      <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
        <TableBadge table={option.table} />
      </td>

      {/* Field */}
      <td style={{ padding: '10px 16px' }}>
        <span
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--foreground)',
          }}
        >
          {option.field}
        </span>
      </td>

      {/* Value */}
      <td style={{ padding: '10px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
            }}
          >
            {VALUE_DISPLAY_LABELS[option.value] ?? option.value}
          </span>
          {VALUE_DISPLAY_LABELS[option.value] && (
            <span style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '11px',
              color: 'var(--muted-foreground)',
              background: 'var(--muted)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '0 4px',
            }}>
              {option.value}
            </span>
          )}
        </div>
      </td>

      {/* Status — clickable toggle */}
      <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
        <button
          onClick={onToggle}
          title={`Click to set ${isActive ? 'Inactive' : 'Active'}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            height: '22px',
            padding: '0 8px',
            border: `1px solid ${isActive ? 'rgba(0,167,142,0.4)' : 'var(--border)'}`,
            borderRadius: '100px',
            background: isActive ? 'rgba(0,167,142,0.1)' : 'var(--muted)',
            cursor: 'pointer',
            fontFamily: 'var(--font-family-primary)',
            fontSize: '11px',
            fontWeight: 'var(--font-weight-semibold)',
            color: isActive ? 'var(--chart-2)' : 'var(--muted-foreground)',
            transition: 'all 0.15s',
          }}
        >
          {isActive
            ? <ToggleRight size={12} style={{ color: 'var(--chart-2)' }} />
            : <ToggleLeft  size={12} style={{ color: 'var(--muted-foreground)' }} />
          }
          {option.status}
        </button>
      </td>

      {/* Actions */}
      <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
          <IconBtn onClick={onEdit}   title="Edit"   icon={<Edit2  size={13} />} />
          <IconBtn onClick={onDelete} title="Delete" icon={<Trash2 size={13} />} danger />
        </div>
      </td>
    </tr>
  );
}

const TABLE_BADGE_STYLES: Record<ConfigTable, { bg: string; color: string }> = {
  Vendor:     { bg: 'rgba(35,34,240,0.10)',  color: 'var(--primary)' },
  Contract:   { bg: 'rgba(0,167,142,0.10)',  color: '#00A3A3' },
  Process:    { bg: 'rgba(224,123,0,0.12)',  color: '#E07B00' },
  Control:    { bg: 'rgba(28,138,69,0.12)',  color: '#1C8A45' },
  Risk:       { bg: 'rgba(192,57,43,0.10)',  color: '#C0392B' },
  Mitigation: { bg: 'rgba(107,63,160,0.12)', color: '#6B3FA0' },
  Product:    { bg: 'rgba(0,40,85,0.10)',    color: '#002855' },
  Assessment: { bg: 'rgba(184,134,11,0.12)', color: '#B8860B' },
  Contact:    { bg: 'rgba(107,116,137,0.12)', color: '#6B7489' },
  Framework:  { bg: 'rgba(0,163,163,0.12)',  color: '#00A3A3' },
  Compliance: { bg: 'rgba(28,138,69,0.12)',  color: '#1C8A45' },
};

function TableBadge({ table }: { table: ConfigTable }) {
  const style = TABLE_BADGE_STYLES[table] ?? { bg: 'var(--muted)', color: 'var(--foreground)' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '20px',
        padding: '0 8px',
        borderRadius: '100px',
        fontFamily: 'var(--font-family-primary)',
        fontSize: '11px',
        fontWeight: 'var(--font-weight-semibold)',
        background: style.bg,
        color: style.color,
        whiteSpace: 'nowrap',
      }}
    >
      {table}
    </span>
  );
}

function IconBtn({
  onClick, title, icon, danger,
}: {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '28px', height: '28px',
        border: `1px solid ${h ? (danger ? 'var(--destructive)' : 'var(--primary)') : 'var(--border)'}`,
        borderRadius: 'var(--radius-input)',
        background: h
          ? (danger ? 'rgba(222,0,55,0.06)' : 'rgba(35,34,240,0.06)')
          : 'transparent',
        cursor: 'pointer',
        color: h
          ? (danger ? 'var(--destructive)' : 'var(--primary)')
          : 'var(--muted-foreground)',
        transition: 'all 0.1s',
        padding: 0,
      }}
    >
      {icon}
    </button>
  );
}

function FilterSelect({
  value, onChange, placeholder, options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { label: string; value: string }[];
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        height: '32px',
        padding: '0 28px 0 10px',
        border: `1px solid ${value ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-input)',
        background: value ? 'rgba(35,34,240,0.04)' : 'var(--input-background)',
        fontFamily: 'var(--font-family-primary)',
        fontSize: 'var(--text-base)',
        color: value ? 'var(--primary)' : 'var(--foreground)',
        fontWeight: value ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
        cursor: 'pointer',
        outline: 'none',
        appearance: 'auto',
        minWidth: '120px',
      }}
    >
      <option value="">{placeholder}</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      style={{
        padding: '64px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        textAlign: 'center',
      }}
    >
      <SlidersHorizontal size={48} style={{ color: 'var(--muted-foreground)' }} />
      <div
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '14px',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--foreground)',
        }}
      >
        No dropdown values found
      </div>
      <div
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: 'var(--text-base)',
          color: 'var(--muted-foreground)',
        }}
      >
        Adjust your filters or add a new dropdown value.
      </div>
      <button
        onClick={onAdd}
        style={{
          marginTop: '4px',
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          height: '36px', padding: '0 16px',
          border: 'none', borderRadius: 'var(--radius-button)',
          background: 'var(--primary)', color: 'var(--primary-foreground)',
          fontFamily: 'var(--font-family-primary)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-semibold)',
          cursor: 'pointer',
        }}
      >
        <Plus size={14} /> Add Value
      </button>
    </div>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

interface ConfigOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<ConfigOption, 'id'>) => void;
  initialData?: ConfigOption | null;
  existingOptions: ConfigOption[];
}

function emptyForm(): Omit<ConfigOption, 'id'> {
  return { table: 'Vendor', field: 'Category', value: '', status: 'Active', sortOrder: 1 };
}

function ConfigOptionModal({
  isOpen, onClose, onSave, initialData, existingOptions,
}: ConfigOptionModalProps) {
  const [form, setForm]     = useState(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          table:     initialData.table,
          field:     initialData.field,
          value:     initialData.value,
          status:    initialData.status,
          sortOrder: initialData.sortOrder,
        });
      } else {
        setForm(emptyForm());
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  function set(key: string, val: unknown) {
    setForm(prev => {
      const next = { ...prev, [key]: val };
      // When table changes, reset field to first available
      if (key === 'table') {
        next.field = CONFIG_FIELD_MAP[val as ConfigTable]?.[0] ?? '';
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [key]: undefined as unknown as string }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.table) errs.table = 'Table is required.';
    if (!form.field) errs.field = 'Field is required.';
    if (!form.value.trim()) errs.value = 'Value is required.';
    else {
      // Duplicate check (excluding self when editing)
      const dup = existingOptions.find(o =>
        o.table === form.table &&
        o.field === form.field &&
        o.value.toLowerCase() === form.value.trim().toLowerCase() &&
        o.id !== initialData?.id
      );
      if (dup) errs.value = 'A value with this name already exists for this table/field.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    // Calculate next sortOrder
    const siblings = existingOptions.filter(
      o => o.table === form.table && o.field === form.field && o.id !== initialData?.id
    );
    const maxSort = siblings.reduce((m, o) => Math.max(m, o.sortOrder), 0);
    onSave({ ...form, value: form.value.trim(), sortOrder: initialData ? form.sortOrder : maxSort + 1 });
    onClose();
  }

  const availableFields = CONFIG_FIELD_MAP[form.table] ?? [];

  return (
    <FormModal
      title={initialData ? 'Edit Dropdown Value' : 'Add Dropdown Value'}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={initialData ? 'Save Changes' : 'Add Value'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Table + Field row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Table" required error={errors.table} helpText="The form or record this value applies to.">
            <SelectInput
              value={form.table}
              onChange={e => set('table', e.target.value)}
              hasError={!!errors.table}
            >
              {ALL_TABLES.map(t => <option key={t} value={t}>{t}</option>)}
            </SelectInput>
          </Field>

          <Field label="Field" required error={errors.field} helpText="The dropdown field this value populates.">
            <SelectInput
              value={form.field}
              onChange={e => set('field', e.target.value)}
              hasError={!!errors.field}
            >
              {availableFields.map(f => <option key={f} value={f}>{f}</option>)}
            </SelectInput>
          </Field>
        </div>

        {/* Value */}
        <Field
          label="Value"
          required
          error={errors.value}
          helpText={
            ['Control', 'Risk', 'Mitigation', 'Assessment'].includes(form.table)
              ? 'For coded fields, enter the internal key (e.g. "preventive"). The system displays the human-readable label automatically.'
              : 'The label that will appear in the dropdown menu.'
          }
        >
          <TextInput
            value={form.value}
            onChange={e => set('value', e.target.value)}
            hasError={!!errors.value}
            placeholder={
              ['Control', 'Risk', 'Mitigation', 'Assessment'].includes(form.table)
                ? 'e.g. preventive'
                : 'e.g. Professional Services'
            }
          />
        </Field>

        {/* Status indicator */}
        <Field label="Status" helpText="Inactive values are hidden from dropdown menus but kept for reference.">
          <div style={{ display: 'flex', gap: '8px', paddingTop: '2px' }}>
            {(['Active', 'Inactive'] as ConfigOptionStatus[]).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => set('status', s)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  height: '36px', padding: '0 14px',
                  border: `1px solid ${form.status === s
                    ? (s === 'Active' ? 'rgba(0,167,142,0.5)' : 'var(--border)')
                    : 'var(--border)'}`,
                  borderRadius: 'var(--radius-button)',
                  background: form.status === s
                    ? (s === 'Active' ? 'rgba(0,167,142,0.1)' : 'var(--muted)')
                    : 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: form.status === s ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                  color: form.status === s
                    ? (s === 'Active' ? 'var(--chart-2)' : 'var(--foreground)')
                    : 'var(--muted-foreground)',
                  transition: 'all 0.15s',
                }}
              >
                <span
                  style={{
                    width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                    background: s === 'Active' ? 'var(--chart-2)' : 'var(--muted-foreground)',
                  }}
                />
                {s}
              </button>
            ))}
          </div>
        </Field>

        {/* Context: existing values for this table/field */}
        {form.table && form.field && (
          <ExistingValuesPreview
            options={existingOptions}
            table={form.table}
            field={form.field}
            editingId={initialData?.id}
          />
        )}
      </div>
    </FormModal>
  );
}

function ExistingValuesPreview({
  options, table, field, editingId,
}: {
  options: ConfigOption[];
  table: string;
  field: string;
  editingId?: string;
}) {
  const peers = options
    .filter(o => o.table === table && o.field === field && o.id !== editingId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (peers.length === 0) return null;

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '6px 12px',
          background: 'var(--muted)',
          borderBottom: '1px solid var(--border)',
          fontFamily: 'var(--font-family-primary)',
          fontSize: '11px',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--muted-foreground)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Existing values for {table} → {field}
      </div>
      <div
        style={{
          padding: '10px 12px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
        }}
      >
        {peers.map(p => (
          <span
            key={p.id}
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              color: p.status === 'Active' ? 'var(--foreground)' : 'var(--muted-foreground)',
              background: p.status === 'Active' ? 'var(--muted)' : 'transparent',
              border: `1px solid ${p.status === 'Active' ? 'var(--border)' : 'var(--border)'}`,
              borderRadius: '100px',
              padding: '2px 8px',
              textDecoration: p.status === 'Inactive' ? 'line-through' : 'none',
            }}
          >
            {p.value}
          </span>
        ))}
      </div>
    </div>
  );
}