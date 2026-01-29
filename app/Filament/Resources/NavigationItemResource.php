<?php

namespace App\Filament\Resources;

use App\Filament\Resources\NavigationItemResource\Pages;
use App\Models\NavigationItem;
use App\Models\Page;
use App\Models\Category;
use App\Models\Product;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Tables\Columns\TextColumn;

class NavigationItemResource extends Resource
{
    protected static ?string $model = NavigationItem::class;

    protected static ?string $navigationIcon = 'heroicon-o-bars-3';

    protected static ?string $navigationLabel = 'Menu di Navigazione';

    protected static ?string $modelLabel = 'Voce di Menu';

    protected static ?string $pluralModelLabel = 'Voci di Menu';

    protected static ?int $navigationSort = 5;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Group::make()
                    ->schema([
                        Forms\Components\Section::make('📍 Posizione Menu')
                            ->description('Seleziona se questo elemento apparirà in Header o Footer')
                            ->schema([
                                Forms\Components\ToggleButtons::make('location')
                                    ->label('Dove vuoi posizionare questo menu?')
                                    ->options(NavigationItem::LOCATIONS)
                                    ->required()
                                    ->live()
                                    ->inline()
                                    ->colors([
                                        'header' => 'info',
                                        'footer' => 'warning',
                                    ])
                                    ->icons([
                                        'header' => 'heroicon-o-arrow-up',
                                        'footer' => 'heroicon-o-arrow-down',
                                    ]),
                            ]),

                        Forms\Components\Section::make('Informazioni Voce Menu')
                            ->description('Configurazione del link o del sottomenu')
                            ->schema([
                                Forms\Components\TextInput::make('label')
                                    ->label('Etichetta (Testo visibile)')
                                    ->required()
                                    ->maxLength(255)
                                    ->helperText('Il testo che verrà visualizzato nel menu'),

                                Forms\Components\Select::make('type')
                                    ->label('Tipo di Link')
                                    ->options(NavigationItem::TYPES)
                                    ->required()
                                    ->live()
                                    ->helperText('Scegli se collegare a una pagina, categoria, prodotto o URL personalizzato'),

                                // Link personalizzato
                                Forms\Components\TextInput::make('url')
                                    ->label('URL')
                                    ->url()
                                    ->visible(fn(Forms\Get $get) => $get('type') === 'custom')
                                    ->helperText('Es: https://example.com o /custom-page'),

                                // Pagina
                                Forms\Components\Select::make('page_id')
                                    ->label('Seleziona Pagina')
                                    ->options(Page::query()->pluck('title', 'id'))
                                    ->searchable()
                                    ->visible(fn(Forms\Get $get) => $get('type') === 'page')
                                    ->helperText('Collega a una pagina pubblicata'),

                                // Categoria
                                Forms\Components\Select::make('category_id')
                                    ->label('Seleziona Categoria')
                                    ->options(Category::query()->pluck('name', 'id'))
                                    ->searchable()
                                    ->visible(fn(Forms\Get $get) => $get('type') === 'category')
                                    ->helperText('Collega a una categoria di prodotti'),

                                // Prodotto
                                Forms\Components\Select::make('product_id')
                                    ->label('Seleziona Prodotto')
                                    ->options(Product::query()->pluck('name', 'id'))
                                    ->searchable()
                                    ->visible(fn(Forms\Get $get) => $get('type') === 'product')
                                    ->helperText('Collega a un singolo prodotto'),

                                Forms\Components\Select::make('target')
                                    ->label('Apri in')
                                    ->options(NavigationItem::TARGETS)
                                    ->default('_self')
                                    ->helperText('Stessa finestra o nuova scheda'),
                            ]),

                        Forms\Components\Section::make('Sottomenu e Ordine')
                            ->description('Configura se questo elemento è un sottomenu di un altro')
                            ->schema([
                                Forms\Components\Select::make('parent_id')
                                    ->label('Questo è un sottomenu di:')
                                    ->options(function (Forms\Get $get) {
                                        $location = $get('location') ?? request()->query('location') ?? 'header';
                                        return NavigationItem::whereNull('parent_id')
                                            ->where('location', $location)
                                            ->pluck('label', 'id');
                                    })
                                    ->placeholder('Nessuno (elemento principale)')
                                    ->live()
                                    ->helperText('Se vuoi creare un sottomenu, seleziona il menu principale'),

                                Forms\Components\TextInput::make('sort_order')
                                    ->label('Posizione Elemento')
                                    ->numeric()
                                    ->default(0)
                                    ->helperText('Numeri più bassi appariranno prima'),
                            ]),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('location')
                    ->label('Posizione')
                    ->formatStateUsing(fn(string $state) => $state === 'header' ? '📍 Header' : '📍 Footer')
                    ->badge()
                    ->color(fn(string $state) => $state === 'header' ? 'info' : 'warning'),

                TextColumn::make('label')
                    ->label('Etichetta')
                    ->searchable()
                    ->formatStateUsing(fn(NavigationItem $record) => 
                        str_repeat('→ ', $record->parent_id ? 1 : 0) . $record->label
                    ),

                TextColumn::make('type')
                    ->label('Tipo')
                    ->formatStateUsing(fn(string $state) => NavigationItem::TYPES[$state] ?? $state)
                    ->badge()
                    ->color('success'),

                TextColumn::make('parent.label')
                    ->label('Sotto Menu Di')
                    ->placeholder('—')
                    ->limit(20),

                TextColumn::make('sort_order')
                    ->label('Ordine')
                    ->sortable(),

                TextColumn::make('created_at')
                    ->label('Creato')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('location')
                    ->label('📍 Posizione')
                    ->options(NavigationItem::LOCATIONS),

                Tables\Filters\SelectFilter::make('type')
                    ->label('Tipo')
                    ->options(NavigationItem::TYPES),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('location')
            ->reorderable('sort_order');
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListNavigationItems::route('/'),
            'create' => Pages\CreateNavigationItem::route('/create'),
            'edit' => Pages\EditNavigationItem::route('/{record}/edit'),
        ];
    }
}

