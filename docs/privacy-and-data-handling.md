# DRAFT: Privacy and data handling

**DRAFT — not approved policy.** Retention, deletion, consent, and protected-storage rules require decisions by the team and university. This prototype is for synthetic data only. Do not enter real personal data.

## Data inventory and workflow need

| Table | Personal or identifying fields | Workflow need / recommendation |
|---|---|---|
| users | `id`, `name`, `email`, `email_verified_at`, `institutional_email`, `institutional_email_verified_at`, `verification_method`, password hash, `remember_token`, `current_team_id`, `user_type`, `is_admin`, `verification_status`, `id_number`, `affiliation`, `organization_name`, `position`, `supporting_info`, `class_schedule`, `verification_note`, `verified_at`, `verified_by`, `two_factor_secret`, `two_factor_recovery_codes`, `two_factor_confirmed_at`, timestamps | Account access, verification, profile display, private class-fit checking, and account security. Password and 2FA secrets support authentication only. Raw registration details (`id_number`, `institutional_email`, `supporting_info`) support verification and appear only to the owner and admin detail workflow. `class_schedule` is strictly private to the owning student for task schedule comparison and is hidden from posters, other users, and administrators. Consider whether `id_number` and `supporting_info` can be minimized after review. `current_team_id` exists only because the starter-kit schema remains. |
| email_verification_codes | `user_id`, `purpose`, `email`, `code_hash`, `attempts`, `expires_at`, `used_at`, `created_at` | Short-lived hashed 6-digit codes for account email confirmation and optional CMU institutional email verification. Codes are never stored in plaintext and expire automatically. |
| password_reset_tokens | `email`, `token`, `created_at` | Password recovery; short-lived authentication data. |
| sessions | `id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity` | Login continuity and security. Review IP/user-agent retention. |
| tasks | `poster_id`, `title`, `description`, `required_activities`, `deliverables`, `skill_requirements`, `workplace_name`, `workplace_address`, `review_note`, `removal_reason`, `reviewed_by`, `removed_by`, plus category, legacy condition/risk fields, and status | Posting, work disclosure, and manual administrator review. Free text may contain personal details and should not. Workplace address is a place of work only, never a home address. Legacy risk fields remain nullable and are cleared on resubmission; no risk score or level is generated. |
| task_screenings | Legacy `task_id`, `factors`, `keyword_hits`, `hard_triggers`, and prior scores | Immutable historical records from the former automated review flow. No new rows are created; the schema and records are retained and are no longer shown in app pages. |
| applications | `task_id`, `applicant_id`, `message`, `proposed_amount`, `responded_at` | Applying and poster review. |
| agreements | `task_id`, `application_id`, `poster_id`, `student_id`, `current_version_id`, `cancelled_by`, `cancellation_reason` | Agreement participants and cancellation record. |
| agreement_versions | `agreement_id`, `proposed_by`, `deliverables`, `terms`, `workplace_name`, `workplace_address`, `payment_arrangement`, `comment`, `content_hash` | Immutable agreement terms/history. Free text should not include unnecessary personal details. |
| agreement_confirmations / agreement_messages | `agreement_version_id`, `agreement_id`, `user_id`, `body` | Party confirmation and agreement discussion. Agreement send-back notes are visible to the two agreement participants and are not copied into unrelated conversation views. |
| conversations | `application_id`, `task_id`, `poster_id`, `applicant_id`, `closed_by` | Identifies the two participants and close state; readable only by those participants. |
| conversation_messages | `conversation_id`, `sender_id`, `body` | Permanent, text-only task discussion. Only the poster and applicant can read the thread. Admins see a single message only when a participant reports it (with a frozen context snapshot) or the scanner flags that message. |
| conversation_reads / conversation_events | `conversation_id`, `user_id`, `last_read_message_id`, `event` | Private per-user unread state and append-only close/reopen history; read markers are not shown as receipts to the other participant. |
| report_message_snapshots | `report_id`, `message_id`, `sender_id`, `sender_display_name`, `body`, `sent_at` | Frozen report evidence containing only the reported message and configured nearby context. Administrators can read these snapshots on the related report. |
| task_completions / payment_events | `agreement_id`, `completed_by`, `actor_id`, `delivered_note`, `completion_note`, `note`, `method`, `amount`, `paid_on` | Completion and payment-status record only. Notes/method references should avoid unnecessary personal data. |
| reports | `reporter_id`, `reported_user_id`, `task_id`, `agreement_id`, `reviewed_by`, `escalated_by`, `description`, `admin_note`, `escalation_note`, `resolution_message` | Reporting and review. Internal notes are admin-only; reporter identity is hidden when replies are disabled. |
| report_statements / report_evidence | `report_id`, `user_id`, `uploaded_by`, `role`, `body`, `original_name`, `stored_path`, `mime`, `size_bytes` | Replies and evidence handling. Evidence is private and downloaded only through an authorized route. |
| ratings / rating_scores | `agreement_id`, `task_id`, `rater_id`, `ratee_id`, `comment`, `hidden_by`, `hidden_reason` | Contextual feedback, separate from reports. |
| admin_actions | `admin_id`, `subject_type`, `subject_id`, `note`, `metadata` | Append-only administrative audit record. |
| user_sanctions | `user_id`, `reason`, `internal_note`, `issued_by`, `report_id`, `flag_id`, `acknowledged_at`, `lifted_by`, `lift_note` | User-visible platform action and admin-only internal notes. |
| content_flags | `flaggable_type`, `flaggable_id`, `source_user_id`, `matched`, `reviewed_by`, `review_note` | Admin-only marker for content that may ask users to bypass platform steps. |
| notifications | `notifiable_type`, `notifiable_id`, `data`, `read_at` | Per-user in-app activity alerts and read state. Payload is restricted to a fixed event key, catalog title/body, local target URL, and related record IDs. Message alerts contain the task title and a count, never message text. Retention is configurable and currently unset. |
| passkeys / team_members / team_invitations | Passkey `user_id` and public credential metadata; team `user_id`, invitation `email`, `invited_by` | Authentication support and retained unused starter-kit Teams feature. Team UI is hidden and TaskMate does not depend on it. |

## Collection boundaries

The app has no ID-document or face-photo upload, home-address, phone-number, or coordinate collection field. Report evidence is allowed only for relevant evidence such as payment or chat screenshots; the form warns users not to upload government ID photos or selfies. The application scanner may flag contact text, but does not create a separate phone-number field.

Recommended removal/review before real use: decide whether `users.id_number` is necessary and how it can be minimized or masked; decide whether `users.supporting_info` needs to persist after verification; decide whether registered email search is needed in the admin list. Do not drop populated columns without a separate review and backup.

## DRAFT retention, deletion, and access placeholders

- Retention periods: **TBD by team and university** for accounts, task records, agreements, reports, ratings, evidence, and audit records.
- Conversation retention: **TBD by team and university**. `config/taskmate.php` `messages.retention_days` currently defaults to `null`; there is no automatic deletion or conversation purge command.
- Deletion/anonymization procedure: **TBD by team and university**. No user-facing account deletion workflow is approved. Demo purge commands are for local synthetic data only.
- Evidence storage: private local `evidence` disk; production storage and backup protections **TBD**.
- Raw identity access: owner and administrators through account settings and the administrator user detail page only. Admin access must be audited.
- Consent text: **[INSERT UNIVERSITY-APPROVED CONSENT TEXT]**.
- Designated office, contact, access reviews, incident response, and evidence disposal: **TBD by team and university**.

## Before any real personal data is used

- [ ] University approval of purpose, data inventory, consent, and lawful basis.
- [ ] Decide and document retention, deletion, anonymization, backups, and evidence disposal.
- [ ] Confirm production access controls, encryption, key management, logging, and incident response.
- [ ] Confirm institutional email domains and minimum identity data needed.
- [ ] Review all public and admin Inertia props and authorization tests.
- [ ] Replace all synthetic accounts and sample records; do not reuse demo credentials.
- [ ] Approve the privacy notice and contact / escalation details.
