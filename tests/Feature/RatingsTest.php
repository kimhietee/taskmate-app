<?php

namespace Tests\Feature;

use App\Enums\AgreementStatus;
use App\Enums\RatingDirection;
use App\Enums\TaskStatus;
use App\Models\Agreement;
use App\Models\AgreementVersion;
use App\Models\Rating;
use App\Models\Task;
use App\Models\TaskCompletion;
use App\Models\User;
use App\Services\RatingSummary;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Inertia\Testing\AssertableInertia as Assert;
use LogicException;
use Tests\TestCase;

class RatingsTest extends TestCase
{
    use RefreshDatabase;

    private function completedPair(array $options = []): array
    {
        $poster = User::factory()->verified()->facultyStaff()->create();
        $student = User::factory()->verified()->create();
        $outsider = User::factory()->verified()->create();
        $admin = User::factory()->verified()->create();
        $admin->is_admin = true;
        $admin->save();
        $task = Task::factory()->create(['poster_id' => $poster->id]);
        $task->status = $options['task_status'] ?? TaskStatus::Completed;
        $task->save();
        $agreement = new Agreement;
        $agreement->task_id = $task->id;
        $agreement->application_id = \App\Models\Application::factory()->accepted()->create(['task_id' => $task->id, 'applicant_id' => $student->id])->id;
        $agreement->poster_id = $poster->id;
        $agreement->student_id = $student->id;
        $agreement->status = AgreementStatus::Agreed;
        $agreement->locked_at = now()->subDays(2);
        $agreement->save();
        $version = new AgreementVersion;
        $version->agreement_id = $agreement->id;
        $version->version_number = 1;
        $version->proposed_by = $poster->id;
        $version->deliverables = 'Synthetic completed work';
        $version->terms = 'Synthetic terms';
        $version->final_amount = '1250.00';
        $version->due_date = today()->addDays(2);
        $version->work_mode = $task->work_mode;
        $version->workplace_name = $task->workplace_name;
        $version->workplace_address = $task->workplace_address;
        $version->payment_arrangement = 'Synthetic direct arrangement';
        $version->content_hash = str_repeat('a', 64);
        $version->created_at = now()->subDays(2);
        $version->save();
        $agreement->current_version_id = $version->id;
        $agreement->save();
        $completion = new TaskCompletion;
        $completion->agreement_id = $agreement->id;
        $completion->completed_at = $options['completed_at'] ?? now();
        $completion->completed_by = $poster->id;
        $completion->save();
        return compact('poster', 'student', 'outsider', 'admin', 'task', 'agreement', 'version');
    }

    private function payload(array $replace = []): array
    {
        return array_merge([
            'overall_experience' => 5,
            'comment' => 'Clear communication on this synthetic task.',
            'scores' => ['work_quality' => 5, 'reliability' => 4, 'communication' => 5, 'professionalism' => 4, 'timeliness' => 5],
        ], $replace);
    }

    public function test_only_completed_agreement_parties_may_rate_and_direction_is_derived(): void
    {
        $pair = $this->completedPair();
        $this->actingAs($pair['outsider'])->post(route('agreements.rate.store', $pair['agreement']), $this->payload())->assertForbidden();
        $this->actingAs($pair['admin'])->post(route('agreements.rate.store', $pair['agreement']), $this->payload())->assertForbidden();
        $this->assertTrue(Gate::forUser($pair['poster'])->allows('rate', $pair['agreement']), json_encode(['task' => $pair['task']->fresh()->status->value, 'agreement' => $pair['agreement']->fresh()->status->value, 'window' => app(\App\Services\RatingVisibility::class)->windowClosed($pair['agreement']), 'poster' => [$pair['poster']->id, $pair['agreement']->poster_id]]));
        $payload = $this->payload(['direction' => 'student_to_poster', 'ratee_id' => $pair['poster']->id, 'is_hidden' => true, 'hidden_by' => $pair['admin']->id]);
        $this->actingAs($pair['poster'])->post(route('agreements.rate.store', $pair['agreement']), $payload)->assertRedirect(route('agreements.show', $pair['agreement']));
        $rating = Rating::firstOrFail();
        $this->assertDatabaseCount('reports', 0);
        $this->assertSame(RatingDirection::PosterToStudent, $rating->direction);
        $this->assertSame($pair['student']->id, $rating->ratee_id);
        $this->assertFalse($rating->is_hidden);
        $this->actingAs($pair['poster'])->post(route('agreements.rate.store', $pair['agreement']), $this->payload())->assertForbidden();
    }

    public function test_rating_requires_completed_task_and_open_window(): void
    {
        $pair = $this->completedPair(['task_status' => TaskStatus::InProgress]);
        $this->actingAs($pair['poster'])->get(route('agreements.rate', $pair['agreement']))->assertForbidden();
        $pair = $this->completedPair(['completed_at' => now()->subDays(31)]);
        $this->actingAs($pair['student'])->get(route('agreements.rate', $pair['agreement']))->assertForbidden();
    }

    public function test_direction_specific_dimensions_are_required_and_unknown_dimensions_rejected(): void
    {
        $pair = $this->completedPair();
        $this->actingAs($pair['student'])->post(route('agreements.rate.store', $pair['agreement']), [
            'overall_experience' => 3,
            'scores' => ['job_description_accuracy' => 4, 'reliability' => 4, 'communication' => 4, 'professionalism' => 4, 'work_quality' => 5],
        ])->assertInvalid('scores');
        $this->actingAs($pair['student'])->post(route('agreements.rate.store', $pair['agreement']), [
            'overall_experience' => 3,
            'scores' => ['job_description_accuracy' => 4, 'reliability' => 4, 'communication' => 4, 'professionalism' => 4],
        ])->assertRedirect();
        $this->assertSame(RatingDirection::StudentToPoster, Rating::firstOrFail()->direction);
    }

    public function test_after_both_visibility_hides_ratee_rating_until_second_submission(): void
    {
        config(['taskmate.ratings.visibility' => 'after_both']);
        $pair = $this->completedPair();
        $this->actingAs($pair['poster'])->post(route('agreements.rate.store', $pair['agreement']), $this->payload());
        $this->actingAs($pair['student'])->get(route('agreements.show', $pair['agreement']))->assertInertia(fn (Assert $page) => $page
            ->where('ratings.own', null)
            ->where('ratings.other', null)
            ->where('ratings.waiting', true)
            ->missing('ratings.other.comment'));
        $this->assertSame(0, $pair['student']->notifications()->count());
        $studentPayload = ['overall_experience' => 4, 'scores' => ['job_description_accuracy' => 4, 'reliability' => 4, 'communication' => 4, 'professionalism' => 4]];
        $this->actingAs($pair['student'])->post(route('agreements.rate.store', $pair['agreement']), $studentPayload)->assertRedirect();
        $this->assertSame('rating.visible', $pair['poster']->notifications()->firstOrFail()->data['event']);
        $this->assertSame(0, $pair['student']->notifications()->count());
        $this->actingAs($pair['poster'])->get(route('agreements.show', $pair['agreement']))->assertInertia(fn (Assert $page) => $page->where('ratings.other.overall', 4));
    }

    public function test_window_expiry_releases_rating_and_summary_threshold_is_respected(): void
    {
        config(['taskmate.ratings.visibility' => 'after_both', 'taskmate.ratings.min_count_for_average' => 3]);
        $pair = $this->completedPair(['completed_at' => now()->subDays(31)]);
        $rating = new Rating;
        $rating->agreement_id = $pair['agreement']->id;
        $rating->task_id = $pair['task']->id;
        $rating->rater_id = $pair['poster']->id;
        $rating->ratee_id = $pair['student']->id;
        $rating->direction = RatingDirection::PosterToStudent;
        $rating->overall_experience = 4;
        $rating->save();
        foreach (array_keys(config('taskmate.ratings.dimensions.poster_to_student')) as $dimension) $rating->scores()->create(['dimension' => $dimension, 'score' => 4]);
        $summary = app(RatingSummary::class)->forUser($pair['student']);
        $this->assertSame(1, $summary['count']);
        $this->assertNull($summary['average']);
        $this->actingAs($pair['student'])->get(route('agreements.show', $pair['agreement']))->assertInertia(fn (Assert $page) => $page->where('ratings.other.overall', 4));
    }

    public function test_immediate_visibility_and_averages_exclude_hidden_ratings(): void
    {
        config(['taskmate.ratings.visibility' => 'immediate', 'taskmate.ratings.min_count_for_average' => 1]);
        $pair = $this->completedPair();
        $this->actingAs($pair['poster'])->post(route('agreements.rate.store', $pair['agreement']), $this->payload());
        $summary = app(RatingSummary::class)->forUser($pair['student']);
        $this->assertSame(5.0, $summary['average']);
        $this->assertArrayNotHasKey('dimensions', $summary);
        $this->assertDatabaseHas('rating_scores', ['rating_id' => $pair['agreement']->ratings()->firstOrFail()->id, 'dimension' => 'work_quality', 'score' => 5]);
        $pair['agreement']->ratings()->first()->forceFill([]);
        $rating = Rating::firstOrFail();
        $admin = $pair['admin'];
        $this->actingAs($admin)->post("/admin/ratings/{$rating->id}/moderate", ['action' => 'hide', 'reason' => 'Synthetic reason']);
        $this->assertSame(0, app(RatingSummary::class)->forUser($pair['student'])['count']);
        $this->actingAs($pair['poster'])->get(route('agreements.show', $pair['agreement']))->assertInertia(fn (Assert $page) => $page->where('ratings.own.overall', 5));
    }

    public function test_dashboard_prompts_with_remaining_rating_days(): void
    {
        $pair = $this->completedPair(['completed_at' => now()->subDays(2)]);
        $this->actingAs($pair['student'])->get(route('dashboard', ['current_team' => $pair['student']->currentTeam->slug]))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('ratingsWaiting', 1)
            ->where('ratingsWaiting.0.id', $pair['agreement']->id)
            ->where('ratingsWaiting.0.daysLeft', 28));
    }

    public function test_admin_rating_queue_filters_and_admin_parties_cannot_rate_or_moderate_their_own_rating(): void
    {
        $pair = $this->completedPair();
        $this->actingAs($pair['poster'])->post(route('agreements.rate.store', $pair['agreement']), $this->payload());
        $rating = Rating::firstOrFail();
        $this->actingAs($pair['admin'])->get('/admin/ratings?direction=poster_to_student&hidden=0&rating_min=5')->assertInertia(fn (Assert $page) => $page->has('ratings.data', 1));
        $this->actingAs($pair['student'])->post("/admin/ratings/{$rating->id}/moderate", ['action' => 'hide', 'reason' => 'No permission'])->assertForbidden();
        $pair2 = $this->completedPair();
        $pair2['poster']->is_admin = true;
        $pair2['poster']->save();
        $this->actingAs($pair2['poster'])->post(route('agreements.rate.store', $pair2['agreement']), $this->payload())->assertForbidden();
    }

    public function test_rating_and_scores_are_immutable_except_admin_moderation(): void
    {
        $pair = $this->completedPair();
        $this->actingAs($pair['poster'])->post(route('agreements.rate.store', $pair['agreement']), $this->payload());
        $rating = Rating::firstOrFail();
        $score = $rating->scores()->firstOrFail();
        try { $rating->comment = 'Changed'; $rating->save(); $this->fail('Rating content changed.'); } catch (LogicException) { $this->assertTrue(true); }
        try { $score->delete(); $this->fail('Rating score was deleted.'); } catch (LogicException) { $this->assertTrue(true); }
        $this->actingAs($pair['admin'])->post("/admin/ratings/{$rating->id}/moderate", ['action' => 'hide', 'reason' => 'Synthetic moderation reason'])->assertRedirect();
        $this->assertTrue($rating->fresh()->is_hidden);
        $this->assertDatabaseHas('admin_actions', ['subject_type' => Rating::class, 'subject_id' => $rating->id, 'action' => 'rating_hidden']);
        $this->actingAs($pair['student'])->get(route('users.show', $pair['student']))->assertInertia(fn (Assert $page) => $page->where('profile.ratingSummary.count', 0)->missing('ratings.0'));
        $this->actingAs($pair['admin'])->post("/admin/ratings/{$rating->id}/moderate", ['action' => 'restore'])->assertRedirect();
        $this->assertFalse($rating->fresh()->is_hidden);
    }

    public function test_profile_excludes_private_identity_and_report_data(): void
    {
        $pair = $this->completedPair();
        $unverified = User::factory()->create();
        $this->actingAs($unverified)->get(route('users.show', $pair['poster']))->assertForbidden();
        $viewer = User::factory()->verified()->create();
        $this->actingAs($viewer)->get(route('users.show', $pair['poster']))->assertInertia(fn (Assert $page) => $page
            ->has('profile')
            ->missing('profile.email')
            ->missing('profile.idNumber')
            ->missing('profile.supportingInfo')
            ->missing('profile.reportCount')
            ->has('profile.ratingSummary')
            ->missing('profile.ratingSummary.dimensions'));
    }

    public function test_rating_form_provides_direction_dimensions_and_relative_report_url(): void
    {
        $pair = $this->completedPair();
        $expectedReportUrl = route('agreements.show', $pair['agreement'], false);

        $this->actingAs($pair['poster'])->get(route('agreements.rate', $pair['agreement']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ratings/create')
                ->where('direction', 'poster_to_student')
                ->where('reportUrl', $expectedReportUrl)
                ->where('visibility', 'immediate')
                ->has('dimensions', count(config('taskmate.ratings.dimensions.poster_to_student'))));

        $this->actingAs($pair['student'])->get(route('agreements.rate', $pair['agreement']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ratings/create')
                ->where('direction', 'student_to_poster')
                ->where('reportUrl', $expectedReportUrl)
                ->where('visibility', 'immediate')
                ->has('dimensions', count(config('taskmate.ratings.dimensions.student_to_poster'))));
    }

    public function test_employer_and_student_ratings_reflect_immediately_across_profiles_dashboard_and_listings(): void
    {
        $pair = $this->completedPair();
        $student = $pair['student'];
        $poster = $pair['poster'];

        $secondPoster = User::factory()->verified()->facultyStaff()->create();
        $secondTask = Task::factory()->approved()->for($secondPoster, 'poster')->create([
            'work_mode' => 'remote',
            'workplace_name' => null,
            'workplace_address' => null,
            'workplace_setting' => null,
        ]);
        \App\Models\Application::factory()->for($secondTask)->for($student, 'applicant')->create();

        $openPosterTask = Task::factory()->approved()->for($poster, 'poster')->create([
            'work_mode' => 'remote',
            'workplace_name' => null,
            'workplace_address' => null,
            'workplace_setting' => null,
        ]);

        // Employer rates student on all 5 poster_to_student dimensions.
        $this->actingAs($poster)
            ->post(route('agreements.rate.store', $pair['agreement']), $this->payload([
                'overall_experience' => 5,
                'comment' => 'Great work delivered on time.',
            ]))
            ->assertRedirect(route('agreements.show', $pair['agreement']));

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $student->id,
        ]);
        $this->assertSame('rating.visible', $student->notifications()->firstOrFail()->data['event']);

        // Student's public profile, dashboard, agreement view, and applicant summary immediately reflect the rating.
        $this->actingAs($poster)->get(route('users.show', $student))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('profile.ratingSummary.count', 1)
            ->where('profile.ratingSummary.average', 5)
            ->where('ratings.0.overall', 5)
            ->where('ratings.0.comment', 'Great work delivered on time.'));

        $this->actingAs($student)->get(route('taskmate.dashboard'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('ratingSummary.count', 1)
            ->where('ratingSummary.average', 5)
            ->where('publicProfileUrl', route('users.show', $student, false)));

        $this->actingAs($secondPoster)->get(route('tasks.show', $secondTask))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('applicants.0.applicant.ratingSummary.count', 1)
            ->where('applicants.0.applicant.ratingSummary.average', 5));

        $this->actingAs($student)->get(route('agreements.show', $pair['agreement']))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('ratings.other.overall', 5)
            ->where('ratings.canRate', true));

        // Student rates employer on all 4 student_to_poster dimensions.
        $this->actingAs($student)->post(route('agreements.rate.store', $pair['agreement']), [
            'overall_experience' => 4,
            'comment' => 'Clear expectations throughout.',
            'scores' => [
                'job_description_accuracy' => 4,
                'reliability' => 4,
                'communication' => 5,
                'professionalism' => 4,
            ],
        ])->assertRedirect(route('agreements.show', $pair['agreement']));

        $this->actingAs($student)->get(route('users.show', $poster))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('profile.ratingSummary.count', 1)
            ->where('profile.ratingSummary.average', 4)
            ->where('ratings.0.overall', 4)
            ->where('ratings.0.comment', 'Clear expectations throughout.'));

        $otherStudent = User::factory()->verified()->create();
        $this->actingAs($otherStudent)->get(route('browse.show', $openPosterTask))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('poster.ratingSummary.count', 1)
            ->where('poster.ratingSummary.average', 4));
    }

    public function test_submitting_rating_without_dimension_scores_fails_validation(): void
    {
        $pair = $this->completedPair();

        $this->actingAs($pair['poster'])
            ->from(route('agreements.rate', $pair['agreement']))
            ->post(route('agreements.rate.store', $pair['agreement']), ['overall_experience' => 5])
            ->assertSessionHasErrors([
                'scores',
                'scores.work_quality',
                'scores.reliability',
                'scores.communication',
                'scores.professionalism',
                'scores.timeliness',
            ]);

        $this->actingAs($pair['student'])
            ->from(route('agreements.rate', $pair['agreement']))
            ->post(route('agreements.rate.store', $pair['agreement']), ['overall_experience' => 4])
            ->assertSessionHasErrors([
                'scores',
                'scores.job_description_accuracy',
                'scores.reliability',
                'scores.communication',
                'scores.professionalism',
            ]);
    }
}
