import React, { useState, useEffect } from 'react';
import { Plus, MessageCircle, AlertCircle, FileText, CheckCircle, HelpCircle, Edit } from 'lucide-react';
import type { Regulation } from '../../data/regulationData';
import {
  loadRegulationComments,
  saveRegulationComments,
  getTopLevelComments,
  getReplies,
  createComment,
  deleteComment,
  type RegulationComment,
  type CommentType,
  COMMENT_TYPE_LABELS,
  COMMENT_TYPE_STYLES,
} from '../../data/regulationCommentData';
import { CommentFormModal } from './CommentFormModal';

interface RegulationActivityTabProps {
  regulation: Regulation;
}

export function RegulationActivityTab({ regulation }: RegulationActivityTabProps) {
  const [comments, setComments] = useState<RegulationComment[]>([]);
  const [topLevelComments, setTopLevelComments] = useState<RegulationComment[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<RegulationComment | null>(null);
  const [filterType, setFilterType] = useState<CommentType | 'all'>('all');

  useEffect(() => {
    const allComments = loadRegulationComments();
    setComments(allComments);
    const topLevel = getTopLevelComments(allComments, regulation.id);
    setTopLevelComments(topLevel);
  }, [regulation.id]);

  function handleAddComment(data: Omit<RegulationComment, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) {
    const allComments = loadRegulationComments();
    const newComment = createComment(allComments, data);
    const updated = [...allComments, newComment];
    saveRegulationComments(updated);
    setComments(updated);
    setTopLevelComments(getTopLevelComments(updated, regulation.id));
    setAddModalOpen(false);
    setReplyTo(null);
  }

  function handleDelete(id: string) {
    const allComments = loadRegulationComments();
    const updated = deleteComment(allComments, id);
    saveRegulationComments(updated);
    setComments(updated);
    setTopLevelComments(getTopLevelComments(updated, regulation.id));
  }

  const filteredComments =
    filterType === 'all'
      ? topLevelComments
      : topLevelComments.filter(c => c.commentType === filterType);

  const stats = {
    total: topLevelComments.length,
    analysis: topLevelComments.filter(c => c.commentType === 'analysis').length,
    risk: topLevelComments.filter(c => c.commentType === 'risk').length,
    decision: topLevelComments.filter(c => c.commentType === 'decision').length,
  };

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
            Activity & Comments ({stats.total})
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--muted-foreground)',
              margin: '4px 0 0 0',
            }}
          >
            Analysis, decisions, updates, and internal discussions
          </p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
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
          Add Comment
        </button>
      </div>

      {/* Stats & Filter */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '16px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <FilterButton
            label="All"
            count={stats.total}
            active={filterType === 'all'}
            onClick={() => setFilterType('all')}
          />
          <FilterButton
            label="Analysis"
            count={stats.analysis}
            active={filterType === 'analysis'}
            onClick={() => setFilterType('analysis')}
          />
          <FilterButton
            label="Risk"
            count={stats.risk}
            active={filterType === 'risk'}
            onClick={() => setFilterType('risk')}
          />
          <FilterButton
            label="Decision"
            count={stats.decision}
            active={filterType === 'decision'}
            onClick={() => setFilterType('decision')}
          />
        </div>
      </div>

      {/* Comments Timeline */}
      {filteredComments.length === 0 ? (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            padding: '48px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <MessageCircle size={48} style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--muted-foreground)',
              margin: 0,
            }}
          >
            {filterType === 'all' ? 'No comments yet' : `No ${filterType} comments`}
          </p>
          <button
            onClick={() => setAddModalOpen(true)}
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
              marginTop: '8px',
            }}
          >
            <Plus size={16} />
            Add First Comment
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredComments.map(comment => {
            const replies = getReplies(comments, comment.id);
            return (
              <CommentThread
                key={comment.id}
                comment={comment}
                replies={replies}
                onReply={() => {
                  setReplyTo(comment);
                  setAddModalOpen(true);
                }}
                onDelete={handleDelete}
              />
            );
          })}
        </div>
      )}

      {/* Add/Reply Modal */}
      {addModalOpen && (
        <CommentFormModal
          regulationId={regulation.id}
          parentCommentId={replyTo?.id || null}
          onClose={() => {
            setAddModalOpen(false);
            setReplyTo(null);
          }}
          onSubmit={handleAddComment}
        />
      )}
    </div>
  );
}

// ─── Filter Button ────────────────────────────────────────────────────────────

function FilterButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px',
        border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: '100px',
        background: active ? 'var(--primary)' : 'var(--card)',
        color: active ? 'var(--primary-foreground)' : 'var(--foreground)',
        fontFamily: 'var(--font-family-primary)',
        fontSize: '12px',
        fontWeight: 'var(--font-weight-semibold)',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label} ({count})
    </button>
  );
}

// ─── Comment Thread ───────────────────────────────────────────────────────────

function CommentThread({
  comment,
  replies,
  onReply,
  onDelete,
}: {
  comment: RegulationComment;
  replies: RegulationComment[];
  onReply: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '16px',
      }}
    >
      <CommentCard comment={comment} onReply={onReply} onDelete={onDelete} />

      {replies.length > 0 && (
        <div
          style={{
            marginTop: '12px',
            marginLeft: '32px',
            paddingLeft: '16px',
            borderLeft: '2px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {replies.map(reply => (
            <CommentCard key={reply.id} comment={reply} onReply={onReply} onDelete={onDelete} isReply />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Comment Card ─────────────────────────────────────────────────────────────

function CommentCard({
  comment,
  onReply,
  onDelete,
  isReply = false,
}: {
  comment: RegulationComment;
  onReply: () => void;
  onDelete: (id: string) => void;
  isReply?: boolean;
}) {
  const typeStyle = COMMENT_TYPE_STYLES[comment.commentType];
  const typeIcon = getCommentTypeIcon(comment.commentType);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Avatar */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-bold)',
            flexShrink: 0,
          }}
        >
          {comment.createdBy.substring(0, 2).toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
              }}
            >
              {comment.createdBy}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '100px',
                fontSize: '11px',
                fontFamily: 'var(--font-family-primary)',
                fontWeight: 'var(--font-weight-semibold)',
                background: typeStyle.background,
                color: typeStyle.color,
              }}
            >
              {typeIcon}
              {COMMENT_TYPE_LABELS[comment.commentType]}
            </span>
            {comment.isInternal && (
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-family-primary)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--muted-foreground)',
                  padding: '2px 8px',
                  background: 'var(--muted)',
                  borderRadius: '100px',
                }}
              >
                INTERNAL
              </span>
            )}
            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                color: 'var(--muted-foreground)',
              }}
            >
              {new Date(comment.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          {/* Content */}
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--foreground)',
              margin: '0 0 12px 0',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}
          >
            {comment.content}
          </p>

          {/* Actions */}
          {!isReply && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onReply}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--muted-foreground)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-semibold)',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                Reply
              </button>
              <button
                onClick={() => onDelete(comment.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--destructive)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-semibold)',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getCommentTypeIcon(type: CommentType): React.ReactNode {
  const iconMap: Record<CommentType, React.ReactNode> = {
    note: <MessageCircle size={12} />,
    analysis: <FileText size={12} />,
    decision: <CheckCircle size={12} />,
    update: <Edit size={12} />,
    risk: <AlertCircle size={12} />,
    question: <HelpCircle size={12} />,
  };
  return iconMap[type];
}
