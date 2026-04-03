<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
            'remember_token' => Str::random(10),
            'is_admin' => false,
            'role' => User::ROLE_CUSTOMER,
            'profile_type' => 'private',
            'is_banned' => false,
        ];
    }

    public function admin(): static
    {
        return $this->state(fn () => [
            'is_admin' => true,
            'role' => User::ROLE_ADMIN,
        ]);
    }
}
