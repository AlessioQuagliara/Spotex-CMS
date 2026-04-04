<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OAuthAccessToken extends Model
{
    use HasFactory;

    protected $table = 'oauth_access_tokens';

    protected $fillable = [
        'oauth_client_id',
        'store_id',
        'token_hash',
        'scopes_json',
        'expires_at',
        'revoked_at',
        'last_used_at',
        'metadata_json',
    ];

    protected $casts = [
        'scopes_json' => 'array',
        'metadata_json' => 'array',
        'expires_at' => 'datetime',
        'revoked_at' => 'datetime',
        'last_used_at' => 'datetime',
    ];

    /**
     * @return array<int, string>
     */
    public function scopes(): array
    {
        $scopes = (array) ($this->scopes_json ?? []);

        return array_values(array_unique(array_filter(
            array_map(
                static fn ($scope): string => is_string($scope) ? trim($scope) : '',
                $scopes
            ),
            static fn (string $scope): bool => $scope !== ''
        )));
    }

    public function hasScope(string $scope): bool
    {
        $scope = trim($scope);
        if ($scope === '') {
            return false;
        }

        $scopes = $this->scopes();

        return in_array('*', $scopes, true) || in_array($scope, $scopes, true);
    }

    public function isRevoked(): bool
    {
        return $this->revoked_at !== null;
    }

    public function isExpired(): bool
    {
        return $this->expires_at === null || $this->expires_at->isPast();
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(OAuthClient::class, 'oauth_client_id');
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
