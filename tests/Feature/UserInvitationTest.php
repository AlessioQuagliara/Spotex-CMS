<?php

namespace Tests\Feature;

use App\Filament\Resources\UserResource;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class UserInvitationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(VerifyCsrfToken::class);
        $this->withoutMiddleware(ValidateCsrfToken::class);
        Mail::fake();
    }

    public function test_products_page_loads_tailwind_runtime_script(): void
    {
        $response = $this->get(route('products'));

        $response->assertOk();
        $response->assertSee('https://cdn.tailwindcss.com');
    }

    public function test_invited_user_can_accept_invitation_and_set_password(): void
    {
        $inviter = User::factory()->admin()->create([
            'role' => User::ROLE_ADMIN,
        ]);

        $invitee = User::factory()->create([
            'email' => 'editor@example.test',
            'role' => User::ROLE_EDITOR,
            'email_verified_at' => null,
            'invitation_token' => null,
            'invitation_accepted_at' => null,
            'invitation_expires_at' => null,
        ]);

        UserResource::sendInvitation($invitee, $inviter);
        $invitee->refresh();

        $this->assertNotNull($invitee->invitation_token);
        $this->assertNotNull($invitee->invitation_expires_at);

        $this->get(route('invitation.accept', ['token' => $invitee->invitation_token]))
            ->assertOk()
            ->assertSee('Accetta Invito')
            ->assertSee($invitee->email);

        $this->post(route('invitation.accept.store', ['token' => $invitee->invitation_token]), [
            'name' => 'Editor Spotex',
            'password' => 'NuovaPassword123!',
            'password_confirmation' => 'NuovaPassword123!',
        ])->assertRedirect('/admin');

        $invitee->refresh();

        $this->assertSame('Editor Spotex', $invitee->name);
        $this->assertNull($invitee->invitation_token);
        $this->assertNull($invitee->invitation_expires_at);
        $this->assertNotNull($invitee->invitation_accepted_at);
        $this->assertTrue(Hash::check('NuovaPassword123!', $invitee->password));
    }
}
