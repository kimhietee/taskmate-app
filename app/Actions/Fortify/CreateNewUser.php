<?php

namespace App\Actions\Fortify;

use App\Actions\Teams\CreateTeam;
use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Enums\UserType;
use App\Enums\VerificationStatus;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\CreatesNewUsers;
use App\Services\TaskMateNotifications;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    public function __construct(private CreateTeam $createTeam, private TaskMateNotifications $alerts)
    {
        //
    }

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        if (request()->allFiles() !== []) {
            throw ValidationException::withMessages(['documents' => 'Identity document and face photo uploads are not accepted.']);
        }

        foreach (['name', 'id_number', 'affiliation', 'organization_name', 'position', 'supporting_info'] as $field) {
            if (array_key_exists($field, $input)) {
                $cleaned = $this->cleanText($input[$field]);
                $input[$field] = $cleaned === '' ? null : $cleaned;
            }
        }
        if (isset($input['email']) && is_string($input['email'])) {
            $input['email'] = trim($input['email']);
        }

        $profileRules = $this->profileRules();
        $profileRules['email'][] = function (string $attribute, mixed $value, \Closure $fail) use ($input): void {
            if (! config('taskmate.require_institutional_email', true)) {
                return;
            }

            if (! in_array($input['user_type'] ?? null, [UserType::Student->value, UserType::FacultyStaff->value], true)) {
                return;
            }

            $domain = Str::lower(Str::afterLast((string) $value, '@'));
            $allowedDomains = array_map(fn (string $emailDomain) => Str::lower($emailDomain), config('taskmate.institutional_email_domains', []));

            if (! in_array($domain, $allowedDomains, true)) {
                $fail('Use your CMU institutional email address.');
            }
        };

        Validator::make($input, [
            ...$profileRules,
            'password' => $this->passwordRules(),
            'user_type' => ['required', Rule::in(array_keys(config('taskmate.user_types', [])))],
            'id_number' => ['required_if:user_type,student,faculty_staff', 'prohibited_unless:user_type,student,faculty_staff', 'nullable', 'string', 'min:2', 'max:255'],
            'affiliation' => ['required_if:user_type,student,faculty_staff', 'prohibited_unless:user_type,student,faculty_staff', 'nullable', 'string', 'min:2', 'max:255'],
            'organization_name' => ['required_if:user_type,organization', 'prohibited_unless:user_type,organization', 'nullable', 'string', 'min:2', 'max:255'],
            'position' => ['required_if:user_type,organization', 'prohibited_unless:user_type,organization', 'nullable', 'string', 'min:2', 'max:255'],
            'supporting_info' => ['required_if:user_type,organization', 'prohibited_unless:user_type,organization', 'nullable', 'string', 'max:1000'],
        ], [
            'name.regex' => 'Enter a valid name using letters, spaces, periods, hyphens, or apostrophes.',
        ])->validate();

        return DB::transaction(function () use ($input) {
            $user = new User;
            $user->name = $input['name'];
            $user->email = $input['email'];
            $user->password = $input['password'];
            $user->user_type = UserType::from($input['user_type']);
            $user->verification_status = VerificationStatus::Pending;
            $user->is_admin = false;
            $user->affiliation = $input['affiliation'] ?? null;
            $user->id_number = $input['id_number'] ?? null;
            $user->organization_name = $input['organization_name'] ?? null;
            $user->position = $input['position'] ?? null;
            $user->supporting_info = $input['supporting_info'] ?? null;
            $user->save();

            $this->alerts->admins('account.awaiting_review', route('admin.users.index', [], false), ['user_id' => $user->id], actorId: $user->id);

            $this->createTeam->handle($user, $user->name."'s Team", isPersonal: true);

            return $user;
        });
    }
}
