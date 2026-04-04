<?php

namespace App\Services\Api\V1\Idempotency;

use App\Models\IdempotencyKey;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class IdempotencyService
{
    public function isEnabled(): bool
    {
        return (bool) config('spotex.api.v1.idempotency.enabled', true);
    }

    /**
     * @return array<int, string>
     */
    public function requiredMethods(): array
    {
        $methods = (array) config('spotex.api.v1.idempotency.required_methods', ['POST', 'PATCH', 'PUT']);

        return array_values(array_unique(array_filter(array_map(
            static fn ($value): string => strtoupper(trim((string) $value)),
            $methods
        ), static fn (string $method): bool => $method !== '')));
    }

    public function requiresIdempotencyForMethod(string $method): bool
    {
        return in_array(strtoupper(trim($method)), $this->requiredMethods(), true);
    }

    public function keyHeader(): string
    {
        return (string) config('spotex.api.v1.idempotency.header', 'Idempotency-Key');
    }

    public function keyMaxLength(): int
    {
        return max(32, (int) config('spotex.api.v1.idempotency.key_max_length', 255));
    }

    public function ttlHours(): int
    {
        return max(1, (int) config('spotex.api.v1.idempotency.ttl_hours', 24));
    }

    public function extractKeyFromRequest(Request $request): ?string
    {
        $key = trim((string) $request->header($this->keyHeader(), ''));

        return $key !== '' ? $key : null;
    }

    public function storageReady(): bool
    {
        return Schema::hasTable('idempotency_keys');
    }

    public function computeRequestHash(Request $request): string
    {
        $query = Arr::sortRecursive((array) $request->query());

        $payload = [
            'method' => strtoupper($request->method()),
            'path' => '/' . ltrim($request->path(), '/'),
            'query' => $query,
            'body' => (string) $request->getContent(),
            'content_type' => (string) $request->header('Content-Type', ''),
        ];

        return hash('sha256', json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    /**
     * @return array{state: 'acquired'|'replay'|'conflict'|'in_progress', record?: IdempotencyKey, response?: JsonResponse}
     */
    public function begin(int $storeId, string $key, string $requestHash): array
    {
        $existing = $this->lookup($storeId, $key);

        if ($existing !== null && $existing->isExpired()) {
            $existing->delete();
            $existing = null;
        }

        if ($existing !== null) {
            if (!hash_equals((string) $existing->request_hash, $requestHash)) {
                return ['state' => 'conflict', 'record' => $existing];
            }

            if ($existing->hasStoredResponse()) {
                return [
                    'state' => 'replay',
                    'record' => $existing,
                    'response' => $this->buildReplayResponse($existing),
                ];
            }

            return ['state' => 'in_progress', 'record' => $existing];
        }

        try {
            $record = IdempotencyKey::query()->create([
                'store_id' => $storeId,
                'idempotency_key' => $key,
                'request_hash' => $requestHash,
                'expires_at' => now()->addHours($this->ttlHours()),
            ]);

            return ['state' => 'acquired', 'record' => $record];
        } catch (QueryException $exception) {
            if (!$this->isUniqueViolation($exception)) {
                throw $exception;
            }

            return $this->begin($storeId, $key, $requestHash);
        }
    }

    public function finalize(IdempotencyKey $record, Response $response): void
    {
        $payload = $this->extractJsonPayload($response);
        $headers = $this->extractReplayHeaders($response);

        $record->forceFill([
            'response_json' => $payload,
            'response_status' => $response->getStatusCode(),
            'response_headers_json' => $headers,
        ])->save();
    }

    public function release(IdempotencyKey $record): void
    {
        $record->delete();
    }

    public function buildReplayResponse(IdempotencyKey $record): JsonResponse
    {
        $payload = is_array($record->response_json) ? $record->response_json : [];
        $status = is_int($record->response_status) ? $record->response_status : 200;

        $response = response()->json($payload, $status);

        foreach ((array) ($record->response_headers_json ?? []) as $name => $value) {
            if (is_string($name) && is_string($value) && $name !== '') {
                $response->headers->set($name, $value);
            }
        }

        $response->headers->set('Idempotency-Replayed', 'true');
        $response->headers->set($this->keyHeader(), (string) $record->idempotency_key);

        return $response;
    }

    public function pruneExpired(?int $storeId = null, int $limit = 1000): int
    {
        $query = IdempotencyKey::query()
            ->where('expires_at', '<=', now())
            ->orderBy('id')
            ->limit(max(1, $limit))
            ->select('id');

        if ($storeId !== null) {
            $query->where('store_id', $storeId);
        }

        $ids = $query->pluck('id')->all();
        if (empty($ids)) {
            return 0;
        }

        return IdempotencyKey::query()->whereIn('id', $ids)->delete();
    }

    private function lookup(int $storeId, string $key): ?IdempotencyKey
    {
        return IdempotencyKey::query()
            ->where('store_id', $storeId)
            ->where('idempotency_key', $key)
            ->first();
    }

    private function isUniqueViolation(QueryException $exception): bool
    {
        $sqlState = (string) ($exception->errorInfo[0] ?? '');
        $driverErrorCode = (string) ($exception->errorInfo[1] ?? '');

        return in_array($sqlState, ['23000', '23505'], true)
            || $driverErrorCode === '19';
    }

    /**
     * @return array<string, mixed>
     */
    private function extractJsonPayload(Response $response): array
    {
        if ($response instanceof JsonResponse) {
            $decoded = $response->getData(true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        $content = (string) $response->getContent();
        $decoded = json_decode($content, true);

        if (is_array($decoded)) {
            return $decoded;
        }

        return ['raw' => $content];
    }

    /**
     * @return array<string, string>
     */
    private function extractReplayHeaders(Response $response): array
    {
        $headers = [];

        $contentType = $response->headers->get('Content-Type');
        if (is_string($contentType) && $contentType !== '') {
            $headers['Content-Type'] = $contentType;
        }

        return $headers;
    }
}
