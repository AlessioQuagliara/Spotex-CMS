<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // SQLite non supporta ALTER COLUMN per enum, quindi usiamo una soluzione alternativa
        // Cambiamo la colonna type da enum a string per permettere qualsiasi valore
        Schema::table('shipping_rules', function (Blueprint $table) {
            // In SQLite dobbiamo ricreare la tabella per cambiare il tipo di colonna
            // Per ora, facciamo una modifica temporanea usando raw SQL
            DB::statement('PRAGMA foreign_keys=off');
        });
        
        // Ricrea la tabella con il nuovo tipo
        DB::statement('
            CREATE TABLE shipping_rules_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                base_cost DECIMAL(10, 2) NOT NULL,
                free_shipping_threshold DECIMAL(10, 2),
                description TEXT,
                is_active INTEGER DEFAULT 1,
                created_at DATETIME,
                updated_at DATETIME,
                UNIQUE(type)
            )
        ');
        
        // Copia i dati dalla vecchia tabella
        DB::statement('INSERT INTO shipping_rules_new SELECT * FROM shipping_rules');
        
        // Elimina la vecchia tabella
        DB::statement('DROP TABLE shipping_rules');
        
        // Rinomina la nuova tabella
        DB::statement('ALTER TABLE shipping_rules_new RENAME TO shipping_rules');
        
        DB::statement('PRAGMA foreign_keys=on');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Non possiamo tornare indietro facilmente in SQLite
        // Lasciamo la colonna come string
    }
};
