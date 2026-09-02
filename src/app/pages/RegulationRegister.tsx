import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus, Search, Filter, FileText, AlertTriangle,
  CheckCircle, Clock, XCircle, Archive, ChevronDown,
} from 'lucide-react';
import type { Regulation, RegulationStatus, ComplianceStatus, ImpactLevel } from '../data/regulationData';
import {
  loadRegulations, saveRegulations, filterRegulations, sortRegulations,
  calculateComplianceStats, REGULATION_STATUS_LABELS, REGULATION_STATUS_STYLES,
  COMPLIANCE_STATUS_LABELS, COMPLIANCE_STATUS_STYLES, IMPACT_LEVEL_LABELS,
  IMPACT_LEVEL_STYLES,
} from '../data/regulationData';
import { formatDate } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { RegulationFormModal } from '../components/regulations/RegulationFormModal';

// ─── KPI Tiles ───────────────────────────────────────────────────────────────

function KPITile({
  label,
  value,
  icon: Icon,
  trend,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  color?: string;
}) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--muted-foreground)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </span>
        <Icon size={18} style={{ color: color || 'var(--muted-foreground)' }} />
      </div>
      <div
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '28px',
          fontWeight: 'var(--font-weight-semibold)',
          color: color || 'var(--foreground)',
          lineHeight: '36px',
        }}
      >
        {value}
      </div>
      {trend && (
        <div
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            color: 'var(--muted-foreground)',
          }}
        >
          {trend}
        </div>
      )}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RegulationRegister() {
  const navigate = useNavigate();
  const { getActiveOptions } = useApp();
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RegulationStatus[]>([]);
  const [complianceStatusFilter, setComplianceStatusFilter] = useState<ComplianceStatus[]>([]);
  const [impactFilter, setImpactFilter] = useState<ImpactLevel[]>([]);
  const [sortBy, setSortBy] = useState<'id' | 'title' | 'effectiveDate' | 'complianceDeadline' | 'status' | 'impact'>(
    'id'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  useEffect(() => {
    setRegulations(loadRegulations());
  }, []);

  // Filtered and sorted regulations
  const displayedRegulations = useMemo(() => {
    let filtered = filterRegulations(regulations, {
      search: searchTerm,
      status: statusFilter.length > 0 ? statusFilter : undefined,
      complianceStatus: complianceStatusFilter.length > 0 ? complianceStatusFilter : undefined,
      impactLevel: impactFilter.length > 0 ? impactFilter : undefined,
    });

    return sortRegulations(filtered, sortBy, sortOrder);
  }, [regulations, searchTerm, statusFilter, complianceStatusFilter, impactFilter, sortBy, sortOrder]);

  // Stats
  const stats = useMemo(() => calculateComplianceStats(regulations), [regulations]);

  function handleCreate(data: Omit<Regulation, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) {
    const today = new Date().toISOString().split('T')[0];
    const nextNum = regulations.length + 1;
    const id = `REG-${String(nextNum).padStart(3, '0')}`;

    const newRegulation: Regulation = {
      ...data,
      id,
      createdAt: today,
      createdBy: 'Emily Carter',
      updatedAt: today,
      updatedBy: 'Emily Carter',
    };

    const updated = [...regulations, newRegulation];
    setRegulations(updated);
    saveRegulations(updated);
    setCreateModalOpen(false);
  }

  function toggleStatusFilter(status: RegulationStatus) {
    setStatusFilter(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  }

  function toggleComplianceStatusFilter(status: ComplianceStatus) {
    setComplianceStatusFilter(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  }

  function toggleImpactFilter(level: ImpactLevel) {
    setImpactFilter(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '28px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: 0,
              lineHeight: '36px',
            }}
          >
            Regulation Register
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--muted-foreground)',
              margin: '4px 0 0 0',
            }}
          >
            Track and manage regulatory compliance requirements
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
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
          <Plus size={16} />
          Add Regulation
        </button>
      </div>

      {/* KPI Tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        <KPITile label="Total Regulations" value={stats.total} icon={FileText} />
        <KPITile
          label="Compliant"
          value={stats.compliant}
          icon={CheckCircle}
          color="#1C8A45"
          trend={`${stats.complianceRate}% compliance rate`}
        />
        <KPITile
          label="Non-Compliant"
          value={stats.nonCompliant}
          icon={XCircle}
          color="#C0392B"
        />
        <KPITile
          label="Upcoming (30d)"
          value={stats.upcoming30Days}
          icon={Clock}
          color="#E07B00"
        />
        <KPITile
          label="Overdue"
          value={stats.overdue}
          icon={AlertTriangle}
          color={stats.overdue > 0 ? '#C0392B' : 'var(--muted-foreground)'}
        />
      </div>

      {/* Search and Filters */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted-foreground)',
              }}
            />
            <input
              type="text"
              placeholder="Search by ID, number, title, or body..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                height: '36px',
                padding: '0 12px 0 36px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-input)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--foreground)',
                background: 'var(--background)',
              }}
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e =>
              setSortBy(
                e.target.value as 'id' | 'title' | 'effectiveDate' | 'complianceDeadline' | 'status' | 'impact'
              )
            }
            style={{
              height: '36px',
              padding: '0 12px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-input)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--foreground)',
              background: 'var(--background)',
              cursor: 'pointer',
            }}
          >
            <option value="id">Sort by: ID</option>
            <option value="title">Sort by: Title</option>
            <option value="effectiveDate">Sort by: Effective Date</option>
            <option value="complianceDeadline">Sort by: Deadline</option>
            <option value="status">Sort by: Status</option>
            <option value="impact">Sort by: Impact</option>
          </select>

          <button
            onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
            style={{
              height: '36px',
              padding: '0 12px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-input)',
              background: 'var(--background)',
              color: 'var(--foreground)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              cursor: 'pointer',
            }}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>

          <button
            onClick={() => setFiltersExpanded(prev => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '36px',
              padding: '0 12px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-input)',
              background: filtersExpanded ? 'var(--primary)' : 'var(--background)',
              color: filtersExpanded ? 'var(--primary-foreground)' : 'var(--foreground)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
            }}
          >
            <Filter size={16} />
            Filters
            <ChevronDown
              size={14}
              style={{
                transform: filtersExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            />
          </button>
        </div>

        {/* Filter Chips */}
        {filtersExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            {/* Status Filters */}
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--muted-foreground)',
                  marginBottom: '6px',
                }}
              >
                Status
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(
                  ['monitoring', 'in-review', 'in-progress', 'compliant', 'non-compliant', 'not-applicable', 'archived'] as RegulationStatus[]
                ).map(status => (
                  <button
                    key={status}
                    onClick={() => toggleStatusFilter(status)}
                    style={{
                      height: '28px',
                      padding: '0 12px',
                      border: statusFilter.includes(status) ? 'none' : '1px solid var(--border)',
                      borderRadius: '100px',
                      background: statusFilter.includes(status)
                        ? REGULATION_STATUS_STYLES[status].background
                        : 'var(--background)',
                      color: statusFilter.includes(status)
                        ? REGULATION_STATUS_STYLES[status].color
                        : 'var(--foreground)',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-semibold)',
                      cursor: 'pointer',
                    }}
                  >
                    {REGULATION_STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>

            {/* Compliance Status Filters */}
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--muted-foreground)',
                  marginBottom: '6px',
                }}
              >
                Compliance Status
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(
                  ['not-started', 'assessment', 'planning', 'implementing', 'testing', 'compliant', 'partial', 'non-compliant'] as ComplianceStatus[]
                ).map(status => (
                  <button
                    key={status}
                    onClick={() => toggleComplianceStatusFilter(status)}
                    style={{
                      height: '28px',
                      padding: '0 12px',
                      border: complianceStatusFilter.includes(status) ? 'none' : '1px solid var(--border)',
                      borderRadius: '100px',
                      background: complianceStatusFilter.includes(status)
                        ? COMPLIANCE_STATUS_STYLES[status].background
                        : 'var(--background)',
                      color: complianceStatusFilter.includes(status)
                        ? COMPLIANCE_STATUS_STYLES[status].color
                        : 'var(--foreground)',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-semibold)',
                      cursor: 'pointer',
                    }}
                  >
                    {COMPLIANCE_STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>

            {/* Impact Level Filters */}
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--muted-foreground)',
                  marginBottom: '6px',
                }}
              >
                Impact Level
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(['critical', 'high', 'medium', 'low'] as ImpactLevel[]).map(level => (
                  <button
                    key={level}
                    onClick={() => toggleImpactFilter(level)}
                    style={{
                      height: '28px',
                      padding: '0 12px',
                      border: impactFilter.includes(level) ? 'none' : '1px solid var(--border)',
                      borderRadius: '100px',
                      background: impactFilter.includes(level)
                        ? IMPACT_LEVEL_STYLES[level].background
                        : 'var(--background)',
                      color: impactFilter.includes(level)
                        ? IMPACT_LEVEL_STYLES[level].color
                        : 'var(--foreground)',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-semibold)',
                      cursor: 'pointer',
                    }}
                  >
                    {IMPACT_LEVEL_LABELS[level]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Count */}
        {(statusFilter.length > 0 || complianceStatusFilter.length > 0 || impactFilter.length > 0) && (
          <div
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              color: 'var(--muted-foreground)',
            }}
          >
            {statusFilter.length + complianceStatusFilter.length + impactFilter.length} filter(s) active ·{' '}
            <button
              onClick={() => {
                setStatusFilter([]);
                setComplianceStatusFilter([]);
                setImpactFilter([]);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '12px',
          color: 'var(--muted-foreground)',
        }}
      >
        Showing {displayedRegulations.length} of {regulations.length} regulation{regulations.length !== 1 ? 's' : ''}
      </div>

      {/* Regulations Table */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                {['Regulation', 'Regulatory Body', 'Status', 'Compliance', 'Impact', 'Effective Date', 'Deadline', 'Owner'].map(
                  h => (
                    <th
                      key={h}
                      style={{
                        padding: '0 16px',
                        height: '40px',
                        textAlign: 'left',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '12px',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--muted-foreground)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {displayedRegulations.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <FileText size={48} style={{ color: 'var(--muted-foreground)' }} />
                      <div
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--text-base)',
                          color: 'var(--foreground)',
                          fontWeight: 'var(--font-weight-semibold)',
                        }}
                      >
                        No regulations found
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--text-base)',
                          color: 'var(--muted-foreground)',
                        }}
                      >
                        Try adjusting your search or filters
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedRegulations.map((reg, idx) => {
                  const isOverdue =
                    reg.complianceDeadline &&
                    reg.complianceDeadline < today &&
                    reg.complianceStatus !== 'compliant' &&
                    reg.status !== 'compliant';
                  const statusStyle = REGULATION_STATUS_STYLES[reg.status];
                  const complianceStyle = COMPLIANCE_STATUS_STYLES[reg.complianceStatus];
                  const impactStyle = IMPACT_LEVEL_STYLES[reg.impactLevel];

                  return (
                    <tr
                      key={reg.id}
                      onClick={() => navigate(`/regulations/${reg.id}`)}
                      style={{
                        background: idx % 2 === 0 ? 'var(--card)' : 'var(--muted)',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                      }}
                    >
                      {/* Regulation */}
                      <td style={{ padding: '0 16px', height: '56px' }}>
                        <div
                          style={{
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: 'var(--text-base)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--primary)',
                            marginBottom: '2px',
                          }}
                        >
                          {reg.title}
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: '12px',
                            color: 'var(--muted-foreground)',
                          }}
                        >
                          {reg.id} · {reg.regulationNumber}
                        </div>
                      </td>

                      {/* Regulatory Body */}
                      <td
                        style={{
                          padding: '0 16px',
                          height: '56px',
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '12px',
                          color: 'var(--foreground)',
                        }}
                      >
                        {reg.regulatoryBody}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0 16px', height: '56px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            height: '20px',
                            padding: '0 8px',
                            borderRadius: '100px',
                            background: statusStyle.background,
                            color: statusStyle.color,
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: '12px',
                            fontWeight: 'var(--font-weight-semibold)',
                          }}
                        >
                          {REGULATION_STATUS_LABELS[reg.status]}
                        </span>
                      </td>

                      {/* Compliance */}
                      <td style={{ padding: '0 16px', height: '56px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            height: '20px',
                            padding: '0 8px',
                            borderRadius: '100px',
                            background: complianceStyle.background,
                            color: complianceStyle.color,
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: '12px',
                            fontWeight: 'var(--font-weight-semibold)',
                          }}
                        >
                          {COMPLIANCE_STATUS_LABELS[reg.complianceStatus]}
                        </span>
                      </td>

                      {/* Impact */}
                      <td style={{ padding: '0 16px', height: '56px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            height: '20px',
                            padding: '0 8px',
                            borderRadius: '100px',
                            background: impactStyle.background,
                            color: impactStyle.color,
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: '12px',
                            fontWeight: 'var(--font-weight-semibold)',
                          }}
                        >
                          {IMPACT_LEVEL_LABELS[reg.impactLevel]}
                        </span>
                      </td>

                      {/* Effective Date */}
                      <td
                        style={{
                          padding: '0 16px',
                          height: '56px',
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '12px',
                          color: 'var(--foreground)',
                        }}
                      >
                        {reg.effectiveDate ? formatDate(reg.effectiveDate) : '—'}
                      </td>

                      {/* Deadline */}
                      <td
                        style={{
                          padding: '0 16px',
                          height: '56px',
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '12px',
                          color: isOverdue ? 'var(--destructive)' : 'var(--foreground)',
                          fontWeight: isOverdue ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                        }}
                      >
                        {reg.complianceDeadline ? formatDate(reg.complianceDeadline) : '—'}
                        {isOverdue && (
                          <AlertTriangle
                            size={12}
                            style={{ marginLeft: '4px', verticalAlign: 'middle' }}
                          />
                        )}
                      </td>

                      {/* Owner */}
                      <td
                        style={{
                          padding: '0 16px',
                          height: '56px',
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '12px',
                          color: 'var(--foreground)',
                        }}
                      >
                        {reg.primaryOwner?.name || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {createModalOpen && (
        <RegulationFormModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSave={handleCreate}
        />
      )}
    </div>
  );
}
