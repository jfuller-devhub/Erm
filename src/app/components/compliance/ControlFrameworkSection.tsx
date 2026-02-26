import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus, X, BookOpen, Award, ExternalLink,
} from 'lucide-react';
import { LinkControlToRequirementModal } from './RequirementLinkModal';
import type { ComplianceFramework } from '../../data/complianceFrameworkData';
import { FRAMEWORK_STATUS_LABELS, FRAMEWORK_STATUS_STYLES } from '../../data/complianceFrameworkData';
import type { FrameworkRequirement } from '../../data/frameworkRequirementData';
import type { ControlRequirementMapping } from '../../data/controlRequirementData';
import {
  getMappingsForControl,
  IMPLEMENTATION_STATUS_LABELS, IMPLEMENTATION_STATUS_STYLES,
} from '../../data/controlRequirementData';
import { MOCK_USERS, generateId } from '../../data/mockData';

interface ControlFrameworkSectionProps {
  controlId: string;
  frameworks: ComplianceFramework[];
  requirements: FrameworkRequirement[];
  mappings: ControlRequirementMapping[];
  onMappingsChange: (updated: ControlRequirementMapping[]) => void;
}

export function ControlFrameworkSection({
  controlId,
  frameworks,
  requirements,
  mappings,
  onMappingsChange,
}: ControlFrameworkSectionProps) {
  const navigate = useNavigate();
  const [linkOpen, setLinkOpen] = useState(false);
  const [unlinkConfirm, setUnlinkConfirm] = useState<{ mappingId: string; reqTitle: string } | null>(null);

  const controlMappings = useMemo(
    () => getMappingsForControl(mappings, controlId),
    [mappings, controlId]
  );

  // Group mappings by framework
  const groupedByFramework = useMemo(() => {
    const map = new Map<string, { framework: ComplianceFramework; mappings: (ControlRequirementMapping & { requirement: FrameworkRequirement })[] }>();

    controlMappings.forEach(mapping => {
      const req = requirements.find(r => r.id === mapping.requirementId);
      if (!req) return;
      const fw = frameworks.find(f => f.id === req.frameworkId);
      if (!fw) return;

      if (!map.has(fw.id)) {
        map.set(fw.id, { framework: fw, mappings: [] });
      }
      map.get(fw.id)!.mappings.push({ ...mapping, requirement: req });
    });

    return [...map.values()];
  }, [controlMappings, requirements, frameworks]);

  function handleLinkRequirement(data: Omit<ControlRequirementMapping, 'id' | 'lastAssessedDate' | 'assessor'>) {
    const today = new Date().toISOString().split('T')[0];
    const newMapping: ControlRequirementMapping = {
      id: 'CRM-' + generateId(),
      ...data,
      lastAssessedDate: today,
      assessor: MOCK_USERS[0],
    };
    onMappingsChange([...mappings, newMapping]);
  }

  function handleUnlinkMapping(mappingId: string) {
    onMappingsChange(mappings.filter(m => m.id !== mappingId));
    setUnlinkConfirm(null);
  }

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '14px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: 0,
              lineHeight: '20px',
            }}
          >
            Framework Requirements
          </h3>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '20px',
              height: '20px',
              padding: '0 6px',
              borderRadius: '100px',
              background: 'rgba(35,34,240,0.08)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '11px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--primary)',
            }}
          >
            {controlMappings.length}
          </span>
        </div>
        <button
          onClick={() => setLinkOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            height: '28px',
            padding: '0 12px',
            border: '1px solid var(--primary)',
            borderRadius: 'var(--radius-button)',
            background: 'transparent',
            color: 'var(--primary)',
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer',
          }}
        >
          <Plus size={12} />
          Link Requirement
        </button>
      </div>

      {/* Summary chips */}
      {controlMappings.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '12px',
            padding: '12px 24px',
            borderBottom: '1px solid var(--border)',
            flexWrap: 'wrap',
          }}
        >
          <SummaryChip label="Frameworks" value={groupedByFramework.length} color="var(--primary)" />
          <SummaryChip
            label="Implemented"
            value={controlMappings.filter(m => m.implementationStatus === 'implemented').length}
            color="#1C8A45"
          />
          <SummaryChip
            label="In Progress"
            value={controlMappings.filter(m => m.implementationStatus === 'in_progress').length}
            color="#E07B00"
          />
          <SummaryChip
            label="Not Started"
            value={controlMappings.filter(m => m.implementationStatus === 'not_started').length}
            color="#C0392B"
          />
        </div>
      )}

      {/* Content */}
      {controlMappings.length === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <BookOpen size={32} style={{ color: 'var(--muted-foreground)' }} />
          <div
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '14px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              marginTop: '8px',
              marginBottom: '4px',
            }}
          >
            No framework requirements linked
          </div>
          <div
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--muted-foreground)',
              marginBottom: '16px',
            }}
          >
            Link this control to framework requirements to track framework coverage.
          </div>
          <button
            onClick={() => setLinkOpen(true)}
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
            }}
          >
            Link Requirement
          </button>
        </div>
      ) : (
        // Grouped by framework
        groupedByFramework.map(group => (
          <div key={group.framework.id}>
            {/* Framework header row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                background: 'var(--muted)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <BookOpen size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span
                onClick={() => navigate(`/compliance/${group.framework.id}`)}
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                }}
              >
                {group.framework.name} {group.framework.version}
              </span>
              <Badge
                bg={FRAMEWORK_STATUS_STYLES[group.framework.status].background}
                color={FRAMEWORK_STATUS_STYLES[group.framework.status].color}
              >
                {FRAMEWORK_STATUS_LABELS[group.framework.status]}
              </Badge>
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  color: 'var(--muted-foreground)',
                  marginLeft: 'auto',
                }}
              >
                {group.mappings.length} requirement{group.mappings.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Requirements for this framework */}
            {group.mappings.map((mapping, idx) => (
              <div
                key={mapping.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 24px 8px 48px',
                  borderBottom: '1px solid var(--border)',
                  background: idx % 2 === 0 ? 'var(--card)' : 'var(--muted)',
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--primary)',
                    minWidth: '50px',
                  }}
                >
                  {mapping.requirement.referenceCode}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--foreground)',
                    flex: 1,
                    minWidth: '120px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {mapping.requirement.title}
                </span>
                <Badge
                  bg={IMPLEMENTATION_STATUS_STYLES[mapping.implementationStatus].background}
                  color={IMPLEMENTATION_STATUS_STYLES[mapping.implementationStatus].color}
                >
                  {IMPLEMENTATION_STATUS_LABELS[mapping.implementationStatus]}
                </Badge>
                {mapping.maturityScore !== null && (
                  <span
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '11px',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: mapping.maturityScore >= 3 ? '#1C8A45' : '#E07B00',
                      flexShrink: 0,
                    }}
                  >
                    M{mapping.maturityScore}
                  </span>
                )}
                <button
                  onClick={() => setUnlinkConfirm({ mappingId: mapping.id, reqTitle: `${mapping.requirement.referenceCode} — ${mapping.requirement.title}` })}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    height: '24px',
                    padding: '0 8px',
                    border: 'none',
                    borderRadius: 'var(--radius-input)',
                    background: 'transparent',
                    color: 'var(--destructive)',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-semibold)',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(192,57,43,0.06)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  <X size={10} />
                  Unlink
                </button>
              </div>
            ))}
          </div>
        ))
      )}

      {/* Link Requirement Modal */}
      <LinkControlToRequirementModal
        isOpen={linkOpen}
        onClose={() => setLinkOpen(false)}
        onSave={handleLinkRequirement}
        controlId={controlId}
        frameworks={frameworks}
        requirements={requirements}
        existingMappings={mappings}
      />

      {/* Unlink Confirmation Dialog */}
      {unlinkConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', padding: '24px' }}
          onClick={e => { if (e.target === e.currentTarget) setUnlinkConfirm(null); }}
        >
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: '0px 8px 32px rgba(0,0,0,0.18)', padding: '24px', maxWidth: '400px', width: '100%' }}>
            <h3 style={{ fontFamily: 'var(--font-family-primary)', fontSize: '18px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: '0 0 8px 0' }}>
              Remove Mapping
            </h3>
            <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', margin: '0 0 24px 0', lineHeight: '22px' }}>
              Are you sure you want to remove the mapping to <strong>{unlinkConfirm.reqTitle}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setUnlinkConfirm(null)}
                style={{ height: '36px', padding: '0 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', background: 'var(--card)', color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleUnlinkMapping(unlinkConfirm.mappingId)}
                style={{ height: '36px', padding: '0 16px', border: 'none', borderRadius: 'var(--radius-button)', background: 'var(--destructive)', color: 'var(--destructive-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small helpers ───────────────────────────────────────────────────────────

function Badge({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '20px',
        padding: '0 8px',
        borderRadius: '100px',
        background: bg,
        color,
        fontFamily: 'var(--font-family-primary)',
        fontSize: '12px',
        fontWeight: 'var(--font-weight-semibold)',
        lineHeight: '16px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

function SummaryChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '100px',
        background: 'var(--muted)',
        fontFamily: 'var(--font-family-primary)',
        fontSize: '12px',
      }}
    >
      <span style={{ fontWeight: 'var(--font-weight-semibold)', color }}>{value}</span>
      <span style={{ color: 'var(--muted-foreground)' }}>{label}</span>
    </div>
  );
}