<?php

namespace App\Services\Builder;

class BuilderContentSanitizer
{
    public function sanitizeHtml(?string $html): ?string
    {
        if ($html === null) {
            return null;
        }

        $html = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $html) ?? '';
        $html = preg_replace('/\son[a-z]+\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)/i', '', $html) ?? $html;
        $html = preg_replace('/javascript\s*:/i', '', $html) ?? $html;

        return trim($html);
    }

    public function sanitizeCss(?string $css): ?string
    {
        if ($css === null) {
            return null;
        }

        $css = preg_replace('/expression\s*\((.*?)\)/i', '', $css) ?? '';
        $css = preg_replace('/javascript\s*:/i', '', $css) ?? $css;
        $css = preg_replace('/@import\s+/i', '', $css) ?? $css;

        return trim($css);
    }

    public function sanitizeJs(?string $js): ?string
    {
        if ($js === null) {
            return null;
        }

        $js = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '$1', $js) ?? '';

        return trim($js);
    }
}
