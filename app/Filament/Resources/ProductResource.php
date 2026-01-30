<?php

namespace App\Filament\Resources;

use App\Models\Product;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\View;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Table;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Actions\DeleteAction;

class ProductResource extends Resource
{
    protected static ?string $model = Product::class;
    protected static ?string $navigationIcon = 'heroicon-o-shopping-bag';
    protected static ?string $navigationLabel = 'Prodotti';
    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Section::make('Informazioni Prodotto')->schema([
                TextInput::make('name')
                    ->label('Nome Prodotto')
                    ->required()
                    ->live()
                    ->afterStateUpdated(fn($state, callable $set) => $set('slug', str()->slug($state))),
                TextInput::make('slug')
                    ->label('Slug')
                    ->required()
                    ->unique(ignoreRecord: true),
                Textarea::make('description')
                    ->label('Descrizione')
                    ->required()
                    ->columnSpanFull(),
                Select::make('category_id')
                    ->label('Categoria')
                    ->relationship('category', 'name')
                    ->required()
                    ->searchable(),
                TextInput::make('price')
                    ->label('Prezzo (€)')
                    ->numeric()
                    ->required()
                    ->step(0.01)
                    ->minValue(0),
                TextInput::make('stock')
                    ->label('Stock')
                    ->numeric()
                    ->required()
                    ->minValue(0),
                Toggle::make('is_active')
                    ->label('Attivo')
                    ->default(true),
            ])->columns(2),

            Section::make('Immagini')->schema([
                Repeater::make('images')
                    ->relationship('images')
                    ->schema([
                        FileUpload::make('image_path')
                            ->label('Immagine')
                            ->image()
                            ->required()
                            ->directory('products')
                            ->columnSpanFull(),
                        TextInput::make('alt_text')
                            ->label('Testo Alternativo')
                            ->columnSpan(1),
                        TextInput::make('order')
                            ->label('Ordine')
                            ->numeric()
                            ->default(0)
                            ->columnSpan(1),
                        Toggle::make('is_primary')
                            ->label('Immagine Principale')
                            ->columnSpanFull(),
                    ])->columns(2)
                    ->addActionLabel('Aggiungi Immagine')
                    ->columnSpanFull(),
            ]),

            Section::make('Contenuto Personalizzato')->schema([
                Hidden::make('custom_content_html')
                    ->dehydrated(true)
                    ->extraAttributes(['data-quill-target' => 'custom_content_html']),
                View::make('filament.forms.quill-editor')
                    ->viewData([
                        'label' => 'Contenuto Personalizzato',
                        'statePath' => 'data.custom_content_html',
                        'targetSelector' => 'input[data-quill-target="custom_content_html"]',
                    ])
                    ->columnSpanFull(),
            ])->columnSpanFull(),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            TextColumn::make('name')
                ->label('Nome')
                ->sortable()
                ->searchable(),
            TextColumn::make('category.name')
                ->label('Categoria')
                ->sortable()
                ->searchable(),
            TextColumn::make('price')
                ->label('Prezzo')
                ->sortable()
                ->money('EUR'),
            TextColumn::make('stock')
                ->label('Stock')
                ->sortable(),
            IconColumn::make('is_active')
                ->label('Attivo')
                ->boolean(),
        ])->actions([
            EditAction::make(),
            DeleteAction::make(),
        ])->defaultSort('name');
    }

    public static function getPages(): array
    {
        return [
            'index' => \App\Filament\Resources\ProductResource\Pages\ListProducts::route('/'),
            'create' => \App\Filament\Resources\ProductResource\Pages\CreateProduct::route('/create'),
            'edit' => \App\Filament\Resources\ProductResource\Pages\EditProduct::route('/{record}/edit'),
        ];
    }
}
