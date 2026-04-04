<?php

namespace App\Http\Middleware;

use App\Support\Api\V1\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureApiV1Scope
{
    public function handle(Request $request, Closure $next, ...$requiredScopes): Response
    {
        $requiredScopes = $this->normalizeScopes($requiredScopes);
        if (empty($requiredScopes)) {
            return $next($request);
        }

        $grantedScopes = $this->normalizeScopes((array) $request->attributes->get('api_v1_scopes', []));
        if (in_array('*', $grantedScopes, true)) {
            return $next($request);
        }

        $missingScopes = array_values(array_diff($requiredScopes, $grantedScopes));
        if (!empty($missingScopes)) {
            return ApiResponse::error(
                code: 'insufficient_scope',
                message: 'Insufficient scope for this resource.',
                status: 403,
                errorDetails: [
                    'required' => $requiredScopes,
                    'granted' => $grantedScopes,
                    'missing' => $missingScopes,
                ]
            );
        }

        return $next($request);
    }

    /**
     * @param array<int, mixed> $scopes
     * @return array<int, string>
     */
    private function normalizeScopes(array $scopes): array
    {
        $flattened = [];

        foreach ($scopes as $scope) {
            if (!is_string($scope)) {
                continue;
            }

            $chunks = preg_split('/[\s,]+/', trim($scope)) ?: [];
            foreach ($chunks as $chunk) {
                $chunk = trim($chunk);
                if ($chunk !== '') {
                    $flattened[] = $chunk;
                }
            }
        }

        return array_values(array_unique($flattened));
    }
}
