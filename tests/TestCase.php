<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    public function assertEquals(mixed $expected, mixed $actual, string $message = ''): void
    {
        if ($expected != $actual) {
            $this->fail($message ?: 'Failed asserting that values are equal.');
        }
    }

    public function assertStringContainsString(string $needle, string $haystack, string $message = ''): void
    {
        if (!str_contains($haystack, $needle)) {
            $this->fail($message ?: 'Failed asserting that string contains substring.');
        }
    }

    protected function fail(string $message): void
    {
        throw new \RuntimeException($message);
    }
}
