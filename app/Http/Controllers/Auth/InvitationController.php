<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class InvitationController extends Controller
{
    public function show(string $token)
    {
        $user = User::query()->where('invitation_token', $token)->first();

        if (!$user) {
            return view('auth.accept-invitation', [
                'invalidInvitation' => true,
            ]);
        }

        if ($this->isExpired($user)) {
            return view('auth.accept-invitation', [
                'expiredInvitation' => true,
                'email' => $user->email,
            ]);
        }

        if ($user->invitation_accepted_at !== null) {
            return redirect()
                ->route('login')
                ->with('success', 'Questo invito è già stato utilizzato. Accedi con le tue credenziali.');
        }

        return view('auth.accept-invitation', [
            'token' => $token,
            'email' => $user->email,
            'defaultName' => $user->name,
        ]);
    }

    public function accept(Request $request, string $token)
    {
        $user = User::query()->where('invitation_token', $token)->first();

        if (!$user || $this->isExpired($user)) {
            return redirect()
                ->route('login')
                ->withErrors(['email' => 'Invito non valido o scaduto.']);
        }

        if ($user->invitation_accepted_at !== null) {
            return redirect()
                ->route('login')
                ->with('success', 'Invito già accettato. Effettua il login.');
        }

        if ($user->is_banned) {
            return redirect()
                ->route('login')
                ->withErrors(['email' => 'Questo account è sospeso. Contatta un amministratore.']);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ], [
            'name.required' => 'Il nome è obbligatorio.',
            'password.required' => 'La password è obbligatoria.',
            'password.confirmed' => 'Le password non corrispondono.',
        ]);

        $user->update([
            'name' => $data['name'],
            'password' => Hash::make($data['password']),
            'email_verified_at' => $user->email_verified_at ?? now(),
            'invitation_accepted_at' => now(),
            'invitation_token' => null,
            'invitation_expires_at' => null,
        ]);

        if ($user->isBackofficeUser()) {
            $request->session()->setName((string) config('auth.admin_session_cookie', 'spotex_admin_session'));
            Auth::guard('admin')->login($user);
            $request->session()->regenerate();

            return redirect('/admin')->with('success', 'Invito accettato. Benvenuto nel pannello di amministrazione!');
        }

        Auth::guard('customer')->login($user);
        $request->session()->regenerate();

        return redirect()->route('home')->with('success', 'Invito accettato con successo!');
    }

    private function isExpired(User $user): bool
    {
        return $user->invitation_expires_at !== null
            && $user->invitation_expires_at->isPast();
    }
}
