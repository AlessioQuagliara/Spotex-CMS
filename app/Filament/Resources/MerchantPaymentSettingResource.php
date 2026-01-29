<?php

namespace App\Filament\Resources;

use App\Filament\Resources\MerchantPaymentSettingResource\Pages;
use App\Models\MerchantPaymentSetting;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class MerchantPaymentSettingResource extends Resource
{
    protected static ?string $model = MerchantPaymentSetting::class;

    protected static ?string $navigationIcon = 'heroicon-o-credit-card';

    protected static ?string $navigationLabel = 'Impostazioni Pagamenti Platform';

    protected static ?string $modelLabel = 'Impostazione Pagamenti';

    protected static ?string $pluralModelLabel = 'Impostazioni Pagamenti Platform';

    protected static ?int $navigationSort = 7;

    protected static ?string $navigationGroup = 'Configurazione';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Stripe Connect')
                    ->description('Configura Stripe Connect per ricevere commissioni automatiche')
                    ->schema([
                        Forms\Components\Toggle::make('stripe_connect_enabled')
                            ->label('Abilita Stripe Connect')
                            ->helperText('Attiva la modalità Platform per Stripe')
                            ->reactive(),
                        Forms\Components\TextInput::make('stripe_connected_account_id')
                            ->label('Connected Account ID')
                            ->helperText('ID dell\'account Stripe Connect del merchant (formato: acct_xxxx)')
                            ->placeholder('acct_1234567890')
                            ->visible(fn ($get) => $get('stripe_connect_enabled')),
                    ])->columns(1),

                Forms\Components\Section::make('PayPal Multiparty')
                    ->description('Configura PayPal Commerce Platform per commissioni multiparty')
                    ->schema([
                        Forms\Components\Toggle::make('paypal_multiparty_enabled')
                            ->label('Abilita PayPal Multiparty')
                            ->helperText('Richiede permessi PayPal Partner. Se non disponibile, usa modalità standard.')
                            ->reactive(),
                        Forms\Components\TextInput::make('paypal_merchant_id')
                            ->label('Merchant ID PayPal')
                            ->helperText('ID merchant PayPal del venditore')
                            ->placeholder('MERCHANT123')
                            ->visible(fn ($get) => $get('paypal_multiparty_enabled')),
                        Forms\Components\Placeholder::make('paypal_multiparty_warning')
                            ->label('')
                            ->content('⚠️ PayPal Multiparty richiede un account Partner. Se non hai i permessi, questa funzionalità farà fallback automatico a PayPal standard.')
                            ->visible(fn ($get) => $get('paypal_multiparty_enabled')),
                    ])->columns(1),

                Forms\Components\Section::make('Commissioni')
                    ->description('Definisci la commissione platform da applicare agli ordini')
                    ->schema([
                        Forms\Components\TextInput::make('commission_percent')
                            ->label('Percentuale (%)')
                            ->numeric()
                            ->step('0.01')
                            ->suffix('%')
                            ->helperText('Esempio: 5.50 per 5.5%')
                            ->default(0.00),
                        Forms\Components\TextInput::make('commission_fixed')
                            ->label('Importo Fisso (€)')
                            ->numeric()
                            ->step('0.01')
                            ->prefix('€')
                            ->helperText('Commissione fissa per ordine (es. 0.50 = €0.50)')
                            ->default(0.00),
                        Forms\Components\Placeholder::make('commission_formula')
                            ->label('Formula di Calcolo')
                            ->content('Commissione = (Totale × Percentuale / 100) + Fisso'),
                    ])->columns(2),

                Forms\Components\Section::make('Informazioni Business')
                    ->schema([
                        Forms\Components\TextInput::make('business_name')
                            ->label('Nome Business')
                            ->maxLength(255),
                        Forms\Components\TextInput::make('business_email')
                            ->label('Email Business')
                            ->email()
                            ->maxLength(255),
                        Forms\Components\Textarea::make('notes')
                            ->label('Note')
                            ->rows(3)
                            ->columnSpanFull(),
                    ])->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\IconColumn::make('stripe_connect_enabled')
                    ->label('Stripe')
                    ->boolean(),
                Tables\Columns\TextColumn::make('stripe_connected_account_id')
                    ->label('Stripe Account')
                    ->limit(20),
                Tables\Columns\IconColumn::make('paypal_multiparty_enabled')
                    ->label('PayPal')
                    ->boolean(),
                Tables\Columns\TextColumn::make('paypal_merchant_id')
                    ->label('PayPal Merchant')
                    ->limit(20),
                Tables\Columns\TextColumn::make('commission_percent')
                    ->label('Commission %')
                    ->suffix('%'),
                Tables\Columns\TextColumn::make('commission_fixed')
                    ->label('Commission €')
                    ->money('EUR'),
            ])
            ->filters([
                //
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    // No bulk actions needed - single settings record
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListMerchantPaymentSettings::route('/'),
            'create' => Pages\CreateMerchantPaymentSetting::route('/create'),
            'edit' => Pages\EditMerchantPaymentSetting::route('/{record}/edit'),
        ];
    }
}
