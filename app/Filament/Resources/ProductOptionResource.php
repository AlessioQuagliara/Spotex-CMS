<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ProductOptionResource\Pages;
use App\Models\ProductOption;
use App\Support\Tenancy\TenantContext;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class ProductOptionResource extends Resource
{
    protected static ?string $model = ProductOption::class;

    protected static ?string $navigationIcon = 'heroicon-o-adjustments-horizontal';
    protected static ?string $navigationLabel = 'Opzioni Prodotto';
    protected static ?string $navigationGroup = 'Catalogo';
    protected static ?int $navigationSort = 9;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Opzione')
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
                    Forms\Components\TextInput::make('name')
                        ->label('Nome Opzione')
                        ->required()
                        ->maxLength(120),
                    Forms\Components\TextInput::make('position')
                        ->label('Posizione')
                        ->numeric()
                        ->default(0)
                        ->minValue(0),
                ])->columns(2),

            Forms\Components\Section::make('Valori')
                ->schema([
                    Forms\Components\Repeater::make('values')
                        ->relationship('values')
                        ->schema([
                            Forms\Components\TextInput::make('value')
                                ->label('Valore')
                                ->required()
                                ->maxLength(120),
                            Forms\Components\TextInput::make('position')
                                ->label('Posizione')
                                ->numeric()
                                ->default(0)
                                ->minValue(0),
                        ])
                        ->columns(2)
                        ->addActionLabel('Aggiungi valore')
                        ->columnSpanFull(),
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
                Tables\Columns\TextColumn::make('name')
                    ->label('Opzione')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('position')
                    ->label('Posizione')
                    ->sortable(),
                Tables\Columns\TextColumn::make('values_count')
                    ->label('Valori')
                    ->counts('values'),
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
        return static::applyStoreFilter(parent::getEloquentQuery())->withCount('values');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListProductOptions::route('/'),
            'create' => Pages\CreateProductOption::route('/create'),
            'edit' => Pages\EditProductOption::route('/{record}/edit'),
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
