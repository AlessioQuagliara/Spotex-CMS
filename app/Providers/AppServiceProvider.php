<?php

namespace App\Providers;

use App\Models\Address;
use App\Models\Category;
use App\Models\Order;
use App\Models\PageModule;
use App\Models\PageTemplate;
use App\Models\Product;
use App\Policies\AddressPolicy;
use App\Policies\OrderPolicy;
use App\Services\Builder\BuilderRenderCache;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    protected $policies = [
        Order::class => OrderPolicy::class,
        Address::class => AddressPolicy::class,
    ];

    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->registerPolicies();
        $this->registerBuilderInvalidationHooks();

        RateLimiter::for('stripe-webhook', function (Request $request) {
            return Limit::perMinute(60)->by($request->ip());
        });

        RateLimiter::for('paypal-webhook', function (Request $request) {
            return Limit::perMinute(60)->by($request->ip());
        });
    }

    protected function registerPolicies(): void
    {
        foreach ($this->policies as $model => $policy) {
            Gate::policy($model, $policy);
        }
    }

    protected function registerBuilderInvalidationHooks(): void
    {
        $cache = app(BuilderRenderCache::class);

        Product::saved(fn () => $cache->bumpCatalogVersion());
        Product::deleted(fn () => $cache->bumpCatalogVersion());
        Category::saved(fn () => $cache->bumpCatalogVersion());
        Category::deleted(fn () => $cache->bumpCatalogVersion());
        PageModule::saved(fn () => $cache->bumpModuleVersion());
        PageModule::deleted(fn () => $cache->bumpModuleVersion());
        PageTemplate::saved(fn () => $cache->bumpTemplateVersion());
        PageTemplate::deleted(fn () => $cache->bumpTemplateVersion());
    }
}
