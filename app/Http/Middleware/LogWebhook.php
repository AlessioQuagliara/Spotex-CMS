<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LogWebhook
{
    /**
     * Middleware per loggare tutti i webhook ricevuti.
     * 
     * Utile per debugging e audit trail.
     */
    public function handle(Request $request, Closure $next)
    {
        $startTime = microtime(true);
        
        // Log incoming webhook
        Log::info('Webhook received', [
            'url' => $request->path(),
            'method' => $request->method(),
            'ip' => $request->ip(),
            'headers' => [
                'user-agent' => $request->header('User-Agent'),
                'content-type' => $request->header('Content-Type'),
            ],
        ]);

        $response = $next($request);

        // Log response time
        $duration = microtime(true) - $startTime;
        Log::info('Webhook processed', [
            'url' => $request->path(),
            'status' => $response->getStatusCode(),
            'duration_ms' => round($duration * 1000, 2),
        ]);

        return $response;
    }
}
