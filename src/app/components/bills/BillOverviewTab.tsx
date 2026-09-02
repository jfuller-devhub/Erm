import React from 'react';
import { useNavigate } from 'react-router';
import { Calendar, User } from 'lucide-react';
import type { Bill } from '../../data/billData';
import { loadRegulations } from '../../data/regulationData';

interface BillOverviewTabProps {
  bill: Bill;
}

export function BillOverviewTab({ bill }: BillOverviewTabProps) {
  const navigate = useNavigate();
  const regulations = loadRegulations();
  const relatedRegulation = bill.regulationId
    ? regulations.find(r => r.id === bill.regulationId)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Key Info Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {/* Summary */}
        <InfoCard title="Summary" content={bill.summary || 'No summary provided'} />

        {/* Legislature & Committee */}
        <InfoCard
          title="Legislature & Committee"
          content={
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <strong style={{ fontFamily: 'var(--font-family-primary)', fontWeight: 'var(--font-weight-semibold)' }}>Legislature:</strong>{' '}
                {bill.legislature}
              </div>
              {bill.currentCommittee && (
                <div>
                  <strong style={{ fontFamily: 'var(--font-family-primary)', fontWeight: 'var(--font-weight-semibold)' }}>Current Committee:</strong>{' '}
                  {bill.currentCommittee}
                </div>
              )}
            </div>
          }
        />

        {/* Dates */}
        <InfoCard
          title="Key Dates"
          content={
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} style={{ color: 'var(--muted-foreground)' }} />
                <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)' }}>
                  Introduced: {new Date(bill.introducedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              {bill.sponsor && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} style={{ color: 'var(--muted-foreground)' }} />
                  <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)' }}>
                    Sponsor: {bill.sponsor}
                  </span>
                </div>
              )}
            </div>
          }
        />

        {/* Related Regulation */}
        {relatedRegulation && (
          <InfoCard
            title="Related Regulation"
            content={
              <div
                onClick={() => navigate(`/regulations/${relatedRegulation.id}`)}
                style={{
                  cursor: 'pointer',
                  color: 'var(--primary)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                }}
              >
                {relatedRegulation.name}
              </div>
            }
          />
        )}

        {/* Internal Notes */}
        {bill.internalNotes && <InfoCard title="Internal Notes" content={bill.internalNotes} />}
      </div>

      {/* Official URL */}
      {bill.officialUrl && (
        <div
          style={{
            background: 'var(--muted)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            padding: '16px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--muted-foreground)',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Official Source
          </div>
          <a
            href={bill.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--primary)',
              fontWeight: 'var(--font-weight-semibold)',
              textDecoration: 'underline',
            }}
          >
            {bill.officialUrl}
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Info Card ────────────────────────────────────────────────────────────────

function InfoCard({ title, content }: { title: string; content: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '16px',
      }}
    >
      <h4
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '12px',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--muted-foreground)',
          margin: '0 0 8px 0',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {title}
      </h4>
      <div
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: 'var(--text-base)',
          color: 'var(--foreground)',
        }}
      >
        {content}
      </div>
    </div>
  );
}
