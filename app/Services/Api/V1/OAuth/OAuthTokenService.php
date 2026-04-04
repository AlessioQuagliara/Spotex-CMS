<?php

namespace App\Services\Api\V1\OAuth;

use App\Models\OAuthAccessToken;
use App\Models\OAuthClient;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class OAuthTokenService
{
    /**
     * @param array<int, string> $requestedScopes
     * @return array{
     *   access_token: string,
     *   token_type: string,
     *   expires_in: int,
     *   expires_at: string,
     *   scope: string,
     *   client_id: string
     * }
     */
    public function issueClientCredentialsToken(
        string $clientId,
        string $clientSecret,
        array $requestedScopes = [],
        ?int $storeId = null
    ): array {
        if (!$this->isOAuthStorageReady()) {
            throw OAuthException::invalidRequest('OAuth storage is not initialized. Run database migrations.');
        }

        $clientId = trim($clientId);
        $clientSecret = trim($clientSecret);

        if ($clientId === '' || $clientSecret === '') {
            throw OAuthException::invalidRequest('Missing client credentials.');
        }

        $client = OAuthClient::query()
            ->where('client_id', $clientId)
            ->where('is_active', true)
            ->first();

        if ($client === null || !Hash::check($clientSecret, $client->client_secret_hash)) {
            throw OAuthException::invalidClient();
        }

        if ($storeId !== null && $client->store_id !== null && (int) $client->store_id !== $storeId) {
            throw OAuthException::invalidClient();
        }

        $allowedScopes = $this->resolveAllowedScopesForClient($client);
        if (empty($allowedScopes)) {
            throw OAuthException::invalidRequest('OAuth client has no allowed scopes configured.');
        }

        $normalizedRequestedScopes = $this->normalizeScopes($requestedScopes);
        if (empty($normalizedRequestedScopes)) {
            $normalizedRequestedScopes = $allowedScopes;
        }

        $unknownScopes = array_values(array_diff($normalizedRequestedScopes, $allowedScopes));
        if (!empty($unknownScopes)) {
            throw OAuthException::invalidScope(sprintf(
                'Requested scopes not allowed: %s',
                implode(', ', $unknownScopes)
            ));
        }

        $plainToken = 'stxv1_' . Str::random(64);
        $tokenHash = hash('sha256', $plainToken);
        $expiresAt = now()->addMinutes((int) config('spotex.api.v1.oauth.access_token_ttl_minutes', 120));
        $effectiveStoreId = $client->store_id !== null ? (int) $client->store_id : $storeId;

        DB::transaction(function () use ($client, $tokenHash, $normalizedRequestedScopes, $expiresAt, $effectiveStoreId): void {
            OAuthAccessToken::query()->create([
                'oauth_client_id' => (int) $client->id,
                'store_id' => $effectiveStoreId,
                'token_hash' => $tokenHash,
                'scopes_json' => $normalizedRequestedScopes,
                'expires_at' => $expiresAt,
                'metadata_json' => ['grant_type' => 'client_credentials'],
            ]);

            $client->forceFill(['last_used_at' => now()])->save();
        });

        return [
            'access_token' => $plainToken,
            'token_type' => 'Bearer',
            'expires_in' => max(1, now()->diffInSeconds($expiresAt, false)),
            'expires_at' => $expiresAt->toIso8601String(),
            'scope' => implode(' ', $normalizedRequestedScopes),
            'client_id' => $client->client_id,
        ];
    }

    public function resolveAccessToken(string $plainToken, ?int $storeId = null): ?OAuthAccessToken
    {
        if (!$this->isOAuthStorageReady()) {
            return null;
        }

        $plainToken = trim($plainToken);
        if ($plainToken === '') {
            return null;
        }

        $tokenHash = hash('sha256', $plainToken);

        /** @var OAuthAccessToken|null $token */
        $token = OAuthAccessToken::query()
            ->with('client')
            ->where('token_hash', $tokenHash)
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now())
            ->first();

        if ($token === null || $token->client === null || !$token->client->is_active) {
            return null;
        }

        if ($storeId !== null && $token->store_id !== null && (int) $token->store_id !== $storeId) {
            return null;
        }

        DB::transaction(function () use ($token): void {
            $token->forceFill(['last_used_at' => now()])->save();
            $token->client->forceFill(['last_used_at' => now()])->save();
        });

        return $token->fresh('client');
    }

    /**
     * @param array<int, string> $requestedScopes
     * @return bool
     */
    public function tokenHasRequiredScopes(OAuthAccessToken $token, array $requestedScopes): bool
    {
        $requestedScopes = $this->normalizeScopes($requestedScopes);
        if (empty($requestedScopes)) {
            return true;
        }

        $scopes = $token->scopes();
        if (in_array('*', $scopes, true)) {
            return true;
        }

        return empty(array_diff($requestedScopes, $scopes));
    }

    /**
     * @param array<int, mixed>|string|null $scope
     * @return array<int, string>
     */
    public function parseScopes(array|string|null $scope): array
    {
        if (is_string($scope)) {
            if (trim($scope) === '') {
                return [];
            }

            $scope = preg_split('/[\s,]+/', trim($scope)) ?: [];
        }

        if (!is_array($scope)) {
            return [];
        }

        return $this->normalizeScopes(array_map(
            static fn ($value): string => is_string($value) ? $value : '',
            $scope
        ));
    }

    /**
     * @param array<int, string> $scopes
     * @return array<int, string>
     */
    public function normalizeScopes(array $scopes): array
    {
        return array_values(array_unique(array_filter(
            array_map(static fn (string $scope): string => trim($scope), $scopes),
            static fn (string $scope): bool => $scope !== ''
        )));
    }

    /**
     * @return array<int, string>
     */
    public function configuredAllowedScopes(): array
    {
        $scopes = (array) config('spotex.api.v1.oauth.allowed_scopes', []);

        return $this->normalizeScopes(array_map(
            static fn ($value): string => is_string($value) ? $value : '',
            $scopes
        ));
    }

    /**
     * @return array<int, string>
     */
    private function resolveAllowedScopesForClient(OAuthClient $client): array
    {
        $scopes = $client->allowedScopes();

        if (empty($scopes)) {
            $scopes = $this->configuredAllowedScopes();
        }

        return $this->normalizeScopes($scopes);
    }

    private function isOAuthStorageReady(): bool
    {
        return Schema::hasTable('oauth_clients') && Schema::hasTable('oauth_access_tokens');
    }
}
