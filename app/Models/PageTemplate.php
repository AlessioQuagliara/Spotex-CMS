<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PageTemplate extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'schema_version',
        'document',
        'meta',
        'is_active',
    ];

    protected $casts = [
        'document' => 'array',
        'meta' => 'array',
        'is_active' => 'boolean',
    ];
}
