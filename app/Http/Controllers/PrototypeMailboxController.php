<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\PrototypeMailboxService;
use Illuminate\Http\Request;
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
        ]);
    }
}
