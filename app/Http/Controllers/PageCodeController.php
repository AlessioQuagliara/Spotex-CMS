<?php

namespace App\Http\Controllers;

use App\Models\Page;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class PageCodeController extends Controller
{
    public function editor(Page $page): View
    {
        return view('pages.code-editor', [
            'page' => $page,
        ]);
    }

    public function list(): JsonResponse
    {
        return response()->json(
            Page::query()
                ->orderBy('title')
                ->select(['id', 'title', 'slug'])
                ->get()
        );
    }

    public function show(Page $page): JsonResponse
    {
        return response()->json([
            'id' => $page->id,
            'title' => $page->title,
            'html' => $page->html_content,
            'css' => $page->css_content,
            'js' => $page->js_content,
        ]);
    }

    public function save(Request $request, Page $page): JsonResponse
    {
        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'html' => ['nullable', 'string'],
            'css' => ['nullable', 'string'],
            'js' => ['nullable', 'string'],
        ]);

        $page->update([
            'title' => $data['title'] ?? $page->title,
            'html_content' => $data['html'] ?? '',
            'css_content' => $data['css'] ?? '',
            'js_content' => $data['js'] ?? '',
        ]);

        return response()->json([
            'id' => $page->id,
            'title' => $page->title,
        ]);
    }
}