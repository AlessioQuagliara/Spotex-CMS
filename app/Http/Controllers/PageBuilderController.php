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
        return view('builder.index', [
            'page' => $page,
            'builderData' => $page->builder_data ?? [],
        ]);
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
