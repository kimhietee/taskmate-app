<?php

namespace Tests\Feature;

use App\Enums\AgreementStatus;
use App\Enums\TaskStatus;
use App\Models\Agreement;
use App\Models\Application;
use App\Models\AgreementVersion;
use App\Models\Rating;
use App\Models\TaskScreening;
use App\Models\Task;
use App\Models\TaskCompletion;
use App\Models\User;
use App\Models\UserSanction;
use Database\Seeders\DemoScenarioSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemoScenarioSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_local_demo_scenario_seeder_creates_synthetic_workflow_states(): void
    {
        $this->app['env'] = 'local';
        $this->seed(DemoScenarioSeeder::class);
        $this->assertSame(0, User::where('email', 'not like', '%@example.test')->count());
        foreach ([TaskStatus::PendingReview, TaskStatus::ChangesRequested, TaskStatus::Approved, TaskStatus::Rejected, TaskStatus::Assigned, TaskStatus::InProgress, TaskStatus::Completed, TaskStatus::Removed, TaskStatus::Cancelled] as $status) {
            $this->assertTrue(Task::where('status', $status->value)->exists(), "Missing synthetic task state {$status->value}.");
        }
        $this->assertTrue(Agreement::where('status', AgreementStatus::Negotiating->value)->exists());
        $this->assertTrue(Agreement::where('status', AgreementStatus::Agreed->value)->exists());
        $this->assertTrue(Task::where('title', 'Synthetic scenario: New manual review')->exists());
        $this->assertTrue(Task::where('title', 'Synthetic scenario: Please message me on Telegram')->exists());
    }

    public function test_local_demo_commands_require_force_and_reset_seeded_scenarios(): void
    {
        $this->app['env'] = 'local';
        $this->artisan('taskmate:demo-seed')->assertFailed();
        $this->artisan('taskmate:demo-seed', ['--force' => true])->assertSuccessful();
        $this->assertTrue(User::where('email', 'admin@example.test')->exists());
        $this->artisan('taskmate:reset-demo')->assertFailed();
        $this->artisan('taskmate:reset-demo', ['--force' => true])->assertSuccessful();
        $this->assertTrue(User::where('email', 'admin@example.test')->exists());
        $this->artisan('taskmate:purge-demo-data')->assertFailed();
        $this->artisan('taskmate:purge-demo-data', ['--force' => true])->assertSuccessful();
        $this->assertFalse(User::where('email', 'like', '%@example.test')->exists());
    }

    public function test_demo_seeder_can_run_twice_without_duplicate_synthetic_records(): void
    {
        $this->app['env'] = 'local';
        $this->seed(DemoScenarioSeeder::class);
        $before = $this->syntheticCounts();

        $this->seed(DemoScenarioSeeder::class);

        $this->assertSame($before, $this->syntheticCounts());
        $this->assertSame(1, TaskCompletion::query()->whereHas('agreement.task', fn ($query) => $query->where('title', 'Synthetic scenario: Payment unpaid'))->count());
    }

    public function test_seeding_and_purge_leave_unrelated_manual_records_untouched(): void
    {
        $this->app['env'] = 'local';
        $manualPoster = User::factory()->verified()->facultyStaff()->create(['email' => 'manual.poster@cmu.edu.ph']);
        $manualWorker = User::factory()->verified()->create(['email' => 'manual.worker@cmu.edu.ph']);
        $manualTask = Task::factory()->approved()->for($manualPoster, 'poster')->create([
            'title' => 'Manual task created during testing', 'work_mode' => 'remote',
            'workplace_name' => null, 'workplace_address' => null, 'workplace_setting' => null,
        ]);
        $manualApplication = Application::factory()->accepted()->for($manualTask)->for($manualWorker, 'applicant')->create();
        $manualAgreement = Agreement::factory()->for($manualTask)->for($manualApplication)->for($manualPoster, 'poster')->for($manualWorker, 'student')->create([
            'status' => AgreementStatus::Agreed, 'locked_at' => now(),
        ]);
        $completion = $manualAgreement->completion()->firstOrNew();
        $completion->completed_at = now();
        $completion->completed_by = $manualPoster->id;
        $completion->completion_note = 'Manual completion that must remain intact.';
        $completion->save();

        $this->seed(DemoScenarioSeeder::class);
        $this->seed(DemoScenarioSeeder::class);
        $this->assertDatabaseHas('users', ['id' => $manualPoster->id, 'email' => 'manual.poster@cmu.edu.ph']);
        $this->assertDatabaseHas('tasks', ['id' => $manualTask->id, 'title' => 'Manual task created during testing']);
        $this->assertDatabaseHas('agreements', ['id' => $manualAgreement->id, 'task_id' => $manualTask->id]);
        $this->assertDatabaseHas('task_completions', ['agreement_id' => $manualAgreement->id, 'completion_note' => 'Manual completion that must remain intact.']);

        $this->artisan('taskmate:purge-demo-data', ['--force' => true])->assertSuccessful();
        $this->assertDatabaseHas('users', ['id' => $manualPoster->id, 'email' => 'manual.poster@cmu.edu.ph']);
        $this->assertDatabaseHas('tasks', ['id' => $manualTask->id, 'title' => 'Manual task created during testing']);
        $this->assertDatabaseHas('agreements', ['id' => $manualAgreement->id, 'task_id' => $manualTask->id]);
        $this->assertDatabaseHas('task_completions', ['agreement_id' => $manualAgreement->id, 'completion_note' => 'Manual completion that must remain intact.']);
        $this->assertDatabaseMissing('users', ['email' => 'admin@example.test']);
        $this->assertDatabaseCount('conversations', 0);
        $this->assertDatabaseCount('conversation_messages', 0);
        $this->assertDatabaseCount('conversation_events', 0);

        $this->artisan('taskmate:reset-demo', ['--force' => true])->assertSuccessful();
        $this->assertDatabaseHas('users', ['id' => $manualPoster->id, 'email' => 'manual.poster@cmu.edu.ph']);
        $this->assertDatabaseHas('tasks', ['id' => $manualTask->id, 'title' => 'Manual task created during testing']);
        $this->assertDatabaseHas('task_completions', ['agreement_id' => $manualAgreement->id]);
    }

    /** @return array<string, int> */
    private function syntheticCounts(): array
    {
        $demoTitles = \Database\Seeders\LocalTaskMateSeeder::demoTaskTitles();

        return [
            'users' => User::query()->where('email', 'like', '%@example.test')->count(),
            'tasks' => Task::query()->whereIn('title', $demoTitles)->orWhere('title', 'like', 'Synthetic scenario: %')->count(),
            'applications' => Application::query()->whereHas('task', fn ($query) => $query->whereIn('title', $demoTitles)->orWhere('title', 'like', 'Synthetic scenario: %'))->count(),
            'agreements' => Agreement::query()->whereHas('task', fn ($query) => $query->where('title', 'like', 'Synthetic scenario: %'))->count(),
            'agreement_versions' => AgreementVersion::query()->whereHas('agreement.task', fn ($query) => $query->where('title', 'like', 'Synthetic scenario: %'))->count(),
            'completions' => TaskCompletion::query()->whereHas('agreement.task', fn ($query) => $query->where('title', 'like', 'Synthetic scenario: %'))->count(),
            'payment_events' => \App\Models\PaymentEvent::query()->whereHas('agreement.task', fn ($query) => $query->where('title', 'like', 'Synthetic scenario: %'))->count(),
            'ratings' => Rating::query()->whereHas('agreement.task', fn ($query) => $query->where('title', 'like', 'Synthetic scenario: %'))->count(),
            'screenings' => TaskScreening::query()->whereHas('task', fn ($query) => $query->where('title', 'like', 'Synthetic scenario: %'))->count(),
            'reports' => \App\Models\Report::query()->where('description', 'like', 'Synthetic % report scenario.')->count(),
            'sanctions' => UserSanction::query()->where('reason', 'like', 'Synthetic % scenario.')->count(),
        ];
    }
}
