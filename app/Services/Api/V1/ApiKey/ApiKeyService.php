<?php

namespace App\Services\Api\V1\ApiKey;

use App\Models\ApiKey;
use App\Services\Api\V1\OAuth\OAuthTokenService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class ApiKeyService
{
    public function __construct(private readonly OAuthTokenService $oauthTokenService)
    {
    }

    /**
     * @param array<int, string> $requestedScopes
     * @return array{api_key: string, api_key_id: int, name: string, store_id: int, scope: string}
     */
    public function issueKey(string $name, int $storeId, array $requestedScopes = []): array
    {
        if (!$this->isStorageReady()) {
            throw ApiKeyException::invalidRequest('API key storage is not initialized. Run database migrations.');
        }

        $name = trim($name);
        if ($name === '') {
            throw ApiKeyException::invalidRequest('API key name is required.');
        }

        $scopes = $this->resolveRequestedScopes($requestedScopes);

        $plainKey = $this->generatePlainKey();
        $apiKey = ApiKey::query()->create([
            'store_id' => $storeId,
            'name' => $name,
            'key_hash' => hash('sha256', $plainKey),
            'scopes_json' => $scopes,
        ]);

        return [
            'api_key' => $plainKey,
            'api_key_id' => (int) $apiKey->id,
            'name' => $apiKey->name,
            'store_id' => (int) $apiKey->store_id,
            'scope' => implode(' ', $scopes),
        ];
    }

    /**
     * @return array{api_key: string, api_key_id: int, name: string, store_id: int, scope: string}
     */
    public function rotateKey(int $apiKeyId, ?int $storeId = null): array
    {
        if (!$this->isStorageReady()) {
            throw ApiKeyException::invalidRequest('API key storage is not initialized. Run database migrations.');
        }

        /** @var ApiKey|null $current */
        $current = ApiKey::query()->find($apiKeyId);

        if ($current === null) {
            throw ApiKeyException::notFound();
        }

        if ($storeId !== null && (int) $current->store_id !== $storeId) {
            throw ApiKeyException::notFound();
        }

        if ($current->isRevoked()) {
            throw ApiKeyException::revoked();
        }

        $plainKey = $this->generatePlainKey();
        $scopePayload = $this->resolveRequestedScopes($current->scopes());

        /** @var ApiKey $newKey */
        $newKey = DB::transaction(function () use ($current, $plainKey, $scopePayload): ApiKey {
            $created = ApiKey::query()->create([
                'store_id' => (int) $current->store_id,
                'name' => $current->name,
                'key_hash' => hash('sha256', $plainKey),
                'scopes_json' => $scopePayload,
            ]);

            $current->forceFill(['revoked_at' => now()])->save();

            return $created;
        });

        return [
            'api_key' => $plainKey,
            'api_key_id' => (int) $newKey->id,
            'name' => $newKey->name,
            'store_id' => (int) $newKey->store_id,
            'scope' => implode(' ', $scopePayload),
        ];
    }

    public function revokeKey(int $apiKeyId, ?int $storeId = null): bool
    {
        if (!$this->isStorageReady()) {
            throw ApiKeyException::invalidRequest('API key storage is not initialized. Run database migrations.');
        }

        $query = ApiKey::query()->whereKey($apiKeyId);
        if ($storeId !== null) {
            $query->where('store_id', $storeId);
        }

        /** @var ApiKey|null $apiKey */
        $apiKey = $query->first();
        if ($apiKey === null) {
            throw ApiKeyException::notFound();
        }

        if ($apiKey->isRevoked()) {
            return false;
        }

        $apiKey->forceFill(['revoked_at' => now()])->save();

        return true;
    }

    public function resolveKey(string $plainKey, ?int $storeId = null): ?ApiKey
    {
        if (!$this->isStorageReady()) {
            return null;
        }

        $plainKey = trim($plainKey);
        if ($plainKey === '') {
            return null;
        }

        /** @var ApiKey|null $apiKey */
        $apiKey = ApiKey::query()
            ->where('key_hash', hash('sha256', $plainKey))
            ->whereNull('revoked_at')
            ->first();

        if ($apiKey === null) {
            return null;
        }

        if ($storeId !== null && (int) $apiKey->store_id !== $storeId) {
            return null;
        }

        $apiKey->forceFill(['last_used_at' => now()])->save();

        return $apiKey->fresh();
    }

    /**
     * @return array<int, string>
     */
    public function configuredAllowedScopes(): array
    {
        return $this->oauthTokenService->configuredAllowedScopes();
    }

    /**
     * @param array<int, string> $requestedScopes
     * @return array<int, string>
     */
    private function resolveRequestedScopes(array $requestedScopes): array
    {
        $allowedScopes = $this->configuredAllowedScopes();
        if (empty($allowedScopes)) {
            throw ApiKeyException::invalidRequest('No allowed scopes configured.');
        }

        $normalizedScopes = $this->oauthTokenService->normalizeScopes($requestedScopes);
        if (empty($normalizedScopes)) {
            return $allowedScopes;
        }

        $invalidScopes = array_values(array_diff($normalizedScopes, $allowedScopes));
        if (!empty($invalidScopes)) {
            throw ApiKeyException::invalidScope(sprintf(
                'Requested scopes not allowed: %s',
                implode(', ', $invalidScopes)
            ));
        }

        return $normalizedScopes;
    }

    private function generatePlainKey(): string
    {
        $prefix = trim((string) config('spotex.api.v1.private_keys.prefix', 'stx_pk_'));
        if ($prefix === '') {
            $prefix = 'stx_pk_';
        }

        return $prefix . Str::random(64);
    }

    private function isStorageReady(): bool
    {
        return Schema::hasTable('api_keys');
    }
}
