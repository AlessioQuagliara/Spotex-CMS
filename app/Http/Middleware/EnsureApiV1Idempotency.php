<?php

namespace App\Http\Middleware;

use App\Models\IdempotencyKey;
use App\Services\Api\V1\Idempotency\IdempotencyService;
use App\Support\Api\V1\ApiResponse;
use App\Support\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureApiV1Idempotency
{
    public function __construct(
        private readonly IdempotencyService $idempotencyService,
        private readonly TenantContext $tenantContext,
    ) {
    }

    public function handle(Request $request, Closure $next): Response
    {
        if (!$this->idempotencyService->isEnabled()) {
            return $next($request);
        }

        if (!$this->idempotencyService->requiresIdempotencyForMethod($request->method())) {
            return $next($request);
        }

        if (!$this->idempotencyService->storageReady()) {
            return ApiResponse::error(
                code: 'idempotency_unavailable',
                message: 'Idempotency storage is not initialized. Run database migrations.',
                status: 503
            );
        }

        $key = $this->idempotencyService->extractKeyFromRequest($request);
        if ($key === null) {
            return ApiResponse::error(
                code: 'idempotency_key_required',
                message: 'Idempotency-Key header is required for write requests.',
                status: 400
            );
        }

        if (strlen($key) > $this->idempotencyService->keyMaxLength()) {
            return ApiResponse::error(
                code: 'invalid_idempotency_key',
                message: 'Idempotency-Key is too long.',
                status: 400,
                errorDetails: [
                    'max_length' => $this->idempotencyService->keyMaxLength(),
                ]
            );
        }

        $storeId = $this->tenantContext->storeId();
        if ($storeId === null) {
            return ApiResponse::error(
                code: 'store_context_required',
                message: 'Store context is required for idempotent write operations.',
                status: 400
            );
        }

        $requestHash = $this->idempotencyService->computeRequestHash($request);
        $resolution = $this->idempotencyService->begin($storeId, $key, $requestHash);

        if ($resolution['state'] === 'replay' && isset($resolution['response'])) {
            return $resolution['response'];
        }

        if ($resolution['state'] === 'conflict') {
            return ApiResponse::error(
                code: 'idempotency_conflict',
                message: 'Idempotency-Key has already been used with a different request payload.',
                status: 409
            );
        }

        if ($resolution['state'] === 'in_progress') {
            return ApiResponse::error(
                code: 'idempotency_in_progress',
                message: 'An equivalent request with this Idempotency-Key is still being processed.',
                status: 409
            );
        }

        /** @var IdempotencyKey|null $record */
        $record = $resolution['record'] ?? null;
        if ($record === null) {
            return ApiResponse::error(
                code: 'idempotency_unavailable',
                message: 'Unable to reserve idempotency key.',
                status: 503
            );
        }

        try {
            $response = $next($request);
        } catch (\Throwable $exception) {
            $this->idempotencyService->release($record);
            throw $exception;
        }

        $this->idempotencyService->finalize($record, $response);
        $response->headers->set('Idempotency-Replayed', 'false');
        $response->headers->set($this->idempotencyService->keyHeader(), $key);

        return $response;
    }
}
