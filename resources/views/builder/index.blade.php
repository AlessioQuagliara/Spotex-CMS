<!DOCTYPE html>
<html lang="it" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $page->title }} - Spotex Page Builder</title>
    
    <!-- React & Libraries -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <!-- Immer for efficient state management -->
    <script src="https://unpkg.com/immer@10.0.3/dist/immer.umd.production.min.js"></script>
    
    <!-- Filament-style CSS -->
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700&amp;display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                    },
                    colors: {
                        primary: {
                            50: '#f8fafc',
                            100: '#f1f5f9',
                            200: '#e2e8f0',
                            300: '#cbd5e1',
                            400: '#94a3b8',
                            500: '#64748b',
                            600: '#475569',
                            700: '#334155',
                            800: '#1e293b',
                            900: '#0f172a',
                        },
                        danger: {
                            400: '#f87171',
                            500: '#ef4444',
                            600: '#dc2626',
                        },
                        success: {
                            400: '#34d399',
                            500: '#10b981',
                            600: '#059669',
                        }
                    }
                }
            }
        }
    </script>
    
    <style>
        .fi-scrollbars {
            scrollbar-width: thin;
            scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
        }
        
        .fi-scrollbars::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        
        .fi-scrollbars::-webkit-scrollbar-track {
            background: transparent;
        }
        
        .fi-scrollbars::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.3);
            border-radius: 4px;
        }
        
        .fi-scrollbars::-webkit-scrollbar-thumb:hover {
            background-color: rgba(156, 163, 175, 0.5);
        }
        
        .grid-pattern {
            background-image: 
                linear-gradient(to right, rgba(203, 213, 225, 0.3) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(203, 213, 225, 0.3) 1px, transparent 1px);
            background-size: 20px 20px;
        }
        
        .grid-pattern-dark {
            background-image: 
                linear-gradient(to right, rgba(71, 85, 105, 0.3) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(71, 85, 105, 0.3) 1px, transparent 1px);
        }
        
        .resize-handle {
            position: absolute;
            width: 8px;
            height: 8px;
            background: #475569;
            border: 2px solid #ffffff;
            border-radius: 50%;
            z-index: 1000;
            box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
        }
        
        .dark .resize-handle {
            background: #94a3b8;
            border: 2px solid #1e293b;
        }
        
        .element-outline {
            outline: 2px solid #475569;
            outline-offset: -1px;
        }
        
        .dark .element-outline {
            outline: 2px solid #94a3b8;
        }
        
        .drop-guide {
            position: absolute;
            background: #3b82f6;
            opacity: 0.3;
            z-index: 999;
        }
        
        .transition-all-200 {
            transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .shadow-fi {
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        
        .ring-fi {
            box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05);
        }
        
        .dark .ring-fi {
            box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
        }
    </style>
</head>
<body class="font-sans antialiased bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
    <div id="root"></div>

    <script type="text/babel">
        @verbatim
        const { useState, useRef, useEffect, useCallback, useMemo } = React;
        const { produce } = window.immer;

        // Icon Component matching Filament icons
        const Icon = ({ name, size = 20, className = "" }) => {
            const getIcon = (s, c) => {
                const icons = {
                    'heroicon-outline-home': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
                    'heroicon-outline-cog': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
                    'heroicon-outline-view-grid-add': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" /></svg>,
                    'heroicon-outline-template': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>,
                    'heroicon-outline-document-text': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
                    'heroicon-outline-photograph': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
                    'heroicon-outline-cube': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
                    'heroicon-outline-save': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>,
                    'heroicon-outline-trash': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
                    'heroicon-outline-duplicate': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
                    'heroicon-outline-arrow-circle-up': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" /></svg>,
                    'heroicon-outline-arrow-circle-down': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" /></svg>,
                    'heroicon-outline-eye': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
                    'heroicon-outline-eye-off': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>,
                    'heroicon-outline-desktop-computer': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
                    'heroicon-outline-tablet': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
                    'heroicon-outline-phone': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
                    'heroicon-outline-zoom-in': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>,
                    'heroicon-outline-zoom-out': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>,
                    'heroicon-outline-chevron-left': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>,
                    'heroicon-outline-chevron-right': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>,
                    'heroicon-outline-arrow-up': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>,
                    'heroicon-outline-arrow-down': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>,
                    'heroicon-outline-plus': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>,
                    'heroicon-outline-minus': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4" /></svg>,
                    'heroicon-outline-x': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>,
                    'heroicon-outline-check': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>,
                    'heroicon-outline-search': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLineCap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
                    'heroicon-outline-filter': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>,
                    'heroicon-outline-sort-ascending': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" /></svg>,
                    'heroicon-outline-sort-descending': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4 4m0 0l4-4m-4 4V4" /></svg>,
                    'heroicon-outline-document-duplicate': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>,
                    'heroicon-outline-clipboard-copy': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>,
                    'heroicon-outline-upload': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" /></svg>,
                    'heroicon-outline-download': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
                    'heroicon-outline-adjustments': <svg className={c} width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>,
                };
                return icons[name] || null;
            };
            
            const icon = getIcon(size, className);
            return icon || <div className={`bg-gray-200 rounded ${className}`} style={{width: size, height: size}} />;
        };

        // Enhanced BLOCK_TEMPLATES with Filament-style components
        const BLOCK_TEMPLATES = [
            {
                name: 'Hero Section',
                category: 'Hero',
                height: 250,
                width: 800,
                icon: 'heroicon-outline-template',
                html: `<div class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-r from-primary-600 to-primary-800 text-white p-8 text-center rounded-xl">
                    <h1 class="text-4xl font-bold mb-4">{{title}}</h1>
                    <p class="text-xl opacity-90 max-w-2xl mb-6">{{subtitle}}</p>
                    <div class="flex gap-4">
                        <button class="px-6 py-3 bg-white text-primary-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors">{{buttonText1}}</button>
                        <button class="px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors">{{buttonText2}}</button>
                    </div>
                </div>`,
                traits: {
                    title: { type: 'text', label: 'Titolo', default: 'Titolo Hero', section: 'Content' },
                    subtitle: { type: 'text', label: 'Sottotitolo', default: 'Sottotitolo accattivante...', section: 'Content' },
                    gradientStart: { type: 'color', label: 'Colore inizio gradiente', default: '#475569', section: 'Style' },
                    gradientEnd: { type: 'color', label: 'Colore fine gradiente', default: '#334155', section: 'Style' },
                    buttonText1: { type: 'text', label: 'Testo bottone 1', default: 'Azione Primaria', section: 'Buttons' },
                    buttonText2: { type: 'text', label: 'Testo bottone 2', default: 'Azione Secondaria', section: 'Buttons' }
                }
            },
            {
                name: 'Pricing Card',
                category: 'Pricing',
                height: 400,
                width: 320,
                icon: 'heroicon-outline-cube',
                html: `<div class="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 flex flex-col text-white relative overflow-hidden">
                    <div class="absolute top-0 right-0 bg-white/20 px-4 py-1 rounded-bl-lg text-sm font-semibold">{{featured}}</div>
                    <h3 class="text-2xl font-bold mb-2">{{planName}}</h3>
                    <p class="text-primary-100 mb-6">{{description}}</p>
                    <div class="text-5xl font-bold mb-2">{{price}}<span class="text-xl font-normal">{{period}}</span></div>
                    <ul class="flex-1 space-y-3 my-6">
                        <li class="flex items-center"><span class="mr-2">✓</span> Utenti illimitati</li>
                        <li class="flex items-center"><span class="mr-2">✓</span> 50GB Spazio cloud</li>
                        <li class="flex items-center"><span class="mr-2">✓</span> Supporto priority 24/7</li>
                        <li class="flex items-center"><span class="mr-2">✓</span> Analitiche avanzate</li>
                    </ul>
                    <button class="w-full py-3 bg-white text-primary-600 font-bold rounded-lg hover:bg-gray-50 transition-colors">{{buttonText}}</button>
                </div>`,
                traits: {
                    planName: { type: 'text', label: 'Nome piano', default: 'Pro Plan', section: 'Content' },
                    description: { type: 'text', label: 'Descrizione', default: 'Per team che...', section: 'Content' },
                    price: { type: 'text', label: 'Prezzo', default: '€29', section: 'Pricing' },
                    period: { type: 'text', label: 'Periodo', default: '/mese', section: 'Pricing' },
                    buttonText: { type: 'text', label: 'Testo bottone', default: 'Scegli Pro', section: 'Buttons' },
                    backgroundColor: { type: 'color', label: 'Colore sfondo', default: '#3b82f6', section: 'Style' },
                    featured: { type: 'checkbox', label: 'Evidenziato', default: true, section: 'Display' }
                }
            },
            {
                name: 'Feature Card',
                category: 'Features',
                height: 200,
                width: 350,
                icon: 'heroicon-outline-view-grid-add',
                html: `<div class="w-full h-full bg-white dark:bg-gray-800 rounded-xl p-6 flex items-center gap-4 shadow-lg border border-gray-200 dark:border-gray-700">
                    <div class="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400">
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
                    description: { type: 'text', label: 'Descrizione', default: 'Description...', section: 'Content' },
                    icon: { type: 'select', label: 'Icona', options: ['lightning', 'rocket', 'star', 'heart'], default: 'lightning', section: 'Display' },
                    iconColor: { type: 'color', label: 'Colore icona', default: '#3b82f6', section: 'Style' }
                }
            },
            {
                name: 'Testimonial',
                category: 'Testimonials',
                height: 180,
                width: 400,
                icon: 'heroicon-outline-document-text',
                html: `<div class="w-full h-full bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                    <div class="flex items-center mb-4">
                        <div class="w-10 h-10 bg-primary-500 rounded-full mr-3"></div>
                        <div>
                            <h5 class="font-bold text-gray-900 dark:text-white">{{name}}</h5>
                            <p class="text-gray-500 dark:text-gray-400 text-sm">{{role}}</p>
                        </div>
                    </div>
                    <p class="text-gray-700 dark:text-gray-300 italic">{{quote}}</p>
                </div>`,
                traits: {
                    name: { type: 'text', label: 'Nome autore', default: 'Mario Rossi', section: 'Author' },
                    role: { type: 'text', label: 'Ruolo', default: 'CEO, Azienda S.p.A.', section: 'Author' },
                    quote: { type: 'textarea', label: 'Citazione', default: '"Questo prodotto ha rivoluzionato..."', section: 'Content' },
                    avatarColor: { type: 'color', label: 'Colore avatar', default: '#3b82f6', section: 'Style' },
                    showRating: { type: 'checkbox', label: 'Mostra valutazione', default: false, section: 'Display' }
                }
            }
        ];

        @endverbatim
        // Get blocks from backend
        const CUSTOM_BLOCKS = {!! json_encode($themeBlocks ?? []) !!};
        const INITIAL_ELEMENTS = {!! json_encode($builderData ?? []) !!};
        const PAGE_SLUG = {!! json_encode($page->slug) !!};
        const PAGE_TITLE = {!! json_encode($page->title) !!};
        const PAGE_ID = {!! json_encode($page->id) !!};
        @verbatim

        const ALL_BLOCKS = [...BLOCK_TEMPLATES, ...CUSTOM_BLOCKS];
        
        // Group blocks by category
        const BLOCKS_BY_CATEGORY = ALL_BLOCKS.reduce((acc, block) => {
            const category = block.category || 'Custom';
            if (!acc[category]) acc[category] = [];
            acc[category].push(block);
            return acc;
        }, {});
        
        // Validazione dati e sanitizzazione al caricamento
        const validateElements = (data) => {
            if (!Array.isArray(data)) return [];
            return data.filter(el => el && typeof el === 'object').map(el => ({
                ...el,
                id: el.id || `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: el.type || 'text',
                styles: el.styles || {},
                classes: el.classes || [],
                content: el.content || ''
            }));
        };

        // Main Component
        function PageBuilder() {
            const [elements, setElements] = useState(() => {
                const validated = validateElements(INITIAL_ELEMENTS);
                if (validated.length > 0) {
                    return validated;
                }
                return [{
                    id: 'starter-' + Date.now(),
                    type: 'text',
                    content: 'Ciao! Sono modificabile. Doppio click per editare.',
                    x: 50,
                    y: 50,
                    width: 300,
                    height: 80,
                    styles: {
                        fontSize: '28px',
                        fontWeight: '700',
                        color: '#1f2937',
                        textAlign: 'center',
                        backgroundColor: 'transparent'
                    }
                }];
            });
            
            const [selectedId, setSelectedId] = useState(null);
            const [dragInfo, setDragInfo] = useState(null);
            const [viewMode, setViewMode] = useState('desktop');
            const [activePanel, setActivePanel] = useState('elements');
            const [zoom, setZoom] = useState(50);
            const [showGrid, setShowGrid] = useState(true);
            const [darkMode, setDarkMode] = useState(() => {
                // Leggi da localStorage o usa preferenze sistema
                const stored = localStorage.getItem('filament-theme');
                if (stored) return stored === 'dark';
                return window.matchMedia('(prefers-color-scheme: dark)').matches;
            });
            const [history, setHistory] = useState([{ elements: elements, timestamp: Date.now() }]);
            const [historyIndex, setHistoryIndex] = useState(0);
            const MAX_HISTORY = 20; // Limit history to prevent memory bloat
            const [isSaving, setIsSaving] = useState(false);
            const [searchQuery, setSearchQuery] = useState('');
            const [editingElement, setEditingElement] = useState(null);
            const [customClasses, setCustomClasses] = useState({});
            const [styleTarget, setStyleTarget] = useState('inline'); // 'inline', 'class', 'hover'
            const [traitValues, setTraitValues] = useState({}); // { elementId: { traitName: value } }
            
            const canvasRef = useRef(null);
            const fileInputRef = useRef(null);

            // Sync dark mode with Filament and HTML class
            useEffect(() => {
                const html = document.documentElement;
                if (darkMode) {
                    html.classList.add('dark');
                    localStorage.setItem('filament-theme', 'dark');
                } else {
                    html.classList.remove('dark');
                    localStorage.setItem('filament-theme', 'light');
                }
            }, [darkMode]);

            // Get traits for a template
            const getTraitsForTemplate = (template) => {
                if (!template || !template.traits) return {};
                return template.traits;
            };

            // Interpolate HTML with trait values for rendering
            const interpolateHTML = (htmlTemplate, traitValues) => {
                if (!htmlTemplate || !traitValues) return htmlTemplate;
                
                let interpolated = htmlTemplate;
                Object.entries(traitValues).forEach(([key, value]) => {
                    // Replace {{traitName}} with actual values
                    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
                    interpolated = interpolated.replace(regex, value);
                });
                return interpolated;
            };

            // Export HTML without trait placeholders and clean output
            const exportElement = (element) => {
                if (element.type !== 'html-block') {
                    return element.content;
                }
                
                // Get trait values for this element
                const elementTraits = traitValues[element.id] || {};
                
                // Interpolate with trait values to get final HTML
                const finalHTML = interpolateHTML(element.content, elementTraits);
                
                // Return clean HTML without any builder-specific data
                return finalHTML;
            };

            // Viewport dimensions based on view mode
            const viewportDimensions = useMemo(() => {
                switch(viewMode) {
                    case 'mobile': return { width: 375, height: 667, label: 'Mobile' };
                    case 'tablet': return { width: 768, height: 1024, label: 'Tablet' };
                    default: return { width: 1920, height: 2000, label: 'Desktop' };
                }
            }, [viewMode]);

            // Filtered blocks based on search
            const filteredBlocks = useMemo(() => {
                if (!searchQuery) return ALL_BLOCKS;
                return ALL_BLOCKS.filter(block => 
                    block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    block.category.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }, [searchQuery]);

            // Save to history - OPTIMIZED: No deep cloning, limit stack to 20 states
            const saveHistory = useCallback((newElements) => {
                const newHistory = history.slice(0, historyIndex + 1);
                // Store reference directly (immutable updates ensure no mutations)
                newHistory.push({
                    elements: newElements,
                    timestamp: Date.now()
                });
                // Limit history to prevent memory bloat
                if (newHistory.length > MAX_HISTORY) {
                    newHistory.shift();
                    setHistoryIndex(Math.max(0, historyIndex - 1));
                } else {
                    setHistoryIndex(newHistory.length - 1);
                }
                setHistory(newHistory);
            }, [history, historyIndex, MAX_HISTORY]);

            // Undo/Redo
            const canUndo = historyIndex > 0;
            const canRedo = historyIndex < history.length - 1;

            const handleUndo = () => {
                if (canUndo) {
                    const newIndex = historyIndex - 1;
                    setHistoryIndex(newIndex);
                    // No cloning needed - just restore reference
                    setElements(history[newIndex].elements);
                }
            };

            const handleRedo = () => {
                if (canRedo) {
                    const newIndex = historyIndex + 1;
                    setHistoryIndex(newIndex);
                    // No cloning needed - just restore reference
                    setElements(history[newIndex].elements);
                }
            };

            // Add new element
            const addElement = (type, template = null, x = 100, y = 100) => {
                const id = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                let newElement = {
                    id,
                    type,
                    x,
                    y,
                    width: type === 'text' ? 200 : template?.width || 300,
                    height: type === 'text' ? 80 : template?.height || 200,
                    styles: {},
                    classes: [],
                    content: ''
                };

                switch(type) {
                    case 'text':
                        newElement.content = 'Nuovo testo - doppio click per editare';
                        newElement.styles = {
                            fontSize: '16px',
                            fontWeight: '400',
                            color: darkMode ? '#ffffff' : '#1f2937',
                            textAlign: 'left',
                            backgroundColor: 'transparent'
                        };
                        break;
                    case 'html-block':
                        if (template) {
                            newElement.content = template.html;
                            newElement.styles = { backgroundColor: 'transparent' };
                            newElement.templateName = template.name;
                        }
                        break;
                }

                const updatedElements = [...elements, newElement];
                saveHistory(updatedElements);
                setElements(updatedElements);
                setSelectedId(id);
                return newElement;
            };

            // Mouse event handlers
            const handleMouseDown = (e, elementId, type = 'move', handle = null) => {
                e.stopPropagation();
                setSelectedId(elementId);
                
                const element = elements.find(el => el.id === elementId);
                if (!element) return;

                setDragInfo({
                    isDragging: true,
                    type,
                    handle,
                    startX: e.clientX,
                    startY: e.clientY,
                    elementX: element.x,
                    elementY: element.y,
                    elementWidth: element.width,
                    elementHeight: element.height
                });
            };

            const handleMouseMove = useCallback((e) => {
                if (!dragInfo?.isDragging || !selectedId) return;

                const dx = e.clientX - dragInfo.startX;
                const dy = e.clientY - dragInfo.startY;
                const updatedElements = [...elements];
                const elementIndex = updatedElements.findIndex(el => el.id === selectedId);

                if (elementIndex === -1) return;

                if (dragInfo.type === 'move') {
                    updatedElements[elementIndex].x = dragInfo.elementX + dx;
                    updatedElements[elementIndex].y = dragInfo.elementY + dy;
                } else if (dragInfo.type === 'resize' && dragInfo.handle) {
                    const element = updatedElements[elementIndex];
                    
                    switch(dragInfo.handle) {
                        case 'nw':
                            element.x = dragInfo.elementX + dx;
                            element.y = dragInfo.elementY + dy;
                            element.width = Math.max(50, dragInfo.elementWidth - dx);
                            element.height = Math.max(50, dragInfo.elementHeight - dy);
                            break;
                        case 'ne':
                            element.y = dragInfo.elementY + dy;
                            element.width = Math.max(50, dragInfo.elementWidth + dx);
                            element.height = Math.max(50, dragInfo.elementHeight - dy);
                            break;
                        case 'sw':
                            element.x = dragInfo.elementX + dx;
                            element.width = Math.max(50, dragInfo.elementWidth - dx);
                            element.height = Math.max(50, dragInfo.elementHeight + dy);
                            break;
                        case 'se':
                            element.width = Math.max(50, dragInfo.elementWidth + dx);
                            element.height = Math.max(50, dragInfo.elementHeight + dy);
                            break;
                    }
                }

                setElements(updatedElements);
            }, [dragInfo, selectedId, elements]);

            const handleMouseUp = useCallback(() => {
                if (dragInfo?.isDragging) {
                    saveHistory(elements);
                    setDragInfo(null);
                }
            }, [dragInfo, elements, saveHistory]);

            // Update element property
            const updateElement = (id, updates) => {
                const updatedElements = elements.map(el => 
                    el.id === id ? { ...el, ...updates } : el
                );
                saveHistory(updatedElements);
                setElements(updatedElements);
            };

            // Delete element
            const deleteElement = (id = selectedId) => {
                if (!id) return;
                const updatedElements = elements.filter(el => el.id !== id);
                saveHistory(updatedElements);
                setElements(updatedElements);
                if (selectedId === id) setSelectedId(null);
            };

            // Duplicate element
            const duplicateElement = (id = selectedId) => {
                if (!id) return;
                const element = elements.find(el => el.id === id);
                if (!element) return;
                
                const newElement = {
                    ...JSON.parse(JSON.stringify(element)),
                    id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    x: element.x + 20,
                    y: element.y + 20
                };
                
                const updatedElements = [...elements, newElement];
                saveHistory(updatedElements);
                setElements(updatedElements);
                setSelectedId(newElement.id);
            };

            // Save to backend
            const savePage = async () => {
                setIsSaving(true);
                try {
                    const response = await fetch(`/api/pages/${PAGE_ID}/builder`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            elements: elements,
                            traitValues: traitValues,
                            customClasses: customClasses,
                            page_id: PAGE_ID
                        })
                    });

                    const data = await response.json();
                    
                    if (data.success) {
                        // Show success message
                        alert('Pagina salvata con successo!');
                    } else {
                        throw new Error(data.message || 'Errore nel salvataggio');
                    }
                } catch (error) {
                    console.error('Errore:', error);
                    alert(`Errore: ${error.message}`);
                } finally {
                    setIsSaving(false);
                }
            };

            // Export/Import
            const exportPage = () => {
                // Generate clean HTML output without trait values
                const cleanElements = elements.map(el => {
                    if (el.type === 'html-block') {
                        return {
                            ...el,
                            content: exportElement(el) // Get clean HTML with traits interpolated
                        };
                    }
                    return el;
                });
                
                const data = {
                    elements: cleanElements,
                    metadata: {
                        pageTitle: PAGE_TITLE,
                        pageSlug: PAGE_SLUG,
                        exportedAt: new Date().toISOString()
                    }
                };
                
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${PAGE_SLUG}-export-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
            };

            const importPage = (event) => {
                const file = event.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        let newElements = [];

                        // Caso 1: Importazione di design esportati (con array 'elements')
                        if (data.elements && Array.isArray(data.elements)) {
                            newElements = data.elements;
                            alert(`Design importato con successo! (${newElements.length} elementi)`);
                        }
                        // Caso 2: Importazione di tema con 'blocks' array
                        else if (data.blocks && Array.isArray(data.blocks)) {
                            // Converti ogni blocco in un elemento canvas
                            newElements = data.blocks.map((block, index) => ({
                                id: `imported-block-${Date.now()}-${index}`,
                                type: 'html-block',
                                content: block.html || '',
                                x: 50 + (index * 30),
                                y: 50 + (index * 30),
                                width: block.width || 400,
                                height: block.height || 300,
                                styles: {},
                                templateName: block.name,
                                templateCategory: block.category
                            }));
                            alert(`Tema importato! ${newElements.length} blocchi caricati`);
                        }
                        // Caso 3: Importazione di pagine con 'builder_data'
                        else if (data.pages && Array.isArray(data.pages)) {
                            // Prendi la prima pagina con builder_data
                            const pageWithBuilder = data.pages.find(p => p.builder_data && p.builder_data.length > 0);
                            if (pageWithBuilder && pageWithBuilder.builder_data.length > 0) {
                                newElements = pageWithBuilder.builder_data;
                                alert(`Pagina "${pageWithBuilder.title}" importata! (${newElements.length} elementi)`);
                            } else if (data.pages.length > 0) {
                                // Se nessuna pagina ha builder_data, usa la prima
                                const firstPage = data.pages[0];
                                newElements = [{
                                    id: `imported-page-${Date.now()}`,
                                    type: 'html-block',
                                    content: firstPage.html_content || '',
                                    x: 50,
                                    y: 50,
                                    width: 1200,
                                    height: 800,
                                    styles: {},
                                    templateName: firstPage.title
                                }];
                                alert(`Pagina "${firstPage.title}" importata!`);
                            } else {
                                alert('Nessun contenuto trovato nel file');
                                return;
                            }
                        } else {
                            alert('Formato file non riconosciuto. Usa un JSON esportato o un tema valido.');
                            return;
                        }

                        if (newElements.length > 0) {
                            saveHistory(elements);
                            setElements(newElements);
                        }
                    } catch (error) {
                        console.error(error);
                        alert(`Errore: ${error.message}`);
                    }
                };
                reader.readAsText(file);
            };

            // Keyboard shortcuts
            useEffect(() => {
                const handleKeyDown = (e) => {
                    // Exit editing mode
                    if (e.key === 'Escape') {
                        if (editingElement) {
                            setEditingElement(null);
                            e.preventDefault();
                            return;
                        }
                        setSelectedId(null);
                    }
                    
                    // Delete key (only if not editing)
                    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && !editingElement) {
                        e.preventDefault();
                        deleteElement();
                    }
                    // Ctrl+C / Ctrl+V / Ctrl+D (only if not editing)
                    if ((e.ctrlKey || e.metaKey) && !editingElement) {
                        switch(e.key) {
                            case 'z':
                                e.preventDefault();
                                if (e.shiftKey) handleRedo();
                                else handleUndo();
                                break;
                            case 'y':
                                e.preventDefault();
                                handleRedo();
                                break;
                            case 'd':
                                e.preventDefault();
                                duplicateElement();
                                break;
                            case 'e':
                                e.preventDefault();
                                if (selectedId) {
                                    setEditingElement(selectedId);
                                }
                                break;
                        }
                    }
                };

                window.addEventListener('keydown', handleKeyDown);
                return () => window.removeEventListener('keydown', handleKeyDown);
            }, [selectedId, editingElement, canUndo, canRedo]);

            // Mouse event listeners
            useEffect(() => {
                if (dragInfo?.isDragging) {
                    window.addEventListener('mousemove', handleMouseMove);
                    window.addEventListener('mouseup', handleMouseUp);
                    return () => {
                        window.removeEventListener('mousemove', handleMouseMove);
                        window.removeEventListener('mouseup', handleMouseUp);
                    };
                }
            }, [dragInfo, handleMouseMove, handleMouseUp]);

            // Render resize handles
            const renderResizeHandles = (element) => {
                if (selectedId !== element.id) return null;
                
                const handles = [
                    { position: 'nw', x: -4, y: -4, cursor: 'nw-resize' },
                    { position: 'ne', x: element.width - 4, y: -4, cursor: 'ne-resize' },
                    { position: 'sw', x: -4, y: element.height - 4, cursor: 'sw-resize' },
                    { position: 'se', x: element.width - 4, y: element.height - 4, cursor: 'se-resize' }
                ];

                return handles.map(handle => (
                    <div
                        key={handle.position}
                        className="resize-handle"
                        style={{
                            left: handle.x,
                            top: handle.y,
                            cursor: handle.cursor
                        }}
                        onMouseDown={(e) => handleMouseDown(e, element.id, 'resize', handle.position)}
                    />
                ));
            };

            // Render element
            const renderElement = (element) => {
                const isSelected = selectedId === element.id;
                const isEditing = editingElement === element.id;
                const style = {
                    position: 'absolute',
                    left: `${element.x}px`,
                    top: `${element.y}px`,
                    width: `${element.width}px`,
                    height: `${element.height}px`,
                    cursor: isEditing ? 'text' : (dragInfo?.isDragging && isSelected ? 'grabbing' : 'grab'),
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: '0 0',
                    ...element.styles
                };
                
                // Applica classi CSS custom
                const elementClasses = element.classes || [];

                if (isSelected && !isEditing) {
                    style.outline = '2px solid #3b82f6';
                    style.outlineOffset = '-1px';
                }
                
                if (isEditing) {
                    style.outline = '3px solid #10b981';
                    style.outlineOffset = '-1px';
                    style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.3)';
                }

                let content;
                
                switch(element.type) {
                    case 'text':
                        content = (
                            <div
                                className="w-full h-full p-2"
                                contentEditable={isEditing}
                                suppressContentEditableWarning
                                onDoubleClick={() => setEditingElement(element.id)}
                                onBlur={(e) => {
                                    if (isEditing) {
                                        updateElement(element.id, { content: e.target.innerText });
                                        setEditingElement(null);
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        e.target.blur();
                                    }
                                }}
                            >
                                {element.content}
                            </div>
                        );
                        break;
                    case 'html-block':
                        if (isEditing) {
                            content = (
                                <div 
                                    className="w-full h-full overflow-auto"
                                    contentEditable={true}
                                    suppressContentEditableWarning
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                    onBlur={(e) => {
                                        updateElement(element.id, { content: e.target.innerHTML });
                                        setEditingElement(null);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                            e.target.blur();
                                        }
                                    }}
                                    dangerouslySetInnerHTML={{ __html: element.content }}
                                />
                            );
                        } else {
                            // Use trait values to render interpolated HTML
                            const elementTraits = traitValues[element.id] || {};
                            const renderedHTML = interpolateHTML(element.content, elementTraits);
                            
                            content = (
                                <div 
                                    className="w-full h-full overflow-auto"
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        setEditingElement(element.id);
                                    }}
                                    dangerouslySetInnerHTML={{ __html: renderedHTML }}
                                />
                            );
                        }
                        break;
                    default:
                        content = <div className="w-full h-full bg-gray-200 dark:bg-gray-700" />;
                }

                return (
                    <div
                        key={element.id}
                        style={style}
                        className={`transition-all-200 ${elementClasses.join(' ')}`}
                        onMouseDown={(e) => {
                            if (!isEditing) {
                                handleMouseDown(e, element.id, 'move');
                            }
                        }}
                    >
                        {content}
                        {!isEditing && renderResizeHandles(element)}
                        {isEditing && (
                            <div className="absolute -top-8 left-0 bg-success-500 text-white text-xs px-2 py-1 rounded shadow-lg">
                                Editing... (Esc per uscire)
                            </div>
                        )}
                    </div>
                );
            };

            // Selected element
            const selectedElement = elements.find(el => el.id === selectedId);

            // Generate CSS from custom classes
            const customCSS = useMemo(() => {
                let css = '';
                Object.entries(customClasses).forEach(([className, classData]) => {
                    // Base styles
                    if (classData.base && Object.keys(classData.base).length > 0) {
                        css += `.${className} {\n`;
                        Object.entries(classData.base).forEach(([prop, value]) => {
                            const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
                            css += `  ${cssProp}: ${value};\n`;
                        });
                        css += '}\n\n';
                    }
                    // Hover styles
                    if (classData.hover && Object.keys(classData.hover).length > 0) {
                        css += `.${className}:hover {\n`;
                        Object.entries(classData.hover).forEach(([prop, value]) => {
                            const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
                            css += `  ${cssProp}: ${value};\n`;
                        });
                        css += '}\n\n';
                    }
                });
                return css;
            }, [customClasses]);
            
            // Export as clean HTML with interpolated traits
            const exportAsHTML = useCallback(() => {
                const htmlParts = [];
                
                elements.forEach((el, idx) => {
                    if (el.type === 'text') {
                        htmlParts.push(`<!-- Text Element ${idx} -->\n<div style="position: absolute; left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px;">\n  ${el.content}\n</div>\n`);
                    } else if (el.type === 'html-block') {
                        htmlParts.push(`<!-- ${el.templateName || 'HTML Block'} ${idx} -->\n${exportElement(el)}\n`);
                    }
                });
                
                const fullHTML = `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${PAGE_TITLE}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
${customCSS}
    </style>
</head>
<body>
${htmlParts.join('\n')}
</body>
</html>`;
                
                const blob = new Blob([fullHTML], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${PAGE_SLUG}-final.html`;
                a.click();
                URL.revokeObjectURL(url);
            }, [elements, customCSS, traitValues, PAGE_TITLE, PAGE_SLUG]);
            
            return (
                <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
                    {/* Inject custom CSS */}
                    {customCSS && <style dangerouslySetInnerHTML={{ __html: customCSS }} />}
                    {/* Top Navigation */}
                    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-primary-600 rounded-lg">
                                    <Icon name="heroicon-outline-template" size={20} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="font-bold text-gray-900 dark:text-white">{PAGE_TITLE}</h1>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Spotex Page Builder</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-6">
                                <button 
                                    onClick={handleUndo}
                                    disabled={!canUndo}
                                    className={`p-2 rounded ${canUndo ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : 'opacity-30'}`}
                                    title="Undo (Ctrl+Z)"
                                >
                                    <Icon name="heroicon-outline-arrow-up" size={18} className="text-gray-600 dark:text-gray-300" />
                                </button>
                                <button 
                                    onClick={handleRedo}
                                    disabled={!canRedo}
                                    className={`p-2 rounded ${canRedo ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : 'opacity-30'}`}
                                    title="Redo (Ctrl+Shift+Z)"
                                >
                                    <Icon name="heroicon-outline-arrow-down" size={18} className="text-gray-600 dark:text-gray-300" />
                                </button>
                                
                                {editingElement && (
                                    <div className="ml-2 px-3 py-1 bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400 rounded-lg text-sm font-medium flex items-center gap-2">
                                        <span>✏️ Modalità Editing</span>
                                        <button 
                                            onClick={() => setEditingElement(null)}
                                            className="hover:text-success-900 dark:hover:text-success-200"
                                        >
                                            <Icon name="heroicon-outline-x" size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            {/* View Controls */}
                            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                <button 
                                    onClick={() => setViewMode('desktop')}
                                    className={`px-3 py-1 rounded ${viewMode === 'desktop' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}
                                >
                                    <Icon name="heroicon-outline-desktop-computer" size={18} />
                                </button>
                                <button 
                                    onClick={() => setViewMode('tablet')}
                                    className={`px-3 py-1 rounded ${viewMode === 'tablet' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}
                                >
                                    <Icon name="heroicon-outline-tablet" size={18} />
                                </button>
                                <button 
                                    onClick={() => setViewMode('mobile')}
                                    className={`px-3 py-1 rounded ${viewMode === 'mobile' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}
                                >
                                    <Icon name="heroicon-outline-phone" size={18} />
                                </button>
                            </div>
                            
                            {/* Zoom Controls */}
                            <div className="flex items-center gap-2">
                                <button onClick={() => setZoom(Math.max(50, zoom - 10))}>
                                    <Icon name="heroicon-outline-minus" size={18} className="text-gray-600 dark:text-gray-300" />
                                </button>
                                <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
                                <button onClick={() => setZoom(Math.min(200, zoom + 10))}>
                                    <Icon name="heroicon-outline-plus" size={18} className="text-gray-600 dark:text-gray-300" />
                                </button>
                            </div>
                            
                            {/* Save Button */}
                            <button
                                onClick={savePage}
                                disabled={isSaving}
                                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                            >
                                <Icon name="heroicon-outline-save" size={18} />
                                {isSaving ? 'Salvataggio...' : 'Salva'}
                            </button>
                        </div>
                    </header>
                    
                    {/* Main Content */}
                    <div className="flex flex-1 overflow-hidden">
                        {/* Left Sidebar */}
                        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-semibold text-gray-900 dark:text-white">Strumenti</h2>
                                    <button 
                                        onClick={() => setDarkMode(!darkMode)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        title={darkMode ? 'Passa a tema chiaro' : 'Passa a tema scuro'}
                                    >
                                        {darkMode ? (
                                            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setActivePanel('elements')}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg ${activePanel === 'elements' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                    >
                                        <Icon name="heroicon-outline-view-grid-add" size={20} />
                                        <span>Elementi</span>
                                    </button>
                                    <button
                                        onClick={() => setActivePanel('blocks')}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg ${activePanel === 'blocks' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                    >
                                        <Icon name="heroicon-outline-template" size={20} />
                                        <span>Blocchi</span>
                                    </button>
                                    <button
                                        onClick={() => setActivePanel('classes')}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg ${activePanel === 'classes' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                    >
                                        <Icon name="heroicon-outline-adjustments" size={20} />
                                        <span>Classi CSS</span>
                                    </button>
                                    <button
                                        onClick={() => setActivePanel('layers')}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg ${activePanel === 'layers' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                    >
                                        <Icon name="heroicon-outline-document-duplicate" size={20} />
                                        <span>Layer</span>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto fi-scrollbars p-4">
                                {activePanel === 'elements' && (
                                    <div className="space-y-3">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
                                            <p className="text-blue-900 dark:text-blue-200 font-medium mb-1">💡 Editing Inline</p>
                                            <p className="text-blue-700 dark:text-blue-300 text-xs">
                                                Doppio click su qualsiasi elemento per modificarlo direttamente.
                                                Premi <kbd className="px-1 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">Esc</kbd> per uscire.
                                            </p>
                                        </div>
                                        
                                        <button
                                            onClick={() => addElement('text')}
                                            className="w-full flex items-center gap-3 p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
                                        >
                                            <Icon name="heroicon-outline-document-text" size={20} className="text-gray-500 dark:text-gray-400" />
                                            <div className="text-left">
                                                <div className="font-medium text-gray-900 dark:text-white">Testo</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">Aggiungi testo modificabile</div>
                                            </div>
                                        </button>
                                        
                                        <button
                                            onClick={() => addElement('html-block', BLOCK_TEMPLATES[0])}
                                            className="w-full flex items-center gap-3 p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
                                        >
                                            <Icon name="heroicon-outline-template" size={20} className="text-gray-500 dark:text-gray-400" />
                                            <div className="text-left">
                                                <div className="font-medium text-gray-900 dark:text-white">Blocco HTML</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">Sezione predefinita</div>
                                            </div>
                                        </button>
                                    </div>
                                )}
                                
                                {activePanel === 'blocks' && (
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <Icon name="heroicon-outline-search" size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Cerca blocchi..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-10 pr-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            />
                                        </div>
                                        
                                        <div className="space-y-3">
                                            {Object.entries(BLOCKS_BY_CATEGORY).map(([category, blocks]) => (
                                                <div key={category}>
                                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{category}</h4>
                                                    <div className="space-y-2">
                                                        {blocks.map((block, idx) => (
                                                            <div
                                                                key={idx}
                                                                draggable
                                                                onDragStart={(e) => {
                                                                    e.dataTransfer.setData('text/plain', JSON.stringify(block));
                                                                }}
                                                                onClick={() => addElement('html-block', block, 100, 100)}
                                                                className="p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 cursor-pointer transition-colors"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-600 rounded flex items-center justify-center">
                                                                        <Icon name={block.icon || 'heroicon-outline-template'} size={16} className="text-gray-600 dark:text-gray-300" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="font-medium text-gray-900 dark:text-white text-sm">{block.name}</div>
                                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{block.width}×{block.height}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {activePanel === 'classes' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Gestione Classi CSS</h3>
                                            <button
                                                onClick={() => {
                                                    const className = prompt('Nome classe CSS (senza punto):');
                                                    if (className && !customClasses[className]) {
                                                        setCustomClasses({
                                                            ...customClasses,
                                                            [className]: {
                                                                base: {},
                                                                hover: {},
                                                                description: ''
                                                            }
                                                        });
                                                    }
                                                }}
                                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                                title="Crea nuova classe"
                                            >
                                                <Icon name="heroicon-outline-plus" size={16} />
                                            </button>
                                        </div>
                                        
                                        {Object.keys(customClasses).length === 0 ? (
                                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                                <Icon name="heroicon-outline-adjustments" size={32} className="mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">Nessuna classe CSS definita</p>
                                                <p className="text-xs mt-1">Clicca + per creare la prima</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {Object.entries(customClasses).map(([className, classData]) => (
                                                    <div key={className} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-mono text-sm font-medium text-primary-600 dark:text-primary-400">.{className}</span>
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => {
                                                                        const newClasses = {...customClasses};
                                                                        delete newClasses[className];
                                                                        setCustomClasses(newClasses);
                                                                    }}
                                                                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600"
                                                                    title="Elimina classe"
                                                                >
                                                                    <Icon name="heroicon-outline-trash" size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                                            <div>Base: {Object.keys(classData.base || {}).length} proprietà</div>
                                                            <div>Hover: {Object.keys(classData.hover || {}).length} proprietà</div>
                                                        </div>
                                                        {classData.description && (
                                                            <p className="text-xs text-gray-500 mt-2">{classData.description}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {activePanel === 'layers' && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-medium text-gray-900 dark:text-white">Elementi ({elements.length})</h3>
                                            <button 
                                                onClick={() => setShowGrid(!showGrid)}
                                                className="text-sm text-primary-600 dark:text-primary-400"
                                            >
                                                {showGrid ? 'Nascondi Griglia' : 'Mostra Griglia'}
                                            </button>
                                        </div>
                                        
                                        {elements.map((element, index) => (
                                            <div
                                                key={element.id}
                                                onClick={() => setSelectedId(element.id)}
                                                className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedId === element.id ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800' : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full ${element.type === 'text' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {element.type === 'text' ? 'Testo' : element.templateName || 'Blocco'} {index + 1}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteElement(element.id);
                                                        }}
                                                        className="text-gray-400 hover:text-red-500"
                                                    >
                                                        <Icon name="heroicon-outline-trash" size={14} />
                                                    </button>
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {element.x}×{element.y} - {element.width}×{element.height}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="space-y-3">
                                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">Export</div>
                                    
                                    <button
                                        onClick={exportPage}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                        title="Esporta come JSON con dati builder"
                                    >
                                        <Icon name="heroicon-outline-download" size={16} />
                                        <span className="text-sm">Esporta JSON</span>
                                    </button>
                                    
                                    <button
                                        onClick={exportAsHTML}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                        title="Esporta come HTML puro (finale)"
                                    >
                                        <Icon name="heroicon-outline-document-text" size={16} />
                                        <span className="text-sm">Esporta HTML</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <Icon name="heroicon-outline-upload" size={16} />
                                        <span className="text-sm">Importa</span>
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".json"
                                        onChange={importPage}
                                        className="hidden"
                                    />
                                </div>
                            </div>
                        </aside>
                        
                        {/* Main Canvas */}
                        <main className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-4">
                            <div className="flex justify-center">
                                <div 
                                    ref={canvasRef}
                                    className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden"
                                    style={{
                                        width: viewportDimensions.width,
                                        height: viewportDimensions.height,
                                        backgroundImage: showGrid ? (darkMode ? 'linear-gradient(to right, rgba(71, 85, 105, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(71, 85, 105, 0.15) 1px, transparent 1px)' : 'linear-gradient(to right, rgba(203, 213, 225, 0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(203, 213, 225, 0.4) 1px, transparent 1px)') : 'none',
                                        backgroundSize: '20px 20px'
                                    }}
                                    onClick={(e) => {
                                        if (e.target === e.currentTarget) {
                                            setSelectedId(null);
                                            setEditingElement(null);
                                        }
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const data = e.dataTransfer.getData('text/plain');
                                        if (data) {
                                            const block = JSON.parse(data);
                                            const rect = canvasRef.current.getBoundingClientRect();
                                            const x = (e.clientX - rect.left) / (zoom / 100);
                                            const y = (e.clientY - rect.top) / (zoom / 100);
                                            addElement('html-block', block, x, y);
                                        }
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                >
                                    {elements.map(renderElement)}
                                    
                                    {elements.length === 0 && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                            <Icon name="heroicon-outline-template" size={64} className="mb-4 opacity-30" />
                                            <p className="text-lg font-medium mb-2">Canvas Vuoto</p>
                                            <p className="text-sm max-w-md text-center mb-6">
                                                Trascina un blocco dalla sidebar o clicca su un elemento per iniziare
                                            </p>
                                            <button
                                                onClick={() => addElement('text')}
                                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                            >
                                                Aggiungi il primo elemento
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </main>
                        
                        {/* Right Sidebar - Properties */}
                        {selectedElement && (
                            <aside className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <h2 className="font-semibold text-gray-900 dark:text-white">Proprietà</h2>
                                        <button
                                            onClick={() => setSelectedId(null)}
                                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                        >
                                            <Icon name="heroicon-outline-x" size={18} className="text-gray-500 dark:text-gray-400" />
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                        {selectedElement.type === 'text' ? 'Testo' : selectedElement.templateName || 'Blocco HTML'}
                                    </p>
                                    
                                    {/* Style Target Selector */}
                                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                        <button
                                            onClick={() => setStyleTarget('inline')}
                                            className={`flex-1 px-2 py-1 text-xs rounded ${styleTarget === 'inline' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}
                                            title="Stili inline"
                                        >
                                            Inline
                                        </button>
                                        <button
                                            onClick={() => setStyleTarget('class')}
                                            className={`flex-1 px-2 py-1 text-xs rounded ${styleTarget === 'class' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}
                                            title="Stili via classe CSS"
                                        >
                                            Classe
                                        </button>
                                        <button
                                            onClick={() => setStyleTarget('hover')}
                                            className={`flex-1 px-2 py-1 text-xs rounded ${styleTarget === 'hover' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}
                                            title="Stili :hover"
                                        >
                                            Hover
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto fi-scrollbars p-4 space-y-6">
                                    {/* Selector Manager */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Icon name="heroicon-outline-adjustments" size={16} />
                                            Selector Manager
                                        </h4>
                                        
                                        <div>
                                            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Classi applicate</label>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {(selectedElement.classes || []).map((cls, idx) => (
                                                    <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded text-xs">
                                                        <span className="font-mono">.{cls}</span>
                                                        <button
                                                            onClick={() => {
                                                                const newClasses = [...(selectedElement.classes || [])];
                                                                newClasses.splice(idx, 1);
                                                                updateElement(selectedElement.id, { classes: newClasses });
                                                            }}
                                                            className="hover:text-red-600"
                                                        >
                                                            <Icon name="heroicon-outline-x" size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {(!selectedElement.classes || selectedElement.classes.length === 0) && (
                                                    <span className="text-xs text-gray-400">Nessuna classe</span>
                                                )}
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                <select
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            const currentClasses = selectedElement.classes || [];
                                                            if (!currentClasses.includes(e.target.value)) {
                                                                updateElement(selectedElement.id, {
                                                                    classes: [...currentClasses, e.target.value]
                                                                });
                                                            }
                                                            e.target.value = '';
                                                        }
                                                    }}
                                                    className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                                                >
                                                    <option value="">+ Aggiungi classe</option>
                                                    {Object.keys(customClasses).map(cls => (
                                                        <option key={cls} value={cls}>{cls}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => {
                                                        const className = prompt('Nome nuova classe:');
                                                        if (className && !customClasses[className]) {
                                                            setCustomClasses({
                                                                ...customClasses,
                                                                [className]: { base: {}, hover: {} }
                                                            });
                                                            const currentClasses = selectedElement.classes || [];
                                                            updateElement(selectedElement.id, {
                                                                classes: [...currentClasses, className]
                                                            });
                                                        }
                                                    }}
                                                    className="px-2 py-1 bg-primary-600 text-white rounded text-xs hover:bg-primary-700"
                                                    title="Crea e applica classe"
                                                >
                                                    <Icon name="heroicon-outline-plus" size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Style Manager */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Icon name="heroicon-outline-adjustments" size={16} />
                                            Style Manager
                                            <span className="text-xs font-normal text-gray-500">({styleTarget === 'inline' ? 'Inline' : styleTarget === 'class' ? 'Classe' : 'Hover'})</span>
                                        </h4>
                                        
                                        {styleTarget === 'class' && (!selectedElement.classes || selectedElement.classes.length === 0) && (
                                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200">
                                                Aggiungi una classe per modificare gli stili
                                            </div>
                                        )}
                                        
                                        {styleTarget === 'class' && selectedElement.classes && selectedElement.classes.length > 0 && (
                                            <select
                                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 mb-3"
                                                defaultValue={selectedElement.classes[0]}
                                            >
                                                {selectedElement.classes.map(cls => (
                                                    <option key={cls} value={cls}>.{cls}</option>
                                                ))}
                                            </select>
                                        )}
                                        
                                        {/* Typography Styles */}
                                        {styleTarget === 'inline' && selectedElement.type === 'text' && (
                                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-3">
                                                <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Tipografia</h5>
                                                
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Dimensione</label>
                                                        <input
                                                            type="text"
                                                            value={selectedElement.styles?.fontSize || '16px'}
                                                            onChange={(e) => updateElement(selectedElement.id, {
                                                                styles: { ...selectedElement.styles, fontSize: e.target.value }
                                                            })}
                                                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                                                            placeholder="16px"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Peso</label>
                                                        <select
                                                            value={selectedElement.styles?.fontWeight || '400'}
                                                            onChange={(e) => updateElement(selectedElement.id, {
                                                                styles: { ...selectedElement.styles, fontWeight: e.target.value }
                                                            })}
                                                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                                                        >
                                                            <option value="300">Light</option>
                                                            <option value="400">Normal</option>
                                                            <option value="500">Medium</option>
                                                            <option value="600">Semibold</option>
                                                            <option value="700">Bold</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Colore testo</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="color"
                                                            value={selectedElement.styles?.color || '#000000'}
                                                            onChange={(e) => updateElement(selectedElement.id, {
                                                                styles: { ...selectedElement.styles, color: e.target.value }
                                                            })}
                                                            className="w-10 h-8 rounded border border-gray-300 dark:border-gray-600"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={selectedElement.styles?.color || '#000000'}
                                                            onChange={(e) => updateElement(selectedElement.id, {
                                                                styles: { ...selectedElement.styles, color: e.target.value }
                                                            })}
                                                            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 font-mono"
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Allineamento</label>
                                                    <div className="grid grid-cols-3 gap-1">
                                                        {['left', 'center', 'right'].map(align => (
                                                            <button
                                                                key={align}
                                                                onClick={() => updateElement(selectedElement.id, {
                                                                    styles: { ...selectedElement.styles, textAlign: align }
                                                                })}
                                                                className={`px-2 py-1 text-xs rounded border ${
                                                                    selectedElement.styles?.textAlign === align
                                                                        ? 'bg-primary-600 text-white border-primary-600'
                                                                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                                                                }`}
                                                            >
                                                                {align === 'left' ? '←' : align === 'center' ? '↔' : '→'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Background & Effects */}
                                        {styleTarget === 'inline' && (
                                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-3">
                                                <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Sfondo & Effetti</h5>
                                                
                                                <div>
                                                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Colore sfondo</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="color"
                                                            value={selectedElement.styles?.backgroundColor || '#ffffff'}
                                                            onChange={(e) => updateElement(selectedElement.id, {
                                                                styles: { ...selectedElement.styles, backgroundColor: e.target.value }
                                                            })}
                                                            className="w-10 h-8 rounded border border-gray-300 dark:border-gray-600"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={selectedElement.styles?.backgroundColor || 'transparent'}
                                                            onChange={(e) => updateElement(selectedElement.id, {
                                                                styles: { ...selectedElement.styles, backgroundColor: e.target.value }
                                                            })}
                                                            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 font-mono"
                                                            placeholder="transparent"
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Opacità</label>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="1"
                                                        step="0.1"
                                                        value={selectedElement.styles?.opacity || 1}
                                                        onChange={(e) => updateElement(selectedElement.id, {
                                                            styles: { ...selectedElement.styles, opacity: parseFloat(e.target.value) }
                                                        })}
                                                        className="w-full"
                                                    />
                                                    <div className="text-xs text-center text-gray-500">{Math.round((selectedElement.styles?.opacity || 1) * 100)}%</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Trait Manager */}
                                    {selectedElement.type === 'html-block' && selectedElement.templateName && (() => {
                                        const template = ALL_BLOCKS.find(t => t.name === selectedElement.templateName);
                                        const traits = getTraitsForTemplate(template);
                                        const elementTraits = traitValues[selectedElement.id] || {};
                                        
                                        return Object.keys(traits).length > 0 ? (
                                            <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                    <Icon name="heroicon-outline-cog" size={16} />
                                                    Configurazione Componente
                                                </h4>
                                                
                                                {/* Group traits by section */}
                                                {(() => {
                                                    const grouped = {};
                                                    Object.entries(traits).forEach(([key, trait]) => {
                                                        const section = trait.section || 'Generale';
                                                        if (!grouped[section]) grouped[section] = [];
                                                        grouped[section].push([key, trait]);
                                                    });
                                                    
                                                    return Object.entries(grouped).map(([section, items]) => (
                                                        <div key={section} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                                            <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase">{section}</h5>
                                                            <div className="space-y-3">
                                                                {items.map(([key, trait]) => (
                                                                    <div key={key}>
                                                                        <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">{trait.label}</label>
                                                                        
                                                                        {/* Text Input */}
                                                                        {trait.type === 'text' && (
                                                                            <input
                                                                                type="text"
                                                                                value={elementTraits[key] !== undefined ? elementTraits[key] : (trait.default || '')}
                                                                                onChange={(e) => {
                                                                                    setTraitValues({
                                                                                        ...traitValues,
                                                                                        [selectedElement.id]: {
                                                                                            ...elementTraits,
                                                                                            [key]: e.target.value
                                                                                        }
                                                                                    });
                                                                                }}
                                                                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                                                                            />
                                                                        )}
                                                                        
                                                                        {/* Textarea */}
                                                                        {trait.type === 'textarea' && (
                                                                            <textarea
                                                                                value={elementTraits[key] !== undefined ? elementTraits[key] : (trait.default || '')}
                                                                                onChange={(e) => {
                                                                                    setTraitValues({
                                                                                        ...traitValues,
                                                                                        [selectedElement.id]: {
                                                                                            ...elementTraits,
                                                                                            [key]: e.target.value
                                                                                        }
                                                                                    });
                                                                                }}
                                                                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 resize-none h-20"
                                                                            />
                                                                        )}
                                                                        
                                                                        {/* Color Input */}
                                                                        {trait.type === 'color' && (
                                                                            <div className="flex gap-2">
                                                                                <input
                                                                                    type="color"
                                                                                    value={elementTraits[key] !== undefined ? elementTraits[key] : (trait.default || '#000000')}
                                                                                    onChange={(e) => {
                                                                                        setTraitValues({
                                                                                            ...traitValues,
                                                                                            [selectedElement.id]: {
                                                                                                ...elementTraits,
                                                                                                [key]: e.target.value
                                                                                            }
                                                                                        });
                                                                                    }}
                                                                                    className="w-10 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                                                                                />
                                                                                <input
                                                                                    type="text"
                                                                                    value={elementTraits[key] !== undefined ? elementTraits[key] : (trait.default || '#000000')}
                                                                                    onChange={(e) => {
                                                                                        setTraitValues({
                                                                                            ...traitValues,
                                                                                            [selectedElement.id]: {
                                                                                                ...elementTraits,
                                                                                                [key]: e.target.value
                                                                                            }
                                                                                        });
                                                                                    }}
                                                                                    className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 font-mono"
                                                                                />
                                                                            </div>
                                                                        )}
                                                                        
                                                                        {/* Select Input */}
                                                                        {trait.type === 'select' && (
                                                                            <select
                                                                                value={elementTraits[key] !== undefined ? elementTraits[key] : (trait.default || '')}
                                                                                onChange={(e) => {
                                                                                    setTraitValues({
                                                                                        ...traitValues,
                                                                                        [selectedElement.id]: {
                                                                                            ...elementTraits,
                                                                                            [key]: e.target.value
                                                                                        }
                                                                                    });
                                                                                }}
                                                                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                                                                            >
                                                                                {trait.options?.map(opt => (
                                                                                    <option key={opt} value={opt}>{opt}</option>
                                                                                ))}
                                                                            </select>
                                                                        )}
                                                                        
                                                                        {/* Checkbox */}
                                                                        {trait.type === 'checkbox' && (
                                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={elementTraits[key] !== undefined ? elementTraits[key] : (trait.default || false)}
                                                                                    onChange={(e) => {
                                                                                        setTraitValues({
                                                                                            ...traitValues,
                                                                                            [selectedElement.id]: {
                                                                                                ...elementTraits,
                                                                                                [key]: e.target.checked
                                                                                            }
                                                                                        });
                                                                                    }}
                                                                                    className="rounded"
                                                                                />
                                                                                <span className="text-xs text-gray-600 dark:text-gray-400">{trait.label}</span>
                                                                            </label>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        ) : null;
                                    })()}
                                    
                                    {/* Position & Size */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Posizione & Dimensioni</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">X</label>
                                                <input
                                                    type="number"
                                                    value={Math.round(selectedElement.x)}
                                                    onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) })}
                                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Y</label>
                                                <input
                                                    type="number"
                                                    value={Math.round(selectedElement.y)}
                                                    onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) })}
                                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Larghezza</label>
                                                <input
                                                    type="number"
                                                    value={Math.round(selectedElement.width)}
                                                    onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) })}
                                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Altezza</label>
                                                <input
                                                    type="number"
                                                    value={Math.round(selectedElement.height)}
                                                    onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) })}
                                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Content */}
                                    {selectedElement.type === 'text' && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Contenuto</h3>
                                            <textarea
                                                value={selectedElement.content}
                                                onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                                                className="w-full h-32 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm resize-none"
                                            />
                                        </div>
                                    )}
                                    
                                    {/* Style Properties */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Stile</h3>
                                        {selectedElement.type === 'text' && (
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Dimensione Font</label>
                                                    <select
                                                        value={selectedElement.styles.fontSize || '16px'}
                                                        onChange={(e) => updateElement(selectedElement.id, { 
                                                            styles: { ...selectedElement.styles, fontSize: e.target.value }
                                                        })}
                                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm"
                                                    >
                                                        <option value="12px">12px</option>
                                                        <option value="14px">14px</option>
                                                        <option value="16px">16px</option>
                                                        <option value="18px">18px</option>
                                                        <option value="20px">20px</option>
                                                        <option value="24px">24px</option>
                                                        <option value="32px">32px</option>
                                                    </select>
                                                </div>
                                                
                                                <div>
                                                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Colore Testo</label>
                                                    <input
                                                        type="color"
                                                        value={selectedElement.styles.color || (darkMode ? '#ffffff' : '#000000')}
                                                        onChange={(e) => updateElement(selectedElement.id, { 
                                                            styles: { ...selectedElement.styles, color: e.target.value }
                                                        })}
                                                        className="w-full h-10 rounded cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Actions */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Azioni</h3>
                                        <div className="space-y-2">
                                            <button
                                                onClick={() => setEditingElement(selectedElement.id)}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400 hover:bg-success-100 dark:hover:bg-success-900/30 rounded-lg transition-colors"
                                            >
                                                <span>✏️</span>
                                                <span>Modifica Contenuto (Ctrl+E)</span>
                                            </button>
                                            
                                            <button
                                                onClick={() => duplicateElement()}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                            >
                                                <Icon name="heroicon-outline-duplicate" size={16} />
                                                <span>Duplica (Ctrl+D)</span>
                                            </button>
                                            
                                            <button
                                                onClick={() => deleteElement()}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                            >
                                                <Icon name="heroicon-outline-trash" size={16} />
                                                <span>Elimina (Delete)</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        )}
                    </div>
                    
                    {/* Status Bar */}
                    <footer className="h-8 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 text-xs">
                        <div className="flex items-center gap-4">
                            <span className="text-gray-600 dark:text-gray-400">
                                Elementi: <span className="font-medium">{elements.length}</span>
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                                Selezionato: <span className="font-medium">{selectedElement ? selectedElement.type : 'Nessuno'}</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-600 dark:text-gray-400">
                                Vista: <span className="font-medium">{viewportDimensions.label}</span>
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                                Zoom: <span className="font-medium">{zoom}%</span>
                            </span>
                        </div>
                    </footer>
                </div>
            );
        }

        // Render the app
        ReactDOM.createRoot(document.getElementById('root')).render(<PageBuilder />);
        @endverbatim
    </script>
</body>
</html>