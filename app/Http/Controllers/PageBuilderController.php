<?php

namespace App\Http\Controllers;

use App\Models\Page;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class PageBuilderController extends Controller
{
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
    public function save(Request $request, Page $page): JsonResponse
    {
        $validated = $request->validate([
            'elements' => 'required|array',
            'html' => 'nullable|string',
            'css' => 'nullable|string',
            'js' => 'nullable|string',
        ]);

        $page->update([
            'builder_data' => $validated['elements'],
            'html_content' => $validated['html'] ?? null,
            'css_content' => $validated['css'] ?? null,
            'js_content' => $validated['js'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pagina salvata con successo',
            'page' => $page,
        ]);
    }

    /**
     * Esporta JSON del builder
     */
    public function export(Page $page): JsonResponse
    {
        return response()->json($page->builder_data ?? []);
    }
}
