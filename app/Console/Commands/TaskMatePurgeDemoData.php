<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class TaskMatePurgeDemoData extends Command
{
    protected $signature = 'taskmate:purge-demo-data {--force : Confirm removal of synthetic @example.test demo accounts}';
    protected $description = 'Remove seeded synthetic TaskMate accounts and their related records';

    public function handle(): int
    {
        if (! app()->environment('local')) { $this->error('Demo data can only be purged in the local environment.'); return self::FAILURE; }
        if (! $this->option('force')) { $this->error('Pass --force to purge synthetic demo data.'); return self::FAILURE; }
        $syntheticEmails = [
            'admin@example.test', 'student1@example.test', 'student2@example.test', 'student.pending@example.test',
            'faculty@example.test', 'organization@example.test', 'organization.pending@example.test', 'student.rejected@example.test',
        ];
        $userIds = DB::table('users')->whereIn('email', $syntheticEmails)->pluck('id')->all();
        if ($userIds === []) { $this->info('No synthetic demo accounts were found.'); return self::SUCCESS; }

        // Titles from the previous demo seeder are included for a safe one-time cleanup on existing local databases.
        $legacyScenarioTitles = [
            'Scenario: Pending review', 'Scenario: Changes requested', 'Scenario: Approved', 'Scenario: Rejected',
            'Scenario: System-blocked', 'Scenario: Assigned', 'Scenario: In progress', 'Scenario: Completed',
            'Scenario: Removed', 'Scenario: Cancelled', 'Scenario: High-risk escalated',
            'Scenario: Please message me on Telegram', 'Scenario: Payment unpaid', 'Scenario: Payment marked-paid',
            'Scenario: Payment received', 'Scenario: Payment not-received',
        ];
        $demoTitles = \Database\Seeders\LocalTaskMateSeeder::demoTaskTitles();
        $taskIds = Schema::hasTable('tasks') ? DB::table('tasks')->whereIn('poster_id', $userIds)
            ->where(fn ($query) => $query
                ->where('title', 'like', 'Synthetic approved demo task %')
                ->orWhere('title', 'like', 'Synthetic scenario: %')
                ->orWhereIn('title', $legacyScenarioTitles)
                ->orWhereIn('title', $demoTitles))
            ->where(fn ($query) => $query
                ->where('description', 'like', 'Synthetic demonstration task for local testing only.%')
                ->orWhere('description', 'like', '%'.\Database\Seeders\LocalTaskMateSeeder::DEMO_DESCRIPTION_MARKER.'%')
                ->orWhere('description', 'Synthetic scenario record for local testing only.')
                ->orWhere('description', 'Synthetic payment-status scenario.'))
            ->pluck('id')->all() : [];
        $applicationIds = Schema::hasTable('applications') ? DB::table('applications')->whereIn('task_id', $taskIds)
            ->pluck('id')->all() : [];
        $agreementIds = Schema::hasTable('agreements') ? DB::table('agreements')->whereIn('application_id', $applicationIds)->pluck('id')->all() : [];
        $conversationIds = Schema::hasTable('conversations') ? DB::table('conversations')->whereIn('application_id', $applicationIds)->pluck('id')->all() : [];
        $messageIds = Schema::hasTable('conversation_messages') ? DB::table('conversation_messages')->whereIn('conversation_id', $conversationIds)->pluck('id')->all() : [];
        $reportIds = Schema::hasTable('reports') ? DB::table('reports')->where('description', 'like', 'Synthetic % report scenario.')
            ->orWhereIn('agreement_id', $agreementIds)->pluck('id')->all() : [];
        $ratingIds = Schema::hasTable('ratings') ? DB::table('ratings')->whereIn('agreement_id', $agreementIds)->pluck('id')->all() : [];
        $hasFlagSubjects = $taskIds !== [] || $applicationIds !== [] || $messageIds !== [];
        $flagIds = Schema::hasTable('content_flags') && $hasFlagSubjects ? DB::table('content_flags')->where(function ($query) use ($taskIds, $applicationIds, $messageIds): void {
            if ($taskIds !== []) $query->orWhere(fn ($related) => $related->where('flaggable_type', 'App\\Models\\Task')->whereIn('flaggable_id', $taskIds));
            if ($applicationIds !== []) $query->orWhere(fn ($related) => $related->where('flaggable_type', 'App\\Models\\Application')->whereIn('flaggable_id', $applicationIds));
            if ($messageIds !== []) $query->orWhere(fn ($related) => $related->where('flaggable_type', 'App\\Models\\ConversationMessage')->whereIn('flaggable_id', $messageIds));
        })->pluck('id')->all() : [];

        DB::transaction(function () use ($userIds, $taskIds, $applicationIds, $agreementIds, $conversationIds, $messageIds, $reportIds, $ratingIds, $flagIds): void {
            foreach (DB::table('report_evidence')->whereIn('report_id', $reportIds)->pluck('stored_path') as $path) {
                \Illuminate\Support\Facades\Storage::disk('evidence')->delete($path);
            }
            $this->delete('rating_scores', 'rating_id', $ratingIds);
            $this->delete('ratings', 'id', $ratingIds);
            // Conversations point directly to tasks with a restrictive foreign key.
            // Remove only the conversation records belonging to the synthetic applications
            // before deleting those tasks; report snapshots may also hold message references.
            if (Schema::hasTable('report_message_snapshots') && ($reportIds !== [] || $messageIds !== [])) {
                DB::table('report_message_snapshots')->where(function ($query) use ($reportIds, $messageIds): void {
                    if ($reportIds !== []) $query->orWhereIn('report_id', $reportIds);
                    if ($messageIds !== []) $query->orWhereIn('message_id', $messageIds);
                })->delete();
            }
            $this->delete('conversation_events', 'conversation_id', $conversationIds);
            $this->delete('conversation_reads', 'conversation_id', $conversationIds);
            $this->delete('conversation_messages', 'id', $messageIds);
            $this->delete('conversations', 'id', $conversationIds);
            $this->delete('agreement_confirmations', 'agreement_version_id', $this->ids('agreement_versions', 'agreement_id', $agreementIds));
            $this->delete('agreement_messages', 'agreement_id', $agreementIds);
            $this->delete('agreement_versions', 'agreement_id', $agreementIds);
            $this->delete('payment_events', 'agreement_id', $agreementIds);
            $this->delete('task_completions', 'agreement_id', $agreementIds);
            $this->delete('report_evidence', 'report_id', $reportIds);
            $this->delete('report_statements', 'report_id', $reportIds);
            if (Schema::hasTable('user_sanctions')) DB::table('user_sanctions')->whereIn('user_id', $userIds)
                ->where('reason', 'like', 'Synthetic % scenario.')->delete();
            $this->delete('content_flags', 'id', $flagIds);
            $this->delete('task_screenings', 'task_id', $taskIds);
            if (Schema::hasTable('admin_actions')) {
                foreach ([
                    'App\\Models\\Task' => $taskIds, 'App\\Models\\Report' => $reportIds,
                    'App\\Models\\Rating' => $ratingIds, 'App\\Models\\ContentFlag' => $flagIds,
                    'App\\Models\\Application' => $applicationIds, 'App\\Models\\Agreement' => $agreementIds,
                ] as $subjectType => $subjectIds) {
                    if ($subjectIds !== []) DB::table('admin_actions')->where('subject_type', $subjectType)->whereIn('subject_id', $subjectIds)->delete();
                }
            }
            if (Schema::hasTable('notifications')) {
                DB::table('notifications')->where('notifiable_type', 'App\\Models\\User')->whereIn('notifiable_id', $userIds)->delete();
                if ($taskIds !== []) {
                    $taskNotificationIds = [];
                    foreach (DB::table('notifications')->select(['id', 'data'])->cursor() as $row) {
                        $decoded = json_decode((string) $row->data, true);
                        $relatedTaskId = is_array($decoded) ? (int) ($decoded['related_ids']['task_id'] ?? 0) : 0;
                        if ($relatedTaskId > 0 && in_array($relatedTaskId, $taskIds, true)) {
                            $taskNotificationIds[] = $row->id;
                        }
                    }
                    if ($taskNotificationIds !== []) {
                        DB::table('notifications')->whereIn('id', $taskNotificationIds)->delete();
                    }
                }
            }
            $this->delete('reports', 'id', $reportIds);
            $this->delete('agreements', 'id', $agreementIds);
            $this->delete('applications', 'id', $applicationIds);
            $this->delete('tasks', 'id', $taskIds);
            $teamIds = Schema::hasTable('team_members') ? DB::table('team_members')->whereIn('user_id', $userIds)->where('role', 'owner')->pluck('team_id')->all() : [];
            $this->delete('team_invitations', 'invited_by', $userIds);
            $this->delete('team_invitations', 'team_id', $teamIds);
            $this->delete('team_members', 'user_id', $userIds);
            $this->delete('team_members', 'team_id', $teamIds);
            DB::table('users')->whereIn('id', $userIds)->update(['current_team_id' => null]);
            $this->delete('teams', 'id', $teamIds);
            $this->delete('passkeys', 'user_id', $userIds);
            $this->delete('sessions', 'user_id', $userIds);
            $this->delete('users', 'id', $userIds);
        });

        $this->info('Synthetic @example.test accounts and related TaskMate records were removed.');
        return self::SUCCESS;
    }

    private function ids(string $table, string $column, array $values, ?\Closure $extra = null): array
    {
        if (! Schema::hasTable($table)) return [];
        return DB::table($table)->where(function ($query) use ($column, $values, $extra): void {
            $query->whereIn($column, $values);
            if ($extra) $extra($query);
        })->pluck('id')->all();
    }

    private function delete(string $table, string $column, array $values): void
    {
        if ($values !== [] && Schema::hasTable($table)) DB::table($table)->whereIn($column, $values)->delete();
    }
}
