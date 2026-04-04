<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApiKey extends Model
{
    use HasFactory;

    protected $table = 'api_keys';

    protected $fillable = [
        'store_id',
        'name',
        'key_hash',
        'scopes_json',
        'last_used_at',
        'revoked_at',
    ];

    protected $casts = [
        'scopes_json' => 'array',
        'last_used_at' => 'datetime',
        'revoked_at' => 'datetime',
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

    public function isRevoked(): bool
    {
        return $this->revoked_at !== null;
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
