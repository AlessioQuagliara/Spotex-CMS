<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use App\Support\Tenancy\TenantContext;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Schema;

class Setting extends Model
{
    use BelongsToStore;

    protected $fillable = ['store_id', 'key', 'value'];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public static function get($key, $default = null)
    {
        if (!Schema::hasTable('settings')) {
            return $default;
        }

        $setting = static::resolveScopedSetting((string) $key);

        if (!$setting) {
            return $default;
        }

        $decoded = json_decode((string) $setting->value, true);

        return $decoded !== null ? $decoded : $setting->value;
    }

    public static function set($key, $value): void
    {
        if (!Schema::hasTable('settings')) {
            return;
        }

        $attributes = ['key' => (string) $key];

        if (Schema::hasColumn('settings', 'store_id')) {
            $attributes['store_id'] = static::resolveCurrentStoreId();
        }

        static::updateOrCreate(
            $attributes,
            ['value' => is_array($value) ? json_encode($value) : $value]
        );
    }

    private static function resolveScopedSetting(string $key): ?self
    {
        $query = static::query()->where('key', $key);

        if (!Schema::hasColumn('settings', 'store_id')) {
            return $query->first();
        }

        $storeId = static::resolveCurrentStoreId();

        if ($storeId !== null) {
            return $query
                ->where(function ($builder) use ($storeId): void {
                    $builder
                        ->where('store_id', $storeId)
                        ->orWhereNull('store_id');
                })
                ->orderByRaw('CASE WHEN store_id IS NULL THEN 1 ELSE 0 END')
                ->first();
        }

        return $query->whereNull('store_id')->first();
    }

    private static function resolveCurrentStoreId(): ?int
    {
        if (!app()->bound(TenantContext::class)) {
            return null;
        }

        /** @var TenantContext $context */
        $context = app(TenantContext::class);

        return $context->storeId();
    }
}
