<?php

namespace App\Helpers;

use App\Models\NavigationItem;

class NavigationHelper
{
    /**
     * Genera l'URL corretto per un elemento di navigazione
     */
    public static function getNavigationUrl(NavigationItem $item): string
    {
        return match ($item->type) {
            'page' => $item->page ? route('page.show', $item->page->slug) : '#',
            'category' => $item->category ? route('category.show', $item->category->slug) : '#',
            'product' => $item->product ? route('product.show', $item->product->slug) : '#',
            'products_page' => route('products'),
            'categories_page' => route('products'), // potrebbe avere una route specifica
            'custom' => $item->url ?? '#',
            default => '#',
        };
    }
}
