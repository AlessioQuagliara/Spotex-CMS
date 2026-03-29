<?php

namespace App\Http\Controllers;

use App\Http\Controllers\ProductController;
use App\Models\Page;
use App\Services\Builder\BuilderDocumentRenderer;
use Illuminate\Http\Request;

class FrontendPageController extends Controller
{
    public function __construct(private readonly BuilderDocumentRenderer $renderer)
    {
    }
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
                'renderedPage' => $this->renderer->renderPage($homePage),
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
            'renderedPage' => $this->renderer->renderPage($page),
        ]);
    }
}
