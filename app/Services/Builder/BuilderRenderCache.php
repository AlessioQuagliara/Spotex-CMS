<?php

namespace App\Services\Builder;

use App\Models\Page;
use Illuminate\Support\Facades\Cache;

class BuilderRenderCache
{
    private const CATALOG_VERSION_KEY = 'builder-render:catalog-version';
    private const MODULE_VERSION_KEY = 'builder-render:module-version';
    private const TEMPLATE_VERSION_KEY = 'builder-render:template-version';

    public function pageCacheKey(Page $page): string
    {
        return implode(':', [
            'builder-render',
            'page',
            $page->getKey(),
            md5(json_encode($page->builder_document ?? [])),
            $page->builder_schema_version ?? 'craft-v1',
            optional($page->updated_at)?->timestamp ?? 0,
            $this->catalogVersion(),
            $this->moduleVersion(),
            $this->templateVersion(),
        ]);
    }

    public function catalogVersion(): int
    {
        return (int) Cache::get(self::CATALOG_VERSION_KEY, 1);
    }

    public function moduleVersion(): int
    {
        return (int) Cache::get(self::MODULE_VERSION_KEY, 1);
    }

    public function templateVersion(): int
    {
        return (int) Cache::get(self::TEMPLATE_VERSION_KEY, 1);
    }

    public function bumpCatalogVersion(): void
    {
        $this->bump(self::CATALOG_VERSION_KEY);
    }

    public function bumpModuleVersion(): void
    {
        $this->bump(self::MODULE_VERSION_KEY);
    }

    public function bumpTemplateVersion(): void
    {
        $this->bump(self::TEMPLATE_VERSION_KEY);
    }

    private function bump(string $key): void
    {
        Cache::forever($key, ((int) Cache::get($key, 1)) + 1);
    }
}
