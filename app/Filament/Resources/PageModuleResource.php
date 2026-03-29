<?php

namespace App\Filament\Resources;

use App\Filament\Resources\PageModuleResource\Pages;
use App\Models\PageModule;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class PageModuleResource extends Resource
{
    protected static ?string $model = PageModule::class;

    protected static ?string $navigationIcon = 'heroicon-o-squares-plus';
    protected static ?string $navigationLabel = 'Libreria Moduli';
    protected static ?string $navigationGroup = 'Builder';
    protected static ?int $navigationSort = 5;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Modulo')->schema([
                Forms\Components\TextInput::make('name')
                    ->label('Nome')
                    ->required()
                    ->live(onBlur: true)
                    ->afterStateUpdated(fn ($state, callable $set) => $set('slug', str()->slug((string) $state))),
                Forms\Components\TextInput::make('slug')
                    ->label('Slug')
                    ->required()
                    ->unique(ignoreRecord: true),
                Forms\Components\Select::make('type')
                    ->label('Tipo')
                    ->options([
                        'product-grid' => 'Product Grid',
                        'category-feed' => 'Category Feed',
                        'hero' => 'Hero',
                        'section' => 'Section',
                        'custom' => 'Custom',
                    ])
                    ->required()
                    ->searchable(),
                Forms\Components\TextInput::make('schema_version')
                    ->label('Schema Version')
                    ->default('craft-v1')
                    ->required(),
                Forms\Components\Toggle::make('is_active')
                    ->label('Attivo')
                    ->default(true),
            ])->columns(2),
            Forms\Components\Section::make('Configurazione')->schema([
                Forms\Components\Textarea::make('config')
                    ->label('Config JSON')
                    ->rows(14)
                    ->required()
                    ->rules(['json'])
                    ->formatStateUsing(fn ($state) => self::encodeJson($state, self::defaultConfig()))
                    ->dehydrateStateUsing(fn (?string $state) => self::decodeJson($state, self::defaultConfig())),
                Forms\Components\Textarea::make('defaults')
                    ->label('Defaults JSON')
                    ->rows(10)
                    ->rules(['nullable', 'json'])
                    ->formatStateUsing(fn ($state) => self::encodeJson($state, []))
                    ->dehydrateStateUsing(fn (?string $state) => self::decodeJson($state, [])),
            ])->columns(1),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')->label('Nome')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('type')->label('Tipo')->badge(),
                Tables\Columns\TextColumn::make('schema_version')->label('Schema')->badge(),
                Tables\Columns\IconColumn::make('is_active')->label('Attivo')->boolean(),
                Tables\Columns\TextColumn::make('updated_at')->label('Aggiornato')->dateTime('d/m/Y H:i')->sortable(),
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
            ->defaultSort('name');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListPageModules::route('/'),
            'create' => Pages\CreatePageModule::route('/create'),
            'edit' => Pages\EditPageModule::route('/{record}/edit'),
        ];
    }

    private static function encodeJson(mixed $state, array $fallback): string
    {
        $value = is_array($state) ? $state : $fallback;

        return json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    }

    private static function decodeJson(?string $state, array $fallback): array
    {
        if ($state === null || trim($state) === '') {
            return $fallback;
        }

        $decoded = json_decode($state, true);

        return is_array($decoded) ? $decoded : $fallback;
    }

    private static function defaultConfig(): array
    {
        return [
            'component' => 'ProductGridBlock',
            'fields' => [
                'heading',
                'categoryId',
                'limit',
                'columns',
                'sortBy',
            ],
        ];
    }
}
