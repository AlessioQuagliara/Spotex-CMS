<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    public function list()
    {
        $coupons = Coupon::where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('valid_from')->orWhere('valid_from', '<=', now());
            })
            ->where(function ($query) {
                $query->whereNull('valid_until')->orWhere('valid_until', '>=', now());
            })
            ->select('code', 'type', 'value', 'max_discount')
            ->get();

        return response()->json([
            'coupons' => $coupons,
        ]);
    }

    public function active()
    {
        $coupons = Coupon::where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('valid_from')->orWhere('valid_from', '<=', now());
            })
            ->where(function ($query) {
                $query->whereNull('valid_until')->orWhere('valid_until', '>=', now());
            })
            ->select('code', 'type', 'value', 'max_discount')
            ->get()
            ->map(function ($coupon) {
                return [
                    'code' => $coupon->code,
                    'type' => $coupon->type,
                    'value' => $coupon->value,
                    'discount_percent' => $coupon->type === 'percentage' ? $coupon->value : null,
                ];
            });

        return response()->json([
            'coupons' => $coupons,
        ]);
    }

    public function validateCoupon(Request $request)
    {
        $code = strtoupper(trim($request->input('code', '')));

        if (!$code) {
            return response()->json([
                'valid' => false,
                'message' => 'Codice sconto non valido',
            ]);
        }

        $coupon = Coupon::where('code', $code)->first();

        if (!$coupon) {
            return response()->json([
                'valid' => false,
                'message' => 'Codice sconto non trovato',
            ]);
        }

        if (!$coupon->is_active) {
            return response()->json([
                'valid' => false,
                'message' => 'Codice sconto non disponibile',
            ]);
        }

        if ($coupon->valid_from && now()->isBefore($coupon->valid_from)) {
            return response()->json([
                'valid' => false,
                'message' => 'Codice sconto non ancora valido',
            ]);
        }

        if ($coupon->valid_until && now()->isAfter($coupon->valid_until)) {
            return response()->json([
                'valid' => false,
                'message' => 'Codice sconto scaduto',
            ]);
        }

        if ($coupon->max_uses && $coupon->times_used >= $coupon->max_uses) {
            return response()->json([
                'valid' => false,
                'message' => 'Codice sconto non più disponibile',
            ]);
        }

        return response()->json([
            'valid' => true,
            'code' => $coupon->code,
            'type' => $coupon->type,
            'discount_type' => $coupon->type,
            'value' => $coupon->value,
            'discount_amount' => $coupon->type === 'percentage' ? round($coupon->value, 2) : round($coupon->value, 2),
            'message' => 'Codice sconto valido',
        ]);
    }
}

