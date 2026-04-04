<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Page extends Model
{
    use BelongsToStore;

    protected $fillable = [
        'store_id',
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

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
