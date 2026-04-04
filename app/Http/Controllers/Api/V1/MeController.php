<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\Api\V1\ApiResponse;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\Request;

class MeController extends Controller
{
    public function __construct(private readonly TenantContext $tenantContext)
    {
    }

    public function __invoke(Request $request)
    {
        return ApiResponse::success([
            'client' => [
                'id' => (string) $request->attributes->get('api_v1_client', 'unknown'),
                'auth_mode' => (string) $request->attributes->get('api_v1_auth_mode', 'unknown'),
                'scopes' => array_values((array) $request->attributes->get('api_v1_scopes', [])),
            ],
            'store' => [
                'id' => $this->tenantContext->storeId(),
                'slug' => $this->tenantContext->store()?->slug,
                'name' => $this->tenantContext->store()?->name,
            ],
        ]);
    }
}
