<?php

namespace Tests\Feature;

use App\Enums\TaskStatus;
use App\Enums\UserType;
use App\Enums\VerificationStatus;
use App\Models\User;
use Database\Seeders\BetaSampleDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BetaSampleDataSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_beta_sample_data_seeder_creates_expected_accounts_and_approved_tasks_idempotently(): void
    {
        $this->seed(BetaSampleDataSeeder::class);
        $this->seed(BetaSampleDataSeeder::class);

        $this->assertDatabaseCount('users', 3);
        $this->assertDatabaseCount('tasks', 12);

        $carl = User::query()->where('email', 'carl@gmail.com')->firstOrFail();
        $karl = User::query()->where('email', 'karl@gmail.com')->firstOrFail();
        $kharl = User::query()->where('email', 'kharl@gmail.com')->firstOrFail();

        $this->assertSame(UserType::FacultyStaff, $carl->user_type);
        $this->assertSame(VerificationStatus::Verified, $carl->verification_status);
        $this->assertFalse($carl->is_admin);
        $this->assertTrue(Hash::check(BetaSampleDataSeeder::DEFAULT_PASSWORD, $carl->password));

        $this->assertSame(UserType::Student, $karl->user_type);
        $this->assertSame(VerificationStatus::Verified, $karl->verification_status);
        $this->assertSame('karl.reyes@cmu.edu.ph', $karl->institutional_email);
        $this->assertFalse($karl->is_admin);
        $this->assertNotEmpty($karl->class_schedule);

        $this->assertSame(UserType::Organization, $kharl->user_type);
        $this->assertSame(VerificationStatus::Verified, $kharl->verification_status);
        $this->assertFalse($kharl->is_admin);

        $this->assertSame(7, $carl->tasks()->where('status', TaskStatus::Approved)->count());
        $this->assertSame(5, $kharl->tasks()->where('status', TaskStatus::Approved)->count());

        $this->actingAs($karl)
            ->get(route('browse.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('browse/index')
                ->has('tasks.data', 12));
    }

    public function test_beta_sample_data_seeder_preserves_existing_passwords_and_admin_flags(): void
    {
        $this->seed(BetaSampleDataSeeder::class);

        $carl = User::query()->where('email', 'carl@gmail.com')->firstOrFail();
        $carl->password = Hash::make('CustomAdminPass#2026');
        $carl->is_admin = true;
        $carl->save();

        $this->seed(BetaSampleDataSeeder::class);

        $carl->refresh();
        $this->assertTrue(Hash::check('CustomAdminPass#2026', $carl->password));
        $this->assertTrue($carl->is_admin);
    }
}
