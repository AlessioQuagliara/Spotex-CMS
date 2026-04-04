<?php

namespace App\Services\Pricing;

use App\Models\PriceListPrice;
use App\Models\ProductVariant;
use App\Models\Store;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PriceResolver
{
    /**
     * @return array{
     *   amount: float,
     *   compare_at_amount: float|null,
     *   currency: string,
     *   price_list_id: int|null,
     *   source: string
     * }
     */
    public function resolveVariantPrice(
        ProductVariant $variant,
        ?string $requestedCurrency = null,
        ?string $countryCode = null,
        string $channel = 'online'
    ): array {
        $store = Store::query()->withoutGlobalScopes()->find($variant->store_id);
        $defaultCurrency = $this->normalizeCurrency($store?->default_currency) ?? 'EUR';
        $targetCurrency = $this->resolveStoreCurrency((int) $variant->store_id, $requestedCurrency, $defaultCurrency);
        $normalizedCountry = $this->normalizeCountry($countryCode);

        $match = $this->findPriceMatch(
            variantId: (int) $variant->id,
            storeId: (int) $variant->store_id,
            currency: $targetCurrency,
            countryCode: $normalizedCountry,
            channel: $channel
        );

        if ($match === null && $targetCurrency !== $defaultCurrency) {
            $targetCurrency = $defaultCurrency;
            $match = $this->findPriceMatch(
                variantId: (int) $variant->id,
                storeId: (int) $variant->store_id,
                currency: $targetCurrency,
                countryCode: $normalizedCountry,
                channel: $channel
            );
        }

        if ($match === null) {
            return [
                'amount' => (float) $variant->price,
                'compare_at_amount' => $variant->compare_at_price !== null ? (float) $variant->compare_at_price : null,
                'currency' => $defaultCurrency,
                'price_list_id' => null,
                'source' => 'variant_fallback',
            ];
        }

        return [
            'amount' => (float) $match->amount,
            'compare_at_amount' => $match->compare_at_amount !== null ? (float) $match->compare_at_amount : null,
            'currency' => $targetCurrency,
            'price_list_id' => (int) $match->price_list_id,
            'source' => 'price_list',
        ];
    }

    public function resolveStoreCurrency(int $storeId, ?string $requestedCurrency, ?string $defaultCurrency = null): string
    {
        $resolvedDefault = $this->normalizeCurrency($defaultCurrency)
            ?? $this->normalizeCurrency(
                Store::query()->withoutGlobalScopes()->whereKey($storeId)->value('default_currency')
            )
            ?? 'EUR';

        $normalizedRequested = $this->normalizeCurrency($requestedCurrency);
        if ($normalizedRequested === null) {
            return $resolvedDefault;
        }

        if ($normalizedRequested === $resolvedDefault) {
            return $resolvedDefault;
        }

        if (!$this->isCurrencyEnabled($storeId, $normalizedRequested)) {
            return $resolvedDefault;
        }

        return $normalizedRequested;
    }

    private function findPriceMatch(
        int $variantId,
        int $storeId,
        string $currency,
        ?string $countryCode,
        string $channel
    ): ?object {
        $channel = trim($channel);

        $query = PriceListPrice::query()
            ->withoutGlobalScopes()
            ->select([
                'price_list_prices.amount',
                'price_list_prices.compare_at_amount',
                'price_lists.id as price_list_id',
                'price_lists.country_code',
                'price_lists.channel',
                'price_lists.is_default',
            ])
            ->join('price_lists', 'price_lists.id', '=', 'price_list_prices.price_list_id')
            ->where('price_list_prices.variant_id', $variantId)
            ->where('price_lists.store_id', $storeId)
            ->whereRaw('UPPER(price_lists.currency) = ?', [$currency]);

        if ($countryCode !== null) {
            $query->where(function ($builder) use ($countryCode): void {
                $builder->whereNull('price_lists.country_code')
                    ->orWhereRaw('UPPER(price_lists.country_code) = ?', [$countryCode]);
            });

            $query->orderByRaw(
                "CASE
                    WHEN UPPER(price_lists.country_code) = ? THEN 0
                    WHEN price_lists.country_code IS NULL THEN 1
                    ELSE 2
                END",
                [$countryCode]
            );
        } else {
            $query->orderByRaw(
                "CASE WHEN price_lists.country_code IS NULL THEN 0 ELSE 1 END"
            );
        }

        if ($channel !== '') {
            $query->where(function ($builder) use ($channel): void {
                $builder->whereNull('price_lists.channel')
                    ->orWhere('price_lists.channel', $channel);
            });

            $query->orderByRaw(
                "CASE
                    WHEN price_lists.channel = ? THEN 0
                    WHEN price_lists.channel IS NULL THEN 1
                    ELSE 2
                END",
                [$channel]
            );
        }

        return $query
            ->orderByDesc('price_lists.is_default')
            ->orderBy('price_lists.id')
            ->first();
    }

    private function isCurrencyEnabled(int $storeId, string $currency): bool
    {
        if (!Schema::hasTable('store_currencies')) {
            return true;
        }

        return DB::table('store_currencies')
            ->where('store_id', $storeId)
            ->whereRaw('UPPER(currency) = ?', [$currency])
            ->where('is_enabled', true)
            ->exists();
    }

    private function normalizeCurrency(?string $currency): ?string
    {
        if (!is_string($currency)) {
            return null;
        }

        $normalized = strtoupper(trim($currency));
        if ($normalized === '' || strlen($normalized) !== 3) {
            return null;
        }

        return $normalized;
    }

    private function normalizeCountry(?string $countryCode): ?string
    {
        if (!is_string($countryCode)) {
            return null;
        }

        $normalized = strtoupper(trim($countryCode));
        if ($normalized === '' || strlen($normalized) !== 2) {
            return null;
        }

        return $normalized;
    }
}
