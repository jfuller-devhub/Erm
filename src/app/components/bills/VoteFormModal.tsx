import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { BillVote } from '../../data/billData';

interface VoteFormModalProps {
  onClose: () => void;
  onSubmit: (data: Omit<BillVote, 'id'>) => void;
  initialData?: BillVote;
}

export function VoteFormModal({ onClose, onSubmit, initialData }: VoteFormModalProps) {
  const [chamber, setChamber] = useState(initialData?.chamber || '');
  const [voteDate, setVoteDate] = useState(initialData?.voteDate || '');
  const [result, setResult] = useState<'passed' | 'failed'>(initialData?.result || 'passed');
  const [votesFor, setVotesFor] = useState(initialData?.votesFor?.toString() || '');
  const [votesAgainst, setVotesAgainst] = useState(initialData?.votesAgainst?.toString() || '');
  const [votesAbstained, setVotesAbstained] = useState(initialData?.votesAbstained?.toString() || '');

  const isEdit = !!initialData;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!chamber.trim() || !voteDate || !votesFor || !votesAgainst || !votesAbstained) {
      alert('Please fill in all required fields');
      return;
    }

    const forNum = parseInt(votesFor, 10);
    const againstNum = parseInt(votesAgainst, 10);
    const abstainedNum = parseInt(votesAbstained, 10);

    if (isNaN(forNum) || isNaN(againstNum) || isNaN(abstainedNum)) {
      alert('Vote counts must be valid numbers');
      return;
    }

    if (forNum < 0 || againstNum < 0 || abstainedNum < 0) {
      alert('Vote counts cannot be negative');
      return;
    }

    onSubmit({
      chamber: chamber.trim(),
      voteDate,
      result,
      votesFor: forNum,
      votesAgainst: againstNum,
      votesAbstained: abstainedNum,
    });
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--radius-card)',
          padding: '24px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '18px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: 0,
            }}
          >
            {isEdit ? 'Edit Vote' : 'Add Vote'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--muted-foreground)',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Chamber */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                marginBottom: '8px',
              }}
            >
              Chamber <span style={{ color: 'var(--destructive)' }}>*</span>
            </label>
            <input
              type="text"
              value={chamber}
              onChange={e => setChamber(e.target.value)}
              placeholder="e.g., House, Senate"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-input)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--foreground)',
                background: 'var(--background)',
              }}
            />
            <p
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                color: 'var(--muted-foreground)',
                margin: '4px 0 0 0',
              }}
            >
              Specify the legislative chamber (e.g., House, Senate, State Assembly)
            </p>
          </div>

          {/* Vote Date */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                marginBottom: '8px',
              }}
            >
              Vote Date <span style={{ color: 'var(--destructive)' }}>*</span>
            </label>
            <input
              type="date"
              value={voteDate}
              onChange={e => setVoteDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-input)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--foreground)',
                background: 'var(--background)',
              }}
            />
          </div>

          {/* Result */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                marginBottom: '8px',
              }}
            >
              Result <span style={{ color: 'var(--destructive)' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--foreground)',
                }}
              >
                <input
                  type="radio"
                  value="passed"
                  checked={result === 'passed'}
                  onChange={() => setResult('passed')}
                  style={{ cursor: 'pointer' }}
                />
                Passed
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--foreground)',
                }}
              >
                <input
                  type="radio"
                  value="failed"
                  checked={result === 'failed'}
                  onChange={() => setResult('failed')}
                  style={{ cursor: 'pointer' }}
                />
                Failed
              </label>
            </div>
          </div>

          {/* Vote Counts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--foreground)',
                  marginBottom: '8px',
                }}
              >
                Votes For <span style={{ color: 'var(--destructive)' }}>*</span>
              </label>
              <input
                type="number"
                min="0"
                value={votesFor}
                onChange={e => setVotesFor(e.target.value)}
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-input)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--foreground)',
                  background: 'var(--background)',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--foreground)',
                  marginBottom: '8px',
                }}
              >
                Votes Against <span style={{ color: 'var(--destructive)' }}>*</span>
              </label>
              <input
                type="number"
                min="0"
                value={votesAgainst}
                onChange={e => setVotesAgainst(e.target.value)}
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-input)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--foreground)',
                  background: 'var(--background)',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--foreground)',
                  marginBottom: '8px',
                }}
              >
                Abstained <span style={{ color: 'var(--destructive)' }}>*</span>
              </label>
              <input
                type="number"
                min="0"
                value={votesAbstained}
                onChange={e => setVotesAbstained(e.target.value)}
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-input)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--foreground)',
                  background: 'var(--background)',
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: 'var(--secondary)',
                color: 'var(--secondary-foreground)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-button)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
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
              {isEdit ? 'Save Changes' : 'Add Vote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
