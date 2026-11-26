<?php

namespace Database\Seeders;

use App\Enums\TaskStatus;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class BetaSampleDataSeeder extends Seeder
{
    public const BETA_DESCRIPTION_MARKER = '(Sample listing for prototype testing.)';

    public const DEFAULT_PASSWORD = 'TaskMateBeta#2026';

    public function run(): void
    {
        $seedPassword = (string) (env('TASKMATE_BETA_SEED_PASSWORD') ?: self::DEFAULT_PASSWORD);
        $now = now();

        $accounts = [
            [
                'email' => 'carl@gmail.com',
                'first_name' => 'Carl',
                'last_name' => 'Mendoza',
                'name' => 'Carl Mendoza',
                'user_type' => 'faculty_staff',
                'affiliation' => 'College of Information Sciences and Computing',
                'id_number' => 'FAKE-EMP-CARL-001',
                'organization_name' => null,
                'position' => null,
                'supporting_info' => null,
            ],
            [
                'email' => 'karl@gmail.com',
                'first_name' => 'Karl',
                'last_name' => 'Reyes',
                'name' => 'Karl Reyes',
                'user_type' => 'student',
                'affiliation' => 'College of Information Sciences and Computing — BSIT',
                'id_number' => 'FAKE-STU-KARL-001',
                'organization_name' => null,
                'position' => null,
                'supporting_info' => null,
            ],
            [
                'email' => 'kharl@gmail.com',
                'first_name' => 'Kharl',
                'last_name' => 'Villanueva',
                'name' => 'Kharl Villanueva',
                'user_type' => 'organization',
                'affiliation' => null,
                'id_number' => null,
                'organization_name' => 'Musuan Campus Partner Hub (Demo)',
                'position' => 'Operations Coordinator',
                'supporting_info' => 'Synthetic campus-partner organization created for beta prototype testing.',
            ],
        ];

        foreach ($accounts as $account) {
            $user = User::query()->firstOrNew(['email' => $account['email']]);
            $user->first_name = $account['first_name'];
            $user->last_name = $account['last_name'];
            $user->name = $account['name'];
            $user->user_type = $account['user_type'];
            $user->affiliation = $account['affiliation'];
            $user->id_number = $account['id_number'];
            $user->organization_name = $account['organization_name'];
            $user->position = $account['position'];
            $user->supporting_info = $account['supporting_info'];

            if (! $user->exists) {
                $user->password = Hash::make($seedPassword);
                $user->is_admin = false;
            }

            $user->email_verified_at ??= $now;
            $user->verification_status = 'verified';
            $user->verified_at ??= $now;

            if ($account['email'] === 'karl@gmail.com') {
                $candidateInstitutionalEmail = 'karl.reyes@cmu.edu.ph';
                if (blank($user->institutional_email)) {
                    $takenByOther = User::query()
                        ->when($user->exists, fn ($query) => $query->where('id', '!=', $user->id))
                        ->where('institutional_email', $candidateInstitutionalEmail)
                        ->exists();

                    if (! $takenByOther) {
                        $user->institutional_email = $candidateInstitutionalEmail;
                        $user->institutional_email_verified_at ??= $now;
                        $user->verification_method ??= 'institutional_email';
                    }
                }

                if (empty($user->class_schedule)) {
                    $user->class_schedule = [
                        ['day' => 'mon', 'start_time' => '08:00', 'end_time' => '12:00', 'label' => 'IT57 / Morning Classes'],
                        ['day' => 'wed', 'start_time' => '08:00', 'end_time' => '12:00', 'label' => 'IT57 / Morning Classes'],
                        ['day' => 'fri', 'start_time' => '08:00', 'end_time' => '12:00', 'label' => 'IT57 / Morning Classes'],
                        ['day' => 'tue', 'start_time' => '13:00', 'end_time' => '16:00', 'label' => 'Afternoon Lab'],
                        ['day' => 'thu', 'start_time' => '13:00', 'end_time' => '16:00', 'label' => 'Afternoon Lab'],
                    ];
                }
            }

            $user->save();
        }

        $adminId = User::query()->where('is_admin', true)->value('id');
        $instructor = User::query()->where('email', 'carl@gmail.com')->firstOrFail();
        $organization = User::query()->where('email', 'kharl@gmail.com')->firstOrFail();

        foreach (LocalTaskMateSeeder::catalog() as $item) {
            $poster = $item['poster'] === 'organization' ? $organization : $instructor;
            $existing = $poster->tasks()->where('title', $item['title'])->first();

            if ($existing && ! str_contains((string) $existing->description, self::BETA_DESCRIPTION_MARKER)) {
                continue;
            }

            $task = $existing ?? $poster->tasks()->make(['title' => $item['title']]);
            $task->poster()->associate($poster);
            $task->title = $item['title'];
            $task->category = $item['category'];
            $task->description = str_replace(
                LocalTaskMateSeeder::DEMO_DESCRIPTION_MARKER,
                self::BETA_DESCRIPTION_MARKER,
                (string) $item['description'],
            );
            $task->required_activities = $item['required_activities'];
            $task->deliverables = $item['deliverables'];
            $task->estimated_duration_hours = $item['estimated_duration_hours'];
            $task->skill_requirements = $item['skill_requirements'];
            $task->complexity = $item['complexity'];
            $task->work_type = $item['work_type'];
            $task->budget = $item['budget'];
            $task->budget_to_be_discussed = $item['budget_to_be_discussed'];
            $task->pay_timing = $item['pay_timing'];
            $task->pay_timing_note = $item['pay_timing_note'];
            $task->schedule_days = $item['schedule_days'];
            $task->schedule_start_time = $item['schedule_start_time'];
            $task->schedule_end_time = $item['schedule_end_time'];
            $task->schedule_note = $item['schedule_note'];
            $task->schedule_to_be_discussed = $item['schedule_to_be_discussed'];
            $task->schedule_flexible = $item['schedule_flexible'];
            $task->can_hours_change = $item['can_hours_change'];
            $task->work_mode = $item['work_mode'];
            $task->workplace_name = $item['workplace_name'];
            $task->workplace_address = $item['workplace_address'];
            $task->physical_demand = $item['physical_demand'];
            $task->academic_involvement = $item['academic_involvement'];
            $task->hazard_exposure = false;
            $task->hazard_description = null;
            $task->private_meeting_required = false;
            $task->workplace_setting = $item['workplace_setting'];
            $task->deadline = null;
            $task->status = TaskStatus::Approved;
            $task->guidelines_confirmed_at = $now;
            $task->decision_source = 'admin';
            $task->risk_level = null;
            $task->risk_score = null;
            $task->screened_at = null;
            $task->reviewed_by = $adminId;
            $task->reviewed_at = $now;
            $task->review_note = null;
            $task->save();
        }
    }
}
