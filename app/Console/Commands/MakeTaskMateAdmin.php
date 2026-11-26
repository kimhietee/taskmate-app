<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class MakeTaskMateAdmin extends Command
{
    protected $signature = 'taskmate:make-admin {email}';

    protected $description = 'Grant TaskMate administrator access to an existing user';

    public function handle(): int
    {
        $user = User::query()->where('email', $this->argument('email'))->first();

        if (! $user) {
            $this->components->error('No user found with that email address.');

            return self::FAILURE;
        }

        $user->is_admin = true;
        $user->email_verified_at ??= now();
        $user->verification_status = 'verified';
        $user->verified_at = now();
        $user->verified_by = null;
        $user->save();

        $this->components->info("{$user->email} is now a verified TaskMate administrator.");

        return self::SUCCESS;
    }
}
