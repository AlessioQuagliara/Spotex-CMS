<?php

namespace Database\Seeders;

use App\Models\NavigationItem;
use App\Models\Page;
use App\Models\Store;
use Illuminate\Database\Seeder;

class NavigationItemSeeder extends Seeder
{
    public function run(): void
    {
        $storeId = Store::query()->value('id');

        // Pulisci i dati esistenti
        NavigationItem::truncate();

        // Ottieni la pagina Home se esiste
        $homePage = Page::where('slug', 'home')->first();
        $aboutPage = Page::where('slug', 'chi-siamo')->first();
        $contactPage = Page::where('slug', 'contatti')->first();

        // Menu Header
        NavigationItem::create([
            'store_id' => $storeId,
            'location' => 'header',
            'label' => 'Prodotti',
            'type' => 'custom',
            'url' => '/prodotti',
            'sort_order' => 1,
        ]);

        if ($homePage) {
            NavigationItem::create([
                'store_id' => $storeId,
                'location' => 'header',
                'label' => 'Home',
                'type' => 'page',
                'page_id' => $homePage->id,
                'sort_order' => 0,
            ]);
        }

        if ($aboutPage) {
            NavigationItem::create([
                'store_id' => $storeId,
                'location' => 'header',
                'label' => 'Chi Siamo',
                'type' => 'page',
                'page_id' => $aboutPage->id,
                'sort_order' => 2,
            ]);
        }

        if ($contactPage) {
            NavigationItem::create([
                'store_id' => $storeId,
                'location' => 'header',
                'label' => 'Contatti',
                'type' => 'page',
                'page_id' => $contactPage->id,
                'sort_order' => 3,
            ]);
        }

        // Menu Footer - Sezione Informazioni
        $infoParent = NavigationItem::create([
            'store_id' => $storeId,
            'location' => 'footer',
            'label' => 'Informazioni',
            'type' => 'custom',
            'url' => '#',
            'sort_order' => 1,
        ]);

        NavigationItem::create([
            'store_id' => $storeId,
            'location' => 'footer',
            'parent_id' => $infoParent->id,
            'label' => 'Chi Siamo',
            'type' => 'page',
            'page_id' => $aboutPage?->id,
            'sort_order' => 1,
        ]);

        NavigationItem::create([
            'store_id' => $storeId,
            'location' => 'footer',
            'parent_id' => $infoParent->id,
            'label' => 'Blog',
            'type' => 'custom',
            'url' => '/blog',
            'sort_order' => 2,
        ]);

        // Menu Footer - Sezione Assistenza
        $supportParent = NavigationItem::create([
            'store_id' => $storeId,
            'location' => 'footer',
            'label' => 'Assistenza',
            'type' => 'custom',
            'url' => '#',
            'sort_order' => 2,
        ]);

        NavigationItem::create([
            'store_id' => $storeId,
            'location' => 'footer',
            'parent_id' => $supportParent->id,
            'label' => 'Contatti',
            'type' => 'page',
            'page_id' => $contactPage?->id,
            'sort_order' => 1,
        ]);

        NavigationItem::create([
            'store_id' => $storeId,
            'location' => 'footer',
            'parent_id' => $supportParent->id,
            'label' => 'FAQ',
            'type' => 'custom',
            'url' => '/faq',
            'sort_order' => 2,
        ]);

        NavigationItem::create([
            'store_id' => $storeId,
            'location' => 'footer',
            'parent_id' => $supportParent->id,
            'label' => 'Resi',
            'type' => 'custom',
            'url' => '/resi',
            'sort_order' => 3,
        ]);

        // Menu Footer - Sezione Legale
        $legalParent = NavigationItem::create([
            'store_id' => $storeId,
            'location' => 'footer',
            'label' => 'Legale',
            'type' => 'custom',
            'url' => '#',
            'sort_order' => 3,
        ]);

        NavigationItem::create([
            'store_id' => $storeId,
            'location' => 'footer',
            'parent_id' => $legalParent->id,
            'label' => 'Privacy Policy',
            'type' => 'custom',
            'url' => '/privacy',
            'sort_order' => 1,
        ]);

        NavigationItem::create([
            'store_id' => $storeId,
            'location' => 'footer',
            'parent_id' => $legalParent->id,
            'label' => 'Termini di Servizio',
            'type' => 'custom',
            'url' => '/terms',
            'sort_order' => 2,
        ]);

        NavigationItem::create([
            'store_id' => $storeId,
            'location' => 'footer',
            'parent_id' => $legalParent->id,
            'label' => 'Cookie Policy',
            'type' => 'custom',
            'url' => '/cookies',
            'sort_order' => 3,
        ]);
    }
}
