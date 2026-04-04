<?php

use App\Support\Api\V1\ApiResponse;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php'
    )
    ->withProviders([
        App\Providers\AppServiceProvider::class,
        App\Filament\AdminPanelProvider::class,
    ])
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->prependToGroup('web', App\Http\Middleware\UseAdminSessionCookie::class);
        $middleware->prependToGroup('web', App\Http\Middleware\StoreResolver::class);
        $middleware->prependToGroup('api', App\Http\Middleware\StoreResolver::class);

        $middleware->alias([
            'log-webhook' => App\Http\Middleware\LogWebhook::class,
            'store.resolver' => App\Http\Middleware\StoreResolver::class,
            'api.v1.auth' => App\Http\Middleware\AuthenticateApiV1::class,
            'api.v1.scope' => App\Http\Middleware\EnsureApiV1Scope::class,
            'api.v1.idempotency' => App\Http\Middleware\EnsureApiV1Idempotency::class,
        ]);

        // CSRF exclusion for webhook endpoints and builder API
        $middleware->validateCsrfTokens(except: [
            'api/webhooks/*',
            'api/pages/*/builder/*',
            'api/coupons/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->shouldRenderJsonWhen(function (Request $request, \Throwable $e): bool {
            if ($request->is('api/v1/*')) {
                return true;
            }

            return $request->expectsJson();
        });

        $exceptions->respond(function (SymfonyResponse $response, \Throwable $e, Request $request) {
            if (!$request->is('api/v1/*') || !$response instanceof JsonResponse) {
                return $response;
            }

            $payload = $response->getData(true);
            if (!is_array($payload) || array_key_exists('success', $payload)) {
                return $response;
            }

            $status = $response->getStatusCode();
            if ($status < 400) {
                return $response;
            }

            $errorCodeMap = [
                400 => 'bad_request',
                401 => 'unauthorized',
                403 => 'forbidden',
                404 => 'not_found',
                405 => 'method_not_allowed',
                409 => 'conflict',
                422 => 'validation_error',
                429 => 'too_many_requests',
                500 => 'internal_server_error',
                503 => 'service_unavailable',
            ];

            $error = [
                'code' => $payload['code'] ?? $errorCodeMap[$status] ?? 'error',
                'message' => $payload['message'] ?? (SymfonyResponse::$statusTexts[$status] ?? 'Request failed.'),
            ];

            if (isset($payload['errors']) && is_array($payload['errors'])) {
                $error['details'] = ['fields' => $payload['errors']];
            }

            $wrapped = response()->json([
                'success' => false,
                'error' => $error,
                'meta' => ApiResponse::baseMeta(),
            ], $status);

            $wrapped->headers->replace($response->headers->all());

            return $wrapped;
        });
    })
    ->create();
