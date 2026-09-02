import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Bill, BillVote } from '../../data/billData';
import { VoteFormModal } from './VoteFormModal';
import { loadBills, saveBills } from '../../data/billData';

interface BillVotesTabProps {
  bill: Bill;
  onUpdate: (updated: Bill) => void;
}

export function BillVotesTab({ bill, onUpdate }: BillVotesTabProps) {
  const [voteModalOpen, setVoteModalOpen] = useState(false);

  function handleAddVote(data: Omit<BillVote, 'id'>) {
    const bills = loadBills();
    const today = new Date().toISOString().split('T')[0];
    const newVote: BillVote = {
      id: `VOTE-${Date.now()}`,
      ...data,
    };
    const updated = bills.map(b =>
      b.id === bill.id
        ? { ...b, votes: [...b.votes, newVote], updatedAt: today, updatedBy: 'Emily Carter' }
        : b
    );

    saveBills(updated);
    const updatedBill = updated.find(b => b.id === bill.id);
    if (updatedBill) onUpdate(updatedBill);
    setVoteModalOpen(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '18px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: 0,
            }}
          >
            Voting History ({bill.votes.length})
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--muted-foreground)',
              margin: '4px 0 0 0',
            }}
          >
            Legislative chamber votes and results
          </p>
        </div>
        <button
          onClick={() => setVoteModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            border: 'none',
            borderRadius: 'var(--radius-button)',
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          Add Vote
        </button>
      </div>

      {/* Votes List */}
      {bill.votes.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {bill.votes.map(vote => (
            <div
              key={vote.id}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
                padding: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--foreground)',
                  }}
                >
                  {vote.chamber}
                </div>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '100px',
                    fontSize: '12px',
                    fontFamily: 'var(--font-family-primary)',
                    fontWeight: 'var(--font-weight-semibold)',
                    background: vote.result === 'passed' ? '#E8F5E9' : '#FFEBEE',
                    color: vote.result === 'passed' ? '#2E7D32' : '#C62828',
                  }}
                >
                  {vote.result === 'passed' ? 'Passed' : 'Failed'}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  flexWrap: 'wrap',
                  marginBottom: '8px',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--foreground)',
                  }}
                >
                  <span style={{ fontWeight: 'var(--font-weight-semibold)', color: '#2E7D32' }}>For:</span> {vote.votesFor}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--foreground)',
                  }}
                >
                  <span style={{ fontWeight: 'var(--font-weight-semibold)', color: '#C62828' }}>Against:</span> {vote.votesAgainst}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--foreground)',
                  }}
                >
                  <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)' }}>Abstained:</span> {vote.votesAbstained}
                </div>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  color: 'var(--muted-foreground)',
                }}
              >
                {new Date(vote.voteDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            padding: '48px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--muted-foreground)',
              margin: 0,
            }}
          >
            No voting history yet. Click "Add Vote" to record a vote.
          </p>
        </div>
      )}

      {/* Vote Modal */}
      {voteModalOpen && (
        <VoteFormModal
          onClose={() => setVoteModalOpen(false)}
          onSubmit={handleAddVote}
        />
      )}
    </div>
  );
}
