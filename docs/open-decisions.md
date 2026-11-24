# Open decisions for the project team

Every item below is unresolved or provisional. Current behavior is not university-approved policy.

| Decision | Current location and provisional default | If decision differs |
|---|---|---|
| Who can post and what verification each role needs | `config/taskmate.php`: students can post by default; verification required | Change `students_can_post`, `require_verification`, role checks, and tests |
| Advanced features in the first-version demo | Product simplification proposal keeps the main task journey central; existing multi-dimension ratings, detailed reports/escalation, sanctions, scanning, notifications, and conversations remain implemented pending team scope approval | Confirm what belongs in the demo. If any feature is deferred, hide or label its user entry points without deleting its schema or stored records |
| Institutional email domains and progressive student onboarding | `config/taskmate.php`: `institutional_email_domains` (`cmu.edu.ph`), `require_institutional_email` (`false` by default for progressive personal-email signup), `student_verification.auto_verify_institutional_email` (`true`), `student_verification.unverified_students_can_browse` (`true` read-only preview) | Confirm domains, whether personal emails remain allowed as a fallback, whether `@cmu.edu.ph` code confirmation auto-verifies students, and whether unverified students retain read-only Browse access |
| Task fields, categories, work modes, complexity | `categories`, `work_modes`, `complexity_levels`; categories marked provisional | Edit labels/keys and update any related data migration only with a data plan |
| Automated risk screening | Automated scoring, risk levels, keyword-based blocking, and auto-approval are disabled. Every new or resubmitted task stays pending until an administrator decides. Historical screening columns and rows are retained but no new rows are created. | If automation is reconsidered, the team and university must approve rules first, then design tests and safeguards before enabling it |
| Task guidelines and prohibited work | `task_guidelines` contains provisional rules shown to posters; submission is reviewed by an administrator | Approve the guideline wording and decide how any prohibited work should be handled during manual review |
| Workplace validation | Onsite and hybrid posts require a workplace name and worksite address; other validation criteria are undecided | Define any additional criteria before changing the current manual review flow |
| Task and application status rules | `app/Enums/TaskStatus.php`, `app/Enums/ApplicationStatus.php` | Confirm state transitions and adjust policies/workflows/tests |
| In-app messaging | `config/taskmate.php` `messages`; one private thread per application, text only, permanent messages, and no attachments | Confirm retention, harassment handling, and whether contact or payment details may be shared inside chat. Messages remain participant-only except a reported snapshot or a single scanner-flagged message. |
| Rating visibility, dimensions, window, moderation, appeals | `config/taskmate.php` `ratings` section (after_both, 30 days, min count 3) | Change visibility and fields; approve moderation/appeals before operation |
| Reports: types, respondent replies, priority, rate limits, evidence, response, escalation | `config/taskmate.php` `reports` and `moderation` sections | Approve types, evidence standards, rate limits, handling, contact, and response targets |
| Designated administrative office / escalation | `moderation.sanction_notice_contact` placeholder; office label unset | Supply approved office name, contact path, and response target |
| Sanction rules and appeals | `config/taskmate.php` `sanctions`; code in sanction workflow; appeals not implemented | Approve thresholds and appeals process before real enforcement |
| Off-platform scanning patterns | `offplatform.patterns` sample phrases and patterns for testing | Review false positives/negatives and approve patterns; detection only flags |
| Privacy, consent, retention, deletion, and evidence storage | `docs/privacy-and-data-handling.md` DRAFT; retention is TBD | Approve policy, consent, protected storage, and disposal before real personal data |
| Hosting, backups, keys, and operational security | README and draft privacy document; no production platform selected | Select supported environment and complete security review |
| Research protocol and acceptance thresholds | `docs/testing/*` templates; all counts/thresholds/schedule TBD | Approve protocol and collect research responses outside TaskMate |
| TaskMate team use of starter-kit Teams | Team schema and routes retained, UI hidden | Decide separately whether to remove the unused scaffolding after data review |
| In-app notification retention | `config/taskmate.php` `notifications.retention_days` is `null` (keep all alerts); no schedule runs automatically | Set an approved retention period and invoke `taskmate:prune-notifications` through an approved operational process |
| Future email or WebSocket delivery | Current final decision is in-app alerts with visible-tab polling every 10 seconds; no email, push, SMS, WebSockets, or notification preferences | Revisit only through a later team decision; review privacy, delivery, availability, packages, and operational costs before expanding channels |
| Notification copy and polling | `app/Notifications/TaskMateAlertCatalog.php`; `config/taskmate.php` `notifications` (10 seconds, 20 per page, 120 summary requests per minute) | Review event copy and poll limits; keep wording privacy-safe and allow multiple visible tabs |
| Conversation retention | `config/taskmate.php` `messages.retention_days` is `null`; conversations and messages are append-only and currently kept | Approve a retention period and any deletion/anonymization process before adding a purge mechanism |
| Harassment handling in conversations | Message reports use the Phase 9 report types and only share the reported message plus configured context | Approve response expectations and safeguarding procedures; do not expose full private threads to administrators |
| Contact and payment details in chat | No message filtering blocks contact or payment details; links remain plain text; off-platform rules flag only configured bypass requests | Decide whether contact/payment details may be shared in chat and whether warnings or additional review are needed; do not conflate direct payment arrangements with bypass requests |

## Out of scope for this version

- Ongoing jobs are not supported. Tasks are individual, time-bounded work records; a different model and workflow would be needed for recurring employment.
- Graduate/alumni accounts are not supported as a separate account type. Master's and doctoral students use the ordinary Student account type.
- Outside applicants are not supported. Applicants must be verified CMU students.
- Faculty/staff applying to tasks is not supported. Faculty/staff can post only.

## Future work

The team may revisit ongoing jobs, graduate/alumni accounts, outside applicants, and faculty/staff applications in a later version. Those changes would require approved eligibility rules, registration/verification changes, and task/application workflow updates; no implementation is included now.
