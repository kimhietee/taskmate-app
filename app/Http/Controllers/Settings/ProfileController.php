<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'accountDetails' => [
                'firstName' => $user->first_name,
                'middleInitial' => $user->middle_initial,
                'lastName' => $user->last_name,
                ...($user->isOrganization()
                    ? [
                        'organizationName' => $user->organization_name,
                        'position' => $user->position,
                        'supportingInfo' => $user->supporting_info,
                    ]
                    : [
                        'affiliation' => $user->affiliation,
                        'idNumber' => $user->id_number,
                        'institutionalEmail' => $user->institutional_email,
                    ]),
            ],
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validatedWithComposedName();
        $user->fill($validated);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('profile.edit');
    }

    /** Legacy starter-kit endpoint retained for existing account tests; no deletion UI is exposed. */
    public function destroy(\App\Http\Requests\Settings\ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();
        Auth::logout();
        $user->delete();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }

}
