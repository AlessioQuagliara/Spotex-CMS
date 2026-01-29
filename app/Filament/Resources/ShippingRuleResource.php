<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ShippingRuleResource\Pages;
use App\Filament\Resources\ShippingRuleResource\RelationManagers;
use App\Models\ShippingRule;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class ShippingRuleResource extends Resource
{
    protected static ?string $model = ShippingRule::class;

    protected static ?string $navigationIcon = 'heroicon-o-truck';

    protected static ?string $navigationLabel = 'Regole Spedizione';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Informazioni Spedizione')
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->label('Nome')
                            ->required()
                            ->columnSpanFull(),
                        Forms\Components\Select::make('type')
                            ->label('Tipo')
                            ->options([
                                'standard' => 'Standard',
                                'express' => 'Express',
                                'pickup' => 'Ritiro in Sede',
                                'cash on delivery' => 'Contrassegno',
                            ])
                            ->required()
                            ->unique()
                            ->disabled(fn ($record) => $record !== null),
                        Forms\Components\TextInput::make('base_cost')
                            ->label('Costo Base (€)')
                            ->numeric()
                            ->required()
                            ->step(0.01),
                    ])->columns(2),
                Forms\Components\Section::make('Spedizione Gratuita')
                    ->schema([
                        Forms\Components\TextInput::make('free_shipping_threshold')
                            ->label('Soglia Spedizione Gratuita (€)')
                            ->numeric()
                            ->nullable()
                            ->step(0.01)
                            ->helperText('Lascia vuoto per disabilitare'),
                        Forms\Components\Textarea::make('description')
                            ->label('Descrizione')
                            ->nullable()
                            ->columnSpanFull(),
                        Forms\Components\TextInput::make('estimated_days')
                            ->label('Giorni Stimati di Consegna')
                            ->numeric()
                            ->nullable()
                            ->helperText('Tempo stimato in giorni lavorativi'),
                        Forms\Components\Toggle::make('is_active')
                            ->label('Attivo')
                            ->default(true),
                    ])->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Nome')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('type')
                    ->label('Tipo')
                    ->badge()
                    ->color(fn ($state) => match($state) {
                        'standard' => 'gray',
                        'express' => 'warning',
                        'pickup' => 'success',
                        'cash on delivery' => 'info',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('base_cost')
                    ->label('Costo (€)')
                    ->money('EUR'),
                Tables\Columns\TextColumn::make('free_shipping_threshold')
                    ->label('Gratuita da (€)')
                    ->money('EUR')
                    ->placeholder('—'),
                Tables\Columns\BooleanColumn::make('is_active')
                    ->label('Attivo'),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('Stato'),
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

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListShippingRules::route('/'),
            'create' => Pages\CreateShippingRule::route('/create'),
            'edit' => Pages\EditShippingRule::route('/{record}/edit'),
        ];
    }
}
