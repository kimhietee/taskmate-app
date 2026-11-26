<?php

namespace Tests\Feature;

use App\Enums\ApplicationStatus;
use App\Enums\TaskStatus;
use App\Enums\UserType;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Agreement;
use App\Models\Application;
use App\Models\Conversation;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeploymentProxyMutationTest extends TestCase
{
    use RefreshDatabase;

    private function proxyHeaders(): array
    {
        return [
            'X-Forwarded-Proto' => 'https',
            'X-Forwarded-Host' => 'taskmate-sq9u.onrender.com',
            'X-Forwarded-Port' => '443',
            'X-Requested-With' => 'XMLHttpRequest',
            'X-Inertia' => 'true',
            'X-Inertia-Version' => (string) (app(HandleInertiaRequests::class)->version(request()) ?? ''),
        ];
    }

    private function assertValidProxyRedirect(string $location, string $expectedPath): void
    {
        $parsed = parse_url($location);
        $this->assertSame('https', $parsed['scheme'] ?? null, "Expected https redirect scheme in {$location}");
        $this->assertSame($expectedPath, $parsed['path'] ?? null, "Unexpected redirect path in {$location}");
    }

    public function test_key_mutating_routes_redirect_cleanly_behind_https_reverse_proxy(): void
    {
        config(['app.url' => 'https://taskmate-sq9u.onrender.com']);

        $admin = User::factory()->verified()->create();
        $admin->forceFill(['is_admin' => true])->save();

        $poster = User::factory()->facultyStaff()->verified()->create([
            'affiliation' => 'College of Information Sciences and Computing',
        ]);
        $student = User::factory()->verified()->create([
            'user_type' => UserType::Student,
            'affiliation' => 'College of Information Sciences and Computing — BSIT',
        ]);

        // 1. Admin approves a pending task under proxied HTTPS
        $pendingTask = Task::factory()->for($poster, 'poster')->create([
            'status' => TaskStatus::PendingReview,
            'work_mode' => 'remote',
            'workplace_name' => null,
            'workplace_address' => null,
            'workplace_setting' => null,
        ]);

        $adminDecision = $this->actingAs($admin)
            ->withHeaders($this->proxyHeaders())
            ->from('https://taskmate-sq9u.onrender.com/admin/tasks/'.$pendingTask->id)
            ->post('https://taskmate-sq9u.onrender.com/admin/tasks/'.$pendingTask->id.'/decision', [
                'decision' => 'approve',
            ]);
        $adminDecision->assertRedirect();
        $this->assertValidProxyRedirect(
            (string) $adminDecision->headers->get('Location'),
            '/admin/tasks/'.$pendingTask->id,
        );
        $this->assertSame(TaskStatus::Approved, $pendingTask->fresh()->status);

        // 2. Student updates class schedule via Inertia navigation without Referer header
        $this->actingAs($student)
            ->withoutHeader('referer')
            ->withHeaders($this->proxyHeaders())
            ->get('https://taskmate-sq9u.onrender.com/browse/'.$pendingTask->id)
            ->assertOk();

        $scheduleUpdate = $this->actingAs($student)
            ->withHeaders($this->proxyHeaders())
            ->put('https://taskmate-sq9u.onrender.com/my-class-schedule', [
                'blocks' => [
                    ['day' => 'tue', 'start_time' => '09:00', 'end_time' => '10:30', 'label' => 'CS Core'],
                ],
            ]);
        $scheduleUpdate->assertStatus(303);
        $this->assertValidProxyRedirect(
            (string) $scheduleUpdate->headers->get('Location'),
            '/browse/'.$pendingTask->id,
        );

        // 3. Student applies to task behind HTTPS proxy
        $apply = $this->actingAs($student)
            ->withHeaders($this->proxyHeaders())
            ->post('https://taskmate-sq9u.onrender.com/browse/'.$pendingTask->id.'/apply', [
                'message' => 'I would like to work on this task.',
                'proposed_amount' => 500,
                'work_details_confirmed' => '1',
                'poster_identity_checked' => '1',
                'no_upfront_fee_checked' => '1',
                'known_person_or_reviews_checked' => '0',
            ]);
        $apply->assertRedirect();
        $this->assertValidProxyRedirect(
            (string) $apply->headers->get('Location'),
            '/browse/'.$pendingTask->id,
        );

        $application = Application::query()->where('task_id', $pendingTask->id)->firstOrFail();
        $conversation = Conversation::query()->where('application_id', $application->id)->firstOrFail();

        // 4. Sending messages without Referer header stays on /messages/{conversation} and notifies recipient
        $sendOne = $this->actingAs($student)
            ->withHeaders($this->proxyHeaders())
            ->post('https://taskmate-sq9u.onrender.com/messages/'.$conversation->id.'/send', [
                'body' => 'Hello, I can start this afternoon.',
            ]);
        $sendOne->assertRedirect();
        $this->assertValidProxyRedirect(
            (string) $sendOne->headers->get('Location'),
            '/messages/'.$conversation->id,
        );

        // Send a second unread message to exercise unread notification aggregation without Postgres TEXT JSON crash
        $sendTwo = $this->actingAs($student)
            ->withHeaders($this->proxyHeaders())
            ->post('https://taskmate-sq9u.onrender.com/messages/'.$conversation->id.'/send', [
                'body' => 'Following up with availability.',
            ]);
        $sendTwo->assertRedirect();
        $this->assertValidProxyRedirect(
            (string) $sendTwo->headers->get('Location'),
            '/messages/'.$conversation->id,
        );
        $messageAlerts = $poster->notifications()->get()->filter(fn ($n) => ($n->data['event'] ?? null) === 'conversation.message');
        $this->assertCount(1, $messageAlerts);
        $this->assertSame(2, $messageAlerts->first()->data['count']);
        $this->assertSame(3, $poster->notifications()->count());

        // 5. Poster accepts applicant under HTTPS proxy
        $this->actingAs($poster)
            ->withHeaders($this->proxyHeaders())
            ->get('https://taskmate-sq9u.onrender.com/tasks/'.$pendingTask->id)
            ->assertOk();

        $accept = $this->actingAs($poster)
            ->withHeaders($this->proxyHeaders())
            ->post('https://taskmate-sq9u.onrender.com/tasks/'.$pendingTask->id.'/applications/'.$application->id.'/accept');
        $accept->assertRedirect();
        $this->assertValidProxyRedirect(
            (string) $accept->headers->get('Location'),
            '/tasks/'.$pendingTask->id,
        );
        $this->assertSame(ApplicationStatus::Accepted, $application->fresh()->status);

        // 6. Poster creates initial agreement & student confirms behind HTTPS proxy
        $storeAgreement = $this->actingAs($poster)
            ->withHeaders($this->proxyHeaders())
            ->post('https://taskmate-sq9u.onrender.com/tasks/'.$pendingTask->id.'/agreement', [
                'deliverables' => 'Complete all requested edits.',
                'terms' => 'Deliver final draft on campus.',
                'final_amount' => 500,
                'start_date' => today()->addDay()->toDateString(),
                'due_date' => today()->addDays(4)->toDateString(),
                'work_mode' => 'remote',
                'payment_arrangement' => 'Paid via GCash upon completion.',
            ]);
        $storeAgreement->assertRedirect();
        $agreement = Agreement::query()->where('task_id', $pendingTask->id)->firstOrFail();
        $this->assertValidProxyRedirect(
            (string) $storeAgreement->headers->get('Location'),
            '/agreements/'.$agreement->id,
        );

        $this->actingAs($student)
            ->withHeaders($this->proxyHeaders())
            ->get('https://taskmate-sq9u.onrender.com/agreements/'.$agreement->id)
            ->assertOk();

        $confirm = $this->actingAs($student)
            ->withHeaders($this->proxyHeaders())
            ->post('https://taskmate-sq9u.onrender.com/agreements/'.$agreement->id.'/confirm', [
                'version_id' => $agreement->current_version_id,
            ]);
        $confirm->assertRedirect();
        $this->assertValidProxyRedirect(
            (string) $confirm->headers->get('Location'),
            '/agreements/'.$agreement->id,
        );

        // 7. Student visits & saves Profile Settings with pre-populated name/email under HTTPS proxy
        $this->actingAs($student)
            ->withHeaders($this->proxyHeaders())
            ->get('https://taskmate-sq9u.onrender.com/settings/profile')
            ->assertOk()
            ->assertJsonPath('component', 'settings/profile')
            ->assertJsonPath('props.accountDetails.name', $student->name)
            ->assertJsonPath('props.accountDetails.email', $student->email);

        $profileSave = $this->actingAs($student)
            ->withHeaders($this->proxyHeaders())
            ->patch('https://taskmate-sq9u.onrender.com/settings/profile', [
                'name' => 'Updated Student Name',
                'email' => $student->email,
                'affiliation' => 'College of Information Sciences and Computing — BSIT',
            ]);
        $profileSave->assertStatus(303);
        $this->assertValidProxyRedirect(
            (string) $profileSave->headers->get('Location'),
            '/settings/profile',
        );
    }
}
