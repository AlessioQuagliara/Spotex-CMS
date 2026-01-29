<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Elettronica',
                'slug' => 'elettronica',
                'description' => 'Prodotti elettronici e accessori',
            ],
            [
                'name' => 'Abbigliamento',
                'slug' => 'abbigliamento',
                'description' => 'Moda e vestiario',
            ],
            [
                'name' => 'Casa e Giardino',
                'slug' => 'casa-giardino',
                'description' => 'Articoli per la casa e il giardino',
            ],
            [
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
