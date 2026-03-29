<?php

namespace App\Services\Builder;

use App\Models\Category;
use App\Models\Page;
use App\Models\Product;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class BuilderDocumentRenderer
{
    public function __construct(private readonly BuilderRenderCache $cache)
    {
    }

    public function renderPage(Page $page): array
    {
        return Cache::remember(
            $this->cache->pageCacheKey($page),
            now()->addHours(6),
            fn () => $this->renderDocument(is_array($page->builder_document) ? $page->builder_document : []),
        );
    }

    public function renderDocument(array $document): array
    {
        if (!isset($document['ROOT']) || !is_array($document['ROOT'])) {
            return [
                'html' => '',
                'css' => '',
                'js' => '',
            ];
        }

        return [
            'html' => collect($document['ROOT']['nodes'] ?? [])
                ->map(fn ($nodeId) => $this->renderNode($document, (string) $nodeId))
                ->implode("\n"),
            'css' => '',
            'js' => '',
        ];
    }

    private function renderNode(array $document, string $nodeId): string
    {
        $node = $document[$nodeId] ?? null;

        if (!is_array($node)) {
            return '';
        }

        $resolvedName = $this->normalizeType($node['type']['resolvedName'] ?? 'TextBlock');
        $props = is_array($node['props'] ?? null) ? $node['props'] : [];
        $children = collect($node['nodes'] ?? [])
            ->map(fn ($childId) => $this->renderNode($document, (string) $childId))
            ->implode('');

        return match ($resolvedName) {
            'CraftRoot' => $children,
            'SectionBlock' => $this->renderSection($props, $children),
            'ButtonBlock' => $this->renderButton($props),
            'ImageBlock' => $this->renderImage($props),
            'ProductGridBlock' => $this->renderProductGrid($props),
            'CategoryFeedBlock' => $this->renderCategoryFeed($props),
            default => $this->renderText($props),
        };
    }

    private function normalizeType(string $type): string
    {
        return match ($type) {
            'Canvas' => 'CraftRoot',
            'Text' => 'TextBlock',
            'Section' => 'SectionBlock',
            'Button' => 'ButtonBlock',
            'Image' => 'ImageBlock',
            'ProductGrid' => 'ProductGridBlock',
            'CategoryFeed' => 'CategoryFeedBlock',
            default => $type,
        };
    }

    private function renderSection(array $props, string $children): string
    {
        return sprintf(
            '<section style="background:%s;padding:%dpx;border-radius:%dpx;">%s</section>',
            $this->escape($props['background'] ?? '#ffffff'),
            $this->toInt($props['padding'] ?? 24, 24),
            $this->toInt($props['radius'] ?? 16, 16),
            $children,
        );
    }

    private function renderText(array $props): string
    {
        return sprintf(
            '<div style="color:%s;font-size:%dpx;">%s</div>',
            $this->escape($props['color'] ?? '#111827'),
            $this->toInt($props['fontSize'] ?? 18, 18),
            nl2br($this->escape($props['text'] ?? '')),
        );
    }

    private function renderButton(array $props): string
    {
        return sprintf(
            '<a href="%s" style="display:inline-flex;background:%s;color:%s;border-radius:%dpx;padding:12px 20px;text-decoration:none;font-weight:600;">%s</a>',
            $this->escape($props['href'] ?? '#'),
            $this->escape($props['background'] ?? '#0f172a'),
            $this->escape($props['color'] ?? '#ffffff'),
            $this->toInt($props['radius'] ?? 999, 999),
            $this->escape($props['label'] ?? 'Button'),
        );
    }

    private function renderImage(array $props): string
    {
        return sprintf(
            '<img src="%s" alt="%s" style="width:100%%;border-radius:%dpx;" />',
            $this->escape($props['src'] ?? ''),
            $this->escape($props['alt'] ?? ''),
            $this->toInt($props['radius'] ?? 24, 24),
        );
    }

    private function renderProductGrid(array $props): string
    {
        $columns = max(1, min(4, $this->toInt($props['columns'] ?? 3, 3)));
        $products = $this->resolveProducts($props);

        $items = $products->map(function (Product $product): string {
            $image = $this->imageUrl($product->primaryImage?->image_path);
            $description = Str::limit(strip_tags((string) $product->description), 120);

            return sprintf(
                '<article style="display:flex;flex-direction:column;gap:12px;border:1px solid #e2e8f0;border-radius:20px;padding:18px;background:#ffffff;">%s<div style="display:flex;flex-direction:column;gap:8px;"><div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;">%s</div><h3 style="margin:0;font-size:20px;color:#0f172a;">%s</h3><p style="margin:0;color:#475569;">%s</p><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;"><strong style="font-size:18px;color:#0f172a;">EUR %s</strong><a href="%s" style="color:#0f172a;font-weight:600;text-decoration:none;">Apri prodotto</a></div></div></article>',
                $image ? sprintf('<img src="%s" alt="%s" style="width:100%%;aspect-ratio:4/3;object-fit:cover;border-radius:16px;" />', $this->escape($image), $this->escape($product->name)) : '',
                $this->escape($product->category?->name ?? 'Catalogo'),
                $this->escape($product->name),
                $this->escape($description),
                number_format((float) $product->price, 2, ',', '.'),
                route('product.show', $product),
            );
        })->implode('');

        $heading = $this->escape($props['heading'] ?? 'Griglia prodotti');
        $empty = $this->escape($props['emptyText'] ?? 'Nessun prodotto disponibile.');

        return sprintf(
            '<section data-module="product-grid" style="display:grid;gap:20px;"><div><h2 style="margin:0 0 8px;font-size:32px;color:#0f172a;">%s</h2></div>%s</section>',
            $heading,
            $items !== ''
                ? sprintf('<div style="display:grid;grid-template-columns:repeat(%d,minmax(0,1fr));gap:18px;">%s</div>', $columns, $items)
                : sprintf('<p style="margin:0;color:#64748b;">%s</p>', $empty),
        );
    }

    private function renderCategoryFeed(array $props): string
    {
        $categories = $this->resolveCategories($props);
        $heading = $this->escape($props['heading'] ?? 'Categorie in evidenza');
        $empty = $this->escape($props['emptyText'] ?? 'Nessuna categoria disponibile.');

        $items = $categories->map(function (Category $category): string {
            return sprintf(
                '<a href="%s" style="display:flex;flex-direction:column;gap:10px;border:1px solid #dbeafe;border-radius:18px;padding:18px;background:linear-gradient(180deg,#f8fbff 0%%,#eef6ff 100%%);text-decoration:none;"><span style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#2563eb;">%d prodotti</span><strong style="font-size:20px;color:#0f172a;">%s</strong><span style="color:#475569;">%s</span></a>',
                route('category.show', $category),
                (int) $category->products_count,
                $this->escape($category->name),
                $this->escape(Str::limit((string) $category->description, 120) ?: 'Vai alla categoria'),
            );
        })->implode('');

        return sprintf(
            '<section data-module="category-feed" style="display:grid;gap:20px;"><div><h2 style="margin:0 0 8px;font-size:32px;color:#0f172a;">%s</h2></div>%s</section>',
            $heading,
            $items !== ''
                ? sprintf('<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;">%s</div>', $items)
                : sprintf('<p style="margin:0;color:#64748b;">%s</p>', $empty),
        );
    }

    private function resolveProducts(array $props)
    {
        $query = Product::query()
            ->where('is_active', true)
            ->with(['category:id,name,slug', 'primaryImage:id,product_id,image_path,alt_text']);

        $categoryId = $this->nullableInt($props['categoryId'] ?? null);
        $categorySlug = trim((string) ($props['categorySlug'] ?? ''));

        if ($categoryId !== null) {
            $query->where('category_id', $categoryId);
        } elseif ($categorySlug !== '') {
            $query->whereHas('category', fn ($builder) => $builder->where('slug', $categorySlug));
        }

        match ($props['sortBy'] ?? 'latest') {
            'price_asc' => $query->orderBy('price'),
            'price_desc' => $query->orderByDesc('price'),
            'name' => $query->orderBy('name'),
            default => $query->latest('id'),
        };

        return $query->limit(max(1, min(24, $this->toInt($props['limit'] ?? 6, 6))))->get();
    }

    private function resolveCategories(array $props)
    {
        $query = Category::query()->withCount(['products' => fn ($builder) => $builder->where('is_active', true)]);

        $parentId = $this->nullableInt($props['parentCategoryId'] ?? null);

        if ($parentId !== null) {
            $query->where('parent_id', $parentId);
        }

        return $query
            ->orderBy('order')
            ->orderBy('name')
            ->limit(max(1, min(24, $this->toInt($props['limit'] ?? 6, 6))))
            ->get();
    }

    private function imageUrl(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        if (Str::startsWith($path, ['http://', 'https://', '/storage/'])) {
            return $path;
        }

        return asset('storage/' . ltrim($path, '/'));
    }

    private function toInt(mixed $value, int $default): int
    {
        return is_numeric($value) ? (int) $value : $default;
    }

    private function nullableInt(mixed $value): ?int
    {
        return is_numeric($value) ? (int) $value : null;
    }

    private function escape(mixed $value): string
    {
        return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
    }
}
