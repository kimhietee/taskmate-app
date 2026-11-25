# TaskMate UI Redesign Plan

Approved at Gate 1 (2026-11-25). Resume Sections 2-8 from this file (Claude Code, Antigravity or chat).

Stack: Laravel 13, React 19 + TypeScript, Inertia.js v3, Laravel Wayfinder, Tailwind CSS v4 (CSS-first), Radix UI (`resources/js/components/ui/`), Lucide React, Sonner.

Target aesthetic: crisp, high-craft minimalist productivity and trust (Linear / Things 3 precision) for a CMU campus gig marketplace. Light + Dark + System. Desktop 1440x900 and Mobile 390x844 parity. Status badges always pair an icon with a text label. Safe `@media print` on `agreements/show.tsx`.

## Guardrails

- Frontend only: edit inside `resources/js/`, `resources/css/`, and the Blade root layout (`resources/views/app.blade.php`) only for fonts or anti-FOUC. Never touch `app/`, `routes/`, `config/`, `database/`, `resources/js/routes/`, `resources/js/wayfinder/`, `vite.config.ts`.
- Do not scan `node_modules/`, `vendor/`, `public/`, `storage/`, lockfiles.
- Tailwind v4 CSS-first tokens only: custom properties in `:root` and `.dark`, mapped with `@theme inline`. No `tailwind.config.js`, no `hsl(var(...))` wrapping, no hard-coded colour utilities (`bg-blue-600`, `text-gray-900`, `border-amber-300`) in components.
- Keep legacy `teams/index.tsx` and `teams/edit.tsx` untouched and hidden. Keep every Inertia `<Link>` / `useForm`, Wayfinder import, Fortify auth / 2FA / passkey flow, and `tests/js/*.test.mjs` selector.
- Frontend packages: none needed.

## Test constraints (tests/js)

Twelve files are loaded with strict module allowlists (an unmocked import throws "Unexpected module"): `welcome`, `public/info`, `auth/register`, `browse/show`, `applications/index`, `task-form`, `agreement-details`, `rating-summary`, `admin-layout`, `admin-sidebar`, `admin/dashboard`, `admin/tasks/show`.

- Class-only changes in those files. Add no imports (including icons).
- Icons live inside badge components (which the tests mock).
- Preview / layout extras go in non-tested pages (for example `tasks/create.tsx`).
- Keep asserted strings verbatim, for example "1. The offer", "2. The poster", "3. My classes", "4. My decision", "Pre-acceptance checklist (3 quick checks)", "0 of 3 checked", "Ask poster", "Review & apply", "Decline (back to tasks)", "Latest tasks awaiting review", "Every submitted task is reviewed by an administrator", "Step 1 of 2", "Continue as CMU Student", "4.5 average · 4 ratings".
- `browse/show.tsx` DOM order must stay 1 -> 2 -> 3 -> 4 (use CSS grid placement for the desktop sticky decision panel).
- `admin-sidebar.tsx` icons cannot change (test mocks a fixed icon list).

## Visual System

### Palette (starting values, contrast verified at build)

| Token | Light | Dark |
|---|---|---|
| background | oklch(0.978 0.004 95) | oklch(0.16 0.005 260) |
| card | oklch(1 0 0) | oklch(0.205 0.006 260) |
| popover | oklch(1 0 0) | oklch(0.235 0.007 260) |
| foreground | oklch(0.19 0.01 95) | oklch(0.965 0.004 260) |
| muted | oklch(0.955 0.004 95) | oklch(0.25 0.006 260) |
| muted-foreground | oklch(0.45 0.01 95) | oklch(0.74 0.01 260) |
| border | oklch(0.915 0.004 95) | oklch(0.30 0.007 260) |
| input | oklch(0.84 0.005 95) | oklch(0.38 0.008 260) |
| primary | oklch(0.21 0.01 95) | oklch(0.965 0.004 260) |
| brand (ring, links, active nav) | oklch(0.52 0.19 262) | oklch(0.74 0.13 262) |
| sidebar | oklch(0.965 0.004 95) | oklch(0.19 0.006 260) |
| destructive | oklch(0.54 0.21 27) | oklch(0.68 0.19 25) |

### Status tokens (icon + text always)

| Role | Light bg / fg | Dark bg / fg | Icon | Used for |
|---|---|---|---|---|
| success | 0.96 0.05 155 / 0.38 0.1 155 | 0.27 0.05 155 / 0.85 0.15 155 | CircleCheck | Verified, Approved, Paid, Fits your classes |
| warning | 0.965 0.06 90 / 0.42 0.1 65 | 0.29 0.06 80 / 0.88 0.13 85 | Clock / CircleAlert | Pending, To be discussed, Cannot check yet |
| danger | 0.96 0.03 25 / 0.46 0.18 27 | 0.27 0.07 25 / 0.83 0.12 25 | CircleX | Rejected, Cancelled, Clashes with your classes |
| info | 0.96 0.025 255 / 0.43 0.15 262 | 0.27 0.06 262 / 0.83 0.1 255 | CircleDot | Assigned, Negotiating, In progress |
| neutral | muted / 0.40 0.01 95 | muted / 0.78 0.01 260 | Circle | Draft, Withdrawn, Closed |

Border = foreground colour mixed at 30% with transparent.

### Typography

Font: Instrument Sans (weights loaded by `vite.config.ts`: 400/500/600). Only 400 and 600 render: `--font-weight-medium` is remapped to 600. Every text token has line-height >= 1.5 (headings >= 1.25). Amounts and dates use `tabular-nums`.

| Role | Size / line-height | Weight |
|---|---|---|
| Page title (h1) | 28/36 mobile, 32/40 desktop | 600 |
| Section title (h2) | 22/30 | 600 |
| Card title (h3) | 18/26 | 600 |
| Body | 16/26 | 400 |
| UI (controls, nav, meta) | 14/22 | 400 / 600 |
| Caption (minimum) | 12/18 | 400 |

### Elevation, shape, spacing

- L0 page. L1 card: border + shadow-xs. L2 menus/popovers: lighter surface in Dark + shadow. L3 dialogs/sheets: overlay + shadow. Dark mode elevation comes from lighter surfaces, not shadows.
- Radius: card 12px, control 8px, badge pill.
- 4px grid. Page gutters 16 / 24 / 32. Card padding 16 / 24.
- Controls 44px tall below `md`, 36px at `md` and up. Focus: 2px brand ring, 2px offset.
- Page widths as CSS `@utility`: `page-wide` (72rem), `page` (64rem), `page-narrow` (44rem), `prose` (42rem).

## Sections

For Sections 2, 3, 6, 7, 8 no screenshots were reviewed at Gate 1; read each section's files before editing.

### Section 1 - Foundation Lock

- Files: `resources/css/app.css`; `components/ui/*`; `layouts/public-layout`, `auth-layout` (+ `auth/auth-simple-layout`), `app-layout` (+ `app/app-sidebar-layout`), `admin-layout`, `settings/layout`; `components/prototype-banner`, `site-footer`, `app-sidebar`, `app-sidebar-header`, `notification-bell`, `nav-main`, status badge family; `resources/views/app.blade.php`.
- Flaws: flat tokens; invisible light focus ring; Dark card = background and border = input; no status tokens (hard-coded amber/green/red/blue/slate badges); `font-medium` renders 500; line-heights < 1.5; 36px / 32px controls; banner covered by the fixed sidebar and 25% of mobile height; mobile nav does not close after tapping a link; Sheet title outside `SheetContent`; `hsl(var(--sidebar-border))` in sidebar outline variant; duplicate briefcase icon for My Tasks and My Applications, git-folder icon for My Reports; no print base; Blade background hard-coded to old tokens.
- Solution: tokens + `@theme inline` + type scale + status tokens + page-width utilities + print base + reduced-motion; primitives (button, badge, card, input, textarea, select, checkbox, alert, sheet, sidebar, sonner, dialog, dropdown-menu); shared `StatusBadge` and refactored badge components; slim sticky banner (md+) with `--banner-h` offset for the sidebar; mobile nav auto-close (Inertia `navigate` listener + link `onClick`); Sheet title fix; anti-FOUC (`color-scheme`, new background values, meta tag); sidebar icon fixes.

### Section 2 - Public & Errors

- Files: `welcome.tsx`, `public/info.tsx`, `errors/status.tsx`.
- Flaws: `PublicLayout` has no header, brand or container; info pages are text walls; generic error pages.
- Solution: public header (logo, how-it-works, sign in / dashboard); landing with one primary CTA, 3-step strip, trust band, keeping role-aware links ("Browse tasks", "Post a task", "Open dashboard"); info at `prose` width with collapsibles on mobile; centred error page with code, plain text, one primary action.

### Section 3 - Auth & Verification

- Files: `auth/*`, `verification/details.tsx`.
- Flaws: unframed `max-w-sm` form, `text-xl font-medium` title, dense 2-step register.
- Solution: centred `page-narrow` card, 44px inputs, password show/hide, tokenised OTP, "Step 1 of 2" progress bar with text, role radio cards (border + check icon), inline errors with icon, status badge on verification. Fortify / 2FA / passkey flows untouched.

### Section 4 - Dashboard, Status, Profiles & Settings

- Files: `dashboard.tsx`, `notifications/index.tsx`, `sanctions/index.tsx`, `users/show.tsx`, `settings/profile.tsx`, `settings/security.tsx`, `settings/appearance.tsx`.
- Flaws: four equal boxes, duplicated verification disclaimer (body + footer), one-item activity, empty vertical space; settings is a left button nav only.
- Solution: greeting + one state-aware next-step card; 2x2 quick actions with icons; merge verified note + disclaimer into one info row (pending approval to remove the body duplicate; footer keeps the legal copy); activity list with icon, date, unread dot; settings tabs on mobile; security items with status badges; appearance as three radio cards (Light, Dark, System) with previews; rating summary text unchanged.

### Section 5 - Discovery, 4-Part Terms Card & Applications

- Files: `browse/index.tsx`, `browse/show.tsx`, `applications/index.tsx`.
- Flaws: native selects; full-screen filter card on mobile; ragged cards (category wraps, pay block heights vary); weak "View task details" link; long 850px column; duplicate "Ask poster"; tiny native checkboxes; clunky schedule editor.
- Solution: search-first filter bar with mobile "Filters" disclosure (native selects restyled, GET form kept); cards with 2-line title clamp, meta line, large tabular pay + cadence badge, icon lines, compact poster row, whole card clickable, 1/2/3 columns; detail page two columns on desktop with sticky decision panel (DOM order 1-2-3-4 kept); mobile sticky bottom action bar (Review & apply, Ask poster); numbered step headers with status icons, checklist progress, 44px checkboxes, schedule-fit result as badge with text, day chips + time inputs + saved blocks list; applications as cards (mobile) / table (desktop).

### Section 6 - Poster Task Management

- Files: `tasks/create.tsx`, `tasks/edit.tsx`, `tasks/mine.tsx`, `tasks/show.tsx`.
- Flaws: long flat form, dense optional fields, no status overview.
- Solution: grouped numbered sections (Basics, Pay, Schedule, Location, Confirm), 13px helper text, sticky mobile save bar, "How students will see it" preview in create/edit pages (not in tested `task-form`), `mine` with status tabs + counts, `show` with status header, next action, applicants list. Asserted labels and field names unchanged.

### Section 7 - Agreements, Messaging, Ratings & Reports

- Files: `agreements/create.tsx`, `agreements/show.tsx`, `messages/index.tsx`, `messages/show.tsx`, `ratings/create.tsx`, `reports/index.tsx`, `reports/show.tsx`.
- Flaws: agreement is form-like, not document-like; no print CSS (Dark would print dark).
- Solution: agreement as a document (reference, status, parties, terms, version timeline, two-party confirmation state with icon + text); `@media print`: hide sidebar, header, banner, footer links, forms, buttons; force white background and black text even with `.dark`; `@page` margins; avoid breaks inside sections; badges print as bordered text; messages two-pane on desktop, push-style on mobile, sticky composer with safe-area inset; 44px star targets with radio semantics; report categories as radio cards. Asserted `for`/`id` pairs unchanged.

### Section 8 - Admin Moderation Suite

- Files: `admin/dashboard.tsx`, `admin/users/*`, `admin/tasks/*`, `admin/agreements/show.tsx`, `admin/reports/*`, `admin/flags/*`, `admin/ratings/*`.
- Flaws: one `max-w-6xl px-4` wrapper, no table system.
- Solution: dense tables with sticky header + filter row (card list on mobile); KPI tiles + review queue ("Latest tasks awaiting review"); sticky decision panel with required note; audit-trail timeline; destructive actions use destructive button + confirm dialog. Class-only in `admin-layout`, `admin-sidebar`, `admin/dashboard`, `admin/tasks/show`.

## Decisions

- `ui-ux-reference.md` was not found (not in Project Files, not in repo). Proceeding without it; re-check when attached.
- Palette: warm off-white, single blue accent (focus, links, active nav). Approved.
- `font-medium` mapped to 600. Approved.
- Tests: class-only in the twelve test-loaded files. Approved by default.
- Dashboard body disclaimer removal: decide at Section 4.

## Gate log

- Gate 1: audit + blueprint approved.
- Gate 2: this file saved; Section 1 in progress.
