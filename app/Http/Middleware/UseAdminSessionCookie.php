<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class UseAdminSessionCookie
{
    public function handle(Request $request, Closure $next): Response
    {
        $adminCookie = trim((string) config('auth.admin_session_cookie', 'spotex_admin_session'));
        $customerCookie = trim((string) env('SESSION_COOKIE', 'spotex_customer_session'));

        if ($this->shouldUseAdminSession($request) && $adminCookie !== '') {
            config(['session.cookie' => $adminCookie]);
        } elseif ($customerCookie !== '') {
            config(['session.cookie' => $customerCookie]);
        }

        return $next($request);
    }

    private function shouldUseAdminSession(Request $request): bool
    {
        if ($request->is('admin') || $request->is('admin/*')) {
            return true;
        }

        if ($this->isAdminReferer($request)) {
            return true;
        }

        if ($request->is('livewire/*')) {
            return $this->isAdminReferer($request);
        }

        return false;
    }

    private function isAdminReferer(Request $request): bool
    {
        $referer = trim((string) $request->headers->get('referer', ''));

        if ($referer === '') {
            return false;
        }

        $refererPath = (string) parse_url($referer, PHP_URL_PATH);
        $refererPath = ltrim($refererPath, '/');

        return $refererPath === 'admin' || str_starts_with($refererPath, 'admin/');
    }
}
