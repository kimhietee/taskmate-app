# TaskMate UI Inventory (Read-Only Audit)

Compiled on 2026-11-25 from a read-only inspection of `resources/css/app.css`, `resources/js/components/status-badge.tsx`, all 8 `tests/js/*.test.mjs` suites, all Sections 2–8 page/feature/layout files under `resources/js/`, and all 27 primitives under `resources/js/components/ui/`.

> Purpose: Single source of truth for upgrading `docs/ui-redesign-plan.md` into an exact implementation specification. No application code was modified during this inventory.

## Contents

1. [Section 1 Foundation Tokens & Utilities](#1-section-1-foundation-tokens--utilities)
2. [Verified `CLASS-ONLY (NO NEW IMPORTS)` Contract Table](#2-verified-class-only-no-new-imports-contract-table)
3. [Part A — Public, Auth, Verification & Shared Auth Components](#3-part-a--public-auth-verification--shared-auth-components)
4. [Part B — Dashboard, Status, Profiles, Settings & Notices](#4-part-b--dashboard-status-profiles-settings--notices)
5. [Part C — Discovery, 4-Part Terms Card, Applications & Core UI Primitives](#5-part-c--discovery-4-part-terms-card-applications--core-ui-primitives)
6. [Part D — Poster Task Management, Agreements, Messaging, Ratings & Reports](#6-part-d--poster-task-management-agreements-messaging-ratings--reports)
7. [Part E — Admin Moderation Suite & `components/ui/*` Color Audit](#7-part-e--admin-moderation-suite--componentsui-color-audit)

---

## 1. Section 1 Foundation Tokens & Utilities

Verified from `resources/css/app.css` (430 lines) and `resources/js/components/status-badge.tsx` (47 lines):

- **Page width `@utility` classes:**
  - `page-wide` — `max-width: 72rem`, centered, `px-4 py-6` (`md: px-6 py-8`, `lg: px-8`)
  - `page` — `max-width: 64rem`, centered, `px-4 py-6` (`md: px-6 py-8`, `lg: px-8`)
  - `page-narrow` — `max-width: 44rem`, centered, `px-4 py-6` (`md: px-6 py-8`)
  - `prose-width` — `max-width: 42rem` *(exact CSS utility name in `app.css` is `prose-width`, NOT `prose`)*
- **Focus utility:** `focus-ring` — 2px solid transparent base outline + 2px offset, turning `var(--ring)` on `:focus-visible`.
- **Semantic surface & control tokens (`@theme inline`):** `background`, `foreground`, `card`, `card-foreground`, `popover`, `popover-foreground`, `field`, `scrim`, `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `muted`, `muted-foreground`, `accent`, `accent-foreground`, `brand`, `brand-foreground`, `destructive`, `destructive-foreground`, `on-destructive`, `border`, `input`, `ring`, `sidebar*`.
- **Semantic status tokens (never hard-code Tailwind color palettes):**
  - `success`: `bg-success-bg text-success-fg border-success-border`
  - `warning`: `bg-warning-bg text-warning-fg border-warning-border`
  - `danger`: `bg-danger-bg text-danger-fg border-danger-border`
  - `info`: `bg-info-bg text-info-fg border-info-border`
  - `neutral`: `bg-neutral-bg text-neutral-fg border-neutral-border`
- **Shared `StatusBadge` (`resources/js/components/status-badge.tsx`):** renders `<Badge variant={tone}>` with `<Icon aria-hidden="true" />` + `<span>{children}</span>`. Preset `STATUS` map: `success` (`CircleCheck`), `pending` (`Clock`), `attention` (`CircleAlert`), `danger` (`CircleX`), `warningTriangle` (`TriangleAlert`), `info` (`Info`), `active` (`CircleDot`), `neutral` (`Circle`), `closed` (`Ban`).
- **Typography:** Instrument Sans (`--font-weight-medium: 600`), body base 16px/26px (`--text-base` / 1.625), `text-xs` 12/18, `text-sm` 14/22, `text-lg` 18/28, `text-xl` 20/28, `text-2xl` 22/30, `text-3xl` 28/36, `text-4xl` 32/40.
- **Print base (`@media print` in `app.css`):** already sets `@page { margin: 18mm; }`, resets `:root, .dark` tokens to light/black ink on `#fff`, strips shadows, resets `[data-slot="sidebar-inset"]`, and sets `break-inside: avoid` on `section, article, tr`. Layout chrome uses `print:hidden`.
- **`components/ui/*` color audit (all 27 files):** **0 hard-coded palette colors** and **0 `hsl(var(` usages** remain in `resources/js/components/ui/`.

---

## 2. Verified `CLASS-ONLY (NO NEW IMPORTS)` Contract Table

Every file below is compiled and rendered in `tests/js/*.test.mjs` with a strict `mockRequire` allowlist. Adding **any** unmocked import (including Lucide icons or `ui/*` primitives) throws `Unexpected module` and fails `npm.cmd run build`.

| # | File (`resources/js/...`) | Test file | Strict allowed module imports | Verbatim asserted strings, DOM order, `for`/`id` pairs & forbidden patterns |
|---|---|---|---|---|
| 1 | `pages/welcome.tsx` | `first-version-scope.test.mjs` | `@inertiajs/react` (`Head`, `Link`, `usePage`), `@/constants/notices` (`PAYMENT_BOUNDARY_NOTICE`, `SAFETY_NOTICE`), `@/routes` (`register`, `login`), `@/routes/browse`, `@/routes/tasks` | Role-gated links: `href="/browse"...>Browse tasks`, `href="/tasks/create"...>Post a task`, `href="/dashboard"...>Open dashboard`. Unverified users must NOT render `/browse` or `/tasks/create` links. |
| 2 | `pages/public/info.tsx` | `first-version-scope.test.mjs` | `@inertiajs/react` (`Head`, `Link`), `@/constants/notices` (`PAYMENT_BOUNDARY_NOTICE`), `@/routes` (`register`, `login`), `@/routes/browse`, `@/routes/tasks` | On `how-it-works`: `Create an account and verify it`, `confirm the same version before work begins`, `Only students can apply`, `Payment is made directly between them`. |
| 3 | `pages/auth/register.tsx` | `registration-guidance.test.mjs` | `@inertiajs/react` (`Head`, `useForm`), `@/components/input-error`, `@/components/password-input`, `@/components/safety-notice`, `@/components/text-link`, `@/components/ui/button`, `@/components/ui/input`, `@/components/ui/label`, `@/components/ui/spinner`, `@/components/ui/textarea`, `@/routes`, `@/routes/register` | `Step 1 of 2`, `How will you use TaskMate?`, `CMU Student`, `CMU Faculty / Staff`, `Office or Organization Representative`, `How verification works`, `6-digit code`, `TaskMate does not ask for ID photos or identity document uploads`, `Continue as CMU Student`. |
| 4 | `pages/browse/show.tsx` | `schedule-fit.test.mjs`, `first-version-scope.test.mjs` | `@/lib/format`, `@/lib/schedule-fit`, `@/constants/notices`, `@inertiajs/react` (`Head`, `Link`, `router`, `useForm`), `@/components/ui/button`, `@/components/ui/input`, `@/components/ui/label`, `@/components/ui/textarea`, `@/components/input-error`, `@/components/verification-status-badge`, `@/components/application-status-badge`, `@/components/terms-status-badge`, `@/routes/browse`, `@/routes/applications`, `@/components/rating-summary`, `@/components/problem-report-form` | **Fixed DOM order:** `1. The offer` < `2. The poster` < `3. My classes` < `4. My decision`. Strings: `Bi-weekly (every 2 weeks)`, `To be discussed`, `Pre-acceptance checklist (3 quick checks)`, `0 of 3 checked`, `Clashes with your classes`, `Ask poster`, `Review & apply`, `Decline (back to tasks)`. **Source check:** must contain `Workplace`; must NOT contain `Work conditions`, `Safety answers`, `Physical demand`, `Academic involvement`, `Hazards involved`, `Private or isolated one-on-one meeting required`. |
| 5 | `pages/applications/index.tsx` | `application-agreement-guidance.test.mjs` | `@inertiajs/react` (`Form`, `Head`, `Link`), `@/lib/format`, `@/components/ui/button`, `@/components/application-status-badge`, `@/routes/applications`, `@/routes/browse`, `@/routes/agreements`, `@/components/payment-status-badge`, `@/components/terms-status-badge` | `Your application stays active until an agreement is confirmed`, `Review the agreement and confirm the same version before work begins`, `View agreement`. |
| 6 | `components/task-form.tsx` | `task-form.test.mjs` | `@/constants/notices`, `@inertiajs/react` (`Form`), `@/components/input-error`, `@/components/ui/button`, `@/components/ui/input`, `@/components/ui/label`, `@/components/ui/textarea` | Labels/text: `Task title`, `Category`, `Work type`, `What needs to be done?`, `Estimated budget (PHP)`, `Pay amount is to be discussed`, `When is pay given? (Pay timing)`, `Work schedule / hours`, `Flexible / self-paced before deadline`, `Work hours are to be discussed`, `Can hours change?`, `Work mode`, `Deadline (optional)`, `I confirm that this task follows the platform rules.`. **Forbidden `name=` attributes:** `complexity`, `required_activities`, `deliverables`, `estimated_duration_hours`, `skill_requirements`, `physical_demand`, `academic_involvement`, `hazard_exposure`, `private_meeting_required`, `workplace_setting`. |
| 7 | `components/agreement-details.tsx` | `application-agreement-guidance.test.mjs` | `@inertiajs/react` (`Form`, `Link`), `lucide-react` (`Printer` ONLY), `@/lib/format`, `@/components/ui/button`, `@/components/ui/input`, `@/components/ui/textarea`, `@/components/input-error`, `@/components/agreement-status-badge`, `@/routes/agreements`, `@/components/completion-payment-panel`, `@/components/star-rating`, `@/components/rating-summary` | Strings: `Review the work, amount, dates, and payment arrangement`, `both people confirm the same version`, `I agree to these terms`, `Propose different terms`, `Ask for a change`. **Required `for` + `id` pairs (all 9):** `revise-deliverables`, `revise-terms`, `revise-final-amount`, `revise-start-date`, `revise-due-date`, `revise-payment-arrangement`, `revise-comment`, `send-back-body`, `cancel-reason`. |
| 8 | `components/rating-summary.tsx` | `rating-summary.test.mjs` | `@/components/star-rating`, `@/constants/notices` | `4.5 average · 4 ratings` (`{average} average · {count} ratings`), `Ratings are contextual information`. Must NOT output dimension names (e.g., `Communication`). |
| 9 | `layouts/admin-layout.tsx` | `admin-layout.test.mjs` | `@/components/app-content`, `@/components/admin-sidebar`, `@/components/app-shell`, `@/components/app-sidebar-header`, `@/components/prototype-banner`, `@/components/site-footer` | Renders `AppShell`, `AdminSidebar`, `AppSidebarHeader` with `showMessages={false}`, `{children}`, `SiteFooter`. |
| 10 | `components/admin-sidebar.tsx` | `admin-layout.test.mjs` | `@inertiajs/react` (`Link`), `lucide-react` (`BriefcaseBusiness`, `Flag`, `LayoutDashboard`, `ShieldCheck`, `Star`, `Users` ONLY), `@/components/app-logo`, `@/components/nav-main`, `@/components/nav-user`, `@/components/ui/sidebar`, `@/routes/admin` | `aria-label="Administration"`; labels: `Dashboard`, `Users`, `Tasks`, `Reports`, `Flags`, `Ratings`, `Profile settings`, `Log out`. Must NOT contain `Browse Tasks` or `My Applications`. |
| 11 | `pages/admin/dashboard.tsx` | `admin-layout.test.mjs` | `@inertiajs/react` (`Head`, `Link`), `@/layouts/admin-layout`, `@/components/verification-status-badge`, `@/routes/admin` | `Latest tasks awaiting review`, latest task title, `href="/admin/tasks/{id}"`, `href="/admin/tasks?status=pending_review"`. |
| 12 | `pages/admin/tasks/show.tsx` | `admin-task-review.test.mjs`, `first-version-scope.test.mjs` | `@inertiajs/react` (`Form`, `Head`, `Link`), `@/layouts/admin-layout`, `@/components/task-status-badge`, `@/components/verification-status-badge`, `@/components/safety-notice`, `@/components/terms-status-badge`, `@/components/ui/button`, `@/components/ui/textarea`, `@/components/input-error`, `@/routes/admin`, `@/routes/admin/users`, `@/components/completion-payment-panel`, `@/lib/format`, `@/constants/notices` | `Every submitted task is reviewed by an administrator`, `No applications have been submitted`, `No off-platform content flags have been recorded`. Must NOT match `Risk level`, `Screening breakdown`, `Score:`, or `>Agreement<` (when absent). **Source check:** must contain `Workplace`; must NOT contain `Work conditions`, `Safety answers`, `Physical demand`, `Academic involvement`, `Hazards involved`, `Private or isolated one-on-one meeting required`. |

> **Additional source-regex-only file (imports ARE allowed):** `resources/js/pages/tasks/show.tsx` is checked via raw source regex in `tests/js/first-version-scope.test.mjs`: must contain `Workplace` and must NOT contain `Work conditions`, `Safety answers`, `Physical demand`, `Academic involvement`, `Hazards involved`, or `Private or isolated one-on-one meeting required`.

---

## 3. Part A — Public, Auth, Verification & Shared Auth Components

I read only the listed files and changed nothing.

**Pages with no layout of their own.** Most pages don't pick a layout themselves. Auth pages set a static `Page.layout = { title, description }` object. `welcome`, `public/info`, `errors/status` and both `verification/*` pages set no layout at all. Whatever maps pages to layouts lives in a file I wasn't allowed to read (probably `app.tsx`), so I haven't confirmed which layout those pages actually get.

**Register is not two steps.** It has **3 steps**. The progress bar only shows 2 when a student signs up with a personal email while institutional email is not required (`totalSteps = isPersonalStudentSignup ? 2 : 3`). The full structure is below.

---

### Layouts
- `layouts/`: app/, auth/, settings/ (folders); admin-layout.tsx, app-layout.tsx, auth-layout.tsx, public-layout.tsx
- `layouts/auth/`: auth-card-layout.tsx, auth-simple-layout.tsx, auth-split-layout.tsx

### layouts/public-layout.tsx (8 lines)
- Exports: default `PublicLayout`.
- Imports: 'react' {type PropsWithChildren}, '@/components/prototype-banner', '@/components/site-footer'.
- Outer container: `flex min-h-svh flex-col bg-background text-foreground`.
- Structure: 1. `<PrototypeBanner />` 2. `<main className="flex-1">{children}</main>` 3. `<SiteFooter />`.
- Controls/fields/lists/states/badges: none.
- Hard-coded colours: none.
- Issues: none.

### layouts/auth-layout.tsx (17 lines)
- Exports: default `AuthLayout({title='', description='', children})`.
- Imports: '@/layouts/auth/auth-simple-layout'.
- Passes title and description straight to `AuthSimpleLayout`. No markup of its own.
- Hard-coded colours: none.

### layouts/auth/auth-simple-layout.tsx (40 lines)
- Exports: default `AuthSimpleLayout`.
- Imports: '@inertiajs/react' {Link}, '@/components/app-logo-icon', '@/routes' {home}, '@/types' {type AuthLayoutProps}, '@/components/prototype-banner', '@/components/site-footer'.
- Outer container: fragment → `<PrototypeBanner prominent />` + `flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-4 py-8 md:p-10` → `w-full max-w-sm` → `flex flex-col gap-8`.
- Structure: 1. PrototypeBanner (prominent) 2. Logo link `href={home()}` `focus-ring flex flex-col items-center gap-2 rounded-md font-medium`, with AppLogoIcon `size-9 fill-current text-foreground` and sr-only {title} 3. `space-y-2 text-center`: h1 `text-2xl font-semibold` {title}; p `text-center text-sm text-muted-foreground` {description} 4. {children} 5. `<SiteFooter />` (outside the min-h-svh div).
- Hard-coded colours: none.
- Issues: `max-w-sm` (384px) is narrow for the multi-step register form and the role cards. SiteFooter sits below a `min-h-svh` block, so it is always pushed below the fold.

---

### pages/welcome.tsx (32 lines)
- Exports: default `Welcome`.
- Imports: '@/constants/notices' {PAYMENT_BOUNDARY_NOTICE, SAFETY_NOTICE}, '@inertiajs/react' {Head, Link, usePage}, '@/routes' {register, login}, '@/routes/browse', '@/routes/tasks'.
- Layout: none set. Head title "Campus tasks with clearer details".
- Outer container: fragment. header `mx-auto flex max-w-6xl items-center justify-between px-4 py-5`. Sections listed below.
- Structure:
  1. header: Link "TaskMate" (`text-xl font-bold`), then nav `flex gap-4`.
  2. section `mx-auto max-w-6xl px-4 py-16 sm:py-24`: p `font-medium text-primary` "For the Central Mindanao University community"; h1 `mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl` "Find campus tasks with the details you need before you agree."; p `mt-6 max-w-2xl text-lg text-muted-foreground` "TaskMate helps students find side jobs and helps eligible posters share clear work details, review applicants, and agree on the work before it begins."; actions div `mt-8 flex flex-wrap gap-3`; guest-only p `mt-4 max-w-2xl text-sm text-muted-foreground` "Browse and posting require a verified account. Create an account to start the review process."
  3. section `border-y bg-muted/30 px-4 py-14` > `mx-auto max-w-6xl`: h2 `text-2xl font-semibold` "The main TaskMate flow"; p `mt-2 max-w-3xl text-sm text-muted-foreground` "TaskMate focuses on helping students and posters reach clear, recorded agreements for individual side jobs."; ol `mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3` of 6 step cards; p `mt-5 text-sm text-muted-foreground` "Only verified students can apply. Verified faculty/staff and approved organizations can post; student posting depends on the current configuration."
  4. section `mx-auto max-w-6xl space-y-4 px-4 py-12`: h2 `text-xl font-semibold` "Clear limits"; p {PAYMENT_BOUNDARY_NOTICE}; p {SAFETY_NOTICE}.
- Interactive controls (all plain Inertia `Link`, no Button component):
  - Nav: if user, "Dashboard" → '/dashboard'. If guest, "Log in" → login(), "Register" → register().
  - Action links, class `rounded-md px-5 py-3 font-semibold` plus `bg-primary text-primary-foreground` (primary) or `border`:
    - Admin: "Open admin dashboard" → '/admin' (primary).
    - User who can apply: "Browse tasks" → browse.index().url (primary).
    - User who can post: "Post a task" → tasks.create().url (primary only if the user cannot apply).
    - User who can do neither: "Open dashboard" → '/dashboard'.
    - Guest: "Create an account" → register().url (primary), "Log in" → login().url.
- Form fields: none.
- Lists: 6 `li` cards `rounded-lg border bg-background p-5`, each with a `font-semibold` number "{i+1}. ". Steps: "Create an account and complete administrator verification" / "Eligible posters submit a clear task for review" / "Verified students review approved tasks and apply" / "The poster and selected student agree on the work and amount" / "Both people confirm the same agreement before work begins" / "Record completion and payment status, then rate or report if needed".
- States: only the guest note above.
- Badges: none.
- Hard-coded colours: none.
- Issues: very long single-line JSX on lines 21 and 29. Notices are plain unstyled `<p>`s. Raw Link "buttons" instead of `Button`. Header has no PublicLayout chrome unless the resolver adds it.

### pages/public/info.tsx (24 lines)
- Exports: default `Information({ page, title, guidelines, privacyDraft })`.
- Imports: '@/constants/notices' {PAYMENT_BOUNDARY_NOTICE}, '@inertiajs/react' {Head, Link}, '@/routes' {register, login}.
- Layout: none set. Head title {title}.
- Outer container: header `mx-auto flex max-w-4xl justify-between px-4 py-6`. main `mx-auto max-w-4xl px-4 pb-16`.
- Structure:
  1. header: Link "TaskMate" `font-bold`; nav `flex gap-4` with "Log in", "Register".
  2. h1 `text-3xl font-bold` {title}.
  3. `page==='how-it-works'`: div `mt-6 space-y-6` containing p `max-w-3xl text-muted-foreground` "TaskMate's main purpose is to help CMU students find individual side jobs with clear work, budget, and workplace details."; ol `space-y-4` of 6 `li rounded-lg border p-4` (h2 `font-semibold` + p `mt-1 text-sm`); p `rounded-lg border bg-muted/30 p-4 text-sm` "Students may post when student posting is enabled. Faculty/staff and approved organization representatives may post. Faculty/staff and organizations cannot apply."
     - "1. Create an account and verify it": "An administrator reviews the information you submit. Students and faculty/staff use CMU institutional email addresses. Task access begins after account approval."
     - "2. Post a task for review": "Eligible verified posters describe the work, budget, and work mode. Onsite and hybrid tasks include the place of work. New tasks are reviewed before students can see them."
     - "3. Students review and apply": "Verified students can browse approved tasks, check the disclosed conditions, and send one application message. Only students can apply."
     - "4. Agree before work begins": "The poster proposes deliverables, terms, dates, and an amount. Both people review and confirm the same version before work begins."
     - "5. Record completion and payment status": "The parties record completion and payment status in TaskMate. Payment is made directly between them."
     - "6. Share feedback or report a concern": "After a completed task, the parties may leave contextual ratings. Use the report tools for serious problems; ratings are not a substitute for reports."
  4. `page==='task-guidelines'`: amber note p "These guidelines are provisional and must be reviewed by the team and university.", then ul `mt-6 list-disc space-y-3 pl-6` of `guidelines` strings.
  5. `page==='safety-and-limits'`: div `mt-6 space-y-4` with 3 p: "Verification, administrator review, and ratings help inform decisions but do not guarantee a person’s future behavior or the safety of a task." / "Review the disclosed work location and conditions. Do not agree to anything that makes you uncomfortable. Use the report tools to raise concerns." / {PAYMENT_BOUNDARY_NOTICE}.
  6. `page==='privacy'`: amber p "DRAFT PRIVACY NOTICE — not approved. Retention, deletion, consent, and protected-storage rules are still to be decided.", then `pre mt-5 whitespace-pre-wrap break-words rounded border p-4 text-sm` {privacyDraft}.
- Controls: nav Links "Log in" → login(), "Register" → register(). No conditions.
- Form fields: none.
- Lists: guidelines rendered as a bulleted list. How-it-works as card list.
- States: no empty state for `guidelines` or `privacyDraft` null.
- Badges: none.
- Hard-coded colours: `border-amber-500 bg-amber-50 text-amber-950` (L20 and L22, both inside `mt-4 rounded border border-amber-500 bg-amber-50 p-4 text-amber-950`). No dark: variants.
- Issues: amber notes have no dark-mode classes. Privacy draft is a `<pre>` text wall. Header is always guest (Log in/Register) even when signed in. Very long JSX lines.

### pages/errors/status.tsx (16 lines)
- Exports: default `ErrorStatus({status})`.
- Imports: '@inertiajs/react' {Head, Link, usePage}.
- Layout: none. Head `${status} — TaskMate`.
- Outer container: main `mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center px-4 py-16`.
- Structure: 1. p `text-sm font-semibold text-primary` "TaskMate · {status}" 2. h1 `mt-3 text-3xl font-bold` message (fallback is the 500 text) 3. p `mt-3 text-muted-foreground` "You can return to the TaskMate home page or continue to your dashboard." 4. div `mt-6 flex gap-3` links.
- Messages: 403 "You do not have permission to view this page."; 404 "We could not find that page."; 419 "This page expired. Refresh it and try again."; 429 "Too many requests. Please wait before trying again."; 500 "Something went wrong. Please try again later."
- Controls: Link "Home" → '/' (`rounded-md bg-primary px-4 py-2 text-primary-foreground`). Link "Dashboard" → `/${currentTeam.slug}/dashboard`, falling back to '/' (`rounded-md border px-4 py-2`), shown only if signed in.
- Fields/lists/badges: none. Hard-coded colours: none.
- Issues: Dashboard link depends on `currentTeam.slug` (Teams), against the AGENTS rule that fallback should go to `taskmate.dashboard`. With no team, "Dashboard" goes to '/'. Raw Links instead of Button.

### pages/auth/login.tsx (133 lines)
- Exports: default `Login({status, canResetPassword})`. `Login.layout = { title: 'Log in to your account', description: 'Enter your email and password below to log in' }`.
- Imports: '@inertiajs/react' {Form, Head}, '@/components/input-error', '@/components/password-input', '@/components/text-link', '@/components/ui/button' {Button}, '@/components/ui/checkbox' {Checkbox}, '@/components/ui/input' {Input}, '@/components/ui/label' {Label}, '@/components/ui/spinner' {Spinner}, '@/routes' {register}, '@/routes/login' {store}, '@/routes/password' {request}, '@/components/passkey-verify'.
- Layout: static layout object (title/description above). Head "Log in".
- Outer container: fragment. `<Form {...store.form()} resetOnSuccess={['password']} className="flex flex-col gap-6">` > `grid gap-6`.
- Structure: 1. `<PasskeyVerify />` 2. Form: email, password, remember, submit 3. "Don't have an account? Sign up" (`text-center text-sm text-muted-foreground`) 4. status message, rendered after the form.
- Controls: TextLink "Forgot password?" → request() (`ml-auto text-sm`, shown only if canResetPassword). Button (default variant) "Log in", type submit, `mt-4 w-full`, disabled while processing. TextLink "Sign up" → register().
- Form fields:
  - Label "Email address", id/name `email`, type email, placeholder "email@example.com", InputError errors.email.
  - Label "Password", id/name `password`, PasswordInput, placeholder "Password", autoComplete current-password, InputError errors.password.
  - Checkbox id/name `remember`, Label "Remember me".
- States: processing shows `<Spinner />` before "Log in". Status shown in `mb-4 text-center text-sm font-medium text-green-600`.
- Badges: none.
- Hard-coded colours: `text-green-600` (L122).
- Issues: status message renders *below* the form and has `mb-4` instead of top spacing. tabIndex 5 is used twice. The Checkbox is the default small shadcn size.

### pages/auth/register.tsx (560 lines)
- Exports: default `Register`. `Register.layout = { title: 'Create an account', description: 'Set up your TaskMate account in a few quick steps' }`.
- Imports: '@inertiajs/react' {Head, useForm}, 'react' {useState}, '@/components/input-error', '@/components/password-input', '@/components/safety-notice' {SafetyNotice}, '@/components/text-link', '@/components/ui/button' {Button}, '@/components/ui/input' {Input}, '@/components/ui/label' {Label}, '@/components/ui/spinner' {Spinner}, '@/components/ui/textarea' {Textarea}, '@/routes' {login}, '@/routes/register' {store}.
- Props: passwordRules, institutionalEmailDomains (default ['cmu.edu.ph']), requireInstitutionalEmail (false), autoVerifyInstitutionalStudent (true), unverifiedStudentsCanBrowse (true), affiliationOptions {student[], faculty_staff[]}.
- Layout: static layout object. Head "Register".
- Outer container: native `<form onSubmit={handleSubmit} className="flex flex-col gap-5">` (uses useForm, not the Inertia `<Form>`).
- **Step count:** `step` can be 1, 2 or 3. `totalSteps` is 2 for personal-email students (no institutional email required, and the email is not institutional). Otherwise it is 3.
- **Always shown, top to bottom:**
  1. Progress block `space-y-2` (aria-label "Registration progress"): row `flex items-center justify-between text-xs font-medium text-muted-foreground` with "Step {n} of {totalSteps}" and the step label. Labels: "Choose your role" (step 1), "Account basics" (step 2), and for step 3 "Organization details" / "CMU student details" / "Faculty / staff details". Bar track `h-2 w-full overflow-hidden rounded-full bg-muted`, fill `h-full rounded-full bg-primary transition-all duration-300` with inline `style={{ width: progressPercent% }}`.
  2. stepError alert (role="alert") `rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-100`.
  3. Footer: "Already have an account? Log in" (TextLink → login(), `text-center text-sm text-muted-foreground`).
- **STEP 1, Choose your role** (`space-y-4`):
  - h2 `text-base font-semibold` "How will you use TaskMate?"; p `text-sm text-muted-foreground` "Pick one role to personalize your setup. You can confirm your email in under a minute."
  - Role cards: `grid gap-3` with role="radiogroup", aria-label "Choose your account type". Each card is a native `<button role="radio" aria-checked>` with `w-full rounded-xl border p-4 text-left transition`. Selected: `border-primary bg-primary/5 ring-2 ring-primary/20`. Not selected: `border-input hover:border-primary/40 hover:bg-muted/30`. Inside: title `font-semibold`, badge pill `rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground`, summary `mt-1.5 text-xs leading-relaxed text-muted-foreground`.
    - **student**: "CMU Student", badge "Browse & apply", summary "Use your personal email or CMU email. Browse approved campus tasks right away, then verify as a CMU student to apply and agree on work."
    - **faculty_staff**: "CMU Faculty / Staff", badge "Post tasks", summary "Post clear tasks for verified CMU students after administrator approval. Faculty and staff accounts cannot apply to tasks."
    - **organization**: "Office or Organization Representative", badge "Post tasks", summary "For campus offices and approved local employers posting tasks after administrator approval. Cannot browse or apply."
  - InputError form.errors.user_type.
  - Section `space-y-1.5 rounded-lg border bg-muted/30 p-3.5 text-xs text-muted-foreground` (aria-label "How account verification works"): p `font-medium text-foreground` "How verification works"; ol `list-decimal space-y-1 pl-4`:
    1. "**Confirm your email:** Enter the 6-digit code sent to your inbox."
    2. "**Verify campus status:**" followed by one of:
       - Student with auto-verify: "CMU emails ({domains}) auto-verify right after confirmation. Personal emails enter the dashboard[ with read-only task browsing] and can verify as a CMU student anytime."
       - Student without auto-verify: "An administrator reviews your student details before applying unlocks."
       - Not a student: "An administrator reviews your submitted details before posting unlocks."
  - Then p "TaskMate does not ask for ID photos or identity document uploads."
  - Button (default) type button `w-full`: "Continue as {role title}" → setStep(2).
- **STEP 2, Account basics** (`space-y-4`):
  - Name: Label "Representative name" (organization) or "Full name". id/name `name`, placeholder "Full name", autoComplete name. Helper "Use your real name (letters, spaces, periods, hyphens, or apostrophes). Extra spaces are cleaned automatically." InputError errors.name.
  - Email: Label "Email address". id/name `email`, type email. Placeholder "you@gmail.com or you@cmu.edu.ph" (student, institutional email not required) or "email@example.com". InputError errors.email. Helper depends on the case:
    - Student, institutional email detected: green box `rounded-md border border-green-300 bg-green-50 px-3 py-2 text-xs text-green-900 dark:border-green-800 dark:bg-green-950/50 dark:text-green-200` with "**CMU institutional email detected:**" plus either "Add your Student ID number and program on the next step—confirming your 6-digit email code will automatically verify you as a CMU Student." (auto-verify on) or "Add your Student ID number and program on the next step for administrator review."
    - Student, other email: "Use a personal email (like Gmail) for a quick signup—we will send a 6-digit code, let you into your dashboard[ to browse approved tasks], and let you verify as a CMU student anytime. Or use your `{domains}` email for instant verification."
    - Not organization, institutional email required: "Use your CMU institutional email address ({domains})."
    - Otherwise: "Any valid email address is accepted. Your email is used to sign in and receive your verification code, and is never shown publicly."
  - Password: Label "Password", id/name `password`, PasswordInput, placeholder "Password", new-password, passwordrules. InputError.
  - Confirm: Label "Confirm password", id/name `password_confirmation`, placeholder "Confirm password". InputError.
  - `<SafetyNotice />`.
  - Buttons row `flex gap-2 pt-1`: Button variant="outline" "Back" → step 1. Then, if totalSteps===2, Button type submit `flex-1` "Create account & send code" (Spinner while processing). Otherwise Button type button `flex-1` "Continue to organization details" / "Continue to campus details".
  - Client-side errors from `validateStepTwo`: "Enter your full name to continue." / "Enter a valid email address to receive your 6-digit verification code." / "Use your CMU institutional email address ({domains})." / "Create a password to continue." / "Password confirmation does not match."
- **STEP 3, Details** (`space-y-4`):
  - Organization:
    - Label "Organization name", id/name `organization_name`, placeholder "Organization name", helper "This is the organization’s display name on TaskMate."
    - Label "Your position", id/name `position`, placeholder "Representative position", helper "Used by administrators to review this account."
    - Label "About the organization and why it posts tasks", Textarea id/name `supporting_info`, maxLength 1000, placeholder "Briefly describe your organization and why you want to post tasks.", helper "For administrator review only—not shown on public profiles. No ID photo uploads required."
    - Each field has an InputError.
  - Student / faculty_staff:
    - Label "Student ID number" / "Employee ID number", id/name `id_number`, placeholder is the same as the label, helper "Text only (no ID photo uploads). Your ID number is visible only to you and administrators." InputError.
    - Affiliation: Label "College and program" (student) or "College or office".
      - If presets exist: **native `<select>`** id `affiliation_select` (no name) `border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none`. Options: disabled "Select {label lowercased}", the presets, and "Other (specify below)". Choosing Other shows Input id `affiliation_custom`, placeholder "Enter your {label lowercased}".
      - If no presets: Input id/name `affiliation`, placeholder is the label.
      - Helper "Helps other users understand your campus affiliation and may appear on your profile." InputError errors.affiliation.
  - Buttons: outline "Back" → step 2. Submit `flex-1` "Create account & send code" (Spinner while processing).
- Server errors send the user back to the right step (user_type → 1; name/email/password → 2; details → 3). The request body only includes fields relevant to the role.
- Badges: only the role-card pills.
- Hard-coded colours: L248 `border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-100`. L351 `border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950/50 dark:text-green-200`.
- Issues: native `<select>` (L495). Inline `style` width on the progress bar (L242). Text-heavy helpers in step 1 and step 2. Role cards are cramped inside the `max-w-sm` auth wrapper. Role "radio" cards are buttons with no arrow-key handling.

### pages/auth/forgot-password.tsx (69 lines)
- Exports: default `ForgotPassword({status})`. layout `{ title: 'Forgot password', description: 'Enter your email to receive a password reset link' }`.
- Imports: '@inertiajs/react' {Form, Head}, 'lucide-react' {LoaderCircle}, '@/components/input-error', '@/components/text-link', '@/components/ui/button' {Button}, '@/components/ui/input' {Input}, '@/components/ui/label' {Label}, '@/routes' {login}, '@/routes/password' {email}.
- Outer container: status div, then `space-y-6`.
- Structure: 1. status `mb-4 text-center text-sm font-medium text-green-600` 2. Form email.form() with field and button wrapper `my-6 flex items-center justify-start` 3. `space-x-1 text-center text-sm text-muted-foreground` "Or, return to" + TextLink "log in".
- Controls: Button (default) `w-full` "Email password reset link", disabled while processing. TextLink "log in" → login().
- Fields: Label "Email address", id/name `email`, type email, autoComplete off, placeholder "email@example.com", InputError errors.email.
- States: processing shows `<LoaderCircle className="h-4 w-4 animate-spin" />`. The other pages use Spinner instead.
- Hard-coded colours: `text-green-600` (L18).
- Issues: inconsistent spinner. Email has autoComplete "off".

### pages/auth/reset-password.tsx (96 lines)
- Exports: default `ResetPassword({token, email, passwordRules})`. layout `{ title: 'Reset password', description: 'Please enter your new password below' }`.
- Imports: '@inertiajs/react' {Form, Head}, '@/components/input-error', '@/components/password-input', '@/components/ui/button' {Button}, '@/components/ui/input' {Input}, '@/components/ui/label' {Label}, '@/components/ui/spinner' {Spinner}, '@/routes/password' {update}.
- Outer container: Form update.form() (transform adds token and email; resetOnSuccess clears both passwords) > `grid gap-6`.
- Fields:
  - Label "Email", id/name `email`, readOnly, value=email, `mt-1 block w-full`, InputError `mt-2`.
  - Label "Password", id/name `password`, PasswordInput, placeholder "Password", new-password, autoFocus. InputError.
  - Label "Confirm password", id/name `password_confirmation`, placeholder "Confirm password". InputError `mt-2`.
- Controls: Button submit `mt-4 w-full` "Reset password", with Spinner while processing.
- Hard-coded colours: none.
- Issues: the extra `mt-1`/`mt-2` margins are inconsistent with the grid gap.

### pages/auth/confirm-password.tsx (70 lines)
- Exports: default `ConfirmPassword`. layout `{ title: 'Confirm password', description: 'This is a secure area of the application. Please confirm your password before continuing.' }`.
- Imports: '@inertiajs/react' {Form, Head}, '@/components/input-error', '@/components/password-input', '@/components/ui/button' {Button}, '@/components/ui/label' {Label}, '@/components/ui/spinner' {Spinner}, '@/routes/password/confirm' {store}, '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyConfirmationController' {index as confirmOptions, store as confirmStore}, '@/components/passkey-verify'.
- Structure: 1. PasskeyVerify with label "Confirm with passkey", loadingLabel "Confirming...", separator "Or confirm with password" 2. Form > `space-y-6`.
- Fields: Label "Password", id/name `password`, PasswordInput, placeholder "Password", InputError.
- Controls: Button `w-full` "Confirm password", with Spinner while processing.
- Hard-coded colours: none. Issues: none notable.

### pages/auth/two-factor-challenge.tsx (133 lines)
- Exports: default `TwoFactorChallenge`. Layout props are set dynamically through `setLayoutProps` (title/description below).
- Imports: '@inertiajs/react' {Form, Head, setLayoutProps}, 'input-otp' {REGEXP_ONLY_DIGITS}, 'react' {useMemo, useState}, '@/components/input-error', '@/components/ui/button' {Button}, '@/components/ui/input' {Input}, '@/components/ui/input-otp' {InputOTP, InputOTPGroup, InputOTPSlot}, '@/hooks/use-two-factor-auth' {OTP_MAX_LENGTH}, '@/routes/two-factor/login' {store}.
- Head "Two-factor authentication". Outer `space-y-6` > Form `space-y-4`.
- Modes:
  - Code mode: title "Authentication code", description "Enter the authentication code provided by your authenticator application." InputOTP name `code`, OTP_MAX_LENGTH slots, digits only, in `flex flex-col items-center justify-center space-y-3 text-center`. InputError errors.code.
  - Recovery mode: title "Recovery code", description "Please confirm access to your account by entering one of your emergency recovery codes." Input name `recovery_code`, placeholder "Enter recovery code", **no label or id**. InputError.
- Controls: Button submit `w-full` "Continue". Then "or you can " + native button with "login using a recovery code" / "login using an authentication code".
- States: no spinner. Button is disabled while processing.
- Hard-coded colours: L119 `decoration-neutral-300`, `dark:decoration-neutral-500`.
- Issues: recovery input has no label. Lowercase "login" used as a verb in the toggle text. No processing indicator.

### pages/auth/verify-email.tsx (122 lines)
- Exports: default `VerifyEmail`. layout `{ title: 'Confirm your email', description: 'Enter the 6-digit code sent to your inbox to reach your dashboard.' }`.
- Imports: '@inertiajs/react' {Form, Head, useForm, usePage}, '@/components/input-error', '@/components/text-link', '@/components/ui/button' {Button}, '@/components/ui/input' {Input}, '@/components/ui/label' {Label}, '@/components/ui/spinner' {Spinner}, '@/routes' {logout}, '@/routes/verification' {send}.
- Head "Confirm your email".
- Structure:
  1. Info card `mb-5 space-y-3 rounded-xl border bg-muted/30 p-4 text-left text-sm`:
     - Row `text-xs font-medium text-muted-foreground`: "Email confirmation" / "Expires in {codeExpiryMinutes} min".
     - p "Enter the 6-digit verification code we sent to **{maskedEmail ?? 'your email address'}**."
     - p xs, one of: "Because you used your CMU institutional email with your Student ID and program, confirming this code will automatically verify you as a CMU Student." / "After confirming your email, you will go straight to your dashboard. Students can browse approved tasks in preview mode and verify their CMU student status anytime." / "After confirming your email, you will go to your dashboard to complete student verification or wait for administrator approval."
  2. Shown when prototypeMode && mailUsesLogDriver: amber box "**Local prototype mode:** Mail is set to the `log` driver, so your 6-digit code (and backup verification link) are written to `storage/logs/laravel.log` instead of sent to Gmail. To send real emails to Gmail, configure `MAIL_MAILER=smtp` in `.env`."
  3. Shown when status==='verification-link-sent': green box (role=status) "A new 6-digit verification code and backup link have been sent to {maskedEmail ?? 'your email address'}."
  4. Native form `space-y-4` posting to '/email/verify-code' (hard-coded URL, not Wayfinder).
  5. Resend section `mt-5 space-y-3 border-t pt-4 text-center`: p xs "Didn't receive the code? You can resend a fresh code or click the backup link inside the email." Then `<Form {...send.form()}>`.
- Fields: Label "6-digit verification code", id/name `code`, type text, inputMode numeric, one-time-code, maxLength 6, placeholder "000000", `h-12 text-center font-mono text-2xl tracking-[0.4em]`. Non-digits are stripped. InputError codeForm.errors.code.
- Controls:
  - Button submit `w-full` "Confirm email & continue to dashboard", disabled while processing or until 6 digits are entered.
  - Button variant="secondary" `w-full` "Resend verification code".
  - TextLink "Log out" → logout() (`mx-auto block text-sm`).
- Hard-coded colours: L59 `border-amber-400 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-100`. L65 `border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/50 dark:text-green-200`.
- Issues: hard-coded POST URL. Developer-facing prototype text appears in user UI. "Log out" is a TextLink to logout() with no method="post" visible.

### pages/verification/details.tsx (113 lines)
- Exports: default `VerificationDetails({user, verificationStatus, verificationNote, affiliationOptions})`.
- Imports: 'react' {useState}, '@inertiajs/react' {Form, Head}, '@/components/input-error', '@/components/safety-notice' {SafetyNotice}, '@/components/ui/button' {Button}, '@/components/ui/input' {Input}, '@/components/ui/label' {Label}, '@/components/ui/textarea' {Textarea}, '@/components/verification-status-badge' {VerificationStatusBadge}, '@/routes/verification/details'.
- Layout: none set. Head "Update verification details".
- Outer container: `mx-auto max-w-2xl space-y-6 p-4`.
- Structure:
  1. `space-y-2`: VerificationStatusBadge; h1 `text-2xl font-semibold` "Update your submitted details"; p `text-sm text-muted-foreground` "Update only the information requested for review. Your account type and email cannot be changed here. Submitting returns your account to pending review."
  2. If verificationNote: `rounded-lg border p-4 text-sm` with p `font-medium` "Administrator note" and p `mt-2 whitespace-pre-wrap` {note}.
  3. `<SafetyNotice />`.
  4. Form verificationDetails.update.form() `space-y-5`.
- Fields:
  - Organization:
    - Label "Organization name", id/name organization_name, defaultValue, helper "This is the organization’s display name on TaskMate."
    - Label "Your position", id/name position, helper "Used by administrators to review this account."
    - Label "About the organization and why it posts tasks", Textarea id/name supporting_info, maxLength 1000, helper "This description is for administrator review and is not shown on public profiles."
    - Each has an InputError.
  - Student / staff:
    - Label "Student ID number" / "Employee ID number", id/name id_number, helper "Used for account review. Your ID number is visible only to you and administrators." InputError.
    - Affiliation: Label "College and program" / "College or office".
      - With presets: hidden input name `affiliation`, plus **native `<select>`** id affiliation_select `border-input bg-background h-10 w-full rounded-md border px-3 py-2 text-sm` with options disabled "Select affiliation", the presets, and "Other (specify below)". Other shows Input id affiliation_custom, placeholder "Enter your college, program, or office".
      - Without presets: Input id/name affiliation.
      - Helper "Helps other users understand your campus affiliation and may appear on your profile." InputError.
- Controls: Button (default) "Submit for review", disabled while processing, no spinner.
- Badges: `<VerificationStatusBadge status={verificationStatus} />` ('rejected' | 'more_info_requested').
- Hard-coded colours: none.
- Issues: native select has no focus-ring classes. `max-w-2xl p-4` wrapper. No processing indicator. Very long single-line field JSX (L65–71).

### pages/verification/student.tsx (353 lines)
- Exports: default `StudentVerification`.
- Imports: 'react' {useState}, '@inertiajs/react' {Head, Link, useForm}, '@/components/input-error', '@/components/safety-notice' {SafetyNotice}, '@/components/verification-status-badge' {VerificationStatusBadge}, '@/components/ui/button' {Button}, '@/components/ui/input' {Input}, '@/components/ui/label' {Label}, '@/components/ui/spinner' {Spinner}.
- Layout: none set. Head "Verify as CMU Student".
- Outer container: `mx-auto max-w-3xl space-y-6 p-4 md:p-6`.
- Structure:
  1. Header `flex flex-wrap items-start justify-between gap-3`: VerificationStatusBadge plus Link "Back to dashboard" → '/dashboard' (`text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground`). h1 `text-2xl font-semibold` "Verify your CMU Student status". p "Confirm your Student ID number and college/program to unlock applying to tasks, messaging posters, saving your class schedule, and student posting."
  2. If status: green box (role=status) {status}.
  3. If verificationNote: amber box with "Administrator note" and {note}.
  4. Method chooser section `grid gap-3 sm:grid-cols-2`: 2 native buttons using the same selected/unselected classes as the register role cards.
     - "CMU Email Code", green pill "Instant approval" (auto-verify on) or "Recommended". Text "Enter your `{domains}` email to get a 6-digit code. Your personal Gmail login stays unchanged."
     - "Administrator Review", pill `rounded-full border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground` "No CMU email needed". Text "Don't have access to your CMU email right now? Submit your Student ID number and college/program for admin review."
  5. Privacy box `rounded-lg border bg-muted/30 p-3.5 text-xs text-muted-foreground`: "**Privacy protection:** TaskMate does not collect or accept Student ID photos, selfies, or identity document uploads. Your Student ID number and institutional email are visible only to you and administrators."
  6. Shown when method institutional && pendingInstitutionalCode: section `space-y-4 rounded-xl border-2 border-primary/40 bg-primary/5 p-5`.
     - h2 "Enter the 6-digit code sent to {maskedEmail}". p "Codes expire after {codeExpiryMinutes} minutes. Confirming it will keep your current login email and verify your CMU student status."
     - If mailUsesLogDriver, amber box "**Local prototype mode:** Check `storage/logs/laravel.log` for the 6-digit CMU student verification code."
     - Form posts to '/verification/student/institutional-verify': Label "6-digit CMU verification code", Input id cmu_verification_code, name code, numeric, maxLength 6, placeholder "000000", `h-12 max-w-xs text-center font-mono text-2xl tracking-[0.4em]`, InputError. Button "Confirm code & verify as CMU Student", disabled until 6 digits, Spinner while processing.
  7. Details form card `space-y-5 rounded-xl border p-5`.
     - h2 `text-lg font-semibold`: "Need a new code or want to update your student details?" (institutional with a pending code) / "Your CMU Student details & institutional email" (institutional) / "Submit your CMU Student details for administrator review" (manual).
     - p "Every verified CMU student record includes your Student ID number (private) and College/Program (shown on your campus profile)."
     - Form posts to '/verification/student/institutional-code' or '/verification/student/manual-request'.
  8. `<SafetyNotice />`.
- Fields (details form):
  - Label "Student ID number", id student_id_number, name id_number, placeholder "e.g. 2024-01234", helper "Text only—never upload an ID photo. Visible only to you and administrators." InputError sharedErrors.id_number.
  - Label "College and program":
    - With presets: **native `<select>`** id student_affiliation_select (no name) `border-input bg-background h-10 w-full rounded-md border px-3 py-2 text-sm`, options disabled "Select college and program", the presets, and "Other (specify below)". Other shows Input id student_affiliation_custom, placeholder "Enter your college and program".
    - Without presets: Input id student_affiliation, name affiliation, placeholder "College and program".
    - Helper "Helps posters see your campus affiliation on your profile." InputError.
  - Institutional method only: Label "CMU institutional email ({domains})", id/name institutional_email, type email, placeholder `yourname@{domain}`, helper "We send a one-time 6-digit code here to prove active CMU email ownership. Your personal login email will not change." InputError.
- Controls:
  - Institutional: Button submit "Send 6-digit CMU code" / "Resend 6-digit CMU code".
  - Manual: Button "Submit for administrator review".
  - Both have a Spinner while processing.
  - Link "Continue previewing tasks" → '/browse' (`text-sm underline underline-offset-4`).
- Badges: `<VerificationStatusBadge status={verificationStatus} />` (unverified | pending | rejected | more_info_requested). The green pill is a hand-rolled span.
- Hard-coded colours:
  - L136 `border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950/50 dark:text-green-200`
  - L142 `border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100`
  - L161 `border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950/60 dark:text-green-200`
  - L207 `border-amber-400 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-100`
- Issues: native select with no focus ring. Hard-coded URLs ('/dashboard', '/browse', the 3 POST paths) instead of Wayfinder. Method chooser buttons have no aria-pressed or radio role. Text-heavy page with SafetyNotice and privacy boxes stacked on top of each other.

---

### components/password-input.tsx (37 lines)
- Exports: default `PasswordInput` (props: input props minus `type`, plus ref).
- Imports: 'lucide-react' {Eye, EyeOff}, 'react' {type ComponentProps, Ref}, 'react' {useState}, '@/components/ui/input' {Input}, '@/lib/utils' {cn}.
- Outer container: `relative`.
- Structure: Input with `pr-10`, plus a toggle button `absolute inset-y-0 right-0 flex items-center rounded-r-md px-3 text-muted-foreground hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none`. aria-label "Hide password"/"Show password", tabIndex -1, icon `size-4`.
- Hard-coded colours: none.
- Issues: tabIndex -1 means keyboard users can't reach the toggle.

### components/input-error.tsx (17 lines)
- Exports: default `InputError({message, className})`.
- Imports: 'react' {type HTMLAttributes}, '@/lib/utils' {cn}.
- Renders `<p className="text-sm text-destructive-foreground">` only when there is a message.
- Hard-coded colours: none.
- Issues: it uses `text-destructive-foreground`, not `text-destructive`. Check that this token has enough contrast on a light background. No role="alert" and no aria link to the input.

### components/alert-error.tsx (24 lines)
- Exports: default `AlertError({errors, title})`.
- Imports: 'lucide-react' {AlertCircleIcon}, '@/components/ui/alert' {Alert, AlertDescription, AlertTitle}.
- Renders `<Alert variant="destructive">`: icon, AlertTitle {title || 'Something went wrong.'}, and a de-duplicated error list `ul list-inside list-disc text-sm`.
- Hard-coded colours: none.
- Not used by any of the pages above.

### components/text-link.tsx (23 lines)
- Exports: default `TextLink` (Inertia Link props).
- Imports: '@inertiajs/react' {Link}, 'react' {type ComponentProps}, '@/lib/utils' {cn}.
- Class: `focus-ring rounded-sm text-foreground underline decoration-muted-foreground/50 underline-offset-4 transition-colors hover:decoration-current! hover:text-brand`.
- Hard-coded colours: none. It uses tokens `text-brand` and `focus-ring`.

---

## 4. Part B — Dashboard, Status, Profiles, Settings & Notices

> Note: the dashboard and settings pages set `Component.layout` to a plain object (`{ breadcrumbs }`) or a function that returns one. The actual layout component, probably AppLayout / SettingsLayout, is picked elsewhere, most likely in `app.tsx`. I did not read `app.tsx`, so this is an inference.

---

### pages/dashboard.tsx (227 lines)
- Exports: default `Dashboard`.
- Imports: '@/lib/format' {formatDate, formatDateTime}, '@inertiajs/react' {Head, Link, router, usePage}, '@/components/safety-notice' {SafetyNotice}, '@/components/verification-status-badge' {VerificationStatusBadge}, '@/routes' {dashboard}, '@/routes/admin' (default admin), '@/routes/applications', '@/routes/browse', '@/routes/tasks' {create as createTask, mine as myTasks}, '@/routes/verification/details'.
- Layout: `Dashboard.layout = (props) => ({ breadcrumbs: [{ title: 'Dashboard', href: props.currentTeam ? dashboard(props.currentTeam.slug) : '/dashboard' }] })` (L220-227).
- Props: status, studentsCanPost=true, unverifiedStudentsCanBrowse=true, autoVerifyInstitutionalStudent=true, hasStudentDetails (declared, not destructured), verificationMethod, studentVerificationUrl, verificationNote, verifiedAt, ratingsWaiting=[], warningSanction, activeSuspension, sanctionContact, recentAlerts=[].
- Outer container: `mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 p-4 md:p-6` (L52).
- Structure:
  1. Status flash (if `status`): `div role="status"` `rounded-lg border px-4 py-3 text-sm`, shows {status} (L53).
  2. Hero `section` `rounded-xl border p-5 md:p-6` aria-labelledby="next-step-title", inner `max-w-3xl`. Eyebrow `p` "TaskMate" (`text-sm font-medium text-muted-foreground`). h1 `mt-1 text-2xl font-semibold`: "Complete your CMU Student setup" if isUnverifiedStudent, otherwise "What would you like to do next?". The body depends on role/state (see branches below) (L55-174).
  3. Warning sanction box (if `warningSanction`): `rounded-lg border border-amber-400 bg-amber-50 p-4 text-sm text-amber-950`, "**Account warning:** {reason}" plus button (L176).
  4. Suspension box (if `activeSuspension`): `div role="status"` `rounded-lg border border-red-300 p-4 text-sm`: "Your account is suspended until {formatDateTime(endsAt) | 'further notice'}.", then {reason} and {sanctionContact} (L177).
  5. Verification `section` aria-label="Account verification" `flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4`: VerificationStatusBadge, a status sentence, and an optional link (L179-205).
  6. `<SafetyNotice />` (L207).
  7. "Ratings waiting for you" `section` (if ratingsWaiting.length > 0) `space-y-3 rounded-xl border p-5`, h2 `text-lg font-semibold` (L209).
  8. "Recent activity" `section` aria-label="Recent activity" `space-y-3 rounded-xl border p-5`. Header row has h2 "Recent activity" and a "View all alerts" link (L211-214).
- Role/state branches (hero body, L62-172; evaluated in this order):
  - **Admin** (`user.is_admin`): p "Review accounts, tasks, and reports that need administrator attention." and primary link "Open admin dashboard" → `admin.dashboard().url`.
  - **Active suspension** (non-admin): p "Posting, applying, and browsing are paused while your account is suspended. You can still review your account status and records." and border link "View account actions" → "/my-sanctions" (hard-coded).
  - **Student not verified** (isUnverifiedStudent = !is_admin && student && status !== 'verified'; this covers unverified, pending, rejected, and more_info_requested):
    - Progress header "Onboarding progress" / ("Step 3 of 3 — In review" if pending, else "2 of 3 steps complete").
    - Progress bar `h-2.5 w-full overflow-hidden rounded-full bg-muted`, fill `h-full rounded-full bg-primary transition-all` with **inline style** width '85%' (pending) / '67%'.
    - `ol` `grid gap-2 pt-2 text-xs sm:grid-cols-3`, 3 step cards (`rounded-lg border bg-muted/20 p-3`; the 3rd is `rounded-lg border border-primary/40 bg-primary/5 p-3`):
      - "1. Account created ✓" / "Your student profile is ready."
      - "2. Email confirmed ✓" / ("Preview browsing is unlocked." | "Your login email is confirmed.")
      - "3. Admin review pending" (pending) | "3. Verify as CMU Student". Sub-text when pending: "Wait for approval, or verify instantly with a CMU email code." (autoVerify) | "An administrator is reviewing your details."; otherwise `Unlocks applying, messaging${studentsCanPost ? ', and posting' : ''}.`
    - Paragraph (`text-sm text-muted-foreground`):
      - unverified: "Your account is not verified as a CMU student yet. [You can browse approved tasks in preview mode now. ]Verify with your CMU email code[ for instant approval], or submit your Student ID number and college/program for administrator review."
      - pending: "Your student verification request is awaiting administrator review.[ If you have access to your CMU institutional email, you can verify instantly instead.]"
      - else (rejected/more_info): "Update your details to complete CMU student verification. Applying and posting remain unavailable until verified."
    - Buttons (`flex flex-wrap gap-3`): primary link "Verify instantly with CMU email" (pending) | "Verify as CMU Student" → `studentVerificationUrl ?? '/verification/student'`. "Browse tasks (Preview)" → `browse.index().url`, shown if `user.can_browse_tasks`. "Update submitted details" → `verificationDetails.edit()`, shown if status is rejected or more_info_requested.
  - **Faculty/Organization not verified** (status !== 'verified'):
    - pending + faculty_staff: "Your account is awaiting administrator review. After approval, you can post tasks. Faculty and staff accounts cannot apply to tasks."
    - pending + other (organization): "Your organization details are awaiting administrator review. After approval, you can post tasks. Organization accounts cannot browse or apply to tasks."
    - otherwise: "Update the submitted details requested by the administrator. Your account will return to pending review, and task actions remain unavailable until it is approved."
    - Link "Update submitted details" (rejected/more_info_requested) → `verificationDetails.edit()`.
  - **Verified (any non-admin role)**: p "Find a suitable task, post work, or check the applications and tasks you already have." Links: "Browse tasks" (primary, can_apply_tasks) → browse.index(). "Post a task" (can_post_tasks) → createTask(). "My applications" (can_apply_tasks) → applications.mine(). "My tasks" (can_post_tasks) → myTasks(). Each link is shown only when its permission flag is true, so a verified faculty or organization user sees "Post a task" / "My tasks", and a verified student sees all 4 if posting is allowed.
- Verification section sentences (L182-198):
  - verified (`text-sm text-green-900 dark:text-green-200`): "Your account is verified[ as of {date}][ via CMU institutional email]."
  - unverified: "Not verified as a CMU student yet. Verify your CMU student status to unlock applying, messaging[, and posting]."
  - pending: "Your account is awaiting administrator review. Applying and posting are unavailable until approval."
  - more_info_requested: "The administrator needs more information before completing the review. Update your details to return your account to review."
  - rejected: "Your account verification was rejected. Review the note and update your submitted details if you want another review." Followed by {verificationNote} if set.
  - If isUnverifiedStudent: link "Verify as CMU Student" (`text-sm font-medium underline underline-offset-4`).
- Disclaimers in the body: only `<SafetyNotice />`, which renders SAFETY_NOTICE: "Verification helps confirm who someone is, but it does not guarantee a person's future behavior or the safety of any task." **This text is repeated word for word in site-footer**, which renders SAFETY_NOTICE as well as PAYMENT_BOUNDARY_NOTICE. The dashboard has no payment notice. The verification copy above also overlaps: the same idea ("Verify as CMU Student", applying/posting unavailable) appears in the hero paragraph, the step cards, and the verification section, up to 3 times.
- Interactive controls:
  - Links are raw `Link` with classes; no Button component is used. Primary class: `inline-flex min-h-10 items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground underline-offset-4 hover:underline`. Secondary: same with `border` instead of bg-primary.
  - Native `button` "Acknowledge warning" (`mt-2 underline`) → router.post(`/my-sanctions/${id}/acknowledge`).
  - "Rate your experience" → `/agreements/${rating.id}/rate` (`text-sm underline`).
  - "View all alerts" → "/notifications".
  - Each alert is a Link to alert.url.
  - Several URLs are hard-coded rather than using route helpers: '/my-sanctions', '/verification/student', '/notifications', '/agreements/.../rate', '/my-sanctions/.../acknowledge'.
- Form fields: none.
- Lists:
  - ratingsWaiting rows (`flex flex-wrap items-center justify-between gap-3 border-t pt-3`): taskTitle, "{n} day(s) left", link.
  - recentAlerts as Link blocks (`block border-t pt-3`): title and body. Not a table.
- States: empty alerts "No recent activity yet." (`rounded border p-3 text-sm text-muted-foreground`). The suspension fallback says 'further notice'.
- Status badges: `<VerificationStatusBadge status={user.verification_status} />`.
- Hard-coded colours: `text-green-700 dark:text-green-300` (L88, L92); `border-amber-400 bg-amber-50 text-amber-950` (L176; no dark variant); `border-red-300` (L177); `text-green-900 dark:text-green-200` (L183).
- Redesign issues:
  - Inline `style={{ width }}` on the progress bar (L83).
  - Amber warning box has no dark-mode classes, and its native `<button>` uses only `underline`.
  - Lines 176/177/209/213 are dense one-liners. Verification messaging is repeated 3 times (text wall). The hero uses `max-w-3xl` inside `max-w-6xl`.
  - The onboarding step text is fixed and can be inaccurate: "2. Email confirmed ✓" always shows a tick, and the rejected state shows "2 of 3 steps complete".

### pages/notifications/index.tsx (20 lines)
- Exports: default `NotificationsIndex`.
- Imports: '@inertiajs/react' {Head, Link, router}, '@/layouts/app-layout' (AppLayout), '@/lib/format' {formatDateTime}.
- Layout: `NotificationsIndex.layout = (page) => <AppLayout>{page}</AppLayout>`. No breadcrumbs.
- Outer container: `main` `mx-auto max-w-3xl space-y-5 p-4 sm:p-6`.
- Structure:
  1. Header row `flex flex-wrap items-end justify-between gap-3`: h1 "Notifications" (`text-2xl font-semibold`) and p "{n} unread alert(s)" (`mt-1 text-sm text-muted-foreground`). "Mark all as read" button on the right.
  2. `nav aria-label="Notification filters"` `flex gap-3`: links "All" / "Unread". Active link is `font-semibold underline`, inactive is `underline`.
  3. `section` `space-y-3` aria-label "Unread alerts"/"All alerts": alert cards.
  4. Pagination `nav aria-label="Notification pages"` `flex flex-wrap gap-2`, shown if links.length > 3.
- Interactive controls:
  - Native button "Mark all as read" (`rounded-md border px-3 py-2 text-sm hover:bg-muted`), shown if unreadCount > 0 → router.post('/notifications/read-all').
  - Filter links '/notifications?filter=all' and '?filter=unread'.
  - Page links (`rounded border px-3 py-2 text-sm`; active adds `bg-muted font-semibold`; disabled adds `pointer-events-none opacity-50`). Labels replace &laquo;/&raquo;.
- Form fields: none.
- Lists: alerts.data as Link cards `block rounded-lg border p-4 hover:bg-muted/50` (+ `opacity-75` if read, else `border-primary/60`). Each card shows h2 title (sr-only ", unread"), body, an "Unread" chip `rounded border px-2 py-0.5 text-xs`, and the createdAt date `mt-2 text-xs text-muted-foreground`.
- States: empty is "You have no unread alerts." (unread filter) / "You have no alerts yet." (`rounded-lg border p-5 text-sm text-muted-foreground`).
- Status badges: none (the plain span "Unread" chip).
- Hard-coded colours: none.
- Redesign issues:
  - The whole page is about 6 dense lines.
  - Filters are plain underlined links, not tabs.
  - Uses a native button instead of Button. Hard-coded URLs, no route helpers.
  - `max-w-3xl` wrapper.

### pages/sanctions/index.tsx (8 lines)
- Exports: default `MySanctions`.
- Imports: '@/lib/format' {formatDate, formatDateTime}, '@inertiajs/react' {Head, Link, router}.
- Layout: none declared (no `.layout`).
- Outer container: `main` `mx-auto max-w-3xl space-y-5 p-4 sm:p-6`.
- Structure (top to bottom):
  1. Link "Back to dashboard" → "/dashboard" (`text-sm underline`).
  2. h1 "Account actions" (`text-2xl font-semibold`).
  3. Status p `role="status"` `rounded border p-3`.
  4. Suspension p `rounded border border-red-300 p-4 text-sm`: "Your account is suspended until {date|'further notice'}. {reason} {contact}".
  5. Sanction `article` cards `space-y-2 rounded-lg border p-4`: h2 `font-semibold` with type.replaceAll('_',' '), then p reason, then p `text-sm text-muted-foreground` "Started {date|'—'}[ · Ends {dt}][ · Lifted {date}]".
- Interactive controls: native button "Acknowledge warning" (`underline`), shown when type==='warning' && !acknowledged → router.post(`/my-sanctions/${id}/acknowledge`).
- Form fields: none.
- Lists: sanctions as article cards.
- States: empty is "There are no account actions to show." (`rounded-lg border p-5 text-sm`).
- Status badges: none (the `active` field is not shown).
- Hard-coded colours: `border-red-300` (L7).
- Redesign issues:
  - The entire page is a single line (L7).
  - No layout or breadcrumbs.
  - The type is shown as a raw lowercased enum, not a label.
  - Native button. `max-w-3xl`.

### pages/users/show.tsx (12 lines)
- Exports: default `UserProfile`.
- Imports: '@/lib/format' {formatDate}, '@inertiajs/react' {Head}, '@/components/verification-status-badge' {VerificationStatusBadge}, '@/components/rating-summary' {RatingSummary, ratingNotice} (plus inline type import('@/components/rating-summary').RatingSummaryData), '@/components/star-rating' {StarRating}, '@/components/problem-report-form' {ProblemReportForm}.
- Layout: none declared.
- Outer container: `main` `mx-auto max-w-3xl space-y-5 p-4 sm:p-6`.
- Structure:
  1. `header`: h1 {displayName} (`text-2xl font-semibold`); p `mt-1 text-sm` "{type}[ · {affiliation}]"; badge in `div.mt-2`; p `mt-2 text-sm text-muted-foreground` "Member since {date|'—'} · {completedTasks} completed tasks".
  2. `<RatingSummary summary={profile.ratingSummary} />`.
  3. Notice p `rounded-lg border bg-muted/40 p-4 text-sm` {notice} (text comes from the server prop).
  4. `<ProblemReportForm {...problemReport} />` if problemReport.
  5. `section` `space-y-3`: h2 "Recent visible feedback" (`text-lg font-semibold`), then review articles.
- Interactive controls: none on the page itself (the ProblemReportForm internals were not read).
- Form fields: none directly.
- Lists: ratings as `article` `space-y-2 rounded-xl border p-4`: taskTitle, `<StarRating score={overall} label="Overall experience" />`, "From {raterName} · {date|'—'}" (`text-xs text-muted-foreground`), comment `whitespace-pre-wrap text-sm`, and {ratingNotice} (`text-xs text-muted-foreground`) **repeated on every review card**.
- States: empty is "No visible comments yet." (`rounded-lg border p-4 text-sm text-muted-foreground`).
- Status badges: `<VerificationStatusBadge status={profile.verificationStatus} />`.
- Hard-coded colours: none directly (StarRating uses amber).
- Redesign issues:
  - RATINGS_NOTICE is repeated: once in RatingSummary and again on every review card. There is also the extra {notice} paragraph.
  - Single-line JSX.
  - No layout or breadcrumbs. `max-w-3xl`.

### pages/settings/profile.tsx (150 lines)
- Exports: default `Profile`.
- Imports: '@inertiajs/react' {Form, Head, Link, usePage}, '@/actions/App/Http/Controllers/Settings/ProfileController', '@/components/heading', '@/components/input-error', '@/components/ui/textarea' {Textarea}, '@/components/ui/button' {Button}, '@/components/ui/input' {Input}, '@/components/ui/label' {Label}, '@/routes/profile' {edit}, '@/types' (type Auth).
- Layout: `Profile.layout = { breadcrumbs: [{ title: 'Profile settings', href: edit() }] }`.
- Outer container: `div` `space-y-6` (preceded by an h1 `sr-only` "Profile settings").
- Structure:
  1. `<Heading variant="small" title="Profile" description="Update your name and account details" />`.
  2. `<Form {...ProfileController.update.form()} options={{preserveScroll:true}} className="space-y-6">` containing the fields.
  3. Student-only private info box `space-y-2 rounded-lg border bg-muted/30 p-3.5 text-xs text-muted-foreground`:
     - "**Student ID number (private):** {idNumber || 'Not submitted yet'}"
     - "**Verified CMU email (private):** {institutionalEmail}" (if set)
     - Link "Verify as CMU Student" → "/verification/student" (if not verified; `font-medium text-foreground underline underline-offset-4`).
  4. Save row `flex items-center gap-4`.
- Interactive controls: `<Button disabled={processing} data-test="update-profile-button">Save</Button>` (default variant/size). Verify link as above.
- Form fields (each in `grid gap-2`, error via `<InputError message=…>`):
  - Label "Name": id/name `name`, Input text, required, autoComplete="name", placeholder "Full name", className `mt-1 block w-full`, InputError className `mt-2`.
  - Label "Email address": id/name `email`, type email, autoComplete="username", placeholder "Leave blank to keep your current email".
  - Organization only:
    - "Organization name": id/name `organization_name`, required.
    - "Your position": `position`, required.
    - "About the organization and why it posts tasks": Textarea `supporting_info`, maxLength 1000, required.
  - Non-organization: label "College and program" (student) / "College or office", id/name `affiliation`. Required unless unverified student. Placeholder "Set during CMU student verification" for unverified students.
  - No helper text on any field.
- Lists: none.
- States: there is no processing text (the button is only disabled) and no "Saved" success message.
- Status badges: none.
- Hard-coded colours: none.
- Redesign issues:
  - No success feedback.
  - The private-info block is `text-xs`.
  - The email field is blank by default; the placeholder is the only hint.
  - Hard-coded '/verification/student'.

### pages/settings/security.tsx (156 lines)
- Exports: default `Security`.
- Imports: '@inertiajs/react' {Form, Head}, 'react' {useRef}, '@/actions/App/Http/Controllers/Settings/SecurityController', '@/components/heading', '@/components/input-error', '@/components/password-input', '@/components/ui/button' {Button}, '@/components/ui/label' {Label}, '@/routes/security' {edit}, '@/components/manage-passkeys' (type Props + default), '@/components/manage-two-factor' (type Props + default).
- Layout: `Security.layout = { breadcrumbs: [{ title: 'Security settings', href: edit() }] }`.
- Outer container: fragment; first block `div` `space-y-6` (after an h1 `sr-only` "Security settings").
- Structure:
  1. Heading small "Update password" / "Ensure your account is using a long, random password to stay secure".
  2. Form `SecurityController.update.form()`, preserveScroll, resetOnError [password, password_confirmation, current_password], resetOnSuccess, focuses the field with the error.
  3. `<ManageTwoFactor canManageTwoFactor requiresConfirmation twoFactorEnabled />`.
  4. `<ManagePasskeys canManagePasskeys passkeys />`.
- Interactive controls: `<Button disabled={processing} data-test="update-password-button">Save</Button>`.
- Form fields (all PasswordInput, className `mt-1 block w-full`, InputError below):
  - "Current password": id/name `current_password`, autoComplete current-password, placeholder "Current password".
  - "New password": `password`, new-password, placeholder "New password", passwordrules.
  - "Confirm password": `password_confirmation`, new-password, placeholder "Confirm password", passwordrules.
- Lists: none.
- States: no processing or success text.
- Status badges: none.
- Hard-coded colours: none.
- Redesign issues:
  - No success confirmation.
  - Contains chisel template comments.
  - The 3 sections have no visual separators beyond SettingsLayout's `space-y-12`.

### pages/settings/appearance.tsx (32 lines)
- Exports: default `Appearance`.
- Imports: '@inertiajs/react' {Head}, '@/components/appearance-tabs', '@/components/heading', '@/routes/appearance' {edit as editAppearance}.
- Layout: `{ breadcrumbs: [{ title: 'Appearance settings', href: editAppearance() }] }`.
- Outer container: `div` `space-y-6` (after an h1 `sr-only` "Appearance settings").
- Structure:
  1. Heading small "Appearance settings" / "Update the appearance settings for your account".
  2. `<AppearanceTabs />`.
- Interactive controls: none directly. Form fields: none. Lists: none. States: none. Badges: none.
- Hard-coded colours: none (they are in AppearanceTabs).
- Redesign issues: the heading repeats the layout title.

### layouts/settings/layout.tsx (77 lines)
- Exports: default `SettingsLayout`.
- Imports: '@inertiajs/react' {Link}, 'react' (type PropsWithChildren), '@/components/heading', '@/components/ui/button' {Button}, '@/components/ui/separator' {Separator}, '@/hooks/use-current-url' {useCurrentUrl}, '@/lib/utils' {cn, toUrl}, '@/routes/appearance' {edit as editAppearance}, '@/routes/profile' {edit}, '@/routes/security' {edit as editSecurity}, '@/types' (type NavItem).
- Outer container: `div` className `page`.
- Structure:
  1. `<Heading title="Settings" description="Manage your profile and account settings" />` (default variant, so h2).
  2. Row `flex flex-col lg:flex-row lg:space-x-12`.
  3. `aside` `w-full max-w-xl lg:w-48` containing `nav aria-label="Settings"` `flex flex-col space-y-1 space-x-0`.
  4. `<Separator className="my-6 lg:hidden" />`.
  5. Content `flex-1 md:max-w-2xl`, with inner `section` `max-w-xl space-y-12` holding {children}.
- Interactive controls: nav items "Profile" (edit()), "Security" (editSecurity()), "Appearance" (editAppearance()). Each is a `Button variant="ghost" asChild` with `w-full justify-start`, plus `bg-accent font-semibold` when it is the current URL. Icons are null.
- Form fields / lists (apart from the nav map) / states / badges: none.
- Hard-coded colours: none.
- Redesign issues:
  - Nested max-width wrappers (`max-w-xl` aside, `md:max-w-2xl`, `max-w-xl` section).
  - The nav has no icons.
  - On mobile the nav is a vertical stack, not tabs.

### components/appearance-tabs.tsx (45 lines)
- Exports: default `AppearanceToggleTab`.
- Imports: 'lucide-react' (type LucideIcon; {Monitor, Moon, Sun}), 'react' (type HTMLAttributes), '@/hooks/use-appearance' (type Appearance; {useAppearance}), '@/lib/utils' {cn}.
- Outer container: `inline-flex gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800`.
- Structure: 3 native buttons: "Light" (Sun), "Dark" (Moon), "System" (Monitor). Icon `-ml-1 h-4 w-4`, label `ml-1.5 text-sm`.
- Interactive controls: native `button` (no type attribute, no aria-pressed), onClick updateAppearance(value). Base `flex items-center rounded-md px-3.5 py-1.5 transition-colors`.
- Form fields: none. Lists: tabs array. States: active/inactive styling only. Badges: none.
- Hard-coded colours:
  - L23: `bg-neutral-100`, `dark:bg-neutral-800`
  - L35: `bg-white`, `dark:bg-neutral-700`, `dark:text-neutral-100`
  - L36: `text-neutral-500`, `hover:bg-neutral-200/60`, `hover:text-black`, `dark:text-neutral-400`, `dark:hover:bg-neutral-700/60`
- Redesign issues:
  - Neutral palette instead of theme tokens.
  - No aria-pressed or role="radiogroup".
  - Buttons have no `type="button"`.

### components/manage-two-factor.tsx (126 lines)
- Exports: default `ManageTwoFactor`, type `Props`.
- Imports: '@inertiajs/react' {Form}, 'lucide-react' {ShieldCheck}, 'react' {useEffect, useRef, useState}, '@/components/heading', '@/components/two-factor-recovery-codes', '@/components/two-factor-setup-modal', '@/components/ui/button' {Button}, '@/hooks/use-two-factor-auth' {useTwoFactorAuth}, '@/routes/two-factor' {disable, enable}.
- Outer container: `space-y-6`. Returns null unless canManageTwoFactor.
- Structure:
  1. Heading small "Two-factor authentication" / "Manage your two-factor authentication settings".
  2. Enabled block `flex flex-col items-start justify-start space-y-4`: p "You will be prompted for a secure, random pin during login, which you can retrieve from the TOTP-supported application on your phone." Then a disable Form (`relative inline`) and `<TwoFactorRecoveryCodes recoveryCodesList fetchRecoveryCodes errors />`.
  3. Disabled block (same classes): p "When you enable two-factor authentication, you will be prompted for a secure pin during login. This pin can be retrieved from a TOTP-supported application on your phone." Then a button.
  4. `<TwoFactorSetupModal isOpen onClose requiresConfirmation twoFactorEnabled qrCodeSvg manualSetupKey clearSetupData fetchSetupData errors />`.
- Interactive controls:
  - `Button variant="destructive" type="submit"` "Disable 2FA" (when enabled; disable.form()).
  - `Button` "Continue setup" with ShieldCheck (when hasSetupData) → opens the modal.
  - `Button type="submit"` "Enable 2FA" (enable.form(), onSuccess opens the modal).
  - All buttons are disabled while processing.
- Form fields: none. Lists: none. States: no processing text. Badges: none (no "Enabled" status badge).
- Hard-coded colours: none.
- Redesign issues: no visible enabled/disabled status chip.

### components/manage-passkeys.tsx (71 lines)
- Exports: default `ManagePasskeys`, type `Props`. Internal `EmptyState`.
- Imports: '@inertiajs/react' {router}, 'lucide-react' {KeyRound}, '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyRegistrationController' {destroy}, '@/components/heading', '@/components/passkey-item', '@/components/passkey-register' (PasskeyRegistration), '@/types/auth' (type Passkey).
- Outer container: `space-y-6`. Returns null unless canManagePasskeys.
- Structure:
  1. Heading small "Passkeys" / "Manage your passkeys for passwordless sign-in".
  2. List box `overflow-hidden rounded-lg border border-border` containing PasskeyItems or EmptyState.
  3. `<PasskeyRegistration onSuccess={router.reload} />`.
- Interactive controls: delete via PasskeyItem → router.delete(destroy.url(id), preserveScroll).
- Lists: passkeys as PasskeyItem rows.
- States: empty is `p-8 text-center`, with an icon tile `mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted`, "No passkeys yet", and "Add a passkey to sign in without a password".
- Hard-coded colours: none.
- Redesign issues: none significant.

### components/passkey-item.tsx (93 lines)
- Exports: default `PasskeyItem`.
- Imports: 'lucide-react' {KeyRound, Trash2}, 'react' {useState}, '@/components/ui/button' {Button}, '@/components/ui/dialog' {Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger}, '@/types/auth' (type Passkey).
- Outer container: `flex items-center justify-between border-b p-4 last:border-b-0`.
- Structure:
  1. Icon tile `flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted`.
  2. Name `font-medium tracking-tight`, with an authenticator chip `inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase ring-1 ring-border ring-inset`.
  3. "Added {created_at_diff}[ / Last used {last_used_at_diff}]".
  4. Delete Dialog.
- Interactive controls:
  - Trigger `Button variant="ghost" size="sm"` (`text-destructive hover:bg-destructive/10 hover:text-destructive`), Trash2 icon, sr-only "Remove".
  - Dialog title "Remove passkey", description 'Are you sure you want to remove the "{name}" passkey? You will no longer be able to use it to sign in.'
  - `Button variant="secondary"` "Cancel" (DialogClose).
  - `Button variant="destructive"` "Remove passkey", which shows "Removing..." while deleting.
- Hard-coded colours: none.
- Redesign issues: `text-[11px]` chip.

### components/rating-summary.tsx (12 lines)
- Exports: type `RatingSummaryData` ({count, average|null}), const `ratingNotice` (= RATINGS_NOTICE), function `RatingSummary`.
- Imports: '@/components/star-rating' {StarRating}, '@/constants/notices' {RATINGS_NOTICE}.
- Outer container: `section` `space-y-2 rounded-lg border p-3 text-sm` aria-label="Rating summary".
- Structure:
  1. p `font-medium`: "{count} visible rating(s)" if average is null. Otherwise `<StarRating score={Math.round(average)} label="Average rating" />` + "{average} average · {count} ratings" ("ratings" is not singularised).
  2. p `border-t pt-2 text-xs text-muted-foreground` {ratingNotice}.
- Hard-coded colours: none directly.
- Redesign issues: "1 ratings" grammar bug in the average branch. The notice is repeated in its consumers.

### components/star-rating.tsx (3 lines)
- Exports: `StarRating` ({score, label='Rating'}).
- Imports: none.
- Outer: span `inline-flex items-center gap-1`, aria-label "{label}: {score} out of 5". Inner aria-hidden span `tracking-wide text-amber-600` with '★'.repeat(score) + '☆'.repeat(5-score), plus sr-only "{score} out of 5".
- Hard-coded colours: `text-amber-600` (L2; no dark variant).
- Redesign issues: text glyph stars, no lucide icons. A score outside 0-5 would throw in repeat().

### components/heading.tsx (26 lines)
- Exports: default `Heading` ({title, description?, variant 'default'|'small'}).
- Imports: none.
- Outer: `header`, className '' for small, otherwise `mb-6 space-y-1 md:mb-8`.
- Structure: h2 (`mb-0.5 text-base font-semibold` for small, `text-xl font-semibold` otherwise), then optional p `text-sm text-muted-foreground`.
- Hard-coded colours: none.
- Redesign issues: always renders h2.

### components/site-footer.tsx (21 lines)
- Exports: default `SiteFooter`.
- Imports: '@/constants/notices' {PAYMENT_BOUNDARY_NOTICE, SAFETY_NOTICE}, '@inertiajs/react' {Link}.
- Outer: `footer` `mt-auto border-t bg-muted/30 px-4 py-8 text-sm md:px-6 print:hidden`.
- Structure:
  1. `nav aria-label="Information"` `mx-auto flex max-w-6xl flex-wrap gap-x-5 gap-y-1`, with links (`focus-ring inline-flex min-h-11 items-center rounded-sm underline underline-offset-4 hover:text-brand md:min-h-8`): "How TaskMate works" (/how-it-works), "Task Guidelines" (/task-guidelines), "Safety and Limits" (/safety-and-limits), "Privacy Notice" (/privacy).
  2. `div` `mx-auto mt-4 max-w-6xl space-y-2 text-muted-foreground` with p PAYMENT_BOUNDARY_NOTICE and p SAFETY_NOTICE.
- Hard-coded colours: none (uses the custom `hover:text-brand` and `focus-ring`).
- Redesign issues: SAFETY_NOTICE is repeated on the dashboard via SafetyNotice. Link capitalisation is inconsistent ("How TaskMate works" vs "Task Guidelines").

### components/safety-notice.tsx (6 lines)
- Exports: `SafetyNotice`.
- Imports: '@/components/ui/alert' {Alert, AlertDescription}, '@/constants/notices' {SAFETY_NOTICE}.
- Renders `<Alert><AlertDescription>{SAFETY_NOTICE}</AlertDescription></Alert>` with default variant, no icon, no title.
- Hard-coded colours: none.

### constants/notices.ts (5 lines)
- PAYMENT_BOUNDARY_NOTICE = 'TaskMate records agreements and payment status only. Payments are made directly between users. TaskMate does not hold, process, or guarantee payment.'
- COMPLETION_PAYMENT_NOTICE = 'TaskMate records completion and payment status only. Payments are made directly between the poster and the student. TaskMate does not hold, process, recover, or guarantee payment.'
- SAFETY_NOTICE = "Verification helps confirm who someone is, but it does not guarantee a person's future behavior or the safety of any task."
- STUDENT_TASK_SAFETY_NOTICE = 'Verification and administrator review help inform your decision but do not guarantee the safety of a person or task. Do not agree to anything that makes you uncomfortable, and report concerns.'
- RATINGS_NOTICE = "Ratings are one person's view of one completed task. They are contextual information and do not guarantee a person's future behavior. Serious problems should be reported, not rated."

---

## 5. Part C — Discovery, 4-Part Terms Card, Applications & Core UI Primitives

No layout component is imported in any of these pages, so each page relies on the default/persistent layout. No `AppLayout` and no breadcrumbs appear in these files.

---

### pages/browse/index.tsx (187 lines)
- Exports: `default BrowseTasks`
- Imports: '@/lib/format' {formatDate, formatAmount}, 'react' {useState}, '@inertiajs/react' {Head, Link, router}, '@/components/application-status-badge', '@/components/verification-status-badge', '@/components/terms-status-badge' {ToBeDiscussedBadge}, '@/routes/browse' (default `browse`)
- Layout: none imported. `<Head title="Browse tasks" />`
- Props: tasks{data,links}, filters, options{categories,workTypes?,workModes,sorts}, isVerifiedStudent=true, studentVerificationUrl=null
- Outer container: `mx-auto max-w-6xl space-y-6 p-4 sm:p-6` (L54)
- Structure:
  1. Header div: h1 `text-2xl font-semibold` "Browse tasks"; p `mt-1 text-sm text-muted-foreground` "Search approved tasks and review the work details before you apply."
  2. (!isVerifiedStudent) div role=status, amber banner (L61): p.font-semibold "Preview mode — Not verified as a CMU student yet"; p.text-xs "You can browse approved tasks and check schedules right now. Verify your CMU student status to apply, message posters, or post tasks."; Link "Verify as CMU Student".
  3. Filter `<form>` `space-y-4 rounded-xl border p-4 sm:p-5`: grid `grid gap-3 sm:grid-cols-2 lg:grid-cols-4` holding search, category, work mode and sort fields.
  4. `<details>` `rounded-lg border px-4 py-3`, summary `cursor-pointer text-sm font-medium` "More filters" + " · filters active" when advanced filters are set. Inner grid `mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3`: work type (only if options.workTypes has items), min budget, max budget. Starts open when advanced filters are active.
  5. Actions row `flex flex-wrap items-center gap-3`: submit button and clear link.
  6. Results grid `grid gap-4 md:grid-cols-2 xl:grid-cols-3` of `<article className="flex flex-col gap-3 rounded-xl border p-5">`:
     - top row: p.text-sm.muted `{category} · {workTypeLabel}`; h2 `mt-1 text-lg font-semibold` title; ApplicationStatusBadge if hasApplied.
     - p `line-clamp-3 text-sm text-muted-foreground` descriptionPreview.
     - terms box `space-y-1.5 rounded-lg bg-muted/40 p-3`:
       - pay: `text-xl font-semibold` "₱{amount}", or ToBeDiscussedBadge "Pay: To be discussed".
       - timing: span `rounded bg-background px-2 py-0.5 text-xs font-medium` payTimingLabel, or ToBeDiscussedBadge "Timing: To be discussed".
       - "Hours:": scheduleSummary, or ToBeDiscussedBadge (default label).
       - workMode.
       - "Deadline: {date}" (if set).
       - "Workplace: {name · address}" (if set).
     - footer `mt-auto border-t pt-3`: posterName (text-sm font-medium), posterType (text-xs muted), VerificationStatusBadge.
     - Link "View task details".
  7. Empty state div `rounded-xl border p-10 text-center`.
  8. Pagination nav aria-label="Task pages" (shown when links.length > 3).
- Interactive controls:
  - Link "Verify as CMU Student": href `studentVerificationUrl ?? '/verification/student'`, raw className `inline-flex min-h-9 items-center rounded-md bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground underline-offset-4 hover:underline`. Shown when !isVerifiedStudent.
  - Native `<button type="submit">` "Show tasks", class `min-h-10 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground`. Not the Button component.
  - Link "Clear filters" → `browse.index().url`, class `text-sm underline underline-offset-4`. Appears in the form and again in the empty state (`mt-4 inline-block ...`).
  - Link "View task details" → `browse.show(task.id)`, class `text-sm font-medium underline underline-offset-4`.
  - Pagination Links: `rounded border px-3 py-1 text-sm` + `bg-muted font-medium` when active. Disabled pages are spans with `text-muted-foreground`. Labels use dangerouslySetInnerHTML.
  - Form submit runs `router.get(browse.index().url, values, {preserveState, replace})`.
- Form fields (all are native elements inside a wrapping `<label className="grid gap-1.5 text-sm font-medium">`; no helper text; no error component):
  - "Search tasks": input id=search-tasks, name=search, text, placeholder "Try tutoring, design, or an activity", wrapper lg:col-span-2.
  - "Category": select id=filter-category, name=category, first option "All categories".
  - "Work mode": select id=filter-work-mode, name=work_mode, first option "All work modes".
  - "Sort by": select id=sort-tasks, name=sort, options.sorts, wrapper `sm:col-span-2 lg:col-span-2`.
  - "Work type": select id=filter-work-type, name=work_type, first option "All work types". Conditional.
  - "Minimum budget (PHP)": input id=min-budget, name=min_budget, type=number, min 0, max 1000000, step 0.01.
  - "Maximum budget (PHP)": input id=max-budget, name=max_budget, same attributes.
  - Shared input/select class: `h-10 rounded-md border bg-background px-3 font-normal`.
- Lists: tasks.data shown as cards (article). No table.
- States:
  - Empty: h2 "No tasks match your search"; p "Try changing or clearing your filters."; Link "Clear filters".
  - No processing state. No error display.
- Status badges: `<ApplicationStatusBadge status="pending" label="Applied" />`, `<ToBeDiscussedBadge label="Pay: To be discussed" />`, `<ToBeDiscussedBadge label="Timing: To be discussed" />`, `<ToBeDiscussedBadge />`, `<VerificationStatusBadge status={task.posterVerificationStatus} />`.
- Hard-coded colours: L61 `border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100`
- Redesign issues:
  - Native `<select>` ×4 and native `<input>` instead of ui/Input; native submit button instead of Button.
  - Hard-coded amber preview banner instead of Alert variant="warning".
  - Raw-classed Links act as buttons.
  - `<details>` for filters; pagination uses dangerouslySetInnerHTML.

---

### pages/browse/show.tsx (831 lines, ~50 KB)
- Exports: `default BrowseTaskDetail`
- Imports: '@/lib/format' {formatDate, formatAmount, formatHoursFlexibility, formatTime12Hour}, '@/lib/schedule-fit' {buildAskPosterMessage, evaluateScheduleFit, type ClassBlock}, '@/constants/notices' {PAYMENT_BOUNDARY_NOTICE, STUDENT_TASK_SAFETY_NOTICE}, 'react' {useMemo, useRef, useState}, '@inertiajs/react' {Head, Link, router, useForm}, '@/components/ui/button' {Button}, '@/components/ui/input' {Input}, '@/components/ui/label' {Label}, '@/components/ui/textarea' {Textarea}, '@/components/input-error' (default InputError), '@/components/verification-status-badge', '@/components/application-status-badge', '@/components/terms-status-badge' {ScheduleFitBadge, ToBeDiscussedBadge}, '@/routes/browse' (default browse), '@/routes/applications' (default applications), '@/components/rating-summary' {RatingSummary} (plus an inline type import of RatingSummaryData), '@/components/problem-report-form' {ProblemReportForm}
- Layout: none imported. `<Head title={task.title} />`
- Props: task, poster, application, conversation?, isVerifiedStudent=true, studentVerificationUrl=null, canSaveSchedule=true, canApply=false, limitedView=false, currentTaskStatus, status, messageMaxLength, problemReport, offPlatformWarning, studentClassSchedule=[], daysOfWeek=FALLBACK_DAYS (Mon–Sun), maxClassBlocks=25
- useForm fields: message, proposed_amount, poster_identity_checked, no_upfront_fee_checked, known_person_or_reviews_checked, work_details_confirmed
- Derived values:
  - missingTerms can contain 'Work hours', 'Pay amount', 'When paid (pay timing)'.
  - requiredChecksComplete = check 1 && check 2.
  - checklistCheckedCount counts checks 1–3.
- Outer container: `mx-auto max-w-4xl space-y-5 p-4 sm:p-6` (L258)

**Top blocks**
  1. (status) div role=status `rounded-lg border px-4 py-3 text-sm` showing {status}.
  2. (limitedView) div `rounded-lg border p-4 text-sm`: "This task is currently {currentTaskStatus lowercased}. You can review the task details and your application status."
  3. (!isVerifiedStudent) amber banner role=status (L270): "Preview mode — Verify your CMU student status to apply" / "You can inspect all offer terms and test your class schedule fit live. Applying and messaging unlock right after verification." + Link "Verify as CMU Student" (same raw class as the index page).
  4. Header:
     - p muted `{category} · {workTypeLabel}`
     - h1 `mt-1 text-2xl font-semibold` title
     - p `mt-2 text-sm text-muted-foreground` "Review the offer terms, the poster, and your class schedule in order before you decide."
     - (canApply && !application) `<a href="#my-decision">` "Go to my decision", class `mt-3 inline-flex min-h-10 items-center rounded-md border px-4 py-2 text-sm font-medium underline-offset-4 hover:underline`.

**Section '1. The offer'**: section aria-labelledby=section-the-offer, `space-y-4 rounded-xl border p-5`
  - Header row: h2#section-the-offer `text-lg font-semibold` "1. The offer". When missingTerms exist: ToBeDiscussedBadge label "`{n} term(s) to be discussed`".
  - Body `space-y-3 border-t pt-3`:
    1. "Tasks" (h3 `text-sm font-medium text-muted-foreground`):
       - description, `mt-1 whitespace-pre-wrap text-sm sm:text-base`
       - "Main activities" (text-xs label) requiredActivities
       - "Expected result" deliverables
       - "**Skills:** …"
       - "**Estimated duration:** {n} hours"
    2. "Hours" block `border-t pt-3`:
       - scheduleSummary (font-medium) or ToBeDiscussedBadge
       - span "· Can hours change: {formatHoursFlexibility(canHoursChange)}"
       - scheduleNote
       - "Deadline: {date | 'No deadline listed'}"
    3. Pay box `rounded-xl border bg-muted/30 p-4`, grid `grid gap-4 sm:grid-cols-2` (h3s `text-xs font-medium uppercase tracking-wide text-muted-foreground`):
       - "Pay amount": `text-2xl font-semibold` ₱amount, or ToBeDiscussedBadge.
       - "When paid (Pay timing)": `text-lg font-semibold` payTimingLabel, or ToBeDiscussedBadge, plus payTimingNote (text-xs).
       - p `mt-3 text-xs text-muted-foreground` {PAYMENT_BOUNDARY_NOTICE}.
    4. Grid `grid gap-3 border-t pt-3 sm:grid-cols-2`:
       - "Location": workMode + "**Workplace:** name · address".
       - "Contact person": poster.displayName (Link to profileUrl `underline underline-offset-4`, or span) + p.text-xs "Private in-app messaging opens once you submit your application."
    5. (missingTerms > 0) amber box (L394):
       - text: "**Missing terms:** {list} is/are marked *To be discussed*. Ask the poster before locking an agreement."
       - (canApply && !application) Button size=sm variant=outline "Ask poster about missing terms" → handleAskPosterPrefill.

**Section '2. The poster'**: section aria-labelledby=section-the-poster, `space-y-4 rounded-xl border p-5`
  1. h2#section-the-poster "2. The poster".
  2. `space-y-2`:
     - displayName (Link or span)
     - p.text-sm `{accountType} · {affiliation}`
     - `<VerificationStatusBadge status={poster.verificationStatus} />`
     - "Member since {date | '—'}"
     - `<RatingSummary summary={poster.ratingSummary} />`
  3. Amber box (L425) {STUDENT_TASK_SAFETY_NOTICE}.
  4. (offPlatformWarning) amber box (L427): "This post contains a request to move outside TaskMate or skip its steps. Be careful, keep agreements…"
  5. (canApply && !application) checklist box `space-y-3 rounded-lg border bg-muted/20 p-4`:
     - h3 `text-sm font-semibold` "Pre-acceptance checklist (3 quick checks)"
     - pill span `rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium` "{n} of 3 checked"
     - p.text-xs "Complete checks 1 and 2 before applying. Check 3 is optional if you do not personally know the poster."
     - list `space-y-2.5 text-sm`. Each item is a `<label className="flex items-start gap-2.5">` with a native `<input type="checkbox" className="mt-1">`:
       - id/name `poster_identity_checked`: "**1. Poster name and profile checked** (required) — I checked who posted this offer and inspected their profile and verification badge." + `<InputError message={errors.poster_identity_checked}>`.
       - id/name `no_upfront_fee_checked`: "**2. No upfront payment or fee asked** (required) — This offer does not ask me to pay any upfront fee, deposit, or registration charge." + InputError.
       - id/name `known_person_or_reviews_checked`: "**3. Known person can confirm, or I checked reviews/profile** (optional) — Someone I trust knows this poster, or I reviewed their past ratings and profile." No InputError.
       - The "(required)"/"(optional)" markers are spans `text-xs text-muted-foreground`.
  6. (problemReport) `<ProblemReportForm action types />`.

**Section '3. My classes'**: section aria-labelledby=section-my-classes, `space-y-4 rounded-xl border p-5`
  1. Header row: h2 "3. My classes" + `<ScheduleFitBadge status={scheduleFit.status} />`.
  2. Grid `grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2`:
     - "Offered work hours" (uppercase label): scheduleSummary or ToBeDiscussedBadge, plus text-xs {scheduleFit.negotiabilityNote}.
     - "Schedule check result": {scheduleFit.reason}.
  3. (conflicts > 0) red box (L522) `space-y-2 rounded-lg border … p-4 text-sm`:
     - p.font-medium "Conflicting class block(s):"
     - ul `list-disc space-y-1 pl-5` of "{dayLabel} {blockRange} ({label}) overlaps with work hours {taskRange}"
     - (canApply && !application) Button size=sm variant=outline className=mt-2 "Ask poster to adjust hours".
  4. Editor card `space-y-3 rounded-lg border p-4`:
     - Header: h3 `text-sm font-semibold` "My saved weekly class schedule ({count})" + p.text-xs "Saved privately to your account only—posters and other users never see your class schedule."
     - Toggle: Button size=sm variant=outline, text "Hide schedule editor" / "Edit my classes". The editor starts open when there are no saved blocks.
     - Saved list (if blocks exist): ul `flex flex-wrap gap-2`. Each chip is a li `inline-flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1 text-xs` showing "**{DayLabel}** {start12h}–{end12h} · {label}".
     - Remove control (only while the editor is open): native `<button>` "×", aria-label "Remove {Day} class block", class `font-semibold text-muted-foreground hover:text-foreground`.
     - Editor (when open) `space-y-3 border-t pt-3`, grid `grid gap-3 sm:grid-cols-4`, each field in `grid gap-1`:
       - Label "Day": native select id=class_day (no name), class `h-9 rounded-md border bg-background px-2.5 text-sm`, options from daysOfWeek. **There are no day chips: the day is picked from a select.**
       - Label "Start": Input id=class_start_time type=time, default '08:00', className h-9.
       - Label "End": Input id=class_end_time type=time, default '12:00', className h-9.
       - Label "Label (optional)": Input id=class_label, maxLength 80, placeholder "e.g. IT57 Lecture", className h-9.
     - blockError: p `text-xs text-red-600`. Messages: "You can save up to {max} class blocks." / "Class end time must be later than start time."
     - Actions `flex flex-wrap items-center gap-2`:
       - Button size=sm variant=outline "Add class block".
       - If canSaveSchedule: Button size=sm (default variant), text "Saving..." / "Save my class schedule" (has unsaved changes) / "Save schedule to account". Disabled while saving. Saves via `router.put('/my-class-schedule', {blocks})`.
       - If unsaved: span.text-xs "Unsaved changes (fit check updates live above)."
       - Saved notice: span role=status `text-xs font-medium text-emerald-700 dark:text-emerald-300` "Your class schedule was saved privately to your account."
       - Else (canSaveSchedule false): span.text-xs "Fit check updates live above. Verify your CMU student status to save your schedule."

**Section '4. My decision'** (three variants):
  - A. `application` exists: section#my-decision `space-y-3 rounded-xl border p-5`
    - h2 "4. My decision — Application submitted"
    - `<ApplicationStatusBadge status label>`
    - if accepted: p "You were accepted. The next step is to confirm the agreement with the poster."
    - if conversation: Button variant=outline asChild → Link `/messages/{id}` "View conversation" (when sendBlockedReason is set) / "Message poster"
    - p muted {sendBlockedReason}
  - B. `canApply`: section#my-decision `space-y-4 rounded-xl border p-5`
    - Header: h2 "4. My decision"; p "Ask the poster about unclear terms or schedule fit, review your summary before applying, or decline. You can apply only once."; Button size=sm variant=outline "Ask poster".
    - `<form onSubmit=handleFinalSubmit className="space-y-4">`. Submits with `applyForm.post(applications.store.url(task.id))`; onError reopens the summary.
      - Label "Message to the poster": Textarea id=message, name=message, maxLength=messageMaxLength, required, placeholder "Introduce yourself, ask about any “To be discussed” terms, or explain how this fits your schedule." Helper: "Up to {n} characters. Submitting opens a private message thread with the poster." InputError errors.message.
      - Label "Suggested amount (optional)": Input id/name=proposed_amount, type=number, min 1, max 1000000, step 0.01. Helper: "This is only a suggestion. The final amount is agreed later between you and the poster." InputError errors.proposed_amount.
      - reviewNotice: div role=alert, amber (L699). Possible texts:
        - "Complete the two required poster checks in “The poster” section before reviewing your application."
        - "Write a short message to the poster (or click “Ask poster” to pre-fill questions) before reviewing."
      - Step 1 (summary closed), row `flex flex-wrap items-center gap-3 pt-1`:
        - Button (default) "Review & apply" → handleOpenSummary
        - Button variant=outline "Ask poster"
        - Button variant=ghost asChild Link browse.index() "Decline (back to tasks)"
      - Step 2 (summary open) div ref=summaryRef, aria-labelledby=check-before-apply-heading, `space-y-4 rounded-xl border-2 border-primary/40 bg-muted/20 p-5`:
        - h3 `text-base font-semibold` "Check before you apply"; p "Nothing is sent until you confirm. Review these key terms one last time."
        - `<dl className="grid gap-3 rounded-lg border bg-background p-4 text-sm sm:grid-cols-2">`, dt `text-xs text-muted-foreground`:
          - Tasks (title, col-span-2)
          - Pay amount (₱ or TBD badge)
          - When paid (Pay timing)
          - Work hours
          - Class fit (ScheduleFitBadge)
          - Poster checklist: "{n} of 3 checked" + " (optional check 3 left unticked)" (col-span-2)
        - (missingTerms) amber box: "**Still to be discussed:** {list}. Make sure you settle these clearly in chat and in the written agreement before starting work."
        - (clashes) red box: "**Class schedule clash detected:** Confirm with the poster whether hours can change before accepting an agreement."
        - Checkbox: label `flex items-start gap-2 text-sm`, native input id/name `work_details_confirmed`, type=checkbox, required, className mt-1. Text: "I have reviewed the offer terms, poster details, and my class fit." InputError errors.work_details_confirmed.
        - Button type=submit, disabled while processing or until the box is ticked, text "Submitting..." / "Confirm & submit application".
        - Button variant=outline "Go back" (closes the summary).
  - C. `!isVerifiedStudent`: section#my-decision `space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-5`
    - h2 "4. My decision — Verify as a CMU Student to apply"
    - p "Only verified CMU students can apply to tasks and start private task conversations. Verify instantly with a 6-digit code…"
    - Button asChild Link "Verify as CMU Student" (studentVerificationUrl ?? '/verification/student')
    - Button variant=ghost asChild Link browse.index() "Back to Browse Tasks"
  - Otherwise: nothing is rendered.

**Footer**: Link browse.index() "Back to Browse Tasks", `inline-block text-sm underline underline-offset-4`.

- **"Ask poster" count:**
  - 4 visible buttons, all calling handleAskPosterPrefill:
    - L400 "Ask poster about missing terms"
    - L534 "Ask poster to adjust hours"
    - L658 "Ask poster"
    - L710 "Ask poster"
  - The string also appears at L234 (reviewNotice text) and L630 (a code comment), for 6 occurrences in total.
- What the prefill does: builds a draft with buildAskPosterMessage({taskTitle, missingTerms, conflicts}), sets message, closes the summary, then focuses and scrolls to the textarea.
- Lists:
  - classBlocks shown as chips.
  - scheduleFit.conflicts shown as a ul.
  - Summary shown as a dl.
  - No tables.
- Status badges:
  - ToBeDiscussedBadge (default label, and the `{n} term(s) to be discussed` label)
  - ScheduleFitBadge status={scheduleFit.status} (×2)
  - VerificationStatusBadge status={poster.verificationStatus}
  - ApplicationStatusBadge status/label={application.*}
- Hard-coded colours:
  - L270 `border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100`
  - L394, L425, L427, L699, L768: `border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-100`
  - L522, L774: `border-red-300 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950/60 dark:text-red-100`
  - L608 `text-red-600`
  - L619 `text-emerald-700 dark:text-emerald-300`
- Redesign issues:
  - Native checkboxes ×4 (`className="mt-1"`, default browser size) instead of ui/Checkbox. Native day `<select>` and a native "×" remove button with a tiny hit area.
  - Seven hard-coded amber boxes and two red boxes instead of Alert variants. Raw-classed Link and `<a>` used as buttons.
  - Text walls: long checklist sentences, safety notice, verification copy. Section cards are plain `rounded-xl border p-5` divs, not Card.
  - Single 831-line component with a `max-w-4xl` wrapper.

---

### pages/applications/index.tsx (36 lines, mostly minified JSX on L15 and L34–35)
- Exports: `default MyApplications`
- Imports: '@/lib/format' {formatDate, formatAmount}, '@inertiajs/react' {Form, Head, Link}, '@/components/ui/button' {Button}, '@/components/application-status-badge', '@/routes/applications' (applicationsRoutes), '@/routes/browse' (browseRoutes), '@/routes/agreements' (agreementsRoutes), '@/components/payment-status-badge' {PaymentStatusBadge}, '@/components/terms-status-badge' {ToBeDiscussedBadge}
- Layout: none. `<Head title="My applications" />`
- Outer container: `mx-auto max-w-5xl space-y-5 p-4 sm:p-6`
- Structure:
  1. h1 `text-2xl font-semibold` "My applications"; p muted "See each response and the next step for your task applications."
  2. (status) div role=status `rounded-lg border px-4 py-3 text-sm`.
  3. Grid `grid gap-4 md:grid-cols-2` of article `space-y-3 rounded-xl border p-5`:
     - top row: h2.font-semibold taskTitle + ApplicationStatusBadge
     - "Poster: {name}"
     - "Pay:" ₱amount (font-medium) or ToBeDiscussedBadge, plus "({payTimingLabel})" muted
     - "Hours: {summary | 'To be discussed'}"
     - "Applied {date | '—'}" (text-xs)
     - nextStep p `rounded-md border bg-muted/40 p-3 text-sm`
     - PaymentStatusBadge
     - rate button
     - "Task status: {taskStatus}" (if !taskApproved)
     - action row `flex flex-wrap gap-2`
     - messageBlockedReason (text-xs muted)
  4. Empty state `rounded-xl border p-8 text-center`.
  5. Pagination nav aria-label="Pagination".
- nextStep texts:
  - pending + otherApplicantAccepted: "The poster is working out an agreement with another applicant. Your application stays active until an agreement is confirmed."
  - pending: "Waiting for the poster to respond. You can withdraw while your application is pending."
  - accepted + agreed: "Both parties confirmed the agreement. Work may begin under the locked terms."
  - accepted + negotiating: "Review the agreement and confirm the same version before work begins. You can ask the poster to change it."
  - accepted (other): "You were accepted. The poster will propose an agreement before work begins."
  - declined: "The poster declined this application."
  - withdrawn: "You withdrew this application."
  - cancelled + agreement cancelled: "The agreement was cancelled and your application is closed. The task is open again for other applicants."
- Interactive controls:
  - Button size=sm variant=outline asChild Link agreementsRoutes.rate(agreementId) "Rate your experience". Shown when needsRating && agreementId.
  - Button variant=outline size=sm Link applicationsRoutes.task(id) "View task details". Always shown.
  - Button size=sm variant=outline Link `/messages/{conversationId}` "View conversation" (when messageBlockedReason is set) / "Message poster". Shown when conversationId.
  - Button size=sm (default) Link agreementsRoutes.show(agreementId) "View agreement". Shown when agreementId.
  - `<Form {...applicationsRoutes.withdraw.form(id)}>` with window.confirm('Withdraw this application?') and Button size=sm variant=outline type=submit "Withdraw". Shown when status === 'pending'.
  - Empty state: Button className=mt-4 asChild Link browseRoutes.index() "Browse tasks".
- Form fields: none (only the withdraw form).
- Lists: applications.data shown as cards.
- States:
  - Empty: h2 "You have not applied to any tasks"; p "Browse approved tasks to find work that suits you."
  - No processing text.
- Status badges: ApplicationStatusBadge(status, statusLabel), ToBeDiscussedBadge (default label), PaymentStatusBadge(paymentStatus, paymentStatusLabel).
- Hard-coded colours: none.
- Redesign issues:
  - Entire JSX is minified onto 2 lines, which makes it hard to maintain.
  - Uses window.confirm for withdraw.
  - Pagination uses dangerouslySetInnerHTML.
  - `max-w-5xl` wrapper; cards are plain articles, not Card.

---

### components/problem-report-form.tsx (9 lines, minified)
- Exports: `ProblemReportForm` ({action, types, reportLabel='Report a problem', maxLength=3000, contextMessages?})
- Imports: '@inertiajs/react' {Form}, '@/components/ui/button' {Button}, '@/components/input-error' (default)
- Outer container: `<details className="rounded-lg border p-4">`, summary `cursor-pointer font-medium` {reportLabel}
- Structure: `<Form action method="post" encType="multipart/form-data" className="mt-4 space-y-3">` containing:
  1. (contextMessages defined) p `rounded border bg-muted p-3 text-sm` "This message and up to {n} messages before and after it will be shared with administrators."
  2. Report type select.
  3. "What happened?" textarea.
  4. Evidence file input.
  5. Privacy helper text.
  6. Submit button.
- Form fields (each wrapped in `<label className="block text-sm">`; no id/htmlFor):
  - "Report type": native select name=type, required, `mt-1 h-10 w-full rounded border bg-background px-3`. No error component.
  - "What happened?": textarea name=description, required, maxLength, `mt-1 min-h-28 w-full rounded border bg-background p-3`, InputError errors.description.
  - "Evidence (optional)": input name="evidence[]", type=file, multiple, accept ".jpg,.jpeg,.png,.pdf", `mt-1 block w-full text-sm`. No error shown.
  - Helper p.text-xs muted: "Do not upload government ID photos, selfies, or sensitive documents beyond what is needed. Administrators will see uploaded evidence."
- Controls: Button type=submit (default variant/size), disabled={processing}, text "Submit report". The text does not change while processing.
- Hard-coded colours: none.
- Redesign issues:
  - Native select; unstyled native file input.
  - Errors for type and evidence are never shown.
  - Minified one-liner.

---

### components/terms-status-badge.tsx (18 lines)
- Exports: `ToBeDiscussedBadge({label='To be discussed'})`, `ScheduleFitBadge({status:'fits'|'clashes'|'cannot_check'})`
- Imports: 'lucide-react' {CircleAlert, CircleCheck, Clock, TriangleAlert}, '@/components/status-badge' {StatusBadge}
- Renders:
  - ToBeDiscussed → `<StatusBadge tone="warning" icon={CircleAlert}>{label}`
  - fits → tone="success" CircleCheck "Fits your classes"
  - clashes → tone="danger" TriangleAlert "Clashes with your classes"
  - otherwise → tone="neutral" Clock "Cannot check yet"
- Hard-coded colours: none.

### components/verification-status-badge.tsx (26 lines)
- Exports: `VerificationStatusBadge({status})`
- Imports: '@/components/status-badge' {STATUS, StatusFromMap}, type {StatusConfig}
- Map:

  | status | STATUS config | label |
  |---|---|---|
  | unverified | STATUS.neutral | 'Not verified as student' |
  | pending | STATUS.pending | 'Pending verification' |
  | verified | STATUS.success | 'Verified' |
  | rejected | STATUS.danger | 'Verification rejected' |
  | more_info_requested | STATUS.info | 'More information requested' |

- Renders `<StatusFromMap map status>{label}`. Hard-coded colours: none.
- Issue: the 'Not verified as student' label is also used for faculty/organization posters.

### components/application-status-badge.tsx (14 lines)
- Exports: `ApplicationStatusBadge({status,label})`
- Imports: '@/components/status-badge' {STATUS, StatusFromMap}, type {StatusConfig}
- Map: pending→STATUS.pending, accepted→success, declined→danger, withdrawn→closed, cancelled→closed. Hard-coded colours: none.

### components/task-status-badge.tsx (17 lines)
- Exports: `TaskStatusBadge({status,label})`
- Imports: same as application-status-badge.
- Map: pending_review→pending, changes_requested→attention, approved→success, assigned→info, in_progress→active, completed→success, rejected→danger, cancelled→closed. Hard-coded colours: none.

---

### components/ui/badge.tsx (54 lines)
- Exports: `Badge`, `badgeVariants`
- Imports: '@radix-ui/react-slot' {Slot}, 'class-variance-authority' {cva, type VariantProps}, 'react' (* as React), '@/lib/utils' {cn}
- Base: `focus-ring inline-flex items-center justify-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3.5 [&>svg]:shrink-0 [&>svg]:pointer-events-none aria-invalid:border-destructive transition-[color,background-color] overflow-hidden`
- Variants:
  - default: `border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90`
  - secondary: `border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90`
  - destructive: `border-transparent bg-destructive text-on-destructive [a&]:hover:bg-destructive/90`
  - outline: `border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground`
  - success: `border-success-border bg-success-bg text-success-fg`
  - warning: `border-warning-border bg-warning-bg text-warning-fg`
  - danger: `border-danger-border bg-danger-bg text-danger-fg`
  - info: `border-info-border bg-info-bg text-info-fg`
  - neutral: `border-neutral-border bg-neutral-bg text-neutral-fg`
- Default variant: default. No sizes. Supports asChild. Hard-coded palette colours: none (token names only).

### components/ui/button.tsx (59 lines)
- Exports: `Button`, `buttonVariants`
- Imports: '@radix-ui/react-slot' {Slot}, 'class-variance-authority' {cva, type VariantProps}, 'react', '@/lib/utils' {cn}
- Base: `focus-ring inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,background-color,border-color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 aria-invalid:border-destructive`
- Variants:
  - default: `bg-primary text-primary-foreground shadow-xs hover:bg-primary/90`
  - destructive: `bg-destructive text-on-destructive shadow-xs hover:bg-destructive/90`
  - outline: `border border-border bg-card shadow-xs hover:bg-accent hover:text-accent-foreground`
  - secondary: `bg-secondary text-secondary-foreground hover:bg-secondary/80`
  - ghost: `hover:bg-accent hover:text-accent-foreground`
  - link: `text-brand underline-offset-4 hover:underline`
- Sizes:
  - default: `h-11 px-4 py-2 has-[>svg]:px-3 md:h-9`
  - sm: `h-10 rounded-md px-3 has-[>svg]:px-2.5 md:h-8`
  - lg: `h-12 rounded-md px-6 has-[>svg]:px-4 md:h-10`
  - icon: `size-11 md:size-9`
- Defaults: variant default, size default. Supports asChild. Hard-coded colours: none.

### components/ui/card.tsx (69 lines)
- Exports: Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent
- Imports: 'react', '@/lib/utils' {cn}
- Classes:
  - Card: `bg-card text-card-foreground flex flex-col gap-4 rounded-xl border py-4 shadow-xs md:gap-6 md:py-6`
  - CardHeader: `flex flex-col gap-1.5 px-4 md:px-6`
  - CardTitle (div): `text-lg leading-snug font-semibold`
  - CardDescription: `text-muted-foreground text-sm`
  - CardContent: `px-4 md:px-6`
  - CardFooter: `flex items-center px-4 md:px-6`
- No variants or sizes. Hard-coded colours: none.
- Note: none of the three pages above use Card.

### components/ui/checkbox.tsx (31 lines)
- Exports: `Checkbox`
- Imports: '@radix-ui/react-checkbox' (* as CheckboxPrimitive), 'lucide-react' {CheckIcon}, 'react', '@/lib/utils' {cn}
- Root class: `peer border-input bg-field data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary focus-ring aria-invalid:border-destructive relative size-5 shrink-0 rounded-[5px] border shadow-xs transition-colors after:absolute after:-inset-3 disabled:cursor-not-allowed disabled:opacity-50 md:after:-inset-1.5`
- Indicator: `flex items-center justify-center text-current transition-none`; CheckIcon `size-3.5`
- Per the code comment: 20px visible box, 44px tap area via ::after.
- No variants. It is a Radix control (onCheckedChange, not onChange) and does not render a native named input unless `name` is passed. Hard-coded colours: none.

### components/ui/alert.tsx (73 lines)
- Exports: Alert, AlertTitle, AlertDescription
- Imports: 'class-variance-authority' {cva, type VariantProps}, 'react', '@/lib/utils' {cn}
- Base: `relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current`
- Variants:
  - default: `bg-card text-card-foreground`
  - destructive: `border-danger-border bg-danger-bg text-danger-fg *:data-[slot=alert-description]:text-danger-fg/90`
  - success: `border-success-border bg-success-bg text-success-fg *:data-[slot=alert-description]:text-success-fg/90`
  - warning: `border-warning-border bg-warning-bg text-warning-fg *:data-[slot=alert-description]:text-warning-fg/90`
  - info: `border-info-border bg-info-bg text-info-fg *:data-[slot=alert-description]:text-info-fg/90`
- Alert always sets role="alert".
- AlertTitle: `col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight`. line-clamp-1 cuts long titles.
- AlertDescription: `text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed`
- Hard-coded colours: none.
- Note: the amber banners in browse/index and browse/show could map to `variant="warning"`, and the red boxes to `variant="destructive"`. Alert's fixed role="alert" would replace the role="status" those banners use now.

---

## 6. Part D — Poster Task Management, Agreements, Messaging, Ratings & Reports

All 18 files were read and nothing was changed. Paths are relative to `resources/js/`.

**Layouts:** Only `pages/messages/index.tsx` and `pages/messages/show.tsx` set a layout, using `X.layout = (page) => <AppLayout>{page}</AppLayout>` with no breadcrumbs. None of the other pages declare a layout. I did not read `app.tsx`, so I can't say whether a default layout applies to them.

**`print:` classes:** these appear only in `pages/agreements/create.tsx`, `pages/agreements/show.tsx`, `components/agreement-details.tsx` and `components/completion-payment-panel.tsx`. Each one is listed under its file.

---

### pages/tasks/create.tsx (14 lines)
- **Exports:** default `CreateTask`.
- **Imports:** '@inertiajs/react' {Head}, '@/components/task-form', '@/routes/tasks' {store}.
- **Layout:** none declared. Head title "Post a task".
- **Outer container:** `mx-auto max-w-4xl space-y-5 p-4 sm:p-6`.
- **Structure:**
  1. A `div` containing the h1 "Post a task" (`text-2xl font-semibold`) and the p "Describe the work clearly so people can decide whether it suits them." (`mt-1 text-sm text-muted-foreground`).
  2. `<TaskForm action={store.form()} options task resetWarning />`.
- **Interactive controls:** none (all inside TaskForm).
- **Form fields:** see task-form.tsx.
- **Lists/tables:** none.
- **States:** none.
- **Status badges:** none.
- **Hard-coded colour utilities:** none.
- **Notable redesign issues:**
  - The whole JSX is on one line.
  - Has a `max-w-4xl` wrapper.

### pages/tasks/edit.tsx (22 lines)
- **Exports:** default `EditTask`.
- **Imports:** '@inertiajs/react' {Head}, '@/components/task-form', '@/routes/tasks' {update}.
- **Layout:** none declared. Head title "Edit task".
- **Outer container:** `mx-auto max-w-4xl space-y-5 p-4 sm:p-6`.
- **Structure:**
  1. h1 "Edit task" (`text-2xl font-semibold`) and the p "Update the work details and submit them for review." (`mt-1 text-sm text-muted-foreground`).
  2. `<TaskForm action={update.form(task.id)} … />`.
- **Interactive controls:** none (all inside TaskForm).
- **Form fields:** see task-form.tsx.
- **Lists/tables:** none.
- **States:** none.
- **Status badges:** none.
- **Hard-coded colour utilities:** none.
- **Notable redesign issues:**
  - The JSX is on one line.
  - Has a `max-w-4xl` wrapper.
  - The TaskData type includes fields TaskForm never renders: requiredActivities, deliverables, estimatedDurationHours, skillRequirements, complexity.

### pages/tasks/mine.tsx (15 lines)
- **Exports:** default `MyTasks`.
- **Imports:** '@/lib/format' {formatDate, formatAmount}, '@inertiajs/react' {Form, Head, Link}, '@/components/ui/button' {Button}, '@/components/task-status-badge' {TaskStatusBadge}, '@/components/payment-status-badge' {PaymentStatusBadge}, '@/components/terms-status-badge' {ToBeDiscussedBadge}, '@/routes/tasks' {create, show, edit, cancel}, '@/routes/agreements' (default `agreements`).
- **Layout:** none declared. Head title "My tasks".
- **Outer container:** `mx-auto max-w-5xl space-y-5 p-4 sm:p-6`.
- **Structure:**
  1. Header row (`flex flex-wrap items-center justify-between gap-3`): h1 "My tasks" (`text-2xl font-semibold`), p "Tasks you have posted and their review status." (`mt-1 text-sm text-muted-foreground`), and a "Post a task" button.
  2. Status flash: `div role="status"` (`rounded-lg border px-4 py-3 text-sm`) showing `{status}`.
  3. Either the empty state or a card grid (`grid gap-4 md:grid-cols-2`).
  4. Each card is an `article` (`space-y-3 rounded-xl border p-5`) containing, in order:
     - h2 `{task.title}` (`font-semibold`) with badges beside it
     - p "`{category} · {workMode}`"
     - Pay row: either the badge "Pay: To be discussed" or `₱{formatAmount(budget)}` (`font-medium`), followed by either the badge "Pay timing: To be discussed" or "· {payTimingLabel}" (`text-xs text-muted-foreground`)
     - p "Hours: {summary | 'To be discussed'}"
     - p "Posted {date | 'recently'} · {applicantsCount} applicants" (`text-xs`)
     - Review note box
     - Rate button
     - Action row
  5. Pagination `nav aria-label="Pagination"` (`flex flex-wrap gap-2`). Links use `rounded border px-3 py-1 text-sm` plus `bg-muted font-medium` when active. Disabled items add `text-muted-foreground`. Labels are rendered with `dangerouslySetInnerHTML`.
- **Interactive controls:**
  - "Post a task": Button (default), asChild Link `create()`. Shown in the header, and again in the empty state with `className="mt-4"`.
  - "Rate your experience": `variant="outline" size="sm"`, `agreements.rate(task.agreementId)`. Shown if `needsRating && agreementId`.
  - "View": `outline sm`, `show(task.id)`. Always shown.
  - "Edit": `outline sm`, `edit(task.id)`. Shown if `canEdit && !hasActiveApplications && status in ['pending_review','changes_requested','approved']`.
  - "Cancel": `outline sm`, `type="submit"`, in a `Form {...cancel.form(task.id)}` with `window.confirm('Cancel this task?')`. Shown if `canCancel`.
- **Form fields:** none.
- **Lists/tables:** iterates `tasks.data` as cards (no table). Pagination iterates `tasks.links`.
- **States:**
  - Empty state (`rounded-xl border p-8 text-center`): h2 "You have not posted any tasks yet" and p "Create a task to get started."
  - Review note: "Review note: {reviewNote}".
- **Status badges:**
  - `TaskStatusBadge status={task.status} label={task.statusLabel}`
  - `PaymentStatusBadge status={task.paymentStatus} label={task.paymentStatusLabel}` (only when both are set)
  - `ToBeDiscussedBadge label="Pay: To be discussed"`
  - `ToBeDiscussedBadge label="Pay timing: To be discussed"`
- **Hard-coded colour utilities:**
  - ~L14 review note: `border-amber-300 bg-amber-50 text-amber-950` (no dark: variant).
- **Notable redesign issues:**
  - The entire page is on one line (L14).
  - The amber review note has no dark-mode classes.
  - Cancel is a destructive action but uses the outline variant, with only a native confirm.
  - Has a `max-w-5xl` wrapper.

### pages/tasks/show.tsx (102 lines)
- **Exports:** default `ShowTask`.
- **Imports:** '@/lib/format' {formatDate, formatAmount, formatHoursFlexibility}, '@/constants/notices' {PAYMENT_BOUNDARY_NOTICE}, '@inertiajs/react' {Form, Head, Link}, '@/components/ui/button' {Button}, '@/components/task-status-badge' {TaskStatusBadge}, '@/components/application-status-badge' {ApplicationStatusBadge}, '@/components/verification-status-badge' {VerificationStatusBadge}, '@/components/payment-status-badge' {PaymentStatusBadge}, '@/components/terms-status-badge' {ToBeDiscussedBadge}, '@/routes/tasks/applications' (default `taskApplications`), '@/routes/agreements' (default), '@/routes/tasks' {edit, mine, cancel}, '@/components/rating-summary' {RatingSummary}, '@/components/problem-report-form' {ProblemReportForm}. There is also an inline type import of '@/components/rating-summary' (RatingSummaryData).
- **Layout:** none declared. Head title `{task.title}`.
- **Outer container:** `mx-auto max-w-4xl space-y-5 p-4 sm:p-6` (L37).
- **Structure:**
  1. L38 status flash: `div role="status"` (`rounded-lg border px-4 py-3 text-sm`).
  2. L39–42 header: p "{category} · {workTypeLabel}" (`text-sm text-muted-foreground`), h1 `{task.title}` (`mt-1 text-2xl font-semibold`), and TaskStatusBadge.
  3. L43–50 section "Task details" (`space-y-4 rounded-xl border p-5`, h2 `text-lg font-semibold`):
     - description (`whitespace-pre-wrap`)
     - h3 "Main activities"
     - h3 "Expected result or deliverables"
     - "Estimated duration: {n} hours"
     - "Skills: {…}"
  4. L51–63 section "Schedule and work setup" (`space-y-2 rounded-xl border p-5`):
     - "Work hours:" followed by a badge or the summary
     - "Can hours change: {formatHoursFlexibility}"
     - "Schedule note: …"
     - "Work mode: …"
     - "Workplace: name · address"
     - fixed muted text "In-person work details are shown to students before they apply. Workplace information…"
     - "Deadline: {date}"
  5. L64–78 section "Compensation" (`space-y-3 rounded-xl border p-5`), a `grid gap-3 sm:grid-cols-2` with:
     - "Pay amount" label (`text-xs text-muted-foreground`), then a badge or `₱amount` (`font-semibold`)
     - "When paid (pay timing)", then a badge or the label, plus the note
     - PAYMENT_BOUNDARY_NOTICE
  6. L79 review note alert.
  7. L80 removal alert.
  8. L81 Agreement section (`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-5`): h2 "Agreement", "Status: {statusLabel}", PaymentStatusBadge and a button.
  9. L82 "Propose agreement" button.
  10. L83–93 section "Applicants ({n})" (`space-y-4 rounded-xl border p-5`). Each applicant is an `article` (`space-y-3 border-t pt-4`) containing:
      - name link (`underline`) to profileUrl
      - "type · affiliation"
      - RatingSummary
      - VerificationStatusBadge
      - message (`whitespace-pre-wrap text-sm`)
      - flagged warning
      - ProblemReportForm (reportLabel "Report this applicant")
      - "Suggested amount: {₱x | 'No suggestion'} · Applied {date | '—'}"
      - action row
      - messageBlockedReason (`text-xs text-muted-foreground`)
  11. L94 task-level `ProblemReportForm action={problemReport.taskAction}`.
  12. L95 off-platform warning.
  13. L96 active-applicants warning.
  14. L97 assigned note (`rounded-lg border p-4 text-sm`).
  15. L98 footer button row.
- **Interactive controls:**
  - "View agreement": default, `agreements.show(agreement.id)`. Shown if `agreement`.
  - "Propose agreement": default, `agreements.create(task.id)`. Shown if `canProposeAgreement`.
  - Applicant name: Link to `application.applicant.profileUrl`.
  - "Message applicant" or "View conversation" (the latter if `messageBlockedReason`): `size="sm" variant="outline"`, raw href `/messages/${conversationId}`. Shown if `conversationId`.
  - "Accept": `size="sm"` submit, `taskApplications.accept.form({task, application})`. Shown if `canRespondApplications && application.status==='pending' && task.status==='approved'`.
  - "Decline": `sm outline`, `taskApplications.decline.form(...)`. Same condition as Accept.
  - "My tasks": outline, `mine()`. Always shown.
  - "Edit task": default, `edit(task.id)`. Shown if `canEdit && !hasActiveApplications && status!=='assigned'`.
  - "Cancel task": outline submit, `cancel.form(task.id)` with confirm 'Cancel this task?'. Shown if `canCancel`.
- **Form fields:** none directly (ProblemReportForm is external).
- **Lists/tables:** iterates `applicants` as articles (no table).
- **States:**
  - Review note: "Review note: {reviewNote}".
  - Removal: "This post was removed by an administrator. Reason: {removalReason}".
  - Flagged and off-platform warnings: "This message contains a request to move outside TaskMate or skip its steps. Be careful…"
  - Active applicants: "This task has active applicants. Cancel it and post a new task to change its details."
  - Assigned: "This task has been assigned and cannot be edited."
  - The Applicants section is hidden when there are no applicants. There is no empty-state text.
- **Status badges:**
  - `TaskStatusBadge status={task.status} label={statusLabel}`
  - `ToBeDiscussedBadge` (no props) ×3
  - `PaymentStatusBadge status={agreement.paymentStatus} label={agreement.paymentStatusLabel}`
  - `VerificationStatusBadge status={applicant.verificationStatus}`
  - `ApplicationStatusBadge status label={statusLabel}`
- **Hard-coded colour utilities:**
  - L79: `border-amber-300 bg-amber-50 text-amber-950`
  - L80: `border-red-300 bg-red-50 text-red-950`
  - L88: `border-amber-300 bg-amber-50 text-amber-950`
  - L95: `border-amber-300 bg-amber-50 text-amber-950`
  - L96: `border-amber-300 bg-amber-50 text-amber-950`
  - None of these have dark: variants.
- **Notable redesign issues:**
  - Very long single lines (L81, L86, L91, L98).
  - The amber/red alerts have no dark mode.
  - The conversation link uses a raw URL instead of a route helper.
  - The applicant card packs many items into one block. There is a `max-w-4xl` wrapper.

### components/task-form.tsx (393 lines)
- **Exports:** default `TaskForm`.
- **Imports:** '@/constants/notices' {PAYMENT_BOUNDARY_NOTICE}, 'react' {useState}, '@inertiajs/react' {Form}, '@/components/input-error' (default InputError), '@/components/ui/button' {Button}, '@/components/ui/input' {Input}, '@/components/ui/label' {Label}, '@/components/ui/textarea' {Textarea}.
- **Layout:** none (component).
- **Outer container:** `<Form {...action} className="space-y-5">`.
- **Structure:**
  1. L75–79 reset warning: `div role="alert"`.
  2. L81 section "Task basics" (`space-y-4 rounded-xl border p-5`, h2 `text-lg font-semibold`), with sub-copy "Tell students what the work is and what result you need."
  3. L138 section "Pay and schedule", with sub-copy "Share pay amount, pay timing, and work hours upfront—or mark a negotiable item as “To be discussed” so students know what still needs to be agreed." It contains:
     - L201 PAYMENT_BOUNDARY_NOTICE (`text-sm text-muted-foreground`)
     - L203 nested box (`space-y-3 rounded-lg border bg-muted/20 p-4`) with h3 "Work schedule / hours" (`text-sm font-semibold`) and "Students compare these hours against their class schedule before applying."
  4. L326 section "Work setup".
  5. L373 section "Platform rules": guideline box (`rounded-lg border bg-muted/40 p-4`), h3 "Task guidelines", and a `ul list-disc space-y-1 pl-5 text-sm` iterating `options.guidelines`.
  6. L388 submit button.
- **Interactive controls:**
  - L388: `<Button type="submit" disabled={processing}>`, labelled "Save changes" when `task` exists, otherwise "Submit task for review". Default variant. There is no processing text.
- **Form fields (DOM order):**

  **Task basics**
  1. Label "Task title". `Input id="title" name="title"`, maxLength 150, required. InputError `errors.title`.
  2. Label "Category". Native `<select id="category" name="category">` (`h-10 rounded-md border bg-background px-3 text-sm`), required. Placeholder option "Select a category" (disabled); options from `options.categories`. InputError `errors.category`.
  3. Label "Work type". Native `<select id="work_type" name="work_type">`, default 'one_time_gig'. Fallback options "One-time gig / task" and "Short-term part-time". InputError `errors.work_type`. Fields 2 and 3 sit together in `grid gap-4 sm:grid-cols-2`.
  4. Label "What needs to be done?". `Textarea id="description" name="description"`, maxLength 10000, required. Placeholder "Describe the work and what students should know before applying." Helper "A clear description helps students decide whether to apply." (`text-xs text-muted-foreground`). InputError `errors.description`.

  **Pay and schedule**
  5. Label "Estimated budget (PHP)". `Input id="budget" name="budget" type="number"`, min 1, max 1000000, step 0.01. Disabled and not required when budgetToBeDiscussed. InputError `errors.budget`.
  6. Hidden `name="budget_to_be_discussed"`, value '1' or '0'.
  7. Native checkbox `id="budget_to_be_discussed"` (no name), wrapped in `<label className="flex items-center gap-2 text-sm">` with the text "Pay amount is to be discussed".
  8. Label "When is pay given? (Pay timing)". Native `<select id="pay_timing" name="pay_timing">`, default 'to_be_discussed'. Fallback option "To be discussed".
  9. `Input id="pay_timing_note" name="pay_timing_note"`, maxLength 255. Placeholder "Optional note (e.g. Paid Saturdays in cash)". It has no label of its own. InputErrors `errors.pay_timing` and `errors.pay_timing_note`.
  10. Hidden `schedule_flexible` and `schedule_to_be_discussed`.
  11. `fieldset` (`flex flex-wrap gap-3 text-sm`) with sr-only legend "Choose how work hours are set". Three native radios, all `name="schedule_mode_ui"` with no ids, each wrapped in a label (`inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-1.5`): "Set weekly hours", "Flexible / self-paced before deadline", "Work hours are to be discussed".
  12. Shown only when mode is fixed: `fieldset` with legend "Work days" (`text-sm font-medium`). Native checkboxes `name="schedule_days[]"`, value day.value, no id. Each is in a chip label (`inline-flex … rounded-md border px-3 py-1.5 text-sm`, plus `border-primary bg-primary/10 font-medium` when checked or `bg-background` otherwise). InputError `errors.schedule_days`.
  13. Shown only when mode is fixed: Label "Start time". `Input id="schedule_start_time" name="schedule_start_time" type="time"`. InputError.
  14. Shown only when mode is fixed: Label "End time". `Input id="schedule_end_time" name="schedule_end_time" type="time"`. InputError.
  15. Label "Can hours change?". Native `<select id="can_hours_change" name="can_hours_change">` (`… disabled:opacity-60`), disabled when mode is flexible. Options: "Not specified", "Yes — hours can adjust around classes", "No — fixed schedule". InputError.
  16. Label "Schedule note (optional)". `Input id="schedule_note" name="schedule_note"`, maxLength 255. Placeholder "e.g. Flexible after 3:00 PM or complete before Friday". InputError.

  **Work setup**
  17. Label "Work mode". Native controlled `<select id="work_mode" name="work_mode">`, required. Placeholder "Select a work mode" (disabled); options from `options.workModes`. InputError.
  18. Shown only if onsite or hybrid: box (`space-y-3 rounded-lg border bg-muted/30 p-4`) with the text "Students see the place of work before applying. Enter a worksite, not a home address."
      - Label "Workplace name". `Input id="workplace_name" name="workplace_name"`, required. InputError.
      - Label "Workplace address". `Input id="workplace_address" name="workplace_address"`, required. InputError.
  19. Label "Deadline (optional)". `Input id="deadline" name="deadline" type="date"`, min is tomorrow. InputError.

  **Platform rules**
  20. Native checkbox `id="guidelines_confirmed" name="guidelines_confirmed"` value "1", required, `className="mt-1"`. Label "I confirm that this task follows the platform rules." InputError `errors.guidelines_confirmed`.
- **Lists/tables:** categories, workTypes, payTimings, daysOfWeek, workModes and guidelines are iterated.
- **States:**
  - Reset warning: "Saving these changes will send this task back for review and clear the previous review note."
  - No processing text (the button is only disabled).
- **Status badges:** none.
- **Hard-coded colour utilities:**
  - L76: `border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-100`
- **Notable redesign issues:**
  - Five native `<select>` elements (category, work_type, pay_timing, can_hours_change, work_mode).
  - Native unstyled checkboxes and radios (budget TBD, schedule mode, days, guidelines), which are small.
  - `pay_timing_note` has no label.
  - The Pay and schedule section is long and dense.

### pages/agreements/create.tsx (145 lines)
- **Exports:** default `CreateAgreement`.
- **Imports:** '@/lib/format' {formatAmount, formatHoursFlexibility}, '@inertiajs/react' {Form, Head, Link}, '@/components/ui/button' {Button}, '@/components/ui/input' {Input}, '@/components/ui/textarea' {Textarea}, '@/components/input-error' (default), '@/components/terms-status-badge' {ToBeDiscussedBadge}, '@/routes/agreements' (default), '@/routes/tasks' (default `tasks`).
- **Layout:** none declared. Head title "Propose agreement".
- **Outer container:** `<main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 print:max-w-none print:p-0">` (L50).
- **Structure:**
  1. L51–55: Link "Back to task", h1 "Propose agreement" (`mt-2 text-2xl font-semibold`), and p "For {task.title} with {workerName}" (`mt-1 text-muted-foreground`).
  2. L57 notice p (`rounded-lg border bg-muted/40 p-4 text-sm`): "This agreement records what the poster and worker agreed. It is not a legal contract…"
  3. L59 section (`rounded-xl border bg-muted/30 p-5`), h2 "Before work begins": "The worker reviews this proposal. Work may begin only after both of you confirm the same version…"
  4. L64 section "Terms from the task listing" (`space-y-2 rounded-xl border p-5`). It shows:
     - "Listed pay:" followed by a badge or ₱amount, then "· Pay timing:" followed by a badge or the label
     - "Listed hours:" followed by a badge or the summary, then "({formatHoursFlexibility})"
     - "Work mode: …"
     - "Workplace: {… | 'Not applicable'}"
     - "Workplace address: …"
     - muted text "Work mode and workplace stay as listed because the worker applied based on these details."
     - the unsettled-terms alert
  5. L88 Form `agreements.store.form(task.id)` (`space-y-5 rounded-xl border p-5`) containing:
     - section h2 "Agreed work"
     - grid section (`grid gap-4 sm:grid-cols-2`)
     - comment field
     - button row
  6. L141 footer p: "TaskMate does not process, hold, transfer, recover, or guarantee payment."
- **Interactive controls:**
  - "Back to task": Link `tasks.show(task.id)` (`text-sm underline`).
  - "Send proposal": submit, default, disabled while processing. No processing text.
  - "Cancel": asChild `variant="outline"` Link `tasks.show(task.id)`.
- **Form fields:** all use a native `<label className="mb-1 block text-sm font-medium">`.
  - "Deliverables": `Textarea id="deliverables" name="deliverables"`, required. InputError.
  - "Terms and agreed work hours": `Textarea id="terms" name="terms"`, required, maxLength termsMaxLength. Placeholder "State the agreed duties, schedule/hours, and expectations before work begins." Helper "Describe what each person expects—including agreed work hours—before work begins." InputError.
  - "Payment arrangement and timing between you": `Textarea id="payment_arrangement" name="payment_arrangement"`, required. Placeholder "Describe the payment method and exact timing (e.g. cash every Saturday or GCash upon completion)." InputError.
  - "Final amount (₱)": `Input id="final_amount" name="final_amount" type="number"`, min 1, max 1000000, step 0.01, required. InputError, then helper "The amount is agreed directly between you."
  - "Start date (optional)": `Input id="start_date" name="start_date" type="date"`. InputError.
  - "Due date": `Input id="due_date" name="due_date" type="date"`, required. InputError.
  - "Note for the worker (optional)": `Textarea id="comment" name="comment"`, maxLength 1000. InputError.
- **Lists/tables:** none.
- **States:**
  - Unsettled-terms alert (L82): "One or more listing terms were marked **To be discussed**. Settle the exact final amount, schedule/hours…"
- **Status badges:** `ToBeDiscussedBadge` (no props) ×3.
- **Hard-coded colour utilities:**
  - L82: `border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-100`
- **Notable redesign issues:**
  - Three stacked notice and explanation blocks appear before the form.
  - Labels are native `<label>` elements rather than the `Label` component (inconsistent with TaskForm).
  - Has a `max-w-3xl` wrapper.
- **print:** classes: L50 `print:max-w-none print:p-0`.

### pages/agreements/show.tsx (7 lines)
- **Exports:** default `ShowAgreement`.
- **Imports:** '@inertiajs/react' {Head}, '@/components/agreement-details' {AgreementDetails}, '@/components/problem-report-form' {ProblemReportForm}. There is also an inline type import of '@/components/completion-payment-panel'.
- **Layout:** none declared. Head title `Agreement: ${task.title}`.
- **Outer container:** fragment with `<div className="print:hidden">` followed by `<AgreementDetails {...props} />`.
- **Structure:**
  1. Status p (`role="status"`, `mx-auto mt-4 max-w-4xl rounded-lg border p-3 text-sm`).
  2. Off-platform warning p (`mx-auto mt-4 max-w-4xl rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950`).
  3. `div` (`mx-auto mt-4 max-w-4xl px-4`) with `<ProblemReportForm {...problemReport} />`.
  4. AgreementDetails.
- **Interactive controls:** none directly.
- **Form fields:** none directly.
- **Lists/tables:** none.
- **States:** "This message contains a request to move outside TaskMate or skip its steps. Be careful…"
- **Status badges:** none.
- **Hard-coded colour utilities:**
  - L6: `border-amber-300 bg-amber-50 text-amber-950` (no dark: variant).
- **Notable redesign issues:**
  - `agreement: any` typing.
  - Repeated `max-w-4xl` wrappers.
  - The whole page is on one line.
- **print:** classes: L6 `print:hidden`.

### components/agreement-details.tsx (53 lines)
- **Exports:** `AgreementDetails` (named). `WorkTerms` is internal and not exported.
- **Imports:** '@/lib/format' {formatDate, formatDateTime, formatAmount}, '@inertiajs/react' {Form, Link}, 'lucide-react' {Printer}, '@/components/ui/button' {Button}, '@/components/ui/input' {Input}, '@/components/ui/textarea' {Textarea}, '@/components/input-error' (default), '@/components/agreement-status-badge' {AgreementStatusBadge}, '@/routes/agreements' (default), '@/components/completion-payment-panel' {CompletionPaymentPanel}, '@/components/star-rating' {StarRating}, '@/components/rating-summary' {ratingNotice}.
- **Layout:** none (component).
- **Outer container:** `mx-auto max-w-4xl space-y-6 p-4 sm:p-6 print:max-w-none print:space-y-4 print:p-0` (L34).
- **Structure:**
  1. L35 header (`flex flex-wrap items-start justify-between gap-3 print:block`):
     - h1 "Agreement for {task.title}" (`text-2xl font-semibold`)
     - "Poster: {link} · Worker: {link}"
     - a `div` (`flex items-center gap-2 print:hidden`) holding the status badge and the Print button
  2. L36 notice p (`rounded-lg border bg-muted/40 p-4 text-sm print:bg-white`).
  3. L37 section (`aria-label="Agreement next step"`, `rounded-xl border bg-muted/30 p-4 text-sm`), h2 "What happens next", showing responseGuidance.
  4. L38 suspended note (`rounded-xl border p-4 text-sm`).
  5. L39 agreed section, h2 "Agreement confirmed on {lockedAt | '—'}":
     - "**Record reference:**" followed by `break-all font-mono`
     - "Both people confirmed these terms. The record is locked, and work may begin."
  6. L40 cancelled section, h2 "Agreement cancelled":
     - "Reason: {…}"
     - "The task is open again so the poster can choose another applicant."
     - a button
  7. L41 section "Current proposal · Version {n}" (`space-y-4 rounded-xl border p-5`):
     - "Proposed by {name} on {date}"
     - "**Proposer's note:**" (`rounded border bg-muted/30 p-3 text-sm`)
     - WorkTerms grid (`grid gap-4 sm:grid-cols-2`) with h3s (`text-sm font-medium`): Deliverables, Terms, Final amount, Dates ("Start: {…|'Not set'} · Due: …"), Work mode, Workplace, Payment arrangement (`sm:col-span-2`)
     - confirmations grid (`grid gap-2 border-t pt-4 sm:grid-cols-2`): "{name}: Confirmed {dt}" or "Waiting for confirmation"
  8. L42–46 section "Review and respond" (`space-y-4 rounded-xl border p-5 print:hidden`) containing:
     - confirm form, or "Your confirmation is recorded for this version."
     - three `<details className="rounded-lg border p-4">` blocks with summaries (`cursor-pointer font-medium`): "Propose different terms", "Ask for a change", and "Cancel and reopen the task". The last one uses `border-red-200` and a `text-red-800` summary, plus the text "The selected application will close. The poster can choose another applicant…"
  9. L47 section "Version history": per-version article (`space-y-3 border-t pt-4`):
     - h3 "Version {n} · {proposer} · {date}"
     - "Note: …"
     - WorkTerms
     - "Confirmations: … | None"
  10. L48 section "Ratings":
      - ratingNotice
      - "Your rating" article (`rounded-lg border p-3`) with `StarRating label="Your overall experience"`, the comment, and "{label}: {score} / 5"; or "Rate your experience with the other party." with a button
      - "Rating from {raterName}" article with `StarRating label="Overall experience"`; or the waiting text
  11. L49 `<CompletionPaymentPanel agreementId data readOnly />`.
  12. L50 section "Messages": per-message article (`border-t pt-3 text-sm`) showing "{userName} · {dt}" and the body.
  13. L51 footer p (`text-sm text-muted-foreground print:text-black`): "Payments are arranged directly between the poster and worker. TaskMate does not process…"
- **Print button:** L35 `<Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 size-4" />Print or save as PDF</Button>`, inside a `print:hidden` div.
- **Interactive controls:**
  - Poster and Worker name links: raw `/users/${id}` (`underline`).
  - "Print or save as PDF": see above.
  - "View reopened task" (raw `/tasks/${task.id}`) or "View my applications" (raw "/my-applications"): outline, `className="mt-3"`. Shown on cancelled agreements; the first for the poster, the second otherwise.
  - "I agree to these terms": submit, `agreements.confirm.form(id)`. Shown if `!viewerConfirmed`.
  - "Send revised proposal": submit, `agreements.revise.form(id)`.
  - "Send request": outline submit, `agreements.sendBack.form(id)`.
  - "Cancel agreement": `variant="destructive"`, `agreements.cancel.form(id)` with confirm 'Cancel this agreement and reopen the task?'.
  - "Rate your experience": default, `className="mt-2"`, Link `ratings.rateUrl`. Shown if `canRate` and no own rating.
  - The three response forms show only when `status==='negotiating' && !readOnly && current && actionsAllowed`.
- **Form fields (for/id pairs):**

  | Form | for/id | name / type | Constraints | Error |
  |---|---|---|---|---|
  | confirm | (no label) | hidden `version_id` | — | `errors.version_id` |
  | revise | hidden | `version_id` | — | — |
  | revise | `revise-deliverables` | Textarea `deliverables` | label "Deliverables", required | `revise-deliverables-error` |
  | revise | `revise-terms` | Textarea `terms` | label "Terms", maxLength termsMaxLength | `revise-terms-error` |
  | revise | `revise-final-amount` | Input number `final_amount` | label "Final amount (₱)" | `revise-final-amount-error` |
  | revise | `revise-start-date` | date `start_date` | label "Start date (optional)" | none |
  | revise | `revise-due-date` | date `due_date` | label "Due date" | `revise-due-date-error` |
  | revise | `revise-payment-arrangement` | `payment_arrangement` | label "Payment arrangement between you" | `revise-payment-arrangement-error` |
  | revise | `revise-comment` | `comment` | label "Note for the other person (optional)", maxLength 1000 | `revise-comment-error` |
  | sendBack | hidden | `version_id` | — | `errors.version_id` |
  | sendBack | `send-back-body` | Textarea `body` | sr-only label "Explain what should be changed", maxLength 1000, placeholder "Explain what should be changed." | `send-back-body-error` |
  | cancel | `cancel-reason` | Textarea `reason` | sr-only label "Reason for cancelling", maxLength 2000, placeholder "Reason for cancelling" | `cancel-reason-error` |

  - The revise form ends with the note "Work mode and workplace stay as listed: …".
  - All labels use `mb-1 block text-sm font-medium`.
- **Lists/tables:** current.confirmations by party, versions, ratings scores and messages. All are articles (no tables).
- **States:**
  - Guidance (paused): "Your account is paused from agreement actions. You can still review the terms."
  - Guidance (confirmed): "You confirmed this version. Work can begin only after the other person confirms…"
  - Guidance (default): "Review the work, amount, dates, and payment arrangement. Confirm only if you agree…"
  - Suspended: "Agreement actions are unavailable while your account is suspended. You can still review the current terms."
  - Waiting: "Waiting for the other party or until {date | 'the rating window closes'}."
  - Messages empty: "No comments have been sent back."
- **Status badges:** `AgreementStatusBadge status={agreement.status} label={agreement.statusLabel}`.
- **Hard-coded colour utilities:**
  - L36: `print:bg-white`
  - L39 section: `border-green-300 bg-green-50 text-green-950 dark:border-green-800 dark:bg-green-950/60 dark:text-green-100 print:bg-white print:text-black`
  - L39 h2: `text-green-900 dark:text-green-100`
  - L45: `border-red-200`, `text-red-800`
  - L51: `print:text-black`
- **Notable redesign issues:**
  - Massive single-line JSX (L42–45 hold whole forms).
  - Raw href strings instead of route helpers.
  - The `text-red-800` summary has no dark variant.
  - Long text and version history make the page long. There is a `max-w-4xl` wrapper.
- **print:** classes:
  - L34: `print:max-w-none print:space-y-4 print:p-0`
  - L35: `print:block`, `print:hidden`
  - L36: `print:bg-white`
  - L39: `print:bg-white print:text-black`
  - L42: `print:hidden`
  - L51: `print:text-black`

### components/completion-payment-panel.tsx (31 lines)
- **Exports:** `CompletionPaymentPanel` and type `CompletionPaymentData`.
- **Imports:** '@/lib/format' {formatDateTime, formatAmount}, '@inertiajs/react' {Form, Link}, '@/components/ui/button' {Button}, '@/components/ui/input' {Input}, '@/components/ui/textarea' {Textarea}, '@/components/input-error' (default), '@/components/payment-status-badge' {PaymentStatusBadge}, '@/routes/agreements' (default), '@/routes/reports' (default), '@/constants/notices' {COMPLETION_PAYMENT_NOTICE}.
- **Layout:** none (component).
- **Outer container:** `<section id="completion-payment" className="space-y-5 rounded-xl border p-5 print:break-inside-avoid">`.
- **Structure:**
  1. L20: h2 "Completion and payment" (`text-lg font-semibold`) and COMPLETION_PAYMENT_NOTICE.
  2. L21 completion grid (`grid gap-3 rounded-lg bg-muted/30 p-4 sm:grid-cols-2`):
     - h3 "Work delivered": date or "Not marked", plus the note
     - h3 "Task completion": date or "Not recorded", plus the note
  3. L22 grid of forms (`grid gap-4 md:grid-cols-2 print:hidden`). Each form is `space-y-3 rounded-lg border p-4`: "Mark work as delivered" and "Record task completion".
  4. L23 row: h3 "Payment status", badge, and "Agreed amount: ₱…".
  5. L24 mismatch alert.
  6. L25 Record payment form (`grid gap-3 rounded-lg border p-4 sm:grid-cols-2 print:hidden`).
  7. L26 box "Did you receive the payment?" (`space-y-3 rounded-lg border p-4 print:hidden`).
  8. L27 "A non-payment report is open: View report".
  9. L28 Report non-payment form (`space-y-3 rounded-lg border border-red-200 p-4 print:hidden`).
  10. L29 "Payment timeline": articles, or the empty state.
- **Interactive controls:**
  - "Mark delivered": submit, `agreements.completion.delivered.form(agreementId)`. Shown if `!readOnly && canMarkDelivered`.
  - "Record as completed": submit, `agreements.completion.complete.form`. Shown if `canRecordCompletion`.
  - "Record payment": submit, `className="sm:col-span-2 sm:w-fit"`, `agreements.payments.markPaid.form`. Shown if `canMarkPaid`.
  - "Confirm I received it": submit, `agreements.payments.confirmReceived.form`. Shown if `canRespondPayment`.
  - "I did not receive it": outline, `agreements.payments.notReceived.form`. Shown if `canRespondPayment`.
  - "View report": Link `reports.show(activeReportId)` (`underline`).
  - "Submit non-payment report": destructive, `agreements.reports.store.form`, `encType="multipart/form-data"`. Shown if `canReportNonPayment`.
- **Form fields:**

  | Form | for/id | name / type | Label | Other attributes | Error |
  |---|---|---|---|---|---|
  | delivered | `delivered-note` | Textarea `note` | sr-only "Optional note for the poster" | maxLength 2000, placeholder same as label | `delivered-note-error` |
  | completion | `completion-note` | Textarea `note` | sr-only "Optional completion note" | placeholder same as label | `completion-note-error` |
  | markPaid | `paid-amount` | number `amount` | "Amount paid (₱)" | required, default agreedAmount | InputError, no id |
  | markPaid | `paid-on` | date `paid_on` | "Date paid" | max today, default today | InputError |
  | markPaid | `paid-method` | text `method` | "Method" | `list="payment-method-suggestions"` (datalist from paymentMethods), maxLength 100, placeholder "Enter the method used", required | InputError |
  | markPaid | `paid-note` | `note` | "Note or reference (optional)" | maxLength 2000 | InputError |
  | confirmReceived | `received-amount` | number `amount` | "Amount received (optional)" | — | `received-amount-error` |
  | non-payment | `non-payment-description` | Textarea `description` | sr-only "Describe what happened" | maxLength 3000, required, placeholder "Describe what happened." | `non-payment-description-error` |
  | non-payment | `non-payment-evidence` | file `evidence[]` | sr-only "Optional evidence files" | multiple, accept jpg/png/pdf | `non-payment-evidence-error` |

  - markPaid labels use `mb-1 block text-sm` (not font-medium).
  - The non-payment form shows `text-sm text-amber-900` text: "Do not upload government ID photos, selfies, or other sensitive documents beyond what is needed…"
- **Lists/tables:** `data.events` as articles (`space-y-1 rounded-lg border p-3 text-sm`). Each shows the eventLabel (strong), the date, "actor · ₱amt · paid {date} · method", the mismatch line and the note.
- **States:**
  - Settled: "The agreed amount was confirmed received."
  - Mismatch alert: "A recorded payment amount differs from the agreed amount of ₱{…}. Both parties can see the payment history."
  - Per-event mismatch: "This amount differs from the agreed amount."
  - Empty: "No payment has been recorded." (`rounded border p-3 text-sm text-muted-foreground`)
  - No processing text.
- **Status badges:** `PaymentStatusBadge status={data.paymentStatus} label={data.paymentStatusLabel}`.
- **Hard-coded colour utilities:**
  - L23: `text-green-800` (no dark variant)
  - L24: `border-amber-400 bg-amber-50 text-amber-950` (no dark variant)
  - L28: `border-red-200`, `text-amber-900` (no dark variant)
  - L29: `border-amber-400 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100`, and `text-amber-900 dark:text-amber-200`
- **Notable redesign issues:**
  - Each form is crammed onto a single line.
  - Most textareas have sr-only labels only, relying on placeholders.
  - Several colours have no dark variants.
  - The file input is the native styled Input.
- **print:** classes: `print:break-inside-avoid` (L19), and `print:hidden` at L22, L25, L26 and L28.

### pages/messages/index.tsx (14 lines)
- **Exports:** default `MessagesIndex`, with a static `.layout`.
- **Imports:** '@inertiajs/react' {Head, Link}, '@/layouts/app-layout' (default AppLayout), '@/lib/format' {formatDateTime}, '@/components/verification-status-badge' {VerificationStatusBadge}.
- **Layout:** `MessagesIndex.layout = (page) => <AppLayout>{page}</AppLayout>`, no breadcrumbs. Head title "Messages".
- **Outer container:** `<main className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">`.
- **Structure:**
  1. h1 "Messages" (`text-2xl font-semibold`) and p "Private conversations are available to the task poster and applicant."
  2. List (`grid gap-3`). Each item is a whole-card Link (`block rounded-xl border p-4 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`) showing:
     - taskTitle (`text-xs`)
     - h2 otherPerson.name (`mt-1 font-semibold`)
     - type
     - VerificationStatusBadge
     - status chip (`rounded border px-2 py-1 text-xs`): "Closed", "Read-only" or "Open"
     - unread pill (`rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground`): "{n} unread"
     - preview (`line-clamp-2 whitespace-pre-wrap text-muted-foreground`)
     - time (`shrink-0 text-xs`)
  3. Pagination `nav aria-label="Conversation pages"`, same classes as mine.tsx.
- **Interactive controls:** card Link with raw `/messages/${id}`; pagination links.
- **Form fields:** none.
- **Lists/tables:** `conversations.data` as link cards.
- **States:**
  - Preview fallback: "No messages yet. Start the conversation."
  - Empty section (`rounded-xl border p-8 text-center`): h2 "No conversations yet" and p "A private conversation opens when someone applies to a task."
- **Status badges:** `VerificationStatusBadge status={item.otherPerson.verificationStatus}`. The Open/Closed chip is an ad hoc span, not a badge component.
- **Hard-coded colour utilities:** none.
- **Notable redesign issues:**
  - Everything is on one line.
  - The conversation status is an unstyled ad hoc chip.
  - Raw href instead of a route helper.
  - Has a `max-w-5xl` wrapper.

### pages/messages/show.tsx (72 lines)
- **Exports:** default `ConversationShow`, with a static `.layout`.
- **Imports:** 'react' {useEffect, useMemo, useRef, useState}, '@inertiajs/react' {Form, Head, Link}, '@/layouts/app-layout' (default), '@/components/ui/button' {Button}, '@/components/ui/textarea' {Textarea}, '@/components/input-error' (default), '@/components/verification-status-badge' {VerificationStatusBadge}, '@/components/problem-report-form' {ProblemReportForm}, '@/lib/format' {formatDateTime}.
- **Layout:** AppLayout via `.layout` (no breadcrumbs). Head title `Messages · ${taskTitle}`.
- **Outer container:** `<main className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">` (L70).
- **Structure:**
  1. Header: Link "Back to messages" (`text-sm underline`), h1 otherPerson.name (`mt-2 text-2xl font-semibold`), "{type} · Task: {taskTitle}", and VerificationStatusBadge.
  2. Status flash (`role="status"`, `rounded-lg border px-4 py-3 text-sm`).
  3. Privacy notice p (`rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950`): "This conversation is private between you and the other person. Administrators can read…"
  4. sendBlockedReason p (`role="status"`, `rounded-lg border bg-muted p-3 text-sm`).
  5. Message list `div ref aria-label="Conversation messages"` (`max-h-[60vh] min-h-56 space-y-4 overflow-y-auto rounded-xl border p-4`):
     - Event lines (`text-center text-xs text-muted-foreground`): "{actor} closed this conversation" or "… reopened this conversation" · dt
     - Message articles (`max-w-[90%] rounded-lg border p-3`, plus `ml-auto bg-muted` if mine), each with "{sender} · {dt}" (`text-xs font-medium`), the body, the flag notice and a ProblemReportForm (reportLabel "Report this message", contextMessages)
  6. Action row: close and reopen forms, and "Closed by {x} on {dt}." (`self-center text-sm text-muted-foreground`).
  7. Send form (`space-y-2 rounded-xl border p-4`).
- **Interactive controls:**
  - "Back to messages": raw "/messages".
  - "Close conversation": outline, `Form action={/messages/${id}/close} method="post"` with confirm 'Close this conversation for both participants?'. Shown if `canClose`.
  - "Reopen conversation": outline, raw `/reopen` post. Shown if `canReopen`.
  - "Send message": submit, raw `/send` post, disabled while processing. Text becomes "Sending…" while processing. Shown if `canSend`.
- **Form fields:**
  - Label "Message" (native `<label htmlFor="body" className="block text-sm font-medium">`). `Textarea id="body" name="body"`, required, maxLength messageMaxLength, rows 3. Placeholder "Write a message about this task". Helper "Text only. Links are shown as plain text. Do not share passwords or identity documents." (`text-xs text-muted-foreground`). InputError `errors.body`.
- **Lists/tables:** a timeline merging messages and events, sorted by time.
- **States:**
  - Empty: "No messages yet. Send a message to start the conversation." (`py-10 text-center text-sm text-muted-foreground`)
  - Flag: "This message contains a request to move outside TaskMate or skip its steps…"
  - Processing: "Sending…"
  - Polling errors are silent (backoff only).
- **Status badges:** `VerificationStatusBadge status={conversation.otherPerson.verificationStatus}`.
- **Hard-coded colour utilities:**
  - L70: `border-blue-200 bg-blue-50 text-blue-950`
  - L70: `border-amber-300 bg-amber-50 text-amber-950`
  - Neither has a dark variant.
- **Notable redesign issues:**
  - Render is one huge line (L70).
  - The blue and amber notices have no dark mode.
  - Raw action URLs instead of route helpers.
  - A ProblemReportForm is embedded inside every incoming message bubble.

### pages/ratings/create.tsx (14 lines)
- **Exports:** default `RateAgreement`.
- **Imports:** '@/lib/format' {formatAmount}, '@inertiajs/react' {Form, Head, Link}, '@/components/ui/button' {Button}, '@/components/ui/textarea' {Textarea}, '@/components/input-error' (default), '@/routes/agreements' (default), '@/components/rating-summary' {ratingNotice}.
- **Layout:** none declared. Head title "Rate your experience".
- **Outer container:** `<main className="mx-auto max-w-2xl space-y-5 p-4 sm:p-6">`.
- **Structure:**
  1. h1 "Rate your experience" and p "Your feedback about {rateeName} and “{taskTitle}”. Direction: {'Poster to worker' | 'Worker to poster'}."
  2. Status p (`role="status"`, `rounded border p-3`).
  3. Section (`rounded-xl border p-4 text-sm`): "Agreed amount: ₱…" and "Current payment status: {paymentStatus}" (raw value).
  4. ratingNotice p (`rounded-lg border bg-muted/40 p-4 text-sm`).
  5. Amber p: "Rating comments are not a way to report serious problems. If something went wrong…", with Link "Open the report flow for this agreement" (href `${reportUrl}#completion-payment`, `underline`).
  6. Form `agreements.rate.store.form(agreement.id)` (`space-y-5 rounded-xl border p-5`):
     - fieldset with legend "Your ratings" (`text-lg font-semibold`)
     - visibility text
     - submit
- **Interactive controls:**
  - "Open the report flow for this agreement": Link.
  - "Submit rating": `<Button disabled={processing}>` with no `type` attribute. Default variant. No processing text.
- **Form fields:**
  - Per dimension: a wrapping `<label className="grid gap-1 text-sm">{dimension.label}` around a native `<select name="scores[{key}]">` (`h-10 rounded-md border bg-background px-3`), required. Placeholder "Select 1 to 5" (disabled); options 1–5. InputError `errors['scores.{key}']`. No id. The dimensions sit in `grid gap-3 sm:grid-cols-2`.
  - "Overall experience" (wrapping label, `grid gap-1 text-sm font-medium`): native select `name="overall_experience"`, required, same options. InputError. No id.
  - "Comment (optional)" (wrapping label): `Textarea name="comment"`, maxLength commentMaxLength. InputError. No id.
- **Lists/tables:** `dimensions`.
- **States:**
  - Visibility (immediate): "Your rating is visible as soon as it is submitted."
  - Visibility (otherwise): "Your rating is hidden from the other person until both of you have rated or the rating window closes."
- **Status badges:** none. The payment status is shown as raw text.
- **Hard-coded colour utilities:**
  - L13: `border-amber-300 bg-amber-50 text-amber-950` (no dark variant).
- **Notable redesign issues:**
  - Native `<select>` elements are used for 1–5 scores instead of star or segmented controls.
  - Fields have no ids (they use wrapping labels).
  - The raw payment status is shown with no badge.
  - The whole page is on one line. Has a `max-w-2xl` wrapper.

### pages/reports/index.tsx (11 lines)
- **Exports:** default `MyReports`.
- **Imports:** '@/lib/format' {formatDate}, '@inertiajs/react' {Head, Link}, '@/components/ui/button' {Button}, '@/components/report-status-badge' {ReportStatusBadge}, '@/routes/reports' (default), '@/constants/notices' {COMPLETION_PAYMENT_NOTICE}.
- **Layout:** none declared. Head title "My reports".
- **Outer container:** `<main className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">`.
- **Structure:**
  1. h1 "My reports" (`text-2xl font-semibold`). It has no subtitle.
  2. Notice p (`rounded-lg border p-4 text-sm`) showing COMPLETION_PAYMENT_NOTICE.
  3. Status p (`role="status"`, `rounded border p-3 text-sm`).
  4. List (`space-y-3`) of articles (`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4`), each showing h2 "{typeLabel} · {taskTitle}" (`font-medium`), "Other party: {…} · Filed {date|'—'}", the badge and a button.
  5. Pagination `nav className="flex gap-2"`. Links use `rounded border px-3 py-1 text-sm`, with no active state and no aria-label.
- **Interactive controls:** "View": `variant="outline" size="sm"`, Link `reports.show(item.id)`.
- **Form fields:** none.
- **Lists/tables:** `page.data` as rows/cards.
- **States:** empty: "You have not filed or received any reports." (`rounded-xl border p-8 text-center text-sm text-muted-foreground`)
- **Status badges:** `ReportStatusBadge status={item.status} label={item.statusLabel}`.
- **Hard-coded colour utilities:** none.
- **Notable redesign issues:**
  - Pagination has no active styling and no aria-label (inconsistent with the other pages).
  - Has no subtitle.
  - Everything is on one line. Has a `max-w-5xl` wrapper.

### pages/reports/show.tsx (9 lines)
- **Exports:** default `ShowReport`.
- **Imports:** '@inertiajs/react' {Head}, '@/components/report-details' {ReportDetails}, '@/constants/notices' {COMPLETION_PAYMENT_NOTICE}.
- **Layout:** none declared. Head title `Report #${report.id}`.
- **Outer container:** `<main className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">`.
- **Structure:**
  1. Notice p (`rounded-lg border bg-muted/40 p-4 text-sm`).
  2. "Target review time: {n} days" (`text-sm`).
  3. Status div (`role="status"`, `rounded-lg border p-3 text-sm`).
  4. `<ReportDetails report canReply statementMaxLength />`.
  5. contactLine (`text-xs text-muted-foreground`), shown if `report.status==='open'`.
- **Interactive controls:** none directly.
- **Form fields:** none directly.
- **Lists/tables:** none.
- **States:** none beyond the above.
- **Status badges:** none directly.
- **Hard-coded colour utilities:** none.
- **Notable redesign issues:**
  - The notice appears above the report title (h1 is inside ReportDetails).
  - `report: any` typing.
  - Has a `max-w-4xl` wrapper.

### components/report-details.tsx (46 lines)
- **Exports:** `ReportDetails` (named).
- **Imports:** '@/lib/format' {formatDateTime, formatAmount}, '@inertiajs/react' {Form, Link} (Link is imported but unused), '@/components/ui/button' {Button}, '@/components/ui/input' {Input}, '@/components/ui/textarea' {Textarea}, '@/components/input-error' (default), '@/components/report-status-badge' {ReportStatusBadge}, '@/routes/reports' (default).
- **Layout:** none (component).
- **Outer container:** `<div className="space-y-5">`.
- **Structure:** sections use `rounded-xl border p-5` and h2 `text-lg font-semibold` unless noted.
  1. L30 header:
     - "{typeLabel} · Task: {title}" (`text-sm text-muted-foreground`)
     - h1 "Report #{id}" (`mt-1 text-2xl font-semibold`)
     - "Submitted {dt}"
     - ReportStatusBadge
  2. L31 grid (`grid gap-4 … sm:grid-cols-2`), h2s "Reporter" and "Reported person" (`font-semibold`): name, then "type · verification status with underscores replaced".
  3. L32 admin-only (only when sanctions data is provided) grid: "{name}: prior reports and sanctions", "Prior reports: n", the sanction lines, or "No sanctions recorded."
  4. L33 "Related task record": generic key/value dump of `relatedTask`, then h3 "Applications" and h3 "Content flags".
  5. L34 "Locked agreement":
     - "Agreed amount: ₱…"
     - "Due date: …"
     - "Payment arrangement: …"
     - "**Record reference:**" followed by `font-mono`
  6. L35 per-version sections, h2 "Agreement version {v} · {proposer}" (`font-semibold`):
     - Agreed amount
     - Deliverables
     - Dates
     - Work arrangement
     - Payment arrangement
     - terms
     - comment
     - hash (`break-all font-mono text-xs`)
     - "Confirmed by: … | No confirmations"
  7. L36 "Reported conversation context": "Only the reported message and the limited surrounding context are included here." Snapshot articles (`rounded border p-3 text-sm`) show "{sender} · {sentAt} · Reported message" and the body.
  8. L37 "Report description".
  9. L38 "Completion record":
     - "Delivered: {dt | 'Not marked'}"
     - "Delivery note: …"
     - "Completed: {dt | 'Not recorded'}"
     - "Completion note: …"
  10. L39 "Payment timeline": articles (`space-y-1 border-t pt-3 text-sm`) showing "{event with underscores replaced} · actor · dt", the amount line, the mismatch line and the note.
  11. L40 "Statements": articles showing "{name} · {role} · {dt}" and the body.
  12. L41 "Evidence": `ul` of li (`flex … border-t pt-2 text-sm`) showing "{name} · {KB} KB" and a "Download file" link.
  13. L42 "Review result": "Outcome: {outcomeLabel}" and adminNote.
  14. L43 "Message from the administrators".
  15. L44 reply form.
- **Interactive controls:**
  - "Download file": native `<a className="underline" href={downloadUrl}>`.
  - "Add response": submit, default, `reports.reply.form(report.id)` with `encType="multipart/form-data"`. Shown if `canReply`.
- **Form fields (reply form, h2 "Add your response"):**
  - `Textarea name="body"`, required, maxLength statementMaxLength. Placeholder "Share a response or relevant context." No label and no id. InputError `errors.body`.
  - Amber text "Do not upload government ID photos, selfies, or other sensitive documents beyond what is needed. Administrators and both parties will see uploaded evidence."
  - `Input name="evidence[]" type="file"`, multiple, accept jpg/png/pdf. No label and no id. InputErrors `errors.evidence` and `errors['evidence.0']`.
- **Lists/tables:** sanctions, relatedTask entries, applications, flags, versions, messageSnapshots, paymentEvents, statements and evidence. All are paragraphs or articles (no tables).
- **States:**
  - "No sanctions recorded."
  - "No payment events were recorded."
  - "No response has been added."
  - "No files were submitted."
  - "This amount differs from the agreed amount."
- **Status badges:** `ReportStatusBadge status={report.status} label={report.statusLabel}`.
- **Hard-coded colour utilities:**
  - L36: `border-amber-500 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100`
  - L39: `text-amber-950` (mismatch, no dark variant)
  - L44: `text-amber-900` (no dark variant)
- **Notable redesign issues:**
  - The reply textarea and file input have no labels.
  - The Related task record is a raw key/value dump with generated key names.
  - Version sections are text walls of `<p>` elements.
  - There are many single-line sections and an unused `Link` import.

### components/agreement-status-badge.tsx (12 lines)
- **Exports:** `AgreementStatusBadge`.
- **Imports:** '@/components/status-badge' {STATUS, StatusFromMap}, '@/components/status-badge' (type {StatusConfig}).
- **Layout:** none.
- **Outer container:** `<StatusFromMap map={config} status={status}>{label}</StatusFromMap>`.
- **Structure:** status map: negotiating → STATUS.pending, agreed → STATUS.success, cancelled → STATUS.closed.
- **Interactive controls:** none.
- **Form fields:** none.
- **Lists/tables:** none.
- **States:** none.
- **Status badges:** n/a (this is the badge).
- **Hard-coded colour utilities:** none (colours live in status-badge, which was not read).
- **Notable redesign issues:** none.

### components/payment-status-badge.tsx (13 lines)
- **Exports:** `PaymentStatusBadge`.
- **Imports:** '@/components/status-badge' {STATUS, StatusFromMap}, '@/components/status-badge' (type {StatusConfig}).
- **Layout:** none.
- **Outer container:** StatusFromMap.
- **Structure:** status map: unpaid → STATUS.neutral, marked_paid → STATUS.pending, confirmed_received → STATUS.success, not_received → STATUS.danger.
- **Interactive controls:** none.
- **Form fields:** none.
- **Lists/tables:** none.
- **States:** none.
- **Status badges:** n/a.
- **Hard-coded colour utilities:** none.
- **Notable redesign issues:** none.

### components/report-status-badge.tsx (13 lines)
- **Exports:** `ReportStatusBadge`.
- **Imports:** '@/components/status-badge' {STATUS, StatusFromMap}, '@/components/status-badge' (type {StatusConfig}).
- **Layout:** none.
- **Outer container:** StatusFromMap.
- **Structure:** status map: open → STATUS.pending, under_review → STATUS.active, resolved → STATUS.success, dismissed → STATUS.closed.
- **Interactive controls:** none.
- **Form fields:** none.
- **Lists/tables:** none.
- **States:** none.
- **Status badges:** n/a.
- **Hard-coded colour utilities:** none.
- **Notable redesign issues:** none.

---

## 7. Part E — Admin Moderation Suite & `components/ui/*` Color Audit

I read all 14 listed files in full and searched every file in `components/ui/` for colour classes. Nothing was edited.

**Main findings:**
- **Confirm dialogs:** none of the admin pages has one. The `Dialog` component is never used on them, including for suspend, ban, reject, close task and hide rating.
- **Native controls:** every filter control is a native `<input>` or `<select>`. No admin page uses the shared `Input`, `Select`, `Checkbox` or `Label`.
- **Hard-coded colours:** only three admin pages have them, all in amber warning boxes (`users/show` L70, `reports/show` L14, `ratings/show` L8). Only `users/show` has dark-mode variants.
- **`components/ui/`:** no hard-coded palette colours and no `hsl(var(` anywhere.
- **Pagination:** it looks different on each page. On `flags/index` it is missing completely.

---

### pages/admin/dashboard.tsx (143 lines)
- Exports: default `AdminDashboard` (+ `.layout`).
- Imports: '@inertiajs/react' {Head, Link}, '@/layouts/admin-layout', '@/components/verification-status-badge' {VerificationStatusBadge}, '@/routes/admin'.
- Layout used + props: `AdminLayout` (no props), via `AdminDashboard.layout`.
- Outer container: `space-y-8`.
- Structure:
  1. Header div: h1 `text-2xl font-semibold` "Admin dashboard"; p `mt-1 text-sm text-muted-foreground` "Review account verification and recent actions."
  2. section aria-label "Verification counts", `grid gap-4 sm:grid-cols-2 lg:grid-cols-4`. Four cards (`rounded-lg border p-4`) from `countCards`: "Awaiting review", "More information requested", "Verified", "Rejected". Each shows a label (`text-sm text-muted-foreground`), a VerificationStatusBadge and a count (`mt-3 text-3xl font-semibold`). `counts.unverified` is never shown.
  3. section aria-label "Task review counts", `grid gap-4`. One Link card (`rounded-lg border p-4 hover:bg-muted/50`): "Tasks awaiting review" + `counts.tasksAwaitingReview`.
  4. section aria-label "Latest tasks awaiting review", `space-y-3`. h2 `text-lg font-semibold` "Latest tasks awaiting review", p "The newest submissions appear first.", "Review all" link. Then a table.
  5. section aria-label "Report review counts", `grid gap-4 sm:grid-cols-2`. Two Link cards: "Open reports", "Reports under review".
  6. section aria-label "Safety and account actions", `grid gap-4 sm:grid-cols-2 lg:grid-cols-4`. Four Link cards: "High-priority reports", "Escalated reports", "Open content flags", "Active suspensions".
  7. section `space-y-3`: h2 "Recent admin actions" + "Review users" link, then a table.
- Interactive controls (all are Links, no Buttons):
  - Task card → `admin.tasks.index()`.
  - "Review all" → `admin.tasks.index({ query: { status: 'pending_review' } })`.
  - Task title → `admin.tasks.show(task.id)`.
  - "Open reports" → `admin.reports.index({query:{status:'open'}})`.
  - "Reports under review" → `{status:'under_review'}`.
  - "High-priority reports" → `{priority:'high'}`.
  - "Escalated reports" → `{escalated:'1'}`.
  - "Open content flags" → hard-coded `"/admin/flags"` (L106).
  - "Active suspensions" → `admin.users.index()` (no filter).
  - "Review users" → `admin.users.index()`.
- Form fields: none.
- Lists/tables:
  - `latestPendingTasks` table (`overflow-x-auto rounded-lg border` > `table w-full text-left text-sm`, thead `bg-muted/50 text-muted-foreground`). Columns: Task, Poster, Submitted.
  - `recentActions` table. Columns: Action (`action.replaceAll('_',' ')`), Account, Actor (fallback "Account removed"), Note (`max-w-xs whitespace-pre-wrap`, fallback "—"), Date.
- States:
  - Empty: "No tasks are waiting for review." and "No admin actions have been recorded yet." (both `rounded-lg border p-5 text-sm text-muted-foreground`).
  - Dates fall back to '—'.
- Status badges: `VerificationStatusBadge status={card.status}` (pending, more_info_requested, verified, rejected).
- Hard-coded colours: none.
- Redesign issues:
  - Count cards are repeated as inline JSX, with no shared stat-card component.
  - L104–107 are dense one-line JSX.
  - The flags route is hard-coded and the "Active suspensions" link has no filter.
  - Raw action keys are shown with `replaceAll`.

### pages/admin/users/index.tsx (97 lines)
- Exports: default `AdminUsersIndex` (+ `.layout`).
- Imports: 'react' {useState}, '@inertiajs/react' {Head, Link, router}, '@/layouts/admin-layout', '@/components/verification-status-badge' {VerificationStatusBadge}, '@/routes/admin'.
- Layout used + props: `AdminLayout`.
- Outer container: `space-y-6`.
- Structure:
  1. Header: h1 "Users"; p "Search accounts and filter by account type or verification status."
  2. Filter form `grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4`.
  3. Table with pagination row, or an empty state.
- Interactive controls:
  - native `<button type="submit">` "Apply filters" (`h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground`).
  - User name Link → `admin.users.show(user.id)`.
  - Pagination Links.
- Form fields (all controlled, no id/name/label/helper/error):
  - `<input>` placeholder and aria-label "Search by name" (`h-10 rounded-md border bg-background px-3 text-sm`; L49 has extra indentation).
  - native `<select>` aria-label "Filter by account type": "All account types" + `userTypes`.
  - native `<select>` aria-label "Filter by verification status": "All statuses" + `verificationStatuses`.
  - Submit runs `router.get(admin.users.index().url, {search, user_type, verification_status}` (empty values sent as undefined), `{preserveState, preserveScroll})`. GET params: `search`, `user_type`, `verification_status`.
- Lists/tables: `users.data` table. Columns: Name, Type, Status, Registered.
- Pagination:
  - p "Showing {from}–{to} of {total} accounts".
  - nav aria-label "Users pages". Every link is a `Link` with `dangerouslySetInnerHTML`, class `rounded border px-3 py-2 text-sm`, plus `bg-muted font-medium` when active and `pointer-events-none opacity-50` when there is no URL (`href '#'`).
- States: empty "No accounts match these filters." (`rounded-lg border p-6 ...`). No processing state.
- Status badges: `VerificationStatusBadge status={user.verificationStatus}`.
- Hard-coded colours: none.
- Redesign issues:
  - Native selects and input instead of ui `Input`/`Select`; no visible labels (aria-label only).
  - Hand-rolled button instead of `Button`.
  - Pagination is HTML-injected.

### pages/admin/users/show.tsx (148 lines)
- Exports: default `AdminUserShow` (+ `.layout`). Local components: `DecisionForm`, `Detail`.
- Imports: '@inertiajs/react' {Form, Head}, '@/layouts/admin-layout', '@/components/input-error', '@/components/verification-status-badge' {VerificationStatusBadge}, '@/components/ui/textarea' {Textarea}, '@/components/rating-summary' {ratingNotice}, '@/routes/admin'.
- Layout used + props: `AdminLayout`.
- Outer container: `space-y-8`.
- Structure:
  1. Header `flex flex-wrap items-start justify-between gap-4`: p "Account review", h1 `{user.name}`, p `{user.email}`, VerificationStatusBadge.
  2. Amber notice div (L70–71): "These checks are based on information the user submitted. They do not guarantee the person's future behavior or the safety of a task."
  3. section "Submitted details" (h2): `dl` `grid gap-4 rounded-lg border p-4 sm:grid-cols-2` of `Detail` items (`dt text-sm text-muted-foreground`, `dd mt-1 whitespace-pre-wrap break-words text-sm`, fallback "Not provided"). Labels:
     - "Account type", "Email".
     - "CMU institutional email" (students only; appends " (confirmed …)").
     - "Verification method" ("CMU institutional email code" / "Administrator review").
     - "Student ID number" / "Employee ID number" and "Affiliation" (non-organization accounts).
     - "Organization name", "Representative position", "Organization description" (organization accounts; description is `sm:col-span-2`).
     - "Registered", "Verified" (`… by …`), "Current verification note" (col-span-2).
  4. If `isSelf`: p "You cannot change your own account verification." Otherwise section "Review decision" with `grid gap-3 md:grid-cols-3` holding 3 DecisionForms.
  5. section "Account history": articles (`rounded-lg border p-4 text-sm`) showing the action, date, "By {actorName ?? 'an administrator'}" and the note.
  6. section "Ratings received and given" (all on one line, L132):
     - p `{ratingNotice}`.
     - h3 "Received" and "Given".
     - Each rating is an article: "{taskTitle} · {overall}/5 · {direction}", "From/To {otherParty} · {date}{ · Hidden}", the comment, "Hide reason: …", and the dimension scores joined with " · ".
  7. section "Sanctions and platform actions" (all on one line, L133): a sanction form (if not self), then the sanction articles, each with an inline lift form.
- Interactive controls:
  - DecisionForm `<button>` (native, `rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50`). Labels: "Approve account", "Reject account", "Request more information". Uses `admin.users.verification.form(userId)`.
  - "Record action" native button (`rounded bg-primary px-4 py-2 text-primary-foreground`). Form `action={`/admin/users/${user.id}/sanctions`}` POST, hard-coded URL.
  - "Lift sanction" native button (`underline`), shown when `liftedAt === null`. Posts to `/admin/sanctions/${item.id}/lift`.
  - Disabled while processing. No processing text and **no confirm dialog** for Reject, Suspend user, Ban user, Remove post or Lift.
- Form fields:
  - DecisionForm: hidden `decision`. When `needsNote` (reject, more info): label "Note for the account holder" (htmlFor `note-${decision}`), `Textarea` id `note-${decision}`, name `note`, required, maxLength 2000, placeholder "Explain the decision in clear terms.". Errors via `<InputError message={errors.note} />` and `errors.decision`.
  - Sanction form (no labels, no InputError):
    - native `select name="action"` (`h-10 rounded border bg-background px-3`). Options: "Issue warning", "Require additional verification", "Suspend user", "Ban user", "Remove post".
    - native `select name="task_id"`: "Choose a post to remove" + `postedTasks` shown as "{title} · {status}".
    - `input name="ends_at" type="datetime-local"`, unlabeled.
    - native `textarea name="reason"`, required, 5–2000, placeholder "Reason shown to the user" (`min-h-20 rounded border bg-background p-3`).
    - `textarea name="internal_note"`, required, 3–3000, placeholder "Internal admin note".
  - Lift form: `input name="note"`, required, 3–2000, placeholder "Required lift note" (`h-9 rounded border bg-background px-2`).
- Lists/tables (all cards): history, ratings, sanctions. Sanction card shows "{type} · {reason}", "Internal note: … · Ends …/No end date · Lifted …".
- States:
  - Empty: "No account actions have been recorded.", "No ratings received." / "No ratings given." (`rounded border p-3 text-sm text-muted-foreground`), "No sanctions on record."
  - Conditional: the self message (block 4).
- Status badges: `VerificationStatusBadge status={user.verificationStatus}`.
- Hard-coded colours: L70 `border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100`.
- Redesign issues:
  - L132–133 are huge one-line JSX blocks with unlabeled native selects, textareas and datetime input.
  - The datetime field and task select always show, even when not relevant to the chosen action.
  - No confirmation for ban, suspend or reject.
  - Mixed primitives: ui `Textarea` in one form, native textarea in another.

### pages/admin/tasks/index.tsx (28 lines)
- Exports: default `AdminTaskQueue` (+ `.layout`).
- Imports: '@/lib/format' {formatDate}, 'react' {useState}, '@inertiajs/react' {Head, Link, router}, '@/layouts/admin-layout', '@/components/task-status-badge' {TaskStatusBadge}, '@/routes/admin'.
- Layout used + props: `AdminLayout`.
- Outer container: `space-y-5` (the whole page is one line, L25).
- Structure:
  1. h1 "Task review queue"; p "Pending tasks appear first, with the newest submissions at the top."
  2. Filter form `grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4`.
  3. Table or empty state.
  4. Pagination nav.
- Interactive controls:
  - native button "Apply filters" (`h-10 rounded-md border px-4 text-sm font-medium hover:bg-muted`). Outline-style, which differs from the users page.
  - Title Link → `admin.tasks.show(task.id)`.
- Form fields (controlled, aria-label only):
  - input "Search title or poster" (placeholder is the same).
  - native select "Filter status": "All statuses" + `statuses`.
  - native select "Filter work mode": "All work modes" + `workModes`.
  - Submit runs `router.get(admin.tasks.index().url, {search, status, work_mode}, {preserveState, replace})`. Empty strings are sent too.
- Lists/tables: `tasks.data` table. Columns:
  - Title
  - Poster (name + `text-xs text-muted-foreground` posterType)
  - Status
  - Work mode
  - Submitted (`formatDate`)
- Pagination: shown only if `links.length > 3`. nav aria-label "Pagination", `flex flex-wrap gap-2`. Active links get `rounded border px-3 py-1 text-sm` (+ `bg-muted font-medium` when current); disabled ones are a `<span>` with `text-muted-foreground`. Labels use `dangerouslySetInnerHTML`.
- States: empty "No tasks match these filters." (`rounded-lg border p-8 text-center text-sm text-muted-foreground`).
- Status badges: `TaskStatusBadge status={task.status} label={task.statusLabel}`.
- Hard-coded colours: none.
- Redesign issues:
  - Single-line JSX.
  - Native selects.
  - Filter button style is inconsistent with users/index.
  - workMode is shown as a raw value.

### pages/admin/tasks/show.tsx (69 lines)
- Exports: default `AdminTaskReview` (+ `.layout`). Local `DecisionForm`.
- Imports: '@/lib/format' {formatDateTime, formatAmount, formatHoursFlexibility}, '@/constants/notices' {PAYMENT_BOUNDARY_NOTICE}, '@inertiajs/react' {Form, Head, Link}, '@/layouts/admin-layout', '@/components/task-status-badge' {TaskStatusBadge}, '@/components/verification-status-badge' {VerificationStatusBadge}, '@/components/safety-notice' {SafetyNotice}, '@/components/terms-status-badge' {ToBeDiscussedBadge}, '@/components/ui/button' {Button}, '@/components/ui/textarea' {Textarea}, '@/components/input-error', '@/routes/admin', '@/routes/admin/users', '@/components/completion-payment-panel' {CompletionPaymentPanel, type CompletionPaymentData}.
- Layout used + props: `AdminLayout`.
- Outer container: `space-y-6`.
- Structure:
  1. Optional `status` flash: div role="status" `rounded-lg border px-4 py-3 text-sm`.
  2. Header `flex flex-wrap items-start justify-between gap-3`: "Back to task queue" link, h1 `{task.title}` (`mt-2 text-2xl font-semibold`), p "Submitted {formatDateTime}", TaskStatusBadge.
  3. `<SafetyNotice />`.
  4. p `rounded-lg border p-4 text-sm` "Every submitted task is reviewed by an administrator before it can be approved."
  5. section `grid gap-4 lg:grid-cols-3`:
     - Card `space-y-4 rounded-xl border p-5 lg:col-span-2`, h2 "Task details". `<strong>` label/value rows: Category (+ workTypeLabel), Description, Main activities, Expected result or deliverables, Skills, Estimated duration ("{n} hours"), Complexity, Pay amount (ToBeDiscussedBadge or ₱formatAmount), Pay timing (badge or label + "(note)"), Work hours (badge or scheduleSummary), Can hours change, Schedule note. Then PAYMENT_BOUNDARY_NOTICE (muted), and "Current review note: …" (`rounded border p-3 text-sm`).
     - aside `space-y-3 rounded-xl border p-5`, h2 "Poster": name, type, VerificationStatusBadge, "Other tasks: {n}".
  6. section "Workplace details" (`space-y-3 rounded-xl border p-5`): Work mode, Workplace, Workplace address, and the muted line "This is a stated place of work. TaskMate does not track locations or collect coordinates."
  7. section "Off-platform content flags": articles (`border-t pt-3 text-sm`) showing "{category} · {status}", "Field: …", "Matched indicators: …", "Flagged {date}".
  8. If `agreement`: section "Agreement" with "Status: …", "Locked …", link, and the close-task form.
  9. If `agreement && completionPayment`: `<CompletionPaymentPanel agreementId data readOnly />`.
  10. section "Applications": rows (`flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm`) with an applicant link, raw status and date.
  11. section "Admin action history": "{action} · {adminName ?? 'Administrator'} · {date}" + note.
  12. If `canReview`: section "Review decision" `grid gap-3 md:grid-cols-3` with 3 DecisionForms. Else, if status is `pending_review`: p "You cannot review a task you posted yourself."
- Interactive controls:
  - "Back to task queue" → `admin.tasks.index()`.
  - "View agreement versions and confirmations" → `admin.agreements.show(agreement.id)`.
  - Applicant name → `adminUsers.show(application.userId)`.
  - DecisionForm `Button` (default variant/size) using `admin.tasks.decision.form(taskId)`: "Approve task", "Reject task", "Request changes".
  - "Close task" `Button` (default variant, not destructive). Form POST to hard-coded `/admin/tasks/${task.id}/close`. Shown when `task.status === 'in_progress' && agreement.locked_at`. **No confirm dialog** for Close or Reject.
- Form fields:
  - DecisionForm: hidden `decision`. label "Admin note (required)" / "Admin note (optional)" (htmlFor `${decision}-note`). `Textarea` id `${decision}-note`, name `note`, required = noteRequired. Placeholder "Optional note for the poster." (approve) or "Explain the decision to the poster.". `InputError errors.note`.
  - Close form: wrapping label "Close task as cancelled by administrator" around a native `textarea name="note"` (required, 5–3000, `mt-1 min-h-24 w-full rounded border bg-background p-3`, placeholder "Required reason. Agreement records will remain unchanged."). No InputError.
- Lists/tables: flags, applications and admin actions are card or row lists, no tables.
- States:
  - Empty: "No off-platform content flags have been recorded.", "No applications have been submitted.", "No admin decisions have been recorded for this task."
  - No processing text.
- Status badges: `TaskStatusBadge status label`, `VerificationStatusBadge status={task.poster.verificationStatus}`, `ToBeDiscussedBadge`.
- Hard-coded colours: none.
- Redesign issues:
  - Very long single-line JSX (L58–66).
  - Details are a `<strong>`-label paragraph wall instead of a `dl`.
  - Application status is shown raw.
  - The close textarea is native (inconsistent), and Close uses a non-destructive button with no confirmation.

### pages/admin/agreements/show.tsx (9 lines)
- Exports: default `AdminAgreementShow` (+ `.layout`).
- Imports: '@inertiajs/react' {Head}, '@/components/agreement-details' {AgreementDetails}, '@/layouts/admin-layout'. Also an inline type import `import('@/components/completion-payment-panel').CompletionPaymentData`.
- Layout used + props: `AdminLayout`.
- Outer container: none (fragment). Renders `<AgreementDetails {...props} readOnly />`.
- Structure: Head title "Agreement: {agreement.task.title}", then AgreementDetails (not inventoried).
- Interactive controls, form fields, lists, states: all inside AgreementDetails (not in scope).
- Status badges: none directly.
- Hard-coded colours: none.
- Redesign issues: `agreement: any` typing; no back link or page heading in this file.

### pages/admin/reports/index.tsx (22 lines)
- Exports: default `AdminReportsQueue` (+ `.layout`).
- Imports: '@/lib/format' {formatDate}, 'react' {useState}, '@inertiajs/react' {Head, Link, router}, '@/layouts/admin-layout', '@/components/report-status-badge' {ReportStatusBadge}, '@/routes/admin'.
- Layout used + props: `AdminLayout`.
- Outer container: `space-y-5` (the page is one line, L19).
- Structure:
  1. h1 "Report review queue"; p "Review reports and related TaskMate records."
  2. p `rounded-lg border p-4 text-sm` "This review is a platform record, not a legal ruling. TaskMate cannot recover or guarantee payment."
  3. Filter form `grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3`.
  4. Table or empty state.
  5. Pagination.
- Interactive controls:
  - native button "Apply filters" (`h-10 rounded-md border px-4 text-sm font-medium`).
  - Row Link "{typeLabel} · {taskTitle}" (`underline`) → `admin.reports.show(item.id)`.
- Form fields (controlled, aria-label only, all `h-10 rounded-md border bg-background px-3 text-sm`):
  - input aria "Search parties", placeholder "Search reporter or reported person".
  - select "Filter type": "All types" + `types`.
  - select "Filter status": "All statuses" + `statuses`.
  - select "Filter priority": "All priorities" / "High" / "Normal".
  - select "Filter escalation": "Any escalation" / "Escalated" (1) / "Not escalated" (0).
  - select "Filter evidence": "Any evidence" / "Has evidence" (1) / "No evidence" (0).
  - Submit runs `router.get(admin.reports.index().url, {search,type,status,priority,escalated,has_evidence}, {preserveState, replace})`.
- Lists/tables: `reports.data` table (thead `bg-muted/50`, with no muted text). Columns:
  - Type / Task (+ `ml-2 text-xs` "Escalated" span)
  - Priority (raw)
  - Reporter
  - Reported person
  - Status
  - Filed (`formatDate`)
- Pagination: shown if `links.length > 3`. nav `flex flex-wrap gap-2` with no aria-label. Every link is `rounded border px-3 py-1 text-sm`, with no active style; disabled ones are a `<span>`. Labels use `dangerouslySetInnerHTML`.
- States: empty "No reports match these filters." (`rounded-lg border p-8 text-center text-sm text-muted-foreground`).
- Status badges: `ReportStatusBadge status={item.status} label={item.statusLabel}`.
- Hard-coded colours: none.
- Redesign issues:
  - Six native controls.
  - "Escalated" is plain text, not a badge, and priority is shown raw.
  - Pagination has no active state.
  - Single-line JSX.

### pages/admin/reports/show.tsx (17 lines)
- Exports: default `AdminReportShow` (+ `.layout`). Local `DecisionForm`.
- Imports: '@inertiajs/react' {Form, Head}, '@/layouts/admin-layout', '@/components/ui/button' {Button}, '@/components/ui/textarea' {Textarea}, '@/components/input-error', '@/components/report-details' {ReportDetails}, '@/routes/admin'.
- Layout used + props: `AdminLayout`.
- Outer container: `space-y-5`.
- Structure:
  1. p `rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm` showing `{notice}` (text comes from the server).
  2. `<ReportDetails report={report} />`.
  3. If `escalatedAt`: p `rounded border p-3 text-sm` "Escalated {escalatedAt}: {escalationNote} · {escalationOfficeLabel}".
  4. If `canReview`: section `space-y-3 rounded-xl border p-5`, h2 "Review decision", `grid gap-3 md:grid-cols-2` with 4 DecisionForms, plus the sanction form if `report.reportedUser`.
  5. If not `canReview` and status is open or under_review: p "This report is not available for review by this administrator."
- Interactive controls:
  - DecisionForm (each has an h3 = label) with a `Button` (default) using `admin.reports.decision.form(reportId)`: "Start review", "Escalate", "Resolve report", "Dismiss report".
  - "Record platform action" `Button` (default). Form POST to hard-coded `/admin/users/${report.reportedUser.id}/sanctions`.
  - **No confirm dialogs** (Dismiss, Ban, Suspend).
- Form fields:
  - DecisionForm: hidden `decision`.
    - Resolve only: label "Outcome" htmlFor `outcome` + native `select id="outcome" name="outcome"` (required, `h-10 w-full rounded-md border bg-background px-3 text-sm`). Options: "Choose an outcome", "Supported", "Not supported", "Inconclusive". `InputError errors.outcome`.
    - Resolve only: `Textarea name="resolution_message"` maxLength 3000, placeholder "Optional message visible to the reporter", no label.
    - All forms: `Textarea name="note"`, required = noteRequired, placeholder "Required internal note" / "Optional internal note", no label. `InputError errors.note`.
  - Sanction form (h3 "Platform action for reported user"):
    - hidden `report_id`.
    - native `select name="action"`: "Issue warning", "Require additional verification", "Suspend user", "Ban user", "Remove related post".
    - `input name="task_id" type="number"` defaultValue `report.task.id`, placeholder "Task ID to remove".
    - `input name="ends_at" type="datetime-local"`.
    - `Textarea name="reason"` required 5–2000, placeholder "Reason visible to the user".
    - `Textarea name="internal_note"` required 3–3000, placeholder "Internal admin note".
    - No labels, no InputError.
- Lists/tables: none directly (inside ReportDetails).
- States: conditional messages as above; no processing text.
- Status badges: none directly.
- Hard-coded colours: L14 `border-amber-300 bg-amber-50`. No dark variant and no text colour, so it is likely low contrast in dark mode.
- Redesign issues:
  - `outcome` id is not unique-safe.
  - Textareas have no labels.
  - The raw numeric Task ID input is poor UX.
  - `report: any`; single-line JSX.

### pages/admin/flags/index.tsx (7 lines)
- Exports: default `FlagQueue` (+ `.layout`).
- Imports: '@inertiajs/react' {Head, Link}, '@/layouts/admin-layout'.
- Layout used + props: `AdminLayout`.
- Outer container: `<main className="space-y-4">`. This is a nested `main` inside the layout.
- Structure:
  1. h1 "Content flags" (no description).
  2. Filter form `flex flex-wrap gap-2`.
  3. Table or empty state.
- Interactive controls:
  - native `<button className="rounded border px-4">` "Filter".
  - Row Link "Review" → hard-coded `/admin/flags/${flag.id}`.
- Form fields: a native GET form with no onSubmit (full page reload to the current URL).
  - `select name="category"` (defaultValue `filters.category`, `h-10 rounded border bg-background px-3`). Options: "All categories" + an inline hard-coded map: move_chat_outside "Move chat outside TaskMate", bypass_agreement "Bypass agreement", bypass_review "Bypass review", share_contact_details "Share contact details".
  - `select name="status"`: "All statuses" / "Open" / "Reviewed" / "Dismissed".
  - No labels and no aria-labels.
- Lists/tables: `flags.data` table (`overflow-x-auto rounded border`, plain thead). Columns: Category, Author, Content ("{context} · {field}"), Status (raw), plus an empty header for the Review link.
- Pagination: **not rendered** (the `flags.links` prop is ignored).
- States: empty "No content flags match these filters." (`rounded border p-6`, not muted).
- Status badges: none (status shown raw).
- Hard-coded colours: none.
- Redesign issues:
  - Category list is duplicated in the page (config rule).
  - Selects have no labels or aria-labels.
  - Missing pagination; `any` types.
  - Hard-coded URLs.

### pages/admin/flags/show.tsx (7 lines)
- Exports: default `ShowFlag` (+ `.layout`).
- Imports: '@inertiajs/react' {Form, Head, Link}, '@/layouts/admin-layout'.
- Layout used + props: `AdminLayout`.
- Outer container: `<main className="max-w-3xl space-y-5">`.
- Structure:
  1. Link "Back to flags".
  2. h1 `{flag.categoryLabel}`.
  3. p `rounded border p-4 text-sm`: **{author.name}** · {field} · {createdAt}.
  4. Optional p "Task: {flag.task.title}".
  5. section `whitespace-pre-wrap break-words rounded border p-4` showing `{flag.content}`.
  6. Optional Link "Open related report" → `flag.relatedReportUrl`.
  7. p "Matched labels: …".
  8. section `rounded border p-4`, h2 "Author account actions": sanction lines "{type}: {reason} (active)" + sanction form.
  9. If `status === 'open'`: decision form `space-y-3 rounded border p-4`.
- Interactive controls:
  - "Back to flags" (hard-coded `/admin/flags`).
  - "Record platform action" native button (`rounded border px-4 py-2`). POST to `/admin/users/${flag.author.id}/sanctions`.
  - "Save review" native button (`rounded border px-4 py-2`). POST to `/admin/flags/${flag.id}/decision`.
  - **No confirm dialogs.**
- Form fields:
  - Sanction form (no labels, no errors):
    - native `select name="action"`: "Issue warning", "Require additional verification", "Suspend user", "Ban user".
    - `input name="ends_at" type="datetime-local"`.
    - `textarea name="reason"` required 5–2000, placeholder "Reason shown to the user".
    - `textarea name="internal_note"` required 3–3000, placeholder "Internal admin note".
  - Decision form:
    - wrapping label "Decision" around `select name="decision"` (`mt-1 h-10 w-full rounded border bg-background px-3`): "Mark reviewed" / "Dismiss".
    - `textarea name="note"` required 3–2000, placeholder "Required review note".
    - No InputError.
- Lists/tables: sanctions as plain `p` lines.
- States: no empty text for sanctions (it renders nothing); no processing text.
- Status badges: none.
- Hard-coded colours: none.
- Redesign issues:
  - `max-w-3xl` wrapper and nested `main`.
  - Entirely native controls with no error display.
  - Primary actions use outline-style buttons.
  - `any` types.

### pages/admin/ratings/index.tsx (13 lines)
- Exports: default `Page` (+ `.layout`).
- Imports: '@inertiajs/react' {Head, Link, router}, 'react' {useState}, '@/layouts/admin-layout', '@/components/rating-summary' {ratingNotice}.
- Layout used + props: `AdminLayout`.
- Outer container: `space-y-5`.
- Structure:
  1. h1 "Ratings".
  2. p `rounded-lg border p-4 text-sm` showing `{ratingNotice}`.
  3. Filter form `grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-5`.
  4. Table container `overflow-x-auto rounded-xl border` (the empty message sits inside it).
  5. nav `flex gap-2`.
- Interactive controls:
  - native button "Apply filters" (`rounded bg-primary px-3 py-2 text-primary-foreground sm:col-span-2 lg:col-span-5`).
  - Task Link → hard-coded `/admin/ratings/${rating.id}`.
- Form fields (controlled, aria-label only):
  - input "Search user", placeholder "Search user name" (`rounded border bg-background px-3`, **no height class**).
  - select "Direction": "All directions" / "Poster to student" / "Student to poster".
  - select "Hidden": "Visible and hidden" / "Visible" (0) / "Hidden" (1).
  - number input "Minimum rating" (min 1, max 5, placeholder "Min score", `rounded border px-3`, no bg-background).
  - number input "Maximum rating" (placeholder "Max score").
  - Submit runs `router.get('/admin/ratings', values)` (hard-coded URL). GET params: search, direction, hidden, rating_min, rating_max.
- Lists/tables: `ratings.data` table (thead tr `border-b`, rows `border-b`). Columns: Task, Rater, Ratee, Direction (replaceAll), Score ("{n}/5"), Status ("Hidden"/"Visible"), Date.
- Pagination: renders only links that have a URL (`rounded border px-3 py-1`, HTML label). No active state, no aria-label, and it always renders.
- States: empty "No ratings match these filters." (`p-6 text-sm text-muted-foreground`, inside the table wrapper).
- Status badges: none (Hidden/Visible shown as text).
- Hard-coded colours: none.
- Redesign issues:
  - Inputs have inconsistent heights and backgrounds.
  - Hidden/Visible is plain text.
  - Pagination drops disabled and current items.
  - Hard-coded route instead of Wayfinder.

### pages/admin/ratings/show.tsx (11 lines)
- Exports: default `Page` (+ `.layout`).
- Imports: '@/lib/format' {formatAmount}, '@inertiajs/react' {Form, Head, Link}, '@/layouts/admin-layout', '@/components/rating-summary' {ratingNotice}.
- Layout used + props: `AdminLayout`.
- Outer container: `space-y-5`.
- Structure:
  1. Link "Back to ratings" (`/admin/ratings`).
  2. h1 "Rating for {taskTitle}".
  3. p bordered `{ratingNotice}`.
  4. amber p `{notice}`.
  5. section `space-y-2 rounded-xl border p-5`:
     - "{rater} rated {ratee}"
     - "Direction: … · Overall: n/5"
     - per-score "{label}: n/5"
     - comment
     - "Status: Hidden — {reason}" / "Visible to others" / "Waiting for both ratings or window close"
     - "Agreed amount: ₱… · Due …"
     - "Payment arrangement: …"
     - "Agreement record reference: " (`break-all font-mono`, fallback "Unavailable")
     - Link "View agreement" → `/admin/agreements/${agreementId}`
  6. Moderation form.
- Interactive controls:
  - If hidden: native button "Restore rating" (`rounded border px-4 py-2`). Form POST `/admin/ratings/${id}/moderate` with hidden `action=restore`.
  - Otherwise: "Hide rating" native button (`rounded bg-destructive px-4 py-2 text-destructive-foreground`). Same URL, hidden `action=hide`.
  - Forms do not use the render-prop, so buttons are never disabled while processing. **No confirm dialog.**
- Form fields: hide form `space-y-3 rounded-xl border p-5`: label "Reason for hiding (required)" htmlFor `reason`; native `textarea id="reason" name="reason"` required maxLength 2000 (`min-h-24 w-full rounded border bg-background p-3`). No InputError.
- Lists/tables: scores as `p` lines.
- States: no processing state; no error display.
- Status badges: none.
- Hard-coded colours: L8 `border-amber-300 bg-amber-50 text-amber-950` (no dark variants).
- Redesign issues:
  - Details are a paragraph wall.
  - Native textarea and buttons, with no `Button`/`Textarea` usage.
  - Amber box has no dark-mode variant.
  - Hard-coded URLs.

### layouts/admin-layout.tsx (26 lines)
- Exports: default `AdminLayout`.
- Imports: 'react' {type PropsWithChildren}, '@/components/app-content' {AppContent}, '@/components/admin-sidebar' {AdminSidebar}, '@/components/app-shell' {AppShell}, '@/components/app-sidebar-header' {AppSidebarHeader}, '@/components/prototype-banner', '@/components/site-footer'.
- Layout used + props: `AppShell` > `AdminSidebar` + `AppContent variant="sidebar" className="min-w-0 overflow-x-clip"` > `AppSidebarHeader showMessages={false} breadcrumbs={[{ title: 'Administration', href: '/admin' }]}`.
- Outer container: `<PrototypeBanner />` above the shell. Page content goes in `<div className="page-wide">`, then `<SiteFooter />`.
- Structure: banner, sidebar, header (fixed single breadcrumb "Administration"), page-wide content, footer.
- Interactive controls, form fields, lists, states, badges: none.
- Hard-coded colours: none.
- Redesign issues: breadcrumbs are static (no per-page trail); hard-coded `/admin` href.

### components/admin-sidebar.tsx (50 lines)
- Exports: `AdminSidebar`.
- Imports: '@inertiajs/react' {Link}, 'lucide-react' {BriefcaseBusiness, Flag, LayoutDashboard, ShieldCheck, Star, Users}, '@/components/app-logo', '@/components/nav-main' {NavMain}, '@/components/nav-user' {NavUser}, '@/components/ui/sidebar' {Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem}, '@/routes/admin', '@/types' {type NavItem}.
- Layout: `Sidebar collapsible="icon" variant="inset"`.
- Structure:
  1. SidebarHeader: `SidebarMenuButton size="lg" asChild` > Link `admin.dashboard()` prefetch > AppLogo + span `truncate text-sm font-medium` "Administration".
  2. SidebarContent: `NavMain items groupLabel="Administration"`. Items:
     - Dashboard (`admin.dashboard().url`, LayoutDashboard)
     - Users (`admin.users.index().url`, Users)
     - Tasks (`admin.tasks.index().url`, BriefcaseBusiness)
     - Reports (`admin.reports.index().url`, ShieldCheck)
     - Flags (hard-coded `'/admin/flags'`, Flag)
     - Ratings (`admin.ratings.index().url`, Star)
  3. SidebarFooter: `NavUser`.
- Hard-coded colours: none.
- Redesign issues: the Flags route is hard-coded; "Administration" appears twice (header label and group label); no count badges on nav items.

---

### components/ui/* — hard-coded colours and `hsl(var(` usage
- **Hard-coded palette colours** (gray, slate, zinc, neutral palette, stone, red, amber, yellow, green, emerald, blue, sky, indigo, white, black) and hex/rgb/hsl literals: **none** in any of the 27 ui files:
  - alert, avatar, badge, breadcrumb, button, card, checkbox, collapsible, dialog, dropdown-menu, icon, input-otp, input, label, navigation-menu
  - placeholder-pattern, select, separator, sheet, sidebar, skeleton, sonner, spinner, textarea, toggle-group, toggle, tooltip
- **`hsl(var(` usage: none.**
- Things that look like colours but are not palette colours:
  - badge.tsx L27: `border-neutral-border bg-neutral-bg text-neutral-fg`. These are semantic tokens, not the Tailwind `neutral` palette. The same file uses the `success-*`, `warning-*`, `danger-*` and `info-*` tokens (L23–26).
  - sonner.tsx L29–44: an inline `style` object mapping `--normal-*`, `--success-*`, `--error-*`, `--warning-*`, `--info-*` and `--border-radius` to `var(--popover)`, `var(--popover-foreground)`, `var(--border)`, `var(--status-success-bg|fg|border)`, `var(--status-danger-*)`, `var(--status-warning-*)`, `var(--status-info-*)` and `var(--radius)`. These are token references only.
  - Layout-only `var()` uses (not colours):
    - alert.tsx L9 `calc(var(--spacing)*4)`
    - navigation-menu.tsx L115 `var(--radix-navigation-menu-viewport-*)`
    - select.tsx L82 `var(--radix-select-trigger-*)`
    - sidebar.tsx L229/236/238/239/242 (sidebar width and `--banner-h` calcs)
    - sidebar.tsx L486 `shadow-[0_0_0_1px_var(--sidebar-border)] hover:shadow-[0_0_0_1px_var(--sidebar-accent)]`, a token-based shadow colour.
