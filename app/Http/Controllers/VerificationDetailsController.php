<?php

namespace App\Http\Controllers;

use App\Enums\VerificationStatus;
use App\Http\Requests\UpdateVerificationDetailsRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\TaskMateNotifications;

class VerificationDetailsController extends Controller
{
    public function edit(): Response
    {
        /** @var User $user */
        $user = request()->user();

        abort_unless(in_array($user->verification_status, [VerificationStatus::Rejected, VerificationStatus::MoreInfoRequested], true), 403);

        $details = $user->isOrganization()
            ? [
                'organizationName' => $user->organization_name,
                'position' => $user->position,
                'supportingInfo' => $user->supporting_info,
            ]
            : [
                'idNumber' => $user->id_number,
                'affiliation' => $user->affiliation,
            ];

        return Inertia::render('verification/details', [
            'user' => ['userType' => $user->user_type->value, ...$details],
            'verificationStatus' => $user->verification_status->value,
            'verificationNote' => $user->verification_note,
            'affiliationOptions' => config('taskmate.affiliations', ['student' => [], 'faculty_staff' => []]),
        ]);
    }

    public function update(UpdateVerificationDetailsRequest $request, TaskMateNotifications $alerts): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $details = $request->validated();

        DB::transaction(function () use ($user, $details, $alerts): void {
            $user->fill($details);
            $user->verification_status = VerificationStatus::Pending;
            $user->verification_note = null;
            $user->verified_at = null;
            $user->verified_by = null;
            $user->save();

            $user->adminActions()->create([
                'admin_id' => $user->id,
                'action' => 'user_verification_details_updated',
                'metadata' => [
                    'actor_type' => 'user',
                    'fields' => array_keys($details),
                ],
            ]);
            $alerts->admins('account.resubmitted', route('admin.users.index', [], false), ['user_id' => $user->id], actorId: $user->id);
        });

        $redirect = $user->currentTeam
            ? to_route('dashboard', ['current_team' => $user->currentTeam->slug])
            : to_route('taskmate.dashboard');

        return $redirect->with('status', 'Your information was submitted for review.');
    }
}
