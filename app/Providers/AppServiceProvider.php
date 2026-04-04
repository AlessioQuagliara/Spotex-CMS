<?php

namespace App\Providers;

use App\Models\Address;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\InventoryLevel;
use App\Models\InventoryLocation;
use App\Models\InventoryReservation;
use App\Models\NavigationItem;
use App\Models\Order;
use App\Models\Page;
use App\Models\PageModule;
use App\Models\PageTemplate;
use App\Models\Product;
use App\Models\ProductOption;
use App\Models\ProductVariant;
use App\Models\Setting;
use App\Policies\AddressPolicy;
use App\Policies\CategoryPolicy;
use App\Policies\CouponPolicy;
use App\Policies\InventoryLevelPolicy;
use App\Policies\InventoryLocationPolicy;
use App\Policies\InventoryReservationPolicy;
use App\Policies\NavigationItemPolicy;
use App\Policies\OrderPolicy;
use App\Policies\PagePolicy;
use App\Policies\ProductPolicy;
use App\Policies\ProductOptionPolicy;
use App\Policies\ProductVariantPolicy;
use App\Policies\SettingPolicy;
use App\Services\Builder\BuilderRenderCache;
use App\Support\Tenancy\TenantContext;
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
        Product::class => ProductPolicy::class,
        ProductOption::class => ProductOptionPolicy::class,
        ProductVariant::class => ProductVariantPolicy::class,
        Category::class => CategoryPolicy::class,
        Page::class => PagePolicy::class,
        Coupon::class => CouponPolicy::class,
        InventoryLocation::class => InventoryLocationPolicy::class,
        InventoryLevel::class => InventoryLevelPolicy::class,
        InventoryReservation::class => InventoryReservationPolicy::class,
        NavigationItem::class => NavigationItemPolicy::class,
        Setting::class => SettingPolicy::class,
    ];

    public function register(): void
    {
        $this->app->scoped(TenantContext::class, fn () => new TenantContext());
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
