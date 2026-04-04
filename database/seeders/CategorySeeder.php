<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Store;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $storeId = Store::query()->value('id');

        $categories = [
            [
                'store_id' => $storeId,
                'name' => 'Elettronica',
                'slug' => 'elettronica',
                'description' => 'Prodotti elettronici e accessori',
            ],
            [
                'store_id' => $storeId,
                'name' => 'Abbigliamento',
                'slug' => 'abbigliamento',
                'description' => 'Moda e vestiario',
            ],
            [
                'store_id' => $storeId,
                'name' => 'Casa e Giardino',
                'slug' => 'casa-giardino',
                'description' => 'Articoli per la casa e il giardino',
            ],
            [
                'store_id' => $storeId,
                'name' => 'Sport',
                'slug' => 'sport',
                'description' => 'Articoli sportivi e attrezzi fitness',
            ],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}
