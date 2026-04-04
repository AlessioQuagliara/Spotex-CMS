<?php

namespace App\Http\Controllers;

use App\Http\Controllers\ProductController;
use App\Models\Page;
use App\Services\Builder\BuilderDocumentRenderer;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;

class FrontendPageController extends Controller
{
    public function __construct(
        private readonly BuilderDocumentRenderer $renderer,
        private readonly TenantContext $tenantContext
    )
    {
    }
    /**
     * Mostra la homepage dinamica se presente
     */
    public function home(Request $request)
    {
        $homePage = $this->applyStoreScope(Page::query())
            ->where(function (Builder $query): void {
                $query
                    ->whereIn('slug', ['', 'home', 'home-seo'])
                    ->orWhere('title', 'Home');
            })
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
        if ($this->tenantContext->storeId() !== null && $page->store_id !== null && $page->store_id !== $this->tenantContext->storeId()) {
            abort(404, 'Pagina non trovata');
        }

        // Verifica che la pagina sia pubblicata
        if (!$page->is_published) {
            abort(404, 'Pagina non trovata');
        }

        return view('pages.show', [
            'page' => $page,
            'renderedPage' => $this->renderer->renderPage($page),
        ]);
    }

    private function applyStoreScope(Builder $query): Builder
    {
        $storeId = $this->tenantContext->storeId();
        if ($storeId === null) {
            return $query;
        }

        return $query->where(function (Builder $builder) use ($storeId): void {
            $builder
                ->where('store_id', $storeId)
                ->orWhereNull('store_id');
        });
    }
}
