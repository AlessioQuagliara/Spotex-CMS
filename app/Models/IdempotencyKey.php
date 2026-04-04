<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IdempotencyKey extends Model
{
    use HasFactory;

    protected $table = 'idempotency_keys';

    protected $fillable = [
        'store_id',
        'idempotency_key',
        'request_hash',
        'response_json',
        'response_status',
        'response_headers_json',
        'expires_at',
    ];

    protected $casts = [
        'response_json' => 'array',
        'response_headers_json' => 'array',
        'response_status' => 'integer',
        'expires_at' => 'datetime',
    ];

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public function hasStoredResponse(): bool
    {
        return is_array($this->response_json) && $this->response_status !== null;
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
