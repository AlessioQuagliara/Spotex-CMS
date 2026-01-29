<?php

namespace Database\Seeders;

use App\Models\NavigationItem;
use App\Models\Page;
use Illuminate\Database\Seeder;

class NavigationItemSeeder extends Seeder
{
    public function run(): void
    {
        // Pulisci i dati esistenti
        NavigationItem::truncate();

        // Ottieni la pagina Home se esiste
        $homePage = Page::where('slug', 'home')->first();
        $aboutPage = Page::where('slug', 'chi-siamo')->first();
        $contactPage = Page::where('slug', 'contatti')->first();

        // Menu Header
        NavigationItem::create([
            'location' => 'header',
            'label' => 'Prodotti',
            'type' => 'custom',
            'url' => '/prodotti',
            'sort_order' => 1,
        ]);

        if ($homePage) {
            NavigationItem::create([
                'location' => 'header',
                'label' => 'Home',
                'type' => 'page',
                'page_id' => $homePage->id,
                'sort_order' => 0,
            ]);
        }

        if ($aboutPage) {
            NavigationItem::create([
                'location' => 'header',
                'label' => 'Chi Siamo',
                'type' => 'page',
                'page_id' => $aboutPage->id,
                'sort_order' => 2,
            ]);
        }

        if ($contactPage) {
            NavigationItem::create([
                'location' => 'header',
                'label' => 'Contatti',
                'type' => 'page',
                'page_id' => $contactPage->id,
                'sort_order' => 3,
            ]);
        }

        // Menu Footer - Sezione Informazioni
        $infoParent = NavigationItem::create([
            'location' => 'footer',
            'label' => 'Informazioni',
            'type' => 'custom',
            'url' => '#',
            'sort_order' => 1,
        ]);

        NavigationItem::create([
            'location' => 'footer',
            'parent_id' => $infoParent->id,
            'label' => 'Chi Siamo',
            'type' => 'page',
            'page_id' => $aboutPage?->id,
            'sort_order' => 1,
        ]);

        NavigationItem::create([
            'location' => 'footer',
            'parent_id' => $infoParent->id,
            'label' => 'Blog',
            'type' => 'custom',
            'url' => '/blog',
            'sort_order' => 2,
        ]);

        // Menu Footer - Sezione Assistenza
        $supportParent = NavigationItem::create([
            'location' => 'footer',
            'label' => 'Assistenza',
            'type' => 'custom',
            'url' => '#',
            'sort_order' => 2,
        ]);

        NavigationItem::create([
            'location' => 'footer',
            'parent_id' => $supportParent->id,
            'label' => 'Contatti',
            'type' => 'page',
            'page_id' => $contactPage?->id,
            'sort_order' => 1,
        ]);

        NavigationItem::create([
            'location' => 'footer',
            'parent_id' => $supportParent->id,
            'label' => 'FAQ',
            'type' => 'custom',
            'url' => '/faq',
            'sort_order' => 2,
        ]);

        NavigationItem::create([
            'location' => 'footer',
            'parent_id' => $supportParent->id,
            'label' => 'Resi',
            'type' => 'custom',
            'url' => '/resi',
            'sort_order' => 3,
        ]);

        // Menu Footer - Sezione Legale
        $legalParent = NavigationItem::create([
            'location' => 'footer',
            'label' => 'Legale',
            'type' => 'custom',
            'url' => '#',
            'sort_order' => 3,
        ]);

        NavigationItem::create([
            'location' => 'footer',
            'parent_id' => $legalParent->id,
            'label' => 'Privacy Policy',
            'type' => 'custom',
            'url' => '/privacy',
            'sort_order' => 1,
        ]);

        NavigationItem::create([
            'location' => 'footer',
            'parent_id' => $legalParent->id,
            'label' => 'Termini di Servizio',
            'type' => 'custom',
            'url' => '/terms',
            'sort_order' => 2,
        ]);

        NavigationItem::create([
            'location' => 'footer',
            'parent_id' => $legalParent->id,
            'label' => 'Cookie Policy',
            'type' => 'custom',
            'url' => '/cookies',
            'sort_order' => 3,
        ]);
    }
}
