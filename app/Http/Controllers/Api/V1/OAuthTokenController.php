<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Api\V1\OAuth\OAuthException;
use App\Services\Api\V1\OAuth\OAuthTokenService;
use App\Support\Api\V1\ApiResponse;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\Request;

class OAuthTokenController extends Controller
{
    public function __construct(
        private readonly OAuthTokenService $oauthTokenService,
        private readonly TenantContext $tenantContext,
    ) {
    }

    public function issue(Request $request)
    {
        $validated = $request->validate([
            'grant_type' => 'required|string',
            'client_id' => 'required|string|max:120',
            'client_secret' => 'required|string|max:255',
            'scope' => 'nullable|string|max:1000',
        ]);

        if (trim((string) $validated['grant_type']) !== 'client_credentials') {
            return ApiResponse::error(
                code: 'unsupported_grant_type',
                message: 'Only client_credentials grant is supported.',
                status: 400
            );
        }

        try {
            $token = $this->oauthTokenService->issueClientCredentialsToken(
                clientId: (string) $validated['client_id'],
                clientSecret: (string) $validated['client_secret'],
                requestedScopes: $this->oauthTokenService->parseScopes($validated['scope'] ?? null),
                storeId: $this->tenantContext->storeId()
            );

            return ApiResponse::success($token);
        } catch (OAuthException $exception) {
            return ApiResponse::error(
                code: $exception->oauthErrorCode(),
                message: $exception->getMessage(),
                status: $exception->httpStatus()
            );
        }
    }
}
