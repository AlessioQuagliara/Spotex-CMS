<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Api\V1\ApiResponse;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    public function __construct(private readonly TenantContext $tenantContext)
    {
    }

    public function index(Request $request)
    {
        $store = $this->tenantContext->store();
        if ($store === null) {
            return ApiResponse::error(
                code: 'store_context_required',
                message: 'Store context is required.',
                status: 400
            );
        }

        $validated = $request->validate([
            'q' => 'nullable|string|max:255',
            'is_banned' => 'nullable|boolean',
            'sort' => 'nullable|in:id,name,email,created_at,updated_at',
            'direction' => 'nullable|in:asc,desc',
            'per_page' => 'nullable|integer|min:1|max:' . (int) config('spotex.api.v1.pagination.max_per_page', 100),
        ]);

        $search = trim((string) ($validated['q'] ?? ''));
        $sort = (string) ($validated['sort'] ?? 'id');
        $direction = (string) ($validated['direction'] ?? 'desc');
        $perPage = (int) ($validated['per_page'] ?? (int) config('spotex.api.v1.pagination.default_per_page', 20));
        $accountId = (int) $store->account_id;
        $storeId = (int) $store->id;

        $query = $this->baseCustomerQuery($accountId, $storeId);

        if (array_key_exists('is_banned', $validated) && $validated['is_banned'] !== null) {
            $query->where('users.is_banned', (bool) $validated['is_banned']);
        }

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder->where('users.name', 'like', '%' . $search . '%')
                    ->orWhere('users.email', 'like', '%' . $search . '%')
                    ->orWhere('users.phone', 'like', '%' . $search . '%');
            });
        }

        $paginator = $query
            ->orderBy('users.' . $sort, $direction)
            ->orderBy('users.id', $direction === 'asc' ? 'asc' : 'desc')
            ->paginate($perPage)
            ->withQueryString();

        $items = $paginator->getCollection()
            ->map(fn (User $customer): array => $this->transformCustomerSummary($customer))
            ->values()
            ->all();

        return ApiResponse::paginated(
            paginator: $paginator,
            items: $items,
            meta: [
                'filters' => [
                    'q' => $search !== '' ? $search : null,
                    'is_banned' => $validated['is_banned'] ?? null,
                    'sort' => $sort,
                    'direction' => $direction,
                ],
            ]
        );
    }

    public function show(User $customer)
    {
        $store = $this->tenantContext->store();
        if ($store === null) {
            return ApiResponse::error(
                code: 'store_context_required',
                message: 'Store context is required.',
                status: 400
            );
        }

        $accountId = (int) $store->account_id;
        $storeId = (int) $store->id;

        if (!$this->customerBelongsToAccount($customer->id, $accountId)) {
            return ApiResponse::error(
                code: 'not_found',
                message: 'Customer not found.',
                status: 404
            );
        }

        /** @var User $resolved */
        $resolved = $this->baseCustomerQuery($accountId, $storeId)
            ->where('users.id', $customer->id)
            ->firstOrFail();

        return ApiResponse::success([
            'item' => $this->transformCustomerDetail($resolved),
        ]);
    }

    public function store(Request $request)
    {
        $store = $this->tenantContext->store();
        if ($store === null) {
            return ApiResponse::error(
                code: 'store_context_required',
                message: 'Store context is required.',
                status: 400
            );
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'nullable|string|min:8|max:255',
            'first_name' => 'nullable|string|max:120',
            'last_name' => 'nullable|string|max:120',
            'phone' => 'nullable|string|max:30',
            'profile_type' => ['nullable', Rule::in(['private', 'company'])],
            'company_name' => 'nullable|string|max:255',
            'vat_number' => 'nullable|string|max:32',
            'tax_code' => 'nullable|string|max:32',
            'billing_address' => 'nullable|string|max:255',
            'billing_city' => 'nullable|string|max:120',
            'billing_province' => 'nullable|string|max:8',
            'billing_postal_code' => 'nullable|string|max:20',
            'billing_country' => 'nullable|string|size:2',
            'notes' => 'nullable|string|max:2000',
        ]);

        $accountId = (int) $store->account_id;
        $storeId = (int) $store->id;
        $password = array_key_exists('password', $validated) && is_string($validated['password']) && trim($validated['password']) !== ''
            ? (string) $validated['password']
            : Str::random(40);

        /** @var User $customer */
        $customer = DB::transaction(function () use ($validated, $password, $accountId): User {
            $user = User::query()->create([
                'name' => (string) $validated['name'],
                'email' => strtolower(trim((string) $validated['email'])),
                'password' => Hash::make($password),
                'is_admin' => false,
                'role' => User::ROLE_CUSTOMER,
                'profile_type' => (string) ($validated['profile_type'] ?? 'private'),
                'first_name' => $validated['first_name'] ?? null,
                'last_name' => $validated['last_name'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'company_name' => $validated['company_name'] ?? null,
                'vat_number' => $validated['vat_number'] ?? null,
                'tax_code' => $validated['tax_code'] ?? null,
                'billing_address' => $validated['billing_address'] ?? null,
                'billing_city' => $validated['billing_city'] ?? null,
                'billing_province' => $validated['billing_province'] ?? null,
                'billing_postal_code' => $validated['billing_postal_code'] ?? null,
                'billing_country' => isset($validated['billing_country']) ? strtoupper((string) $validated['billing_country']) : null,
            ]);

            DB::table('account_users')->updateOrInsert(
                [
                    'account_id' => $accountId,
                    'user_id' => (int) $user->id,
                ],
                [
                    'role' => User::ROLE_CUSTOMER,
                    'status' => 'active',
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );

            return $user;
        });

        /** @var User $resolved */
        $resolved = $this->baseCustomerQuery($accountId, $storeId)
            ->where('users.id', (int) $customer->id)
            ->firstOrFail();

        return ApiResponse::success(
            data: ['item' => $this->transformCustomerDetail($resolved)],
            status: 201
        );
    }

    public function update(Request $request, User $customer)
    {
        $store = $this->tenantContext->store();
        if ($store === null) {
            return ApiResponse::error(
                code: 'store_context_required',
                message: 'Store context is required.',
                status: 400
            );
        }

        $accountId = (int) $store->account_id;
        $storeId = (int) $store->id;

        if (!$this->customerBelongsToAccount($customer->id, $accountId)) {
            return ApiResponse::error(
                code: 'not_found',
                message: 'Customer not found.',
                status: 404
            );
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
                'email' => [
                    'sometimes',
                    'email',
                    'max:255',
                    Rule::unique('users', 'email')->ignore($customer->id),
                ],
            'first_name' => 'sometimes|nullable|string|max:120',
            'last_name' => 'sometimes|nullable|string|max:120',
            'phone' => 'sometimes|nullable|string|max:30',
            'profile_type' => ['sometimes', Rule::in(['private', 'company'])],
            'company_name' => 'sometimes|nullable|string|max:255',
            'vat_number' => 'sometimes|nullable|string|max:32',
            'tax_code' => 'sometimes|nullable|string|max:32',
            'billing_address' => 'sometimes|nullable|string|max:255',
            'billing_city' => 'sometimes|nullable|string|max:120',
            'billing_province' => 'sometimes|nullable|string|max:8',
            'billing_postal_code' => 'sometimes|nullable|string|max:20',
            'billing_country' => 'sometimes|nullable|string|size:2',
            'is_banned' => 'sometimes|boolean',
            'banned_reason' => 'sometimes|nullable|string|max:2000',
        ]);

        if (array_key_exists('email', $validated)) {
            $validated['email'] = strtolower(trim((string) $validated['email']));
        }

        if (array_key_exists('billing_country', $validated) && $validated['billing_country'] !== null) {
            $validated['billing_country'] = strtoupper((string) $validated['billing_country']);
        }

        $customer->fill($validated);
        $customer->save();

        /** @var User $resolved */
        $resolved = $this->baseCustomerQuery($accountId, $storeId)
            ->where('users.id', $customer->id)
            ->firstOrFail();

        return ApiResponse::success([
            'item' => $this->transformCustomerDetail($resolved),
        ]);
    }

    private function customerBelongsToAccount(int $customerId, int $accountId): bool
    {
        return DB::table('account_users')
            ->where('account_id', $accountId)
            ->where('user_id', $customerId)
            ->where('role', User::ROLE_CUSTOMER)
            ->exists();
    }

    private function baseCustomerQuery(int $accountId, int $storeId)
    {
        return User::query()
            ->select('users.*')
            ->join('account_users', function ($join) use ($accountId): void {
                $join->on('account_users.user_id', '=', 'users.id')
                    ->where('account_users.account_id', '=', $accountId)
                    ->where('account_users.role', '=', User::ROLE_CUSTOMER);
            })
            ->withCount([
                'orders as orders_count' => fn ($query) => $query->where('store_id', $storeId),
            ])
            ->withSum([
                'orders as total_spent' => fn ($query) => $query
                    ->where('store_id', $storeId)
                    ->where('payment_status', 'paid'),
            ], 'total')
            ->distinct();
    }

    /**
     * @return array<string, mixed>
     */
    private function transformCustomerSummary(User $customer): array
    {
        return [
            'id' => (int) $customer->id,
            'name' => (string) $customer->name,
            'email' => (string) $customer->email,
            'profile_type' => (string) ($customer->profile_type ?? 'private'),
            'phone' => $customer->phone !== null ? (string) $customer->phone : null,
            'is_banned' => (bool) $customer->is_banned,
            'orders_count' => isset($customer->orders_count) ? (int) $customer->orders_count : 0,
            'total_spent' => isset($customer->total_spent) ? (float) $customer->total_spent : 0.0,
            'created_at' => $customer->created_at?->toIso8601String(),
            'updated_at' => $customer->updated_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function transformCustomerDetail(User $customer): array
    {
        return array_merge($this->transformCustomerSummary($customer), [
            'first_name' => $customer->first_name !== null ? (string) $customer->first_name : null,
            'last_name' => $customer->last_name !== null ? (string) $customer->last_name : null,
            'company_name' => $customer->company_name !== null ? (string) $customer->company_name : null,
            'vat_number' => $customer->vat_number !== null ? (string) $customer->vat_number : null,
            'tax_code' => $customer->tax_code !== null ? (string) $customer->tax_code : null,
            'billing_address' => $customer->billing_address !== null ? (string) $customer->billing_address : null,
            'billing_city' => $customer->billing_city !== null ? (string) $customer->billing_city : null,
            'billing_province' => $customer->billing_province !== null ? (string) $customer->billing_province : null,
            'billing_postal_code' => $customer->billing_postal_code !== null ? (string) $customer->billing_postal_code : null,
            'billing_country' => $customer->billing_country !== null ? (string) $customer->billing_country : null,
            'banned_at' => $customer->banned_at?->toIso8601String(),
            'banned_reason' => $customer->banned_reason !== null ? (string) $customer->banned_reason : null,
        ]);
    }
}
