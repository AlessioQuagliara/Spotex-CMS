<?php

namespace App\Filament\Resources;

use App\Filament\Resources\FooterSettingResource\Pages;
use App\Models\Setting;
use Illuminate\Database\Eloquent\Builder;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class FooterSettingResource extends Resource
{
    protected static ?string $model = Setting::class;

    protected static ?string $navigationIcon = 'heroicon-o-document-text';

    protected static ?string $navigationLabel = 'Impostazioni Footer';

    protected static ?string $modelLabel = 'Impostazione Footer';

    protected static ?string $pluralModelLabel = 'Impostazioni Footer';

    protected static ?int $navigationSort = 6;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Testo Footer')
                    ->schema([
                        Forms\Components\Hidden::make('key')
                            ->default('business_powered_by')
                            ->dehydrated(true),
                        Forms\Components\TextInput::make('value')
                            ->label('Powered by')
                            ->default('Spotex CMS')
                            ->helperText('Testo che apparirà nel footer (es: "Powered by Spotex CMS")'),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('value')
                    ->label('Powered by')
                    ->limit(120),
            ])
            ->filters([
                //
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    // no bulk actions
                ]),
            ]);
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->where('key', 'business_powered_by');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListFooterSettings::route('/'),
            'create' => Pages\CreateFooterSetting::route('/create'),
            'edit' => Pages\EditFooterSetting::route('/{record}/edit'),
        ];
    }
}
