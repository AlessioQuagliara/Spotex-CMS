<?php

namespace App\Http\Controllers;

use App\Http\Requests\SavePageBuilderRequest;
use App\Models\Page;
use App\Services\Builder\BuilderContentSanitizer;
use App\Services\Builder\BuilderDocumentRenderer;
use App\Services\Builder\BuilderPreviewCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\View\View;

class PageBuilderController extends Controller
{
    public function __construct(
        private readonly BuilderContentSanitizer $sanitizer,
        private readonly BuilderDocumentRenderer $renderer,
        private readonly BuilderPreviewCatalog $previewCatalog,
    ) {
    }

    /**
     * Mostra il builder per una pagina
     */
    public function show(Page $page): View
    {
        // Se non c'è builder_data, creiamo blocchi HTML dal contenuto
        $builderData = $page->builder_data ?? [];
        
        if (empty($builderData) && !empty($page->html_content)) {
            // Dividi il contenuto in sezioni
            $builderData = $this->parseHtmlIntoBlocks($page->html_content);
        }
        
        return view('builder.index', [
            'page' => $page,
            'builderData' => $builderData,
        ]);
    }

    /**
     * Mostra il builder v2 (Vite + React modularizzato)
     */
    public function showV2(Page $page): View
    {
        return view('builder-v2', [
            'page' => $page,
            'previewCatalog' => $this->previewCatalog->build(),
        ]);
    }

    /**
     * Converte HTML in blocchi separati per ogni sezione o div principale
     */
    private function parseHtmlIntoBlocks(string $html): array
    {
        $blocks = [];
        $y = 0;
        
        // Estrai i tag <section> oppure i <div> di primo livello
        if (preg_match_all('/<section[^>]*>(.*?)<\/section>/is', $html, $matches)) {
            foreach ($matches[1] as $index => $content) {
                $fullSection = $matches[0][$index];
                $blocks[] = [
                    'id' => (string)$index,
                    'type' => 'html-block',
                    'content' => $fullSection,
                    'x' => 0,
                    'y' => $y,
                    'width' => 1200,
                    'height' => 300,
                    'styles' => [
                        'backgroundColor' => 'transparent'
                    ]
                ];
                $y += 350; // Spaziatura tra blocchi
            }
        }
        
        // Se non ci sono sezioni, crea un unico blocco
        if (empty($blocks)) {
            $blocks[] = [
                'id' => '0',
                'type' => 'html-block',
                'content' => $html,
                'x' => 0,
                'y' => 0,
                'width' => 1200,
                'height' => 800,
                'styles' => [
                    'backgroundColor' => 'transparent'
                ]
            ];
        }
        
        return $blocks;
    }

    /**
     * Salva i dati del builder
     */
    public function save(SavePageBuilderRequest $request, Page $page): JsonResponse
    {
        $validated = $request->validated();

        $document = is_array($validated['document'] ?? null)
            ? $validated['document']
            : $this->convertLegacyElementsToDocument($validated['elements'] ?? []);

        $schemaVersion = $validated['schema_version'] ?? 'craft-v1';
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
        return response()->json([
            'schema_version' => $page->builder_schema_version ?? 'craft-v1',
            'document' => $page->builder_document ?? $this->convertLegacyElementsToDocument($page->builder_data ?? []),
            'elements' => $page->builder_data ?? [],
            'modules' => $page->builder_modules ?? [],
            'meta' => $page->builder_meta ?? [],
        ]);
    }

    private function convertLegacyElementsToDocument(array $elements): array
    {
        $document = [
            'ROOT' => [
                'type' => ['resolvedName' => 'Canvas'],
                'isCanvas' => true,
                'props' => [],
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
            $document[$id] = [
                'type' => ['resolvedName' => (string) ($element['type'] ?? 'LegacyBlock')],
                'isCanvas' => false,
                'props' => [
                    'content' => $element['content'] ?? null,
                    'styles' => is_array($element['styles'] ?? null) ? $element['styles'] : [],
                    'x' => $element['x'] ?? 0,
                    'y' => $element['y'] ?? 0,
                    'width' => $element['width'] ?? null,
                    'height' => $element['height'] ?? null,
                ],
                'displayName' => ucfirst((string) ($element['type'] ?? 'LegacyBlock')),
                'custom' => [],
                'hidden' => false,
                'nodes' => [],
                'linkedNodes' => (object) [],
            ];
            $document['ROOT']['nodes'][] = $id;
        }

        return $document;
    }
}
