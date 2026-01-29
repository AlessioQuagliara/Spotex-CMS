<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['key', 'value'];

    public static function get($key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        
        if (!$setting) {
            return $default;
        }

        // Prova a decodificare come JSON, se fallisce ritorna il valore direttamente
        $decoded = json_decode($setting->value, true);
        return $decoded !== null ? $decoded : $setting->value;
    }

    public static function set($key, $value)
    {
        self::updateOrCreate(
            ['key' => $key],
            ['value' => is_array($value) ? json_encode($value) : $value]
        );
    }
}
