<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PrototypeMailboxTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_prototype_mailbox_captures_registration_code_and_scopes_inbox_to_signed_in_user(): void
    {
        config([
            'taskmate.prototype_mode' => true,
            'mail.default' => 'log',
        ]);

        $this->post(route('register.store'), [
            'user_type' => 'student',
            'name' => 'Synthetic Mailbox Student',
            'email' => 'mailbox.student@gmail.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect(route('dashboard'));

        $student = User::query()->where('email', 'mailbox.student@gmail.com')->firstOrFail();

        $this->actingAs($student)->get(route('prototype.mailbox'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('prototype/mailbox')
                ->where('addresses.0', 'mailbox.student@gmail.com')
                ->has('messages', 1)
                ->where('messages.0.to', 'mailbox.student@gmail.com')
                ->where('messages.0.subject', 'Confirm your TaskMate email address')
                ->where('messages.0.code', fn ($code) => is_string($code) && preg_match('/^\d{6}$/', $code) === 1)
                ->where('messages.0.actionUrl', fn ($url) => is_string($url) && str_contains($url, '/email/verify/')));

        // Another user must never see mailbox.student@gmail.com's captured emails.
        $otherUser = User::factory()->unverifiedStudent()->create(['email' => 'other.student@gmail.com']);
        $this->actingAs($otherUser)->get(route('prototype.mailbox'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('prototype/mailbox')
                ->has('messages', 0));
    }

    public function test_prototype_mailbox_captures_cmu_institutional_verification_code_for_student(): void
    {
        config([
            'taskmate.prototype_mode' => true,
            'mail.default' => 'log',
        ]);

        $student = User::factory()->unverifiedStudent()->create([
            'email' => 'personal.inbox@gmail.com',
        ]);

        $this->actingAs($student)
            ->post(route('verification.student.send-code'), [
                'id_number' => '2026-04444',
                'affiliation' => 'College of Information Sciences and Computing — BSIT',
                'institutional_email' => 'campus.inbox@cmu.edu.ph',
            ])->assertRedirect(route('verification.student.show'));

        $this->actingAs($student)->get(route('prototype.mailbox'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('prototype/mailbox')
                ->has('messages', 1)
                ->where('messages.0.to', 'campus.inbox@cmu.edu.ph')
                ->where('messages.0.subject', 'Your TaskMate CMU Student Verification Code')
                ->where('messages.0.code', fn ($code) => is_string($code) && preg_match('/^\d{6}$/', $code) === 1));
    }

    public function test_prototype_mailbox_requires_auth_and_returns_404_when_prototype_mode_or_log_mailer_is_disabled(): void
    {
        $this->get(route('prototype.mailbox'))->assertRedirect(route('login'));

        $user = User::factory()->unverifiedStudent()->create();

        config(['taskmate.prototype_mode' => false, 'mail.default' => 'log']);
        $this->actingAs($user)->get(route('prototype.mailbox'))->assertNotFound();

        config(['taskmate.prototype_mode' => true, 'mail.default' => 'smtp']);
        $this->actingAs($user)->get(route('prototype.mailbox'))->assertNotFound();

        $this->app['env'] = 'production';
        config(['taskmate.prototype_mode' => true, 'taskmate.prototype_mailbox' => false, 'mail.default' => 'log']);
        $this->actingAs($user)->get(route('prototype.mailbox'))->assertNotFound();

        config(['taskmate.prototype_mode' => true, 'taskmate.prototype_mailbox' => true, 'mail.default' => 'log']);
        $this->actingAs($user)->get(route('prototype.mailbox'))->assertOk();
    }

    public function test_prototype_password_reset_mailbox_captures_reset_code_for_requesting_guest_session_only(): void
    {
        config([
            'taskmate.prototype_mode' => true,
            'mail.default' => 'log',
        ]);

        // Also capture an account email for the same address to confirm it never leaks to the guest reset mailbox.
        $this->post(route('register.store'), [
            'user_type' => 'student',
            'name' => 'Reset Mailbox Student',
            'email' => 'reset.mailbox@gmail.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect(route('dashboard'));
        $this->post(route('logout'));

        $this->post(route('password.email'), [
            'email' => 'reset.mailbox@gmail.com',
        ])->assertSessionHas('status');

        $this->get(route('prototype.password-reset-mailbox'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('prototype/mailbox')
                ->where('mode', 'password_reset')
                ->where('addresses.0', 'reset.mailbox@gmail.com')
                ->has('messages', 1)
                ->where('messages.0.to', 'reset.mailbox@gmail.com')
                ->where('messages.0.subject', 'Reset your TaskMate password')
                ->where('messages.0.codeLabel', '6-digit password reset code')
                ->where('messages.0.code', fn ($code) => is_string($code) && preg_match('/^\d{6}$/', $code) === 1)
                ->where('messages.0.actionUrl', fn ($url) => is_string($url) && str_contains($url, '/reset-password/')));

        // Another browser session must never see reset.mailbox@gmail.com's reset code.
        $this->flushSession();

        $this->get(route('prototype.password-reset-mailbox'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('prototype/mailbox')
                ->where('mode', 'password_reset')
                ->has('addresses', 0)
                ->has('messages', 0));
    }

    public function test_prototype_password_reset_mailbox_requires_guest_and_returns_404_when_disabled(): void
    {
        $user = User::factory()->unverifiedStudent()->create();
        $this->actingAs($user)->get(route('prototype.password-reset-mailbox'))->assertRedirect(route('dashboard'));
        $this->actingAs($user)->post(route('logout'));

        config(['taskmate.prototype_mode' => false, 'mail.default' => 'log']);
        $this->get(route('prototype.password-reset-mailbox'))->assertNotFound();

        config(['taskmate.prototype_mode' => true, 'mail.default' => 'smtp']);
        $this->get(route('prototype.password-reset-mailbox'))->assertNotFound();

        $this->app['env'] = 'production';
        config(['taskmate.prototype_mode' => true, 'taskmate.prototype_mailbox' => false, 'mail.default' => 'log']);
        $this->get(route('prototype.password-reset-mailbox'))->assertNotFound();

        config(['taskmate.prototype_mode' => true, 'taskmate.prototype_mailbox' => true, 'mail.default' => 'log']);
        $this->get(route('prototype.password-reset-mailbox'))->assertOk();
    }
}
