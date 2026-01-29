<?php

namespace App\Filament\Resources;

use App\Filament\Resources\CouponResource\Pages;
use App\Filament\Resources\CouponResource\RelationManagers;
use App\Models\Coupon;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class CouponResource extends Resource
{
    protected static ?string $model = Coupon::class;

    protected static ?string $navigationIcon = 'heroicon-o-ticket';

    protected static ?string $navigationLabel = 'Coupon';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Informazioni Coupon')
                    ->schema([
                        Forms\Components\TextInput::make('code')
                            ->label('Codice')
                            ->required()
                            ->unique()
                            ->columnSpanFull(),
                        Forms\Components\Select::make('type')
                            ->label('Tipo')
                            ->options([
                                'percentage' => 'Percentuale (%)',
                                'fixed' => 'Importo Fisso (€)',
                            ])
                            ->required(),
                        Forms\Components\TextInput::make('value')
                            ->label('Valore')
                            ->numeric()
                            ->required()
                            ->step(0.01),
                    ])->columns(2),
                Forms\Components\Section::make('Limiti Sconto')
                    ->schema([
                        Forms\Components\TextInput::make('max_discount')
                            ->label('Sconto Massimo (€)')
                            ->numeric()
                            ->nullable()
                            ->step(0.01)
                            ->helperText('Applicabile solo per percentuali'),
                        Forms\Components\TextInput::make('min_cart_amount')
                            ->label('Importo Minimo Carrello (€)')
                            ->numeric()
                            ->nullable()
                            ->step(0.01),
                    ])->columns(2),
                Forms\Components\Section::make('Utilizzi')
                    ->schema([
                        Forms\Components\TextInput::make('max_uses')
                            ->label('Utilizzi Massimi Totali')
                            ->numeric()
                            ->nullable(),
                        Forms\Components\TextInput::make('max_uses_per_customer')
                            ->label('Utilizzi per Cliente')
                            ->numeric()
                            ->default(1)
                            ->required(),
                    ])->columns(2),
                Forms\Components\Section::make('Validità')
                    ->schema([
                        Forms\Components\DatePicker::make('valid_from')
                            ->label('Data Inizio'),
                        Forms\Components\DatePicker::make('valid_until')
                            ->label('Data Fine'),
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
                Tables\Columns\TextColumn::make('code')
                    ->label('Codice')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('type')
                    ->label('Tipo')
                    ->formatStateUsing(fn ($state) => $state === 'percentage' ? '%' : '€')
                    ->badge(),
                Tables\Columns\TextColumn::make('value')
                    ->label('Valore')
                    ->numeric(decimalPlaces: 2),
                Tables\Columns\TextColumn::make('times_used')
                    ->label('Utilizzi'),
                Tables\Columns\TextColumn::make('valid_until')
                    ->label('Data Fine')
                    ->date('d/m/Y')
                    ->sortable(),
                Tables\Columns\BooleanColumn::make('is_active')
                    ->label('Attivo'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('type')
                    ->label('Tipo')
                    ->options([
                        'percentage' => 'Percentuale',
                        'fixed' => 'Importo Fisso',
                    ]),
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
            'index' => Pages\ListCoupons::route('/'),
            'create' => Pages\CreateCoupon::route('/create'),
            'edit' => Pages\EditCoupon::route('/{record}/edit'),
        ];
    }
}
