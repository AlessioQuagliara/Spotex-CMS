<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OAuthClient extends Model
{
    use HasFactory;

    protected $table = 'oauth_clients';

    protected $fillable = [
        'store_id',
        'name',
        'client_id',
        'client_secret_hash',
        'allowed_scopes_json',
        'is_active',
        'last_used_at',
    ];

    protected $casts = [
        'allowed_scopes_json' => 'array',
        'is_active' => 'boolean',
        'last_used_at' => 'datetime',
    ];

    /**
     * @return array<int, string>
     */
    public function allowedScopes(): array
    {
        $scopes = (array) ($this->allowed_scopes_json ?? []);

        return array_values(array_unique(array_filter(
            array_map(
                static fn ($scope): string => is_string($scope) ? trim($scope) : '',
                $scopes
            ),
            static fn (string $scope): bool => $scope !== ''
        )));
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function accessTokens(): HasMany
    {
        return $this->hasMany(OAuthAccessToken::class, 'oauth_client_id');
    }
}
