<?php

namespace App\Filament\Resources;

use App\Filament\Resources\PageResource\Pages;
use App\Filament\Resources\PageResource\RelationManagers;
use App\Models\Page;
use App\Support\Tenancy\TenantContext;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;
use Illuminate\Validation\Rules\Unique;

class PageResource extends Resource
{
    protected static ?string $model = Page::class;

    protected static ?string $navigationIcon = 'heroicon-o-document';
    protected static ?string $navigationLabel = 'Pagine';
    protected static ?int $navigationSort = 4;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Informazioni Base')->schema([
                    Forms\Components\TextInput::make('title')
                        ->label('Titolo Pagina')
                        ->required()
                        ->live()
                        ->afterStateUpdated(fn($state, callable $set) => $set('slug', str()->slug($state))),
                    Forms\Components\TextInput::make('slug')
                        ->label('Slug URL')
                        ->required()
                        ->unique(
                            ignoreRecord: true,
                            modifyRuleUsing: fn (Unique $rule) => $rule->where('store_id', static::currentStoreId())
                        ),
                ])->columns(2),

                Forms\Components\Section::make('SEO')->schema([
                    Forms\Components\Textarea::make('description')
                        ->label('Meta Description')
                        ->helperText('Circa 155 caratteri')
                        ->rows(2),
                    Forms\Components\Textarea::make('keywords')
                        ->label('Meta Keywords')
                        ->helperText('Separate da virgola')
                        ->rows(2),
                ])->columns(2),

                Forms\Components\Section::make('Contenuto')->schema([
                    Forms\Components\Actions::make([
                        Forms\Components\Actions\Action::make('builder')
                            ->label('Apri Builder')
                            ->icon('heroicon-o-pencil-square')
                            ->visible(fn (?Page $record): bool => $record !== null)
                            ->url(fn (?Page $record): ?string => $record ? route('pages.builder-v2', $record) : null)
                            ->openUrlInNewTab(),
                        Forms\Components\Actions\Action::make('code')
                            ->label('Modifica Codice')
                            ->icon('heroicon-o-code-bracket')
                            ->visible(fn (?Page $record): bool => $record !== null)
                            ->url(fn (?Page $record): ?string => $record ? route('pages.code', $record) : null)
                            ->openUrlInNewTab(),
                    ])->fullWidth(),
                ]),

                Forms\Components\Section::make('Pubblica')->schema([
                    Forms\Components\Toggle::make('is_published')
                        ->label('Pagina Pubblicata'),
                ])->columns(1),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('title')
                    ->label('Titolo')
                    ->sortable()
                    ->searchable(),
                Tables\Columns\TextColumn::make('slug')
                    ->label('Slug')
                    ->sortable()
                    ->searchable(),
                Tables\Columns\IconColumn::make('is_published')
                    ->label('Pubblicata')
                    ->boolean(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Creata')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('is_published')
                    ->label('Stato'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\Action::make('builder')
                    ->label('Apri Builder')
                    ->icon('heroicon-o-pencil-square')
                    ->url(fn (Page $record) => route('pages.builder-v2', $record))
                    ->openUrlInNewTab(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        $query = parent::getEloquentQuery();
        $storeId = static::currentStoreId();

        if ($storeId === null) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where('store_id', $storeId);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListPages::route('/'),
            'create' => Pages\CreatePage::route('/create'),
            'edit' => Pages\EditPage::route('/{record}/edit'),
        ];
    }

    protected static function currentStoreId(): ?int
    {
        if (!app()->bound(TenantContext::class)) {
            return null;
        }

        /** @var TenantContext $context */
        $context = app(TenantContext::class);

        return $context->storeId();
    }
}
