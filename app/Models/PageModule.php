<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PageModule extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'type',
        'schema_version',
        'config',
        'defaults',
        'is_active',
    ];

    protected $casts = [
        'config' => 'array',
        'defaults' => 'array',
        'is_active' => 'boolean',
    ];
}
