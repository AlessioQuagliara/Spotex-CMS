<?php

namespace App\Services\Api\V1\OAuth;

use RuntimeException;

class OAuthException extends RuntimeException
{
    public function __construct(
        private readonly string $oauthErrorCode,
        private readonly int $httpStatus,
        string $message
    ) {
        parent::__construct($message);
    }

    public function oauthErrorCode(): string
    {
        return $this->oauthErrorCode;
    }

    public function httpStatus(): int
    {
        return $this->httpStatus;
    }

    public static function invalidClient(): self
    {
        return new self('invalid_client', 401, 'Invalid client credentials.');
    }

    public static function invalidScope(string $message = 'Requested scope is not allowed for this client.'): self
    {
        return new self('invalid_scope', 400, $message);
    }

    public static function invalidRequest(string $message): self
    {
        return new self('invalid_request', 400, $message);
    }
}
