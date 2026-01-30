/**
 * Definizioni JSON dei componenti disponibili
 * Questo è il "database" dei template che puoi aggiungere al canvas
 */

export const BLOCK_TEMPLATES = [
    {
        id: 'hero-section',
        name: 'Hero Section',
        category: 'Hero',
        height: 250,
        width: 800,
        icon: 'Home',
        html: `<div class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-r from-slate-600 to-slate-800 text-white p-8 text-center rounded-xl">
            <h1 class="text-4xl font-bold mb-4">{{title}}</h1>
            <p class="text-xl opacity-90 max-w-2xl mb-6">{{subtitle}}</p>
            <div class="flex gap-4">
                <button class="px-6 py-3 bg-white text-slate-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors">{{buttonText1}}</button>
                <button class="px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors">{{buttonText2}}</button>
            </div>
        </div>`,
        traits: {
            title: { type: 'text', label: 'Titolo', default: 'Titolo Hero', section: 'Content' },
            subtitle: { type: 'text', label: 'Sottotitolo', default: 'Sottotitolo accattivante...', section: 'Content' },
            buttonText1: { type: 'text', label: 'Testo bottone 1', default: 'Azione Primaria', section: 'Buttons' },
            buttonText2: { type: 'text', label: 'Testo bottone 2', default: 'Azione Secondaria', section: 'Buttons' }
        }
    },
    {
        id: 'pricing-card',
        name: 'Pricing Card',
        category: 'Pricing',
        height: 400,
        width: 320,
        icon: 'DollarSign',
        html: `<div class="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 flex flex-col text-white relative overflow-hidden">
            <h3 class="text-2xl font-bold mb-2">{{planName}}</h3>
            <p class="text-blue-100 mb-6">{{description}}</p>
            <div class="text-5xl font-bold mb-2">{{price}}</div>
            <button class="w-full py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-50 transition-colors mt-auto">{{buttonText}}</button>
        </div>`,
        traits: {
            planName: { type: 'text', label: 'Nome piano', default: 'Pro Plan', section: 'Content' },
            description: { type: 'text', label: 'Descrizione', default: 'Per team che...', section: 'Content' },
            price: { type: 'text', label: 'Prezzo', default: '€29', section: 'Pricing' },
            buttonText: { type: 'text', label: 'Testo bottone', default: 'Scegli Pro', section: 'Buttons' }
        }
    },
    {
        id: 'feature-card',
        name: 'Feature Card',
        category: 'Features',
        height: 200,
        width: 350,
        icon: 'Zap',
        html: `<div class="w-full h-full bg-white dark:bg-gray-800 rounded-xl p-6 flex items-center gap-4 shadow-lg border border-gray-200 dark:border-gray-700">
            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
            </div>
            <div class="flex-1">
                <h4 class="font-bold text-gray-900 dark:text-white mb-2">{{title}}</h4>
                <p class="text-gray-600 dark:text-gray-300 text-sm">{{description}}</p>
            </div>
        </div>`,
        traits: {
            title: { type: 'text', label: 'Titolo feature', default: 'Feature Title', section: 'Content' },
            description: { type: 'text', label: 'Descrizione', default: 'Descrizione...', section: 'Content' }
        }
    }
];

export const getBlockById = (id) => BLOCK_TEMPLATES.find(b => b.id === id);

export const getBlocksByCategory = () => {
    const categories = {};
    BLOCK_TEMPLATES.forEach(block => {
        if (!categories[block.category]) categories[block.category] = [];
        categories[block.category].push(block);
    });
    return categories;
};
