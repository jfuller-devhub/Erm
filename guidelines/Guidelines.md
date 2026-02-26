Appian Low-Code Design Guidelines for Figma Make
================================================

GENERAL GUIDELINES
------------------
- Use only layout components that map directly to Appian SAIL (Self-Assembling Interface Layer); no free-form or absolute positioning.
- Never nest columns or cards more than 3 levels deep; keep layouts flat and two-level where possible.
- All spacing values must be multiples of 4px, using 8px as the base grid unit.
- All designs must be responsive; design for these breakpoints:
  - 375px (mobile)
  - 768px (tablet)
  - 1280px (desktop)
- Never introduce custom typefaces; use Source Sans Pro or the tenant-configured system font only.
- Do not rely on custom CSS; all styling must be achievable through Appian’s styling API and component properties.
- Always design and deliver all interactive states:
  - Default, Hover, Focus, Active, Disabled, Loading, Empty, Error
- Name all Figma layers using the Appian component name + purpose:
  - Example: gridField/EmployeeList
  - Avoid generic names like "Frame 47"
- Prioritize density, scannability, and task completion over decorative/visual complexity.
- Mark required form fields with a red asterisk (*) placed after the label text.


DESIGN SYSTEM GUIDELINES
------------------------
- Base font size: 14px (Body / MD).
- Date format: "Jun 10, 2024" (never numeric-only like 06/10/24).
- Primary action button placement:
  - Right-aligned at the bottom of a form/task interface.
- Never place more than one primary button per section.
- Destructive actions (Delete, Reject, Terminate):
  - Must use the Danger button variant; never styled as primary.
- Form labels:
  - Always above the input; never inline or to the left.
- Map all field widths to Appian width options:
  - NARROW, MEDIUM, WIDE, FULL
  - Avoid pixel-exact widths.
- Empty states must include:
  - Icon (48px)
  - Heading/SM title
  - Body/MD description
  - Optional CTA button
- KPI tiles in Record Views:
  - Maximum of 5 metrics.
- Record grid pagination:
  - Always include pagination when more than 10 rows are present.


COLOR TOKENS
------------
- Map all Figma color styles to Appian CSS custom property tokens using:
  - color/[group]/[scale]
- Primary brand colors:
  - Use the --color-primary-* token scale (100–900).
- Semantic colors:
  - Use dedicated tokens: --color-success, --color-warning, --color-danger, --color-accent.
- Neutral/gray colors:
  - Use the --color-neutral-* token scale (100–900).
- Never use raw hex values in designs; always reference a named token.
- Accessibility:
  - All text must meet WCAG 2.1 AA contrast ratio of at least 4.5:1.

TOKEN / HEX / USAGE
-------------------
- --color-primary-900  #002855  Page headers, nav backgrounds
- --color-primary-500  #0066CC  Interactive elements, links, active states
- --color-primary-300  #4DA6FF  Highlights, selected states
- --color-success      #1C8A45  Approve actions, success badges
- --color-warning      #E07B00  Warnings, overdue indicators
- --color-danger       #C0392B  Destructive actions, validation errors
- --color-accent       #00A3A3  Secondary highlights, accent tags
- --color-neutral-900  #1A1F2E  Body text
- --color-neutral-500  #6B7489  Help text, metadata, placeholders
- --color-neutral-100  #F0F2F7  Page backgrounds, table row backgrounds


TYPOGRAPHY
----------
- Default font: Source Sans Pro (do not introduce external typefaces).
- Minimum size: 12px (Body / SM); never use smaller than 12px.
- Weights:
  - 600 for labels, headings, column headers
  - 400 for body text and helper text

TYPE TOKENS
-----------
- Heading / XL: 28px, weight 600, line height 36px — Page titles, report headers
- Heading / LG: 22px, weight 600, line height 30px — Section headers, card titles
- Heading / MD: 18px, weight 600, line height 26px — Sub-sections, dialog headings
- Heading / SM: 14px, weight 600, line height 20px — Field group labels, panel titles
- Body / LG:    16px, weight 400, line height 24px — Primary body, record fields
- Body / MD:    14px, weight 400, line height 22px — Default interface text
- Body / SM:    12px, weight 400, line height 18px — Help text, metadata
- Label / MD:   14px, weight 600, line height 20px — Form field labels
- Label / SM:   12px, weight 600, line height 16px — Table column headers


SPACING
-------
- All spacing must use tokens from the 8px base grid scale.
- Reference tokens by name during handoff.

SPACING TOKENS
--------------
- space/1:  4px   — Icon-to-label gap, badge padding
- space/2:  8px   — Inline elements, chip padding
- space/3:  12px  — Small component internal padding
- space/4:  16px  — Card padding, form field spacing
- space/6:  24px  — Section padding, card gap
- space/8:  32px  — Page section gap, dialog padding
- space/12: 48px  — Major section breaks
- space/16: 64px  — Page-level padding (desktop)


COMPONENTS
----------
BUTTON
- Description:
  - Triggers actions in task forms, dialogs, and record views.
  - Must always have a clear, action-oriented label.
- Usage:
  - Use for explicit user actions (submissions, approvals, confirmations).
  - Never use a button solely for navigation; use a link or record link instead.

Variants:
1) Primary Button
   - Purpose: Single most important action on a page/section
   - Visual: Filled --color-primary-500, white text, 4px radius
   - Usage: Max one primary per section; right-aligned at bottom of forms
   - Appian: a.buttonWidget (style: OUTLINE)

2) Secondary Button
   - Purpose: Supporting/alternative actions alongside primary
   - Visual: Outline --color-primary-500, transparent background
   - Usage: Save Draft, Cancel, Back
   - Appian: a.buttonWidget (COLOR: SECONDARY)

3) Tertiary Button
   - Purpose: Low-emphasis actions available but not prominent
   - Visual: Text-only, no border, --color-primary-500 text
   - Usage: Inline actions within tables or cards
   - Appian: a.buttonWidget (style: LINK)

4) Destructive Button
   - Purpose: Irreversible/high-risk actions (Delete, Reject, Terminate)
   - Visual: Filled --color-danger, white text
   - Usage: Never as primary visual action; always with confirmation dialog design
   - Appian: a.buttonWidget (COLOR: NEGATIVE)

Button Specs:
- Height: 36px (default), 28px (compact)
- Padding: 16px horizontal, 8px vertical
- Font: Label / MD — 14px, weight 600
- Required states: Default, Hover, Pressed, Disabled, Loading


TEXT FIELD
- Usage:
  - Free-text input in task and record forms.
  - Always pair with label above + optional help text slot below.
- Specs:
  - Height: 36px input + 20px label above
  - Border: 1px solid --color-neutral-300
  - Focused border: --color-primary-500
  - Border radius: 4px
  - Font:
    - Input value: Body / MD
    - Label: Label / MD
  - Help text:
    - Body / SM, --color-neutral-500, positioned below field
- Appian: a.textField
- Required states:
  - Empty, Focused, Filled, Error (red border + error message), Disabled, Read-only


GRID / RECORD GRID
- Usage:
  - Lists of records/related data.
  - First column must be a hyperlinked name or ID (a.recordLink()).
- Specs:
  - Row height: 40px (default), 56px (with secondary text)
  - Column header: Label / SM, 12px, --color-neutral-100 background
  - Zebra striping: alternate rows white / --color-neutral-50
  - Pagination: include below grid when more than 10 rows are present
  - Sort indicator: chevron icon in header, --color-neutral-500
- Appian: a.gridField


STATUS BADGE / TAG
- Usage:
  - Communicate status inline in grids, cards, record headers.
  - Only use four semantic colors; never arbitrary badge colors.
- Specs:
  - Height: 20px
  - Padding: 4px 8px
  - Border radius: 100px (pill)
  - Font: Label / SM, weight 600
  - Colors: --color-success, --color-warning, --color-danger, or --color-neutral-*
- Appian: a.tagField
- Rule:
  - Chips/tags should appear in sets of 2+; a single isolated tag is not recommended.


TABS
- Usage:
  - Organize related content within a single Record View/interface section.
  - Do not use tabs for navigation between separate records/pages.
- Specs:
  - Tab height: 40px
  - Active indicator: 2px bottom border, --color-primary-500
  - Font: Body / MD; active tab uses weight 600
  - Max 7 visible tabs; use overflow or a different pattern beyond this
- Appian: a.tabButtonBar


LAYOUT
------
- Use a.sectionLayout as the outermost wrapper for all full-width content blocks.
- Use a.columnsLayout for side-by-side arrangements; prefer equal-width columns.
- Use a.cardLayout to group related fields:
  - White background, 1px --color-neutral-300 border
  - 8px radius, 16px padding
- Use a.collapsibleSectionLayout for supplementary/secondary content hidden by default.
- Never use absolute positioning, overlapping frames, or z-index layering (non-translatable to SAIL).


FORMS
-----
- Labels above fields only; never inline or left-aligned.
- Required fields:
  - Red asterisk (*) after label text.
- Always design a help text slot below every input field.
- Provide error state for every input:
  - Red border (--color-danger)
  - Error message below in Body / SM
- Multi-step task flows:
  - Include a.progressBarWidget at the top to indicate step position.
- Option selection:
  - Use dropdown (a.dropdownField) only when there are 3+ options.
  - For 2 or fewer, use radio buttons.


RECORD VIEWS
------------
- Every Record View starts with a Record Summary Header including:
  - Record name (Heading / LG)
  - Status badge
  - Key metadata
- KPI tiles:
  - Max 5 tiles
  - Card layout with large number (Heading / LG) + label (Body / SM)
- Use tabs to separate sections (Details, Activity, Related Records).
- Activity feeds must show:
  - 32px avatar
  - Body text
  - Timestamp in Body / SM, --color-neutral-500


PROCESS & TASK INTERFACES
-------------------------
- Every task interface includes a Task Header:
  - Task name (Heading / LG)
  - Assigned date
  - Due date (red if overdue)
  - Process context
- Primary action button:
  - Bottom-right of the form (Submit, Approve, Complete)
- Approve/Reject pattern:
  - Approve: Primary button (green)
  - Reject: Destructive button (red)
  - Reject requires justification text field (required)
- Display upstream process data in read-only cards for decision context.
- Use a.collapsibleSectionLayout for supplementary details to reduce initial visual load.


HANDOFF CHECKLIST
-----------------
Before delivering any design to an Appian developer, confirm:
- All layers are named using Appian component names + purpose.
- A "Component Map" Figma page is included, listing each component and its Appian equivalent.
- Design tokens exported as tokens.json via Token Studio, matching Appian portal theme variable names.
- All interactive states are designed for every component.
- Responsive frames provided at:
  - 375px, 768px, 1280px
- Behavior annotations added for:
  - Visibility rules, validation triggers, navigation targets, data bindings
- Figma Make prompts explicitly reference:
  - Appian component names, token names, CDT/process variable names, conditional logic