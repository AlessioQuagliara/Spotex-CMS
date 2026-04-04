<?php

namespace App\Http\Middleware;

use App\Models\Store;
use App\Models\StoreDomain;
use App\Support\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class StoreResolver
{
    public function handle(Request $request, Closure $next): Response
    {
        $context = app(TenantContext::class);
        $context->clear();

        if (!$this->canResolveStore()) {
            return $next($request);
        }

        $store = $this->resolveFromDomain($request)
            ?? $this->resolveFromSubdomain($request)
            ?? $this->resolveFromPath($request)
            ?? $this->resolveFromHeader($request)
            ?? $this->resolveFallbackStore();

        if ($store !== null) {
            $context->setStore($store);
            $request->attributes->set('current_store', $store);
            $request->attributes->set('current_store_id', $store->id);
            $request->attributes->set('current_store_slug', $store->slug);
        }

        return $next($request);
    }

    private function canResolveStore(): bool
    {
        return Schema::hasTable('stores') && Schema::hasTable('store_domains');
    }

    private function resolveFromDomain(Request $request): ?Store
    {
        $host = strtolower(trim($request->getHost()));

        if ($host === '') {
            return null;
        }

        $domain = StoreDomain::query()
            ->with('store')
            ->whereRaw('LOWER(domain) = ?', [$host])
            ->first();

        if (!$domain?->store || $domain->store->status !== Store::STATUS_ACTIVE) {
            return null;
        }

        return $domain->store;
    }

    private function resolveFromSubdomain(Request $request): ?Store
    {
        $baseDomain = strtolower(trim((string) config('spotex.tenancy.base_domain')));
        $host = strtolower(trim($request->getHost()));

        if ($baseDomain === '' || $host === '' || !str_ends_with($host, '.' . $baseDomain)) {
            return null;
        }

        $slug = str_replace('.' . $baseDomain, '', $host);
        if ($slug === '') {
            return null;
        }

        return Store::query()
            ->where('slug', $slug)
            ->where('status', Store::STATUS_ACTIVE)
            ->first();
    }

    private function resolveFromPath(Request $request): ?Store
    {
        if (!config('spotex.tenancy.path_prefix_enabled', true)) {
            return null;
        }

        $segments = $request->segments();
        $prefix = strtolower(trim((string) config('spotex.tenancy.path_prefix', 's')));

        if (!isset($segments[0], $segments[1]) || strtolower($segments[0]) !== $prefix) {
            return null;
        }

        return Store::query()
            ->where('slug', $segments[1])
            ->where('status', Store::STATUS_ACTIVE)
            ->first();
    }

    private function resolveFromHeader(Request $request): ?Store
    {
        if (!config('spotex.tenancy.allow_header_resolution', true)) {
            return null;
        }

        $environments = (array) config('spotex.tenancy.header_resolution_environments', ['local', 'testing']);
        if (!App::environment($environments)) {
            return null;
        }

        $slug = trim((string) $request->header('X-Store-Slug', ''));
        if ($slug !== '') {
            $store = Store::query()
                ->where('slug', $slug)
                ->where('status', Store::STATUS_ACTIVE)
                ->first();

            if ($store !== null) {
                return $store;
            }
        }

        $storeId = $request->header('X-Store-Id');
        if (!is_numeric($storeId)) {
            return null;
        }

        return Store::query()
            ->where('id', (int) $storeId)
            ->where('status', Store::STATUS_ACTIVE)
            ->first();
    }

    private function resolveFallbackStore(): ?Store
    {
        if (!config('spotex.tenancy.fallback_to_default_store', true)) {
            return null;
        }

        return Store::query()
            ->where('status', Store::STATUS_ACTIVE)
            ->orderBy('id')
            ->first();
    }
}
