import React from 'react';
import { FileText } from 'lucide-react';
import { RegulatoryMetricsWidget } from '../components/compliance/RegulatoryMetricsWidget';
import { RegulatoryCalendar } from '../components/compliance/RegulatoryCalendar';

export function RegulatoryComplianceDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <FileText size={24} style={{ color: 'var(--primary)' }} />
          <h1
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '28px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: 0,
            }}
          >
            Regulatory Compliance Dashboard
          </h1>
        </div>
        <p
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            color: 'var(--muted-foreground)',
            margin: 0,
          }}
        >
          Monitor regulatory compliance posture, requirements coverage, and upcoming deadlines
        </p>
      </div>

      {/* Metrics Widget */}
      <RegulatoryMetricsWidget />

      {/* Calendar */}
      <RegulatoryCalendar />
    </div>
  );
}
