<?php

namespace App\Filament\Resources;

use App\Models\Order;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\BadgeColumn;
use Filament\Tables\Table;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Filters\SelectFilter;

class OrderResource extends Resource
{
    protected static ?string $model = Order::class;
    protected static ?string $navigationIcon = 'heroicon-o-shopping-cart';
    protected static ?string $navigationLabel = 'Ordini';
    protected static ?int $navigationSort = 3;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Section::make('Dettagli Ordine')->schema([
                TextInput::make('id')
                    ->label('ID Ordine')
                    ->disabled(),
                TextInput::make('user.email')
                    ->label('Cliente')
                    ->disabled(),
                TextInput::make('transaction_id')
                    ->label('ID Transazione')
                    ->disabled(),
                TextInput::make('total')
                    ->label('Totale (€)')
                    ->numeric()
                    ->disabled(),
                TextInput::make('payment_method')
                    ->label('Metodo Pagamento')
                    ->disabled(),
                DateTimePicker::make('paid_at')
                    ->label('Data Pagamento')
                    ->disabled(),
            ])->columns(2),

            Section::make('Stato e Spedizione')->schema([
                Select::make('payment_status')
                    ->label('Stato Pagamento')
                    ->options([
                        'pending' => 'In Sospeso',
                        'paid' => 'Pagato',
                        'failed' => 'Fallito',
                        'refunded' => 'Rimborsato',
                    ])
                    ->disabled(fn(?Order $record) => $record?->payment_status !== 'pending')
                    ->required(),
                Select::make('shipping_status')
                    ->label('Stato Spedizione')
                    ->options([
                        'not_shipped' => 'Non Spedito',
                        'shipped' => 'Spedito',
                        'delivered' => 'Consegnato',
                        'returned' => 'Reso',
                    ])
                    ->disabled(fn(?Order $record) => $record?->payment_status !== 'paid')
                    ->required(),
                TextInput::make('tracking_number')
                    ->label('Numero Tracciamento')
                    ->visible(fn(?Order $record) => $record?->isShipped()),
                DateTimePicker::make('shipped_at')
                    ->label('Data Spedizione')
                    ->disabled(fn(?Order $record) => !$record?->isPaid())
                    ->visible(fn(?Order $record) => $record?->isPaid()),
                DateTimePicker::make('delivered_at')
                    ->label('Data Consegna')
                    ->disabled(fn(?Order $record) => !$record?->isDelivered())
                    ->visible(fn(?Order $record) => $record?->isDelivered()),
            ])->columns(2),

            Section::make('Indirizzi')->schema([
                Textarea::make('shipping_address')
                    ->label('Indirizzo Spedizione')
                    ->disabled(fn(?Order $record) => $record?->isPaid()),
                Textarea::make('billing_address')
                    ->label('Indirizzo Fatturazione')
                    ->disabled(fn(?Order $record) => $record?->isPaid()),
            ])->columns(2),

            Section::make('Articoli Ordine')->schema([
                Repeater::make('items')
                    ->relationship('items')
                    ->disabled(fn(?Order $record) => $record?->isPaid())
                    ->schema([
                        TextInput::make('product.name')
                            ->label('Prodotto')
                            ->disabled(),
                        TextInput::make('quantity')
                            ->label('Quantità')
                            ->numeric()
                            ->disabled(fn(?Order $record) => $record?->isPaid()),
                        TextInput::make('unit_price')
                            ->label('Prezzo Unitario')
                            ->numeric()
                            ->disabled(),
                        TextInput::make('subtotal')
                            ->label('Subtotale')
                            ->numeric()
                            ->disabled(),
                    ])->columns(4)
                    ->columnSpanFull(),
            ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            TextColumn::make('id')
                ->label('ID')
                ->sortable(),
            TextColumn::make('user.email')
                ->label('Cliente')
                ->sortable()
                ->searchable(),
            BadgeColumn::make('payment_status')
                ->label('Pagamento')
                ->colors([
                    'warning' => 'pending',
                    'success' => 'paid',
                    'danger' => 'failed',
                    'gray' => 'refunded',
                ])
                ->formatStateUsing(fn($state) => match($state) {
                    'pending' => 'In Sospeso',
                    'paid' => 'Pagato',
                    'failed' => 'Fallito',
                    'refunded' => 'Rimborsato',
                    default => $state,
                })
                ->sortable(),
            BadgeColumn::make('shipping_status')
                ->label('Spedizione')
                ->colors([
                    'warning' => 'not_shipped',
                    'info' => 'shipped',
                    'success' => 'delivered',
                    'gray' => 'returned',
                ])
                ->formatStateUsing(fn($state) => match($state) {
                    'not_shipped' => 'Non Spedito',
                    'shipped' => 'Spedito',
                    'delivered' => 'Consegnato',
                    'returned' => 'Reso',
                    default => $state,
                })
                ->sortable(),
            TextColumn::make('total')
                ->label('Totale')
                ->sortable()
                ->money('EUR'),
            TextColumn::make('payment_method')
                ->label('Pagamento')
                ->sortable(),
            TextColumn::make('created_at')
                ->label('Data')
                ->dateTime('d/m/Y H:i')
                ->sortable(),
        ])->filters([
            SelectFilter::make('payment_status')
                ->label('Pagamento')
                ->options([
                    'pending' => 'In Sospeso',
                    'paid' => 'Pagato',
                    'failed' => 'Fallito',
                    'refunded' => 'Rimborsato',
                ]),
            SelectFilter::make('shipping_status')
                ->label('Spedizione')
                ->options([
                    'not_shipped' => 'Non Spedito',
                    'shipped' => 'Spedito',
                    'delivered' => 'Consegnato',
                    'returned' => 'Reso',
                ]),
        ])->defaultSort('created_at', 'desc')->actions([
            EditAction::make(),
        ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => \App\Filament\Resources\OrderResource\Pages\ListOrders::route('/'),
            'edit' => \App\Filament\Resources\OrderResource\Pages\EditOrder::route('/{record}/edit'),
        ];
    }
}
