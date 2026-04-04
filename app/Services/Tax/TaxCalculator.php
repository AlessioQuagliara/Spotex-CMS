<?php

namespace App\Services\Tax;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TaxCalculator
{
    /**
     * @param array<int, array{
     *   key?: string,
     *   product_id?: int|null,
     *   tax_class_id?: int|null,
     *   unit_price: float|int|string,
     *   quantity: int
     * }> $lines
     * @return array{
     *   subtotal: float,
     *   tax_total: float,
     *   total: float,
     *   items: array<int, array{
     *     key: string,
     *     tax_class_id: int|null,
     *     tax_rate_snapshot: float,
     *     tax_amount: float,
     *     is_inclusive: bool
     *   }>
     * }
     */
    public function calculateForLines(
        int $storeId,
        array $lines,
        ?string $countryCode = null,
        ?string $regionCode = null,
        ?string $postalCode = null
    ): array {
        $country = $this->normalizeCountry($countryCode);
        $region = $this->normalizeRegion($regionCode);
        $postal = $this->normalizePostal($postalCode);

        $subtotal = 0.0;
        $taxTotal = 0.0;
        $items = [];

        if ($country === null) {
            foreach ($lines as $index => $line) {
                $lineSubtotal = round(((float) $line['unit_price']) * max(1, (int) $line['quantity']), 2);
                $subtotal += $lineSubtotal;

                $items[] = [
                    'key' => (string) ($line['key'] ?? $index),
                    'tax_class_id' => is_numeric($line['tax_class_id'] ?? null) ? (int) $line['tax_class_id'] : null,
                    'tax_rate_snapshot' => 0.0,
                    'tax_amount' => 0.0,
                    'is_inclusive' => false,
                ];
            }

            $subtotal = round($subtotal, 2);

            return [
                'subtotal' => $subtotal,
                'tax_total' => 0.0,
                'total' => $subtotal,
                'items' => $items,
            ];
        }

        $classIds = collect($lines)
            ->pluck('tax_class_id')
            ->filter(fn ($value) => is_numeric($value))
            ->map(fn ($value) => (int) $value)
            ->unique()
            ->values()
            ->all();

        $rates = $this->loadCandidateRates($storeId, $country, $classIds);

        foreach ($lines as $index => $line) {
            $lineSubtotal = round(((float) $line['unit_price']) * max(1, (int) $line['quantity']), 2);
            $subtotal += $lineSubtotal;

            $taxClassId = is_numeric($line['tax_class_id'] ?? null) ? (int) $line['tax_class_id'] : null;
            $rate = $this->resolveBestRate($rates, $taxClassId, $region, $postal);

            $rateValue = $rate !== null ? (float) $rate->rate : 0.0;
            $inclusive = $rate !== null ? (bool) $rate->is_inclusive : false;
            $taxAmount = $this->calculateTaxAmount($lineSubtotal, $rateValue, $inclusive);
            $taxTotal += $taxAmount;

            $items[] = [
                'key' => (string) ($line['key'] ?? $index),
                'tax_class_id' => $taxClassId,
                'tax_rate_snapshot' => $rateValue,
                'tax_amount' => $taxAmount,
                'is_inclusive' => $inclusive,
            ];
        }

        $subtotal = round($subtotal, 2);
        $taxTotal = round($taxTotal, 2);

        return [
            'subtotal' => $subtotal,
            'tax_total' => $taxTotal,
            'total' => round($subtotal + $taxTotal, 2),
            'items' => $items,
        ];
    }

    /**
     * @param array<int> $classIds
     */
    private function loadCandidateRates(int $storeId, string $countryCode, array $classIds): Collection
    {
        return DB::table('tax_rates as tr')
            ->join('tax_zones as tz', 'tz.id', '=', 'tr.tax_zone_id')
            ->where('tr.store_id', $storeId)
            ->whereRaw('UPPER(tz.country_code) = ?', [$countryCode])
            ->where(function ($query) use ($classIds): void {
                $query->whereNull('tr.tax_class_id');

                if (!empty($classIds)) {
                    $query->orWhereIn('tr.tax_class_id', $classIds);
                }
            })
            ->select([
                'tr.id',
                'tr.tax_class_id',
                'tr.rate',
                'tr.is_inclusive',
                'tr.priority',
                'tz.region_code',
                'tz.postal_pattern',
            ])
            ->orderBy('tr.priority')
            ->orderBy('tr.id')
            ->get();
    }

    private function resolveBestRate(Collection $rates, ?int $taxClassId, ?string $regionCode, ?string $postalCode): ?object
    {
        $ranked = $rates
            ->filter(function ($rate) use ($taxClassId, $regionCode, $postalCode): bool {
                $rateClassId = is_numeric($rate->tax_class_id) ? (int) $rate->tax_class_id : null;
                if ($rateClassId !== null && $taxClassId !== null && $rateClassId !== $taxClassId) {
                    return false;
                }

                if ($rateClassId !== null && $taxClassId === null) {
                    return false;
                }

                if (!$this->matchesRegion($rate->region_code, $regionCode)) {
                    return false;
                }

                if (!$this->matchesPostal($rate->postal_pattern, $postalCode)) {
                    return false;
                }

                return true;
            })
            ->map(function ($rate) use ($taxClassId, $regionCode, $postalCode): array {
                $rateClassId = is_numeric($rate->tax_class_id) ? (int) $rate->tax_class_id : null;

                return [
                    'rate' => $rate,
                    'class_score' => $rateClassId !== null && $taxClassId !== null && $rateClassId === $taxClassId ? 2 : 1,
                    'region_score' => $this->scoreRegion($rate->region_code, $regionCode),
                    'postal_score' => $this->scorePostal($rate->postal_pattern, $postalCode),
                ];
            })
            ->sort(function (array $left, array $right): int {
                if ($left['class_score'] !== $right['class_score']) {
                    return $right['class_score'] <=> $left['class_score'];
                }

                if ($left['region_score'] !== $right['region_score']) {
                    return $right['region_score'] <=> $left['region_score'];
                }

                if ($left['postal_score'] !== $right['postal_score']) {
                    return $right['postal_score'] <=> $left['postal_score'];
                }

                if ((int) $left['rate']->priority !== (int) $right['rate']->priority) {
                    return (int) $left['rate']->priority <=> (int) $right['rate']->priority;
                }

                return (int) $left['rate']->id <=> (int) $right['rate']->id;
            })
            ->values();

        if ($ranked->isEmpty()) {
            return null;
        }

        return $ranked->first()['rate'];
    }

    private function calculateTaxAmount(float $baseAmount, float $ratePercent, bool $inclusive): float
    {
        if ($ratePercent <= 0) {
            return 0.0;
        }

        if ($inclusive) {
            $taxAmount = $baseAmount - ($baseAmount / (1 + ($ratePercent / 100)));
            return round($taxAmount, 2);
        }

        return round($baseAmount * ($ratePercent / 100), 2);
    }

    private function matchesRegion(?string $zoneRegion, ?string $targetRegion): bool
    {
        $normalizedZoneRegion = $this->normalizeRegion($zoneRegion);
        if ($normalizedZoneRegion === null) {
            return true;
        }

        return $targetRegion !== null && $normalizedZoneRegion === $targetRegion;
    }

    private function matchesPostal(?string $postalPattern, ?string $targetPostal): bool
    {
        if ($postalPattern === null || trim($postalPattern) === '') {
            return true;
        }

        if ($targetPostal === null) {
            return false;
        }

        $pattern = trim($postalPattern);
        $regex = '/^' . str_replace('\*', '.*', preg_quote($pattern, '/')) . '$/i';

        return preg_match($regex, $targetPostal) === 1;
    }

    private function scoreRegion(?string $zoneRegion, ?string $targetRegion): int
    {
        $normalizedZoneRegion = $this->normalizeRegion($zoneRegion);
        if ($normalizedZoneRegion === null) {
            return 0;
        }

        return $targetRegion !== null && $normalizedZoneRegion === $targetRegion ? 2 : 0;
    }

    private function scorePostal(?string $postalPattern, ?string $targetPostal): int
    {
        if ($postalPattern === null || trim($postalPattern) === '') {
            return 0;
        }

        return $this->matchesPostal($postalPattern, $targetPostal) ? 3 : 0;
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

    private function normalizeRegion(?string $regionCode): ?string
    {
        if (!is_string($regionCode)) {
            return null;
        }

        $normalized = strtoupper(trim($regionCode));
        return $normalized === '' ? null : $normalized;
    }

    private function normalizePostal(?string $postalCode): ?string
    {
        if (!is_string($postalCode)) {
            return null;
        }

        $normalized = strtoupper(trim($postalCode));
        return $normalized === '' ? null : $normalized;
    }
}
