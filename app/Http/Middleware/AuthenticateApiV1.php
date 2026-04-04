<?php

namespace App\Http\Middleware;

use App\Services\Api\V1\ApiKey\ApiKeyService;
use App\Services\Api\V1\OAuth\OAuthTokenService;
use App\Support\Api\V1\ApiResponse;
use App\Support\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiV1
{
    public function __construct(
        private readonly OAuthTokenService $oauthTokenService,
        private readonly ApiKeyService $apiKeyService,
        private readonly TenantContext $tenantContext,
    ) {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $token = $this->extractToken($request);
        if ($token === null) {
            return ApiResponse::error(
                code: 'unauthenticated',
                message: 'Missing API token.',
                status: 401
            );
        }

        $oauthToken = $this->oauthTokenService->resolveAccessToken(
            plainToken: $token,
            storeId: $this->tenantContext->storeId()
        );

        if ($oauthToken !== null) {
            $request->attributes->set('api_v1_auth_mode', 'oauth');
            $request->attributes->set('api_v1_token', $token);
            $request->attributes->set('api_v1_token_id', (int) $oauthToken->id);
            $request->attributes->set('api_v1_client', (string) $oauthToken->client?->client_id);
            $request->attributes->set('api_v1_scopes', $oauthToken->scopes());

            return $next($request);
        }

        $apiKey = $this->apiKeyService->resolveKey(
            plainKey: $token,
            storeId: $this->tenantContext->storeId()
        );

        if ($apiKey !== null) {
            $request->attributes->set('api_v1_auth_mode', 'api_key');
            $request->attributes->set('api_v1_token', $token);
            $request->attributes->set('api_v1_token_id', (int) $apiKey->id);
            $request->attributes->set('api_v1_client', sprintf('api_key_%d', $apiKey->id));
            $request->attributes->set('api_v1_scopes', $apiKey->scopes());

            return $next($request);
        }

        $allowedTokens = array_values(array_filter(
            (array) config('spotex.api.v1.tokens', []),
            fn ($value) => is_string($value) && trim($value) !== ''
        ));

        if (empty($allowedTokens) || !in_array($token, $allowedTokens, true)) {
            return ApiResponse::error(
                code: 'invalid_token',
                message: 'Invalid API token.',
                status: 401
            );
        }

        // Backward-compatible static token mode: legacy clients keep full access.
        $request->attributes->set('api_v1_auth_mode', 'static');
        $request->attributes->set('api_v1_token', $token);
        $request->attributes->set('api_v1_client', substr($token, 0, 8));
        $request->attributes->set('api_v1_scopes', ['*']);

        return $next($request);
    }

    private function extractToken(Request $request): ?string
    {
        $bearer = trim((string) $request->bearerToken());
        if ($bearer !== '') {
            return $bearer;
        }

        $headerToken = trim((string) $request->header('X-Api-Token', ''));
        if ($headerToken !== '') {
            return $headerToken;
        }

        $apiKeyHeader = trim((string) $request->header('X-Api-Key', ''));
        if ($apiKeyHeader !== '') {
            return $apiKeyHeader;
        }

        return null;
    }
}
