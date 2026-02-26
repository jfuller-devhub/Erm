import { FormModal, Field, TextInput, TextareaInput, SelectInput } from '../shared/FormModal';
import { UserPickerInput } from '../shared/UserPicker';
import { useApp } from '../../context/AppContext';
import type { AppUser } from '../../data/mockData';
import type {
  Risk, RiskStatus, RiskType, AppetiteLevel, ReviewFrequency, RiskCategory,
} from '../../data/riskData';
import {
  RISK_STATUS_LABELS, RISK_TYPE_LABELS, APPETITE_LEVEL_LABELS, REVIEW_FREQUENCY_LABELS,
} from '../../data/riskData';

interface RiskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Risk, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => void;
  initialData?: Risk | null;
  categories: RiskCategory[];
  departments: string[];
  /** All existing risks — used to populate the "Link to Enterprise Risk" picker */
  allRisks?: Risk[];
}

type FormErrors = Partial<Record<string, string>>;

const EMPTY: Omit<Risk, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'> = {
  categoryId: '',
  department: '',
  owner: null,
  title: '',
  description: '',
  status: 'draft',
  riskType: 'operational',
  appetiteLevel: 'cautious',
  reviewFrequency: 'quarterly',
  nextReviewDate: '',
  isEnterpriseRisk: false,
  enterpriseRiskId: null,
};

export function RiskFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  categories,
  departments,
  allRisks = [],
}: RiskFormModalProps) {
  const { getActiveOptions } = useApp();
  const riskStatuses     = getActiveOptions('Risk', 'Status');
  const riskTypes        = getActiveOptions('Risk', 'Type');
  const appetiteLevels   = getActiveOptions('Risk', 'Appetite Level');
  const reviewFreqs      = getActiveOptions('Risk', 'Review Frequency');
  const deptOptions      = getActiveOptions('Risk', 'Department');

  const [form, setForm] = useState({ ...EMPTY });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          categoryId: initialData.categoryId,
          department: initialData.department,
          owner: initialData.owner,
          title: initialData.title,
          description: initialData.description,
          status: initialData.status,
          riskType: initialData.riskType,
          appetiteLevel: initialData.appetiteLevel,
          reviewFrequency: initialData.reviewFrequency,
          nextReviewDate: initialData.nextReviewDate,
          isEnterpriseRisk: initialData.isEnterpriseRisk ?? false,
          enterpriseRiskId: initialData.enterpriseRiskId ?? null,
        });
      } else {
        setForm({ ...EMPTY });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!form.categoryId) errs.categoryId = 'Risk category is required.';
    if (!form.department) errs.department = 'Department is required.';
    if (!form.status) errs.status = 'Status is required.';
    if (!form.riskType) errs.riskType = 'Risk type is required.';
    if (!form.appetiteLevel) errs.appetiteLevel = 'Appetite level is required.';
    if (!form.reviewFrequency) errs.reviewFrequency = 'Review frequency is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    // If marked enterprise, clear any enterprise link
    const payload = {
      ...form,
      enterpriseRiskId: form.isEnterpriseRisk ? null : form.enterpriseRiskId,
    };
    onSave(payload);
    onClose();
  }

  // Build sorted categories for the dropdown — parent first, children indented
  const sortedCategories = buildSortedCategoryList(categories);

  // Enterprise risks available to link to (excluding current risk and other enterprise risks)
  const linkableEnterpriseRisks = allRisks.filter(
    r => r.isEnterpriseRisk && r.id !== initialData?.id
  );

  return (
    <FormModal
      title={initialData ? 'Edit Risk' : 'Add Risk'}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={initialData ? 'Save Changes' : 'Add Risk'}
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Title */}
        <Field label="Title" required error={errors.title}>
          <TextInput
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Enter risk title"
            hasError={!!errors.title}
          />
        </Field>

        {/* Description */}
        <Field label="Description" helpText="Describe the risk scenario, impact, and context.">
          <TextareaInput
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Enter a detailed description of the risk..."
          />
        </Field>

        {/* Row: Category + Department */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Risk Category" required error={errors.categoryId}>
            <SelectInput
              value={form.categoryId}
              onChange={e => set('categoryId', e.target.value)}
              hasError={!!errors.categoryId}
            >
              <option value="">Select category...</option>
              {sortedCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.parentCategoryId ? `  └ ${cat.name}` : cat.name} ({cat.code})
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label="Department" required error={errors.department}>
            <SelectInput
              value={form.department}
              onChange={e => set('department', e.target.value)}
              hasError={!!errors.department}
            >
              <option value="">Select department...</option>
              {deptOptions.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </SelectInput>
          </Field>
        </div>

        {/* Owner */}
        <Field label="Owner" helpText="Person accountable for managing this risk.">
          <UserPickerInput
            value={form.owner}
            onChange={u => set('owner', u)}
            placeholder="Select risk owner..."
          />
        </Field>

        {/* Row: Status + Risk Type */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Status" required error={errors.status}>
            <SelectInput
              value={form.status}
              onChange={e => set('status', e.target.value as RiskStatus)}
              hasError={!!errors.status}
            >
              {riskStatuses.map(s => (
                <option key={s} value={s}>{RISK_STATUS_LABELS[s as RiskStatus] ?? s}</option>
              ))}
            </SelectInput>
          </Field>

          <Field label="Risk Type" required error={errors.riskType}>
            <SelectInput
              value={form.riskType}
              onChange={e => set('riskType', e.target.value as RiskType)}
              hasError={!!errors.riskType}
            >
              {riskTypes.map(t => (
                <option key={t} value={t}>{RISK_TYPE_LABELS[t as RiskType] ?? t}</option>
              ))}
            </SelectInput>
          </Field>
        </div>

        {/* Row: Appetite + Frequency */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Appetite Level" required error={errors.appetiteLevel}>
            <SelectInput
              value={form.appetiteLevel}
              onChange={e => set('appetiteLevel', e.target.value as AppetiteLevel)}
              hasError={!!errors.appetiteLevel}
            >
              {appetiteLevels.map(a => (
                <option key={a} value={a}>{APPETITE_LEVEL_LABELS[a as AppetiteLevel] ?? a}</option>
              ))}
            </SelectInput>
          </Field>

          <Field label="Review Frequency" required error={errors.reviewFrequency}>
            <SelectInput
              value={form.reviewFrequency}
              onChange={e => set('reviewFrequency', e.target.value as ReviewFrequency)}
              hasError={!!errors.reviewFrequency}
            >
              {reviewFreqs.map(f => (
                <option key={f} value={f}>{REVIEW_FREQUENCY_LABELS[f as ReviewFrequency] ?? f}</option>
              ))}
            </SelectInput>
          </Field>
        </div>

        {/* Next Review Date */}
        <Field label="Next Review Date" helpText="When this risk should next be reviewed.">
          <TextInput
            type="date"
            value={form.nextReviewDate}
            onChange={e => set('nextReviewDate', e.target.value)}
          />
        </Field>

        {/* ── Enterprise Risk Section ─────────────────────────────────────── */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Enterprise Risk toggle */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={form.isEnterpriseRisk}
              onChange={e => {
                set('isEnterpriseRisk', e.target.checked);
                if (e.target.checked) set('enterpriseRiskId', null);
              }}
              style={{
                marginTop: '2px',
                width: '16px',
                height: '16px',
                accentColor: 'var(--primary)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            />
            <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--foreground)',
                  lineHeight: '20px',
                }}
              >
                Enterprise Risk
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--muted-foreground)',
                  lineHeight: '18px',
                }}
              >
                Mark this as an enterprise-level risk. Other risks can be linked to it.
              </span>
            </span>
          </label>

          {/* Link to Enterprise Risk — only shown for non-enterprise risks */}
          {!form.isEnterpriseRisk && (
            <Field
              label="Link to Enterprise Risk"
              helpText="Optionally associate this risk with an enterprise risk."
            >
              <SelectInput
                value={form.enterpriseRiskId ?? ''}
                onChange={e =>
                  set('enterpriseRiskId', e.target.value || null)
                }
              >
                <option value="">None</option>
                {linkableEnterpriseRisks.map(er => (
                  <option key={er.id} value={er.id}>
                    {er.id} — {er.title}
                  </option>
                ))}
              </SelectInput>
            </Field>
          )}
        </div>
      </div>
    </FormModal>
  );
}

// ─── Helper: sort categories for display (parent → children) ──────────────────

function buildSortedCategoryList(categories: RiskCategory[]): RiskCategory[] {
  const parents = categories
    .filter(c => !c.parentCategoryId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const result: RiskCategory[] = [];
  for (const parent of parents) {
    result.push(parent);
    const children = categories
      .filter(c => c.parentCategoryId === parent.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    result.push(...children);
  }
  return result;
}