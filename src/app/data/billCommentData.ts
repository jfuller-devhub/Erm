// ─── Types ───────────────────────────────────────────────────────────────────

export type CommentType = 'note' | 'analysis' | 'decision' | 'update' | 'risk' | 'question';

export interface BillComment {
  id: string;                        // e.g., "BILL-CMT-001"
  billId: string;                    // Parent bill
  
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

const STORAGE_KEY = 'erm_bill_comments_v1';

// ─── CRUD Functions ──────────────────────────────────────────────────────────

export function loadBillComments(): BillComment[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const seed = getSeedComments();
    saveBillComments(seed);
    return seed;
  }
  return JSON.parse(stored);
}

export function saveBillComments(comments: BillComment[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
}

export function getCommentById(
  comments: BillComment[],
  id: string
): BillComment | undefined {
  return comments.find(c => c.id === id);
}

export function createComment(
  comments: BillComment[],
  data: Omit<BillComment, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): BillComment {
  const nextNum = comments.length + 1;
  const id = `BILL-CMT-${String(nextNum).padStart(3, '0')}`;
  const today = new Date().toISOString().split('T')[0];

  const newComment: BillComment = {
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
  comments: BillComment[],
  id: string,
  updates: Partial<Omit<BillComment, 'id' | 'createdAt' | 'createdBy'>>
): BillComment[] {
  const today = new Date().toISOString().split('T')[0];
  return comments.map(c =>
    c.id === id ? { ...c, ...updates, updatedAt: today, updatedBy: 'Emily Carter' } : c
  );
}

export function deleteComment(comments: BillComment[], id: string): BillComment[] {
  // Also delete all replies to this comment
  return comments.filter(c => c.id !== id && c.parentCommentId !== id);
}

// ─── Helper Functions ────────────────────────────────────────────────────────

export function getCommentsForBill(
  comments: BillComment[],
  billId: string
): BillComment[] {
  return comments.filter(c => c.billId === billId);
}

export function getTopLevelComments(
  comments: BillComment[],
  billId: string
): BillComment[] {
  return comments.filter(c => c.billId === billId && !c.parentCommentId);
}

export function getReplies(
  comments: BillComment[],
  parentCommentId: string
): BillComment[] {
  return comments.filter(c => c.parentCommentId === parentCommentId);
}

export function getCommentThread(
  comments: BillComment[],
  commentId: string
): BillComment[] {
  const thread: BillComment[] = [];
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

function getSeedComments(): BillComment[] {
  const today = new Date();
  const formatDate = (daysOffset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'BILL-CMT-001',
      billId: 'BILL-001',
      commentType: 'analysis',
      content:
        'Completed initial review of AB-123. The proposed data privacy requirements align well with our current GDPR compliance framework. Recommend supporting this bill as it would create consistency across jurisdictions and reduce dual compliance burden.',
      parentCommentId: null,
      mentions: [],
      isInternal: true,
      attachmentIds: [],
      createdAt: formatDate(-45),
      createdBy: 'Sarah Johnson',
      updatedAt: formatDate(-45),
      updatedBy: 'Sarah Johnson',
    },
    {
      id: 'BILL-CMT-002',
      billId: 'BILL-001',
      commentType: 'decision',
      content:
        'Legal team recommends we submit written testimony in support during the committee hearing on Apr 18. @Rachel Green to draft position letter by Apr 10.',
      parentCommentId: null,
      mentions: ['rachel-green'],
      isInternal: true,
      attachmentIds: [],
      createdAt: formatDate(-30),
      createdBy: 'Emily Carter',
      updatedAt: formatDate(-30),
      updatedBy: 'Emily Carter',
    },
    {
      id: 'BILL-CMT-003',
      billId: 'BILL-001',
      commentType: 'note',
      content: 'Position letter drafted and submitted to committee. Awaiting response from committee staff.',
      parentCommentId: 'BILL-CMT-002',
      mentions: [],
      isInternal: true,
      attachmentIds: [],
      createdAt: formatDate(-20),
      createdBy: 'Rachel Green',
      updatedAt: formatDate(-20),
      updatedBy: 'Rachel Green',
    },
    {
      id: 'BILL-CMT-004',
      billId: 'BILL-002',
      commentType: 'risk',
      content:
        'Significant concern: Section 4.2 of SB-456 would require real-time breach notification within 4 hours. Our current incident response procedures require 24-48 hours for proper investigation and containment. This may force premature disclosure before we fully understand the scope.',
      parentCommentId: null,
      mentions: [],
      isInternal: true,
      attachmentIds: [],
      createdAt: formatDate(-60),
      createdBy: 'Chris Martinez',
      updatedAt: formatDate(-60),
      updatedBy: 'Chris Martinez',
    },
    {
      id: 'BILL-CMT-005',
      billId: 'BILL-002',
      commentType: 'decision',
      content:
        'Decision: We will oppose SB-456 in its current form. @Emily Carter to coordinate with industry coalition to propose amendment extending notification window to 72 hours with proper justification.',
      parentCommentId: 'BILL-CMT-004',
      mentions: ['emily-carter'],
      isInternal: true,
      attachmentIds: [],
      createdAt: formatDate(-55),
      createdBy: 'Rachel Green',
      updatedAt: formatDate(-55),
      updatedBy: 'Rachel Green',
    },
    {
      id: 'BILL-CMT-006',
      billId: 'BILL-003',
      commentType: 'update',
      content:
        'Floor vote scheduled for March 15. Latest whip count shows 28 yes, 18 no, 9 undecided. Bill appears likely to pass but may require further amendments in conference committee.',
      parentCommentId: null,
      mentions: [],
      isInternal: false,
      attachmentIds: [],
      createdAt: formatDate(-10),
      createdBy: 'Sarah Johnson',
      updatedAt: formatDate(-10),
      updatedBy: 'Sarah Johnson',
    },
    {
      id: 'BILL-CMT-007',
      billId: 'BILL-004',
      commentType: 'question',
      content:
        'Does the consumer opt-out provision in HB-789 apply to B2B marketing activities, or only B2C? The language in Section 3(a) is ambiguous. Need external legal opinion before determining our position.',
      parentCommentId: null,
      mentions: [],
      isInternal: true,
      attachmentIds: [],
      createdAt: formatDate(-25),
      createdBy: 'Emily Carter',
      updatedAt: formatDate(-25),
      updatedBy: 'Emily Carter',
    },
  ];
}