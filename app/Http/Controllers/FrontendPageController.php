<?php

namespace App\Http\Controllers;

use App\Models\Page;
use App\Http\Controllers\ProductController;
use Illuminate\Http\Request;

class FrontendPageController extends Controller
{
    /**
     * Mostra la homepage dinamica se presente
     */
    public function home(Request $request)
    {
        $homePage = Page::query()
            ->whereIn('slug', ['', 'home', 'home-seo'])
            ->orWhere('title', 'Home')
            ->first();

        if ($homePage && $homePage->is_published) {
            return view('pages.show', [
                'page' => $homePage,
            ]);
        }

        return app(ProductController::class)->index($request);
    }
    /**
     * Mostra una pagina pubblicata
     */
    public function show(Page $page)
    {
        // Verifica che la pagina sia pubblicata
        if (!$page->is_published) {
            abort(404, 'Pagina non trovata');
        }

        return view('pages.show', [
            'page' => $page,
        ]);
    }
}
