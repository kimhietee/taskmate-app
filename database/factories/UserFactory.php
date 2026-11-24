<?php

namespace Database\Factories;

use App\Enums\TeamRole;
use App\Enums\UserType;
use App\Enums\VerificationStatus;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'user_type' => UserType::Student,
            'verification_status' => VerificationStatus::Pending,
            'affiliation' => 'Synthetic College and Program',
            'id_number' => fake()->bothify('CMU-####'),
            'organization_name' => null,
            'position' => null,
            'supporting_info' => null,
            'is_admin' => false,
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            /* @chisel-2fa */
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
            /* @end-chisel-2fa */
        ];
    }

    /**
     * Configure the model factory.
     */
    public function configure(): static
    {
        return $this->afterCreating(function ($user) {
            $team = Team::factory()->personal()->create([
                'name' => $user->name."'s Team",
            ]);

            $team->members()->attach($user, [
                'role' => TeamRole::Owner->value,
            ]);

            $user->switchTeam($team);
        });
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function verified(): static
    {
        return $this->state(fn () => ['verification_status' => VerificationStatus::Verified]);
    }

    public function unverifiedStudent(): static
    {
        return $this->state(fn () => [
            'user_type' => UserType::Student,
            'verification_status' => VerificationStatus::Unverified,
            'id_number' => null,
            'affiliation' => null,
        ]);
    }

    public function facultyStaff(): static
    {
        return $this->state(fn () => ['user_type' => UserType::FacultyStaff]);
    }

    public function organization(): static
    {
        return $this->state(fn () => [
            'user_type' => UserType::Organization,
            'organization_name' => fake()->company().' (Synthetic)',
            'position' => 'Representative',
            'supporting_info' => 'Synthetic organization profile for testing.',
            'id_number' => null,
            'affiliation' => null,
        ]);
    }

    /* @chisel-2fa */
    /**
     * Indicate that the model has two-factor authentication configured.
     */
    public function withTwoFactor(): static
    {
        return $this->state(fn (array $attributes) => [
            'two_factor_secret' => encrypt('secret'),
            'two_factor_recovery_codes' => encrypt(json_encode(['recovery-code-1'])),
            'two_factor_confirmed_at' => now(),
        ]);
    }
    /* @end-chisel-2fa */
}
