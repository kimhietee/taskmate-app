<?php

namespace Tests\Feature;

use App\Enums\UserType;
use App\Enums\VerificationStatus;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudentClassScheduleTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, string> */
    private function inertiaHeaders(): array
    {
        return [
            'X-Requested-With' => 'XMLHttpRequest',
            'X-Inertia' => 'true',
            'X-Inertia-Version' => (string) (app(HandleInertiaRequests::class)->version(request()) ?? ''),
        ];
    }

    public function test_only_student_accounts_can_view_settings_schedule_page_and_only_verified_students_can_save(): void
    {
        $this->get(route('class-schedule.edit'))->assertRedirect(route('login'));

        $verifiedStudent = User::factory()->verified()->create([
            'user_type' => UserType::Student,
            'class_schedule' => [
                ['day' => 'mon', 'start_time' => '08:00', 'end_time' => '10:00', 'label' => 'IT57'],
            ],
        ]);
        $unverifiedStudent = User::factory()->unverifiedStudent()->create();
        $faculty = User::factory()->facultyStaff()->verified()->create();
        $organization = User::factory()->organization()->verified()->create();
        $admin = User::factory()->verified()->create();
        $admin->forceFill(['is_admin' => true])->save();

        $this->actingAs($verifiedStudent)
            ->get(route('class-schedule.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('settings/schedule')
                ->where('canSaveSchedule', true)
                ->has('studentClassSchedule', 1)
                ->where('studentClassSchedule.0.label', 'IT57'));

        $this->actingAs($unverifiedStudent)
            ->get(route('class-schedule.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('settings/schedule')
                ->where('canSaveSchedule', false));

        foreach ([$faculty, $organization, $admin] as $nonStudent) {
            $this->actingAs($nonStudent)->get(route('class-schedule.edit'))->assertForbidden();
            $this->actingAs($nonStudent)->put(route('class-schedule.update'), ['blocks' => []])->assertForbidden();
        }
    }

    public function test_saving_updating_and_clearing_schedule_works_from_settings_and_browse_without_referer(): void
    {
        $student = User::factory()->verified()->create(['user_type' => UserType::Student]);
        $poster = User::factory()->facultyStaff()->verified()->create();
        $task = Task::factory()->approved()->for($poster, 'poster')->create([
            'work_mode' => 'remote',
            'workplace_name' => null,
            'workplace_address' => null,
            'workplace_setting' => null,
        ]);

        // Visit Settings schedule as an Inertia navigation without a Referer header
        $this->actingAs($student)
            ->withHeaders($this->inertiaHeaders())
            ->get(route('class-schedule.edit'))
            ->assertOk();

        $this->actingAs($student)
            ->withHeaders($this->inertiaHeaders())
            ->put(route('class-schedule.update'), [
                'blocks' => [
                    ['day' => 'fri', 'start_time' => '14:10:00', 'end_time' => '16:15:00', 'label' => 'Legacy Slot'],
                    ['day' => 'mon', 'start_time' => '08:00', 'end_time' => '11:00', 'label' => 'Morning Lab'],
                ],
            ])
            ->assertRedirect(route('class-schedule.edit'))
            ->assertSessionHas('status', 'Your class schedule was saved.');

        $saved = $student->fresh()->class_schedule;
        $this->assertCount(2, $saved);
        $this->assertSame('mon', $saved[0]['day']);
        $this->assertSame('08:00', $saved[0]['start_time']);
        $this->assertSame('fri', $saved[1]['day']);
        $this->assertSame('14:10', $saved[1]['start_time']);
        $this->assertSame('16:15', $saved[1]['end_time']);

        // Visit Browse task page as an Inertia navigation, then clear schedule without a Referer header
        $this->actingAs($student)
            ->withHeaders($this->inertiaHeaders())
            ->get(route('browse.show', $task))
            ->assertOk()
            ->assertJsonPath('component', 'browse/show')
            ->assertJsonCount(2, 'props.studentClassSchedule');

        $this->actingAs($student)
            ->withHeaders($this->inertiaHeaders())
            ->put(route('class-schedule.update'), ['blocks' => []])
            ->assertRedirect(route('browse.show', $task))
            ->assertSessionHas('status', 'Your class schedule was saved.');

        $this->assertSame([], $student->fresh()->class_schedule);
    }

    public function test_unauthenticated_or_unverified_student_schedule_mutations_stay_blocked(): void
    {
        $unverified = User::factory()->create([
            'user_type' => UserType::Student,
            'verification_status' => VerificationStatus::Pending,
        ]);

        $this->actingAs($unverified)
            ->put(route('class-schedule.update'), [
                'blocks' => [
                    ['day' => 'mon', 'start_time' => '08:00', 'end_time' => '09:00', 'label' => 'Blocked'],
                ],
            ])
            ->assertRedirect();

        $this->assertNull($unverified->fresh()->class_schedule);
    }
}
