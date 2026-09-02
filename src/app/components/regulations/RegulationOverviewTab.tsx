import React from 'react';
import { Calendar, DollarSign, Users, Building2, CheckCircle, AlertCircle } from 'lucide-react';
import type { Regulation } from '../../data/regulationData';
import { formatDate } from '../../data/mockData';

interface RegulationOverviewTabProps {
  regulation: Regulation;
}

export function RegulationOverviewTab({ regulation }: RegulationOverviewTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Description Card */}
      {regulation.description && (
        <InfoCard title="Description" icon={AlertCircle}>
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--foreground)',
              margin: 0,
              lineHeight: '1.6',
            }}
          >
            {regulation.description}
          </p>
        </InfoCard>
      )}

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Classification */}
        <InfoCard title="Classification" icon={Building2}>
          <InfoRow label="Regulatory Body" value={regulation.regulatoryBody} />
          <InfoRow label="Jurisdiction" value={regulation.jurisdiction} />
          <InfoRow label="Category" value={regulation.category} />
          <InfoRow label="Impact Level" value={regulation.impactLevel.charAt(0).toUpperCase() + regulation.impactLevel.slice(1)} />
          {regulation.department && <InfoRow label="Department" value={regulation.department} />}
        </InfoCard>

        {/* Dates */}
        <InfoCard title="Important Dates" icon={Calendar}>
          {regulation.proposedDate && (
            <InfoRow label="Proposed Date" value={formatDate(regulation.proposedDate)} />
          )}
          {regulation.publicationDate && (
            <InfoRow label="Publication Date" value={formatDate(regulation.publicationDate)} />
          )}
          {regulation.effectiveDate && (
            <InfoRow label="Effective Date" value={formatDate(regulation.effectiveDate)} />
          )}
          {regulation.complianceDeadline && (
            <InfoRow
              label="Compliance Deadline"
              value={formatDate(regulation.complianceDeadline)}
              highlight={
                regulation.complianceDeadline < new Date().toISOString().split('T')[0] &&
                regulation.complianceStatus !== 'compliant'
              }
            />
          )}
          {regulation.reviewDate && (
            <InfoRow label="Review Date" value={formatDate(regulation.reviewDate)} />
          )}
        </InfoCard>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Ownership */}
        <InfoCard title="Ownership & Assignment" icon={Users}>
          {regulation.primaryOwner ? (
            <InfoRow label="Primary Owner" value={regulation.primaryOwner.name} />
          ) : (
            <InfoRow label="Primary Owner" value="—" />
          )}
          {regulation.stakeholders.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--muted-foreground)',
                }}
              >
                Stakeholders
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {regulation.stakeholders.map(user => (
                  <span
                    key={user.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      height: '22px',
                      padding: '0 10px',
                      borderRadius: '100px',
                      background: 'var(--muted)',
                      color: 'var(--foreground)',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-semibold)',
                    }}
                  >
                    {user.name}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <InfoRow label="Stakeholders" value="None assigned" />
          )}
          {regulation.department && <InfoRow label="Department" value={regulation.department} />}
        </InfoCard>

        {/* Compliance Tracking */}
        <InfoCard title="Compliance Tracking" icon={CheckCircle}>
          <InfoRow label="Readiness Score" value={`${regulation.readinessScore}%`} />
          <InfoRow
            label="Gap Analysis"
            value={regulation.gapAnalysisCompleted ? 'Completed' : 'Not Completed'}
          />
          {regulation.estimatedCost !== null && (
            <InfoRow
              label="Estimated Cost"
              value={`$${regulation.estimatedCost.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
            />
          )}
        </InfoCard>
      </div>

      {/* Links & References */}
      {(regulation.linkedControlIds.length > 0 ||
        regulation.relatedBillIds.length > 0) && (
        <InfoCard title="Linked Items" icon={AlertCircle}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--foreground)',
            }}
          >
            {regulation.linkedControlIds.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--muted-foreground)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Controls
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-base)',
                    color: 'var(--foreground)',
                    fontWeight: 'var(--font-weight-semibold)',
                  }}
                >
                  {regulation.linkedControlIds.length} linked
                </div>
              </div>
            )}
            {regulation.relatedBillIds.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--muted-foreground)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Bills & Legislation
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-base)',
                    color: 'var(--foreground)',
                    fontWeight: 'var(--font-weight-semibold)',
                  }}
                >
                  {regulation.relatedBillIds.length} linked
                </div>
              </div>
            )}
          </div>
        </InfoCard>
      )}

      {/* Tags */}
      {regulation.tags.length > 0 && (
        <InfoCard title="Tags" icon={AlertCircle}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {regulation.tags.map(tag => (
              <span
                key={tag}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: '22px',
                  padding: '0 10px',
                  borderRadius: '100px',
                  background: 'var(--muted)',
                  color: 'var(--foreground)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-semibold)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </InfoCard>
      )}

      {/* Audit Trail */}
      <InfoCard title="Audit Trail" icon={Calendar}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <InfoRow label="Created" value={formatDate(regulation.createdAt)} />
            <InfoRow label="Created By" value={regulation.createdBy} />
          </div>
          <div>
            <InfoRow label="Last Updated" value={formatDate(regulation.updatedAt)} />
            <InfoRow label="Updated By" value={regulation.updatedBy} />
          </div>
        </div>
      </InfoCard>
    </div>
  );
}

// ─── Helper Components ───────────────────────────────────────────────────────

function InfoCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: 'var(--background)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon size={16} style={{ color: 'var(--primary)' }} />
        <h3
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '14px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--foreground)',
            margin: 0,
          }}
        >
          {title}
        </h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
      <div
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '12px',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--muted-foreground)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: 'var(--text-base)',
          color: highlight ? 'var(--destructive)' : 'var(--foreground)',
          fontWeight: highlight ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
          textAlign: 'right',
        }}
      >
        {value}
      </div>
    </div>
  );
}