<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\Api\V1\ApiResponse;

class HealthController extends Controller
{
    public function __invoke()
    {
        return ApiResponse::success([
            'status' => 'ok',
            'service' => 'spotex-cms-api',
        ]);
    }
}
