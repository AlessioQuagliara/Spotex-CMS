<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'description',
        'keywords',
        'html_content',
        'css_content',
        'js_content',
        'builder_data',
        'builder_schema_version',
        'builder_document',
        'builder_modules',
        'builder_meta',
        'is_published',
    ];

    protected $casts = [
        'builder_data' => 'array',
        'builder_document' => 'array',
        'builder_modules' => 'array',
        'builder_meta' => 'array',
        'is_published' => 'boolean',
    ];

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
