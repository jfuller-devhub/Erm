import React from 'react';
import { useNavigate } from 'react-router';
import { FileText } from 'lucide-react';
import type { Regulation } from '../../data/regulationData';
import { loadBills } from '../../data/billData';

interface RegulationRelatedTabProps {
  regulation: Regulation;
}

export function RegulationRelatedTab({ regulation }: RegulationRelatedTabProps) {
  const navigate = useNavigate();
  const bills = loadBills().filter(b => regulation.relatedBillIds.includes(b.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Related Bills */}
      <section>
        <h3
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '18px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--foreground)',
            margin: '0 0 12px 0',
          }}
        >
          Related Bills & Legislation ({regulation.relatedBillIds.length})
        </h3>
        {bills.length === 0 ? (
          <EmptyState icon={FileText} message="No bills or legislation linked yet" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {bills.map(bill => (
              <div
                key={bill.id}
                style={{
                  padding: '12px 16px',
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-card)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <FileText size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--foreground)',
                      marginBottom: '2px',
                    }}
                  >
                    {bill.title}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '12px',
                      color: 'var(--muted-foreground)',
                    }}
                  >
                    {bill.billNumber} · {bill.legislature}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div
      style={{
        padding: '32px 24px',
        background: 'var(--background)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <Icon size={32} style={{ color: 'var(--muted-foreground)' }} />
      <div
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: 'var(--text-base)',
          color: 'var(--muted-foreground)',
        }}
      >
        {message}
      </div>
    </div>
  );
}