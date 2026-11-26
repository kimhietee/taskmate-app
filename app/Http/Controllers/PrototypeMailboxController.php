<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\PrototypeMailboxService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PrototypeMailboxController extends Controller
{
    public function __invoke(Request $request, PrototypeMailboxService $mailbox): Response
    {
        abort_unless($mailbox->isEnabled(), 404);

        /** @var User $user */
        $user = $request->user();

        return Inertia::render('prototype/mailbox', [
            'addresses' => $mailbox->addressesForUser($user),
            'messages' => $mailbox->messagesForUser($user),
            'userName' => $user->name,
            'mode' => 'account',
        ]);
    }

    public function passwordReset(Request $request, PrototypeMailboxService $mailbox): Response
    {
        abort_unless($mailbox->isEnabled(), 404);

        $rawEmail = $request->session()->get('password_reset.email');
        $requestedAt = (int) $request->session()->get('password_reset.requested_at', 0);
        $isFresh = is_string($rawEmail)
            && trim($rawEmail) !== ''
            && $requestedAt > 0
            && (now()->timestamp - $requestedAt) <= (20 * 60);

        $email = $isFresh ? Str::lower(trim($rawEmail)) : null;

        return Inertia::render('prototype/mailbox', [
            'addresses' => $email !== null ? [$email] : [],
            'messages' => $email !== null ? $mailbox->passwordResetMessagesForEmail($email) : [],
            'userName' => $email ?? 'Guest',
            'mode' => 'password_reset',
        ]);
    }
}
