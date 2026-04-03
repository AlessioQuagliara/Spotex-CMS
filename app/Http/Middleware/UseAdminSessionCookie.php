<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class UseAdminSessionCookie
{
    public function handle(Request $request, Closure $next): Response
    {
        $cookieName = trim((string) config('auth.admin_session_cookie', 'spotex_admin_session'));

        if ($cookieName !== '') {
            config(['session.cookie' => $cookieName]);
        }

        return $next($request);
    }
}

