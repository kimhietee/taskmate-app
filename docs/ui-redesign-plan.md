# TaskMate UI Redesign Plan — Sections 2–8 Implementation Specification

Status: **Section 1 Foundation Locked** (2026-11-25). This document is the zero-ambiguity implementation specification for **Pre-Flight Cleanup** and **Sections 2 through 8**, grounded in [docs/ui-inventory.md](file:///c:/Users/lance/taskmate-app/taskmate-app/docs/ui-inventory.md), [AGENTS.md](file:///c:/Users/lance/taskmate-app/taskmate-app/AGENTS.md), [resources/css/app.css](file:///c:/Users/lance/taskmate-app/taskmate-app/resources/css/app.css), and [resources/js/components/status-badge.tsx](file:///c:/Users/lance/taskmate-app/taskmate-app/resources/js/components/status-badge.tsx).

Stack: Laravel 13, React 19 + TypeScript, Inertia.js v3, Laravel Wayfinder, Tailwind CSS v4 (CSS-first), Radix UI (`resources/js/components/ui/`), Lucide React, Sonner.

Target aesthetic: crisp, high-craft minimalist productivity and trust (Linear / Things 3 precision) for the CMU campus task marketplace. Full parity across **Light + Dark + System** themes and **Desktop `1440×900`** + **Mobile `390×844`** viewports. Status badges always pair an icon with text. `agreements/show.tsx` prints cleanly in dark ink on white paper even when Dark Mode is active.

---

## 1. Global Execution Contract & Reconciled Rules

### 1.1 Scope Guardrails (Hard Stops)
- **Frontend only:** Edit strictly inside `resources/js/` (and `resources/css/app.css` only if a print rule adjustment is needed). **Never edit** `app/`, `routes/`, `config/`, `database/`, `resources/js/routes/`, `resources/js/wayfinder/`, `vite.config.ts`, or `tests/`.
- **Legacy Teams untouched:** Never edit or expose `resources/js/pages/teams/index.tsx` or `resources/js/pages/teams/edit.tsx`, and never build new features on Teams. Any fallback dashboard link when `currentTeam` is absent routes to `/dashboard`.
- **No new npm packages:** Zero new dependencies. Use only existing packages (`lucide-react`, Radix primitives already in `resources/js/components/ui/`, `sonner`, `input-otp`).
- **Preserve all functional contracts:** Keep every Inertia `<Link>`, `<Form>`, `useForm`, Wayfinder route call, Fortify auth / 2FA / passkey flow, form field `name` attribute, and `tests/js/*.test.mjs` selector intact.
- **No invented copy, badges, or oversized controls:** Do not add unrequested marketing blurbs, decorative badges, gradient backgrounds, or custom button heights beyond Section 1 sizes (`sm`, `default`, `lg`, `icon`).
- **Privacy & domain invariants (`AGENTS.md`):**
  - Never expose raw identity fields (`id_number`, `institutional_email`, `supporting_info`) outside the account owner and `/admin/users/{user}`.
  - `class_schedule` is strictly private to the owning student.
  - Never add upload fields for government ID photos, student ID photos, or face selfies.
  - Never render automated risk levels, risk scores, or screening breakdowns. Every new/resubmitted task requires manual administrator review.
  - TaskMate records agreements and payment status only; money moves directly between users.
- **Verification after every section:** Run `npm.cmd run build` (executes `tsc --noEmit`, all `tests/js/*.test.mjs`, and Vite build) and `php artisan test`. Never run `composer run dev` or any persistent server.

### 1.2 Decisions Log (Updated)
- **Rule file reconciled:** `.agents/rules/ui-ux-reference.md` does not exist in this repository; `AGENTS.md` is the authoritative rule file and is fully reconciled above.
- **Palette & typography locked (Section 1):** Warm off-white Light / lifted neutral-cool Dark surfaces, single `brand` blue accent (focus ring, links, active nav), `--font-weight-medium: 600` (Instrument Sans renders 400 and 600 only).
- **Dashboard body verification disclaimer removal (Section 4): CONFIRMED.** Remove `<SafetyNotice />` from `resources/js/pages/dashboard.tsx` body because `SiteFooter` already renders `SAFETY_NOTICE` and `PAYMENT_BOUNDARY_NOTICE` verbatim on every page. Consolidate the 3× repeated verification copy into one next-step card and one compact status row.
- **Exact CSS `@utility` names:** Committed `resources/css/app.css` defines `page-wide`, `page`, `page-narrow`, **`prose-width`** (NOT `prose`), and `focus-ring`. Every recipe below uses `prose-width`.
- **Two-vs-three-step Register flow:** `pages/auth/register.tsx` dynamically uses 2 steps for personal-email students and 3 steps for institutional-email students, faculty/staff, and organizations. Preserve that exact state machine and `Step 1 of 2` initial render.
- **Single primary CTA rule:** Every view has at most **one** `Button variant="default"` (or primary-styled link in `CLASS-ONLY` files without `Button`). All secondary actions use `variant="outline"`, tertiary/navigation actions use `variant="ghost"` or `variant="link"`, and irreversible/moderation actions use `variant="destructive"`.

---

## 2. Section 1 Design System Reference (Mandatory Reuse)

Every edit in Sections 2–8 MUST use only these committed tokens, `@utility` classes, and primitives. **Zero** hard-coded Tailwind palette classes (`amber-*`, `green-*`, `emerald-*`, `red-*`, `blue-*`, `gray-*`, `slate-*`, `neutral-*`, `white`, `black`) except where an explicit `print:*` override is specified.

### 2.1 Page Width & Focus `@utility` Classes (`resources/css/app.css`)
| Utility | Definition | When to use |
|---|---|---|
| `page-wide` | `max-w-[72rem] mx-auto w-full px-4 py-6 md:px-6 md:py-8 lg:px-8` | Multi-column discovery (`browse/index`), two-column detail (`browse/show`), poster/applicant listings (`tasks/mine`, `applications/index`), task create/edit with preview rail (`tasks/create`, `tasks/edit`), all Admin pages (already applied by `AdminLayout`) |
| `page` | `max-w-[64rem] mx-auto w-full px-4 py-6 md:px-6 md:py-8 lg:px-8` | Dashboard, settings (already applied by `SettingsLayout`), task detail (`tasks/show`), agreements (`agreements/show`), messages (`messages/*`), reports (`reports/*`), public landing sections |
| `page-narrow` | `max-w-[44rem] mx-auto w-full px-4 py-6 md:px-6 md:py-8` | Focused single-column forms & reading: `public/info`, verification pages, notifications, sanctions, public profiles (`users/show`), agreement create, ratings create, error status |
| `prose-width` | `max-w-[42rem]` | Reading measure inside `public/info.tsx`, long descriptions, legal/privacy text |
| `focus-ring` | `outline: 2px solid transparent; outline-offset: 2px;` → `var(--ring)` on `:focus-visible` | Every custom interactive element (raw links, native selects, radio cards, chips, pagination links) |

### 2.2 Semantic Color & Surface Tokens
- **Elevation (Dark mode uses lighter surfaces, never heavy shadows):**
  - L0 Page: `bg-background text-foreground`
  - L1 Card / Panel: `rounded-xl border border-border bg-card text-card-foreground shadow-xs`
  - L1 Inset / Subtle Band: `rounded-lg border border-border bg-muted/40`
  - L2 Popover / Menu: `bg-popover text-popover-foreground shadow-md`
  - Form Fields: `bg-field border-input text-foreground`
- **Brand & Destructive:** `text-brand`, `border-brand`, `ring-ring`, `bg-destructive text-on-destructive`, `text-destructive-foreground` (inline field errors).
- **Status Tones (always icon + text):**
  - `success`: `border-success-border bg-success-bg text-success-fg`
  - `warning`: `border-warning-border bg-warning-bg text-warning-fg`
  - `danger`: `border-danger-border bg-danger-bg text-danger-fg`
  - `info`: `border-info-border bg-info-bg text-info-fg`
  - `neutral`: `border-neutral-border bg-neutral-bg text-neutral-fg`

### 2.3 Typography Roles
| Role | Exact Tailwind classes | Rendered size / LH |
|---|---|---|
| Page title (`h1`) | `text-3xl font-semibold tracking-tight md:text-4xl` (compact views/auth: `text-2xl font-semibold tracking-tight`) | 28/36 → 32/40 (compact: 22/30) |
| Section title (`h2`) | `text-xl font-semibold md:text-2xl` (card section header: `text-lg font-semibold`) | 20/28 → 22/30 (card: 18/28) |
| Card / sub-section title (`h3`) | `text-base font-semibold` or `text-lg font-semibold` (`CardTitle`) | 16/26 or 18/28 |
| Body prose | `text-base text-foreground` (`leading-relaxed` optional) | 16/26 |
| UI text / labels / helper | `text-sm text-foreground` / `text-sm text-muted-foreground` | 14/22 |
| Caption / metadata / timestamp | `text-xs text-muted-foreground` (minimum size; never use `text-[11px]`) | 12/18 |
| Numeric figures (PHP, counts, dates, times, KPIs) | Add `tabular-nums` | Tabular alignment |

### 2.4 Reusable Control & Pattern Recipes
- **`Button` sizes (already responsive 44px mobile / 36px desktop):** `default` (`h-11 md:h-9`), `sm` (`h-10 md:h-8`), `lg` (`h-12 md:h-10`), `icon` (`size-11 md:size-9`). Never override `h-*` on `<Button>`.
- **Primary / Outline Link in `CLASS-ONLY` files without `Button` import:**
  - Primary: `focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 md:h-9`
  - Outline: `focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground md:h-9`
- **Styled Native `<select>` (required for GET filter forms, Inertia `<Form>` native submissions, and `CLASS-ONLY` files):**
  `focus-ring h-11 w-full rounded-md border border-input bg-field px-3 text-sm text-foreground shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:h-9`
- **Styled Native Checkbox (ONLY for `CLASS-ONLY` files that cannot import `ui/checkbox`):**
  Wrap `<input type="checkbox" className="focus-ring mt-0.5 size-5 shrink-0 rounded-[5px] border border-input bg-field accent-primary disabled:opacity-50" />` inside `<label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3 text-sm transition-colors hover:bg-muted/40">`.
- **Shared Status Badge Family (all use `StatusBadge` = icon + text):**
  - `VerificationStatusBadge` (`unverified` neutral, `pending` warning, `verified` success, `rejected` danger, `more_info_requested` info)
  - `TaskStatusBadge` (`pending_review` warning, `changes_requested` warning/attention, `approved` success, `assigned` info, `in_progress` info/active, `completed` success, `rejected` danger, `cancelled` neutral/closed)
  - `ApplicationStatusBadge` (`pending` warning, `accepted` success, `declined` danger, `withdrawn`/`cancelled` neutral/closed)
  - `AgreementStatusBadge` (`negotiating` warning, `agreed` success, `cancelled` neutral/closed)
  - `PaymentStatusBadge` (`unpaid` neutral, `marked_paid` warning, `confirmed_received` success, `not_received` danger)
  - `ReportStatusBadge` (`open` warning, `under_review` info/active, `resolved` success, `dismissed` neutral/closed)
  - `ToBeDiscussedBadge` (warning `CircleAlert`) & `ScheduleFitBadge` (`fits` success, `clashes` danger, `cannot_check` neutral)
- **Standardized Pagination Bar:**
  `<nav aria-label="{Label} pages" className="flex flex-wrap items-center justify-between gap-3 pt-2">` with item range summary (when provided) and `flex flex-wrap items-center gap-1.5` link list: decode `&laquo;`/`&raquo;` into `"Previous"`/`"Next"` (plain text, no `dangerouslySetInnerHTML`), active page gets `bg-primary text-primary-foreground border-primary font-semibold`, enabled page gets `focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border bg-card px-3 text-sm hover:bg-accent md:min-h-9 md:min-w-9`, disabled span gets `inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border/60 bg-muted/40 px-3 text-sm text-muted-foreground opacity-60 md:min-h-9 md:min-w-9`.
- **Standardized Dense Table / Mobile Card Breakpoint (`md:` = 768px):**
  - Desktop (`hidden md:block`): `<div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs"><table className="w-full border-collapse text-left text-sm"><thead className="sticky top-0 z-10 border-b border-border bg-muted/60 text-xs font-semibold text-muted-foreground">...</thead><tbody className="divide-y divide-border">...</tbody></table></div>` (`th`/`td` padding `px-4 py-3`, dates/amounts `tabular-nums`, row hover `hover:bg-muted/30`).
  - Mobile (`grid gap-3 md:hidden`): Stacked L1 cards (`rounded-xl border border-border bg-card p-4 shadow-xs space-y-2.5`) showing title + status badge on row 1, key metadata on row 2, and action row at bottom.

---

## 3. Pre-Flight Cleanup (Run Before Section 2)

### 3.1 `resources/js/components/ui/*` Audit Result
All **27** files in `resources/js/components/ui/` were audited in [docs/ui-inventory.md](file:///c:/Users/lance/taskmate-app/taskmate-app/docs/ui-inventory.md):
- **0 hard-coded palette colors** and **0 `hsl(var(` usages** remain in `resources/js/components/ui/`. No edits needed in `components/ui/*`.

### 3.2 Shared Non-`ui/` Primitives Cleanup (3 files — `FULL JSX REFACTOR ALLOWED`)
1. **`resources/js/components/star-rating.tsx`**
   - Replace hard-coded `text-amber-600` (no dark variant) with `text-warning-fg`.
   - Clamp `score` safely: `const clamped = Math.max(0, Math.min(5, Math.round(score)));` so out-of-range values never throw in `String.repeat()`.
   - Preserve exported signature `StarRating({ score, label = 'Rating' })`, `aria-label={`${label}: ${clamped} out of 5`}`, and `sr-only` text.
2. **`resources/js/components/password-input.tsx`**
   - Remove `tabIndex={-1}` on the Show/Hide toggle button so keyboard users can reach it.
   - Replace `focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none` with `focus-ring`.
   - Set button hit width `min-w-11 md:min-w-9` with `pr-11 md:pr-10` on `<Input>`.
3. **`resources/js/components/input-error.tsx`**
   - Add `role="alert"` and keep `className={cn('text-sm text-destructive-foreground', className)}` (keep props `HTMLAttributes<HTMLParagraphElement> & { message?: string }`; no new icon imports).

---

## 4. Strict Scope & Verified `CLASS-ONLY (NO NEW IMPORTS)` Contract Table

The 12 files below are transpiled and executed in `tests/js/*.test.mjs` with strict `mockRequire` allowlists. Adding **any** import not listed in column 4 (even a single Lucide icon or `Card`/`Alert`/`Checkbox` primitive) throws `Unexpected module` and fails `npm.cmd run build`.

| # | File (`resources/js/...`) | Test suite | Strict allowed imports (DO NOT ADD ANY) | Verbatim asserted strings, DOM order, `for`/`id` pairs & forbidden patterns |
|---|---|---|---|---|
| 1 | `pages/welcome.tsx` | `first-version-scope.test.mjs` | `@inertiajs/react` (`Head`, `Link`, `usePage`), `@/constants/notices` (`PAYMENT_BOUNDARY_NOTICE`, `SAFETY_NOTICE`), `@/routes` (`register`, `login`), `@/routes/browse`, `@/routes/tasks` | Role-gated links: `href="/browse"...>Browse tasks`, `href="/tasks/create"...>Post a task`, `href="/dashboard"...>Open dashboard`. Unverified users must NOT render `/browse` or `/tasks/create`. |
| 2 | `pages/public/info.tsx` | `first-version-scope.test.mjs` | `@inertiajs/react` (`Head`, `Link`), `@/constants/notices` (`PAYMENT_BOUNDARY_NOTICE`), `@/routes` (`register`, `login`), `@/routes/browse`, `@/routes/tasks` | `how-it-works` must include verbatim: `Create an account and verify it`, `confirm the same version before work begins`, `Only students can apply`, `Payment is made directly between them`. |
| 3 | `pages/auth/register.tsx` | `registration-guidance.test.mjs` | `@inertiajs/react` (`Head`, `useForm`), `@/components/input-error`, `@/components/password-input`, `@/components/safety-notice`, `@/components/text-link`, `@/components/ui/button`, `@/components/ui/input`, `@/components/ui/label`, `@/components/ui/spinner`, `@/components/ui/textarea`, `@/routes`, `@/routes/register` | Verbatim: `Step 1 of 2`, `How will you use TaskMate?`, `CMU Student`, `CMU Faculty / Staff`, `Office or Organization Representative`, `How verification works`, `6-digit code`, `TaskMate does not ask for ID photos or identity document uploads`, `Continue as CMU Student`. |
| 4 | `pages/browse/show.tsx` | `schedule-fit.test.mjs`, `first-version-scope.test.mjs` | `@/lib/format`, `@/lib/schedule-fit`, `@/constants/notices`, `@inertiajs/react` (`Head`, `Link`, `router`, `useForm`), `@/components/ui/button`, `@/components/ui/input`, `@/components/ui/label`, `@/components/ui/textarea`, `@/components/input-error`, `@/components/verification-status-badge`, `@/components/application-status-badge`, `@/components/terms-status-badge`, `@/routes/browse`, `@/routes/applications`, `@/components/rating-summary`, `@/components/problem-report-form` | **Strict DOM order:** `1. The offer` < `2. The poster` < `3. My classes` < `4. My decision`. Verbatim: `Bi-weekly (every 2 weeks)`, `To be discussed`, `Pre-acceptance checklist (3 quick checks)`, `0 of 3 checked`, `Clashes with your classes`, `Ask poster`, `Review & apply`, `Decline (back to tasks)`. **Source regex:** MUST contain `Workplace`; MUST NOT contain `Work conditions`, `Safety answers`, `Physical demand`, `Academic involvement`, `Hazards involved`, `Private or isolated one-on-one meeting required`. |
| 5 | `pages/applications/index.tsx` | `application-agreement-guidance.test.mjs` | `@inertiajs/react` (`Form`, `Head`, `Link`), `@/lib/format`, `@/components/ui/button`, `@/components/application-status-badge`, `@/routes/applications`, `@/routes/browse`, `@/routes/agreements`, `@/components/payment-status-badge`, `@/components/terms-status-badge` | Verbatim: `Your application stays active until an agreement is confirmed`, `Review the agreement and confirm the same version before work begins`, `View agreement`. |
| 6 | `components/task-form.tsx` | `task-form.test.mjs` | `@/constants/notices`, `@inertiajs/react` (`Form`), `@/components/input-error`, `@/components/ui/button`, `@/components/ui/input`, `@/components/ui/label`, `@/components/ui/textarea` | Verbatim: `Task title`, `Category`, `Work type`, `What needs to be done?`, `Estimated budget (PHP)`, `Pay amount is to be discussed`, `When is pay given? (Pay timing)`, `Work schedule / hours`, `Flexible / self-paced before deadline`, `Work hours are to be discussed`, `Can hours change?`, `Work mode`, `Deadline (optional)`, `I confirm that this task follows the platform rules.`. **Forbidden `name=` fields:** `complexity`, `required_activities`, `deliverables`, `estimated_duration_hours`, `skill_requirements`, `physical_demand`, `academic_involvement`, `hazard_exposure`, `private_meeting_required`, `workplace_setting`. |
| 7 | `components/agreement-details.tsx` | `application-agreement-guidance.test.mjs` | `@inertiajs/react` (`Form`, `Link`), `lucide-react` (`Printer` ONLY), `@/lib/format`, `@/components/ui/button`, `@/components/ui/input`, `@/components/ui/textarea`, `@/components/input-error`, `@/components/agreement-status-badge`, `@/routes/agreements`, `@/components/completion-payment-panel`, `@/components/star-rating`, `@/components/rating-summary` | Verbatim: `Review the work, amount, dates, and payment arrangement`, `both people confirm the same version`, `I agree to these terms`, `Propose different terms`, `Ask for a change`. **Required `for` + `id` pairs (all 9):** `revise-deliverables`, `revise-terms`, `revise-final-amount`, `revise-start-date`, `revise-due-date`, `revise-payment-arrangement`, `revise-comment`, `send-back-body`, `cancel-reason`. |
| 8 | `components/rating-summary.tsx` | `rating-summary.test.mjs` | `@/components/star-rating`, `@/constants/notices` | Verbatim format: `{average} average · {count} ratings` (test checks `4.5 average · 4 ratings` — DO NOT singularize `"ratings"`), `Ratings are contextual information`. Must NOT render dimension names (e.g. `Communication`). |
| 9 | `layouts/admin-layout.tsx` | `admin-layout.test.mjs` | `@/components/app-content`, `@/components/admin-sidebar`, `@/components/app-shell`, `@/components/app-sidebar-header`, `@/components/prototype-banner`, `@/components/site-footer` | Renders `AppShell`, `AdminSidebar`, `AppSidebarHeader` with `showMessages={false}`, `{children}`, `SiteFooter`. |
| 10 | `components/admin-sidebar.tsx` | `admin-layout.test.mjs` | `@inertiajs/react` (`Link`), `lucide-react` (`BriefcaseBusiness`, `Flag`, `LayoutDashboard`, `ShieldCheck`, `Star`, `Users` ONLY), `@/components/app-logo`, `@/components/nav-main`, `@/components/nav-user`, `@/components/ui/sidebar`, `@/routes/admin` | `aria-label="Administration"`; labels: `Dashboard`, `Users`, `Tasks`, `Reports`, `Flags`, `Ratings`, `Profile settings`, `Log out`. Must NOT contain `Browse Tasks` or `My Applications`. |
| 11 | `pages/admin/dashboard.tsx` | `admin-layout.test.mjs` | `@inertiajs/react` (`Head`, `Link`), `@/layouts/admin-layout`, `@/components/verification-status-badge`, `@/routes/admin` | Verbatim: `Latest tasks awaiting review`, latest task title, `href="/admin/tasks/{id}"`, `href="/admin/tasks?status=pending_review"`. |
| 12 | `pages/admin/tasks/show.tsx` | `admin-task-review.test.mjs`, `first-version-scope.test.mjs` | `@inertiajs/react` (`Form`, `Head`, `Link`), `@/layouts/admin-layout`, `@/components/task-status-badge`, `@/components/verification-status-badge`, `@/components/safety-notice`, `@/components/terms-status-badge`, `@/components/ui/button`, `@/components/ui/textarea`, `@/components/input-error`, `@/routes/admin`, `@/routes/admin/users`, `@/components/completion-payment-panel`, `@/lib/format`, `@/constants/notices` | Verbatim: `Every submitted task is reviewed by an administrator`, `No applications have been submitted`, `No off-platform content flags have been recorded`. Must NOT match `Risk level`, `Screening breakdown`, `Score:`, or `>Agreement<` (when absent). **Source regex:** MUST contain `Workplace`; MUST NOT contain `Work conditions`, `Safety answers`, `Physical demand`, `Academic involvement`, `Hazards involved`, `Private or isolated one-on-one meeting required`. |

> **13th File — Source-Regex-Only (`FULL JSX REFACTOR ALLOWED`):** `resources/js/pages/tasks/show.tsx` allows new imports, but `tests/js/first-version-scope.test.mjs` scans its raw source: MUST contain `Workplace` and MUST NOT contain `Work conditions`, `Safety answers`, `Physical demand`, `Academic involvement`, `Hazards involved`, or `Private or isolated one-on-one meeting required`.

---

## 5. Section 2 — Public & Errors

### 5.1 `resources/js/layouts/public-layout.tsx` — `FULL JSX REFACTOR ALLOWED`
- **Desktop (`1440×900`) & Mobile (`390×844`):** `min-h-svh flex flex-col bg-background text-foreground`. Top `<PrototypeBanner />`, sticky public header `sticky top-[var(--banner-h,0px)] z-30 border-b border-border bg-background/95 backdrop-blur-xs`, inner container `mx-auto flex h-14 w-full max-w-[64rem] items-center justify-between gap-4 px-4 md:px-6 lg:px-8`. `<main className="flex-1">{children}</main>`, `<SiteFooter />`.
- **Header contents (uses `usePage()` to detect signed-in user):**
  - Left: `<Link href="/" className="focus-ring flex items-center gap-2 rounded-md text-sm font-semibold text-foreground"><AppLogoIcon className="size-6 fill-current" /><span>TaskMate</span></Link>`.
  - Right (`flex items-center gap-2 sm:gap-3`): `<Button variant="ghost" size="sm" asChild><Link href="/how-it-works">How it works</Link></Button>`; if signed in → `<Button size="sm" variant="outline" asChild><Link href="/dashboard">Dashboard</Link></Button>`; if guest → `<Button variant="ghost" size="sm" asChild><Link href={login()}>Log in</Link></Button>` + `<Button size="sm" asChild><Link href={register()}>Register</Link></Button>`.
- **Duplicate header removal:** `PublicLayout` owns the global header; remove the redundant inline `<header>` from `welcome.tsx` and `public/info.tsx` (neither test asserts header markup).

### 5.2 `resources/js/pages/welcome.tsx` — `CLASS-ONLY (NO NEW IMPORTS)`
- **Desktop & Mobile Geometry:**
  - Hero band: `<section className="page py-12 md:py-20">`, inner `max-w-3xl space-y-5`.
  - Flow band: `<section className="border-y border-border bg-muted/35"><div className="page space-y-6">`, 6-step grid `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3`.
  - Trust / Limits band: `<section className="page"><div className="grid gap-4 md:grid-cols-2">` (two L1 cards side-by-side on desktop, stacked on mobile).
- **Top-to-Bottom Recipe:**
  1. **Hero:** Eyebrow `text-sm font-semibold text-brand` (`For the Central Mindanao University community`) → `h1` `text-3xl font-semibold tracking-tight text-foreground md:text-4xl` (`Find campus tasks with the details you need before you agree.`) → Lead `text-base text-muted-foreground prose-width` → Action row `flex flex-wrap items-center gap-3 pt-2` using §2.4 tokenized primary/outline link classes (`h-11 md:h-10`, **single primary CTA per role state**: Admin → `Open admin dashboard`; Student who can apply → `Browse tasks` primary + `Post a task` outline; Poster who cannot apply → `Post a task` primary; Unverified signed-in → `Open dashboard` primary; Guest → `Create an account` primary + `Log in` outline) → Guest muted caption `text-sm text-muted-foreground`.
  2. **The main TaskMate flow:** `h2` `text-xl font-semibold md:text-2xl` + subtitle `text-sm text-muted-foreground prose-width` → `<ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">` where each `<li>` is `rounded-xl border border-border bg-card p-5 shadow-xs space-y-2` with step number pill `inline-flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-foreground` (`{i + 1}`) + step text `text-sm text-foreground` → Role summary line `text-sm text-muted-foreground`.
  3. **Clear limits (Trust band):** `h2` `text-xl font-semibold md:text-2xl` → 2-column grid of L1 cards (`rounded-xl border border-border bg-card p-5 shadow-xs space-y-1.5`): Card 1 heading `h3 text-base font-semibold` (`Direct payments only`) + `<p className="text-sm text-muted-foreground">{PAYMENT_BOUNDARY_NOTICE}</p>`; Card 2 heading `h3 text-base font-semibold` (`Informed decisions, not guarantees`) + `<p className="text-sm text-muted-foreground">{SAFETY_NOTICE}</p>`.
- **Empty / Error States:** None (static public page).

### 5.3 `resources/js/pages/public/info.tsx` — `CLASS-ONLY (NO NEW IMPORTS)`
- **Desktop & Mobile Geometry:** `<main className="page-narrow space-y-6">` with `prose-width` applied to reading paragraphs.
- **Top-to-Bottom Recipe:**
  1. **Page header:** `h1` `text-3xl font-semibold tracking-tight md:text-4xl` (`{title}`) + back link `text-sm text-brand underline-offset-4 hover:underline focus-ring rounded-sm` (`Back to home` → `/`).
  2. **`page === 'how-it-works'`:** Lead paragraph `text-base text-muted-foreground prose-width` → `<ol className="space-y-3">` of 6 L1 cards (`rounded-xl border border-border bg-card p-4 shadow-xs md:p-5`) with numbered step `h2` `text-base font-semibold` and `p` `mt-1 text-sm text-muted-foreground` (keep all 4 asserted verbatim phrases untouched!) → Info callout `rounded-lg border border-info-border bg-info-bg p-4 text-sm text-info-fg` for role eligibility.
  3. **`page === 'task-guidelines'`:** Replace hard-coded amber note (`L20`) with `rounded-lg border border-warning-border bg-warning-bg p-4 text-sm text-warning-fg` → L1 card `rounded-xl border border-border bg-card p-5 shadow-xs` containing `<ul className="list-disc space-y-2.5 pl-5 text-sm text-foreground prose-width">` (if `guidelines.length === 0`, show muted empty state `No guidelines are published yet.`).
  4. **`page === 'safety-and-limits'`:** `space-y-4 prose-width` with each of the 3 statements inside clean L1 cards (`rounded-xl border border-border bg-card p-5 shadow-xs text-sm text-foreground`).
  5. **`page === 'privacy'`:** Replace hard-coded amber draft banner (`L22`) with `rounded-lg border border-warning-border bg-warning-bg p-4 text-sm text-warning-fg` → Replace raw `<pre>` text wall with `<div className="rounded-xl border border-border bg-card p-5 shadow-xs md:p-6"><div className="prose-width whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-foreground">{privacyDraft ?? 'Privacy notice draft is not available.'}</div></div>` (mobile-readable sans prose, no horizontal scroll).

### 5.4 `resources/js/pages/errors/status.tsx` — `FULL JSX REFACTOR ALLOWED`
- **Desktop & Mobile Geometry:** `<main className="page-narrow flex min-h-[65vh] items-center justify-center">`.
- **Top-to-Bottom Recipe:** Centered L1 `<Card className="w-full max-w-md text-center">` → `<CardContent className="space-y-4 pt-2">` → `<Badge variant="neutral" className="mx-auto tabular-nums">Error {status}</Badge>` → `h1` `text-2xl font-semibold tracking-tight md:text-3xl` (status message) → `<p className="text-sm text-muted-foreground">` → Action row `flex flex-wrap items-center justify-center gap-3 pt-2`: single `Button variant="default"` (`asChild` → `<Link href={user ? '/dashboard' : '/'}>{user ? 'Go to dashboard' : 'Back to home'}</Link>`) + secondary `Button variant="outline"` (`Back to home` when signed in). **Fixes Teams bug:** never depend on `currentTeam.slug`; route signed-in fallback to `/dashboard` per `AGENTS.md`.

### Section 2 Anti-Patterns to Avoid
1. **No raw `border-amber-500 bg-amber-50` banners** in `public/info.tsx` — dark mode breaks contrast completely; always use `border-warning-border bg-warning-bg text-warning-fg`.
2. **No `<pre>` monospace wall** on `/privacy` — wraps awkwardly on `390px` mobile.
3. **No unmocked imports in `welcome.tsx` or `public/info.tsx`** — never import `Button`, `Card`, or Lucide icons into either file.

---

## 6. Section 3 — Auth & Verification

### 6.1 `resources/js/layouts/auth/auth-simple-layout.tsx` — `FULL JSX REFACTOR ALLOWED`
- **Desktop & Mobile Geometry:** Outer `<div className="flex min-h-svh flex-col bg-background text-foreground">` → `<PrototypeBanner prominent />` → `<main className="flex flex-1 items-center justify-center px-4 py-8 md:p-10">` → `<div className="w-full max-w-lg space-y-6">` → `<SiteFooter />` (sits cleanly at the bottom of the flex column without pushing below an extra `min-h-svh`).
- **Card Frame:** Logo `<Link href={home()}>` centered above an L1 `<Card>` (`rounded-xl border border-border bg-card p-6 shadow-xs md:p-8`) containing header (`h1 text-2xl font-semibold tracking-tight text-center`, `p text-sm text-muted-foreground text-center mt-1.5`) + `{children}`. Widening from `max-w-sm` (384px) to `max-w-lg` (512px) gives `register.tsx` role cards breathing room while keeping Login/Reset crisp.

### 6.2 `resources/js/pages/auth/login.tsx` — `FULL JSX REFACTOR ALLOWED`
- **Layout:** Static `Login.layout` inside `AuthSimpleLayout`.
- **Top-to-Bottom Recipe:**
  1. If `status`: move ABOVE the form! Tokenized success box `<div role="status" className="rounded-lg border border-success-border bg-success-bg px-4 py-3 text-center text-sm text-success-fg">{status}</div>` (removes hard-coded `text-green-600`).
  2. `<PasskeyVerify />` (if rendered, followed by clean divider).
  3. `<Form {...store.form()} resetOnSuccess={['password']} className="space-y-5">`:
     - Email field (`grid gap-1.5`): `<Label htmlFor="email">Email address</Label>`, `<Input id="email" name="email" type="email" ... />`, `<InputError />`.
     - Password field (`grid gap-1.5`): flex header row with `<Label htmlFor="password">` + `<TextLink href={request()}>Forgot password?</TextLink>`, `<PasswordInput id="password" name="password" ... />`, `<InputError />`.
     - Remember row: `<div className="flex min-h-11 items-center gap-3">` with `<Checkbox id="remember" name="remember" />` + `<Label htmlFor="remember" className="cursor-pointer font-normal">Remember me</Label>`.
     - Single primary CTA: `<Button type="submit" className="w-full" disabled={processing}>{processing && <Spinner />}Log in</Button>`. Remove duplicate `tabIndex={5}` attributes so DOM order controls focus naturally.
  4. Footer link: `Don't have an account?` + `<TextLink href={register()}>Sign up</TextLink>`.

### 6.3 `resources/js/pages/auth/register.tsx` — `CLASS-ONLY (NO NEW IMPORTS)`
- **Layout:** Static `Register.layout` inside widened `AuthSimpleLayout` (`max-w-lg`). Preserves dynamic 2-step (personal-email student) / 3-step state machine and ALL 9 verbatim strings asserted in `registration-guidance.test.mjs`.
- **Top-to-Bottom Recipe:**
  1. **Progress bar:** `space-y-2` (`aria-label="Registration progress"`): `flex items-center justify-between text-xs font-semibold text-muted-foreground tabular-nums` showing `Step {step} of {totalSteps}` + step label. Track `h-2 w-full overflow-hidden rounded-full bg-muted`, fill `h-full rounded-full bg-brand transition-all duration-300` using discrete Tailwind width classes (`w-1/2`, `w-full`, `w-1/3`, `w-2/3`) instead of inline `style={{ width }}`.
  2. **Step error alert (when `stepError`):** Replace hard-coded amber classes (`L248`) with `<div role="alert" className="rounded-lg border border-warning-border bg-warning-bg px-4 py-3 text-sm text-warning-fg">{stepError}</div>`.
  3. **Step 1 — Choose your role:** `h2 text-base font-semibold` (`How will you use TaskMate?`) + subtitle → `<div role="radiogroup" aria-label="Choose your account type" className="grid gap-3">` of 3 role cards (`<button type="button" role="radio" aria-checked={selected}>`, support ArrowUp/ArrowDown keyboard cycling):
     - Selected: `focus-ring w-full rounded-xl border-2 border-brand bg-info-bg/40 p-4 text-left shadow-xs transition-colors` with a CSS check circle `<span aria-hidden="true" className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">✓</span>`.
     - Unselected: `focus-ring w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-input hover:bg-muted/40` with empty circle `<span aria-hidden="true" className="inline-flex size-5 shrink-0 rounded-full border border-input" />`.
     - Keep role titles, badges (`rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground`), and summaries intact.
     - Verification guidance card: `rounded-lg border border-border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground space-y-2` (keep `How verification works`, `6-digit code`, `TaskMate does not ask for ID photos or identity document uploads` verbatim).
     - Single primary CTA: `<Button type="button" className="w-full">Continue as {role title}</Button>`.
  4. **Step 2 — Account basics:** Clean `space-y-4` form fields (`name`, `email`, `password`, `password_confirmation`). Replace hard-coded green box (`L351`) for detected CMU institutional email with `rounded-lg border border-success-border bg-success-bg px-3.5 py-2.5 text-xs text-success-fg`. Keep `<SafetyNotice />`. Action row `flex items-center gap-3 pt-2`: `<Button type="button" variant="outline">Back</Button>` + primary `<Button className="flex-1">` (`Create account & send code` or `Continue to ... details`).
  5. **Step 3 — Campus / Organization details:** Restyle native `<select id="affiliation_select">` with §2.4 native-select recipe (`h-11 md:h-9 ... focus-ring`). Action row: `<Button variant="outline">Back</Button>` + primary `<Button type="submit" className="flex-1" disabled={processing}>{processing && <Spinner />}Create account & send code</Button>`.

### 6.4 `resources/js/pages/auth/forgot-password.tsx` — `FULL JSX REFACTOR ALLOWED`
- Move `status` banner to top using `border-success-border bg-success-bg text-success-fg` (remove hard-coded `text-green-600`).
- Replace `LoaderCircle` with `<Spinner />`; set `autoComplete="email"` on email input.
- Single primary CTA: `<Button type="submit" className="w-full" disabled={processing}>{processing && <Spinner />}Email password reset link</Button>`.

### 6.5 `resources/js/pages/auth/reset-password.tsx` — `FULL JSX REFACTOR ALLOWED`
- Normalize field spacing to `space-y-4` with `grid gap-1.5` per field (remove stray `mt-1`/`mt-2` overrides). Read-only email input gets `bg-muted/50 text-muted-foreground`. Single primary CTA: `<Button type="submit" className="w-full" disabled={processing}>{processing && <Spinner />}Reset password</Button>`.

### 6.6 `resources/js/pages/auth/confirm-password.tsx` — `FULL JSX REFACTOR ALLOWED`
- Keep `<PasskeyVerify />` + clean `space-y-5` password form. Single primary CTA: `<Button type="submit" className="w-full" disabled={processing}>{processing && <Spinner />}Confirm password</Button>`.

### 6.7 `resources/js/pages/auth/two-factor-challenge.tsx` — `FULL JSX REFACTOR ALLOWED`
- Replace hard-coded `decoration-neutral-300 dark:decoration-neutral-500` (`L119`) with `decoration-muted-foreground/50 hover:text-brand`.
- Add `<Label htmlFor="recovery_code">Recovery code</Label>` + `id="recovery_code"` on recovery input (fixes missing label).
- Add `<Spinner />` inside `<Button type="submit" className="w-full" disabled={processing}>{processing && <Spinner />}Continue</Button>`.
- Fix toggle copy grammar: `"sign in using a recovery code"` / `"sign in using an authentication code"` (inside a `<Button type="button" variant="link" size="sm">`). Keep `InputOTP` tokenized slots (`h-11 w-10 md:h-10`) centered.

### 6.8 `resources/js/pages/auth/verify-email.tsx` — `FULL JSX REFACTOR ALLOWED`
- Replace hard-coded amber prototype box (`L59`) with `<Alert variant="warning">` and hard-coded green resend box (`L65`) with tokenized `role="status"` (`border-success-border bg-success-bg text-success-fg`).
- Tokenize OTP input: `h-12 w-full text-center font-mono text-2xl tracking-[0.4em] tabular-nums` inside a clean `grid gap-1.5` with `<Label htmlFor="code">6-digit verification code</Label>`.
- Single primary CTA: `<Button type="submit" className="w-full" disabled={processing || code.length < 6}>{processing && <Spinner />}Confirm email & continue to dashboard</Button>`.
- Resend section: `<Button type="submit" variant="outline" className="w-full">Resend verification code</Button>` + `<TextLink href={logout()} method="post" as="button" className="mx-auto block text-sm">Log out</TextLink>`.

### 6.9 `resources/js/pages/verification/details.tsx` — `FULL JSX REFACTOR ALLOWED`
- **Desktop & Mobile Geometry:** `<main className="page-narrow space-y-6">`.
- **Top-to-Bottom Recipe:**
  1. Header row (`space-y-2`): `<VerificationStatusBadge status={verificationStatus} />`, `h1 text-2xl font-semibold md:text-3xl` (`Update your submitted details`), concise subtitle `text-sm text-muted-foreground`.
  2. If `verificationNote`: `<Alert variant="warning">` with `<AlertTitle>Administrator note</AlertTitle><AlertDescription className="whitespace-pre-wrap">{verificationNote}</AlertDescription>`.
  3. `<Card>` wrapping `<Form {...verificationDetails.update.form()} className="space-y-5">` with `<CardContent className="space-y-5">` — restyle native `<select id="affiliation_select">` with §2.4 native-select recipe, format JSX cleanly across lines.
  4. Single primary CTA: `<Button type="submit" disabled={processing}>{processing && <Spinner />}Submit for review</Button>`.
  5. Keep `<SafetyNotice />` below the form (or compact muted note).

### 6.10 `resources/js/pages/verification/student.tsx` — `FULL JSX REFACTOR ALLOWED`
- **Desktop & Mobile Geometry:** `<main className="page-narrow space-y-6">`.
- **Top-to-Bottom Recipe:**
  1. Header (`space-y-2`): top row `flex flex-wrap items-center justify-between gap-2` with `<VerificationStatusBadge status={verificationStatus} />` + `<Button variant="ghost" size="sm" asChild><Link href="/dashboard">Back to dashboard</Link></Button>`; `h1 text-2xl font-semibold md:text-3xl` (`Verify your CMU Student status`); subtitle `text-sm text-muted-foreground`.
  2. Flash `status` (`border-success-border bg-success-bg text-success-fg`, removes `L136` green-*) and `verificationNote` (`<Alert variant="warning">`, removes `L142` amber-*).
  3. **Method chooser** (`role="radiogroup" aria-label="Verification method"`, `grid gap-3 sm:grid-cols-2`): 2 selectable radio cards using `role="radio" aria-checked={active}` (`border-2 border-brand bg-info-bg/40` vs `border-border bg-card hover:bg-muted/40`). Replace hand-rolled green pill (`L161`) with `<Badge variant="success">Instant approval</Badge>` (or `Recommended`) and `<Badge variant="neutral">No CMU email needed</Badge>`.
  4. **Pending 6-digit code card** (when `method === 'institutional' && pendingInstitutionalCode`): `<Card className="border-2 border-brand/50 bg-info-bg/20">` with `Alert variant="warning"` for log-driver prototype note (removes `L207` amber-*), OTP `<Input>` (`tabular-nums font-mono text-2xl tracking-[0.4em] h-12 max-w-xs text-center`), and primary `<Button type="submit">Confirm code & verify as CMU Student</Button>`.
  5. **Details `<Card>`**: restyled native `<select id="student_affiliation_select">` (§2.4 recipe), fields with `grid gap-1.5`, single primary CTA (`Send 6-digit CMU code` / `Submit for administrator review`) when pending code card is absent (`variant="outline"` when pending code card already holds the primary CTA) + secondary `<Button variant="ghost" asChild><Link href="/browse">Continue previewing tasks</Link></Button>`.
  6. Single compact privacy note (`rounded-lg border border-border bg-muted/40 p-3.5 text-xs text-muted-foreground`); remove duplicate `<SafetyNotice />` since `SiteFooter` displays it.

### Section 3 Anti-Patterns to Avoid
1. **No `max-w-sm` auth card** that squishes `register.tsx` role cards into 384px.
2. **No hard-coded `text-green-600`, `bg-amber-50`, or `bg-green-50`** on flash/status/prototype notices.
3. **No unlabelled inputs** (`two-factor-challenge` recovery code) or `tabIndex={-1}` on password visibility toggles.

---

## 7. Section 4 — Dashboard, Status, Profiles & Settings

### 7.1 `resources/js/pages/dashboard.tsx` — `FULL JSX REFACTOR ALLOWED`
- **Desktop (`1440×900`) & Mobile (`390×844`):** Outer `<div className="page space-y-6">`.
  - Desktop: Top Greeting + Next-Step Hero (`w-full`) → Conditional Sanction Alerts → 2-column grid `grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]` (Left: Quick Actions 2×2 grid + Ratings Waiting + Recent Activity; Right: Compact Account Status card).
  - Mobile: Single-column stack in priority order: Flash → Sanction Alert (if any) → Greeting + Next-Step Hero → Quick Actions (2×2 `grid-cols-2 gap-3`) → Compact Verification Status Row → Ratings Waiting → Recent Activity.
- **Top-to-Bottom Recipe:**
  1. **Flash status** (if `status`): `div role="status" className="rounded-lg border border-success-border bg-success-bg px-4 py-3 text-sm text-success-fg"`.
  2. **Sanction alerts (if present, highest urgency):**
     - `warningSanction`: `<Alert variant="warning">` (replaces `L176` hard-coded amber with no dark mode) + `<Button variant="outline" size="sm" onClick={...}>Acknowledge warning</Button>`.
     - `activeSuspension`: `<Alert variant="destructive">` (replaces `L177` `border-red-300`) showing end time (`tabular-nums`), reason, and contact.
  3. **Greeting + State-Aware Next-Step `<Card>`:**
     - Greeting header: eyebrow `text-xs font-semibold uppercase tracking-wide text-muted-foreground` (`Welcome back`), `h1 text-2xl font-semibold tracking-tight md:text-3xl` (`Complete your CMU Student setup` for unverified student; `Welcome back, {user.name}` otherwise).
     - **State branch body (single concise sentence — NO 3× repetition!):**
       - Admin: short summary + single `Button variant="default" asChild` (`Open admin dashboard`).
       - Active suspension: paused explanation + `Button variant="outline" asChild` (`View account actions` → `/my-sanctions`).
       - Unverified / pending / rejected / more_info student: compact 3-step horizontal checklist (`grid gap-2 sm:grid-cols-3`, using `CircleCheck` in `text-success-fg` for completed steps and `Clock`/`CircleAlert` in `text-warning-fg` for pending/action-needed — fix inaccurate checkmark copy for rejected state so step 3 shows `Update required`!) + discrete progress bar (`w-2/3` or `w-5/6`, no inline `style`) + **single** `Button variant="default" asChild` (`Verify as CMU Student` / `Verify instantly with CMU email`) + secondary `Button variant="outline" asChild` (`Browse tasks (Preview)` when `can_browse_tasks`; `Update submitted details` when rejected/more_info).
       - Unverified faculty/organization: single status sentence + `Button variant="default" asChild` (`Update submitted details`) when rejected/more_info.
       - Verified non-admin: concise subtitle + **2×2 Quick Action tile grid** (`grid grid-cols-2 gap-3` on mobile and desktop) of interactive L1 link cards (`focus-ring flex items-center gap-3 rounded-lg border border-border bg-card p-3.5 text-sm font-semibold shadow-xs transition-colors hover:border-brand/50 hover:bg-muted/40`) with Lucide icons (`Search` Browse tasks, `PlusCircle` Post a task, `FileText` My applications, `Briefcase` My tasks) — shown strictly per permission flags, with `Browse tasks` (or `Post a task` if poster-only) promoted as the single `Button variant="default"` CTA.
  4. **Account verification status row (merged — NO body `<SafetyNotice />`):**
     - **CONFIRMED REMOVAL:** Delete `<SafetyNotice />` (`L207`) from `dashboard.tsx` body (`SiteFooter` keeps `SAFETY_NOTICE` + `PAYMENT_BOUNDARY_NOTICE`).
     - Render one compact `<Card>` (`flex flex-wrap items-center justify-between gap-3 p-4`): `<VerificationStatusBadge status={user.verification_status} />` + single concise line (`text-sm text-muted-foreground` or `text-success-fg` when verified with `formatDate(verifiedAt)` — removes `L183` `text-green-900`) + single action link only if action is needed.
  5. **Ratings waiting for you** (conditional `<Card>`): `h2 text-lg font-semibold`, list of `divide-y divide-border` rows with task title, `<Badge variant="warning" className="tabular-nums">{n} day(s) left</Badge>`, and `<Button variant="outline" size="sm" asChild>Rate your experience</Button>`.
  6. **Recent activity `<Card>`:** Header with `h2 text-lg font-semibold` (`Recent activity`) + `<Button variant="ghost" size="sm" asChild><Link href="/notifications">View all alerts</Link></Button>`. List of alert rows (`divide-y divide-border`), each a `focus-ring flex items-start gap-3 py-3 hover:bg-muted/30` link with unread dot (`size-2 rounded-full bg-brand mt-2 shrink-0` when unread, transparent spacer when read), `Bell` icon (`size-4 text-muted-foreground mt-0.5`), title + body, and `tabular-nums text-xs text-muted-foreground` date. Empty state: centered `py-6 text-center text-sm text-muted-foreground` (`No recent activity yet.`).

### 7.2 `resources/js/pages/notifications/index.tsx` — `FULL JSX REFACTOR ALLOWED`
- **Layout:** `AppLayout` with breadcrumb `[{ title: 'Notifications', href: '/notifications' }]`. Outer `<main className="page-narrow space-y-5">`.
- **Top-to-Bottom Recipe:**
  1. Header row (`flex flex-wrap items-end justify-between gap-3`): `h1 text-2xl font-semibold md:text-3xl` (`Notifications`) + `p text-sm text-muted-foreground tabular-nums` (`{n} unread alert(s)`); right side `<Button variant="outline" size="sm" onClick={...}>Mark all as read</Button>` (shown if `unreadCount > 0`).
  2. Segmented filter tabs (`nav aria-label="Notification filters"`, `inline-flex rounded-lg border border-border bg-muted p-1`): `All` / `Unread` links (`focus-ring rounded-md px-3 py-1.5 text-sm font-semibold` active `bg-card text-foreground shadow-xs`, inactive `text-muted-foreground hover:text-foreground`).
  3. Alert list (`<Card className="divide-y divide-border p-0 overflow-hidden">`): each alert Link has unread dot (`bg-brand` vs spacer), title, body, `<Badge variant="info">Unread</Badge>` (if unread), and `tabular-nums text-xs text-muted-foreground` timestamp.
  4. Empty state: `<Card className="p-8 text-center text-sm text-muted-foreground">` (`You have no unread alerts.` / `You have no alerts yet.`).
  5. Standardized Pagination (§2.4).

### 7.3 `resources/js/pages/sanctions/index.tsx` — `FULL JSX REFACTOR ALLOWED`
- **Layout:** Add `MySanctions.layout = (page) => <AppLayout breadcrumbs={[{ title: 'Account actions', href: '/my-sanctions' }]}>{page}</AppLayout>`. Outer `<main className="page-narrow space-y-5">`.
- **Top-to-Bottom Recipe:** Back link (`Button variant="ghost" size="sm"`) → `h1` `Account actions` → Flash status (`role="status"`) → Active suspension `<Alert variant="destructive">` (replaces `L7` `border-red-300`) → List of sanction `<Card>`s with formatted human-readable type title (`warning` → `Account warning`, `suspension` → `Account suspension`, etc.), `<StatusBadge>` (`active` danger/warning vs `lifted` neutral), reason, `tabular-nums` date line, and `<Button variant="default" size="sm">Acknowledge warning</Button>` when unacknowledged. Empty state: `<Card className="p-8 text-center text-sm text-muted-foreground">There are no account actions to show.</Card>`.

### 7.4 `resources/js/pages/users/show.tsx` — `FULL JSX REFACTOR ALLOWED`
- **Layout:** Outer `<main className="page-narrow space-y-6">`.
- **Top-to-Bottom Recipe:**
  1. Profile header `<Card>`: `h1 text-2xl font-semibold md:text-3xl` (`{displayName}`), role + affiliation (`text-sm text-muted-foreground`), `<VerificationStatusBadge status={profile.verificationStatus} />`, stats line `text-sm text-muted-foreground tabular-nums` (`Member since {date} · {completedTasks} completed tasks`).
  2. `<RatingSummary summary={profile.ratingSummary} />` (renders `RATINGS_NOTICE` **once**).
  3. Server `{notice}` inside a compact `<Alert variant="info">` (if distinct from `RATINGS_NOTICE`).
  4. Conditional `<ProblemReportForm {...problemReport} />`.
  5. `Recent visible feedback` section (`h2 text-lg font-semibold`): list of `<Card>` articles showing task title, `<StarRating score={overall} label="Overall experience" />`, `From {raterName} · {date}`, and comment. **Remove the repeated `{ratingNotice}` from every individual review card** (already shown once in `RatingSummary`). Empty state: `<Card className="p-6 text-center text-sm text-muted-foreground">No visible comments yet.</Card>`.

### 7.5 `resources/js/components/rating-summary.tsx` — `CLASS-ONLY (NO NEW IMPORTS)`
- Keep exact exports (`RatingSummaryData`, `ratingNotice`, `RatingSummary`) and exact asserted string format **`{average} average · {count} ratings`** (do NOT change `"ratings"` to singular — test asserts `4.5 average · 4 ratings` and `Ratings are contextual information`).
- Upgrade container classes to `rounded-xl border border-border bg-card p-4 shadow-xs space-y-2 text-sm`, score row `flex flex-wrap items-center gap-2 font-semibold tabular-nums text-foreground`, notice `border-t border-border pt-2 text-xs text-muted-foreground`.

### 7.6 `resources/js/layouts/settings/layout.tsx` & `resources/js/components/heading.tsx` — `FULL JSX REFACTOR ALLOWED`
- **`heading.tsx`:** Add optional `as?: 'h1' | 'h2' | 'h3'` prop (defaults to `'h2'` so existing callers stay untouched).
- **`layouts/settings/layout.tsx`:**
  - Outer `<div className="page space-y-6">`.
  - `<Heading as="h1" title="Settings" description="Manage your profile and account settings" />`.
  - **Desktop (`lg:`):** `grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)]`. Left `aside` vertical nav (`space-y-1`) with Lucide icons (`User` Profile, `Shield` Security, `Palette` Appearance); active item `bg-accent text-foreground font-semibold border-l-2 border-brand`.
  - **Mobile (`<lg`):** Horizontal scrollable tab strip (`flex gap-1 overflow-x-auto border-b border-border pb-2 lg:hidden`) with `min-h-11` tab links (replaces stacked vertical buttons + `<Separator>`).
  - Right content column: `<section className="max-w-2xl space-y-8">{children}</section>` (removes nested `max-w-xl` inside `md:max-w-2xl`).

### 7.7 Settings Pages & Security/Appearance Feature Components (`FULL JSX REFACTOR ALLOWED`)
- **`resources/js/pages/settings/profile.tsx`:** Wrap in `<Card>` (`CardHeader` + `CardContent`). Add helper text under blank email field (`Leave blank to keep your current email address.`). Upgrade student private info box to `rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground space-y-1.5` (no `text-xs` wall). Single primary `<Button type="submit" disabled={processing}>{processing && <Spinner />}Save</Button>` + inline `recentlySuccessful` `<span role="status" className="text-sm text-success-fg">Saved.</span>`.
- **`resources/js/pages/settings/security.tsx`:** Separate Password, Two-Factor, and Passkeys into **3 distinct L1 `<Card>`s** (`space-y-6`). Password card has `<Spinner />` + `recentlySuccessful` feedback (`Saved.`). Remove template boilerplate comments.
- **`resources/js/components/manage-two-factor.tsx`:** Wrap inside `<Card>`. Show `<StatusBadge tone={twoFactorEnabled ? 'success' : 'neutral'} icon={twoFactorEnabled ? CircleCheck : Circle}>{twoFactorEnabled ? 'Enabled' : 'Not enabled'}</StatusBadge>` in the header row. Keep `Enable 2FA` / `Continue setup` (`variant="default"`) and `Disable 2FA` (`variant="destructive"` with confirm `<Dialog>` or clear processing `<Spinner />`).
- **`resources/js/components/manage-passkeys.tsx` & `resources/js/components/passkey-item.tsx`:** Wrap list in `<Card>`. In `passkey-item.tsx`, replace `text-[11px]` authenticator chip with `<Badge variant="neutral">` (`text-xs` minimum). Keep existing Delete `<Dialog>` intact.
- **`resources/js/pages/settings/appearance.tsx` & `resources/js/components/appearance-tabs.tsx`:**
  - Remove duplicate heading repetition; `<Card>` with `Appearance` title + description.
  - Refactor `appearance-tabs.tsx` from neutral-palette buttons into **3 accessible radio cards** (`role="radiogroup" aria-label="Appearance theme"`, `grid gap-3 sm:grid-cols-3`): **Light** (`Sun`), **Dark** (`Moon`), **System** (`Monitor`).
  - Each card (`type="button" role="radio" aria-checked={active}`): `focus-ring flex flex-col gap-3 rounded-xl border p-4 text-left transition-colors` — selected: `border-2 border-brand bg-info-bg/30 shadow-xs`; unselected: `border-border bg-card hover:bg-muted/40`. Include a crisp CSS mini-preview swatch bar inside each card (`aria-hidden="true"`) + icon + label. **Zero** `neutral-*`/`white`/`black` utilities on UI chrome.

### Section 4 Anti-Patterns to Avoid
1. **Do NOT leave `<SafetyNotice />` in `dashboard.tsx`** — it duplicates `SiteFooter` verbatim.
2. **Do NOT repeat `ratingNotice` inside every review card** on `users/show.tsx` or alter `"4.5 average · 4 ratings"` in `rating-summary.tsx`.
3. **Do NOT use `text-[11px]`** or keep hard-coded `bg-neutral-*` in `appearance-tabs.tsx`.

---

## 8. Section 5 — Discovery, 4-Part Terms Card & Applications

### 8.1 `resources/js/pages/browse/index.tsx` — `FULL JSX REFACTOR ALLOWED`
- **Desktop (`1440×900`) & Mobile (`390×844`):** Outer `<main className="page-wide space-y-6">`.
  - Filter bar: Search-first toolbar card (`rounded-xl border border-border bg-card p-4 shadow-xs`).
    - Desktop (`md:`): Row 1 `flex items-end gap-3`: Search `<Input>` (`flex-1`), Category select, Work mode select, Sort select, `<Button type="submit">Show tasks</Button>` (single primary CTA), `<Button variant="ghost" asChild>Clear filters</Button>`. Collapsible `<details>` (`More filters`) below for Work type + Min/Max budget (`grid gap-3 sm:grid-cols-3`).
    - Mobile (`390px`): Search `<Input>` + primary `<Button type="submit">` on row 1, plus a compact `<details>` disclosure button `"Filters"` (shows `<Badge variant="info">` active count when filters are set) housing Category, Work mode, Sort, Work type, and Min/Max budget so filters never occupy 100% of the mobile viewport on initial load. Keep GET form submission via `router.get(browse.index().url, ...)`.
  - Results grid: `grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3`.
- **Top-to-Bottom Recipe:**
  1. Header: `h1 text-2xl font-semibold md:text-3xl` (`Browse tasks`) + subtitle.
  2. If `!isVerifiedStudent`: `<Alert variant="warning">` (replaces `L61` hard-coded amber) with preview explanation + `<Button size="sm" variant="outline" asChild><Link href={studentVerificationUrl ?? '/verification/student'}>Verify as CMU Student</Link></Button>`.
  3. Search-first Filter `<Card>` (uses `ui/Input`, `ui/Label`, `ui/Button`, and §2.4 styled native `<select>`).
  4. **Task Cards (`<article className="group relative flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-brand/50">`):**
     - **Whole card clickable:** Title `<Link href={browse.show(task.id)} className="focus-ring line-clamp-2 text-lg font-semibold text-foreground after:absolute after:inset-0 group-hover:text-brand">` (eliminates weak `"View task details"` footer link while keeping accessible semantics).
     - Row 1 (meta + applied badge): `flex items-center justify-between gap-2 text-xs text-muted-foreground` showing `{category} · {workTypeLabel}` (`truncate`) + `<ApplicationStatusBadge status="pending" label="Applied" />` if applied.
     - Row 2: 2-line clamped title (`line-clamp-2 min-h-[3.25rem]` on `md:` for uniform card baselines).
     - Row 3: 2-line clamped description preview (`line-clamp-2 text-sm text-muted-foreground`).
     - Row 4 (Pay highlight strip `rounded-lg border border-border bg-muted/40 p-3 flex flex-wrap items-baseline justify-between gap-2 min-h-[3.5rem]`): large `text-xl font-semibold tabular-nums text-foreground` (`₱{formatAmount(budget)}`) or `<ToBeDiscussedBadge label="Pay: To be discussed" />`, paired with `<Badge variant="neutral">{payTimingLabel}</Badge>` or `<ToBeDiscussedBadge label="Timing: To be discussed" />`.
     - Row 5 (Icon-aligned key terms `space-y-1.5 text-xs text-muted-foreground`): `Clock` + schedule summary (or `ToBeDiscussedBadge`), `MapPin` + `{workMode}` (+ workplace name if onsite/hybrid), `Calendar` + `Deadline: {date}` (when present).
     - Footer (`mt-auto flex items-center justify-between gap-2 border-t border-border pt-3`): compact poster name (`text-sm font-semibold truncate`) + `<VerificationStatusBadge status={task.posterVerificationStatus} />`.
  5. Empty state `<Card className="p-10 text-center space-y-3">` (`No tasks match your search` + `<Button variant="outline" asChild>Clear filters</Button>`).
  6. Standardized Pagination (§2.4).

### 8.2 `resources/js/pages/browse/show.tsx` — `CLASS-ONLY (NO NEW IMPORTS)`
> **CRITICAL TEST CONSTRAINTS:** Zero new imports! Strict DOM order **`1. The offer` → `2. The poster` → `3. My classes` → `4. My decision`**. Keep ALL verbatim strings from §4 Table Row #4. Must contain `Workplace` and must NOT contain forbidden work-condition words.

- **Desktop (`1440×900`) & Mobile (`390×844`) Geometry:**
  - Outer: `<main className="page-wide space-y-5 pb-24 lg:pb-8">` (`pb-24` clears mobile sticky action bar).
  - Two-column desktop layout **preserving 1→2→3→4 DOM order via CSS Grid placement**:
    `<div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">`
    - Section 1 (`1. The offer`): `lg:col-start-1`
    - Section 2 (`2. The poster`): `lg:col-start-1`
    - Section 3 (`3. My classes`): `lg:col-start-1`
    - Section 4 (`4. My decision`): `lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:sticky lg:top-[calc(var(--banner-h,0px)+1.5rem)]`
    Because all 4 sections remain direct children in exact DOM order `1, 2, 3, 4`, `schedule-fit.test.mjs` index assertions (`offerIdx < posterIdx < classesIdx < decisionIdx`) pass 100% while desktop users get a sticky right-hand decision rail!
  - **Mobile sticky bottom action bar** (`canApply && !application`, `fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-lg backdrop-blur-xs lg:hidden`): `<div className="mx-auto flex max-w-lg items-center gap-2">` with `<Button type="button" variant="outline" className="flex-1" onClick={handleAskPosterPrefill}>Ask poster</Button>` + `<Button type="button" className="flex-1" onClick={() => document.getElementById('my-decision')?.scrollIntoView({ behavior: 'smooth' })}>Review & apply</Button>`.
- **Top-to-Bottom Recipe:**
  1. **Top notices & header:** Flash `status` (`border-info-border bg-info-bg text-info-fg`), `limitedView` (`border-border bg-muted/40`), `!isVerifiedStudent` preview banner (`border-warning-border bg-warning-bg text-warning-fg` — replaces `L270` amber-*). Header: meta `{category} · {workTypeLabel}`, `h1 text-2xl font-semibold md:text-3xl`, instruction line. Remove redundant `"Go to my decision"` anchor on desktop (`lg:hidden` or rely on mobile sticky bar).
  2. **Section `1. The offer`** (`rounded-xl border border-border bg-card p-5 shadow-xs space-y-5`):
     - Step header with numbered pill `1` + `h2#section-the-offer` `1. The offer` + `<ToBeDiscussedBadge label="{n} term(s) to be discussed" />`.
     - Highlighted Pay & Timing box (`rounded-lg border border-border bg-muted/40 p-4 grid gap-4 sm:grid-cols-2`): `text-2xl font-semibold tabular-nums` ₱ amount (or `ToBeDiscussedBadge`) + pay timing + `PAYMENT_BOUNDARY_NOTICE`.
     - Tasks / Description, Hours (`scheduleSummary` + `canHoursChange` + deadline), Location (`workMode` + `Workplace: ...`), Contact person.
     - Missing terms callout (when `missingTerms.length > 0`): tokenized warning box (`border-warning-border bg-warning-bg text-warning-fg` — replaces `L394` amber-*) + `<Button size="sm" variant="outline">Ask poster about missing terms</Button>`.
  3. **Section `2. The poster`** (`rounded-xl border border-border bg-card p-5 shadow-xs space-y-4`):
     - Step header `2. The poster` + poster name link, account type/affiliation, `<VerificationStatusBadge />`, member since (`tabular-nums`), `<RatingSummary />`.
     - Safety notice (`STUDENT_TASK_SAFETY_NOTICE`) and conditional `offPlatformWarning`: tokenized warning boxes (`border-warning-border bg-warning-bg text-warning-fg` — replaces `L425`, `L427` amber-*).
     - **Pre-acceptance checklist (`Pre-acceptance checklist (3 quick checks)`):** header with `{n} of 3 checked` pill (`rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-semibold tabular-nums`). Render all 3 checkboxes using the §2.4 44px-tap styled native checkbox recipe (`min-h-11`, `size-5` checkbox, clear `(required)` / `(optional)` pills) with `<InputError />` on checks 1 & 2.
     - `<ProblemReportForm />` (when present).
  4. **Section `3. My classes`** (`rounded-xl border border-border bg-card p-5 shadow-xs space-y-4`):
     - Header: `3. My classes` + `<ScheduleFitBadge status={scheduleFit.status} />`.
     - Comparison grid (`grid gap-3 rounded-lg border border-border bg-muted/40 p-4 sm:grid-cols-2`): Offered work hours vs Schedule check result.
     - Conflicts callout (when `conflicts.length > 0`): tokenized danger box (`border-danger-border bg-danger-bg text-danger-fg` — replaces `L522` red-*) + `<Button size="sm" variant="outline">Ask poster to adjust hours</Button>`.
     - **Inline Class Schedule Editor (`My saved weekly class schedule ({count})`):**
       - Replace native `<select id="class_day">` with **7 day toggle chips** (`role="group" aria-label="Class day"`, `flex flex-wrap gap-1.5`): `<button type="button" aria-pressed={selected}>` (`focus-ring min-h-11 md:min-h-9 rounded-md border px-3 text-xs font-semibold` — active `border-brand bg-info-bg text-info-fg`, inactive `border-border bg-card text-foreground hover:bg-muted/40`).
       - Time + Label row (`grid gap-3 sm:grid-cols-3`): Start time (`<Input type="time" />`), End time (`<Input type="time" />`), Optional label (`<Input />`).
       - `blockError`: `text-xs font-semibold text-destructive-foreground` (replaces `L608` `text-red-600`).
       - Saved blocks list (`flex flex-wrap gap-2`): chips with `tabular-nums` time ranges and `size-7 rounded-full` remove button `×` (`hover:bg-danger-bg hover:text-danger-fg`).
       - Saved status text: `text-xs font-semibold text-success-fg` (replaces `L619` `text-emerald-700 dark:text-emerald-300`).
  5. **Section `4. My decision`** (`id="my-decision"`, `rounded-xl border border-border bg-card p-5 shadow-xs space-y-4`):
     - Remove duplicate `"Ask poster"` button from the Section 4 header (keep the single `"Ask poster"` button in the main action row below the form).
     - Replace `reviewNotice` (`L699`), summary missing-terms (`L768`), and summary clash (`L774`) hard-coded amber/red boxes with `border-warning-border bg-warning-bg text-warning-fg` and `border-danger-border bg-danger-bg text-danger-fg`.
     - Primary CTA: `<Button type="button">` **`Review & apply`** (step 1) → `<Button type="submit">` **`Confirm & submit application`** (step 2, with `min-h-11` styled checkbox for `work_details_confirmed`). Secondary: `<Button variant="outline">Ask poster</Button>`. Tertiary: `<Button variant="ghost" asChild>Decline (back to tasks)</Button>`.
     - Preserve Variants A (submitted), B (`canApply`), and C (`!isVerifiedStudent`).

### 8.3 `resources/js/pages/applications/index.tsx` — `CLASS-ONLY (NO NEW IMPORTS)`
- **Desktop (`1440×900`) & Mobile (`390×844`):** Outer `<main className="page-wide space-y-6">`.
  - **Desktop (`hidden md:block`):** Dense standardized `<table>` (§2.4) with columns: `Task & Poster`, `Pay & Hours`, `Status & Next step`, `Applied`, `Actions`.
  - **Mobile (`grid gap-3 md:hidden`):** Card stack (`rounded-xl border border-border bg-card p-4 shadow-xs space-y-3`).
- **Top-to-Bottom Recipe:** Format JSX cleanly across lines (no minified 2-line blob). Header (`h1` `My applications` + subtitle) → Flash `status` → Responsive table/card list preserving ALL 3 verbatim asserted strings (`Your application stays active until an agreement is confirmed`, `Review the agreement and confirm the same version before work begins`, `View agreement`), `<ApplicationStatusBadge />`, `<PaymentStatusBadge />`, `<ToBeDiscussedBadge />`, and `tabular-nums` pay/dates → Single primary CTA per row: `View agreement` (`Button size="sm"` default when `agreementId` exists); all other row actions (`View task details`, `Message poster`, `Rate your experience`, `Withdraw`) use `variant="outline"` (or `variant="destructive"` for `Withdraw` with `window.confirm`). Empty state: centered L1 card with single primary `<Button asChild>Browse tasks</Button>`. Pagination normalized without `dangerouslySetInnerHTML`.

### 8.4 `resources/js/components/problem-report-form.tsx` — `FULL JSX REFACTOR ALLOWED`
- Replace minified `<details>` with a clean collapsible `<details className="rounded-xl border border-border bg-card p-4 shadow-xs">` with `Flag` icon + summary `{reportLabel}` (`focus-ring flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold md:min-h-8`).
- Add proper `id`/`htmlFor` `<Label>` pairs for Report type (§2.4 styled native `<select>`), What happened (`<Textarea>`), and Evidence (`<Input type="file">` with file styling). Render `<InputError />` for `errors.type`, `errors.description`, `errors.evidence`, and `errors['evidence.0']` (fixing silent validation errors).
- Show `<Spinner />` + `Submitting report...` while processing on `<Button type="submit" variant="destructive">Submit report</Button>`.

### Section 5 Anti-Patterns to Avoid
1. **NEVER break `1 -> 2 -> 3 -> 4` DOM order** in `browse/show.tsx` — use CSS Grid placement (`lg:col-start-2 lg:row-start-1 lg:row-span-3`), never move Section 4 earlier in JSX.
2. **NEVER add imports to `browse/show.tsx` or `applications/index.tsx`** — zero Lucide icons, zero `Card`/`Alert`/`Checkbox` imports.
3. **No full-height filter card on `390px` mobile** in `browse/index.tsx` — search first, secondary filters collapsed into `"Filters"` disclosure.

---

## 9. Section 6 — Poster Task Management

### 9.1 `resources/js/components/task-form.tsx` — `CLASS-ONLY (NO NEW IMPORTS)`
> **CRITICAL TEST CONSTRAINTS:** Zero new imports! Keep ALL 14 verbatim labels/strings from §4 Table Row #6 and ZERO forbidden `name=` fields.

- **Desktop & Mobile Geometry:** `<Form {...action} className="space-y-6 pb-20 md:pb-0">` (bottom padding clears sticky mobile submit bar).
- **Top-to-Bottom Grouped Numbered Sections (5 L1 cards `rounded-xl border border-border bg-card p-5 shadow-xs space-y-4`):**
  1. **Reset warning (when `resetWarning`):** Replace `L76` hard-coded amber with `<div role="alert" className="rounded-lg border border-warning-border bg-warning-bg px-4 py-3 text-sm text-warning-fg">`.
  2. **Section `1. Task basics`:** Numbered pill `1` + `h2 text-lg font-semibold` (`Task basics`). Fields: `Task title`, 2-col grid (`grid gap-4 sm:grid-cols-2`) for `Category` + `Work type` (§2.4 styled native `<select>`), `What needs to be done?` (`<Textarea>` + `text-xs text-muted-foreground` helper).
  3. **Section `2. Pay`:** Numbered pill `2` + `h2` (`Pay`). `Estimated budget (PHP)` (`tabular-nums`) paired with 44px-tap styled checkbox row (`Pay amount is to be discussed`), `When is pay given? (Pay timing)` (§2.4 styled native `<select>`), **add visible `<Label htmlFor="pay_timing_note">Pay timing note (optional)</Label>`** above `pay_timing_note`, and `PAYMENT_BOUNDARY_NOTICE` in muted inset.
  4. **Section `3. Schedule`:** Numbered pill `3` + `h2` (`Work schedule / hours`). Schedule mode 3 radio-pill cards (`min-h-11 md:min-h-9`, selected `border-brand bg-info-bg/40 text-foreground font-semibold`), Work days 7 toggle chips (`min-h-11 md:min-h-9`, selected `border-brand bg-info-bg text-info-fg font-semibold`), 2-col Start/End time `<Input type="time" />`, `Can hours change?` (§2.4 styled native `<select>`), `Schedule note (optional)`.
  5. **Section `4. Location & deadline`:** Numbered pill `4` + `h2` (`Work setup`). `Work mode` (§2.4 styled native `<select>`), conditional onsite/hybrid workplace inset (`Workplace name`, `Workplace address`), `Deadline (optional)` (`<Input type="date" />`).
  6. **Section `5. Confirm & submit`:** Numbered pill `5` + `h2` (`Platform rules`). Guidelines inset card + 44px-tap styled checkbox row (`I confirm that this task follows the platform rules.`).
  7. **Submit bar:** Desktop inline right-aligned; mobile sticky bottom bar (`fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-lg md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none`). Single primary CTA: `<Button type="submit" className="w-full md:w-auto" disabled={processing}>{processing ? 'Saving...' : task ? 'Save changes' : 'Submit task for review'}</Button>`.

### 9.2 `resources/js/pages/tasks/create.tsx` & `resources/js/pages/tasks/edit.tsx` — `FULL JSX REFACTOR ALLOWED`
- **Desktop (`1440×900`) & Mobile (`390×844`):** Outer `<main className="page-wide space-y-6">`. Two-column layout on desktop: `grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start`.
- **Left column:** Page header (`h1 text-2xl font-semibold md:text-3xl` + subtitle) + `<TaskForm ... />`.
- **Right column (lives in `create.tsx` / `edit.tsx` — NOT inside tested `task-form.tsx`):** Sticky `<aside className="lg:sticky lg:top-[calc(var(--banner-h,0px)+1.5rem)] space-y-4">` containing a **"How students will see it"** `<Card>` showing the 4-part student Terms Card checklist preview (`1. The offer`, `2. The poster`, `3. My classes`, `4. My decision`) with icons (`CircleCheck`, `Clock`, `ShieldCheck`), explaining that tasks with clear pay, timing, and schedule hours let students verify class-schedule fit immediately, and reminding posters that every new/edited task is reviewed by an administrator before going live. (On `edit.tsx`, clean up unused legacy fields from local `TaskData` type without changing submission payload.)

### 9.3 `resources/js/pages/tasks/mine.tsx` — `FULL JSX REFACTOR ALLOWED`
- **Desktop & Mobile Geometry:** Outer `<main className="page-wide space-y-6">`.
- **Top-to-Bottom Recipe:**
  1. Header row (`flex flex-wrap items-center justify-between gap-3`): `h1 text-2xl font-semibold md:text-3xl` (`My tasks`) + subtitle + single primary `<Button asChild><Link href={create()}>Post a task</Link></Button>`.
  2. Flash `status` (`border-info-border bg-info-bg text-info-fg`).
  3. **Client-side status filter tabs with counts** (computed from `tasks.data` for quick triage on the current page: `All`, `Pending review`, `Active / Approved`, `Changes requested`, `Completed / Closed`) in `flex gap-1.5 overflow-x-auto pb-1`.
  4. **Task Cards (`grid gap-4 md:grid-cols-2`):** Clean L1 `<Card>` per task: header with `h2 text-lg font-semibold` + `<TaskStatusBadge />` + optional `<PaymentStatusBadge />`; meta `{category} · {workMode}`; pay strip (`tabular-nums` ₱ or `<ToBeDiscussedBadge />` + pay timing); schedule line + `Posted {date} · {applicantsCount} applicants` (`tabular-nums`); review note `<Alert variant="warning">` (replaces `L14` hard-coded amber with no dark mode); action footer with `View` (`outline sm`), `Edit` (`outline sm`), `Rate your experience` (`outline sm`), and **Cancel** (`Button variant="ghost" size="sm" className="text-destructive-foreground"` opening a `<Dialog>` confirmation with `<Button variant="destructive">` inside — replaces `window.confirm`!).
  5. Empty state `<Card className="p-10 text-center space-y-3">` + Standardized Pagination (§2.4).

### 9.4 `resources/js/pages/tasks/show.tsx` — `FULL JSX REFACTOR ALLOWED` *(Source-Regex Checked)*
> **SOURCE-REGEX RULE:** Must contain `Workplace`; must NOT contain `Work conditions`, `Safety answers`, `Physical demand`, `Academic involvement`, `Hazards involved`, `Private or isolated one-on-one meeting required`.

- **Desktop & Mobile Geometry:** Outer `<main className="page space-y-6">`. Desktop 2-col `grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start` (Left: Task details, Schedule & Workplace, Compensation, Applicants; Right sticky rail: Status & Next Action card, Agreement card, Owner actions).
- **Top-to-Bottom Recipe:**
  1. Format minified lines cleanly across lines. Flash `status`.
  2. Header: Back to `My tasks` link, meta `{category} · {workTypeLabel}`, `h1 text-2xl font-semibold md:text-3xl`, `<TaskStatusBadge />`.
  3. **All 5 hard-coded alerts replaced (`L79`, `L80`, `L88`, `L95`, `L96`):** Review note / off-platform / active-applicants → `<Alert variant="warning">`; Removal alert → `<Alert variant="destructive">`.
  4. **Next-Action & Agreement card:** Single primary CTA per state: `Propose agreement` (`Button variant="default"`) when `canProposeAgreement`, OR `View agreement` (`Button variant="default"`) when `agreement` exists, OR `Edit task` (`Button variant="default"`) when editable with no applicants. **Cancel task** uses `<Button variant="destructive">` inside a confirmation `<Dialog>` (replaces `window.confirm`).
  5. **Applicants `<Card>`:** Always show section heading `Applicants ({n})`; if empty and task is approved/assigned, show concise empty state (`No applicants yet.`). Each applicant card cleanly separates identity (`Link` + `<VerificationStatusBadge />` + `<RatingSummary />`), application message + suggested amount (`tabular-nums`), and action row (`Accept` `default sm`, `Decline` `outline sm`, `Message applicant` `outline sm`, `Report this applicant` collapsible).

### Section 6 Anti-Patterns to Avoid
1. **Do NOT put the preview sidebar inside `task-form.tsx`** — it breaks `task-form.test.mjs`'s strict import allowlist; keep it in `tasks/create.tsx` and `tasks/edit.tsx`.
2. **Do NOT leave hard-coded `bg-amber-50` / `bg-red-50` alerts** in `tasks/mine.tsx` or `tasks/show.tsx` — they lack dark-mode support.
3. **Do NOT use `window.confirm`** on `tasks/mine.tsx` or `tasks/show.tsx` — use `<Dialog>` with `<Button variant="destructive">`.

---

## 10. Section 7 — Agreements, Messaging, Ratings & Reports

### 10.1 `resources/js/pages/agreements/create.tsx` — `FULL JSX REFACTOR ALLOWED`
- **Desktop & Mobile Geometry:** Outer `<main className="page-narrow space-y-6 print:max-w-none print:p-0">`.
- **Top-to-Bottom Recipe:**
  1. Header: `<Button variant="ghost" size="sm" asChild>Back to task</Button>`, `h1 text-2xl font-semibold md:text-3xl` (`Propose agreement`), subtitle `For {task.title} with {workerName}`.
  2. **Consolidate 3 stacked pre-form notices** into ONE concise `<Alert variant="info">` (`Before work begins` — records what both parties agree; work begins only after both confirm the same version) + ONE compact `"Terms from the task listing"` `<Card>` (`<dl className="grid gap-3 sm:grid-cols-2 text-sm">` with `<ToBeDiscussedBadge />` and `tabular-nums` pay). Replace `L82` hard-coded amber unsettled-terms alert with `<Alert variant="warning">`.
  3. Proposal `<Card>` wrapping `<Form {...agreements.store.form(task.id)} className="space-y-5">`: use `<Label>` (replacing native `<label>`), clean 2-col grid for `Final amount (₱)`, `Start date (optional)`, `Due date`, full-width `Deliverables`, `Terms and agreed work hours`, `Payment arrangement and timing between you`, `Note for the worker (optional)`.
  4. Action row: single primary `<Button type="submit" disabled={processing}>{processing && <Spinner />}Send proposal</Button>` + `<Button variant="outline" asChild>Cancel</Button>`. Payment boundary caption below.

### 10.2 `resources/js/pages/agreements/show.tsx` — `FULL JSX REFACTOR ALLOWED`
- **Desktop & Mobile Geometry:** Outer fragment: `<div className="page pb-0 space-y-4 print:hidden">` holding flash `status`, off-platform `<Alert variant="warning">` (replaces `L6` hard-coded amber with no dark mode), and `<ProblemReportForm />` (removes 3 repeated `max-w-4xl` wrappers), followed by `<AgreementDetails {...props} />`.

### 10.3 `resources/js/components/agreement-details.tsx` — `CLASS-ONLY (NO NEW IMPORTS)`
> **CRITICAL TEST CONSTRAINTS:** Zero new imports (`Printer` is the ONLY allowed Lucide icon). Keep ALL 5 verbatim strings and ALL 9 `for`/`id` pairs (`revise-deliverables`, `revise-terms`, `revise-final-amount`, `revise-start-date`, `revise-due-date`, `revise-payment-arrangement`, `revise-comment`, `send-back-body`, `cancel-reason`) intact.

- **Document-Style Layout (`1440×900` & `390×844`):**
  - Outer `<article className="page space-y-6 print:max-w-none print:space-y-4 print:p-0 print:bg-white print:text-black">`.
  - **Document Sheet Header (`rounded-xl border border-border bg-card p-5 shadow-xs md:p-6 print:rounded-none print:border-0 print:border-b print:border-black print:p-0 print:pb-4 print:shadow-none`):**
    - Top bar: eyebrow `TASKMATE AGREEMENT RECORD` (`text-xs font-semibold tracking-wider uppercase text-muted-foreground`), `h1 text-2xl font-semibold md:text-3xl` (`Agreement for {task.title}`), parties metadata row (`Poster` link · `Worker` link), right-aligned `<AgreementStatusBadge />` + `<Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden"><Printer className="size-4" />Print or save as PDF</Button>`.
    - **Print-only status line** (`hidden print:block mt-2 text-xs font-semibold uppercase`): `Status: {agreement.statusLabel}` (+ `Record reference: {agreement.recordReference}` when locked).
  - **Status & Two-Party Confirmation Banner:**
    - Agreed: tokenized `rounded-xl border border-success-border bg-success-bg p-5 text-success-fg print:rounded-none print:border print:border-black print:bg-white print:text-black` (replaces `L39` hard-coded green-*), showing confirmation date (`tabular-nums`) and `font-mono break-all` record reference.
    - Cancelled: tokenized `rounded-xl border border-neutral-border bg-neutral-bg p-5 text-neutral-fg print:bg-white print:text-black` with reason + `outline` button.
    - Negotiating guidance: `rounded-xl border border-info-border bg-info-bg p-4 text-sm text-info-fg print:hidden` (preserving verbatim `Review the work, amount, dates, and payment arrangement` and `both people confirm the same version`).
  - **Current Proposal Document Section (`rounded-xl border border-border bg-card p-5 shadow-xs md:p-6 space-y-5 print:rounded-none print:border print:border-black/40 print:p-4 print:shadow-none print:break-inside-avoid`):**
    - `WorkTerms` rendered as clean structured `<dl className="grid gap-4 sm:grid-cols-2 text-sm">` with `tabular-nums` final amount (`text-xl font-semibold`) and dates.
    - **Two-party confirmation strip (`grid gap-3 border-t border-border pt-4 sm:grid-cols-2`):** Two confirmation tiles (`rounded-lg border p-3.5 text-sm`): confirmed party gets `border-success-border bg-success-bg/60 text-success-fg print:border-black print:bg-white print:text-black` with `✓ Confirmed {dt}`; waiting party gets `border-warning-border bg-warning-bg/60 text-warning-fg print:border-black/40 print:bg-white print:text-black` with `Waiting for confirmation`.
  - **Review & Respond (`print:hidden`, `rounded-xl border border-border bg-card p-5 shadow-xs space-y-4`):**
    - Primary CTA: `<Button type="submit">I agree to these terms</Button>` (only primary CTA on page).
    - Three clean `<details>` disclosures (`rounded-lg border border-border bg-muted/20 p-4`): `Propose different terms` (all 7 `revise-*` `for`/`id` pairs in 2-col grid on `sm:`), `Ask for a change` (`send-back-body`), and `Cancel and reopen the task` (`border-danger-border bg-danger-bg/30`, summary `text-danger-fg` — replaces `L45` `border-red-200 text-red-800`, `cancel-reason`, `<Button variant="destructive">Cancel agreement</Button>`).
  - **Version History Timeline:** Vertical left-rail timeline (`border-l-2 border-border pl-4 space-y-4`) with `print:break-inside-avoid` per version.
  - **Ratings & `<CompletionPaymentPanel />` & Messages:** Clean L1 cards; footer legal notice `text-xs text-muted-foreground print:text-black`.
- **Exact `@media print` Contract (`app.css` + `agreements/show.tsx` + `agreement-details.tsx` + `completion-payment-panel.tsx`):**
  - `resources/css/app.css` already resets `:root, .dark` variables to `#fff` background / `#000` ink, `@page { margin: 18mm; }`, strips shadows, collapses `[data-slot="sidebar-inset"]`, and sets `break-inside: avoid` on `section, article, tr`.
  - In JSX, apply `print:hidden` to: all flash/report chrome in `agreements/show.tsx`, Print button, `Review and respond` forms, `What happens next` banner, and all interactive forms in `completion-payment-panel.tsx`.
  - Apply `print:max-w-none print:p-0 print:bg-white print:text-black` on the agreement container and `print:border print:border-black/40 print:bg-white print:text-black print:shadow-none print:break-inside-avoid` on every document card/badge so Dark Mode **never** prints dark fills or invisible white text.

### 10.4 `resources/js/components/completion-payment-panel.tsx` — `FULL JSX REFACTOR ALLOWED`
- Un-minify JSX cleanly. Replace all hard-coded colors (`L23` `text-green-800` → `text-success-fg`; `L24`/`L29` `amber-*` → `<Alert variant="warning">` / `border-warning-border bg-warning-bg text-warning-fg`; `L28` `border-red-200` → `border-danger-border bg-danger-bg/30`).
- Replace `sr-only`-only labels on delivery note, completion note, and non-payment description/evidence with visible `<Label>` elements so fields are clear without relying on placeholders.
- Keep `print:break-inside-avoid` on the outer `<section>` and `print:hidden` on every interactive form block (`L22`, `L25`, `L26`, `L28`). Use `tabular-nums` on every PHP amount and date.

### 10.5 `resources/js/pages/messages/index.tsx` & `resources/js/pages/messages/show.tsx` — `FULL JSX REFACTOR ALLOWED`
- **`messages/index.tsx`:** Breadcrumb `[{ title: 'Messages', href: '/messages' }]`. Outer `<main className="page space-y-5">`. Header `h1` `Messages` + subtitle. Thread list inside `<Card className="divide-y divide-border p-0 overflow-hidden">`: each Link row (`focus-ring flex items-start justify-between gap-4 p-4 hover:bg-muted/40`) shows other person's name + `<VerificationStatusBadge />`, task title (`text-xs text-muted-foreground`), 2-line preview, `<StatusBadge>` (`Open` info, `Read-only` neutral, `Closed` neutral/closed — replaces ad hoc span), `<Badge variant="default" className="tabular-nums">{n} unread</Badge>`, and `tabular-nums` timestamp. Empty state `<Card className="p-10 text-center">`. Standardized Pagination (§2.4).
- **`messages/show.tsx`:** Breadcrumb `[{ title: 'Messages', href: '/messages' }, { title: taskTitle, href: '#' }]`.
  - **Desktop (`1440×900`):** `<main className="page grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">` — Left column: sticky thread header + scrollable message stream (`max-h-[calc(100svh-18rem)] min-h-72 overflow-y-auto rounded-xl border border-border bg-card p-4 space-y-3`) + sticky composer; Right column (`hidden lg:block sticky top-[calc(var(--banner-h,0px)+1.5rem)]`): Conversation Info `<Card>` (other party profile, `<VerificationStatusBadge />`, task title, privacy notice, Close/Reopen controls).
  - **Mobile (`390×844`):** Push-style full-height stack: compact header with `Back to messages` + other person + `<VerificationStatusBadge />`, collapsible/compact info strip, message bubbles (`max-w-[85%]`, own bubbles `ml-auto rounded-2xl rounded-br-sm border border-brand/25 bg-info-bg/50 text-foreground`, incoming bubbles `mr-auto rounded-2xl rounded-bl-sm border border-border bg-card text-foreground`), and **sticky bottom composer** (`sticky bottom-0 z-20 border-t border-border bg-card/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xs`).
  - **Fixes:** Replace hard-coded `border-blue-200 bg-blue-50 text-blue-950` (`L70`) with `<Alert variant="info">` and `amber-*` flag notice with `<Alert variant="warning">`. Replace `window.confirm` on `Close conversation` with a `<Dialog>` confirmation. Move per-message `<ProblemReportForm />` behind a subtle collapsed trigger (`Report` ghost link) so bubbles stay clean. Single primary CTA: `<Button type="submit" disabled={processing}>{processing ? 'Sending…' : 'Send message'}</Button>`.

### 10.6 `resources/js/pages/ratings/create.tsx` — `FULL JSX REFACTOR ALLOWED`
- **Desktop & Mobile Geometry:** Outer `<main className="page-narrow space-y-6">`.
- **Top-to-Bottom Recipe:**
  1. Header: `h1` `Rate your experience` + subtitle (`Your feedback about {rateeName} and “{taskTitle}”`).
  2. Context summary `<Card className="p-4 flex flex-wrap items-center justify-between gap-3 text-sm">`: `Agreed amount: ₱...` (`tabular-nums`) + `<PaymentStatusBadge status={agreement.paymentStatus} label={agreement.paymentStatusLabel ?? agreement.paymentStatus} />` (fixes raw payment status!).
  3. Info notice (`ratingNotice`) + `<Alert variant="warning">` (replaces `L13` hard-coded amber) linking to the report flow.
  4. **Interactive 44px Star Rating Controls (replaces native `<select>` 1–5 dropdowns):**
     - For each dimension (`scores[{key}]`) and `Overall experience` (`overall_experience`), build an accessible `role="radiogroup"` with 5 `<label>`/`<input type="radio" className="sr-only" name={...} value={n} required />` star buttons (`size-11 md:size-10 inline-flex items-center justify-center rounded-md focus-within:ring-2 focus-within:ring-ring`), rendering filled `Star` icons (`text-warning-fg fill-current`) for `<= selected` and outline `Star` (`text-muted-foreground`) above, plus live `tabular-nums text-xs text-muted-foreground` (`{val} / 5`). Preserves exact `scores[{key}]` and `overall_experience` form names!
  5. Optional comment `<Textarea id="rating-comment" name="comment" />` with `<Label htmlFor="rating-comment">Comment (optional)</Label>`, visibility note, and single primary `<Button type="submit" disabled={processing}>{processing && <Spinner />}Submit rating</Button>` (adds explicit `type="submit"`).

### 10.7 `resources/js/pages/reports/index.tsx`, `resources/js/pages/reports/show.tsx`, `resources/js/components/report-details.tsx` — `FULL JSX REFACTOR ALLOWED`
- **`reports/index.tsx`:** `<main className="page space-y-5">`. Header with `h1` `My reports` + subtitle `Track reports you have filed or received and read administrator updates.` → `<Alert variant="info">{COMPLETION_PAYMENT_NOTICE}</Alert>` → Flash `status` → Desktop table (`hidden md:block`) / Mobile cards (`grid gap-3 md:hidden`) with `<ReportStatusBadge />`, `tabular-nums` date, and `<Button variant="outline" size="sm" asChild>View</Button>` → Standardized Pagination with `aria-label="Report pages"` and active page highlight.
- **`reports/show.tsx`:** `<main className="page space-y-5">`. Render `<ReportDetails />` FIRST so `h1 Report #{id}` is at the top of the visual hierarchy (fixes notice-above-h1 issue), with target review time + `COMPLETION_PAYMENT_NOTICE` as a compact `<Alert variant="info">` directly below the header and `contactLine` at bottom.
- **`components/report-details.tsx`:** Remove unused `Link` import. Replace all hard-coded amber colors (`L36`, `L39`, `L44`) with `border-warning-border bg-warning-bg text-warning-fg` / `text-warning-fg`. Convert raw key/value dump (`L33`) and agreement version text walls (`L35`) into structured `<dl className="grid gap-3 sm:grid-cols-2 text-sm">` cards. Add visible `<Label htmlFor="reply-body">Your response</Label>` and `<Label htmlFor="reply-evidence">Evidence files (optional)</Label>` with matching `id`s on the reply form (`L44`), and single primary `<Button type="submit" disabled={processing}>{processing && <Spinner />}Add response</Button>`.

### Section 7 Anti-Patterns to Avoid
1. **NEVER print dark backgrounds or light text** on `agreements/show.tsx` — always pair status banners with `print:bg-white print:text-black print:border-black/40` and `print:hidden` on interactive forms.
2. **NEVER drop or rename any of the 9 `for`/`id` pairs** in `agreement-details.tsx` or import a second Lucide icon into `agreement-details.tsx`.
3. **No native `<select>` for 1–5 star scores** on `ratings/create.tsx` and no `window.confirm` on `messages/show.tsx`.

---

## 11. Section 8 — Admin Moderation Suite

> Note: `AdminLayout` already wraps page content in `<div className="page-wide">`. Admin pages MUST NOT add a second nested `page-wide`, `max-w-*`, or `<main>` wrapper (fix nested `<main>` in `flags/index.tsx` and `flags/show.tsx`).

### 11.1 `resources/js/layouts/admin-layout.tsx` — `CLASS-ONLY (NO NEW IMPORTS)`
- Keep all 6 imports and `showMessages={false}` intact. Ensure `<div className="page-wide space-y-6">` provides clean vertical rhythm and `<SiteFooter />` carries `print:hidden`.

### 11.2 `resources/js/components/admin-sidebar.tsx` — `CLASS-ONLY (NO NEW IMPORTS)`
- Keep the exact 6 Lucide icons (`BriefcaseBusiness`, `Flag`, `LayoutDashboard`, `ShieldCheck`, `Star`, `Users`) and `aria-label="Administration"` + all 8 asserted labels verbatim. Polish header spacing so `"Administration"` label is visually distinct from the nav group label without changing any asserted text.

### 11.3 `resources/js/pages/admin/dashboard.tsx` — `CLASS-ONLY (NO NEW IMPORTS)`
> **CRITICAL TEST CONSTRAINTS:** Zero new imports (`Head`, `Link`, `AdminLayout`, `VerificationStatusBadge`, `admin` ONLY). Keep verbatim `"Latest tasks awaiting review"`, task link `href="/admin/tasks/{id}"`, and `href="/admin/tasks?status=pending_review"`.

- **Desktop (`1440×900`) & Mobile (`390×844`):** Outer `<div className="space-y-8">`.
- **Top-to-Bottom Recipe:**
  1. Header: `h1 text-2xl font-semibold md:text-3xl` (`Admin dashboard`) + subtitle.
  2. **Verification KPI tiles** (`grid grid-cols-2 gap-4 lg:grid-cols-4`): L1 cards (`rounded-xl border border-border bg-card p-4 shadow-xs`) with label, `<VerificationStatusBadge />`, and `mt-3 text-3xl font-semibold tabular-nums`.
  3. **Moderation Queue KPI strip** (`grid grid-cols-2 gap-4 lg:grid-cols-4`): unify Task review + Report counts + Safety/Account action Link cards into clean L1 interactive cards (`focus-ring rounded-xl border border-border bg-card p-4 shadow-xs transition-colors hover:border-brand/50 hover:bg-muted/30`) with `tabular-nums text-3xl font-semibold`.
  4. **Latest tasks awaiting review:** Section header (`h2 text-lg font-semibold` `Latest tasks awaiting review` + subtitle + `Review all` link → `admin.tasks.index({ query: { status: 'pending_review' } })`). Desktop `hidden md:block` dense table (§2.4) + Mobile `grid gap-3 md:hidden` cards. Empty state: `No tasks are waiting for review.`
  5. **Recent admin actions:** Header (`Recent admin actions` + `Review users` link). Desktop `hidden md:block` dense table + Mobile `grid gap-3 md:hidden` cards, with `tabular-nums` timestamps and formatted action labels. Empty state: `No admin actions have been recorded yet.`

### 11.4 `resources/js/pages/admin/tasks/show.tsx` — `CLASS-ONLY (NO NEW IMPORTS)`
> **CRITICAL TEST CONSTRAINTS:** Zero new imports! Keep ALL verbatim strings from §4 Table Row #12 (`Every submitted task is reviewed by an administrator`, `No applications have been submitted`, `No off-platform content flags have been recorded`, `Workplace`). Must NOT contain `Risk level`, `Screening breakdown`, `Score:`, `>Agreement<` (when absent), or forbidden work-condition strings.

- **Desktop (`1440×900`) & Mobile (`390×844`):**
  - Outer `<div className="space-y-6">`.
  - Two-column desktop layout: `<div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">`:
    - Left (`space-y-6`): Task details (`<dl className="grid gap-4 sm:grid-cols-2 text-sm">` replacing `<strong>` paragraph wall), Workplace details, Off-platform content flags, Agreement (conditional) + `<CompletionPaymentPanel readOnly />`, Applications, Admin action history.
    - Right sticky rail (`lg:sticky lg:top-[calc(var(--banner-h,0px)+1.5rem)] space-y-4`): Poster summary card + **Review decision** panel (when `canReview` — stacked vertically inside sticky rail: `Approve task` `Button variant="default"`, `Request changes` `Button variant="outline"`, `Reject task` `Button variant="destructive"` with required note `<Textarea>`).
  - Replace native `<textarea>` in the `Close task` form with the already-imported `<Textarea>` and switch `Close task` button to `<Button variant="destructive">Close task</Button>`.

### 11.5 Admin Queue Index Pages (`FULL JSX REFACTOR ALLOWED`)
All five queue index pages follow the **exact same layout recipe** inside `AdminLayout`'s `page-wide`:
- Header (`h1 text-2xl font-semibold md:text-3xl` + subtitle) → Optional context `<Alert variant="info">` → Filter `<Card>` (`grid gap-3 sm:grid-cols-2 lg:grid-cols-4` using `ui/Input`, `ui/Label`, §2.4 styled native `<select>`, and single primary `<Button type="submit">Apply filters</Button>`) → Desktop sticky-header dense table (`hidden md:block`, §2.4) + Mobile stacked cards (`grid gap-3 md:hidden`) → Standardized Pagination (§2.4).
- **`resources/js/pages/admin/users/index.tsx`:** Accessible `<Label>`s, `VerificationStatusBadge`, `tabular-nums` registered date, `"Showing {from}–{to} of {total} accounts"` above pagination.
- **`resources/js/pages/admin/tasks/index.tsx`:** Un-minify; format `workMode` label cleanly; `TaskStatusBadge`; consistent primary `Apply filters` button.
- **`resources/js/pages/admin/reports/index.tsx`:** Un-minify; render `Escalated` as `<Badge variant="danger">Escalated</Badge>` and `High` priority as `<Badge variant="warning">High</Badge>` (`neutral` for Normal); `ReportStatusBadge`; active pagination state.
- **`resources/js/pages/admin/flags/index.tsx`:** Remove nested `<main>`; add subtitle; add `<Label>`s on category/status selects; render `<StatusBadge>` for flag status (`open` warning, `reviewed` success, `dismissed` neutral); **render missing pagination** using `flags.links` (§2.4).
- **`resources/js/pages/admin/ratings/index.tsx`:** Fix missing input heights (`ui/Input`), render Hidden/Visible via `<StatusBadge>` (`Hidden` warning, `Visible` success), `tabular-nums` scores, fix pagination to preserve disabled/active states.

### 11.6 Admin Detail & Moderation Decision Pages (`FULL JSX REFACTOR ALLOWED`)
All detail pages follow a **2-column desktop layout (`lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start`)** with a **sticky right-hand Moderation Decision & Sanction Rail** and **confirm `<Dialog>`s on every destructive action** (Reject account, Suspend user, Ban user, Remove post, Lift sanction, Dismiss report, Dismiss flag, Hide rating):
- **`resources/js/pages/admin/users/show.tsx`:**
  - Replace `L70` hard-coded amber notice with `<Alert variant="warning">`.
  - Left column: Submitted details `<dl>` card, Account history timeline card, Ratings received/given card, Sanctions record card.
  - Right sticky rail: Review decision card (`Approve account` `default`, `Request more information` `outline`, `Reject account` `destructive` + confirm `<Dialog>` with required note) + Sanction card using `ui/Label`, `ui/Textarea`, §2.4 styled `<select>`, **conditionally displaying `task_id` ONLY when `action === 'remove_post'` and `ends_at` ONLY when `action === 'suspend'`** (fixes cluttered irrelevant fields!), and confirm `<Dialog>` for Suspend/Ban/Remove post + Lift sanction.
- **`resources/js/pages/admin/agreements/show.tsx`:** Add `<Button variant="ghost" size="sm" asChild className="print:hidden"><Link href={admin.tasks.index()}>Back to tasks</Link></Button>` above `<AgreementDetails {...props} readOnly />`.
- **`resources/js/pages/admin/reports/show.tsx`:** Replace `L14` hard-coded amber (no dark mode, no text color) with `<Alert variant="warning">{notice}</Alert>`. Left column: `<ReportDetails report={report} />` + escalation callout. Right sticky rail: Decision forms with visible `<Label>`s, unique `id`s (`report-outcome`), `<InputError />`, confirm `<Dialog>` on `Dismiss report` (`destructive`), and clean Sanction form (confirm `<Dialog>` on Suspend/Ban/Remove post).
- **`resources/js/pages/admin/flags/show.tsx`:** Remove nested `<main>` and `max-w-3xl`. Left column: Back link, `h1` category label + `<StatusBadge>` for status, author & flagged content `<Card>` (`whitespace-pre-wrap break-words`), matched labels badges, prior sanctions card. Right sticky rail: Review decision form (`Mark reviewed` `default` / `Dismiss` `destructive` + confirm `<Dialog>`, required note + `<InputError />`) + Author sanction form (confirm `<Dialog>` for Suspend/Ban).
- **`resources/js/pages/admin/ratings/show.tsx`:** Replace `L8` hard-coded amber with `<Alert variant="warning">{notice}</Alert>`. Left column: Back link, `h1`, rating breakdown card with `<StarRating />`, `<StatusBadge>` for visibility status, agreement summary + `View agreement` link. Right sticky rail: Moderation form using `<Form>` render prop (disables while processing with `<Spinner />`), `<Label htmlFor="reason">Reason for hiding (required)</Label>`, `<Textarea>`, `<InputError />`, `Restore rating` (`outline`) or `Hide rating` (`destructive` + confirm `<Dialog>`).

### Section 8 Anti-Patterns to Avoid
1. **NEVER execute destructive moderation actions without a confirm `<Dialog>`** (except `admin/tasks/show.tsx`, which is `CLASS-ONLY` and cannot import `Dialog` — use `variant="destructive"` + required note there).
2. **NEVER add a nested `<main>` or `max-w-*` wrapper** inside `AdminLayout` — `AdminLayout` already owns `<main>` and `page-wide`.
3. **NEVER show irrelevant sanction fields** (`ends_at` / `task_id`) when the chosen sanction action doesn't use them, and **never** leave unlabeled filter selects or un-paginated `flags/index`.

---

## 12. Gate Log & Per-Section Verification Checklist

- **Gate 1:** Audit + visual system approved (2026-11-25).
- **Gate 2:** Section 1 Foundation locked (`resources/css/app.css`, `components/ui/*`, `StatusBadge` family, layouts, anti-FOUC, print base).
- **Gate 3 (This Revision):** `docs/ui-inventory.md` compiled; `docs/ui-redesign-plan.md` upgraded to zero-ambiguity specification for Pre-Flight + Sections 2–8.

**Mandatory check after EACH section (Pre-Flight, 2, 3, 4, 5, 6, 7, 8):**
1. Zero hard-coded palette colors (`bg-/text-/border-` + `gray|slate|zinc|neutral|stone|red|amber|yellow|green|emerald|blue|sky|indigo|white|black`) outside explicit `print:*` overrides.
2. Zero new imports added to any of the 12 `CLASS-ONLY` files in §4.
3. Run `npm.cmd run build` (must pass `tsc --noEmit`, all 8 `tests/js/*.test.mjs`, and Vite build with 0 errors).
4. Run `php artisan test` (must pass all feature/privacy/route-audit tests with 0 regressions).
5. Spot-check Light + Dark contrast and `1440×900` + `390×844` layout parity (plus Print preview in Dark Mode after Section 7).
