<?php

namespace App\Filament\Resources;

use App\Models\Order;
use App\Support\Tenancy\TenantContext;
use Illuminate\Support\Facades\DB;
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
use Filament\Tables\Actions\BulkActionGroup;
use Filament\Tables\Actions\BulkAction;
use Filament\Tables\Filters\SelectFilter;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Builder;

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
                            ->disabled(),
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
        ])->bulkActions([
            BulkActionGroup::make([
                BulkAction::make('mark_as_paid')
                    ->label('Segna come Pagato')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->action(function (Collection $records) {
                        foreach ($records as $record) {
                            DB::transaction(function () use ($record) {
                                $order = Order::query()->lockForUpdate()->find($record->id);
                                if ($order && $order->payment_status === 'pending') {
                                    $order->markAsPaid('manual-' . $order->id, 'manual');
                                }
                            });
                        }
                    }),
                
                BulkAction::make('mark_as_shipped')
                    ->label('Segna come Spedito')
                    ->icon('heroicon-o-truck')
                    ->color('info')
                    ->requiresConfirmation()
                    ->action(function (Collection $records) {
                        DB::transaction(function () use ($records) {
                            foreach ($records as $record) {
                                $order = Order::query()->lockForUpdate()->find($record->id);
                                if ($order && $order->payment_status === 'paid' && $order->shipping_status === 'not_shipped') {
                                    $order->update(['shipping_status' => 'shipped', 'shipped_at' => now()]);
                                }
                            }
                        });
                    }),
                
                BulkAction::make('mark_as_delivered')
                    ->label('Segna come Consegnato')
                    ->icon('heroicon-o-check-badge')
                    ->color('success')
                    ->requiresConfirmation()
                    ->action(function (Collection $records) {
                        DB::transaction(function () use ($records) {
                            foreach ($records as $record) {
                                $order = Order::query()->lockForUpdate()->find($record->id);
                                if ($order && $order->shipping_status === 'shipped') {
                                    $order->update(['shipping_status' => 'delivered', 'delivered_at' => now()]);
                                }
                            }
                        });
                    }),
                
                BulkAction::make('update_payment_status')
                    ->label('Cambia Stato Pagamento')
                    ->icon('heroicon-o-banknotes')
                    ->form([
                        Select::make('payment_status')
                            ->label('Stato Pagamento')
                            ->options([
                                'pending' => 'In Sospeso',
                                'paid' => 'Pagato',
                                'failed' => 'Fallito',
                                'refunded' => 'Rimborsato',
                            ])
                            ->required(),
                    ])
                    ->action(function (Collection $records, array $data) {
                        foreach ($records as $record) {
                            DB::transaction(function () use ($record, $data) {
                                $order = Order::query()->lockForUpdate()->find($record->id);
                                if (!$order) {
                                    return;
                                }
                                if ($data['payment_status'] === 'paid' && $order->payment_status !== 'pending') {
                                    return;
                                }
                                $update = ['payment_status' => $data['payment_status']];
                                if ($data['payment_status'] === 'paid' && !$order->paid_at) {
                                    $update['paid_at'] = now();
                                    $update['status'] = 'paid';
                                }
                                $order->update($update);
                            });
                        }
                    }),
                
                BulkAction::make('update_shipping_status')
                    ->label('Cambia Stato Spedizione')
                    ->icon('heroicon-o-truck')
                    ->form([
                        Select::make('shipping_status')
                            ->label('Stato Spedizione')
                            ->options([
                                'not_shipped' => 'Non Spedito',
                                'shipped' => 'Spedito',
                                'delivered' => 'Consegnato',
                                'returned' => 'Reso',
                            ])
                            ->required(),
                    ])
                    ->action(function (Collection $records, array $data) {
                        DB::transaction(function () use ($records, $data) {
                            foreach ($records as $record) {
                                $order = Order::query()->lockForUpdate()->find($record->id);
                                if (!$order) {
                                    continue;
                                }
                                $update = ['shipping_status' => $data['shipping_status']];
                                if ($data['shipping_status'] === 'shipped' && !$order->shipped_at) {
                                    $update['shipped_at'] = now();
                                }
                                if ($data['shipping_status'] === 'delivered' && !$order->delivered_at) {
                                    $update['delivered_at'] = now();
                                }
                                $order->update($update);
                            }
                        });
                    }),
            ]),
        ]);
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
            'index' => \App\Filament\Resources\OrderResource\Pages\ListOrders::route('/'),
            'edit' => \App\Filament\Resources\OrderResource\Pages\EditOrder::route('/{record}/edit'),
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
