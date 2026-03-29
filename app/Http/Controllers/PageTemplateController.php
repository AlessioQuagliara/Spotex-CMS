<?php

namespace App\Http\Controllers;

use App\Models\PageTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PageTemplateController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(PageTemplate::query()->orderBy('name')->get());
    }

    public function show(PageTemplate $pageTemplate): JsonResponse
    {
        return response()->json($pageTemplate);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:page_templates,slug'],
            'schema_version' => ['nullable', 'string', 'max:32'],
            'document' => ['required', 'array'],
            'meta' => ['nullable', 'array'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $template = PageTemplate::create([
            ...$validated,
            'schema_version' => $validated['schema_version'] ?? 'craft-v1',
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json($template, 201);
    }

    public function update(Request $request, PageTemplate $pageTemplate): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('page_templates', 'slug')->ignore($pageTemplate->id),
            ],
            'schema_version' => ['sometimes', 'nullable', 'string', 'max:32'],
            'document' => ['sometimes', 'required', 'array'],
            'meta' => ['sometimes', 'nullable', 'array'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $pageTemplate->update($validated);

        return response()->json($pageTemplate->fresh());
    }

    public function destroy(PageTemplate $pageTemplate): JsonResponse
    {
        $pageTemplate->delete();

        return response()->json([
            'success' => true,
        ]);
    }
}
