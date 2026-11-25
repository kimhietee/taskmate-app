<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get(route('profile.edit'));

        $response->assertOk();
    }

    public function test_profile_information_can_be_updated()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch(route('profile.update'), [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'affiliation' => $user->affiliation,
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('profile.edit'));

        $user->refresh();

        $this->assertSame('Test User', $user->name);
        $this->assertSame('test@example.com', $user->email);
        $this->assertNull($user->email_verified_at);
    }

    public function test_profile_can_be_updated_using_structured_name_parts(): void
    {
        $user = User::factory()->create([
            'first_name' => 'Old',
            'middle_initial' => 'A.',
            'last_name' => 'Name',
            'name' => 'Old A. Name',
        ]);

        $this->actingAs($user)
            ->patch(route('profile.update'), [
                'first_name' => '  Ma. Elena ',
                'middle_initial' => 'c',
                'last_name' => 'Santos-Reyes',
                'email' => $user->email,
                'affiliation' => $user->affiliation,
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('profile.edit'));

        $user->refresh();
        $this->assertSame('Ma. Elena', $user->first_name);
        $this->assertSame('C.', $user->middle_initial);
        $this->assertSame('Santos-Reyes', $user->last_name);
        $this->assertSame('Ma. Elena C. Santos-Reyes', $user->name);
    }

    public function test_email_is_stored_in_lowercase_so_the_user_can_still_log_in()
    {
        $user = User::factory()->create();

        $this
            ->actingAs($user)
            ->patch(route('profile.update'), [
                'name' => 'Test User',
                'email' => 'Test@Example.com',
                'affiliation' => $user->affiliation,
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame('test@example.com', $user->refresh()->email);

        $this->post(route('logout'));

        $this->post(route('login.store'), [
            'email' => 'Test@Example.com',
            'password' => 'password',
        ]);

        $this->assertAuthenticatedAs($user);
    }

    public function test_email_must_be_unique_regardless_of_case()
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from(route('profile.edit'))
            ->patch(route('profile.update'), [
                'name' => 'Test User',
                'email' => 'Taken@Example.com',
                'affiliation' => $user->affiliation,
            ]);

        $response
            ->assertSessionHasErrors('email')
            ->assertRedirect(route('profile.edit'));
    }

    public function test_email_verification_status_is_unchanged_when_the_email_address_is_unchanged()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch(route('profile.update'), [
                'name' => 'Test User',
                'email' => $user->email,
                'affiliation' => $user->affiliation,
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('profile.edit'));

        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_profile_cannot_change_account_type_id_number_or_verification_status(): void
    {
        $user = User::factory()->create([
            'id_number' => 'FAKE-STU-001',
            'verification_status' => 'pending',
        ]);

        $this->actingAs($user)->patch(route('profile.update'), [
            'name' => 'Updated Synthetic Student',
            'email' => $user->email,
            'affiliation' => 'Updated Synthetic College',
            'user_type' => 'organization',
            'id_number' => 'FAKE-CHANGED',
            'verification_status' => 'verified',
        ])->assertSessionHasNoErrors();

        $this->assertSame('student', $user->fresh()->user_type->value);
        $this->assertSame('FAKE-STU-001', $user->fresh()->id_number);
        $this->assertSame('pending', $user->fresh()->verification_status->value);
        $this->assertSame('Updated Synthetic College', $user->fresh()->affiliation);
    }

    public function test_organization_representative_can_update_organization_details(): void
    {
        $user = User::factory()->create([
            'user_type' => 'organization',
            'affiliation' => null,
            'organization_name' => 'Old Synthetic Organization',
            'position' => 'Old Synthetic Position',
            'supporting_info' => 'Old synthetic details.',
        ]);

        $this->actingAs($user)->patch(route('profile.update'), [
            'name' => 'Synthetic Representative',
            'email' => $user->email,
            'organization_name' => 'Updated Synthetic Organization',
            'position' => 'Updated Synthetic Position',
            'supporting_info' => 'Updated synthetic details for local testing.',
        ])->assertSessionHasNoErrors();

        $this->assertSame('Updated Synthetic Organization', $user->fresh()->organization_name);
        $this->assertSame('Updated Synthetic Position', $user->fresh()->position);
        $this->assertSame('Updated synthetic details for local testing.', $user->fresh()->supporting_info);
    }

    public function test_user_can_delete_their_account()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->delete(route('profile.destroy'), [
                'password' => 'password',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('home'));

        $this->assertGuest();
        $this->assertNull($user->fresh());
    }

    public function test_correct_password_must_be_provided_to_delete_account()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from(route('profile.edit'))
            ->delete(route('profile.destroy'), [
                'password' => 'wrong-password',
            ]);

        $response
            ->assertSessionHasErrors('password')
            ->assertRedirect(route('profile.edit'));

        $this->assertNotNull($user->fresh());
    }
}
