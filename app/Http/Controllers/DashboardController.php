<?php

namespace App\Http\Controllers;

use App\Enums\VerificationStatus;
use App\Models\TeamInvitation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\RatingSummary;
use App\Services\RatingWorkflow;
use App\Services\SanctionService;

class DashboardController extends Controller
{
    public function __invoke(Request $request, RatingWorkflow $ratings, RatingSummary $ratingSummaries, SanctionService $sanctions): Response
    {
        $email = strtolower($request->user()->email);
        $pendingInvitations = TeamInvitation::query()
            ->with(['inviter', 'team'])
            ->whereRaw('LOWER(email) = ?', [$email])
            ->whereNull('accepted_at')
            ->where(fn ($query) => $query->whereNull('expires_at')->orWhere('expires_at', '>=', now()))
            ->latest()
            ->get()
            ->map(fn (TeamInvitation $invitation) => [
                'code' => $invitation->code,
                'inviterName' => $invitation->inviter->name,
                'team' => ['name' => $invitation->team->name, 'slug' => $invitation->team->slug],
            ]);

        return Inertia::render('dashboard', [
            'pendingInvitations' => $pendingInvitations,
            'accountIdentity' => [
                'email' => $request->user()->email,
                'idNumber' => $request->user()->id_number,
            ],
            'status' => $request->session()->get('status'),
            'studentsCanPost' => (bool) config('taskmate.students_can_post', true),
            'unverifiedStudentsCanBrowse' => (bool) config('taskmate.student_verification.unverified_students_can_browse', true),
            'autoVerifyInstitutionalStudent' => (bool) config('taskmate.student_verification.auto_verify_institutional_email', true),
            'hasStudentDetails' => $request->user()->hasCompleteStudentCredentials(),
            'verificationMethod' => $request->user()->verification_method,
            'studentVerificationUrl' => $request->user()->canRequestStudentVerification()
                ? route('verification.student.show', [], false)
                : null,
            'verificationNote' => in_array($request->user()->verification_status, [VerificationStatus::Rejected, VerificationStatus::MoreInfoRequested], true)
                ? $request->user()->verification_note
                : null,
            'verifiedAt' => $request->user()->verified_at?->toDateTimeString(),
            'ratingsWaiting' => $request->user()->canApply() || $request->user()->canPost() ? $ratings->pendingFor($request->user()) : [],
            'ratingSummary' => ! $request->user()->isAdmin() ? $ratingSummaries->forUser($request->user()) : null,
            'publicProfileUrl' => ! $request->user()->isAdmin() && $request->user()->isVerified() ? route('users.show', $request->user(), false) : null,
            'warningSanction' => $sanctions->warning($request->user()) ? ['id' => $sanctions->warning($request->user())->id, 'reason' => $sanctions->warning($request->user())->reason] : null,
            'activeSuspension' => $sanctions->suspended($request->user()) ? ['id' => $sanctions->suspended($request->user())->id, 'reason' => $sanctions->suspended($request->user())->reason, 'endsAt' => $sanctions->suspended($request->user())->ends_at?->toDateTimeString()] : null,
            'sanctionContact' => config('taskmate.moderation.sanction_notice_contact'),
            'recentAlerts' => $request->user()->notifications()->latest('created_at')->limit(5)->get()->map(fn ($alert) => [
                'id' => $alert->id,
                'title' => $alert->data['title'] ?? 'TaskMate activity',
                'body' => $alert->data['body'] ?? 'There is a new update for you.',
                'url' => route('notifications.open', $alert->id, false),
                'readAt' => $alert->read_at?->toDateTimeString(),
                'createdAt' => $alert->created_at?->toDateTimeString(),
            ])->values(),
        ]);
    }
}
