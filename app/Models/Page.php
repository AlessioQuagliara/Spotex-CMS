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
        'is_published',
    ];

    protected $casts = [
        'builder_data' => 'array',
        'is_published' => 'boolean',
    ];

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
