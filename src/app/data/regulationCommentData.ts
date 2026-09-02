// ─── Types ───────────────────────────────────────────────────────────────────

export type CommentType = 'note' | 'analysis' | 'decision' | 'update' | 'risk' | 'question';

export interface RegulationComment {
  id: string;                        // e.g., "CMT-001"
  regulationId: string;              // Parent regulation
  
  // Content
  commentType: CommentType;
  content: string;                   // Rich text content
  
  // Threading
  parentCommentId: string | null;    // For replies
  
  // Mentions
  mentions: string[];                // User IDs mentioned with @
  
  // Metadata
  isInternal: boolean;               // Internal vs external facing
  attachmentIds: string[];           // Reference to documents
  
  // Audit
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// ─── Labels & Styles ─────────────────────────────────────────────────────────

export const COMMENT_TYPE_LABELS: Record<CommentType, string> = {
  note: 'Note',
  analysis: 'Analysis',
  decision: 'Decision',
  update: 'Update',
  risk: 'Risk',
  question: 'Question',
};

export const COMMENT_TYPE_STYLES: Record<CommentType, { background: string; color: string }> = {
  note: { background: '#E3F2FD', color: '#1565C0' },
  analysis: { background: '#F3E5F5', color: '#6A1B9A' },
  decision: { background: '#E8F5E9', color: '#2E7D32' },
  update: { background: '#FFF9C4', color: '#F57F17' },
  risk: { background: '#FFEBEE', color: '#C62828' },
  question: { background: '#FFF3E0', color: '#E65100' },
};

// ─── Storage Key ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'erm_regulation_comments_v1';

// ─── CRUD Functions ──────────────────────────────────────────────────────────

export function loadRegulationComments(): RegulationComment[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const seed = getSeedComments();
    saveRegulationComments(seed);
    return seed;
  }
  return JSON.parse(stored);
}

export function saveRegulationComments(comments: RegulationComment[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
}

export function getCommentById(
  comments: RegulationComment[],
  id: string
): RegulationComment | undefined {
  return comments.find(c => c.id === id);
}

export function createComment(
  comments: RegulationComment[],
  data: Omit<RegulationComment, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): RegulationComment {
  const nextNum = comments.length + 1;
  const id = `CMT-${String(nextNum).padStart(3, '0')}`;
  const today = new Date().toISOString().split('T')[0];

  const newComment: RegulationComment = {
    ...data,
    id,
    createdAt: today,
    createdBy: 'Emily Carter',
    updatedAt: today,
    updatedBy: 'Emily Carter',
  };

  return newComment;
}

export function updateComment(
  comments: RegulationComment[],
  id: string,
  updates: Partial<Omit<RegulationComment, 'id' | 'createdAt' | 'createdBy'>>
): RegulationComment[] {
  const today = new Date().toISOString().split('T')[0];
  return comments.map(c =>
    c.id === id ? { ...c, ...updates, updatedAt: today, updatedBy: 'Emily Carter' } : c
  );
}

export function deleteComment(comments: RegulationComment[], id: string): RegulationComment[] {
  // Also delete all replies to this comment
  return comments.filter(c => c.id !== id && c.parentCommentId !== id);
}

// ─── Helper Functions ────────────────────────────────────────────────────────

export function getCommentsForRegulation(
  comments: RegulationComment[],
  regulationId: string
): RegulationComment[] {
  return comments.filter(c => c.regulationId === regulationId);
}

export function getTopLevelComments(
  comments: RegulationComment[],
  regulationId: string
): RegulationComment[] {
  return comments.filter(c => c.regulationId === regulationId && !c.parentCommentId);
}

export function getReplies(
  comments: RegulationComment[],
  parentCommentId: string
): RegulationComment[] {
  return comments.filter(c => c.parentCommentId === parentCommentId);
}

export function getCommentThread(
  comments: RegulationComment[],
  commentId: string
): RegulationComment[] {
  const thread: RegulationComment[] = [];
  const rootComment = getCommentById(comments, commentId);
  if (!rootComment) return thread;

  thread.push(rootComment);

  // Walk up to find root
  let current = rootComment;
  while (current.parentCommentId) {
    const parent = getCommentById(comments, current.parentCommentId);
    if (!parent) break;
    thread.unshift(parent);
    current = parent;
  }

  return thread;
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

function getSeedComments(): RegulationComment[] {
  const today = new Date();
  const formatDate = (daysOffset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'CMT-001',
      regulationId: 'REG-001',
      commentType: 'analysis',
      content:
        'Completed gap analysis of current data processing activities against GDPR requirements. Key findings: 1) Need to update privacy notices for 15 web forms, 2) Implement data retention schedules for marketing database, 3) Establish formal DPA review process.',
      parentCommentId: null,
      mentions: [],
      isInternal: true,
      attachmentIds: [],
      createdAt: formatDate(-120),
      createdBy: 'Sarah Johnson',
      updatedAt: formatDate(-120),
      updatedBy: 'Sarah Johnson',
    },
    {
      id: 'CMT-002',
      regulationId: 'REG-001',
      commentType: 'decision',
      content:
        'Legal team approved updated Data Processing Agreement template. All vendors with access to personal data must sign by end of Q2. @Chris Martinez to coordinate vendor outreach.',
      parentCommentId: null,
      mentions: ['chris-martinez'],
      isInternal: true,
      attachmentIds: [],
      createdAt: formatDate(-90),
      createdBy: 'Rachel Green',
      updatedAt: formatDate(-90),
      updatedBy: 'Rachel Green',
    },
    {
      id: 'CMT-003',
      regulationId: 'REG-001',
      commentType: 'note',
      content: 'Coordinating with IT to implement automated data retention policies. Target completion: 2 weeks.',
      parentCommentId: 'CMT-001',
      mentions: [],
      isInternal: true,
      attachmentIds: [],
      createdAt: formatDate(-115),
      createdBy: 'Chris Martinez',
      updatedAt: formatDate(-115),
      updatedBy: 'Chris Martinez',
    },
    {
      id: 'CMT-004',
      regulationId: 'REG-003',
      commentType: 'update',
      content:
        'California Privacy Protection Agency published new enforcement guidance on CCPA right to delete requests. Key change: 45-day response window now strictly enforced with penalties for delays.',
      parentCommentId: null,
      mentions: [],
      isInternal: false,
      attachmentIds: [],
      createdAt: formatDate(-60),
      createdBy: 'Sarah Johnson',
      updatedAt: formatDate(-60),
      updatedBy: 'Sarah Johnson',
    },
    {
      id: 'CMT-005',
      regulationId: 'REG-003',
      commentType: 'risk',
      content:
        'Identified potential compliance gap: current delete request workflow averages 52 days. Risk of enforcement action if not remediated. @Rachel Green prioritizing automation initiative.',
      parentCommentId: 'CMT-004',
      mentions: ['rachel-green'],
      isInternal: true,
      attachmentIds: [],
      createdAt: formatDate(-55),
      createdBy: 'Emily Carter',
      updatedAt: formatDate(-55),
      updatedBy: 'Emily Carter',
    },
    {
      id: 'CMT-006',
      regulationId: 'REG-005',
      commentType: 'question',
      content:
        'Does the proposed EU AI Act high-risk classification apply to our credit scoring models? Need external legal opinion before finalizing compliance roadmap.',
      parentCommentId: null,
      mentions: [],
      isInternal: true,
      attachmentIds: [],
      createdAt: formatDate(-30),
      createdBy: 'Chris Martinez',
      updatedAt: formatDate(-30),
      updatedBy: 'Chris Martinez',
    },
  ];
}
