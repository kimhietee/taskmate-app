<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Services\PrototypeMailboxService;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Fortify\Features;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->skipUnlessFortifyHas(Features::resetPasswords());
    }

    public function test_reset_password_link_screen_can_be_rendered()
    {
        $response = $this->get(route('password.request'));

        $response->assertOk();
    }

    public function test_reset_password_link_can_be_requested()
    {
        Notification::fake();

        $user = User::factory()->create();

        $this->post(route('password.email'), ['email' => $user->email]);

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_reset_password_screen_can_be_rendered()
    {
        Notification::fake();

        $user = User::factory()->create();

        $this->post(route('password.email'), ['email' => $user->email]);

        Notification::assertSentTo($user, ResetPassword::class, function ($notification) {
            $response = $this->get(route('password.reset', $notification->token));

            $response->assertOk();

            return true;
        });
    }

    public function test_password_can_be_reset_with_valid_token()
    {
        Notification::fake();

        $user = User::factory()->create();

        $this->post(route('password.email'), ['email' => $user->email]);

        Notification::assertSentTo($user, ResetPassword::class, function ($notification) use ($user) {
            $response = $this->post(route('password.update'), [
                'token' => $notification->token,
                'email' => $user->email,
                'password' => 'password',
                'password_confirmation' => 'password',
            ]);

            $response
                ->assertSessionHasNoErrors()
                ->assertRedirect(route('login'));

            return true;
        });
    }

    public function test_password_cannot_be_reset_with_invalid_token(): void
    {
        $user = User::factory()->create();

        $response = $this->post(route('password.update'), [
            'token' => 'invalid-token',
            'email' => $user->email,
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertSessionHasErrors('email');
    }

    public function test_forgot_password_screen_exposes_prototype_mailbox_props_after_reset_request(): void
    {
        Cache::flush();
        config([
            'taskmate.prototype_mode' => true,
            'mail.default' => 'log',
        ]);

        $user = User::factory()->create(['email' => 'forgot.props@gmail.com']);

        $this->from(route('password.request'))
            ->post(route('password.email'), ['email' => $user->email])
            ->assertRedirect(route('password.request'));

        $this->get(route('password.request'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/forgot-password')
                ->where('prototypeMailboxEnabled', true)
                ->where('mailUsesLogDriver', true)
                ->where('requestedEmail', 'forgot.props@gmail.com')
                ->where('maskedEmail', 'fo***@gmail.com'));
    }

    public function test_password_can_be_reset_with_valid_six_digit_code(): void
    {
        Cache::flush();
        config([
            'taskmate.prototype_mode' => true,
            'mail.default' => 'log',
        ]);

        $user = User::factory()->create(['email' => 'reset.code@gmail.com']);

        $this->from(route('password.request'))
            ->post(route('password.email'), ['email' => $user->email])
            ->assertRedirect(route('password.request'));

        $messages = app(PrototypeMailboxService::class)->passwordResetMessagesForEmail($user->email);
        $this->assertCount(1, $messages);
        $code = $messages[0]['code'] ?? null;
        $this->assertIsString($code);
        $this->assertMatchesRegularExpression('/^\d{6}$/', $code);

        $verifyResponse = $this->from(route('password.request'))
            ->post(route('password.verify-code'), [
                'email' => $user->email,
                'code' => $code,
            ]);

        $verifyResponse->assertSessionHasNoErrors();
        $redirectLocation = (string) $verifyResponse->headers->get('Location');
        $this->assertStringContainsString('/reset-password/', $redirectLocation);

        $token = trim((string) parse_url($redirectLocation, PHP_URL_PATH), '/');
        $token = str_replace('reset-password/', '', $token);

        $this->get($redirectLocation)->assertOk();

        $this->post(route('password.update'), [
            'token' => $token,
            'email' => $user->email,
            'password' => 'NewStrongPass#2026',
            'password_confirmation' => 'NewStrongPass#2026',
        ])->assertSessionHasNoErrors()->assertRedirect(route('login'));

        $this->assertTrue(Hash::check('NewStrongPass#2026', $user->fresh()->password));

        // The 6-digit code cannot be reused once consumed.
        $this->from(route('password.request'))
            ->post(route('password.verify-code'), [
                'email' => $user->email,
                'code' => $code,
            ])->assertSessionHasErrors('code');
    }

    public function test_password_reset_code_rejects_invalid_code_and_unknown_email(): void
    {
        Cache::flush();
        config([
            'taskmate.prototype_mode' => true,
            'mail.default' => 'log',
        ]);

        $user = User::factory()->create(['email' => 'wrong.code@gmail.com']);

        $this->post(route('password.email'), ['email' => $user->email]);
        $messages = app(PrototypeMailboxService::class)->passwordResetMessagesForEmail($user->email);
        $issued = (string) ($messages[0]['code'] ?? '000000');
        $wrongCode = $issued === '111111' ? '222222' : '111111';

        $this->from(route('password.request'))
            ->post(route('password.verify-code'), [
                'email' => $user->email,
                'code' => $wrongCode,
            ])->assertSessionHasErrors('code');

        $this->from(route('password.request'))
            ->post(route('password.verify-code'), [
                'email' => 'nobody@example.test',
                'code' => '123456',
            ])->assertSessionHasErrors('code');
    }
}
