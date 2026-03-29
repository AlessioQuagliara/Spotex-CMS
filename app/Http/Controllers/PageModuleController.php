<?php

namespace App\Http\Controllers;

use App\Models\PageModule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PageModuleController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(PageModule::query()->orderBy('name')->get());
    }

    public function show(PageModule $pageModule): JsonResponse
    {
        return response()->json($pageModule);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:page_modules,slug'],
            'type' => ['required', 'string', 'max:100'],
            'schema_version' => ['nullable', 'string', 'max:32'],
            'config' => ['required', 'array'],
            'defaults' => ['nullable', 'array'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $module = PageModule::create([
            ...$validated,
            'schema_version' => $validated['schema_version'] ?? 'craft-v1',
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json($module, 201);
    }

    public function update(Request $request, PageModule $pageModule): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('page_modules', 'slug')->ignore($pageModule->id),
            ],
            'type' => ['sometimes', 'required', 'string', 'max:100'],
            'schema_version' => ['sometimes', 'nullable', 'string', 'max:32'],
            'config' => ['sometimes', 'required', 'array'],
            'defaults' => ['sometimes', 'nullable', 'array'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $pageModule->update($validated);

        return response()->json($pageModule->fresh());
    }

    public function destroy(PageModule $pageModule): JsonResponse
    {
        $pageModule->delete();

        return response()->json([
            'success' => true,
        ]);
    }
}
