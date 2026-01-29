<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NavigationItem extends Model
{
    protected $fillable = [
        'location',
        'parent_id',
        'label',
        'url',
        'page_id',
        'category_id',
        'product_id',
        'sort_order',
        'type',
        'target',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    const LOCATIONS = [
        'header' => 'Navigazione Header',
        'footer' => 'Navigazione Footer',
    ];

    const TYPES = [
        'custom' => 'Link Personalizzato',
        'page' => 'Pagina',
        'category' => 'Categoria',
        'product' => 'Prodotto',
        'products_page' => 'Pagina Prodotti',
        'categories_page' => 'Pagina Categorie',
    ];

    const TARGETS = [
        '_self' => 'Stessa Finestra',
        '_blank' => 'Nuova Finestra',
    ];

    /**
     * Get the parent navigation item
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(NavigationItem::class, 'parent_id');
    }

    /**
     * Get the child navigation items
     */
    public function children(): HasMany
    {
        return $this->hasMany(NavigationItem::class, 'parent_id')->orderBy('sort_order');
    }

    /**
     * Get the associated page if type is 'page'
     */
    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }

    /**
     * Get the associated category if type is 'category'
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the associated product if type is 'product'
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get all items for a specific location
     */
    public function scopeByLocation($query, string $location)
    {
        return $query->where('location', $location)
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->with('children.children', 'children.page', 'children.category', 'children.product', 'page', 'category', 'product');
    }

    /**
     * Legacy static method for backward compatibility
     */
    public static function getByLocation(string $location): \Illuminate\Database\Eloquent\Collection
    {
        return static::byLocation($location)->get();
    }
}
