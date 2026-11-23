<?php

return [
    // Prototype features are enabled for local evaluation unless explicitly disabled.
    'prototype_mode' => env('TASKMATE_PROTOTYPE_MODE', true),
    'rate_limits' => [
        'login' => ['max_attempts' => 5, 'decay_seconds' => 60],
        'register' => ['max_attempts' => 20, 'decay_seconds' => 3600],
        'apply' => ['max_attempts' => 30, 'decay_seconds' => 60],
        'report' => ['max_attempts' => 20, 'decay_seconds' => 3600],
        'evidence_download' => ['max_attempts' => 30, 'decay_seconds' => 60],
    ],
    'user_types' => [
        'student' => 'CMU Student',
        'faculty_staff' => 'CMU Faculty / Staff',
        'organization' => 'Office or Organization Representative',
    ],

    // The project team must confirm CMU's real institutional email domain(s).
    'institutional_email_domains' => ['cmu.edu.ph'],

    // PROVISIONAL: keep true for CMU deployment; set TASKMATE_REQUIRE_INSTITUTIONAL_EMAIL=false for open local testing.
    'require_institutional_email' => env('TASKMATE_REQUIRE_INSTITUTIONAL_EMAIL', true),

    // PROVISIONAL: standardized affiliation suggestions (users may also choose "Other" to specify another program or office).
    'affiliations' => [
        'student' => [
            'College of Information Sciences and Computing — BSIT',
            'College of Information Sciences and Computing — BSCS',
            'College of Information Sciences and Computing — BSIS',
            'College of Agriculture',
            'College of Arts and Sciences',
            'College of Business and Management',
            'College of Education',
            'College of Engineering',
            'College of Forestry and Environmental Science',
            'College of Human Ecology',
            'College of Nursing',
            'College of Veterinary Medicine',
            'Graduate School (Master’s / Doctoral)',
        ],
        'faculty_staff' => [
            'College of Information Sciences and Computing',
            'College of Agriculture',
            'College of Arts and Sciences',
            'College of Business and Management',
            'College of Education',
            'College of Engineering',
            'College of Forestry and Environmental Science',
            'College of Human Ecology',
            'College of Nursing',
            'College of Veterinary Medicine',
            'University Administration / Campus Office',
        ],
    ],

    'students_can_post' => true,
    'require_verification' => true,

    // PROVISIONAL: in-app alerts are not yet part of a finalized notification-retention policy.
    'notifications' => [
        'poll_seconds' => 10,
        'per_page' => 20,
        'retention_days' => null,
        // Supports several visible tabs polling every 10 seconds without limiting normal use.
        'throttle_per_minute' => 120,
    ],

    // PROVISIONAL: conversation retention is undecided; messages remain private and append-only.
    'messages' => [
        'max_length' => 1000,
        'rate_limit_per_minute' => 10,
        'report_context_messages' => 5,
        'retention_days' => null,
    ],

    // PROVISIONAL: the team and adviser must confirm the approved categories.
    'categories' => [
        'tutoring_and_academic_support' => 'Tutoring and academic support',
        'design_and_creative' => 'Design and creative work',
        'writing_and_editing' => 'Writing and editing',
        'data_entry_and_clerical' => 'Data entry and clerical work',
        'event_support' => 'Event support',
        'tech_and_web' => 'Technology and web',
        'errands_and_delivery' => 'Errands and delivery',
        'other' => 'Other',
    ],

    'work_modes' => [
        'onsite' => 'Onsite',
        'remote' => 'Remote',
        'hybrid' => 'Hybrid',
    ],

    // PROVISIONAL: distinguishes one-time output-based gigs from scheduled short-term part-time work.
    'work_types' => [
        'one_time_gig' => 'One-time gig / task',
        'part_time' => 'Short-term part-time',
    ],

    // PROVISIONAL: the team must confirm the upfront pay timing options shown on job terms cards.
    'pay_timings' => [
        'upon_completion' => 'Upon completion',
        'daily' => 'Daily',
        'weekly' => 'Weekly',
        'bi_weekly' => 'Bi-weekly (every 2 weeks)',
        'monthly' => 'Monthly',
        'milestone' => 'Per milestone / installment',
        'to_be_discussed' => 'To be discussed',
    ],

    'days_of_week' => [
        'mon' => 'Mon',
        'tue' => 'Tue',
        'wed' => 'Wed',
        'thu' => 'Thu',
        'fri' => 'Fri',
        'sat' => 'Sat',
        'sun' => 'Sun',
    ],

    // PROVISIONAL: maximum saved weekly class schedule blocks per student.
    'class_schedule' => [
        'max_blocks' => 25,
    ],

    'complexity_levels' => [
        'low' => 'Low',
        'medium' => 'Medium',
        'high' => 'High',
    ],

    // Labels retained for previously saved work condition details. Automated screening is no longer active.
    'risk_questions' => [
        'physical_demand' => [
            'none' => 'None',
            'light' => 'Light',
            'moderate' => 'Moderate',
            'heavy' => 'Heavy',
        ],
        'academic_involvement' => [
            'none' => 'None',
            'supporting' => 'Supporting academic work',
            'produces_graded_work' => 'Produces another person’s graded work',
        ],
        'workplace_setting' => [
            'on_campus' => 'On campus',
            'off_campus_public' => 'Off campus, public place',
            'off_campus_private_or_residential' => 'Off campus, private or residential place',
        ],
    ],

    // PROVISIONAL: the Job and Task Guidelines must be finalized by the team and university.
    'task_guidelines' => [
        'PROVISIONAL: Tasks must be lawful and appropriate for a campus setting.',
        'PROVISIONAL: Do not request academic dishonesty, such as doing another person’s graded work.',
        'PROVISIONAL: Do not require a private meeting in an unsafe or isolated place.',
        'PROVISIONAL: The budget should be a fair estimate for the described work.',
        'PROVISIONAL: Payment is arranged directly between the poster and the student.',
    ],

    'browse' => [
        'per_page' => 12,
        'sort_options' => [
            'newest' => 'Newest',
            'budget_high' => 'Budget: high to low',
            'budget_low' => 'Budget: low to high',
        ],
        // Filters beyond category and work mode are provisional and must be confirmed by the team (FR-26).
    ],

    'applications' => [
        'message_max_length' => 1000,
    ],

    'agreement' => [
        'terms_max_length' => 3000,
        // Required terms fields and payment-arrangement options are provisional and must be confirmed by the team.
    ],

    'payment_status' => [
        // PROVISIONAL: approved payment arrangement options must be confirmed by the team.
        'methods' => [
            'gcash' => 'GCash',
            'maya' => 'Maya',
            'bank_transfer' => 'Bank transfer',
            'cash' => 'Cash',
            'other' => 'Other',
        ],
    ],

    'reports' => [
        // PROVISIONAL: evidence standards, response times, appeal process, and escalation rules are undecided.
        'types' => [
            'non_payment' => ['label' => 'Non-payment', 'priority' => 'high', 'respondent_can_reply' => true],
            'misleading_description' => ['label' => 'Misleading description', 'priority' => 'normal', 'respondent_can_reply' => true],
            'harassment' => ['label' => 'Harassment', 'priority' => 'high', 'respondent_can_reply' => false],
            'unsafe_behavior' => ['label' => 'Unsafe behavior', 'priority' => 'high', 'respondent_can_reply' => false],
            'academic_dishonesty' => ['label' => 'Academic dishonesty', 'priority' => 'normal', 'respondent_can_reply' => true],
            'fraudulent_post' => ['label' => 'Fraudulent post', 'priority' => 'high', 'respondent_can_reply' => false],
            'rule_bypass_request' => ['label' => 'Request to bypass platform rules', 'priority' => 'high', 'respondent_can_reply' => false],
            'off_platform_transaction' => ['label' => 'Request to move task arrangements outside TaskMate', 'priority' => 'high', 'respondent_can_reply' => false],
            'incomplete_work' => ['label' => 'Incomplete work', 'priority' => 'normal', 'respondent_can_reply' => true],
            'other' => ['label' => 'Other', 'priority' => 'normal', 'respondent_can_reply' => false],
        ],
        'rate_limit_per_day' => 5,
        'description_max_length' => 3000,
        'evidence_max_files' => 5,
        'evidence_max_kb' => 5120,
        'evidence_mimes' => ['jpg', 'jpeg', 'png', 'pdf'],
        'non_payment_wait_days' => 3,
        'statement_max_length' => 3000,
    ],

    'moderation' => [
        // PROVISIONAL: designated office, response targets, appeal process, and escalation rules are undecided.
        'sanction_notice_contact' => 'Contact the TaskMate administrators through the designated office. The appeals process has not been decided.',
        'response_target_days' => null,
        'escalation_office_label' => null,
    ],

    'offplatform' => [
        // PROVISIONAL: sample patterns for testing only; the team must approve detection rules. Payment arrangements are excluded.
        'patterns' => [
            'move_chat_outside' => [
                ['label' => 'Message me on Telegram', 'pattern' => '/message\s+me\s+on\s+telegram/i'],
                ['label' => 'External messenger URL', 'pattern' => '/https?:\/\/(?:t\.me|wa\.me|discord\.gg|m\.me)\/[\w.-]+/i'],
            ],
            'bypass_agreement' => [
                ['label' => 'Skip the agreement', 'pattern' => '/let.?s\s+skip\s+the\s+agreement/i'],
                ['label' => 'Start before signing', 'pattern' => '/start\s+before\s+we\s+sign/i'],
            ],
            'bypass_review' => [
                ['label' => 'Avoid administrator review', 'pattern' => '/don.?t\s+tell\s+the\s+admin/i'],
            ],
            'share_contact_details' => [
                ['label' => 'Phone number', 'pattern' => '/(?<!\d)(?:\+?\d[\s().-]?){8,14}\d(?!\d)/'],
            ],
        ],
        'category_labels' => [
            'move_chat_outside' => 'Move communication outside TaskMate',
            'bypass_agreement' => 'Bypass the TaskMate agreement',
            'bypass_review' => 'Bypass TaskMate review',
            'share_contact_details' => 'Share personal contact details',
        ],
    ],

    'sanctions' => [
        'max_suspension_days' => 90,
    ],

    'ratings' => [
        // PROVISIONAL: rating visibility, moderation, and appeals are not decided by the team.
        'dimensions' => [
            'poster_to_student' => [
                'work_quality' => 'Work quality',
                'reliability' => 'Reliability',
                'communication' => 'Communication',
                'professionalism' => 'Professionalism',
                'timeliness' => 'Timeliness',
            ],
            'student_to_poster' => [
                'job_description_accuracy' => 'Job description accuracy',
                'reliability' => 'Reliability',
                'communication' => 'Communication',
                'professionalism' => 'Professionalism',
            ],
        ],
        'window_days' => 30,
        'visibility' => 'after_both',
        'min_count_for_average' => 3,
        'comment_max_length' => 1000,
    ],
];
