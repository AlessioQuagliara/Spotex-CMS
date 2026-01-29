<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Address extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'name',
        'phone',
        'email',
        'address',
        'city',
        'province',
        'postal_code',
        'country',
        'company',
        'tax_id',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getFullAddress(): string
    {
        $parts = [
            $this->address,
            $this->postal_code . ' ' . $this->city,
        ];
        if ($this->province) {
            $parts[] = $this->province;
        }
        $parts[] = $this->country;
        return implode(', ', array_filter($parts));
    }
}
