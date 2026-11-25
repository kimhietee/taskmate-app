<?php

namespace App\Models;

use App\Concerns\HasTeams;
use App\Enums\UserType;
use App\Enums\VerificationStatus;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property int|null $current_team_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Team|null $currentTeam
 * @property-read Collection<int, Team> $ownedTeams
 * @property-read Collection<int, Membership> $teamMemberships
 * @property-read Collection<int, Team> $teams
 */
#[Fillable(['name', 'first_name', 'middle_initial', 'last_name', 'email', 'password', 'user_type', 'id_number', 'affiliation', 'organization_name', 'position', 'supporting_info'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token', 'class_schedule', 'institutional_email'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    public function isAdmin(): bool
    {
        return $this->is_admin;
    }

    public function isVerified(): bool
    {
        return $this->verification_status === VerificationStatus::Verified;
    }

    public function isStudent(): bool
    {
        return $this->user_type === UserType::Student;
    }

    public function isFacultyStaff(): bool
    {
        return $this->user_type === UserType::FacultyStaff;
    }

    public function isOrganization(): bool
    {
        return $this->user_type === UserType::Organization;
    }

    public function canPost(): bool
    {
        if ($this->isAdmin() || ! $this->isVerified()) {
            return false;
        }

        return $this->isFacultyStaff()
            || $this->isOrganization()
            || ($this->isStudent() && (bool) config('taskmate.students_can_post', true));
    }

    public function canApply(): bool
    {
        return ! $this->isAdmin() && $this->isStudent() && $this->isVerified();
    }

    public function canBrowse(): bool
    {
        if ($this->isAdmin() || ! $this->isStudent()) {
            return false;
        }

        if ($this->isVerified()) {
            return true;
        }

        return (bool) config('taskmate.student_verification.unverified_students_can_browse', true);
    }

    public function hasInstitutionalEmailDomain(?string $email = null): bool
    {
        $candidate = strtolower(trim((string) ($email ?? $this->email)));
        if (! str_contains($candidate, '@')) {
            return false;
        }

        $domain = substr(strrchr($candidate, '@'), 1);
        $allowed = array_map(
            fn (string $d) => strtolower(trim($d)),
            config('taskmate.institutional_email_domains', []),
        );

        return in_array($domain, $allowed, true);
    }

    public function hasCompleteStudentCredentials(): bool
    {
        return filled($this->id_number) && filled($this->affiliation);
    }

    public function canRequestStudentVerification(): bool
    {
        return ! $this->isAdmin() && $this->isStudent() && ! $this->isVerified();
    }

    public function emailVerificationCodes(): HasMany
    {
        return $this->hasMany(EmailVerificationCode::class);
    }

    public function adminActions(): MorphMany
    {
        return $this->morphMany(AdminAction::class, 'subject');
    }

    public function adminActionsPerformed(): HasMany
    {
        return $this->hasMany(AdminAction::class, 'admin_id');
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(self::class, 'verified_by');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class, 'poster_id');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class, 'applicant_id');
    }

    public function postedConversations(): HasMany
    {
        return $this->hasMany(Conversation::class, 'poster_id');
    }

    public function applicantConversations(): HasMany
    {
        return $this->hasMany(Conversation::class, 'applicant_id');
    }

    public function postedAgreements(): HasMany
    {
        return $this->hasMany(Agreement::class, 'poster_id');
    }

    public function studentAgreements(): HasMany
    {
        return $this->hasMany(Agreement::class, 'student_id');
    }

    public function filedReports(): HasMany
    {
        return $this->hasMany(Report::class, 'reporter_id');
    }

    public function receivedReports(): HasMany
    {
        return $this->hasMany(Report::class, 'reported_user_id');
    }

    public function ratingsGiven(): HasMany
    {
        return $this->hasMany(Rating::class, 'rater_id');
    }

    public function ratingsReceived(): HasMany
    {
        return $this->hasMany(Rating::class, 'ratee_id');
    }

    public function sanctions(): HasMany
    {
        return $this->hasMany(UserSanction::class);
    }

    public function contentFlags(): HasMany
    {
        return $this->hasMany(ContentFlag::class, 'source_user_id');
    }

    /** @use HasFactory<UserFactory> */
    use HasFactory, HasTeams, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'institutional_email_verified_at' => 'datetime',
            'verified_at' => 'datetime',
            'is_admin' => 'boolean',
            'password' => 'hashed',
            'user_type' => UserType::class,
            'verification_status' => VerificationStatus::class,
            'class_schedule' => 'array',
            /* @chisel-2fa */
            'two_factor_confirmed_at' => 'datetime',
            /* @end-chisel-2fa */
        ];
    }
}
