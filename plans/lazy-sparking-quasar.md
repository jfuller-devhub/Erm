# Plan: Department Register

## Context
The app currently has no internal organizational data model — department names only exist as plain strings on `AppUser.department`. The Department Register adds a first-class entity for tracking the company's org structure (Divisions, Departments, Teams, Units), including parent-child reporting relationships with effective dates and a designated leader per unit.

---

## Data Layer — `src/app/data/departmentData.ts` (new file)

### Interface
```ts
export type DeptType   = 'Division' | 'Department' | 'Team' | 'Unit';
export type DeptStatus = 'Active' | 'Inactive';

export interface Department {
  id: string;               // 'DEPT-001'
  name: string;
  code: string;             // short code, e.g. 'HR', 'FIN'
  type: DeptType;
  description: string;
  status: DeptStatus;
  leadId: string;           // AppUser.id — '' if unassigned
  parentId: string;         // '' = top-level root; else → another Department.id
  reportingStartDate: string; // YYYY-MM-DD; '' if no parent
  reportingEndDate: string;   // YYYY-MM-DD; '' = still active
  createdDate: string;
  updatedDate: string;
}
```

### Storage & helpers
- Key: `'erm_departments_v1'`
- `sanitizeDepartment(d: any): Department` — safe defaults for all fields
- `loadDepartments(): Department[]` — localStorage with seed fallback (sanitize seed on first load)
- `saveDepartments(items: Department[]): void`
- `createDepartment(data: Omit<Department, 'id' | 'createdDate' | 'updatedDate'>): Department` — id: `'DEPT-' + generateId()`
- `updateDepartment(existing: Department, changes: Partial<Department>): Department` — stamps `updatedDate`

### Tree helpers (follow `frameworkRequirementData.ts` pattern)
- `getDeptRoots(items)` — returns items where `parentId === ''`
- `getDeptChildren(items, parentId)` — returns direct children
- `getDeptAncestors(items, id)` — returns chain of parents up to root (for breadcrumb + cycle prevention)
- `getDeptDescendants(items, id)` — returns all descendant ids (to exclude from parent picker)

### Seed data (8 records, 3 levels)
| ID | Name | Type | Parent |
|---|---|---|---|
| DEPT-001 | Benefits & Retirement | Division | — |
| DEPT-002 | Technology | Division | — |
| DEPT-003 | Retirement Services | Department | DEPT-001 |
| DEPT-004 | Health & Welfare | Department | DEPT-001 |
| DEPT-005 | Member Services | Department | DEPT-001 |
| DEPT-006 | Application Development | Department | DEPT-002 |
| DEPT-007 | DC Plans Team | Team | DEPT-003 |
| DEPT-008 | Claims & Adjudication Team | Team | DEPT-005 |

Use `MOCK_USERS[0]` through `MOCK_USERS[3]` as lead assignments; seed reporting dates starting 2023-01-01; endDate `''` (all active).

---

## Form Modal — `src/app/components/departments/DepartmentFormModal.tsx` (new file)

Uses `FormModal`, `Field`, `TextInput`, `TextareaInput`, `SelectInput` from `shared/FormModal.tsx` and `UserPickerInput` from `shared/UserPicker.tsx`.

**Fields:**
1. **Name** — `TextInput`, required
2. **Code** — `TextInput`, required; auto-populated from name initials on create (e.g. "Retirement Services" → "RS"), user-editable
3. **Type** — `SelectInput`: Division / Department / Team / Unit
4. **Status** — `SelectInput`: Active / Inactive
5. **Description** — `TextareaInput`
6. **Lead** — `UserPickerInput` (single), label "Department Lead"
7. **Reports To (Parent)** — `SelectInput` listing all other departments by name; excludes self and all descendants (use `getDeptDescendants`); shows "— None (Top Level) —" as first option
8. **Reporting Start Date** — `TextInput type="date"`, shown only when a parent is selected
9. **Reporting End Date** — `TextInput type="date"`, shown only when a parent is selected; optional

Props: `isOpen`, `onClose`, `onSave(dept: Department)`, `editingDept?: Department`, `allDepartments: Department[]`

---

## List Page — `src/app/pages/DepartmentList.tsx` (new file)

### Layout
1. **Page header** — "Department Register" title + subtitle + "New Department" button (right)
2. **KPI tiles** (`KPITile`) in `repeat(auto-fill, minmax(160px, 1fr))` grid:
   - Total Units, Active, Divisions, Departments & Teams
3. **Search/filter bar** — text search (name/code), status filter (All / Active / Inactive), type filter (All / Division / Department / Team / Unit)
4. **View** — **tree view** as the primary display; flat mode when any filter/search is active

### Tree view (no search active)
Render roots, then recursively indent children. Each row in the tree:
- Indent level (16px per level) + expand/collapse chevron if has children
- Type badge (color-coded: Division=primary, Department=teal, Team=green, Unit=muted)
- Name (clickable → detail page)
- Code chip (muted)
- Lead UserChip
- Status badge
- Edit icon button

### Flat / search mode
Use `RecordGrid` from `shared/RecordGrid.tsx` with columns: Name, Code, Type, Parent, Lead, Status. All rows visible, sorted by type then name.

---

## Detail Page — `src/app/pages/DepartmentDetail.tsx` (new file)

### Header card
- Back button → `/departments`
- Left: large `Building2` icon box + name `<h1>` + type badge + status badge + code chip + `DEPT-xxx` id
- Right: Edit button → DepartmentFormModal, Delete button → confirm dialog
- Metadata strip below border-top: Lead (UserChip), Parent (linked chip or "Top Level"), Created, Updated

### Tabs: Overview | Structure

**Overview tab**
- Description block (full text)
- Metadata grid (`repeat(auto-fit, minmax(200px, 1fr))`): Type, Code, Status, Lead name, Created date, Updated date
- Reporting relationship card (if parent exists): "Reports to [Parent Name]" with start/end dates

**Structure tab**
- **Parent section**: if `parentId` is set, show a card for the parent department (name, type badge, lead, link to its detail page). If top-level, show an "Organization root — no parent" empty state.
- **Direct Reports section**: list of child departments (name, type badge, lead, status badge, link to detail). If none, show EmptyState with prompt to add sub-units via the New Department modal.

---

## Routing — `src/app/routes.ts` (modified)

Add imports:
```ts
import { DepartmentList }   from './pages/DepartmentList';
import { DepartmentDetail } from './pages/DepartmentDetail';
```

Add to children array:
```ts
{ path: 'departments',     Component: DepartmentList   },
{ path: 'departments/:id', Component: DepartmentDetail },
```

---

## Navigation — `src/app/components/layout/AppShell.tsx` (modified)

Add `GitBranch` (or `Building2`) to lucide imports.

Add a new nav group **between "Operations" and "Risk & Controls"**:
```ts
{
  groupLabel: 'Organization',
  items: [
    { path: '/departments', label: 'Department Register', icon: Building2 },
  ],
},
```

Add breadcrumb case in `getBreadcrumbs()`:
```ts
} else if (pathname.startsWith('/departments')) {
  crumbs.push({ label: 'Department Register', path: '/departments' });
  if (pathname !== '/departments') crumbs.push({ label: 'Department Detail', path: pathname });
}
```

---

## Verification

1. Navigate to `/departments` — confirm tree view renders with seeded 8-record hierarchy.
2. Click a Division row — expand/collapse its children.
3. Search by name — confirm flat RecordGrid view activates.
4. Click "New Department" — form modal opens; select a parent → reporting date fields appear; save → record appears in tree.
5. Click a department row → detail page loads with correct header and both tabs.
6. **Overview tab**: description and metadata display correctly.
7. **Structure tab**: parent card links to parent detail; direct reports list shows child records.
8. Edit a department — change parent → tree re-renders with new position.
9. Delete a department — redirects to list; children remain (orphaned, displayed as roots).
