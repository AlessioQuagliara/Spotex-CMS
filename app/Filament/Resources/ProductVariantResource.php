<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ProductVariantResource\Pages;
use App\Models\ProductVariant;
use App\Support\Tenancy\TenantContext;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\Rules\Unique;

class ProductVariantResource extends Resource
{
    protected static ?string $model = ProductVariant::class;

    protected static ?string $navigationIcon = 'heroicon-o-squares-2x2';
    protected static ?string $navigationLabel = 'Varianti Prodotto';
    protected static ?string $navigationGroup = 'Catalogo';
    protected static ?int $navigationSort = 10;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Variante')
                ->schema([
                    Forms\Components\Select::make('product_id')
                        ->label('Prodotto')
                        ->relationship(
                            name: 'product',
                            titleAttribute: 'name',
                            modifyQueryUsing: fn (Builder $query): Builder => static::applyStoreFilter($query)
                        )
                        ->required()
                        ->searchable()
                        ->preload(),
                    Forms\Components\TextInput::make('sku')
                        ->label('SKU')
                        ->required()
                        ->maxLength(120)
                        ->unique(
                            ignoreRecord: true,
                            modifyRuleUsing: fn (Unique $rule) => $rule->where('store_id', static::currentStoreId())
                        ),
                    Forms\Components\TextInput::make('barcode')
                        ->label('Barcode')
                        ->maxLength(120),
                    Forms\Components\TextInput::make('price')
                        ->label('Prezzo')
                        ->required()
                        ->numeric()
                        ->step(0.01)
                        ->minValue(0),
                    Forms\Components\TextInput::make('compare_at_price')
                        ->label('Prezzo di confronto')
                        ->numeric()
                        ->step(0.01)
                        ->minValue(0),
                    Forms\Components\Select::make('status')
                        ->label('Stato')
                        ->options(ProductVariant::statusOptions())
                        ->default(ProductVariant::STATUS_ACTIVE)
                        ->required(),
                    Forms\Components\TextInput::make('weight')
                        ->label('Peso (kg)')
                        ->numeric()
                        ->step(0.001)
                        ->minValue(0),
                ])->columns(2),

            Forms\Components\Section::make('Combinazione opzioni')
                ->schema([
                    Forms\Components\Select::make('optionValues')
                        ->label('Valori opzione')
                        ->relationship(
                            name: 'optionValues',
                            titleAttribute: 'value',
                            modifyQueryUsing: fn (Builder $query): Builder => static::applyStoreFilter($query)
                        )
                        ->multiple()
                        ->preload()
                        ->searchable(),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('product.name')
                    ->label('Prodotto')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('sku')
                    ->label('SKU')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('price')
                    ->label('Prezzo')
                    ->money('EUR')
                    ->sortable(),
                Tables\Columns\TextColumn::make('status')
                    ->label('Stato')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => ProductVariant::statusOptions()[$state] ?? $state),
                Tables\Columns\TextColumn::make('option_values_count')
                    ->label('Opzioni')
                    ->counts('optionValues'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getEloquentQuery(): Builder
    {
        return static::applyStoreFilter(parent::getEloquentQuery())->withCount('optionValues');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListProductVariants::route('/'),
            'create' => Pages\CreateProductVariant::route('/create'),
            'edit' => Pages\EditProductVariant::route('/{record}/edit'),
        ];
    }

    public static function currentStoreId(): ?int
    {
        if (!app()->bound(TenantContext::class)) {
            return null;
        }

        /** @var TenantContext $context */
        $context = app(TenantContext::class);

        return $context->storeId();
    }

    public static function applyStoreFilter(Builder $query): Builder
    {
        $storeId = static::currentStoreId();

        if ($storeId === null) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where($query->getModel()->getTable() . '.store_id', $storeId);
    }
}
