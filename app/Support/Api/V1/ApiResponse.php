<?php

namespace App\Support\Api\V1;

use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class ApiResponse
{
    /**
     * @param array<string, mixed> $data
     * @param array<string, mixed> $meta
     */
    public static function success(array $data = [], array $meta = [], int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => array_merge(self::baseMeta(), $meta),
        ], $status);
    }

    /**
     * @param array<string, mixed> $errorDetails
     * @param array<string, mixed> $meta
     */
    public static function error(
        string $code,
        string $message,
        int $status = 400,
        array $errorDetails = [],
        array $meta = []
    ): JsonResponse {
        $errorPayload = [
            'code' => $code,
            'message' => $message,
        ];

        if (!empty($errorDetails)) {
            $errorPayload['details'] = $errorDetails;
        }

        return response()->json([
            'success' => false,
            'error' => $errorPayload,
            'meta' => array_merge(self::baseMeta(), $meta),
        ], $status);
    }

    /**
     * @param array<int, array<string, mixed>> $items
     * @param array<string, mixed> $meta
     */
    public static function paginated(LengthAwarePaginator $paginator, array $items, array $meta = []): JsonResponse
    {
        return self::success(
            data: ['items' => $items],
            meta: array_merge([
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ],
            ], $meta)
        );
    }

    /**
     * @return array<string, mixed>
     */
    public static function baseMeta(): array
    {
        $request = request();
        $requestId = (string) ($request->headers->get('X-Request-Id') ?: Str::uuid());

        return [
            'request_id' => $requestId,
            'timestamp' => now()->toIso8601String(),
            'version' => 'v1',
        ];
    }
}
