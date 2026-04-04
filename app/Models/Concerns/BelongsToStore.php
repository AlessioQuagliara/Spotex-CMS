<?php

namespace App\Models\Concerns;

use App\Models\Store;
use App\Support\Tenancy\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

trait BelongsToStore
{
    public static function bootBelongsToStore(): void
    {
        static::addGlobalScope('store_scope', function (Builder $builder): void {
            $model = $builder->getModel();
            $table = $model->getTable();

            if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'store_id')) {
                return;
            }

            $storeId = static::resolveCurrentStoreId();
            if ($storeId === null) {
                return;
            }

            $builder->where($table . '.store_id', $storeId);
        });

        static::creating(function (Model $model): void {
            $table = $model->getTable();

            if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'store_id')) {
                return;
            }

            if ($model->getAttribute('store_id') !== null) {
                return;
            }

            $storeId = static::resolveCurrentStoreId()
                ?? (Schema::hasTable('stores') ? Store::query()->withoutGlobalScopes()->orderBy('id')->value('id') : null);

            if (is_numeric($storeId)) {
                $model->setAttribute('store_id', (int) $storeId);
            }
        });
    }

    public function scopeForStore(Builder $query, int $storeId): Builder
    {
        return $query->withoutGlobalScope('store_scope')->where($this->getTable() . '.store_id', $storeId);
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
