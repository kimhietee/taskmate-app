<?php

namespace Database\Seeders;

use App\Enums\ApplicationStatus;
use App\Enums\TaskStatus;
use App\Models\Task;
use App\Models\User;
use App\Services\ConversationWorkflow;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class LocalTaskMateSeeder extends Seeder
{
    public const DEMO_DESCRIPTION_MARKER = '(Sample demo listing for local testing only.)';

    /** @return array<int, string> */
    public static function demoTaskTitles(): array
    {
        return array_column(self::catalog(), 'title');
    }

    /** @return array<int, array<string, mixed>> */
    private static function catalog(): array
    {
        return [
            [
                'title' => 'Calculus 1 & General Physics Peer Tutor',
                'poster' => 'faculty',
                'category' => 'tutoring_and_academic_support',
                'work_type' => 'part_time',
                'description' => 'Guide first-year engineering students through practice problem sets in Differential Calculus and Mechanics during weekend review sessions. This is conceptual tutoring only and never involves completing graded work. '.self::DEMO_DESCRIPTION_MARKER,
                'required_activities' => 'Walk through 2–3 practice worksheets per session and answer concept questions.',
                'deliverables' => 'Weekly 3-hour review session plus a short summary of topics covered.',
                'estimated_duration_hours' => 3.0,
                'skill_requirements' => 'Strong foundation in Calculus 1 and Physics; clear explanation skills.',
                'complexity' => 'medium',
                'budget' => 600,
                'budget_to_be_discussed' => false,
                'pay_timing' => 'weekly',
                'pay_timing_note' => 'Paid in cash every Saturday after the session.',
                'schedule_days' => ['sat'],
                'schedule_start_time' => '09:00',
                'schedule_end_time' => '12:00',
                'schedule_note' => 'Weekend morning review block; can shift slightly if needed.',
                'schedule_to_be_discussed' => false,
                'schedule_flexible' => false,
                'can_hours_change' => true,
                'work_mode' => 'onsite',
                'workplace_name' => 'University Main Library Study Area (Sample)',
                'workplace_address' => 'Central Mindanao University Campus, Musuan',
                'workplace_setting' => 'on_campus',
                'physical_demand' => 'none',
                'academic_involvement' => 'supporting',
            ],
            [
                'title' => 'Event Poster & Social Media Graphics (Campus Fair)',
                'poster' => 'organization',
                'category' => 'design_and_creative',
                'work_type' => 'one_time_gig',
                'description' => 'Design a clean pubmat set for our upcoming student community fair, including one A3 printable poster and three square social media announcement cards using our provided event text and logo. '.self::DEMO_DESCRIPTION_MARKER,
                'required_activities' => 'Create initial layout drafts, apply up to two rounds of text/color revisions, and export print-ready files.',
                'deliverables' => '1 printable PDF/PNG poster (A3) and 3 square PNG graphics (1080x1080).',
                'estimated_duration_hours' => 5.0,
                'skill_requirements' => 'Canva, Figma, or Adobe Illustrator; clean typography.',
                'complexity' => 'medium',
                'budget' => 1200,
                'budget_to_be_discussed' => false,
                'pay_timing' => 'upon_completion',
                'pay_timing_note' => 'Paid via GCash or cash upon final file approval.',
                'schedule_days' => null,
                'schedule_start_time' => null,
                'schedule_end_time' => null,
                'schedule_note' => 'Work at your own pace before the agreed due date.',
                'schedule_to_be_discussed' => false,
                'schedule_flexible' => true,
                'can_hours_change' => true,
                'work_mode' => 'remote',
                'workplace_name' => null,
                'workplace_address' => null,
                'workplace_setting' => null,
                'physical_demand' => 'none',
                'academic_involvement' => 'none',
            ],
            [
                'title' => 'Department Newsletter Proofreading & Layout Check',
                'poster' => 'faculty',
                'category' => 'writing_and_editing',
                'work_type' => 'one_time_gig',
                'description' => 'Proofread a 6-page campus department newsletter draft for spelling, grammar, consistent headings, and photo caption accuracy before printing. '.self::DEMO_DESCRIPTION_MARKER,
                'required_activities' => 'Review draft document using tracked changes and flag missing captions or formatting inconsistencies.',
                'deliverables' => 'Edited Google Doc/Word file with clean copy and short checklist of corrections.',
                'estimated_duration_hours' => 4.0,
                'skill_requirements' => 'Attention to detail and strong English proofreading skills.',
                'complexity' => 'low',
                'budget' => 850,
                'budget_to_be_discussed' => false,
                'pay_timing' => 'upon_completion',
                'pay_timing_note' => 'Paid via GCash or cash once edited copy is submitted.',
                'schedule_days' => null,
                'schedule_start_time' => null,
                'schedule_end_time' => null,
                'schedule_note' => 'Flexible remote schedule within 4 days of agreement.',
                'schedule_to_be_discussed' => false,
                'schedule_flexible' => true,
                'can_hours_change' => true,
                'work_mode' => 'remote',
                'workplace_name' => null,
                'workplace_address' => null,
                'workplace_setting' => null,
                'physical_demand' => 'none',
                'academic_involvement' => 'none',
            ],
            [
                'title' => 'Department Lab Equipment Spreadsheet Encoding',
                'poster' => 'faculty',
                'category' => 'data_entry_and_clerical',
                'work_type' => 'part_time',
                'description' => 'Encode handwritten lab equipment check-in logs into an organized Excel/Google Sheets inventory tracker and verify serial numbers against the office ledger. '.self::DEMO_DESCRIPTION_MARKER,
                'required_activities' => 'Type item codes, dates, and conditions into the shared spreadsheet and flag damaged items.',
                'deliverables' => 'Updated, error-checked inventory workbook submitted each week.',
                'estimated_duration_hours' => 7.5,
                'skill_requirements' => 'Accurate typing and basic Microsoft Excel or Google Sheets skills.',
                'complexity' => 'low',
                'budget' => 1500,
                'budget_to_be_discussed' => false,
                'pay_timing' => 'bi_weekly',
                'pay_timing_note' => 'Paid every other Friday (bi-weekly, not monthly).',
                'schedule_days' => ['mon', 'wed', 'fri'],
                'schedule_start_time' => '09:00',
                'schedule_end_time' => '11:30',
                'schedule_note' => 'Fixed weekday morning office hours for ledger access.',
                'schedule_to_be_discussed' => false,
                'schedule_flexible' => false,
                'can_hours_change' => false,
                'work_mode' => 'hybrid',
                'workplace_name' => 'CISC Admin Office Room 102 (Sample)',
                'workplace_address' => 'CISC Building, CMU Campus, Musuan',
                'workplace_setting' => 'on_campus',
                'physical_demand' => 'none',
                'academic_involvement' => 'none',
            ],
            [
                'title' => 'Campus Career Fair Registration & Usher Support',
                'poster' => 'organization',
                'category' => 'event_support',
                'work_type' => 'one_time_gig',
                'description' => 'Assist at the student registration desk during the one-day Campus Career Fair: check attendee names, hand out event brochures, and guide guests to booth areas. '.self::DEMO_DESCRIPTION_MARKER,
                'required_activities' => 'Manage check-in sheet, distribute name tags/flyers, and assist speakers with booth directions.',
                'deliverables' => 'Full shift attendance and completed visitor sign-in sheets.',
                'estimated_duration_hours' => 8.0,
                'skill_requirements' => 'Friendly communication, punctuality, and basic attendance tracking.',
                'complexity' => 'low',
                'budget' => 550,
                'budget_to_be_discussed' => false,
                'pay_timing' => 'daily',
                'pay_timing_note' => 'Paid in cash at the end of the event shift (lunch snack provided).',
                'schedule_days' => ['sat'],
                'schedule_start_time' => '07:30',
                'schedule_end_time' => '15:30',
                'schedule_note' => 'One-day Saturday event shift.',
                'schedule_to_be_discussed' => false,
                'schedule_flexible' => false,
                'can_hours_change' => false,
                'work_mode' => 'onsite',
                'workplace_name' => 'University Convention Center Lobby (Sample)',
                'workplace_address' => 'CMU Main Campus, Musuan, Maramag',
                'workplace_setting' => 'on_campus',
                'physical_demand' => 'light',
                'academic_involvement' => 'none',
            ],
            [
                'title' => 'Mobile Layout Fix for Student Organization Webpage',
                'poster' => 'organization',
                'category' => 'tech_and_web',
                'work_type' => 'one_time_gig',
                'description' => 'Fix responsive CSS spacing issues on our simple 3-page static HTML/Tailwind club webpage so announcements and officer cards display cleanly on phone screens. '.self::DEMO_DESCRIPTION_MARKER,
                'required_activities' => 'Inspect mobile breakpoints (360px–430px), fix overflowing tables/cards, and test in Chrome DevTools.',
                'deliverables' => 'Updated HTML/CSS files or pull request with before/after screenshots.',
                'estimated_duration_hours' => 4.0,
                'skill_requirements' => 'HTML, CSS, Tailwind CSS, and responsive web debugging.',
                'complexity' => 'medium',
                'budget' => null,
                'budget_to_be_discussed' => true,
                'pay_timing' => 'milestone',
                'pay_timing_note' => 'Exact fee to be agreed after reviewing the current HTML files.',
                'schedule_days' => null,
                'schedule_start_time' => null,
                'schedule_end_time' => null,
                'schedule_note' => 'Flexible remote work; complete within one week.',
                'schedule_to_be_discussed' => false,
                'schedule_flexible' => true,
                'can_hours_change' => true,
                'work_mode' => 'remote',
                'workplace_name' => null,
                'workplace_address' => null,
                'workplace_setting' => null,
                'physical_demand' => 'none',
                'academic_involvement' => 'none',
            ],
            [
                'title' => 'Campus Office Printout & Memo Routing Runner',
                'poster' => 'faculty',
                'category' => 'errands_and_delivery',
                'work_type' => 'part_time',
                'description' => 'Help route sealed inter-office memos and pick up printed handouts from the campus printing press to two college offices twice a week. All routes stay strictly inside main campus buildings. '.self::DEMO_DESCRIPTION_MARKER,
                'required_activities' => 'Pick up sealed envelopes and handouts, obtain receiving signatures in the logbook, and return logbook.',
                'deliverables' => 'Signed delivery logbook for all scheduled campus stops.',
                'estimated_duration_hours' => 4.0,
                'skill_requirements' => 'Familiarity with CMU campus buildings and reliable time management.',
                'complexity' => 'low',
                'budget' => 450,
                'budget_to_be_discussed' => false,
                'pay_timing' => 'weekly',
                'pay_timing_note' => 'Paid weekly in cash every Thursday afternoon.',
                'schedule_days' => ['tue', 'thu'],
                'schedule_start_time' => '14:00',
                'schedule_end_time' => '16:00',
                'schedule_note' => 'Shift can adjust to late afternoon if classes overlap.',
                'schedule_to_be_discussed' => false,
                'schedule_flexible' => false,
                'can_hours_change' => true,
                'work_mode' => 'onsite',
                'workplace_name' => 'Administration Building Ground Floor (Sample)',
                'workplace_address' => 'Central Mindanao University Main Campus',
                'workplace_setting' => 'on_campus',
                'physical_demand' => 'light',
                'academic_involvement' => 'none',
            ],
            [
                'title' => 'Online Shop Parcel Packing & Stock Sorting Helper',
                'poster' => 'organization',
                'category' => 'other',
                'work_type' => 'part_time',
                'description' => 'Assist our local spare-parts shop near campus with bubble-wrapping small orders, printing shipping waybills, and organizing shelf stock during busy weekend dispatch hours. '.self::DEMO_DESCRIPTION_MARKER,
                'required_activities' => 'Match packed items against order slips, apply waybills neatly, and group parcels by courier.',
                'deliverables' => 'Packed and labeled orders ready for courier pickup.',
                'estimated_duration_hours' => 6.0,
                'skill_requirements' => 'Careful item checking and neat packing; no prior experience required.',
                'complexity' => 'low',
                'budget' => null,
                'budget_to_be_discussed' => true,
                'pay_timing' => 'to_be_discussed',
                'pay_timing_note' => 'Rate and weekly payout day will be confirmed in the written agreement.',
                'schedule_days' => null,
                'schedule_start_time' => null,
                'schedule_end_time' => null,
                'schedule_note' => 'Hours to be arranged around student class availability.',
                'schedule_to_be_discussed' => true,
                'schedule_flexible' => false,
                'can_hours_change' => true,
                'work_mode' => 'onsite',
                'workplace_name' => 'Musuan Highway Spare Parts Shop (Sample)',
                'workplace_address' => 'Sayre Highway Commercial Strip, Musuan, Maramag',
                'workplace_setting' => 'off_campus_public',
                'physical_demand' => 'moderate',
                'academic_involvement' => 'none',
            ],
            [
                'title' => 'Intro to Programming (C++ / Java) Lab Study Coach',
                'poster' => 'faculty',
                'category' => 'tutoring_and_academic_support',
                'work_type' => 'one_time_gig',
                'description' => 'Co-facilitate a weekend beginner debugging clinic helping students understand loops, arrays, and basic functions using sample exercises prepared by the instructor. '.self::DEMO_DESCRIPTION_MARKER,
                'required_activities' => 'Help students read compiler error messages and walk through practice trace tables.',
                'deliverables' => '3-hour guided study clinic and brief attendance notes.',
                'estimated_duration_hours' => 3.0,
                'skill_requirements' => 'Comfortable with C++ or Java fundamentals and patient mentoring.',
                'complexity' => 'medium',
                'budget' => 700,
                'budget_to_be_discussed' => false,
                'pay_timing' => 'upon_completion',
                'pay_timing_note' => 'Paid via GCash or cash right after the clinic.',
                'schedule_days' => ['sun'],
                'schedule_start_time' => '13:00',
                'schedule_end_time' => '16:00',
                'schedule_note' => 'Sunday afternoon hybrid lab / online follow-up.',
                'schedule_to_be_discussed' => false,
                'schedule_flexible' => false,
                'can_hours_change' => true,
                'work_mode' => 'hybrid',
                'workplace_name' => 'CISC Computer Lab 2 (Sample)',
                'workplace_address' => 'CISC Building, CMU Campus, Musuan',
                'workplace_setting' => 'on_campus',
                'physical_demand' => 'none',
                'academic_involvement' => 'supporting',
            ],
            [
                'title' => 'Short Promo Video Reel Editor for Campus Coffee Stall',
                'poster' => 'organization',
                'category' => 'design_and_creative',
                'work_type' => 'one_time_gig',
                'description' => 'Edit two 30-second vertical promotional reels from raw phone clips we already filmed, adding clean captions, menu prices, and royalty-free background music. '.self::DEMO_DESCRIPTION_MARKER,
                'required_activities' => 'Trim clips, sync audio, add readable subtitle overlays, and apply one round of feedback.',
                'deliverables' => 'Two 1080x1920 MP4 reels ready for Facebook/TikTok posting.',
                'estimated_duration_hours' => 4.0,
                'skill_requirements' => 'CapCut, Premiere Pro, or DaVinci Resolve.',
                'complexity' => 'medium',
                'budget' => 1000,
                'budget_to_be_discussed' => false,
                'pay_timing' => 'upon_completion',
                'pay_timing_note' => 'Paid via GCash or Maya upon delivery of both final videos.',
                'schedule_days' => null,
                'schedule_start_time' => null,
                'schedule_end_time' => null,
                'schedule_note' => 'Flexible remote editing before agreed deadline.',
                'schedule_to_be_discussed' => false,
                'schedule_flexible' => true,
                'can_hours_change' => true,
                'work_mode' => 'remote',
                'workplace_name' => null,
                'workplace_address' => null,
                'workplace_setting' => null,
                'physical_demand' => 'none',
                'academic_involvement' => 'none',
            ],
            [
                'title' => 'Bisaya-to-English Community Survey Transcript Typist',
                'poster' => 'faculty',
                'category' => 'writing_and_editing',
                'work_type' => 'one_time_gig',
                'description' => 'Transcribe and translate 40 minutes of anonymized community extension audio interviews from Cebuano/Bisaya into clean English text for a campus outreach report. '.self::DEMO_DESCRIPTION_MARKER,
                'required_activities' => 'Listen to two anonymized audio clips, type clean English transcripts with timestamps, and proofread.',
                'deliverables' => 'Two formatted Word/Google Doc transcript files delivered in 2 milestones.',
                'estimated_duration_hours' => 6.0,
                'skill_requirements' => 'Fluency in Cebuano/Bisaya and clear written English.',
                'complexity' => 'medium',
                'budget' => 1400,
                'budget_to_be_discussed' => false,
                'pay_timing' => 'milestone',
                'pay_timing_note' => '50% paid after first 20-minute clip, 50% upon final clip delivery.',
                'schedule_days' => null,
                'schedule_start_time' => null,
                'schedule_end_time' => null,
                'schedule_note' => 'Remote flexible work; complete within 5 days.',
                'schedule_to_be_discussed' => false,
                'schedule_flexible' => true,
                'can_hours_change' => true,
                'work_mode' => 'remote',
                'workplace_name' => null,
                'workplace_address' => null,
                'workplace_setting' => null,
                'physical_demand' => 'none',
                'academic_involvement' => 'none',
            ],
            [
                'title' => 'Library Reading Room Book Labeling & Shelf Cataloging',
                'poster' => 'faculty',
                'category' => 'data_entry_and_clerical',
                'work_type' => 'part_time',
                'description' => 'Assist our reading room staff on weekends with printing call-number spine stickers, applying book labels cleanly, and logging newly donated reference books into the catalog sheet. '.self::DEMO_DESCRIPTION_MARKER,
                'required_activities' => 'Check book titles/ISBNs, attach spine labels, and update the catalog spreadsheet.',
                'deliverables' => 'Labeled shelves and updated weekend accession log.',
                'estimated_duration_hours' => 6.0,
                'skill_requirements' => 'Organized, careful handling of books, and basic spreadsheet entry.',
                'complexity' => 'low',
                'budget' => 1200,
                'budget_to_be_discussed' => false,
                'pay_timing' => 'bi_weekly',
                'pay_timing_note' => 'Paid every 2 weeks in cash or bank transfer.',
                'schedule_days' => ['sat', 'sun'],
                'schedule_start_time' => '10:00',
                'schedule_end_time' => '13:00',
                'schedule_note' => 'Weekend late-morning shifts; schedule can flex around exams.',
                'schedule_to_be_discussed' => false,
                'schedule_flexible' => false,
                'can_hours_change' => true,
                'work_mode' => 'onsite',
                'workplace_name' => 'College Reading Room Annex (Sample)',
                'workplace_address' => 'Central Mindanao University Main Campus',
                'workplace_setting' => 'on_campus',
                'physical_demand' => 'light',
                'academic_involvement' => 'none',
            ],
        ];
    }

    public function run(): void
    {
        $accounts = [
            ['Synthetic Project Admin', 'admin@example.test', 'faculty_staff', 'TaskMate Demo Office', 'FAKE-ADMIN-001', null, null, null, true, 'verified'],
            ['Synthetic Student One', 'student1@example.test', 'student', 'College of Information Sciences and Computing — BSIT', 'FAKE-STU-001', null, null, null, false, 'verified'],
            ['Synthetic Student Two', 'student2@example.test', 'student', 'College of Engineering', 'FAKE-STU-002', null, null, null, false, 'verified'],
            ['Synthetic Pending Student', 'student.pending@example.test', 'student', 'College of Education', 'FAKE-STU-003', null, null, null, false, 'pending'],
            ['CMU Faculty Demo Poster', 'faculty@example.test', 'faculty_staff', 'College of Information Sciences and Computing', 'FAKE-EMP-001', null, null, null, false, 'verified'],
            ['Campus Partner Representative', 'organization@example.test', 'organization', null, null, 'Musuan Campus Partner Org (Demo)', 'Community Coordinator', 'Synthetic campus-partner organization created for local testing.', false, 'verified'],
            ['Pending Organization Representative', 'organization.pending@example.test', 'organization', null, null, 'Example Pending Organization', 'Synthetic Representative', 'Synthetic organization awaiting local test verification.', false, 'pending'],
        ];

        foreach ($accounts as [$name, $email, $type, $affiliation, $idNumber, $organizationName, $position, $supportingInfo, $isAdmin, $status]) {
            $user = User::query()->firstOrNew(['email' => $email]);
            $user->name = $name;
            $user->user_type = $type;
            $user->affiliation = $affiliation;
            $user->id_number = $idNumber;
            $user->organization_name = $organizationName;
            $user->position = $position;
            $user->supporting_info = $supportingInfo;
            if (! $user->exists) {
                $user->password = Hash::make('password');
            }
            $user->email_verified_at ??= now();

            $user->is_admin = $isAdmin;
            $user->verification_status = $status;
            $user->save();
        }

        $adminId = User::query()->where('email', 'admin@example.test')->value('id');
        $faculty = User::query()->where('email', 'faculty@example.test')->firstOrFail();
        $organization = User::query()->where('email', 'organization@example.test')->firstOrFail();
        $studentOne = User::query()->where('email', 'student1@example.test')->firstOrFail();
        $studentTwo = User::query()->where('email', 'student2@example.test')->firstOrFail();

        if (empty($studentOne->class_schedule)) {
            $studentOne->class_schedule = [
                ['day' => 'mon', 'start_time' => '08:00', 'end_time' => '12:00', 'label' => 'Synthetic Morning Classes'],
                ['day' => 'wed', 'start_time' => '08:00', 'end_time' => '12:00', 'label' => 'Synthetic Morning Classes'],
                ['day' => 'fri', 'start_time' => '08:00', 'end_time' => '12:00', 'label' => 'Synthetic Morning Classes'],
                ['day' => 'tue', 'start_time' => '13:00', 'end_time' => '16:00', 'label' => 'Synthetic Afternoon Lab'],
                ['day' => 'thu', 'start_time' => '13:00', 'end_time' => '16:00', 'label' => 'Synthetic Afternoon Lab'],
            ];
            $studentOne->save();
        }

        foreach (self::catalog() as $index => $item) {
            $poster = $item['poster'] === 'organization' ? $organization : $faculty;
            $task = $poster->tasks()->where('title', $item['title'])->first();
            if ($task && ! str_contains((string) $task->description, self::DEMO_DESCRIPTION_MARKER)) {
                continue;
            }

            $task ??= $poster->tasks()->make(['title' => $item['title']]);
            $task->poster()->associate($poster);
            $task->title = $item['title'];
            $task->category = $item['category'];
            $task->description = $item['description'];
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
            $task->guidelines_confirmed_at = now();
            $task->decision_source = 'admin';
            $task->risk_level = null;
            $task->risk_score = null;
            $task->screened_at = null;
            $task->reviewed_by = $adminId;
            $task->reviewed_at = now();
            $task->review_note = null;
            $task->save();

            // Seed 3 sample pending applications on the last 3 demo listings.
            if ($index >= 9) {
                $applicant = $index === 11 ? $studentTwo : $studentOne;
                $application = $task->applications()->firstOrNew(['applicant_id' => $applicant->id]);
                if ($application->exists && ! str_starts_with((string) $application->message, 'Synthetic application message ')) {
                    continue;
                }
                $application->task()->associate($task);
                $application->applicant()->associate($applicant);
                $application->message = 'Synthetic application message '.($index + 1).' for local testing only.';
                $application->proposed_amount = $item['budget'] ?? 1000;
                $application->status = ApplicationStatus::Pending;
                $application->save();
                if (! $application->conversation()->exists()) {
                    app(ConversationWorkflow::class)->createForApplication($application);
                }
            }
        }
    }
}
