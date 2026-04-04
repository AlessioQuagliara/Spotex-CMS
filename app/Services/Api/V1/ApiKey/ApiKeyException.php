<?php

namespace App\Services\Api\V1\ApiKey;

use RuntimeException;

class ApiKeyException extends RuntimeException
{
    public function __construct(
        private readonly string $apiErrorCode,
        string $message,
        private readonly int $status = 400
    ) {
        parent::__construct($message);
    }

    public static function invalidRequest(string $message): self
    {
        return new self('invalid_request', $message, 400);
    }

    public static function invalidScope(string $message): self
    {
        return new self('invalid_scope', $message, 400);
    }

    public static function notFound(): self
    {
        return new self('not_found', 'API key not found.', 404);
    }

    public static function revoked(): self
    {
        return new self('invalid_token', 'API key is already revoked.', 400);
    }

    public function apiErrorCode(): string
    {
        return $this->apiErrorCode;
    }

    public function status(): int
    {
        return $this->status;
    }
}
