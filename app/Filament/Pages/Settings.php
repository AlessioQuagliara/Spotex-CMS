<?php

namespace App\Filament\Pages;

use App\Models\Setting;
use App\Services\ThemeService;
use App\Filament\Forms\Components\ThemeCards;
use Filament\Forms;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Forms\Form;
use Filament\Pages\Page;
use Filament\Notifications\Notification;
use Illuminate\Validation\Validator;

class Settings extends Page implements HasForms
{
    use InteractsWithForms;

    protected static ?string $navigationIcon = 'heroicon-o-cog-6-tooth';
    protected static string $view = 'filament.pages.settings';
    protected static ?string $title = 'Impostazioni';
    protected static ?string $navigationLabel = 'Impostazioni';
    protected static ?int $navigationSort = -1;

    public ?array $data = [];

    public function mount(): void
    {
        $this->data = [
            'theme' => Setting::get('theme', 'default'),
            'business_name' => Setting::get('business_name', 'La Tua Attività'),
            'business_description' => Setting::get('business_description', ''),
            'business_email' => Setting::get('business_email', ''),
            'business_phone' => Setting::get('business_phone', ''),
            'business_vat' => Setting::get('business_vat', ''),
            'business_logo' => Setting::get('business_logo', ''),
            'business_favicon' => Setting::get('business_favicon', ''),
            'color_primary' => Setting::get('color_primary', '#3B82F6'),
            'color_secondary' => Setting::get('color_secondary', '#1F2937'),
            'color_accent' => Setting::get('color_accent', '#F59E0B'),
        ];

        $this->form->fill($this->data);
    }

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Tema')
                    ->description('Seleziona il tema del sito')
                    ->schema([
                        Forms\Components\View::make('filament.forms.theme-selector-info')
                            ->viewData([
                                'currentTheme' => Setting::get('theme', 'default'),
                            ]),
                        
                        Forms\Components\TextInput::make('theme')
                            ->hidden()
                            ->default(Setting::get('theme', 'default')),
                    ]),

                Forms\Components\Section::make('Informazioni Aziendali')
                    ->description('Personalizza il tuo marchio')
                    ->schema([
                        Forms\Components\TextInput::make('business_name')
                            ->label('Nome Attività')
                            ->required()
                            ->helperText('Apparirà nella navbar e nel footer'),

                        Forms\Components\Textarea::make('business_description')
                            ->label('Descrizione')
                            ->rows(3)
                            ->helperText('Descrizione breve della tua attività'),

                        Forms\Components\TextInput::make('business_email')
                            ->label('Email')
                            ->email()
                            ->helperText('Email di contatto principale'),

                        Forms\Components\TextInput::make('business_phone')
                            ->label('Telefono')
                            ->tel()
                            ->helperText('Numero di telefono di contatto'),

                        Forms\Components\TextInput::make('business_vat')
                            ->label('Partita IVA')
                            ->helperText('Comparirà nel footer'),

                        Forms\Components\FileUpload::make('business_logo')
                            ->label('Logo Attività')
                            ->disk('public')
                            ->directory('settings')
                            ->maxSize(5120)
                            ->acceptedFileTypes(['image/png', 'image/jpeg', 'image/svg+xml', 'image/gif'])
                            ->helperText('Max 5MB - PNG, JPG, SVG, GIF'),

                        Forms\Components\FileUpload::make('business_favicon')
                            ->label('Favicon')
                            ->disk('public')
                            ->directory('settings')
                            ->maxSize(2048)
                            ->acceptedFileTypes(['image/png', 'image/x-icon', 'image/vnd.microsoft.icon'])
                            ->helperText('Max 2MB - PNG o ICO'),
                    ]),

                Forms\Components\Section::make('Colori del Tema')
                    ->description('Personalizza i colori del sito')
                    ->schema([
                        Forms\Components\ColorPicker::make('color_primary')
                            ->label('Colore Primario'),

                        Forms\Components\ColorPicker::make('color_secondary')
                            ->label('Colore Secondario'),

                        Forms\Components\ColorPicker::make('color_accent')
                            ->label('Colore Accento'),
                    ]),
            ])
            ->statePath('data');
    }

    public function save(): void
    {
        $data = $this->form->getState();

        // Applica il tema se è stato selezionato
        if (!empty($data['theme'])) {
            ThemeService::applyTheme($data['theme']);
        }

        // Salva le impostazioni direttamente
        Setting::set('theme', $data['theme'] ?? 'default');
        Setting::set('business_name', $data['business_name'] ?? 'La Tua Attività');
        Setting::set('business_description', $data['business_description'] ?? '');
        Setting::set('business_email', $data['business_email'] ?? '');
        Setting::set('business_phone', $data['business_phone'] ?? '');
        Setting::set('business_vat', $data['business_vat'] ?? '');
        Setting::set('business_logo', $data['business_logo'] ?? '');
        Setting::set('business_favicon', $data['business_favicon'] ?? '');
        Setting::set('color_primary', $data['color_primary'] ?? '#3B82F6');
        Setting::set('color_secondary', $data['color_secondary'] ?? '#1F2937');
        Setting::set('color_accent', $data['color_accent'] ?? '#F59E0B');

        Notification::make()
            ->title('Impostazioni salvate!')
            ->success()
            ->send();
    }
}

