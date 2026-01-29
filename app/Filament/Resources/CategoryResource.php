<?php

namespace App\Filament\Resources;

use App\Models\Category;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Section;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Actions\DeleteAction;

class CategoryResource extends Resource
{
    protected static ?string $model = Category::class;
    protected static ?string $navigationIcon = 'heroicon-o-tag';
    protected static ?string $navigationLabel = 'Categorie';
    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Section::make('Informazioni Categoria')->schema([
                TextInput::make('name')
                    ->label('Nome')
                    ->required()
                    ->unique(ignoreRecord: true),
                TextInput::make('slug')
                    ->label('Slug')
                    ->required()
                    ->unique(ignoreRecord: true),
                Textarea::make('description')
                    ->label('Descrizione')
                    ->columnSpanFull(),
                Select::make('parent_id')
                    ->label('Categoria Genitore')
                    ->relationship('parent', 'name')
                    ->preload()
                    ->searchable(),
                TextInput::make('order')
                    ->label('Ordine')
                    ->numeric()
                    ->default(0),
            ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            TextColumn::make('name')
                ->label('Nome')
                ->sortable()
                ->searchable(),
            TextColumn::make('slug')
                ->label('Slug')
                ->searchable(),
            TextColumn::make('parent.name')
                ->label('Categoria Genitore')
                ->default('-'),
            TextColumn::make('order')
                ->label('Ordine')
                ->sortable(),
        ])->actions([
            EditAction::make(),
            DeleteAction::make(),
        ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => \App\Filament\Resources\CategoryResource\Pages\ListCategories::route('/'),
            'create' => \App\Filament\Resources\CategoryResource\Pages\CreateCategory::route('/create'),
            'edit' => \App\Filament\Resources\CategoryResource\Pages\EditCategory::route('/{record}/edit'),
        ];
    }
}
