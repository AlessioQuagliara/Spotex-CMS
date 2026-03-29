<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Page;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PageBuilderCrudTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(VerifyCsrfToken::class);
        $this->withoutMiddleware(ValidateCsrfToken::class);
    }

    public function test_authenticated_user_can_save_versioned_builder_payload(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $page = Page::query()->create([
            'title' => 'Landing Test',
            'slug' => 'landing-test',
            'is_published' => false,
        ]);

        $payload = [
            'schema_version' => 'craft-v1',
            'document' => [
                'ROOT' => [
                    'type' => ['resolvedName' => 'Canvas'],
                    'isCanvas' => true,
                    'props' => [],
                    'displayName' => 'Root',
                    'custom' => [],
                    'hidden' => false,
                    'nodes' => ['node-1'],
                    'linkedNodes' => [],
                ],
                'node-1' => [
                    'type' => ['resolvedName' => 'Text'],
                    'isCanvas' => false,
                    'props' => ['text' => 'Ciao Spotex'],
                    'displayName' => 'Text',
                    'custom' => [],
                    'hidden' => false,
                    'nodes' => [],
                    'linkedNodes' => [],
                ],
            ],
            'elements' => [
                [
                    'id' => 'node-1',
                    'type' => 'text',
                    'content' => ['text' => 'Ciao Spotex'],
                    'styles' => [],
                ],
            ],
            'modules' => [
                [
                    'id' => 'hero-1',
                    'type' => 'hero',
                    'config' => ['title' => 'Hero'],
                ],
            ],
            'meta' => [
                'title' => 'Landing Test',
            ],
            'html' => '<section onclick="alert(1)">Test<script>alert(1)</script></section>',
            'css' => '.hero { color: red; } body { background: expression(alert(1)); }',
            'js' => '<script>console.log("ok")</script>',
        ];

        $response = $this->actingAs($user)->postJson('/api/pages/landing-test/builder/craft/save', $payload);

        $response->assertOk()->assertJsonPath('success', true);

        $page = $page->fresh();

        $this->assertSame('craft-v1', $page->builder_schema_version);
        $this->assertIsArray($page->builder_document);
        $this->assertSame('Canvas', $page->builder_document['ROOT']['type']['resolvedName']);
        $this->assertStringContainsString('Ciao Spotex', $page->html_content);
        $this->assertStringNotContainsString('alert(1)', $page->html_content);
        $this->assertStringNotContainsString('expression', $page->css_content);
        $this->assertSame('console.log("ok")', $page->js_content);
    }

    public function test_public_page_renders_from_builder_document_and_ignores_legacy_html(): void
    {
        $category = Category::query()->create([
            'name' => 'Outdoor',
            'slug' => 'outdoor',
            'description' => 'Prodotti outdoor',
            'order' => 1,
        ]);

        $product = Product::query()->create([
            'name' => 'Zaino Tecnico',
            'slug' => 'zaino-tecnico',
            'description' => 'Zaino leggero per escursioni.',
            'price' => 129.90,
            'stock' => 10,
            'category_id' => $category->id,
            'is_active' => true,
        ]);

        ProductImage::query()->create([
            'product_id' => $product->id,
            'image_path' => 'products/zaino.jpg',
            'alt_text' => 'Zaino Tecnico',
            'order' => 1,
            'is_primary' => true,
        ]);

        Page::query()->create([
            'title' => 'Landing Catalogo',
            'slug' => 'landing-catalogo',
            'is_published' => true,
            'html_content' => '<div>legacy render</div>',
            'builder_schema_version' => 'craft-v1',
            'builder_document' => [
                'ROOT' => [
                    'type' => ['resolvedName' => 'Canvas'],
                    'isCanvas' => true,
                    'props' => [],
                    'displayName' => 'Root',
                    'custom' => [],
                    'hidden' => false,
                    'nodes' => ['grid-1', 'feed-1'],
                    'linkedNodes' => [],
                ],
                'grid-1' => [
                    'type' => ['resolvedName' => 'ProductGridBlock'],
                    'isCanvas' => false,
                    'props' => [
                        'heading' => 'Prodotti in evidenza',
                        'categoryId' => $category->id,
                        'limit' => 4,
                        'columns' => 2,
                        'sortBy' => 'latest',
                        'emptyText' => 'Vuoto',
                    ],
                    'displayName' => 'ProductGridBlock',
                    'custom' => [],
                    'hidden' => false,
                    'nodes' => [],
                    'linkedNodes' => [],
                ],
                'feed-1' => [
                    'type' => ['resolvedName' => 'CategoryFeedBlock'],
                    'isCanvas' => false,
                    'props' => [
                        'heading' => 'Categorie live',
                        'parentCategoryId' => null,
                        'limit' => 6,
                        'emptyText' => 'Vuoto',
                    ],
                    'displayName' => 'CategoryFeedBlock',
                    'custom' => [],
                    'hidden' => false,
                    'nodes' => [],
                    'linkedNodes' => [],
                ],
            ],
        ]);

        $response = $this->get('/landing-catalogo');

        $response->assertOk();
        $response->assertSee('Prodotti in evidenza');
        $response->assertSee('Zaino Tecnico');
        $response->assertSee('Categorie live');
        $response->assertSee('Outdoor');
        $response->assertDontSee('legacy render');
    }

    public function test_builder_save_requires_document_or_elements(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $page = Page::query()->create([
            'title' => 'Landing Invalid',
            'slug' => 'landing-invalid',
            'is_published' => false,
        ]);

        $response = $this->actingAs($user)->postJson('/api/pages/landing-invalid/builder/craft/save', [
            'schema_version' => 'craft-v1',
        ]);

        $response->assertStatus(422);
        $this->assertNotNull($page->fresh());
    }

    public function test_authenticated_user_can_crud_page_modules(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        $createResponse = $this->actingAs($user)->postJson('/api/page-modules', [
            'name' => 'Hero Promo',
            'slug' => 'hero-promo',
            'type' => 'hero',
            'schema_version' => 'craft-v1',
            'config' => ['fields' => ['title', 'subtitle']],
            'defaults' => ['title' => 'Default Hero'],
            'is_active' => true,
        ]);

        $createResponse->assertStatus(201)->assertJsonPath('slug', 'hero-promo');

        $moduleId = $createResponse->json('id');

        $this->actingAs($user)
            ->putJson('/api/page-modules/' . $moduleId, [
                'name' => 'Hero Promo Updated',
            ])
            ->assertOk()
            ->assertJsonPath('name', 'Hero Promo Updated');

        $this->actingAs($user)
            ->getJson('/api/page-modules')
            ->assertOk()
            ->assertJsonCount(1);

        $this->actingAs($user)
            ->deleteJson('/api/page-modules/' . $moduleId)
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_authenticated_user_can_crud_page_templates(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        $createResponse = $this->actingAs($user)->postJson('/api/page-templates', [
            'name' => 'Landing Base',
            'slug' => 'landing-base',
            'schema_version' => 'craft-v1',
            'document' => [
                'ROOT' => [
                    'type' => ['resolvedName' => 'Canvas'],
                    'isCanvas' => true,
                    'props' => [],
                    'displayName' => 'Root',
                    'custom' => [],
                    'hidden' => false,
                    'nodes' => [],
                    'linkedNodes' => [],
                ],
            ],
            'meta' => ['description' => 'template'],
            'is_active' => true,
        ]);

        $createResponse->assertStatus(201)->assertJsonPath('slug', 'landing-base');

        $templateId = $createResponse->json('id');

        $this->actingAs($user)
            ->patchJson('/api/page-templates/' . $templateId, [
                'name' => 'Landing Base 2',
            ])
            ->assertOk()
            ->assertJsonPath('name', 'Landing Base 2');

        $this->actingAs($user)
            ->getJson('/api/page-templates')
            ->assertOk()
            ->assertJsonCount(1);

        $this->actingAs($user)
            ->deleteJson('/api/page-templates/' . $templateId)
            ->assertOk()
            ->assertJsonPath('success', true);
    }
}
