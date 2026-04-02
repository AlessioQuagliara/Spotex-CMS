<?php

namespace App\Http\Controllers;

use App\Http\Requests\SavePageBuilderRequest;
use App\Models\Page;
use App\Services\Builder\BuilderContentSanitizer;
use App\Services\Builder\BuilderDocumentRenderer;
use Illuminate\Http\JsonResponse;
use Illuminate\View\View;

class PageBuilderController extends Controller
{
    public function __construct(
        private readonly BuilderContentSanitizer $sanitizer,
        private readonly BuilderDocumentRenderer $renderer,
    ) {
    }

    /**
     * Mostra il builder per una pagina
     */
    public function show(Page $page): View
    {
        return view('builder-grapes', [
            'page' => $page,
            'grapesPayload' => $this->prepareGrapesPayload($page),
        ]);
    }

    /**
     * Mostra il builder v2 (Vite + React modularizzato)
     */
    public function showV2(Page $page): View
    {
        return $this->show($page);
    }

    /**
     * Salva i dati del builder
     */
    public function save(SavePageBuilderRequest $request, Page $page): JsonResponse
    {
        $validated = $request->validated();
        $schemaVersion = (string) ($validated['schema_version'] ?? $page->builder_schema_version ?? 'grapesjs-v1');

        if ($this->isGrapesSchema($schemaVersion, $validated['document'] ?? null)) {
            $projectData = $this->extractProjectData($validated['document'] ?? []);
            $safeMeta = is_array($validated['meta'] ?? null) ? $validated['meta'] : [];

            $page->update([
                'builder_schema_version' => 'grapesjs-v1',
                'builder_document' => [
                    'type' => 'grapesjs',
                    'projectData' => $projectData,
                ],
                'builder_data' => [],
                'builder_modules' => $validated['modules'] ?? $page->builder_modules,
                'builder_meta' => array_merge($safeMeta, ['editor' => 'grapesjs']),
                'html_content' => $this->sanitizer->sanitizeHtml($validated['html'] ?? $page->html_content ?? ''),
                'css_content' => $this->sanitizer->sanitizeCss($validated['css'] ?? $page->css_content ?? ''),
                'js_content' => $this->sanitizer->sanitizeJs($validated['js'] ?? $page->js_content ?? ''),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pagina salvata con successo',
                'schema_version' => $page->builder_schema_version,
                'page' => $page,
            ]);
        }

        $document = is_array($validated['document'] ?? null)
            ? $validated['document']
            : $this->convertLegacyElementsToDocument($validated['elements'] ?? []);

        $rendered = $this->renderer->renderDocument($document);

        $page->update([
            'builder_schema_version' => $schemaVersion,
            'builder_document' => $document,
            'builder_data' => $validated['elements'] ?? $page->builder_data,
            'builder_modules' => $validated['modules'] ?? $page->builder_modules,
            'builder_meta' => $validated['meta'] ?? $page->builder_meta,
            'html_content' => $this->sanitizer->sanitizeHtml($rendered['html'] ?? null),
            'css_content' => $this->sanitizer->sanitizeCss($validated['css'] ?? ($rendered['css'] ?? null)),
            'js_content' => $this->sanitizer->sanitizeJs($validated['js'] ?? ($rendered['js'] ?? null)),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pagina salvata con successo',
            'schema_version' => $page->builder_schema_version,
            'page' => $page,
        ]);
    }

    /**
     * Esporta JSON del builder
     */
    public function export(Page $page): JsonResponse
    {
        $document = $page->builder_document ?? $this->convertLegacyElementsToDocument($page->builder_data ?? []);
        $projectData = $this->extractProjectData($document);

        return response()->json([
            'schema_version' => $page->builder_schema_version ?? 'craft-v1',
            'document' => $document,
            'project_data' => $projectData,
            'elements' => $page->builder_data ?? [],
            'modules' => $page->builder_modules ?? [],
            'meta' => $page->builder_meta ?? [],
            'html' => $page->html_content ?? '',
            'css' => $page->css_content ?? '',
            'js' => $page->js_content ?? '',
        ]);
    }

    private function prepareGrapesPayload(Page $page): array
    {
        $document = is_array($page->builder_document) ? $page->builder_document : [];
        $projectData = $this->extractProjectData($document);

        $html = (string) ($page->html_content ?? '');
        $css = (string) ($page->css_content ?? '');
        $js = (string) ($page->js_content ?? '');

        if ($html === '' && $css === '' && $js === '') {
            if (!empty($document) && !$this->isGrapesSchema((string) ($page->builder_schema_version ?? ''), $document)) {
                $rendered = $this->renderer->renderDocument($document);
                $html = (string) ($rendered['html'] ?? '');
                $css = (string) ($rendered['css'] ?? '');
                $js = (string) ($rendered['js'] ?? '');
            } elseif (is_array($page->builder_data) && !empty($page->builder_data)) {
                $rendered = $this->renderer->renderDocument($this->convertLegacyElementsToDocument($page->builder_data));
                $html = (string) ($rendered['html'] ?? '');
                $css = (string) ($rendered['css'] ?? '');
                $js = (string) ($rendered['js'] ?? '');
            }
        }

        return [
            'pageId' => (string) $page->id,
            'pageTitle' => (string) $page->title,
            'pageSlug' => (string) $page->slug,
            'schemaVersion' => str_starts_with((string) ($page->builder_schema_version ?? ''), 'grapesjs')
                ? (string) $page->builder_schema_version
                : 'grapesjs-v1',
            'saveUrl' => route('pages.builder.save', $page),
            'html' => $html,
            'css' => $css,
            'js' => $js,
            'projectData' => $projectData,
        ];
    }

    private function extractProjectData(mixed $document): array
    {
        if (!is_array($document) || $document === []) {
            return [];
        }

        if (is_array($document['projectData'] ?? null)) {
            return $document['projectData'];
        }

        if (($document['type'] ?? null) === 'grapesjs') {
            return is_array($document['data'] ?? null) ? $document['data'] : [];
        }

        if (isset($document['pages']) || isset($document['styles']) || isset($document['assets'])) {
            return $document;
        }

        return [];
    }

    private function isGrapesSchema(string $schemaVersion, mixed $document): bool
    {
        if (str_starts_with($schemaVersion, 'grapesjs')) {
            return true;
        }

        if (!is_array($document)) {
            return false;
        }

        if (($document['type'] ?? null) === 'grapesjs') {
            return true;
        }

        return isset($document['projectData']) || isset($document['pages']) || isset($document['styles']) || isset($document['assets']);
    }

    private function convertLegacyElementsToDocument(array $elements): array
    {
        $document = [
            'ROOT' => [
                'type' => ['resolvedName' => 'CraftRoot'],
                'isCanvas' => true,
                'props' => [
                    'background' => '#f8fafc',
                    'padding' => 24,
                    'width' => '100%',
                ],
                'displayName' => 'Root',
                'custom' => [],
                'hidden' => false,
                'nodes' => [],
                'linkedNodes' => (object) [],
            ],
        ];

        foreach ($elements as $element) {
            if (!is_array($element)) {
                continue;
            }

            $id = (string) ($element['id'] ?? uniqid('node_', true));
            $type = $this->mapLegacyTypeToCraftType((string) ($element['type'] ?? 'text'));

            $document[$id] = [
                'type' => ['resolvedName' => $type],
                'isCanvas' => $type === 'SectionBlock',
                'props' => $this->mapLegacyElementProps($element, $type),
                'displayName' => $type,
                'custom' => [],
                'hidden' => false,
                'nodes' => [],
                'linkedNodes' => (object) [],
            ];
            $document['ROOT']['nodes'][] = $id;
        }

        return $document;
    }

    private function mapLegacyTypeToCraftType(string $type): string
    {
        return match ($type) {
            'button', 'Button', 'ButtonBlock' => 'ButtonBlock',
            'image', 'Image', 'ImageBlock' => 'ImageBlock',
            'container', 'section', 'Section', 'SectionBlock' => 'SectionBlock',
            'product-grid', 'ProductGrid', 'ProductGridBlock' => 'ProductGridBlock',
            'category-feed', 'CategoryFeed', 'CategoryFeedBlock' => 'CategoryFeedBlock',
            'html-block', 'html', 'Html', 'HtmlBlock' => 'HtmlBlock',
            default => 'TextBlock',
        };
    }

    private function mapLegacyElementProps(array $element, string $type): array
    {
        $content = $element['content'] ?? null;
        $styles = is_array($element['styles'] ?? null) ? $element['styles'] : [];

        $contentValue = static function (string $key, mixed $default = null) use ($content): mixed {
            if (is_array($content)) {
                return $content[$key] ?? $default;
            }

            return $default;
        };

        $textContent = is_string($content)
            ? $content
            : (string) ($contentValue('text', $contentValue('html', 'Nuovo contenuto')) ?? 'Nuovo contenuto');

        return match ($type) {
            'HtmlBlock' => [
                'html' => is_string($content)
                    ? $content
                    : (string) ($contentValue('html', $contentValue('text', '')) ?? ''),
                'background' => (string) ($styles['backgroundColor'] ?? 'transparent'),
                'padding' => $this->toInt($styles['padding'] ?? 0, 0),
                'radius' => $this->toInt($styles['borderRadius'] ?? 0, 0),
            ],
            'ButtonBlock' => [
                'label' => (string) ($contentValue('label', 'Call to action') ?? 'Call to action'),
                'href' => (string) ($contentValue('href', '#') ?? '#'),
                'background' => (string) ($styles['backgroundColor'] ?? '#0f172a'),
                'color' => (string) ($styles['color'] ?? '#ffffff'),
                'radius' => $this->toInt($styles['borderRadius'] ?? 999, 999),
            ],
            'ImageBlock' => [
                'src' => (string) ($contentValue('src', 'https://placehold.co/800x400?text=Spotex') ?? 'https://placehold.co/800x400?text=Spotex'),
                'alt' => (string) ($contentValue('alt', 'Immagine modulo') ?? 'Immagine modulo'),
                'radius' => $this->toInt($styles['borderRadius'] ?? 24, 24),
            ],
            'SectionBlock' => [
                'background' => (string) ($styles['backgroundColor'] ?? '#ffffff'),
                'padding' => $this->toInt($styles['padding'] ?? 24, 24),
                'radius' => $this->toInt($styles['borderRadius'] ?? 16, 16),
            ],
            default => [
                'text' => $textContent,
                'color' => (string) ($styles['color'] ?? '#111827'),
                'fontSize' => $this->toInt($styles['fontSize'] ?? 18, 18),
            ],
        };
    }

    private function toInt(mixed $value, int $default): int
    {
        return is_numeric($value) ? (int) $value : $default;
    }
}
